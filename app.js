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

        if (result.mensaje) {
            alert(result.mensaje); // Muestra confirmación de la subida
            if (result.resumen_mensual) {
                procesarResumenMensual(result.resumen_mensual);  // Procesamos el resumen mensual
            } else {
                console.error("No se recibieron los datos esperados.");
                alert('Error: los datos recibidos no son válidos.');
            }
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

    const sentimentScores = [];

    for (let i = 0; i < 12; i++) {
        const mesClave = `${year}-${String(i + 1).padStart(2, '0')}`;
        const datosMes = resumen[mesClave];

        if (datosMes && datosMes.reseñas) {
            let totalSentimiento = 0;
            let totalReseñas = datosMes.reseñas.length;

            // Calcular el sentimiento de cada reseña
            datosMes.reseñas.forEach(reseña => {
                const sentiment = reseña.sentimiento; // Se espera que cada reseña tenga un campo de sentimiento: "positiva", "negativa", o "mixta"
                if (sentiment === 'positiva') {
                    totalSentimiento += 1; // Añadir 1 por reseña positiva
                } else if (sentiment === 'negativa') {
                    totalSentimiento += 0; // Añadir 0 por reseña negativa
                } else if (sentiment === 'mixta') {
                    totalSentimiento += 0.5; // Añadir 0.5 por reseña mixta
                }
            });

            // Calcular el promedio del sentimiento del mes
            const promedioSentimiento = totalSentimiento / totalReseñas;
            sentimentScores.push(promedioSentimiento);
        } else {
            sentimentScores.push(0.5); // Si no hay reseñas, asignar el valor mixto (0.5)
        }
    }

    if (window.sentimentChart instanceof Chart) {
        window.sentimentChart.destroy();
    }

    const ctx = document.getElementById('sentimentChart').getContext('2d');
    window.sentimentChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: meses,
            datasets: [{
                label: 'Sentimiento Promedio',
                data: sentimentScores,
                borderColor: 'rgba(75, 192, 192, 1)',
                fill: false,
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    min: 0,
                    max: 1,
                    ticks: {
                        stepSize: 0.1,
                        callback: function(value) {
                            if (value === 1) return 'Buena';
                            if (value === 0) return 'Mala';
                            return 'Mixta';
                        }
                    },
                    title: {
                        display: true,
                        text: 'Sentimiento del Mes'
                    }
                }
            }
        }
    });
};
