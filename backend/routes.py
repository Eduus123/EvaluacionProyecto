import uuid
from flask import request, jsonify
from functools import wraps
from werkzeug.utils import secure_filename
from auth import autenticar_usuario, registrar_usuario, crear_token, verificar_token
from models import Personaje, Catalogo
from config import UPLOAD_DIR

ALLOWED_EXT = {'png', 'jpg', 'jpeg', 'webp', 'gif'}
TABLAS_CATALOGO = {'razas', 'habilidades', 'poderes', 'equipamiento', 'facciones'}


def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        if not token:
            return jsonify({'error': 'Token requerido'}), 401
        payload = verificar_token(token)
        if not payload:
            return jsonify({'error': 'Token inválido'}), 401
        return f(payload, *args, **kwargs)
    return decorated


def registrar_rutas(app):

    @app.route('/api/upload', methods=['POST'])
    @token_required
    def upload(payload):
        f = request.files.get('file')
        if not f or not f.filename:
            return jsonify({'error': 'Archivo requerido'}), 400
        ext = f.filename.rsplit('.', 1)[-1].lower() if '.' in f.filename else ''
        if ext not in ALLOWED_EXT:
            return jsonify({'error': 'Usá PNG, JPG, WEBP o GIF'}), 400
        nombre = f"{uuid.uuid4().hex}.{ext}"
        f.save(str(UPLOAD_DIR / secure_filename(nombre)))
        url = request.host_url.rstrip('/') + '/uploads/' + nombre
        return jsonify({'url': url}), 201

    @app.route('/api/login', methods=['POST'])
    def login():
        data = request.json
        usuario = autenticar_usuario(data.get('nombre_usuario'), data.get('password'))
        if usuario:
            token = crear_token(usuario['id'], usuario['rol'])
            return jsonify({'token': token, 'rol': usuario['rol'], 'usuario_id': usuario['id']}), 200
        return jsonify({'error': 'Credenciales inválidas'}), 401

    @app.route('/api/registro', methods=['POST'])
    def registro():
        data = request.json
        if registrar_usuario(data.get('nombre_usuario'), data.get('password'),
                             data.get('rol'), data.get('email')):
            return jsonify({'mensaje': 'Usuario registrado'}), 201
        return jsonify({'error': 'El usuario ya existe'}), 400

    @app.route('/api/personajes', methods=['POST'])
    @token_required
    def crear_personaje(payload):
        data = request.json or {}
        Personaje.crear(
            payload['usuario_id'],
            data.get('nombre'),
            data.get('raza_id'),
            data.get('habilidad1_id'),
            data.get('habilidad2_id'),
            data.get('poder_id'),
            data.get('equipamiento_id'),
            data.get('imagen'),
            data.get('faccion_id')
        )
        return jsonify({'mensaje': 'Personaje creado'}), 201

    @app.route('/api/personajes', methods=['GET'])
    @token_required
    def obtener_personajes(payload):
        if payload['rol'] == 'jugador':
            personajes = Personaje.obtener_por_usuario(payload['usuario_id'])
        else:
            personajes = Personaje.obtener_todos()
        return jsonify(personajes), 200

    @app.route('/api/personajes/<int:personaje_id>', methods=['PUT'])
    @token_required
    def actualizar_personaje(payload, personaje_id):
        personaje = Personaje.obtener_por_id(personaje_id)
        if not personaje:
            return jsonify({'error': 'Personaje no encontrado'}), 404

        if personaje['estado'] == 'muerto' and payload['rol'] == 'jugador':
            return jsonify({'error': 'No puedes editar un personaje muerto'}), 403

        data = request.json or {}

        if data.get('nivel') == 'incrementar':
            if payload['rol'] != 'gm':
                return jsonify({'error': 'Solo el Game Master puede subir de nivel'}), 403
            if Personaje.subir_nivel(personaje_id):
                return jsonify({'mensaje': 'Nivel aumentado'}), 200
            return jsonify({'error': 'No se pudo subir de nivel'}), 400

        campos_permitidos = {
            'nombre', 'raza_id', 'habilidad1_id', 'habilidad2_id',
            'poder_id', 'equipamiento_id', 'estado', 'nivel', 'imagen', 'faccion_id'
        }
        data_limpia = {k: v for k, v in data.items() if k in campos_permitidos}
        if not data_limpia:
            return jsonify({'error': 'No hay datos para actualizar'}), 400
        if ('estado' in data_limpia or 'nivel' in data_limpia) and payload['rol'] != 'gm':
            return jsonify({'error': 'Solo el Game Master puede cambiar estado o nivel'}), 403

        Personaje.actualizar(personaje_id, **data_limpia)
        return jsonify({'mensaje': 'Personaje actualizado'}), 200

    @app.route('/api/personajes/<int:personaje_id>', methods=['DELETE'])
    @token_required
    def eliminar_personaje(payload, personaje_id):
        personaje = Personaje.obtener_por_id(personaje_id)
        if not personaje:
            return jsonify({'error': 'Personaje no encontrado'}), 404
        if payload['rol'] != 'gm' and personaje['usuario_id'] != payload['usuario_id']:
            return jsonify({'error': 'No podés borrar un personaje que no es tuyo'}), 403
        Personaje.eliminar(personaje_id)
        return jsonify({'mensaje': 'Personaje eliminado'}), 200

    @app.route('/api/catalogo/razas', methods=['GET'])
    @token_required
    def obtener_razas(payload):
        return jsonify(Catalogo.obtener_razas()), 200

    @app.route('/api/catalogo/habilidades', methods=['GET'])
    @token_required
    def obtener_habilidades(payload):
        return jsonify(Catalogo.obtener_habilidades()), 200

    @app.route('/api/catalogo/poderes', methods=['GET'])
    @token_required
    def obtener_poderes(payload):
        return jsonify(Catalogo.obtener_poderes()), 200

    @app.route('/api/catalogo/equipamiento', methods=['GET'])
    @token_required
    def obtener_equipamiento(payload):
        return jsonify(Catalogo.obtener_equipamiento()), 200

    @app.route('/api/catalogo/facciones', methods=['GET'])
    @token_required
    def obtener_facciones(payload):
        return jsonify(Catalogo.obtener_facciones()), 200

    def _alta_catalogo(payload, agregar, mensaje, error_dup):
        if payload['rol'] != 'gm':
            return jsonify({'error': 'Solo GM puede modificar el catálogo'}), 403
        data = request.json or {}
        if agregar(data.get('nombre'), data.get('imagen')):
            return jsonify({'mensaje': mensaje}), 201
        return jsonify({'error': error_dup}), 400

    @app.route('/api/catalogo/razas', methods=['POST'])
    @token_required
    def agregar_raza(payload):
        if payload['rol'] != 'gm':
            return jsonify({'error': 'Solo GM puede modificar el catálogo'}), 403
        data = request.json or {}
        ok = Catalogo.agregar_raza(
            data.get('nombre'),
            data.get('imagen'),
            data.get('faccion_id'),
            data.get('descripcion')
        )
        if ok:
            return jsonify({'mensaje': 'Raza agregada'}), 201
        return jsonify({'error': 'La raza ya existe'}), 400

    @app.route('/api/catalogo/poderes', methods=['POST'])
    @token_required
    def agregar_poder(payload):
        if payload['rol'] != 'gm':
            return jsonify({'error': 'Solo GM puede modificar el catálogo'}), 403
        data = request.json or {}
        ok = Catalogo.agregar_poder(data.get('nombre'), data.get('imagen'), data.get('descripcion'))
        if ok:
            return jsonify({'mensaje': 'Poder agregado'}), 201
        return jsonify({'error': 'El poder ya existe'}), 400

    @app.route('/api/catalogo/habilidades', methods=['POST'])
    @token_required
    def agregar_habilidad(payload):
        return _alta_catalogo(payload, Catalogo.agregar_habilidad, 'Habilidad agregada', 'La habilidad ya existe')

    @app.route('/api/catalogo/equipamiento', methods=['POST'])
    @token_required
    def agregar_equipamiento(payload):
        return _alta_catalogo(payload, Catalogo.agregar_equipamiento, 'Equipamiento agregado', 'El equipamiento ya existe')

    @app.route('/api/catalogo/facciones', methods=['POST'])
    @token_required
    def agregar_faccion(payload):
        if payload['rol'] != 'gm':
            return jsonify({'error': 'Solo GM puede modificar el catálogo'}), 403
        data = request.json or {}
        ok = Catalogo.agregar_faccion(
            data.get('nombre'),
            data.get('imagen'),
            data.get('color') or 'azul',
            data.get('descripcion')
        )
        if ok:
            return jsonify({'mensaje': 'Facción agregada'}), 201
        return jsonify({'error': 'La facción ya existe'}), 400

    @app.route('/api/catalogo/<tipo>/<int:item_id>', methods=['PUT'])
    @token_required
    def actualizar_catalogo(payload, tipo, item_id):
        if payload['rol'] != 'gm':
            return jsonify({'error': 'Solo GM puede modificar el catálogo'}), 403
        if tipo not in TABLAS_CATALOGO:
            return jsonify({'error': 'Tipo inválido'}), 400
        data = request.json or {}
        if not Catalogo.actualizar_item(tipo, item_id, data):
            return jsonify({'error': 'No se pudo actualizar'}), 400
        return jsonify({'mensaje': 'Actualizado'}), 200

    @app.route('/api/catalogo/<tipo>/<int:item_id>', methods=['DELETE'])
    @token_required
    def eliminar_catalogo(payload, tipo, item_id):
        if payload['rol'] != 'gm':
            return jsonify({'error': 'Solo GM puede modificar el catálogo'}), 403
        if tipo not in TABLAS_CATALOGO:
            return jsonify({'error': 'Tipo inválido'}), 400
        ok, err = Catalogo.eliminar_item(tipo, item_id)
        if not ok:
            return jsonify({'error': err or 'No se pudo eliminar'}), 400
        return jsonify({'mensaje': 'Eliminado'}), 200
