from flask import Flask
from flask_cors import CORS
from routes import registrar_rutas
from config import inicializar_base_datos

inicializar_base_datos()

app = Flask(__name__)
CORS(app)

registrar_rutas(app)

if __name__ == '__main__':
    app.run(debug=True, port=5000, host='0.0.0.0')