let resumenMensualGlobal = {};
let añosDisponibles = [];

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

        console.log("Respuesta del backend:", result);

        if (result.resumen_mensual) {
            procesarResumenMensual(result.resumen_mensual);
        } else {
            console.error("Formato inesperado:", result);
            alert('Error: los datos recibidos no son válidos.');
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
};

const procesarResumenMensual = (resumenMensual) => {
    resumenMensualGlobal = resumenMensual;
    añosDisponibles = [...new Set(Object.keys(resumenMensual).map(m => m.split('-')[0]))];
    fillYearSelector();
    displayGraph(resumenMensual, añosDisponibles[0]);
};

const fillYearSelector = () => {
    const yearSelector = document.getElementById('yearSelector');
    yearSelector.innerHTML = ''; // Limpiar opciones

    añosDisponibles.forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearSelector.appendChild(option);
    });
};

const cambiarAno = () => {
    const selectedYear = document.getElementById('yearSelector').value;
    displayGraph(resumenMensualGlobal, selectedYear);
};

// Función para asignar los valores "Mala", "Media", "Buena" dependiendo del valor
const getSentimentLevel = (average) => {
    if (average === null) return "Mixed";
    if (average >= 0.66) return "Buena";
    if (average >= 0.33) return "Media";
    return "Mala";
};

const displayGraph = (resumen, year) => {
    const meses = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];

    const datosSentimiento = [];
    const etiquetas = [];

    // Recorrer los meses para calcular los datos del gráfico
    for (let i = 0; i < 12; i++) {
        const mesClave = `${year}-${String(i + 1).padStart(2, '0')}`;
        const datosMes = resumen[mesClave];

        if (datosMes && datosMes.total > 0) {
            // Calcular la media de la reseña positiva
            const media = datosMes.PromedioPositiva; // Puedes usar el promedio entre positiva y negativa si prefieres
            // Convertir la media al nivel cualitativo
            datosSentimiento.push(media);
        } else {
            // Si no hay datos para el mes, asignamos "Mixed"
            datosSentimiento.push(null);
        }

        etiquetas.push(meses[i]);
    }

    // Si hay un gráfico previamente cargado, lo destruimos
    if (window.sentimentChart instanceof Chart) {
        window.sentimentChart.destroy();
    }

    const ctx = document.getElementById('sentimentChart').getContext('2d');
    window.sentimentChart = new Chart(ctx, {
        type: 'line', // Cambiar tipo de gráfico a línea
        data: {
            labels: etiquetas,
            datasets: [{
                label: 'Sentimiento Promedio',
                data: datosSentimiento,
                borderColor: 'rgba(75, 192, 192, 1)', // Línea de color
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                fill: true,
                tension: 0.4,
                pointRadius: 6,
                pointHoverRadius: 8,
                pointStyle: 'circle'
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    min: 0,
                    max: 2,
                    stepSize: 1,
                    ticks: {
                        callback: function(value) {
                            const levels = ["Mala", "Media", "Buena"];
                            return levels[value] || "Mixed"; // Usamos los niveles de sentimiento
                        }
                    },
                    title: {
                        display: true,
                        text: 'Nivel de Sentimiento'
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.raw;
                            return value === null ? "Mixed" : getSentimentLevel(value);
                        }
                    }
                }
            }
        }
    });
};
