// Variable para guardar el resumen mensual global (se puede ajustar a tus necesidades)
let resumenMensualGlobal = {};
let añosDisponibles = [];

// Función para manejar la carga del archivo
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
        // Realizar la solicitud POST al backend
        const response = await fetch('http://35.177.116.70:3000/upload', {
            method: 'POST',
            body: formData,
        });

        const result = await response.json();
        console.log("Respuesta del backend:", result);

        if (result.mensaje) {
            alert(result.mensaje);  // Mostrar mensaje de éxito o error
        }

    } catch (error) {
        alert('Error: ' + error.message); // Mostrar error si falla la carga
    }
};

// Este código es solo para mostrar cómo se puede manejar la carga del archivo CSV al backend.
// Se asume que tienes un formulario o un input HTML para cargar el archivo y llamas esta función cuando el usuario lo seleccione.

document.getElementById('uploadBtn').addEventListener('click', uploadFile);  // Asumiendo que el botón de cargar tiene el id "uploadBtn"
