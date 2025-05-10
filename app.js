// Función para subir el archivo CSV al backend
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

// Función para cargar los datos desde DynamoDB y generar la gráfica
const cargarResumenDesdeDynamo = async () => {
    try {
        const response = await fetch('http://35.177.116.70:3000/leer-dynamo');
        const result = await response.json();

        if (result.resumen_mensual) {
            console.log("Resumen mensual recibido desde DynamoDB:", result.resumen_mensual);
            renderGrafico(result.resumen_mensual);
        } else {
            console.warn("No se encontró resumen_mensual en la respuesta.");
            console.log("Respuesta completa:", result);
        }

    } catch (error) {
        console.error('Error al recuperar los datos desde DynamoDB:', error);
    }
};

// Función para renderizar la gráfica usando Chart.js
// Función para renderizar la gráfica usando Chart.js
const renderGrafico = (resumenMensual) => {
    const ctx = document.getElementById('graficoResenas').getContext('2d');

    // Convertimos el objeto resumenMensual en un array de pares [mes, datos]
    const meses = Object.keys(resumenMensual); // Esto obtiene todas las claves (meses)
    const medias = meses.map(mes => {
        const valores = resumenMensual[mes]; // Accedemos a los valores para ese mes
        return valores.media; // Obtenemos la media para el mes
    });

    // Creamos el gráfico
    new Chart(ctx, {
        type: 'bar', // Tipo de gráfico (barras)
        data: {
            labels: meses, // Meses como etiquetas
            datasets: [{
                label: 'Reseñas por mes (media)',
                data: medias, // Datos de las medias
                backgroundColor: 'rgba(54, 162, 235, 0.2)', // Color de fondo de las barras
                borderColor: 'rgba(54, 162, 235, 1)', // Color del borde de las barras
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 0.25, // Ajustamos el paso en el eje Y para que sea 0.25
                        max: 1, // El valor máximo en el eje Y será 1 (máxima puntuación)
                    },
                    title: {
                        display: true,
                        text: 'Sentimiento de las Reseñas'
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(tooltipItem) {
                            // Mostrar solo el valor, sin el número
                            return `Valor: ${tooltipItem.raw.toFixed(2)}`;
                        }
                    }
                }
            }
        }
    });
};
