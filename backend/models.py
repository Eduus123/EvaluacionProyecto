from config import get_connection


class Personaje:
    @staticmethod
    def crear(usuario_id, nombre, raza_id, habilidad1_id, habilidad2_id, poder_id, equipamiento_id, imagen=None, faccion_id=None):
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""INSERT INTO personajes
                         (usuario_id, nombre, raza_id, habilidad1_id, habilidad2_id, poder_id, equipamiento_id, estado, nivel, imagen, faccion_id)
                         VALUES (%s, %s, %s, %s, %s, %s, %s, 'vivo', 1, %s, %s)""",
                      (usuario_id, nombre, raza_id, habilidad1_id, habilidad2_id, poder_id, equipamiento_id, imagen, faccion_id))
        conn.commit()
        personaje_id = cursor.lastrowid
        cursor.close()
        conn.close()
        return personaje_id

    @staticmethod
    def obtener_por_usuario(usuario_id):
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""SELECT p.*, r.nombre as raza_nombre, r.imagen as raza_imagen,
                         h1.nombre as habilidad1, h2.nombre as habilidad2,
                         po.nombre as poder, e.nombre as equipamiento,
                         f.nombre as faccion_nombre, f.color as faccion_color
                         FROM personajes p
                         JOIN razas r ON p.raza_id = r.id
                         LEFT JOIN habilidades h1 ON p.habilidad1_id = h1.id
                         LEFT JOIN habilidades h2 ON p.habilidad2_id = h2.id
                         LEFT JOIN poderes po ON p.poder_id = po.id
                         LEFT JOIN equipamiento e ON p.equipamiento_id = e.id
                         LEFT JOIN facciones f ON p.faccion_id = f.id
                         WHERE p.usuario_id = %s ORDER BY p.id DESC""", (usuario_id,))
        personajes = cursor.fetchall()
        cursor.close()
        conn.close()
        return personajes

    @staticmethod
    def obtener_todos():
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""SELECT p.*, r.nombre as raza_nombre, r.imagen as raza_imagen,
                         h1.nombre as habilidad1, h2.nombre as habilidad2,
                         po.nombre as poder, e.nombre as equipamiento,
                         u.nombre_usuario as jugador,
                         f.nombre as faccion_nombre, f.color as faccion_color
                         FROM personajes p
                         JOIN razas r ON p.raza_id = r.id
                         JOIN usuarios u ON p.usuario_id = u.id
                         LEFT JOIN habilidades h1 ON p.habilidad1_id = h1.id
                         LEFT JOIN habilidades h2 ON p.habilidad2_id = h2.id
                         LEFT JOIN poderes po ON p.poder_id = po.id
                         LEFT JOIN equipamiento e ON p.equipamiento_id = e.id
                         LEFT JOIN facciones f ON p.faccion_id = f.id
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
            Personaje.actualizar(personaje_id, nivel=personaje['nivel'] + 1)
            return True
        return False

    @staticmethod
    def eliminar(personaje_id):
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM personajes WHERE id=%s", (personaje_id,))
        conn.commit()
        ok = cursor.rowcount > 0
        cursor.close()
        conn.close()
        return ok


