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
    const meses = Object.keys(resumen); // ['Enero', 'Febrero', ...]
    const categorias = ['MuyPositiva', 'Media', 'Negativa'];

    // Para cada categoría, obtenemos los valores en cada mes
    const datasets = categorias.map((categoria, index) => {
        const colores = ['green', 'orange', 'red'];
        return {
            label: categoria,
            data: meses.map(mes => resumen[mes][categoria]),
            backgroundColor: colores[index],
        };
    });

    const ctx = document.getElementById('sentimentChart').getContext('2d');

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: meses, // Meses en el eje Y
            datasets: datasets // Categorías en eje X
        },
        options: {
            indexAxis: 'y', // Hace que las barras sean horizontales
            responsive: true,
            scales: {
                x: {
                    beginAtZero: true
                }
            }
        }
    });
};
