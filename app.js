// Variables globales
let resumenDatos = {}; // Aquí se guardarán los datos de las reseñas por año

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

        cargarResumenDesdeDynamo(); // Refrescar gráfico

    } catch (error) {
        console.error('Error al subir el archivo:', error);
        alert('Error al subir el archivo.');
    }
};

// Cargar datos desde DynamoDB
const cargarResumenDesdeDynamo = async () => {
    try {
        const response = await fetch('http://35.177.116.70:3000/leer-dynamo');
        const result = await response.json();

        if (result && result.resumen_mensual) {
            resumenDatos = result.resumen_mensual;

            // Obtener años disponibles
            const años = Object.keys(resumenDatos).map(f => f.substring(0, 4));
            const añosUnicos = [...new Set(años)].sort();
            const añoMasReciente = añosUnicos[añosUnicos.length - 1];

            // Mostrar gráfico automáticamente para el año más reciente
            mostrarGrafico(añoMasReciente);

        } else {
            console.warn("No se encontró resumen en la respuesta.");
            alert("No se encontraron datos.");
        }
    } catch (error) {
        console.error('Error al recuperar los datos desde DynamoDB:', error);
    }
};

// Procesar datos para el gráfico
const procesarDatos = (data, añoSeleccionado) => {
    const resumenMensual = {};

    for (const fecha in data) {
        if (fecha.startsWith(añoSeleccionado)) {
            const mes = fecha.substring(5, 7);
            const valores = data[fecha];

            if (!resumenMensual[mes]) {
                resumenMensual[mes] = { positivas: 0, negativas: 0, mixtas: 0, totalReseñas: 0 };
            }

            resumenMensual[mes].positivas += valores.positivas;
            resumenMensual[mes].negativas += valores.negativas;
            resumenMensual[mes].mixtas += valores.mixtas;
            resumenMensual[mes].totalReseñas += valores.totalReseñas;
        }
    }

    const meses = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
    return meses.map(mes => {
        const v = resumenMensual[mes] || { positivas: 0, mixtas: 0, negativas: 0, totalReseñas: 0 };
        if (v.totalReseñas === 0) return 0;
        return (v.positivas + v.mixtas * 0.5) / v.totalReseñas;
    });
};

// Mostrar gráfico con Chart.js
const mostrarGrafico = (añoSeleccionado) => {
    const ctx = document.getElementById('graficoResenas').getContext('2d');

    if (window.chartInstance) {
        window.chartInstance.destroy();
    }

    const datos = procesarDatos(resumenDatos, añoSeleccionado);

    window.chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"],
            datasets: [{
                label: `Promedio de Reseñas en ${añoSeleccionado}`,
                data: datos,
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    min: 0,
                    max: 1,
                    ticks: {
                        stepSize: 0.25,
                        callback: value => ({
                            0: 'Muy Negativas',
                            0.25: 'Negativas',
                            0.5: 'Medias',
                            0.75: 'Positivas',
                            1: 'Muy Positivas'
                        }[value] || '')
                    },
                    title: {
                        display: true,
                        text: 'Calidad de las reseñas'
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: tooltipItem => `Valor Promedio: ${tooltipItem.raw.toFixed(2)}`
                    }
                }
            }
        }
    });
};

// Ejecutar al cargar la página
window.onload = cargarResumenDesdeDynamo;