class Catalogo:
    @staticmethod
    def _insertar(tabla, nombre, imagen=None):
        conn = get_connection()
        cursor = conn.cursor()
        try:
            cursor.execute(f"INSERT INTO {tabla} (nombre, imagen) VALUES (%s, %s)", (nombre, imagen))
            conn.commit()
            resultado = True
        except Exception:
            resultado = False
        finally:
            cursor.close()
            conn.close()
        return resultado

    @staticmethod
    def agregar_raza(nombre, imagen=None, faccion_id=None, descripcion=None):
        conn = get_connection()
        cursor = conn.cursor()
        try:
            cursor.execute(
                "INSERT INTO razas (nombre, imagen, faccion_id, descripcion) VALUES (%s, %s, %s, %s)",
                (nombre, imagen, faccion_id or None, descripcion)
            )
            conn.commit()
            resultado = True
        except Exception:
            resultado = False
        finally:
            cursor.close()
            conn.close()
        return resultado

    @staticmethod
    def agregar_poder(nombre, imagen=None, descripcion=None):
        conn = get_connection()
        cursor = conn.cursor()
        try:
            cursor.execute(
                "INSERT INTO poderes (nombre, imagen, descripcion) VALUES (%s, %s, %s)",
                (nombre, imagen, descripcion)
            )
            conn.commit()
            resultado = True
        except Exception:
            resultado = False
        finally:
            cursor.close()
            conn.close()
        return resultado

    @staticmethod
    def agregar_habilidad(nombre, imagen=None):
        return Catalogo._insertar('habilidades', nombre, imagen)

    @staticmethod
    def agregar_equipamiento(nombre, imagen=None):
        return Catalogo._insertar('equipamiento', nombre, imagen)

    @staticmethod
    def agregar_faccion(nombre, imagen=None, color='azul', descripcion=None):
        conn = get_connection()
        cursor = conn.cursor()
        try:
            cursor.execute(
                "INSERT INTO facciones (nombre, imagen, color, descripcion) VALUES (%s, %s, %s, %s)",
                (nombre, imagen, color or 'azul', descripcion)
            )
            conn.commit()
            resultado = True
        except Exception:
            resultado = False
        finally:
            cursor.close()
            conn.close()
        return resultado

    @staticmethod
    def actualizar_imagen(tabla, item_id, imagen):
        if tabla not in ('razas', 'habilidades', 'poderes', 'equipamiento', 'facciones'):
            return False
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(f"UPDATE {tabla} SET imagen=%s WHERE id=%s", (imagen, item_id))
        conn.commit()
        cursor.close()
        conn.close()
        return True

    @staticmethod
    def actualizar_item(tabla, item_id, data):
        permitidos = {
            'razas': {'nombre', 'imagen', 'descripcion', 'faccion_id'},
            'habilidades': {'nombre', 'imagen'},
            'poderes': {'nombre', 'imagen', 'descripcion'},
            'equipamiento': {'nombre', 'imagen'},
            'facciones': {'nombre', 'imagen', 'color', 'descripcion'},
        }
        campos_ok = permitidos.get(tabla)
        if not campos_ok:
            return False
        limpia = {k: v for k, v in data.items() if k in campos_ok}
        if 'faccion_id' in limpia and (limpia['faccion_id'] == '' or limpia['faccion_id'] == 0):
            limpia['faccion_id'] = None
        if not limpia:
            return False
        conn = get_connection()
        cursor = conn.cursor()
        try:
            sets = ", ".join(f"{k}=%s" for k in limpia.keys())
            cursor.execute(f"UPDATE {tabla} SET {sets} WHERE id=%s", list(limpia.values()) + [item_id])
            conn.commit()
            ok = cursor.rowcount >= 0
        except Exception:
            ok = False
        finally:
            cursor.close()
            conn.close()
        return ok

    @staticmethod
    def eliminar_item(tabla, item_id):
        if tabla not in ('razas', 'habilidades', 'poderes', 'equipamiento', 'facciones'):
            return False, 'Tipo inválido'
        conn = get_connection()
        cursor = conn.cursor()
        try:
            if tabla == 'facciones':
                cursor.execute("UPDATE razas SET faccion_id=NULL WHERE faccion_id=%s", (item_id,))
                cursor.execute("UPDATE personajes SET faccion_id=NULL WHERE faccion_id=%s", (item_id,))
            elif tabla == 'razas':
                cursor.execute("SELECT COUNT(*) FROM personajes WHERE raza_id=%s", (item_id,))
                if cursor.fetchone()[0]:
                    return False, 'Hay personajes con esta raza'
            elif tabla == 'habilidades':
                cursor.execute("SELECT COUNT(*) FROM personajes WHERE habilidad1_id=%s OR habilidad2_id=%s", (item_id, item_id))
                if cursor.fetchone()[0]:
                    return False, 'Hay personajes con esta habilidad'
            elif tabla == 'poderes':
                cursor.execute("SELECT COUNT(*) FROM personajes WHERE poder_id=%s", (item_id,))
                if cursor.fetchone()[0]:
                    return False, 'Hay personajes con este poder'
            elif tabla == 'equipamiento':
                cursor.execute("SELECT COUNT(*) FROM personajes WHERE equipamiento_id=%s", (item_id,))
                if cursor.fetchone()[0]:
                    return False, 'Hay personajes con este equipo'
            cursor.execute(f"DELETE FROM {tabla} WHERE id=%s", (item_id,))
            conn.commit()
            ok = cursor.rowcount > 0
            return (True, None) if ok else (False, 'No se encontró')
        except Exception:
            return False, 'No se pudo eliminar'
        finally:
            cursor.close()
            conn.close()

    @staticmethod
    def _listar(tabla):
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute(f"SELECT * FROM {tabla}")
        filas = cursor.fetchall()
        cursor.close()
        conn.close()
        return filas

    @staticmethod
    def obtener_razas():
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""SELECT r.*, f.nombre as faccion_nombre, f.color as faccion_color
                         FROM razas r LEFT JOIN facciones f ON r.faccion_id = f.id
                         ORDER BY r.id""")
        filas = cursor.fetchall()
        cursor.close()
        conn.close()
        return filas

    @staticmethod
    def obtener_habilidades():
        return Catalogo._listar('habilidades')

    @staticmethod
    def obtener_poderes():
        return Catalogo._listar('poderes')

    @staticmethod
    def obtener_equipamiento():
        return Catalogo._listar('equipamiento')

    @staticmethod
    def obtener_facciones():
        return Catalogo._listar('facciones')
