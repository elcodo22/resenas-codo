const express = require('express');
const multer = require('multer');
const fs = require('fs');
const cors = require('cors');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { DynamoDBClient, ScanCommand } = require('@aws-sdk/client-dynamodb');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

const upload = multer({ dest: 'uploads/' });

const REGION = 'eu-west-2';
const s3 = new S3Client({ region: REGION });
const dynamoClient = new DynamoDBClient({ region: REGION });

const BUCKET_NAME = 'resenas-sentimiento-codo2';
const DYNAMO_TABLE = 'AnalisisSentimiento';

// Ruta para subir archivo CSV a S3
app.post('/upload', upload.single('csv'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ mensaje: 'No se recibió ningún archivo.' });
    }

    const fileContent = fs.readFileSync(file.path);

    const params = {
      Bucket: BUCKET_NAME,
      Key: `entradas/${Date.now()}-${file.originalname}`,
      Body: fileContent,
      ContentType: 'text/csv'
    };

    const command = new PutObjectCommand(params);
    const result = await s3.send(command);

    fs.unlinkSync(file.path);

    res.json({ mensaje: 'Archivo subido a S3 exitosamente.' });
  } catch (error) {
    console.error('Error al subir archivo:', error);
    res.status(500).json({ mensaje: 'Error al subir el archivo.' });
  }
});

// Ruta para leer los datos de DynamoDB y generar el gráfico
app.get('/leer-dynamo', async (req, res) => {
  try {
    const params = {
      TableName: DYNAMO_TABLE
    };

    const data = await dynamoClient.send(new ScanCommand(params));

    const resumenMensual = {};

    // Procesamos cada elemento de la tabla DynamoDB
    for (const item of data.Items) {
      const fecha = item.fecha.S || item.fecha;
      const sentimiento = item.sentimiento?.S || item.sentimiento;

      if (!resumenMensual[fecha]) {
        resumenMensual[fecha] = {
          positivas: 0,
          mixtas: 0,
          negativas: 0,
          totalReseñas: 0
        };
      }

      if (sentimiento === 'POSITIVE') {
        resumenMensual[fecha].positivas += 1;
      } else if (sentimiento === 'MIXED') {
        resumenMensual[fecha].mixtas += 1;
      } else if (sentimiento === 'NEGATIVE') {
        resumenMensual[fecha].negativas += 1;
      }

      resumenMensual[fecha].totalReseñas += 1;
    }

    // Calcular el puntaje promedio para cada mes
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

    res.json({ resumen_mensual: datosGrafica });
  } catch (error) {
    console.error('Error al leer desde DynamoDB:', error);
    res.status(500).json({ mensaje: 'Error al leer desde DynamoDB.' });
  }
});

app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});
