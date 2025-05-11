// Función para subir el archivo CSV
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
        console.log("Respuesta del backend (subida):", result);

        if (result.mensaje) {
            alert(result.mensaje); // Confirmación
        }

    } catch (error) {
        console.error('Error al subir el archivo:', error);
        alert('Error al subir el archivo.');
    }
};

// Función para cargar los resúmenes mensuales desde DynamoDB
// Función para cargar los resúmenes mensuales desde DynamoDB
const cargarResumenDesdeDynamo = async () => {
    try {
        const response = await fetch('http://35.177.116.70:3000/leer-dynamo');
        const result = await response.json();

        if (result && result.resumen_mensual) {
            console.log("Datos recibidos desde DynamoDB:", result.resumen_mensual);

            // Filtramos los datos y obtenemos los años disponibles
            availableYears = obtenerAniosDisponibles(result.resumen_mensual);
            console.log('Años disponibles:', availableYears);

            // Llenar el selector con los años disponibles
            llenarSelectorAnios(availableYears);

            // Cargar el gráfico con el primer año disponible (o el año actual si existe en los datos)
            const yearSelected = availableYears[0] || new Date().getFullYear();
            document.getElementById('yearSelect').value = yearSelected;
            mostrarGrafico(result.resumen_mensual, yearSelected); // Mostrar gráfico con el primer año
        } else {
            console.warn("No se encontró resumen en la respuesta.");
            alert("No se encontraron datos.");
        }
    } catch (error) {
        console.error('Error al recuperar los datos desde DynamoDB:', error);
    }
};

// Función para obtener los años disponibles a partir de las fechas de las reseñas
const obtenerAniosDisponibles = (data) => {
    const anios = new Set();
    for (const fechaCompleta in data) {
        const anio = fechaCompleta.substring(0, 4); // Extraemos el año de la fecha
        anios.add(anio); // Agregar el año al conjunto (evita duplicados)
    }
    return Array.from(anios); // Convertimos el conjunto a un arreglo
};

// Función para llenar el selector de años
const llenarSelectorAnios = (anios) => {
    const selectElement = document.getElementById('yearSelect');
    selectElement.innerHTML = ''; // Limpiar el selector

    anios.forEach((anio) => {
        const option = document.createElement('option');
        option.value = anio;
        option.textContent = anio;
        selectElement.appendChild(option);
    });
};

// Función para filtrar los datos por el año seleccionado
const filtrarPorAno = (data, year) => {
    const filteredData = {};
    for (const fechaCompleta in data) {
        if (fechaCompleta.startsWith(year)) {  // Filtramos solo las fechas que comienzan con el año seleccionado
            filteredData[fechaCompleta] = data[fechaCompleta];
        }
    }
    return filteredData;
};

// Función para procesar los datos y graficar
const procesarDatos = (data) => {
    const resumenMensual = {};
    for (const fechaCompleta in data) {
        const valores = data[fechaCompleta];
        const mes = fechaCompleta.substring(0, 7); // Extrae "2024-01" de "2024-01-02"

        if (!resumenMensual[mes]) {
            resumenMensual[mes] = {
                positivas: 0,
                negativas: 0,
                mixtas: 0,
                totalReseñas: 0
            };
        }

        resumenMensual[mes].positivas += valores.positivas;
        resumenMensual[mes].negativas += valores.negativas;
        resumenMensual[mes].mixtas += valores.mixtas;
        resumenMensual[mes].totalReseñas += valores.totalReseñas;
    }

    return resumenMensual;
};

// Función para crear el gráfico con los datos procesados
const mostrarGrafico = (data, year) => {
    // Generar los meses dinámicamente para el año seleccionado
    const meses = [];
    for (let i = 1; i <= 12; i++) {
        const mes = String(i).padStart(2, '0'); // Formatear el mes para que tenga siempre dos dígitos
        meses.push(`${year}-${mes}`);
    }

    // Filtrar los datos por el año seleccionado
    const datosFiltrados = filtrarPorAno(data, year);

    // Procesar los datos para obtener los promedios mensuales
    const datosPromedioMensual = procesarDatos(datosFiltrados);

    // Generar los promedios para cada mes
    const promedios = meses.map(mes => {
        const valores = datosPromedioMensual[mes] || { positivas: 0, negativas: 0, mixtas: 0, totalReseñas: 0 };
        if (valores.totalReseñas === 0) return 0;

        const puntuacion = (
            valores.positivas * 1 +
            valores.mixtas * 0.5 +
            valores.negativas * 0
        );

        return puntuacion / valores.totalReseñas;
    });

    const ctx = document.getElementById('graficoResenas').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: meses.map(mes => {
                const mesNum = parseInt(mes.substring(5, 7), 10); // Extraemos el mes como número
                const mesesNombre = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];
                return mesesNombre[mesNum - 1]; // Mapear el número del mes a su nombre
            }),
            datasets: [{
                label: 'Promedio de Reseñas por Mes',
                data: promedios,
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    min: 0,
                    max: 1,
                    ticks: {
                        stepSize: 0.25,
                        callback: function(value) {
                            const etiquetas = {
                                0: 'Muy Negativas',
                                0.25: 'Negativas',
                                0.5: 'Medias',
                                0.75: 'Positivas',
                                1: 'Muy Positivas'
                            };
                            return etiquetas[value] || '';
                        }
                    },
                    title: {
                        display: true,
                        text: 'Calidad de las reseñas'
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(tooltipItem) {
                            return `Valor Promedio: ${tooltipItem.raw.toFixed(2)}`;
                        }
                    }
                }
            }
        }
    });
};

// Cargar los datos al inicio
cargarResumenDesdeDynamo();
