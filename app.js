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
        // Subir el archivo al backend
        const response = await fetch('http://35.177.116.70:3000/upload', {
            method: 'POST',
            body: formData,
        });

        const result = await response.json();
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
    const labels = Object.keys(resumen);
    const positiveData = labels.map(mes => resumen[mes].PromedioPositiva);
    const negativeData = labels.map(mes => resumen[mes].PromedioNegativa);

    const ctx = document.getElementById('sentimentChart').getContext('2d');
    const chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Sentimiento Positivo',
                data: positiveData,
                borderColor: 'green',
                fill: false,
            }, {
                label: 'Sentimiento Negativo',
                data: negativeData,
                borderColor: 'red',
                fill: false,
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
};
