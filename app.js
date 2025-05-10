let resumenMensualGlobal = {};  // Guardar el resumen agrupado por mes
let añosDisponibles = [];       // Lista de años únicos disponibles

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

        if (Array.isArray(result)) {
            procesarDatos(result);
        } else {
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
        const sentimiento = entry.sentimiento.toUpperCase();

        if (!resumenMensualGlobal[key]) {
            resumenMensualGlobal[key] = {
                POSITIVE: 0,
                NEGATIVE: 0,
                MIXED: 0,
                total: 0
            };
        }

        if (["POSITIVE", "NEGATIVE", "MIXED"].includes(sentimiento)) {
            resumenMensualGlobal[key][sentimiento]++;
            resumenMensualGlobal[key].total++;
        }
    });

    añosDisponibles = [...new Set(Object.keys(resumenMensualGlobal).map(m => m.split('-')[0]))];
    fillYearSelector();
    displayGraph(añosDisponibles[0]);
};

const fillYearSelector = () => {
    const yearSelector = document.getElementById('yearSelector');
    yearSelector.innerHTML = '';

    añosDisponibles.forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.text = year;
        yearSelector.appendChild(option);
    });
};

const handleYearChange = () => {
    const selectedYear = document.getElementById('yearSelector').value;
    displayGraph(selectedYear);
};

const displayGraph = (year) => {
    const meses = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];

    const positiveData = [];
    const negativeData = [];
    const mixedData = [];

    for (let i = 0; i < 12; i++) {
        const mesClave = `${year}-${String(i + 1).padStart(2, '0')}`;
        const datosMes = resumenMensualGlobal[mesClave];

        if (!datosMes) {
            positiveData.push(0);
            negativeData.push(0);
            mixedData.push(0);
        } else {
            const total = datosMes.total || 1; // evita división por cero
            positiveData.push(datosMes.POSITIVE / total);
            negativeData.push(datosMes.NEGATIVE / total);
            mixedData.push(datosMes.MIXED / total);
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
                    label: 'Positivas',
                    data: positiveData,
                    backgroundColor: 'green'
                },
                {
                    label: 'Negativas',
                    data: negativeData,
                    backgroundColor: 'red'
                },
                {
                    label: 'Mixtas',
                    data: mixedData,
                    backgroundColor: 'orange'
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 1,
                    ticks: {
                        callback: function (value) {
                            return (value * 100).toFixed(0) + '%';
                        }
                    },
                    title: {
                        display: true,
                        text: 'Porcentaje'
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: ctx => `${ctx.dataset.label}: ${(ctx.raw * 100).toFixed(1)}%`
                    }
                },
                legend: {
                    position: 'top'
                },
                title: {
                    display: true,
                    text: `Promedio de sentimientos por mes - ${year}`
                }
            }
        }
    });
};
