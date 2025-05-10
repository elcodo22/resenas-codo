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
            // Calcular la media de la reseña positiva, tomando el promedio de la reseña positiva y negativa
            const media = (datosMes.PromedioPositiva + datosMes.PromedioNegativa) / 2;
            // Agregar la media al array de datos
            datosSentimiento.push(media);
        } else {
            // Si no hay reseñas, asignar el valor "Mixed" con valor 0.5
            datosSentimiento.push(0.5);
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
                    min: 0, // Empieza en 0
                    max: 1, // Termina en 1
                    stepSize: 0.1, // Intervalo de 0.1 para los valores
                    ticks: {
                        callback: function(value) {
                            if (value === 0) return 'Mala';
                            if (value === 0.5) return 'Mixta';
                            if (value === 1) return 'Buena';
                            return ''; // Para valores entre 0 y 1, no mostramos etiquetas adicionales
                        }
                    },
                    title: {
                        display: false // No mostramos título en el eje Y
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.raw;
                            if (value === 0.5) return "Mixta";
                            if (value < 0.5) return "Mala";
                            return "Buena";
                        }
                    }
                }
            }
        }
    });
};
