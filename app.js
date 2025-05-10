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

const renderGrafico = (resumenMensual) => {
    const ctx = document.getElementById('graficoResenas').getContext('2d');

    // Obtenemos las claves de los meses y las ordenamos
    const mesesOrdenados = [
        "2024-01-01", "2024-02-01", "2024-03-01", "2024-04-01", "2024-05-01", 
        "2024-06-01", "2024-07-01", "2024-08-01", "2024-09-01", "2024-10-01", 
        "2024-11-01", "2024-12-01"
    ];

    // Creamos un array de etiquetas para los meses (en español)
    const etiquetasMeses = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];

    // Creamos el array de medias para cada mes
    const medias = mesesOrdenados.map(mes => {
        const valores = resumenMensual[mes]; // Accedemos a los valores para ese mes

        // Si no hay reseñas para ese mes, lo consideramos 0
        if (!valores) {
            return 0;
        }

        // Obtenemos los valores de cada tipo de sentimiento
        const positivas = valores.positivas || 0;
        const mixtas = valores.mixtas || 0;
        const negativas = valores.negativas || 0;
        const totalReseñas = valores.totalReseñas || 1; // Aseguramos que no divida por 0

        // Calculamos la media para ese mes:
        const porcentajePositivas = (positivas / totalReseñas) * 1; // 1 para positivas
        const porcentajeMixtas = (mixtas / totalReseñas) * 0.5; // 0.5 para mixtas
        const porcentajeNegativas = (negativas / totalReseñas) * 0; // 0 para negativas

        // Media final sumando las puntuaciones
        return porcentajePositivas + porcentajeMixtas + porcentajeNegativas;
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
