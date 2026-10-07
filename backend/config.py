from pathlib import Path
import mysql.connector

UPLOAD_DIR = Path(__file__).resolve().parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

SECRET_KEY = "1234"

ESTADOS_RPG = (
    'vivo', 'herido', 'gravemente_herido', 'sangrando', 'caido',
    'inconsciente', 'muerto',
    'envenenado', 'quemado', 'congelado', 'electrificado',
    'paralizado', 'aturdido', 'dormido', 'ralentizado',
    'ciego', 'ensordecido', 'silenciado',
    'aterrado', 'hechizado', 'confundido', 'poseido',
    'maldito', 'bendecido', 'protegido', 'vulnerable',
    'invisible', 'escondido', 'petrificado', 'transformado',
    'acelerado', 'agotado', 'regenerando',
    'en_combate', 'descansando', 'viajando'
)
ESTADOS_ENUM_SQL = "ENUM(" + ",".join(f"'{e}'" for e in ESTADOS_RPG) + ") DEFAULT 'vivo'"


def get_server_connection():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="1234"
    )


def get_connection():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="1234",
        database="rpg_game"
    )


def _asegurar_columna(cursor, tabla, columna, definicion):
    try:
        cursor.execute(f"ALTER TABLE {tabla} ADD COLUMN {columna} {definicion}")
    except Exception:
        pass


