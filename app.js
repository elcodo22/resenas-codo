let resumenDatos = {}; // Aquí se guardarán los datos de las reseñas por año

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
// Función para cargar los resúmenes mensuales desde DynamoDB
const cargarResumenDesdeDynamo = async () => {
    try {
        const response = await fetch('http://35.177.116.70:3000/leer-dynamo');
        
        if (!response.ok) {
            throw new Error('Error al obtener los datos. Estado: ' + response.status);
        }

        const result = await response.json();

        if (result && result.resumen_mensual) {
            console.log("Datos recibidos desde DynamoDB:", result.resumen_mensual);
            resumenDatos = result.resumen_mensual;
            
            // Extraer años disponibles
            const añosDisponibles = [...new Set(
                Object.keys(resumenDatos).map(fecha => fecha.substring(0, 4))
            )];
            
            // Actualizar selector de años
            const yearSelect = document.getElementById('yearSelect');
            if (yearSelect) {
                yearSelect.innerHTML = ''; // Limpiar opciones anteriores
                añosDisponibles.forEach(año => {
                    const option = document.createElement('option');
                    option.value = año;
                    option.textContent = año;
                    yearSelect.appendChild(option);
                });
                yearSelect.disabled = false;
                
                // Mostrar gráfico con el primer año disponible
                if (añosDisponibles.length > 0) {
                    mostrarGrafico(añosDisponibles[0]);
                }
            }
        } else {
            console.warn("No se encontró resumen en la respuesta.");
            alert("No se encontraron datos.");
        }

    } catch (error) {
        console.error('Error al recuperar los datos desde DynamoDB:', error);
        alert('Hubo un problema al intentar cargar los datos. Intenta más tarde.');
    }
};



// Función para agrupar los datos por mes y calcular el promedio ponderado
// Función para agrupar los datos por mes y calcular el promedio ponderado
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
let chartInstance = null;

const mostrarGrafico = (añoSeleccionado) => {
    const ctx = document.getElementById('graficoResenas');
    if (!ctx) {
        console.error('No se encontró el elemento canvas');
        return;
    }

    // Destruir gráfico anterior si existe
    if (chartInstance) {
        chartInstance.destroy();
    }

    // Procesar datos para el año seleccionado
    const datosProcesados = procesarDatos(resumenDatos, añoSeleccionado);
    
    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"],
            datasets: [{
                label: `Promedio de reseñas ${añoSeleccionado}`,
                data: datosProcesados,
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Promedio: ${context.raw.toFixed(2)}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    min: 0,
                    max: 1,
                    ticks: {
                        stepSize: 0.25,
                        callback: function(value) {
                            const etiquetas = {
                                0: 'Muy Negativas',
                                0.25: 'Negativas',
                                0.5: 'Neutrales',
                                0.75: 'Positivas',
                                1: 'Muy Positivas'
                            };
                            return etiquetas[value] || '';
                        }
                    }
                }
            }
        }
    });
};
