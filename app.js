let resumenMensualGlobal = {};  // Guardar todos los datos cargados
let añosDisponibles = [];  // Guardar los años disponibles

// Función para subir el archivo CSV
const uploadFile = async () => {
    const fileInput = document.getElementById('csvFile');
    const file = fileInput.files[0];
    if (!file) {
        alert('Por favor, selecciona un archivo CSV');
        return;
    }

    // Verificar que el archivo sea CSV
    if (file.type !== 'text/csv') {
        alert('Por favor, selecciona un archivo CSV válido');
        return;
    }

    const formData = new FormData();
    formData.append('csv', file);

    try {
        const response = await fetch('http://35.177.116.70:3000/upload', {
            method: 'POST',
            body: formData,
        });

        // Verificar la respuesta
        if (!response.ok) {
            throw new Error('Error al subir el archivo. Código de estado: ' + response.status);
        }

        const result = await response.json();
        console.log('Datos recibidos:', result);

        if (result.resumen_mensual) {
            resumenMensualGlobal = result.resumen_mensual;
            // Extraer los años disponibles
            añosDisponibles = Object.keys(resumenMensualGlobal).map(mes => mes.split('-')[0]);
            añosDisponibles = [...new Set(añosDisponibles)];  // Eliminar duplicados

            // Llenar el selector de años
            fillYearSelector();
            // Mostrar el análisis del primer año disponible
            displayGraph(resumenMensualGlobal, añosDisponibles[0]);
        } else {
            alert('No se encontró el resumen mensual en la respuesta');
        }
    } catch (error) {
        alert('Error al subir el archivo: ' + error.message);
    }
};

// Llenar el selector de años
const fillYearSelector = () => {
    const yearSelector = document.getElementById('yearSelector');
    while (yearSelector.firstChild) {
        yearSelector.removeChild(yearSelector.firstChild); // Eliminar las opciones previas
    }

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

// Función para mostrar el gráfico
const displayGraph = (resumen, year) => {
    const meses = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];

    const clasificaciones = [];
    const yearPrefix = `${year}-`;

    // Para cada mes del año seleccionado
    meses.forEach((mes, index) => {
        const mesKey = `${yearPrefix}${(index + 1).toString().padStart(2, '0')}`;

        let clasificacion = "Mala"; // Clasificación predeterminada
        if (resumen[mesKey]) {
            const { Positive, Negative, Neutral, Mixed } = resumen[mesKey];

            if (Positive && parseFloat(Positive.N) > 0.5) {
                clasificacion = "Buena";
            } else if (Negative && parseFloat(Negative.N) > 0.5) {
                clasificacion = "Mala";
            } else if (Neutral && parseFloat(Neutral.N) > 0.5) {
                clasificacion = "Neutral";
            } else if (Mixed && parseFloat(Mixed.N) > 0.5) {
                clasificacion = "Mixta";
            }
        }

        clasificaciones.push(clasificacion);
    });

    // Definir los colores para cada clasificación
    const colores = {
        "Buena": "green",
        "Mixta": "orange",
        "Neutral": "yellow",
        "Mala": "red"
    };

    // Preparar los datos para las barras (representación numérica de las clasificaciones)
    const datos = clasificaciones.map(clasificacion => {
        if (clasificacion === "Buena") return 1;
        if (clasificacion === "Mixta") return 2;
        if (clasificacion === "Neutral") return 3;
        return 4; // Mala
    });

    const ctx = document.getElementById('sentimentChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: meses, // Meses como etiquetas del eje X
            datasets: [{
                label: 'Clasificación de Sentimientos',
                data: datos, // Los datos calculados (1: Buena, 2: Mixta, 3: Neutral, 4: Mala)
                backgroundColor: clasificaciones.map(clasificacion => colores[clasificacion]), // Colores para cada clasificación
                borderColor: 'black',
                borderWidth: 1
            }]
        },
        options: {
            indexAxis: 'x', // Muestra los meses en el eje X
            scales: {
                y: {
                    beginAtZero: true,
                    max: 4, // El máximo es 4 porque tenemos 4 clasificaciones (Buena, Mixta, Neutral, Mala)
                    ticks: {
                        stepSize: 1,
                        callback: function(value) {
                            if (value === 1) return 'Buena';
                            if (value === 2) return 'Mixta';
                            if (value === 3) return 'Neutral';
                            if (value === 4) return 'Mala';
                            return value;
                        }
                    },
                    title: {
                        display: true,
                        text: 'Clasificación'
                    }
                }
            }
        }
    });
};
