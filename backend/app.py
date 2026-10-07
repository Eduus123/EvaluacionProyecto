from flask import Flask, send_from_directory
from flask_cors import CORS
from routes import registrar_rutas
from config import inicializar_base_datos, UPLOAD_DIR

inicializar_base_datos()

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 3 * 1024 * 1024
CORS(app)

@app.route('/uploads/<path:filename>')
def servir_upload(filename):
    return send_from_directory(UPLOAD_DIR, filename)

registrar_rutas(app)

if __name__ == '__main__':
    app.run(debug=True, port=5000, host='0.0.0.0')