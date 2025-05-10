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

    const datosPositivos = [];
    const datosNegativos = [];

    for (let i = 0; i < 12; i++) {
        const mesClave = `${year}-${String(i + 1).padStart(2, '0')}`;
        const datosMes = resumen[mesClave];

        if (datosMes) {
            datosPositivos.push(datosMes.PromedioPositiva || 0);
            datosNegativos.push(datosMes.PromedioNegativa || 0);
        } else {
            datosPositivos.push(0);
            datosNegativos.push(0);
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
                    label: 'Positiva',
                    data: datosPositivos,
                    backgroundColor: 'rgba(75, 192, 192, 0.7)'
                },
                {
                    label: 'Negativa',
                    data: datosNegativos,
                    backgroundColor: 'rgba(255, 99, 132, 0.7)'
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
