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
        console.log('Datos recibidos:', result); // <-- Agregar para depurar

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

// Función para mostrar el gráfico
const displayGraph = (resumen, selectedYear) => {
    const meses = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];
    
    const clasificaciones = [];

    // Para cada mes en el año seleccionado, verificamos las reseñas y calculamos la clasificación
    meses.forEach((mes, index) => {
        const mesKey = `${selectedYear}-${(index + 1).toString().padStart(2, '0')}`;
        
        let clasificacion = "Mala"; // Clasificación predeterminada si no hay reseñas
        if (resumen[mesKey]) {
            const promedioPositiva = resumen[mesKey].PromedioPositiva;
            const promedioNegativa = resumen[mesKey].PromedioNegativa;

            // Clasificación
            if (promedioPositiva > 0.5) {
                clasificacion = "Buena";
            } else if (promedioPositiva >= 0.3) {
                clasificacion = "Media";
            }
        }

        clasificaciones.push(clasificacion);
    });

    // Definir los colores para cada clasificación
    const colores = {
        "Buena": "green",
        "Media": "yellow",
        "Mala": "red"
    };

    // Preparar los datos para las barras (representación numérica de las clasificaciones)
    const datos = clasificaciones.map(clasificacion => {
        if (clasificacion === "Buena") return 1;
        if (clasificacion === "Media") return 2;
        return 3;
    });

    const ctx = document.getElementById('sentimentChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: meses, // Meses como etiquetas del eje X
            datasets: [{
                label: 'Clasificación de Sentimientos',
                data: datos, // Los datos calculados (1: Buena, 2: Media, 3: Mala)
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
                    max: 3, // El máximo es 3 porque tenemos 3 clasificaciones (Buena, Media, Mala)
                    ticks: {
                        stepSize: 1,
                        callback: function(value) {
                            if (value === 1) return 'Buena';
                            if (value === 2) return 'Media';
                            if (value === 3) return 'Mala';
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
