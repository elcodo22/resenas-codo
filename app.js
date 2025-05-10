// Importamos las librerías necesarias
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');

// Creamos una función para procesar el CSV
function processCSV(filePath) {
  return new Promise((resolve, reject) => {
    const data = {};
    
    // Leemos el archivo CSV
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        // Extraemos el mes y año
        const fecha = row['fecha'];
        const mes = fecha.substring(0, 7); // '2024-01'
        
        try {
          // Parseamos el JSON en el campo 'puntuaciones'
          const puntuaciones = JSON.parse(row['puntuaciones']);
          
          // Inicializamos las estructuras para cada mes
          if (!data[mes]) {
            data[mes] = { total: 0, positivo: 0, negativo: 0, mixto: 0 };
          }
          
          // Sumamos los valores de cada sentimiento
          const positivo = puntuaciones.Positive ? puntuaciones.Positive.N : 0;
          const negativo = puntuaciones.Negative ? puntuaciones.Negative.N : 0;
          const mixto = puntuaciones.Mixed ? puntuaciones.Mixed.N : 0;

          data[mes].total += 1;
          data[mes].positivo += positivo;
          data[mes].negativo += negativo;
          data[mes].mixto += mixto;
        } catch (err) {
          console.error('Error al procesar la fila:', row, err);
        }
      })
      .on('end', () => {
        resolve(data);
      })
      .on('error', (err) => {
        reject(err);
      });
  });
}

// Creamos la función para generar el gráfico
async function generateChart(data) {
  const chartJSNodeCanvas = new ChartJSNodeCanvas({ width: 800, height: 600 });
  
  const labels = Object.keys(data); // Meses
  const positivo = labels.map(mes => data[mes].positivo / data[mes].total); // Promedio Positivo
  const negativo = labels.map(mes => data[mes].negativo / data[mes].total); // Promedio Negativo
  const mixto = labels.map(mes => data[mes].mixto / data[mes].total); // Promedio Mixto

  const configuration = {
    type: 'line',
    data: {
      labels: labels, // Meses
      datasets: [
        {
          label: 'Positivo',
          borderColor: 'green',
          backgroundColor: 'rgba(0, 255, 0, 0.1)',
          data: positivo,
          fill: true,
        },
        {
          label: 'Negativo',
          borderColor: 'red',
          backgroundColor: 'rgba(255, 0, 0, 0.1)',
          data: negativo,
          fill: true,
        },
        {
          label: 'Mixto',
          borderColor: 'orange',
          backgroundColor: 'rgba(255, 165, 0, 0.1)',
          data: mixto,
          fill: true,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: 'Sentimiento por Mes',
        },
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Mes',
          },
        },
        y: {
          title: {
            display: true,
            text: 'Promedio de Sentimiento',
          },
          ticks: {
            beginAtZero: true,
          },
        },
      },
    },
  };

  const imageBuffer = await chartJSNodeCanvas.renderToBuffer(configuration);
  fs.writeFileSync('sentiment_chart.png', imageBuffer);
  console.log('Gráfico generado como "sentiment_chart.png".');
}

// Función principal para procesar los datos y generar la gráfica
async function main() {
  const filePath = path.join(__dirname, 'data.csv'); // Asegúrate de que el archivo CSV esté en la misma carpeta
  try {
    const sentimentData = await processCSV(filePath);
    await generateChart(sentimentData);
  } catch (error) {
    console.error('Error al procesar el archivo CSV:', error);
  }
}

main();
