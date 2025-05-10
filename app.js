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

// Función para renderizar el gráfico
const renderGrafico = (resumenMensual) => {
    const ctx = document.getElementById('graficoResenas').getContext('2d');

    // Meses ordenados de enero a diciembre
    const mesesOrdenados = [
        "2024-01-01", "2024-02-01", "2024-03-01", "2024-04-01", "2024-05-01", 
        "2024-06-01", "2024-07-01", "2024-08-01", "2024-09-01", "2024-10-01", 
        "2024-11-01", "2024-12-01"
    ];

    // Creamos un array de etiquetas para los meses en español
    const etiquetasMeses = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];

    // Calculamos la media para cada mes
    const medias = mesesOrdenados.map(mes => {
        const valores = resumenMensual[mes]; // Obtenemos los valores de ese mes

        // Si no hay datos para ese mes, lo consideramos 0
        if (!valores) {
            return 0;
        }

        // Obtenemos el número de reseñas de cada tipo
        const positivas = valores.positivas || 0;
        const mixtas = valores.mixtas || 0;
        const negativas = valores.negativas || 0;

        // El total de reseñas es la suma de las reseñas positivas, mixtas y negativas en ese mes
        const totalReseñas = positivas + mixtas + negativas;

        // Si no hay reseñas, el total será 1 para evitar división por 0
        if (totalReseñas === 0) {
            return 0;
        }

        // Calculamos la puntuación ponderada de cada tipo de reseña
        const puntuacionPositivas = positivas * 1;   // 1 para positivas
        const puntuacionMixtas = mixtas * 0.5;       // 0.5 para mixtas
        const puntuacionNegativas = negativas * 0;    // 0 para negativas

        // Sumamos las puntuaciones ponderadas
        const totalPonderado = puntuacionPositivas + puntuacionMixtas + puntuacionNegativas;

        // Calculamos la media dividiendo por el total de reseñas
        const media = totalPonderado / totalReseñas;

        return media;
    });

    // Creamos el gráfico
    new Chart(ctx, {
        type: 'bar', // Tipo de gráfico (barras)
        data: {
            labels: etiquetasMeses, // Meses como etiquetas
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
