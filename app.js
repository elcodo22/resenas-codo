// Hacemos la solicitud para obtener los datos sin procesar desde el backend
const fetchResumenDynamo = async () => {
  try {
    const response = await fetch('http://localhost:3000/leer-dynamo');
    const data = await response.json();

    if (data.datos) {
      console.log("Datos sin procesar:", data.datos);
      const resumenMensual = procesarDatosParaGrafico(data.datos);
      renderGrafico(resumenMensual); // Llamamos a la función para dibujar el gráfico
    } else {
      console.error("No se encontraron datos para el gráfico.");
    }
  } catch (error) {
    console.error('Error al recuperar los datos:', error);
  }
};

// Función para procesar los datos y calcular la media
const procesarDatosParaGrafico = (datos) => {
  const resumenMensual = {};

  // Procesamos los datos para calcular la media por mes
  datos.forEach(item => {
    const mes = item.fecha.slice(0, 7); // Extraemos el mes (YYYY-MM)
    const sentimiento = item.sentimiento;

    // Inicializamos el objeto para ese mes si no existe
    if (!resumenMensual[mes]) {
      resumenMensual[mes] = {
        positivas: 0,
        mixtas: 0,
        negativas: 0,
        totalReseñas: 0
      };
    }

    // Contamos las reseñas según el tipo de sentimiento
    if (sentimiento === 'POSITIVE') {
      resumenMensual[mes].positivas += 1;
    } else if (sentimiento === 'MIXED') {
      resumenMensual[mes].mixtas += 1;
    } else if (sentimiento === 'NEGATIVE') {
      resumenMensual[mes].negativas += 1;
    }

    resumenMensual[mes].totalReseñas += 1;
  });

  // Ahora calculamos la media para cada mes
  const datosGrafica = [];
  for (const [mes, valores] of Object.entries(resumenMensual)) {
    const totalReseñas = valores.totalReseñas;
    const porcentajePositivas = valores.positivas / totalReseñas;
    const porcentajeMixtas = valores.mixtas / totalReseñas * 0.5;
    const porcentajeNegativas = valores.negativas / totalReseñas * 0;

    const media = porcentajePositivas + porcentajeMixtas + porcentajeNegativas;

    datosGrafica.push({
      mes,
      media
    });
  }

  return datosGrafica;
};

// Esta función generará el gráfico en un canvas usando Chart.js
const renderGrafico = (resumenMensual) => {
  const ctx = document.getElementById('graficoResenas').getContext('2d');

  // Extraemos los meses y las medias de la respuesta para el gráfico
  const meses = resumenMensual.map(item => item.mes);
  const medias = resumenMensual.map(item => item.media);

  // Creamos el gráfico
  new Chart(ctx, {
    type: 'bar', // Tipo de gráfico (barras)
    data: {
      labels: meses, // Meses como etiquetas
      datasets: [{
        label: 'Reseñas por mes (media)',
        data: medias, // Datos de las medias
        backgroundColor: 'rgba(54, 162, 235, 0.2)', // Color de fondo de las barras
        borderColor: 'rgba(54, 162, 235, 1)', // Color del borde de las barras
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 0.25, // Ajustamos el paso en el eje Y para que sea 0.25
            max: 1, // El valor máximo en el eje Y será 1 (máxima puntuación)
          }
        }
      }
    }
  });
};

// Llamamos a la función para cargar el resumen de DynamoDB cuando cargue la página
window.onload = fetchResumenDynamo;
