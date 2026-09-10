from config import get_connection

class Personaje:
    @staticmethod
    def crear(usuario_id, nombre, raza_id, habilidad1_id, habilidad2_id, poder_id, equipamiento_id):
        conn = get_connection()
        cursor = conn.cursor()
        
        cursor.execute("""INSERT INTO personajes 
                         (usuario_id, nombre, raza_id, habilidad1_id, habilidad2_id, poder_id, equipamiento_id, estado, nivel)
                         VALUES (%s, %s, %s, %s, %s, %s, %s, 'vivo', 1)""",
                      (usuario_id, nombre, raza_id, habilidad1_id, habilidad2_id, poder_id, equipamiento_id))
        conn.commit()
        personaje_id = cursor.lastrowid
        cursor.close()
        conn.close()
        return personaje_id

    @staticmethod
    def obtener_por_usuario(usuario_id):
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("""SELECT p.*, r.nombre as raza_nombre, 
                         h1.nombre as habilidad1, h2.nombre as habilidad2,
                         po.nombre as poder, e.nombre as equipamiento
                         FROM personajes p
                         JOIN razas r ON p.raza_id = r.id
                         LEFT JOIN habilidades h1 ON p.habilidad1_id = h1.id
                         LEFT JOIN habilidades h2 ON p.habilidad2_id = h2.id
                         LEFT JOIN poderes po ON p.poder_id = po.id
                         LEFT JOIN equipamiento e ON p.equipamiento_id = e.id
                         WHERE p.usuario_id = %s ORDER BY p.id DESC""", (usuario_id,))
        personajes = cursor.fetchall()
        cursor.close()
        conn.close()
        return personajes

    @staticmethod
    def obtener_todos():
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("""SELECT p.*, r.nombre as raza_nombre, 
                         h1.nombre as habilidad1, h2.nombre as habilidad2,
                         po.nombre as poder, e.nombre as equipamiento,
                         u.nombre_usuario as jugador
                         FROM personajes p
                         JOIN razas r ON p.raza_id = r.id
                         JOIN usuarios u ON p.usuario_id = u.id
                         LEFT JOIN habilidades h1 ON p.habilidad1_id = h1.id
                         LEFT JOIN habilidades h2 ON p.habilidad2_id = h2.id
                         LEFT JOIN poderes po ON p.poder_id = po.id
                         LEFT JOIN equipamiento e ON p.equipamiento_id = e.id
                         ORDER BY p.id DESC""")
        personajes = cursor.fetchall()
        cursor.close()
        conn.close()
        return personajes

    @staticmethod
    def actualizar(personaje_id, **kwargs):
        conn = get_connection()
        cursor = conn.cursor()
        
        campos = ", ".join([f"{k}=%s" for k in kwargs.keys()])
        valores = list(kwargs.values()) + [personaje_id]
        
        cursor.execute(f"UPDATE personajes SET {campos} WHERE id=%s", valores)
        conn.commit()
        cursor.close()
        conn.close()
        return True

    @staticmethod
    def obtener_por_id(personaje_id):
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("""SELECT p.*, r.nombre as raza_nombre FROM personajes p
                         JOIN razas r ON p.raza_id = r.id WHERE p.id=%s""", (personaje_id,))
        personaje = cursor.fetchone()
        cursor.close()
        conn.close()
        return personaje

    @staticmethod
    def subir_nivel(personaje_id):
        personaje = Personaje.obtener_por_id(personaje_id)
        if personaje:
            nuevo_nivel = personaje['nivel'] + 1
            Personaje.actualizar(personaje_id, nivel=nuevo_nivel)
            return True
        return False

class Catalogo:
    @staticmethod
    def agregar_raza(nombre):
        conn = get_connection()
        cursor = conn.cursor()
        try:
            cursor.execute("INSERT INTO razas (nombre) VALUES (%s)", (nombre,))
            conn.commit()
            resultado = True
        except:
            resultado = False
        finally:
            cursor.close()
            conn.close()
        return resultado

    @staticmethod
    def agregar_poder(nombre):
        conn = get_connection()
        cursor = conn.cursor()
        try:
            cursor.execute("INSERT INTO poderes (nombre) VALUES (%s)", (nombre,))
            conn.commit()
            resultado = True
        except:
            resultado = False
        finally:
            cursor.close()
            conn.close()
        return resultado

    @staticmethod
    def agregar_habilidad(nombre):
        conn = get_connection()
        cursor = conn.cursor()
        try:
            cursor.execute("INSERT INTO habilidades (nombre) VALUES (%s)", (nombre,))
            conn.commit()
            resultado = True
        except:
            resultado = False
        finally:
            cursor.close()
            conn.close()
        return resultado

    @staticmethod
    def agregar_equipamiento(nombre):
        conn = get_connection()
        cursor = conn.cursor()
        try:
            cursor.execute("INSERT INTO equipamiento (nombre) VALUES (%s)", (nombre,))
            conn.commit()
            resultado = True
        except:
            resultado = False
        finally:
            cursor.close()
            conn.close()
        return resultado

    @staticmethod
    def obtener_razas():
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM razas")
        razas = cursor.fetchall()
        cursor.close()
        conn.close()
        return razas

    @staticmethod
    def obtener_habilidades():
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM habilidades")
        habilidades = cursor.fetchall()
        cursor.close()
        conn.close()
        return habilidades

    @staticmethod
    def obtener_poderes():
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM poderes")
        poderes = cursor.fetchall()
        cursor.close()
        conn.close()
        return poderes

    @staticmethod
    def obtener_equipamiento():
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM equipamiento")
        equipamiento = cursor.fetchall()
        cursor.close()
        conn.close()
        return equipamiento