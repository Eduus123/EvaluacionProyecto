const API_URL = 'http://localhost:5000/api';

function getToken() {
    return localStorage.getItem('token');
}

function setToken(token, rol, usuario_id) {
    localStorage.setItem('token', token);
    localStorage.setItem('rol', rol);
    localStorage.setItem('usuario_id', usuario_id);
}

function logout() {
    localStorage.clear();
    window.location.href = 'index.html';
}

async function login(event) {
    event.preventDefault();
    const nombre_usuario = document.getElementById('loginUser').value;
    const password = document.getElementById('loginPass').value;

    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre_usuario, password })
        });

        if (response.ok) {
            const data = await response.json();
            setToken(data.token, data.rol, data.usuario_id);
            window.location.href = data.rol === 'jugador' ? 'jugador.html' : 'gm.html';
        } else {
            document.getElementById('loginError').textContent = 'Credenciales inválidas';
        }
    } catch (error) {
        document.getElementById('loginError').textContent = 'Error de conexión';
    }
}

async function registro(event) {
    event.preventDefault();
    const nombre_usuario = document.getElementById('regUser').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPass').value;
    const rol = document.getElementById('regRol').value;

    try {
        const response = await fetch(`${API_URL}/registro`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre_usuario, email, password, rol })
        });

        if (response.ok) {
            alert('Registro exitoso. Inicia sesión');
            mostrarLogin();
        } else {
            document.getElementById('regError').textContent = 'El usuario ya existe';
        }
    } catch (error) {
        document.getElementById('regError').textContent = 'Error de conexión';
    }
}

function mostrarLogin() {
    document.getElementById('loginForm').classList.add('active');
    document.getElementById('registroForm').classList.remove('active');
    document.querySelectorAll('.tab-btn')[0].classList.add('active');
    document.querySelectorAll('.tab-btn')[1].classList.remove('active');
}

function mostrarRegistro() {
    document.getElementById('loginForm').classList.remove('active');
    document.getElementById('registroForm').classList.add('active');
    document.querySelectorAll('.tab-btn')[0].classList.remove('active');
    document.querySelectorAll('.tab-btn')[1].classList.add('active');
}

