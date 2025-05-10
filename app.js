// Función para subir el archivo CSV al backend
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
    const response = await fetch('http://localhost:3000/upload', {
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

// Función para cargar los datos desde DynamoDB y renderizar la gráfica
const fetchResumenDynamo = async () => {
  try {
    const response = await fetch('http://localhost:3000/leer-dynamo');
    const data = await response.json();

    const labels = data.resumen_mensual.map(item => item.mes);
    const medias = data.resumen_mensual.map(item => item.media);

    // Crear la gráfica
    const ctx = document.getElementById('sentimientosChart').getContext('2d');
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Promedio de Sentimientos',
          data: medias,
          backgroundColor: '#42A5F5', // Azul para todas las barras
          borderColor: '#1E88E5',
          borderWidth: 1
        }]
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                if (value === 1) {
                  return 'Positiva';
                } else if (value === 0.5) {
                  return 'Mixta';
                } else if (value === 0) {
                  return 'Negativa';
                }
                return value;
              }
            }
          }
        }
      }
    });
  } catch (error) {
    console.error('Error al recuperar los datos:', error);
  }
};

// Llamamos a la función para cargar los datos y renderizar la gráfica
fetchResumenDynamo();

// Asignar el evento de carga del formulario
const form = document.getElementById('csvForm');
form.addEventListener('submit', (e) => {
  e.preventDefault();
  uploadFile();
});