def inicializar_base_datos():
    conn = get_server_connection()
    cursor = conn.cursor()
    cursor.execute("CREATE DATABASE IF NOT EXISTS rpg_game;")
    cursor.close()
    conn.close()

    conn = get_connection()
    cursor = conn.cursor()

    queries = [
        """CREATE TABLE IF NOT EXISTS usuarios (
            id INT PRIMARY KEY AUTO_INCREMENT,
            nombre_usuario VARCHAR(50) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            rol ENUM('jugador', 'gm') NOT NULL,
            email VARCHAR(100)
        );""",
        """CREATE TABLE IF NOT EXISTS facciones (
            id INT PRIMARY KEY AUTO_INCREMENT,
            nombre VARCHAR(50) UNIQUE NOT NULL,
            color VARCHAR(20) DEFAULT 'azul',
            descripcion TEXT NULL,
            imagen VARCHAR(255) NULL
        );""",
        """CREATE TABLE IF NOT EXISTS razas (
            id INT PRIMARY KEY AUTO_INCREMENT,
            nombre VARCHAR(50) UNIQUE NOT NULL,
            imagen VARCHAR(255) NULL,
            descripcion TEXT NULL,
            faccion_id INT NULL
        );""",
        """CREATE TABLE IF NOT EXISTS habilidades (
            id INT PRIMARY KEY AUTO_INCREMENT,
            nombre VARCHAR(50) UNIQUE NOT NULL,
            imagen VARCHAR(255) NULL
        );""",
        """CREATE TABLE IF NOT EXISTS poderes (
            id INT PRIMARY KEY AUTO_INCREMENT,
            nombre VARCHAR(50) UNIQUE NOT NULL,
            imagen VARCHAR(255) NULL,
            descripcion TEXT NULL
        );""",
        """CREATE TABLE IF NOT EXISTS equipamiento (
            id INT PRIMARY KEY AUTO_INCREMENT,
            nombre VARCHAR(50) UNIQUE NOT NULL,
            imagen VARCHAR(255) NULL
        );""",
        """CREATE TABLE IF NOT EXISTS personajes (
            id INT PRIMARY KEY AUTO_INCREMENT,
            usuario_id INT NOT NULL,
            nombre VARCHAR(100) NOT NULL,
            raza_id INT NOT NULL,
            estado """ + ESTADOS_ENUM_SQL + """,
            nivel INT DEFAULT 1,
            habilidad1_id INT,
            habilidad2_id INT,
            poder_id INT,
            equipamiento_id INT,
            imagen VARCHAR(255) NULL,
            faccion_id INT NULL,
            FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
            FOREIGN KEY (raza_id) REFERENCES razas(id),
            FOREIGN KEY (habilidad1_id) REFERENCES habilidades(id),
            FOREIGN KEY (habilidad2_id) REFERENCES habilidades(id),
            FOREIGN KEY (poder_id) REFERENCES poderes(id),
            FOREIGN KEY (equipamiento_id) REFERENCES equipamiento(id)
        );""",
        "INSERT IGNORE INTO facciones (nombre, color, descripcion) VALUES ('Alianza', 'azul', 'Reinos unidos por el honor, la fe y la ley.');",
        "INSERT IGNORE INTO facciones (nombre, color, descripcion) VALUES ('Horda', 'rojo', 'Clanes forjados en la guerra, la supervivencia y la fuerza.');",
        "INSERT IGNORE INTO razas (nombre) VALUES ('Humano');",
        "INSERT IGNORE INTO razas (nombre) VALUES ('Elfo');",
        "INSERT IGNORE INTO razas (nombre) VALUES ('Enano');",
        "INSERT IGNORE INTO razas (nombre) VALUES ('Orco');",
        "INSERT IGNORE INTO habilidades (nombre) VALUES ('Fuerza');",
        "INSERT IGNORE INTO habilidades (nombre) VALUES ('Velocidad');",
        "INSERT IGNORE INTO habilidades (nombre) VALUES ('Inteligencia');",
        "INSERT IGNORE INTO habilidades (nombre) VALUES ('Resistencia');",
        "INSERT IGNORE INTO poderes (nombre) VALUES ('Fuego');",
        "INSERT IGNORE INTO poderes (nombre) VALUES ('Hielo');",
        "INSERT IGNORE INTO poderes (nombre) VALUES ('Telepatia');",
        "INSERT IGNORE INTO poderes (nombre) VALUES ('Invisibilidad');",
        "INSERT IGNORE INTO equipamiento (nombre) VALUES ('Espada');",
        "INSERT IGNORE INTO equipamiento (nombre) VALUES ('Escudo');",
        "INSERT IGNORE INTO equipamiento (nombre) VALUES ('Armadura');",
        "INSERT IGNORE INTO equipamiento (nombre) VALUES ('Varita Magica');"
    ]

    for q in queries:
        cursor.execute(q)

    for tabla in ['razas', 'habilidades', 'poderes', 'equipamiento', 'personajes', 'facciones']:
        _asegurar_columna(cursor, tabla, 'imagen', 'VARCHAR(255) NULL')

    _asegurar_columna(cursor, 'personajes', 'faccion_id', 'INT NULL')
    _asegurar_columna(cursor, 'razas', 'faccion_id', 'INT NULL')
    _asegurar_columna(cursor, 'razas', 'descripcion', 'TEXT NULL')
    _asegurar_columna(cursor, 'poderes', 'descripcion', 'TEXT NULL')
    _asegurar_columna(cursor, 'facciones', 'color', "VARCHAR(20) DEFAULT 'azul'")
    _asegurar_columna(cursor, 'facciones', 'descripcion', 'TEXT NULL')

    cursor.execute("""UPDATE razas SET faccion_id = (SELECT id FROM facciones WHERE nombre='Alianza' LIMIT 1)
                      WHERE nombre IN ('Humano','Elfo','Enano') AND faccion_id IS NULL""")
    cursor.execute("""UPDATE razas SET faccion_id = (SELECT id FROM facciones WHERE nombre='Horda' LIMIT 1)
                      WHERE nombre IN ('Orco') AND faccion_id IS NULL""")
    cursor.execute("""UPDATE razas SET descripcion = 'Valientes y versátiles. Encajan en cualquier rol de la mesa.'
                      WHERE nombre='Humano' AND (descripcion IS NULL OR descripcion='')""")
    cursor.execute("""UPDATE razas SET descripcion = 'Ágiles y longevos. Magia, sigilo y un ojo para el bosque.'
                      WHERE nombre='Elfo' AND (descripcion IS NULL OR descripcion='')""")
    cursor.execute("""UPDATE razas SET descripcion = 'Duros como la roca. Resistencia, forja y un hacha siempre lista.'
                      WHERE nombre='Enano' AND (descripcion IS NULL OR descripcion='')""")
    cursor.execute("""UPDATE razas SET descripcion = 'Guerreros nómadas. Fuerza bruta y un honor propio de clan.'
                      WHERE nombre='Orco' AND (descripcion IS NULL OR descripcion='')""")
    cursor.execute("""UPDATE poderes SET descripcion = 'Llama viva. Quema, ilumina y abre paso.'
                      WHERE nombre='Fuego' AND (descripcion IS NULL OR descripcion='')""")
    cursor.execute("""UPDATE poderes SET descripcion = 'Frío que detiene. Controla el campo y rompe guardias.'
                      WHERE nombre='Hielo' AND (descripcion IS NULL OR descripcion='')""")
    cursor.execute("""UPDATE poderes SET descripcion = 'Voces en la mente. Lee, empuja y confunde.'
                      WHERE nombre='Telepatia' AND (descripcion IS NULL OR descripcion='')""")
    cursor.execute("""UPDATE poderes SET descripcion = 'Desaparece a simple vista. Emboscada y huida.'
                      WHERE nombre='Invisibilidad' AND (descripcion IS NULL OR descripcion='')""")

    cursor.execute(f"ALTER TABLE personajes MODIFY COLUMN estado {ESTADOS_ENUM_SQL}")
    conn.commit()
    cursor.close()
    conn.close()
