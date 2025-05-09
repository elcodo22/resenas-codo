import boto3
import csv
from flask import Flask, request, render_template, jsonify
from io import TextIOWrapper
from decimal import Decimal
from collections import defaultdict
from datetime import datetime
import os

app = Flask(__name__)
dynamodb = boto3.resource('dynamodb', region_name='eu-west-2')
comprehend = boto3.client('comprehend', region_name='eu-west-2')
table = dynamodb.Table('AnalisisSentimiento')  # Asegúrate de que exista

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload():
    file = request.files['csvfile']
    resumen_mensual = defaultdict(lambda: {
        'conteo': 0, 'sum_positiva': 0.0, 'sum_negativa': 0.0,
        'sum_neutral': 0.0, 'sum_mixta': 0.0
    })

    reader = csv.DictReader(TextIOWrapper(file, 'utf-8'))
    for row in reader:
        texto = row['texto']
        fecha = row['fecha']
        resultado = comprehend.detect_sentiment(Text=texto, LanguageCode='es')
        puntuaciones = resultado['SentimentScore']
        sentimiento = resultado['Sentiment']

        mes = datetime.strptime(fecha, "%Y-%m-%d").strftime("%Y-%m")
        resumen = resumen_mensual[mes]
        resumen['conteo'] += 1
        resumen['sum_positiva'] += puntuaciones['Positive']
        resumen['sum_negativa'] += puntuaciones['Negative']
        resumen['sum_neutral'] += puntuaciones['Neutral']
        resumen['sum_mixta'] += puntuaciones['Mixed']

        table.put_item(Item={
            'id': fecha + "-" + str(hash(texto)),
            'fecha': fecha,
            'texto': texto,
            'sentimiento': sentimiento,
            'puntuaciones': {k: Decimal(str(v)) for k, v in puntuaciones.items()}
        })

    return "CSV procesado y enviado a DynamoDB"

@app.route('/resumen')
def resumen():
    scan = table.scan()
    items = scan['Items']

    resumen_mensual = defaultdict(lambda: {
        'conteo': 0, 'sum_positiva': 0.0, 'sum_negativa': 0.0,
        'sum_neutral': 0.0, 'sum_mixta': 0.0
    })

    for item in items:
        fecha = item['fecha']
        mes = datetime.strptime(fecha, "%Y-%m-%d").strftime("%Y-%m")
        puntuaciones = item['puntuaciones']
        resumen = resumen_mensual[mes]
        resumen['conteo'] += 1
        resumen['sum_positiva'] += float(puntuaciones['Positive'])
        resumen['sum_negativa'] += float(puntuaciones['Negative'])
        resumen['sum_neutral'] += float(puntuaciones['Neutral'])
        resumen['sum_mixta'] += float(puntuaciones['Mixed'])

    resultado = {}
    for mes, r in resumen_mensual.items():
        conteo = r['conteo']
        resultado[mes] = {
            'PromedioPositiva': round(r['sum_positiva'] / conteo, 4),
            'PromedioNegativa': round(r['sum_negativa'] / conteo, 4),
            'PromedioNeutral': round(r['sum_neutral'] / conteo, 4),
            'PromedioMixta': round(r['sum_mixta'] / conteo, 4)
        }

    return jsonify(resultado)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=80)
