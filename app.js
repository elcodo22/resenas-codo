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
const cargarResumenDesdeDynamo = async () => {
    try {
        const response = await fetch('http://35.177.116.70:3000/leer-dynamo');
        const result = await response.json();

        if (result.resumen_mensual) {
            console.log("Resumen mensual recibido desde DynamoDB:", result.resumen_mensual);

            // Procesar los datos para calcular los promedios ponderados
            const resumenMensual = result.resumen_mensual;

            // Asegurémonos de que los meses estén ordenados de enero a diciembre
            const mesesOrdenados = [
                "2024-01", "2024-02", "2024-03", "2024-04", "2024-05", 
                "2024-06", "2024-07", "2024-08", "2024-09", "2024-10", 
                "2024-11", "2024-12"
            ];

            const datosPromedioMensual = mesesOrdenados.map(mes => {
                const valores = resumenMensual[mes];

                // Si no hay datos para el mes, asignar valor 0
                if (!valores || valores.totalReseñas === 0) return 0;

                // Calcular el promedio ponderado
                const puntuacionPositivas = valores.positivas * 1;  // Positivas = 1
                const puntuacionMixtas = valores.mixtas * 0.5;     // Mixtas = 0.5
                const puntuacionNegativas = valores.negativas * 0;  // Negativas = 0

                // Promedio ponderado
                const totalPonderado = puntuacionPositivas + puntuacionMixtas + puntuacionNegativas;
                return totalPonderado / valores.totalReseñas;
            });

            // Meses para el eje X
            const meses = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];

            // Crear gráfico usando Chart.js
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
                                // Personalizar etiquetas de Y
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

        } else {
            console.warn("No se encontró resumen_mensual en la respuesta.");
            console.log("Respuesta completa:", result);
        }

    } catch (error) {
        console.error('Error al recuperar los datos desde DynamoDB:', error);
    }
};
