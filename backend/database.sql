CREATE DATABASE IF NOT EXISTS rpg_game;
USE rpg_game;

CREATE TABLE usuarios (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre_usuario VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    rol ENUM('jugador', 'gm') NOT NULL,
    email VARCHAR(100)
);

CREATE TABLE razas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE habilidades (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE poderes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE equipamiento (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE personajes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    raza_id INT NOT NULL,
    estado ENUM('vivo', 'muerto', 'congelado') DEFAULT 'vivo',
    nivel INT DEFAULT 1,
    habilidad1_id INT,
    habilidad2_id INT,
    poder_id INT,
    equipamiento_id INT,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    FOREIGN KEY (raza_id) REFERENCES razas(id),
    FOREIGN KEY (habilidad1_id) REFERENCES habilidades(id),
    FOREIGN KEY (habilidad2_id) REFERENCES habilidades(id),
    FOREIGN KEY (poder_id) REFERENCES poderes(id),
    FOREIGN KEY (equipamiento_id) REFERENCES equipamiento(id)
);

INSERT IGNORE INTO razas (nombre) VALUES ('Humano');
INSERT IGNORE INTO razas (nombre) VALUES ('Elfo');
INSERT IGNORE INTO razas (nombre) VALUES ('Enano');
INSERT IGNORE INTO razas (nombre) VALUES ('Orco');

INSERT IGNORE INTO habilidades (nombre) VALUES ('Fuerza');
INSERT IGNORE INTO habilidades (nombre) VALUES ('Velocidad');
INSERT IGNORE INTO habilidades (nombre) VALUES ('Inteligencia');
INSERT IGNORE INTO habilidades (nombre) VALUES ('Resistencia');

INSERT IGNORE INTO poderes (nombre) VALUES ('Fuego');
INSERT IGNORE INTO poderes (nombre) VALUES ('Hielo');
INSERT IGNORE INTO poderes (nombre) VALUES ('Telepatia');
INSERT IGNORE INTO poderes (nombre) VALUES ('Invisibilidad');

INSERT IGNORE INTO equipamiento (nombre) VALUES ('Espada');
INSERT IGNORE INTO equipamiento (nombre) VALUES ('Escudo');
INSERT IGNORE INTO equipamiento (nombre) VALUES ('Armadura');
INSERT IGNORE INTO equipamiento (nombre) VALUES ('Varita Magica');