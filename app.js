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
        console.log(result); // <-- Agrega esto

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
    const negativa = [];

    meses.forEach(mes => {
        positiva.push(resumen[mes].PromedioPositiva || 0);
        negativa.push(resumen[mes].PromedioNegativa || 0);
    });

    const ctx = document.getElementById('sentimentChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: meses,
            datasets: [
                {
                    label: 'Positiva',
                    data: positiva,
                    backgroundColor: 'green'
                },
                {
                    label: 'Negativa',
                    data: negativa,
                    backgroundColor: 'red'
                }
            ]
        },
        options: {
            indexAxis: 'y', // muestra los meses en el eje Y
            scales: {
                x: {
                    beginAtZero: true,
                    max: 1 // las puntuaciones son entre 0 y 1
                }
            }
        }
    });
};
