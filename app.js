// Variables globales
let resumenDatos = {}; // Aquí se guardarán los datos de las reseñas por año
let añosDisponibles = []; // Aquí se guardarán los años disponibles

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

        // Recargar los datos después de subir el CSV
        cargarResumenDesdeDynamo();
        
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

        if (result && result.resumen_mensual) {
            console.log("Datos recibidos desde DynamoDB:", result.resumen_mensual);
            resumenDatos = result.resumen_mensual;

            // Extraer años disponibles
            añosDisponibles = Object.keys(resumenDatos).map(fecha => fecha.substring(0, 4));
            añosDisponibles = [...new Set(añosDisponibles)]; // Eliminar duplicados

            // Llenar el selector de años con las opciones
            const yearSelect = document.getElementById('yearSelect');
            añosDisponibles.forEach(año => {
                const option = document.createElement('option');
                option.value = año;
                option.textContent = año;
                yearSelect.appendChild(option);
            });

            // Habilitar el selector de años
            yearSelect.disabled = false;

            // Mostrar el gráfico con el primer año disponible
            if (añosDisponibles.length > 0) {
                mostrarGrafico(añosDisponibles[0]);
            }
        } else {
            console.warn("No se encontró resumen en la respuesta.");
            alert("No se encontraron datos.");
        }
    } catch (error) {
        console.error('Error al recuperar los datos desde DynamoDB:', error);
    }
};

// Función para procesar los datos y crear el gráfico
const procesarDatos = (data, añoSeleccionado) => {
    const resumenMensual = {};

    // Filtrar los datos por el año seleccionado
    for (const fechaCompleta in data) {
        if (fechaCompleta.startsWith(añoSeleccionado)) {
            const valores = data[fechaCompleta];
            const mes = fechaCompleta.substring(5, 7); // Extrae el mes

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
    }

    // Crear el arreglo de promedios para los 12 meses
    const mesesOrdenados = [
        "01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"
    ];

    const datosPromedioMensual = mesesOrdenados.map(mes => {
        const valores = resumenMensual[mes] || { positivas: 0, negativas: 0, mixtas: 0, totalReseñas: 0 };

        if (valores.totalReseñas === 0) return 0;

        const puntuacion = (
            valores.positivas * 1 +
            valores.mixtas * 0.5 +
            valores.negativas * 0
        );

        return puntuacion / valores.totalReseñas;
    });

    return datosPromedioMensual;
};

// Función para crear el gráfico con los datos procesados
// Función para crear el gráfico con los datos procesados
const mostrarGrafico = (añoSeleccionado) => {
    // Verificar si ya existe un gráfico en el canvas
    const ctx = document.getElementById('graficoResenas').getContext('2d');
    
    // Si hay un gráfico previo, lo destruimos
    if (window.chartInstance) {
        window.chartInstance.destroy();
    }

    // Procesamos los datos para obtener los promedios mensuales
    const datosPromedioMensual = procesarDatos(resumenDatos, añoSeleccionado);

    // Verificar los datos procesados antes de graficar
    console.log("Datos procesados para el gráfico:", datosPromedioMensual);

    // Crear el gráfico usando Chart.js
    window.chartInstance = new Chart(ctx, {
        type: 'line', // Tipo de gráfico lineal
        data: {
            labels: ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"], // Meses del año
            datasets: [{
                label: `Promedio de Reseñas en ${añoSeleccionado}`,
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
                    min: 0,
                    max: 1, // Máximo valor del eje Y
                    ticks: {
                        stepSize: 0.25, // Paso de los valores en el eje Y
                        callback: function(value) {
                            const etiquetas = {
                                0: 'Muy Negativas',
                                0.25: 'Negativas',
                                0.5: 'Medias',
                                0.75: 'Positivas',
                                1: 'Muy Positivas'
                            };
                            return etiquetas[value] || '';
                        }
                    },
                    title: {
                        display: true,
                        text: 'Calidad de las reseñas' // Título del eje Y
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

// Función que se ejecuta cuando el usuario cambia el año
const onYearChange = () => {
    const yearSelect = document.getElementById('yearSelect');
    const selectedYear = yearSelect.value;

    // Mostrar gráfico para el año seleccionado
    mostrarGrafico(selectedYear);
};

// Cargar los datos al inicio
window.onload = cargarResumenDesdeDynamo;
