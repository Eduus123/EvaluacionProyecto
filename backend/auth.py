import jwt
import hashlib
from datetime import datetime, timedelta
from config import SECRET_KEY, get_connection

def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

def crear_token(usuario_id, rol):
    payload = {
        'usuario_id': usuario_id,
        'rol': rol,
        'exp': datetime.utcnow() + timedelta(hours=24)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm='HS256')

def verificar_token(token):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        return payload
    except:
        return None

def autenticar_usuario(nombre_usuario, password):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    password_hash = hash_password(password)
    
    cursor.execute("SELECT id, rol FROM usuarios WHERE nombre_usuario=%s AND password=%s", 
                   (nombre_usuario, password_hash))
    usuario = cursor.fetchone()
    cursor.close()
    conn.close()
    
    return usuario

def registrar_usuario(nombre_usuario, password, rol, email):
    conn = get_connection()
    cursor = conn.cursor()
    password_hash = hash_password(password)
    
    try:
        cursor.execute("INSERT INTO usuarios (nombre_usuario, password, rol, email) VALUES (%s, %s, %s, %s)",
                       (nombre_usuario, password_hash, rol, email))
        conn.commit()
        resultado = True
    except:
        resultado = False
    finally:
        cursor.close()
        conn.close()
    
    return resultado