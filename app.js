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
    const mesesOrdenados = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    const meses = mesesOrdenados.filter(mes => resumen[mes]);

    const dataMuyPositiva = meses.map(mes => resumen[mes].MuyPositiva);
    const dataMedia = meses.map(mes => resumen[mes].Media);
    const dataNegativa = meses.map(mes => resumen[mes].Negativa);

    const ctx = document.getElementById('sentimentChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: meses,
            datasets: [
                {
                    label: 'Muy Positiva',
                    data: dataMuyPositiva,
                    backgroundColor: 'green'
                },
                {
                    label: 'Media',
                    data: dataMedia,
                    backgroundColor: 'orange'
                },
                {
                    label: 'Negativa',
                    data: dataNegativa,
                    backgroundColor: 'red'
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'top' },
                title: { display: true, text: 'Sentimiento por Mes' }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 1
                }
            }
        }
    });
    
    
};
