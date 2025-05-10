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

        if (result && Array.isArray(result)) {
            procesarDatos(result);
        } else {
            alert('Error: los datos recibidos no son válidos.');
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
};

const procesarDatos = (datos) => {
    resumenMensualGlobal = {}; // Reiniciar

    datos.forEach(entry => {
        const fecha = new Date(entry.fecha);
        const year = fecha.getFullYear();
        const month = String(fecha.getMonth() + 1).padStart(2, '0');
        const key = `${year}-${month}`;

        const puntuaciones = JSON.parse(entry.puntuaciones);
        let clasificacion = 'Neutral'; // Default

        const pos = parseFloat(puntuaciones.Positive.N);
        const neg = parseFloat(puntuaciones.Negative.N);
        const mix = parseFloat(puntuaciones.Mixed.N);

        if (pos > 0.5) clasificacion = 'Buena';
        else if (neg > 0.5) clasificacion = 'Mala';
        else if (mix > 0.5) clasificacion = 'Mixta';

        if (!resumenMensualGlobal[key]) {
            resumenMensualGlobal[key] = {
                Buana: 0,
                Mala: 0,
                Mixta: 0,
                Neutral: 0
            };
        }

        resumenMensualGlobal[key][clasificacion]++;
    });

    // Extraer años únicos
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

    const clasificaciones = [];

    for (let i = 0; i < 12; i++) {
        const mesClave = `${year}-${String(i + 1).padStart(2, '0')}`;
        const datosMes = resumen[mesClave];

        if (!datosMes) {
            clasificaciones.push("Sin datos");
            continue;
        }

        // Determinar la clasificación dominante
        const conteos = {
            "Buena": datosMes.Buena || 0,
            "Mala": datosMes.Mala || 0,
            "Mixta": datosMes.Mixta || 0,
            "Neutral": datosMes.Neutral || 0
        };

        const clasificacion = Object.keys(conteos).reduce((a, b) => conteos[a] > conteos[b] ? a : b);
        clasificaciones.push(clasificacion);
    }

    const colores = {
        "Buena": "green",
        "Mixta": "orange",
        "Neutral": "yellow",
        "Mala": "red",
        "Sin datos": "gray"
    };

    const valoresNumericos = clasificaciones.map(cl => {
        if (cl === "Buena") return 1;
        if (cl === "Mixta") return 2;
        if (cl === "Neutral") return 3;
        if (cl === "Mala") return 4;
        return 5; // Sin datos
    });

    // Destruir gráfico anterior si existe
    if (window.sentimentChart) {
        window.sentimentChart.destroy();
    }

    const ctx = document.getElementById('sentimentChart').getContext('2d');
    window.sentimentChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: meses,
            datasets: [{
                label: 'Clasificación mensual',
                data: valoresNumericos,
                backgroundColor: clasificaciones.map(cl => colores[cl]),
                borderColor: 'black',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    max: 5,
                    ticks: {
                        stepSize: 1,
                        callback: function (value) {
                            switch (value) {
                                case 1: return 'Buena';
                                case 2: return 'Mixta';
                                case 3: return 'Neutral';
                                case 4: return 'Mala';
                                case 5: return 'Sin datos';
                                default: return '';
                            }
                        }
                    }
                }
            }
        }
    });
};