async function cargarCatalogo() {
    const token = getToken();

    try {
        const [razas, habilidades, poderes, equipamiento] = await Promise.all([
            fetch(`${API_URL}/catalogo/razas`, { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json()),
            fetch(`${API_URL}/catalogo/habilidades`, { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json()),
            fetch(`${API_URL}/catalogo/poderes`, { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json()),
            fetch(`${API_URL}/catalogo/equipamiento`, { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json())
        ]);

        poblarSelects(['razaSelect', 'editRazaSelect'], razas, 'Seleccione una raza');
        poblarSelects(['habilidad1Select', 'habilidad2Select', 'editHabilidad1Select', 'editHabilidad2Select'], habilidades, 'Seleccione una habilidad');
        poblarSelects(['poderSelect', 'editPoderSelect'], poderes, 'Seleccione un poder');
        poblarSelects(['equipamientoSelect', 'editEquipamientoSelect'], equipamiento, 'Seleccione equipamiento');

    } catch (error) {
        console.error('Error cargando catálogo', error);
    }
}

function poblarSelects(ids, datos, placeholder) {
    ids.forEach(id => {
        const select = document.getElementById(id);
        if (select) {
            select.innerHTML = `<option value="">${placeholder}</option>`;
            datos.forEach(item => {
                const option = document.createElement('option');
                option.value = item.id;
                option.textContent = item.nombre;
                select.appendChild(option);
            });
        }
    });
}

async function crearPersonaje(event) {
    event.preventDefault();
    const token = getToken();

    const habilidad1 = parseInt(document.getElementById('habilidad1Select').value);
    const habilidad2 = parseInt(document.getElementById('habilidad2Select').value);

    if (habilidad1 === habilidad2) {
        document.getElementById('crearError').textContent = 'Las habilidades deben ser diferentes';
        return;
    }

    const personaje = {
        nombre: document.getElementById('nombrePersonaje').value,
        raza_id: parseInt(document.getElementById('razaSelect').value),
        habilidad1_id: habilidad1,
        habilidad2_id: habilidad2,
        poder_id: parseInt(document.getElementById('poderSelect').value),
        equipamiento_id: parseInt(document.getElementById('equipamientoSelect').value)
    };

    try {
        const response = await fetch(`${API_URL}/personajes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(personaje)
        });

        if (response.ok) {
            document.getElementById('crearExito').textContent = 'Personaje creado exitosamente';
            document.getElementById('crearError').textContent = '';
            document.getElementById('crearPersonajeForm').reset();
            setTimeout(() => cargarPersonajesJugador(), 500);
        } else {
            const data = await response.json();
            document.getElementById('crearError').textContent = data.error || 'Error al crear personaje';
        }
    } catch (error) {
        document.getElementById('crearError').textContent = 'Error de conexión';
    }
}

async function cargarPersonajesJugador() {
    const token = getToken();

    try {
        const response = await fetch(`${API_URL}/personajes`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const personajes = await response.json();
        mostrarPersonajes(personajes, 'personajesList', true);
    } catch (error) {
        console.error('Error cargando personajes', error);
    }
}

async function cargarTodosPersonajes() {
    const token = getToken();

    try {
        const response = await fetch(`${API_URL}/personajes`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const personajes = await response.json();
        mostrarPersonajes(personajes, 'todosPersonajesList', false);
    } catch (error) {
        console.error('Error cargando personajes', error);
    }
}

function mostrarPersonajes(personajes, containerId, esJugador) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';

    if (!personajes || personajes.length === 0) {
        container.innerHTML = '<p style="grid-column: 1/-1;">No hay personajes todavía. ¡Crea el primero!</p>';
        return;
    }

    personajes.forEach(p => {
        const card = document.createElement('div');
        card.className = 'personaje-card';
        
        card.innerHTML = `
            <h4>${p.nombre}</h4>
            <p><strong>Raza:</strong> ${p.raza_nombre || p.raza_id || 'N/A'}</p>
            <p><strong>Nivel:</strong> ${p.nivel}</p>
            <p><strong>Habilidades:</strong> ${p.habilidad1 || 'N/A'}, ${p.habilidad2 || 'N/A'}</p>
            <p><strong>Poder:</strong> ${p.poder || 'N/A'}</p>
            <p><strong>Equipamiento:</strong> ${p.equipamiento || 'N/A'}</p>
            ${!esJugador ? `<p><strong>Jugador:</strong> ${p.jugador || 'N/A'}</p>` : ''}
            <span class="estado ${p.estado}">${p.estado ? p.estado.toUpperCase() : 'DESCONOCIDO'}</span>
        `;

        if (esJugador && p.estado !== 'muerto') {
            const btnEditar = document.createElement('button');
            btnEditar.textContent = 'Editar';
            btnEditar.addEventListener('click', () => abrirModalEditar(p));
            card.appendChild(btnEditar);
        }

        if (!esJugador) {
            const btnAdmin = document.createElement('button');
            btnAdmin.textContent = 'Administrar';
            btnAdmin.addEventListener('click', () => abrirModalGM(p));
            card.appendChild(btnAdmin);
        }

        container.appendChild(card);
    });
}

function abrirModalEditar(personaje) {
    document.getElementById('editPersonajeId').value = personaje.id;
    document.getElementById('editNombre').value = personaje.nombre;
    document.getElementById('editRazaSelect').value = personaje.raza_id || '';
    document.getElementById('editHabilidad1Select').value = personaje.habilidad1_id || '';
    document.getElementById('editHabilidad2Select').value = personaje.habilidad2_id || '';
    document.getElementById('editPoderSelect').value = personaje.poder_id || '';
    document.getElementById('editEquipamientoSelect').value = personaje.equipamiento_id || '';
    document.getElementById('editError').textContent = '';

    document.getElementById('modalEditar').style.display = 'block';
}

function cerrarModal() {
    document.getElementById('modalEditar').style.display = 'none';
}

async function guardarEdicionPersonaje(event) {
    event.preventDefault();
    const token = getToken();

    const id = document.getElementById('editPersonajeId').value;
    const habilidad1 = parseInt(document.getElementById('editHabilidad1Select').value);
    const habilidad2 = parseInt(document.getElementById('editHabilidad2Select').value);

    if (habilidad1 === habilidad2) {
        document.getElementById('editError').textContent = 'Las habilidades deben ser diferentes';
        return;
    }

    const personajeActualizado = {
        nombre: document.getElementById('editNombre').value,
        raza_id: parseInt(document.getElementById('editRazaSelect').value),
        habilidad1_id: habilidad1,
        habilidad2_id: habilidad2,
        poder_id: parseInt(document.getElementById('editPoderSelect').value),
        equipamiento_id: parseInt(document.getElementById('editEquipamientoSelect').value)
    };

    try {
        const response = await fetch(`${API_URL}/personajes/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(personajeActualizado)
        });

        if (response.ok) {
            cerrarModal();
            cargarPersonajesJugador();
        } else {
            const data = await response.json();
            document.getElementById('editError').textContent = data.error || 'Error al actualizar';
        }
    } catch (error) {
        document.getElementById('editError').textContent = 'Error de conexión';
    }
}

function abrirModalGM(personaje) {
    document.getElementById('gmPersonajeId').value = personaje.id;
    document.getElementById('gmPersonajeNombre').textContent = `Personaje: ${personaje.nombre}`;
    document.getElementById('gmEstadoSelect').value = personaje.estado || 'vivo';
    document.getElementById('gmNivelInput').value = personaje.nivel || 1;
    document.getElementById('gmError').textContent = '';
    document.getElementById('modalGM').style.display = 'block';
}

function cerrarModalGM() {
    document.getElementById('modalGM').style.display = 'none';
}

async function guardarAdminGM(event) {
    event.preventDefault();
    const token = getToken();
    const id = document.getElementById('gmPersonajeId').value;
    const estado = document.getElementById('gmEstadoSelect').value;
    const nivel = parseInt(document.getElementById('gmNivelInput').value, 10);

    if (!estado || isNaN(nivel) || nivel < 1) {
        document.getElementById('gmError').textContent = 'Estado y nivel válidos son requeridos (nivel ≥ 1)';
        return;
    }

    try {
        const response = await fetch(`${API_URL}/personajes/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ estado, nivel })
        });

        if (response.ok) {
            cerrarModalGM();
            cargarTodosPersonajes();
        } else {
            const data = await response.json().catch(() => ({}));
            document.getElementById('gmError').textContent = data.error || 'Error al actualizar';
        }
    } catch (error) {
        console.error('Error', error);
        document.getElementById('gmError').textContent = 'Error de conexión';
    }
}

function mostrarTab(tabName, event) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    
    if (tabName === 'personajes') {
        const tab = document.getElementById('personajesTab');
        if (tab) tab.classList.add('active');
    } else {
        const tab = document.getElementById('catalogoTab');
        if (tab) tab.classList.add('active');
    }
    
    if (event && event.target) {
        event.target.classList.add('active');
    }
}

async function agregarRaza(event) {
    event.preventDefault();
    const token = getToken();
    const nombre = document.getElementById('nombreRaza').value;

    try {
        const response = await fetch(`${API_URL}/catalogo/razas`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ nombre })
        });

        if (response.ok) {
            document.getElementById('agregarRazaForm').reset();
            cargarCatalogo();
        } else {
            document.getElementById('razaError').textContent = 'La raza ya existe';
        }
    } catch (error) {
        console.error('Error', error);
    }
}

async function agregarHabilidad(event) {
    event.preventDefault();
    const token = getToken();
    const nombre = document.getElementById('nombreHabilidad').value;

    try {
        const response = await fetch(`${API_URL}/catalogo/habilidades`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ nombre })
        });

        if (response.ok) {
            document.getElementById('agregarHabilidadForm').reset();
            cargarCatalogo();
        } else {
            document.getElementById('habilidadError').textContent = 'La habilidad ya existe';
        }
    } catch (error) {
        console.error('Error', error);
    }
}

async function agregarPoder(event) {
    event.preventDefault();
    const token = getToken();
    const nombre = document.getElementById('nombrePoder').value;

    try {
        const response = await fetch(`${API_URL}/catalogo/poderes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ nombre })
        });

        if (response.ok) {
            document.getElementById('agregarPoderForm').reset();
            cargarCatalogo();
        } else {
            document.getElementById('poderError').textContent = 'El poder ya existe';
        }
    } catch (error) {
        console.error('Error', error);
    }
}

