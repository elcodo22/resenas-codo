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
        console.log(result); // Para ver los datos en la consola

        if (response.ok) {
            displayGraph(result.resumen_mensual);
        } else {
            alert(result.mensaje);
        }
    } catch (error) {
        alert('Error al subir el archivo');
    }
};

const displayGraph = (resumen) => {
    const meses = Object.keys(resumen);
    const positiva = [];
    const neutral = [];
    const negativa = [];

    // Recopilamos los promedios por mes
    meses.forEach(mes => {
        positiva.push(resumen[mes].PromedioPositiva || 0);
        neutral.push(resumen[mes].PromedioNeutral || 0);
        negativa.push(resumen[mes].PromedioNegativa || 0);
    });

    // Configuración del gráfico de barras verticales
    const ctx = document.getElementById('sentimentChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: meses,  // Meses en el eje X
            datasets: [
                {
                    label: 'Positiva',
                    data: positiva,
                    backgroundColor: 'green',
                    borderColor: 'green',
                    borderWidth: 1
                },
                {
                    label: 'Neutral',
                    data: neutral,
                    backgroundColor: 'gray',
                    borderColor: 'gray',
                    borderWidth: 1
                },
                {
                    label: 'Negativa',
                    data: negativa,
                    backgroundColor: 'red',
                    borderColor: 'red',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Sentimiento'  // Título para el eje Y
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Meses'  // Título para el eje X
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    callbacks: {
                        label: function(tooltipItem) {
                            // Muestra la puntuación con 2 decimales en el tooltip
                            return `${tooltipItem.dataset.label}: ${tooltipItem.raw.toFixed(2)}`;
                        }
                    }
                }
            }
        }
    });
};
