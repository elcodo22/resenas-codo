let resumenMensualGlobal = {};  // Guardar todos los datos cargados
let añosDisponibles = [];  // Guardar los años disponibles

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
        console.log(result); // Para ver los datos en la consola

        if (response.ok) {
            resumenMensualGlobal = result.resumen_mensual;
            // Extraer los años disponibles
            añosDisponibles = Object.keys(resumenMensualGlobal).map(mes => mes.split('-')[0]);
            añosDisponibles = [...new Set(añosDisponibles)];  // Eliminar duplicados

            // Llenar el selector de años
            fillYearSelector();
            // Mostrar el análisis del primer año disponible
            displayGraph(resumenMensualGlobal, añosDisponibles[0]);
        } else {
            alert(result.mensaje);
        }
    } catch (error) {
        alert('Error al subir el archivo');
    }
};

// Llenar el selector de años
const fillYearSelector = () => {
    const yearSelector = document.getElementById('yearSelector');
    yearSelector.innerHTML = "";  // Limpiar cualquier opción previa

    // Agregar la opción "Selecciona un año"
    const defaultOption = document.createElement('option');
    defaultOption.text = "Selecciona un año";
    yearSelector.add(defaultOption);

    // Agregar los años disponibles al selector
    añosDisponibles.forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.text = year;
        yearSelector.add(option);
    });
};

// Filtrar y mostrar los datos según el año seleccionado
const handleYearChange = () => {
    const selectedYear = document.getElementById('yearSelector').value;
    if (selectedYear !== "Selecciona un año") {
        displayGraph(resumenMensualGlobal, selectedYear);
    }
};

const displayGraph = (resumen, year) => {
    const meses = Object.keys(resumen).filter(mes => mes.startsWith(year));  // Filtrar por año
    const sentimientos = [];

    meses.forEach(mes => {
        const promedioPositiva = resumen[mes].PromedioPositiva || 0;
        const promedioNegativa = resumen[mes].PromedioNegativa || 0;
        
        // Clasificación del mes según la comparación de los promedios
        let clasificacion = 'MALA';  // Por defecto, es MALA
        if (promedioPositiva > promedioNegativa) {
            clasificacion = 'BUENA';
        } else if (promedioPositiva === promedioNegativa) {
            clasificacion = 'MEDIA';
        }

        sentimientos.push(clasificacion);
    });

    // Asignación de colores para cada sentimiento
    const colores = {
        'BUENA': 'green',
        'MEDIA': 'gray',
        'MALA': 'red'
    };

    // Configuración del gráfico de barras
    const ctx = document.getElementById('sentimentChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: meses,  // Meses en el eje X
            datasets: [{
                label: 'Sentimiento',
                data: sentimientos.map(sentimiento => sentimiento),  // Clasificación por mes
                backgroundColor: sentimientos.map(sentimiento => colores[sentimiento]),
                borderColor: sentimientos.map(sentimiento => colores[sentimiento]),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            indexAxis: 'x', // Mostrar barras verticales
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Meses'  // Título para el eje X
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Clasificación Sentimiento'  // Título para el eje Y
                    },
                    // Definir las etiquetas para el eje Y (BUENA, MEDIA, MALA)
                    ticks: {
                        callback: function(value) {
                            switch(value) {
                                case 'BUENA': return 'BUENA';
                                case 'MEDIA': return 'MEDIA';
                                case 'MALA': return 'MALA';
                                default: return value;
                            }
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    callbacks: {
                        label: function(tooltipItem) {
                            return `Sentimiento: ${tooltipItem.raw}`;
                        }
                    }
                }
            }
        }
    });
};