async function agregarEquipamiento(event) {
    event.preventDefault();
    const token = getToken();
    const nombre = document.getElementById('nombreEquipamiento').value;

    try {
        const response = await fetch(`${API_URL}/catalogo/equipamiento`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ nombre })
        });

        if (response.ok) {
            document.getElementById('agregarEquipamientoForm').reset();
            cargarCatalogo();
        } else {
            document.getElementById('equipamientoError').textContent = 'El equipamiento ya existe';
        }
    } catch (error) {
        console.error('Error', error);
    }
}

window.cerrarModal = cerrarModal;
window.cerrarModalGM = cerrarModalGM;
window.logout = logout;
window.mostrarLogin = mostrarLogin;
window.mostrarRegistro = mostrarRegistro;
window.mostrarTab = mostrarTab;

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('loginForm')) document.getElementById('loginForm').addEventListener('submit', login);
    if (document.getElementById('registroForm')) document.getElementById('registroForm').addEventListener('submit', registro);
    if (document.getElementById('crearPersonajeForm')) document.getElementById('crearPersonajeForm').addEventListener('submit', crearPersonaje);
    if (document.getElementById('editarPersonajeForm')) document.getElementById('editarPersonajeForm').addEventListener('submit', guardarEdicionPersonaje);
    if (document.getElementById('gmAdminForm')) document.getElementById('gmAdminForm').addEventListener('submit', guardarAdminGM);
    
    if (document.getElementById('agregarRazaForm')) document.getElementById('agregarRazaForm').addEventListener('submit', agregarRaza);
    if (document.getElementById('agregarHabilidadForm')) document.getElementById('agregarHabilidadForm').addEventListener('submit', agregarHabilidad);
    if (document.getElementById('agregarPoderForm')) document.getElementById('agregarPoderForm').addEventListener('submit', agregarPoder);
    if (document.getElementById('agregarEquipamientoForm')) document.getElementById('agregarEquipamientoForm').addEventListener('submit', agregarEquipamiento);

    if (document.getElementById('personajesList')) {
        cargarCatalogo();
        cargarPersonajesJugador();
    }
    if (document.getElementById('todosPersonajesList')) {
        cargarCatalogo();
        cargarTodosPersonajes();
    }
});