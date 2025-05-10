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

        if (!response.ok) throw new Error('Error al subir el archivo');

        const result = await response.json();

        console.log("Respuesta del backend:", result);

        if (Array.isArray(result)) {
            procesarDatos(result);
        } else {
            console.error("Formato inesperado:", result);
            alert('Error: los datos recibidos no son válidos.');
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
};

const procesarDatos = (datos) => {
    resumenMensualGlobal = {};

    datos.forEach(entry => {
        const fecha = new Date(entry.fecha);
        const year = fecha.getFullYear();
        const month = String(fecha.getMonth() + 1).padStart(2, '0');
        const key = `${year}-${month}`;

        const puntuaciones = JSON.parse(entry.puntuaciones);

        const pos = parseFloat(puntuaciones.Positive.N);
        const neg = parseFloat(puntuaciones.Negative.N);
        const mix = parseFloat(puntuaciones.Mixed.N);

        if (!resumenMensualGlobal[key]) {
            resumenMensualGlobal[key] = {
                count: 0,
                sumPos: 0,
                sumNeg: 0,
                sumMix: 0
            };
        }

        resumenMensualGlobal[key].count += 1;
        resumenMensualGlobal[key].sumPos += pos;
        resumenMensualGlobal[key].sumNeg += neg;
        resumenMensualGlobal[key].sumMix += mix;
    });

    añosDisponibles = [...new Set(Object.keys(resumenMensualGlobal).map(m => m.split('-')[0]))];
    fillYearSelector();
    displayGraph(resumenMensualGlobal, añosDisponibles[0]);
};

const fillYearSelector = () => {
    const yearSelector = document.getElementById('yearSelector');
    yearSelector.innerHTML = '';

    const defaultOption = document.createElement('option');
    defaultOption.text = "Selecciona un año";
    yearSelector.appendChild(defaultOption);

    añosDisponibles.forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.text = year;
        yearSelector.appendChild(option);
    });
};

const handleYearChange = () => {
    const selectedYear = document.getElementById('yearSelector').value;
    if (selectedYear !== "Selecciona un año") {
        displayGraph(resumenMensualGlobal, selectedYear);
    }
};

const displayGraph = (resumen, year) => {
    const meses = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];

    const datosPositivos = [];
    const datosNegativos = [];
    const datosMixtos = [];

    for (let i = 0; i < 12; i++) {
        const mesClave = `${year}-${String(i + 1).padStart(2, '0')}`;
        const datosMes = resumen[mesClave];

        if (datosMes) {
            const total = datosMes.count;
            datosPositivos.push(datosMes.sumPos / total);
            datosNegativos.push(datosMes.sumNeg / total);
            datosMixtos.push(datosMes.sumMix / total);
        } else {
            datosPositivos.push(0);
            datosNegativos.push(0);
            datosMixtos.push(0);
        }
    }

    if (window.sentimentChart) {
        window.sentimentChart.destroy();
    }

    const ctx = document.getElementById('sentimentChart').getContext('2d');
    window.sentimentChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: meses,
            datasets: [
                {
                    label: 'Positivo',
                    data: datosPositivos,
                    backgroundColor: 'rgba(75, 192, 192, 0.7)'
                },
                {
                    label: 'Negativo',
                    data: datosNegativos,
                    backgroundColor: 'rgba(255, 99, 132, 0.7)'
                },
                {
                    label: 'Mixto',
                    data: datosMixtos,
                    backgroundColor: 'rgba(255, 206, 86, 0.7)'
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 1,
                    title: {
                        display: true,
                        text: 'Media del Sentimiento'
                    }
                }
            }
        }
    });
};
