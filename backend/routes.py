from flask import request, jsonify
from functools import wraps
from auth import autenticar_usuario, registrar_usuario, crear_token, verificar_token
from models import Personaje, Catalogo

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
        data = request.json
        Personaje.crear(
            payload['usuario_id'],
            data.get('nombre'),
            data.get('raza_id'),
            data.get('habilidad1_id'),
            data.get('habilidad2_id'),
            data.get('poder_id'),
            data.get('equipamiento_id')
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

        # Caso especial: subir de nivel (solo GM)
        if data.get('nivel') == 'incrementar':
            if payload['rol'] != 'gm':
                return jsonify({'error': 'Solo el Game Master puede subir de nivel'}), 403
            if Personaje.subir_nivel(personaje_id):
                return jsonify({'mensaje': 'Nivel aumentado'}), 200
            return jsonify({'error': 'No se pudo subir de nivel'}), 400

        # Caso normal: actualizar campos
        # Filtramos solo campos válidos para evitar inyección accidental
        campos_permitidos = {
            'nombre', 'raza_id', 'habilidad1_id', 'habilidad2_id',
            'poder_id', 'equipamiento_id', 'estado', 'nivel'
        }
        data_limpia = {k: v for k, v in data.items() if k in campos_permitidos}

        if not data_limpia:
            return jsonify({'error': 'No hay datos para actualizar'}), 400

        # Solo el GM puede cambiar estado o nivel numérico
        if ('estado' in data_limpia or 'nivel' in data_limpia) and payload['rol'] != 'gm':
            return jsonify({'error': 'Solo el Game Master puede cambiar estado o nivel'}), 403

        Personaje.actualizar(personaje_id, **data_limpia)
        return jsonify({'mensaje': 'Personaje actualizado'}), 200

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

    @app.route('/api/catalogo/razas', methods=['POST'])
    @token_required
    def agregar_raza(payload):
        if payload['rol'] != 'gm':
            return jsonify({'error': 'Solo GM puede agregar razas'}), 403
        
        data = request.json
        if Catalogo.agregar_raza(data.get('nombre')):
            return jsonify({'mensaje': 'Raza agregada'}), 201
        return jsonify({'error': 'La raza ya existe'}), 400

    @app.route('/api/catalogo/poderes', methods=['POST'])
    @token_required
    def agregar_poder(payload):
        if payload['rol'] != 'gm':
            return jsonify({'error': 'Solo GM puede agregar poderes'}), 403
        
        data = request.json
        if Catalogo.agregar_poder(data.get('nombre')):
            return jsonify({'mensaje': 'Poder agregado'}), 201
        return jsonify({'error': 'El poder ya existe'}), 400

    @app.route('/api/catalogo/habilidades', methods=['POST'])
    @token_required
    def agregar_habilidad(payload):
        if payload['rol'] != 'gm':
            return jsonify({'error': 'Solo GM puede agregar habilidades'}), 403
        
        data = request.json
        if Catalogo.agregar_habilidad(data.get('nombre')):
            return jsonify({'mensaje': 'Habilidad agregada'}), 201
        return jsonify({'error': 'La habilidad ya existe'}), 400