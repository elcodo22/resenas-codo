// Función para subir el archivo CSV
const uploadFile = async () => {
    const fileInput = document.getElementById('csvFile');
    const file = fileInput.files[0];
    if (!file) {
        alert('Por favor, selecciona un archivo CSV');
        return;
    }

    const formData = new FormData();
    formData.append('csv', file);

    try {
        const response = await fetch('http://35.177.116.70:3000/upload', {
            method: 'POST',
            body: formData,
        });

        const result = await response.json();
        console.log("Respuesta del backend (subida):", result);

        if (result.mensaje) {
            alert(result.mensaje); // Confirmación
        }

    } catch (error) {
        console.error('Error al subir el archivo:', error);
        alert('Error al subir el archivo.');
    }
};

// Función para cargar los resúmenes mensuales desde DynamoDB
const cargarResumenDesdeDynamo = async () => {
    try {
        const response = await fetch('http://35.177.116.70:3000/leer-dynamo');
        const result = await response.json();

        if (result) {
            console.log("Datos recibidos desde DynamoDB:", result);
            mostrarGrafico(result); // Llamar a la función que genera el gráfico
        } else {
            console.warn("No se encontró resumen en la respuesta.");
            alert("No se encontraron datos.");
        }

    } catch (error) {
        console.error('Error al recuperar los datos desde DynamoDB:', error);
    }
};

// Función para agrupar los datos por mes y calcular el promedio ponderado
const procesarDatos = (data) => {
    // Agrupar las reseñas por mes (por ejemplo, '2024-01')
    const resumenMensual = {};

    for (const fecha in data) {
        const valores = data[fecha];
        const mes = fecha.slice(0, 7);  // Extraemos solo el año-mes (por ejemplo, '2024-01')

        if (!resumenMensual[mes]) {
            resumenMensual[mes] = {
                positivas: 0,
                negativas: 0,
                mixtas: 0,
                totalReseñas: 0
            };
        }

        resumenMensual[mes].positivas += valores.positivas;
        resumenMensual[mes].negativas += valores.negativas;
        resumenMensual[mes].mixtas += valores.mixtas;
        resumenMensual[mes].totalReseñas += valores.totalReseñas;
    }

    // Imprimir en consola para verificar si estamos agrupando correctamente
    console.log('Resumen mensual agrupado:', resumenMensual);

    // Calcular el promedio ponderado por mes
    const mesesOrdenados = [
        "2024-01", "2024-02", "2024-03", "2024-04", "2024-05", 
        "2024-06", "2024-07", "2024-08", "2024-09", "2024-10", 
        "2024-11", "2024-12"
    ];
    
    const procesarDatos = (data) => {
    const resumenMensual = {};

    for (const fechaCompleta in data) {
        const valores = data[fechaCompleta];
        const mes = fechaCompleta.substring(0, 7); // Extrae "2024-01" de "2024-01-02"

        if (!resumenMensual[mes]) {
            resumenMensual[mes] = {
                positivas: 0,
                negativas: 0,
                mixtas: 0,
                totalReseñas: 0
            };
        }

        resumenMensual[mes].positivas += valores.positivas;
        resumenMensual[mes].negativas += valores.negativas;
        resumenMensual[mes].mixtas += valores.mixtas;
        resumenMensual[mes].totalReseñas += valores.totalReseñas;
    }

    console.log('Resumen mensual agrupado correctamente:', resumenMensual);

    const mesesOrdenados = [
        "2024-01", "2024-02", "2024-03", "2024-04", "2024-05", 
        "2024-06", "2024-07", "2024-08", "2024-09", "2024-10", 
        "2024-11", "2024-12"
    ];

    const datosPromedioMensual = mesesOrdenados.map(mes => {
        const valores = resumenMensual[mes] || { positivas: 0, negativas: 0, mixtas: 0, totalReseñas: 0 };

        console.log(`Datos para el mes ${mes}:`, valores);

        if (valores.totalReseñas === 0) return 0;

        const puntuacion = (
            valores.positivas * 1 +
            valores.mixtas * 0.5 +
            valores.negativas * 0
        );

        const promedio = puntuacion / valores.totalReseñas;

        console.log(`Promedio para ${mes}: ${promedio}`);
        return promedio;
    });

    return datosPromedioMensual;
};


// Función para crear el gráfico con los datos procesados
const mostrarGrafico = (data) => {
    const meses = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];
    
    // Procesamos los datos para obtener los promedios mensuales
    const datosPromedioMensual = procesarDatos(data);

    // Verificar los datos procesados antes de graficar
    console.log("Datos procesados para el gráfico:", datosPromedioMensual);

    // Crear el gráfico usando Chart.js
    const ctx = document.getElementById('graficoResenas').getContext('2d');
    new Chart(ctx, {
        type: 'line', // Tipo de gráfico lineal
        data: {
            labels: meses, // Etiquetas del eje X (meses)
            datasets: [{
                label: 'Promedio de Reseñas por Mes',
                data: datosPromedioMensual, // Datos calculados
                borderColor: 'rgba(75, 192, 192, 1)', // Color de la línea
                backgroundColor: 'rgba(75, 192, 192, 0.2)', // Color del área bajo la línea
                fill: true, // Llenar el área bajo la línea
                tension: 0.4 // Suavizar la línea
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true, // Asegura que el gráfico comience desde 0
                    ticks: {
                        stepSize: 0.25, // Paso de los valores en el eje Y
                        max: 1, // Máximo valor del eje Y
                    },
                    title: {
                        display: true,
                        text: 'Sentimiento de las Reseñas' // Título del eje Y
                    },
                    labels: {
                        0: 'NEGATIVA',
                        0.5: 'MEDIA',
                        1: 'POSITIVO'
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(tooltipItem) {
                            return `Valor Promedio: ${tooltipItem.raw.toFixed(2)}`; // Mostrar el valor con 2 decimales
                        }
                    }
                }
            }
        }
    });
};
