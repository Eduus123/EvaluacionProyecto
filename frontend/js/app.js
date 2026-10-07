const API_URL = 'http://localhost:5000/api';

const ESTADOS_RPG = [
    { id: 'vivo', label: 'Vivo', desc: 'Sin afecciones' },
    { id: 'herido', label: 'Herido', desc: 'Vida reducida' },
    { id: 'gravemente_herido', label: 'Gravemente herido', desc: 'Al borde del colapso' },
    { id: 'sangrando', label: 'Sangrando', desc: 'Pierde vida cada turno' },
    { id: 'caido', label: 'Caído', desc: 'Derribado, tiradas de muerte' },
    { id: 'inconsciente', label: 'Inconsciente', desc: 'No puede actuar' },
    { id: 'muerto', label: 'Muerto', desc: 'Fuera de combate permanente' },
    { id: 'envenenado', label: 'Envenenado', desc: 'Daño de veneno' },
    { id: 'quemado', label: 'Quemado', desc: 'Daño de fuego continuo' },
    { id: 'congelado', label: 'Congelado', desc: 'Inmovilizado por hielo' },
    { id: 'electrificado', label: 'Electrificado', desc: 'Daño de rayo' },
    { id: 'paralizado', label: 'Paralizado', desc: 'No puede moverse' },
    { id: 'aturdido', label: 'Aturdido', desc: 'Pierde acciones' },
    { id: 'dormido', label: 'Dormido', desc: 'Duerme hasta que lo despierten' },
    { id: 'ralentizado', label: 'Ralentizado', desc: 'Menos velocidad' },
    { id: 'acelerado', label: 'Acelerado', desc: 'Más acciones / prisa' },
    { id: 'ciego', label: 'Ciego', desc: 'No puede ver' },
    { id: 'ensordecido', label: 'Ensordecido', desc: 'No puede oír' },
    { id: 'silenciado', label: 'Silenciado', desc: 'No puede lanzar hechizos' },
    { id: 'aterrado', label: 'Aterrorizado', desc: 'Huye o no se acerca' },
    { id: 'hechizado', label: 'Hechizado', desc: 'Control mental' },
    { id: 'confundido', label: 'Confundido', desc: 'Puede atacar aliados' },
    { id: 'poseido', label: 'Poseído', desc: 'Otra entidad lo controla' },
    { id: 'maldito', label: 'Maldito', desc: 'Penalizadores mágicos' },
    { id: 'bendecido', label: 'Bendecido', desc: 'Bonificadores divinos' },
    { id: 'protegido', label: 'Protegido', desc: 'Escudo o barrera' },
    { id: 'vulnerable', label: 'Vulnerable', desc: 'Recibe más daño' },
    { id: 'invisible', label: 'Invisible', desc: 'No lo ven' },
    { id: 'escondido', label: 'Escondido', desc: 'Oculto / sigilo' },
    { id: 'petrificado', label: 'Petrificado', desc: 'Convertido en piedra' },
    { id: 'transformado', label: 'Transformado', desc: 'Cambio de forma' },
    { id: 'agotado', label: 'Agotado', desc: 'Fatiga, menos eficacia' },
    { id: 'regenerando', label: 'Regenerando', desc: 'Recupera vida' },
    { id: 'en_combate', label: 'En combate', desc: 'Turno activo' },
    { id: 'descansando', label: 'Descansando', desc: 'Recuperándose' },
    { id: 'viajando', label: 'Viajando', desc: 'Fuera del escenario' }
];

function labelEstado(id) {
    return ESTADOS_RPG.find(e => e.id === id)?.label || (id || 'Vivo');
}

function pintarEstadosGM(selected) {
    const select = document.getElementById('gmEstadoSelect');
    const grid = document.getElementById('gmEstadoGrid');
    if (!select) return;
    const actual = selected || select.value || 'vivo';
    select.innerHTML = ESTADOS_RPG.map(e =>
        `<option value="${e.id}">${e.label}</option>`
    ).join('');
    select.value = actual;
    if (!grid) return;
    grid.innerHTML = ESTADOS_RPG.map(e => `
        <button type="button" class="estado-opt ${e.id} ${e.id === actual ? 'selected' : ''}" data-id="${e.id}" title="${e.desc}">
            <strong>${e.label}</strong>
            <small>${e.desc}</small>
        </button>
    `).join('');
    grid.querySelectorAll('.estado-opt').forEach(btn => {
        btn.addEventListener('click', () => {
            select.value = btn.dataset.id;
            grid.querySelectorAll('.estado-opt').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
        });
    });
}

let catalogoCache = { razas: [], habilidades: [], poderes: [], equipamiento: [], facciones: [] };
let imagenPersonajePendiente = '';
let imagenEdicionPendiente = '';
let catalogoEditTarget = null;
let svgUid = 0;

function getToken() { return localStorage.getItem('token'); }
function setToken(token, rol, usuario_id) {
    localStorage.setItem('token', token);
    localStorage.setItem('rol', rol);
    localStorage.setItem('usuario_id', usuario_id);
}
function logout() { localStorage.clear(); window.location.href = 'index.html'; }

function escapeHtml(s) {
    return String(s ?? '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function slugify(s) {
    return String(s || '').toLowerCase().normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-*$)/g, '');
}
function hueDe(nombre) {
    let h = 0;
    for (const c of String(nombre || '')) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    return h % 360;
}

function svgRaza(nombre) {
    const s = slugify(nombre);
    const razas = {
        humano: `<defs>
            <linearGradient id="hbg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#2a3548"/><stop offset="100%" stop-color="#0e1218"/></linearGradient>
            <linearGradient id="hsk" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#f0d4b0"/><stop offset="100%" stop-color="#c49a70"/></linearGradient>
            <linearGradient id="har" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#4a5a78"/><stop offset="100%" stop-color="#2a3548"/></linearGradient>
            </defs>
            <rect width="80" height="100" fill="url(#hbg)"/>
            <ellipse cx="40" cy="102" rx="36" ry="24" fill="#c9a227" opacity=".35"/>
            <path d="M16 100 L22 58 Q40 48 58 58 L64 100Z" fill="url(#har)"/>
            <path d="M22 62 L28 48 H52 L58 62" fill="#3d4a62"/>
            <circle cx="40" cy="34" r="16" fill="url(#hsk)"/>
            <path d="M24 30c2-14 30-14 32 0" fill="#4a3020"/>
            <path d="M24 28c4-10 28-10 32 2" fill="#5a3e28"/>
            <ellipse cx="34" cy="34" rx="2" ry="2.4" fill="#2a1810"/>
            <ellipse cx="46" cy="34" rx="2" ry="2.4" fill="#2a1810"/>
            <path d="M36 40 Q40 44 44 40" stroke="#a07850" fill="none" stroke-width="1.2"/>
            <rect x="30" y="48" width="20" height="5" rx="1" fill="#c9a227"/>
            <path d="M18 70 L22 58 L28 62Z" fill="#c9a227" opacity=".6"/>
            <path d="M62 70 L58 58 L52 62Z" fill="#c9a227" opacity=".6"/>`,
        elfo: `<defs>
            <linearGradient id="ebg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#0e2818"/><stop offset="100%" stop-color="#061208"/></linearGradient>
            <linearGradient id="esk" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#f5e0c0"/><stop offset="100%" stop-color="#d0b088"/></linearGradient>
            </defs>
            <rect width="80" height="100" fill="url(#ebg)"/>
            <ellipse cx="40" cy="102" rx="32" ry="22" fill="#2f6a4a" opacity=".4"/>
            <path d="M20 100 L26 60 Q40 50 54 60 L60 100Z" fill="#1a4a32"/>
            <path d="M26 62 L32 52 H48 L54 62" fill="#245a3e"/>
            <circle cx="40" cy="32" r="14" fill="url(#esk)"/>
            <path d="M14 34 L26 18 L28 36Z" fill="url(#esk)"/>
            <path d="M66 34 L54 18 L52 36Z" fill="url(#esk)"/>
            <path d="M26 20c2-12 26-12 28 0" fill="#6ab87a"/>
            <path d="M28 18c4-8 20-8 24 2" fill="#8fd18f"/>
            <circle cx="35" cy="31" r="1.8" fill="#3a8a50"/>
            <circle cx="45" cy="31" r="1.8" fill="#3a8a50"/>
            <path d="M36 38 Q40 41 44 38" stroke="#c0a070" fill="none" stroke-width="1"/>
            <path d="M30 55 L40 70 L50 55" fill="none" stroke="#c9a227" stroke-width="1.5" opacity=".5"/>`,
        enano: `<defs>
            <linearGradient id="dbg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#2a1a0c"/><stop offset="100%" stop-color="#120c06"/></linearGradient>
            <linearGradient id="dsk" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#e8b878"/><stop offset="100%" stop-color="#b87840"/></linearGradient>
            </defs>
            <rect width="80" height="100" fill="url(#dbg)"/>
            <ellipse cx="40" cy="102" rx="38" ry="20" fill="#8a5a28" opacity=".4"/>
            <path d="M14 100 L20 68 H60 L66 100Z" fill="#5a3a18"/>
            <path d="M20 70 L26 58 H54 L60 70" fill="#6a4420"/>
            <circle cx="40" cy="38" r="15" fill="url(#dsk)"/>
            <path d="M20 42c6 24 34 24 40 0" fill="#5a3010"/>
            <path d="M22 44c8 18 28 18 36 0" fill="#6a3a14"/>
            <path d="M22 30h36l-5-12h-26z" fill="#c9a227"/>
            <path d="M24 30h32l-3-8h-26z" fill="#e8d48b"/>
            <rect x="34" y="18" width="12" height="6" fill="#8a7020"/>
            <circle cx="34" cy="36" r="2" fill="#2a1810"/>
            <circle cx="46" cy="36" r="2" fill="#2a1810"/>
            <path d="M36 44 Q40 48 44 44" stroke="#8a5030" fill="none" stroke-width="1.2"/>
            <path d="M16 75 L40 88 L64 75" fill="none" stroke="#c9a227" stroke-width="2"/>`,
        orco: `<defs>
            <linearGradient id="obg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#1a2010"/><stop offset="100%" stop-color="#0a0e06"/></linearGradient>
            <linearGradient id="osk" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#6a8a3a"/><stop offset="100%" stop-color="#3a5a20"/></linearGradient>
            </defs>
            <rect width="80" height="100" fill="url(#obg)"/>
            <ellipse cx="40" cy="102" rx="38" ry="22" fill="#3f5a28" opacity=".4"/>
            <path d="M12 100 L20 58 Q40 48 60 58 L68 100Z" fill="#2a3a14"/>
            <path d="M20 60 L28 48 H52 L60 60" fill="#354818"/>
            <circle cx="40" cy="34" r="17" fill="url(#osk)"/>
            <path d="M24 46 L18 60 L28 50Z" fill="#f4e6c1"/>
            <path d="M56 46 L62 60 L52 50Z" fill="#f4e6c1"/>
            <path d="M22 28c4-12 32-12 36 0" fill="#2a3a14"/>
            <circle cx="33" cy="32" r="2.5" fill="#7a1f1f"/>
            <circle cx="47" cy="32" r="2.5" fill="#7a1f1f"/>
            <circle cx="33" cy="32" r="1" fill="#1a0808"/>
            <circle cx="47" cy="32" r="1" fill="#1a0808"/>
            <path d="M34 42 L40 46 L46 42" stroke="#2a4018" fill="none" stroke-width="1.5"/>
            <path d="M28 55 L40 72 L52 55" fill="none" stroke="#c9a227" stroke-width="1.5" opacity=".5"/>`
    };
    const hue = hueDe(nombre);
    const inner = razas[s] || `<defs>
        <linearGradient id="gbg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="hsl(${hue},35%,22%)"/><stop offset="100%" stop-color="hsl(${hue},40%,8%)"/></linearGradient>
        </defs>
        <rect width="80" height="100" fill="url(#gbg)"/>
        <ellipse cx="40" cy="102" rx="34" ry="20" fill="hsl(${hue},40%,30%)" opacity=".4"/>
        <circle cx="40" cy="42" r="24" fill="hsl(${hue},40%,28%)" stroke="#c9a227" stroke-width="2"/>
        <circle cx="40" cy="42" r="18" fill="hsl(${hue},35%,18%)"/>
        <text x="40" y="48" text-anchor="middle" fill="#e8d48b" font-size="16" font-family="serif" font-weight="bold">${escapeHtml((nombre || '?').slice(0, 2).toUpperCase())}</text>`;
    return `<svg viewBox="0 0 80 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${inner}</svg>`;
}

function svgIcono(nombre) {
    const s = slugify(nombre);
    const hue = hueDe(nombre);
    const id = 'g' + (++svgUid);
    const simbolos = {
        fuerza: `<path d="M28 42c0-10 5-16 12-16s12 6 12 16v10H28z" fill="#e8a060"/><rect x="26" y="50" width="28" height="10" rx="2" fill="#c9a227"/><path d="M32 28 L40 18 L48 28" fill="#f0c080"/>`,
        velocidad: `<path d="M42 14 L24 40h14l-8 22 28-30H42z" fill="#7ec8ff"/><path d="M42 14 L36 28h8z" fill="#b8e4ff"/>`,
        inteligencia: `<circle cx="40" cy="34" r="12" fill="none" stroke="#d4b3ff" stroke-width="3"/><path d="M40 46v10M32 56h16" stroke="#d4b3ff" stroke-width="3"/><circle cx="40" cy="34" r="4" fill="#e8d0ff"/>`,
        resistencia: `<path d="M40 14l20 8v16c0 16-10 26-20 30-10-4-20-14-20-30V22z" fill="#cfc4a8"/><path d="M40 20l12 5v10c0 10-6 16-12 19-6-3-12-9-12-19V25z" fill="#a89878"/>`,
        destruccion: `<path d="M40 12l8 16 18 2-13 12 4 18-17-9-17 9 4-18-13-12 18-2z" fill="#e05a4f"/><path d="M40 24l4 10 10 1-7 7 2 11-9-5-9 5 2-11-7-7 10-1z" fill="#ff8a7a"/>`,
        robo: `<path d="M28 30h24l6 10v22H22V40z" fill="#9a917f"/><path d="M34 30a6 6 0 0112 0" stroke="#e8d48b" stroke-width="2.5" fill="none"/><circle cx="40" cy="48" r="3" fill="#c9a227"/>`,
        fuego: `<path d="M40 12s16 14 16 30a16 16 0 11-32 0c0-10 10-20 16-30z" fill="#ff8c2a"/><path d="M40 28s8 8 8 16a8 8 0 11-16 0c0-5 5-10 8-16z" fill="#ffe060"/>`,
        hielo: `<path d="M40 12v48M18 24l44 24M62 24L18 48M40 18l12 6-12 6-12-6z" stroke="#d8f3ff" stroke-width="3.5" fill="none"/><circle cx="40" cy="36" r="5" fill="#a8e4ff"/>`,
        telepatia: `<circle cx="40" cy="36" r="7" fill="#d4b3ff"/><circle cx="40" cy="36" r="16" fill="none" stroke="#d4b3ff" stroke-width="2.5"/><circle cx="40" cy="36" r="26" fill="none" stroke="#d4b3ff" stroke-width="2" opacity=".45"/>`,
        invisibilidad: `<circle cx="40" cy="36" r="14" fill="none" stroke="#cfd8e6" stroke-width="3" stroke-dasharray="5 4"/><circle cx="40" cy="36" r="5" fill="#cfd8e6" opacity=".7"/>`,
        espada: `<rect x="37" y="12" width="6" height="36" fill="#dfe7f0"/><path d="M28 48h24l-3 8H31z" fill="#c9a227"/><rect x="36" y="56" width="8" height="12" fill="#8a7020"/><path d="M40 12l4 8h-8z" fill="#fff"/>`,
        escudo: `<path d="M40 12l22 8v18c0 18-12 28-22 32-10-4-22-14-22-32V20z" fill="#f0d48a"/><path d="M40 18l14 5v12c0 12-8 18-14 21-6-3-14-9-14-21V23z" fill="#c9a227"/>`,
        armadura: `<path d="M22 24h36l6 10v28H16V34z" fill="#b9c4ce"/><rect x="34" y="34" width="12" height="28" fill="#c9a227"/><path d="M22 24l8-8h20l8 8" fill="#d0d8e0"/>`,
        'varita-magica': `<path d="M22 58 L52 20" stroke="#d6b4ff" stroke-width="4"/><circle cx="54" cy="18" r="7" fill="#e8d48b"/><circle cx="54" cy="18" r="3" fill="#fff4c0"/>`
    };
    let clave = s;
    if (!simbolos[clave]) clave = Object.keys(simbolos).find(k => s.includes(k)) || '';
    const inner = simbolos[clave] || `<text x="40" y="44" text-anchor="middle" fill="#e8d48b" font-size="22" font-family="serif" font-weight="bold">${escapeHtml((nombre || '?').slice(0, 1).toUpperCase())}</text>`;
    return `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <defs>
            <radialGradient id="${id}" cx="35%" cy="28%">
                <stop offset="0%" stop-color="hsl(${hue},55%,38%)"/>
                <stop offset="100%" stop-color="hsl(${hue},50%,10%)"/>
            </radialGradient>
            <linearGradient id="${id}b" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#e8d48b"/>
                <stop offset="50%" stop-color="#c9a227"/>
                <stop offset="100%" stop-color="#6a5410"/>
            </linearGradient>
        </defs>
        <rect x="2" y="2" width="76" height="76" rx="4" fill="url(#${id})" stroke="url(#${id}b)" stroke-width="3"/>
        <rect x="6" y="6" width="68" height="68" rx="2" fill="none" stroke="rgba(240,216,120,0.2)" stroke-width="1"/>
        ${inner}
    </svg>`;
}

function urlRetrato(p) {
    if (p && p.imagen) return p.imagen;
    if (p && p.raza_imagen) return p.raza_imagen;
    const raza = catalogoCache.razas.find(r => r.id === p?.raza_id || r.nombre === p?.raza_nombre);
    return raza?.imagen || '';
}

function arteRetrato(nombre, imagenUrl) {
    if (imagenUrl) return `<img class="portrait-photo" src="${escapeHtml(imagenUrl)}" alt="${escapeHtml(nombre || '')}">`;
    return svgRaza(nombre || 'generic');
}

function arteMini(tipo, item) {
    if (item.imagen) return `<img src="${escapeHtml(item.imagen)}" alt="${escapeHtml(item.nombre)}">`;
    return tipo === 'razas' ? svgRaza(item.nombre) : svgIcono(item.nombre);
}

function trait(tipoLabel, nombre, tipo) {
    if (!nombre) return '';
    const item = (catalogoCache[tipo] || []).find(x => x.nombre === nombre);
    const icon = item?.imagen
        ? `<img src="${escapeHtml(item.imagen)}" alt="${escapeHtml(nombre)}">`
        : (tipo === 'razas' ? svgRaza(nombre) : svgIcono(nombre));
    return `<div class="trait"><div class="trait-icon">${icon}</div><div><small>${tipoLabel}</small><strong>${escapeHtml(nombre)}</strong></div></div>`;
}

async function subirImagen(file) {
    const fd = new FormData();
    fd.append('file', file);
    const response = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${getToken()}` },
        body: fd
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'No se pudo subir la imagen');
    return data.url;
}

function iniciarEmbers() {
    const root = document.getElementById('embers');
    if (!root) return;
    root.innerHTML = '';
    for (let i = 0; i < 26; i++) {
        const s = document.createElement('span');
        s.style.left = Math.random() * 100 + '%';
        s.style.animationDelay = (Math.random() * 9) + 's';
        s.style.animationDuration = (7 + Math.random() * 8) + 's';
        s.style.width = s.style.height = (3 + Math.random() * 4) + 'px';
        root.appendChild(s);
    }
}

async function login(event) {
    event.preventDefault();
    const gate = document.getElementById('gate');
    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nombre_usuario: document.getElementById('loginUser').value,
                password: document.getElementById('loginPass').value
            })
        });
        if (response.ok) {
            const data = await response.json();
            setToken(data.token, data.rol, data.usuario_id);
            window.location.href = data.rol === 'jugador' ? 'jugador.html' : 'gm.html';
        } else {
            document.getElementById('loginError').textContent = 'Credenciales inválidas';
            if (gate) { gate.classList.remove('shake'); void gate.offsetWidth; gate.classList.add('shake'); }
        }
    } catch (error) {
        document.getElementById('loginError').textContent = 'Error de conexión';
    }
}

async function registro(event) {
    event.preventDefault();
    try {
        const response = await fetch(`${API_URL}/registro`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nombre_usuario: document.getElementById('regUser').value,
                email: document.getElementById('regEmail').value,
                password: document.getElementById('regPass').value,
                rol: document.getElementById('regRol').value
            })
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
    if (!token) return;
    try {
        const [razas, habilidades, poderes, equipamiento, facciones] = await Promise.all([
            fetch(`${API_URL}/catalogo/razas`, { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json()),
            fetch(`${API_URL}/catalogo/habilidades`, { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json()),
            fetch(`${API_URL}/catalogo/poderes`, { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json()),
            fetch(`${API_URL}/catalogo/equipamiento`, { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json()),
            fetch(`${API_URL}/catalogo/facciones`, { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json())
        ]);
        catalogoCache = { razas, habilidades, poderes, equipamiento, facciones };
        poblarSelects(['razaSelect', 'editRazaSelect'], razas, 'Seleccione una raza');
        poblarSelects(['habilidad1Select', 'habilidad2Select', 'editHabilidad1Select', 'editHabilidad2Select'], habilidades, 'Seleccione una habilidad');
        poblarSelects(['poderSelect', 'editPoderSelect'], poderes, 'Seleccione un poder');
        poblarSelects(['equipamientoSelect', 'editEquipamientoSelect'], equipamiento, 'Seleccione equipamiento');
        poblarSelects(['faccionSelect', 'editFaccionSelect', 'faccionRaza'], facciones, 'Seleccione facción');
        renderPicker('hab1Picker', habilidades, 'habilidades', 'habilidad1Select');
        renderPicker('hab2Picker', habilidades, 'habilidades', 'habilidad2Select');
        renderPicker('poderPicker', poderes, 'poderes', 'poderSelect');
        renderPicker('equipoPicker', equipamiento, 'equipamiento', 'equipamientoSelect');
        pintarTableroFacciones();
        pintarCodex();
        updatePreview();
    } catch (error) {
        console.error('Error cargando catálogo', error);
    }
}

function pintarTableroFacciones() {
    const board = document.getElementById('factionBoard');
    if (!board) return;
    const facciones = catalogoCache.facciones || [];
    if (!facciones.length) {
        board.innerHTML = '<p class="error">El GM aún no creó facciones.</p>';
        return;
    }
    board.innerHTML = facciones.map(f => {
        const color = f.color || 'azul';
        const razas = (catalogoCache.razas || []).filter(r => String(r.faccion_id) === String(f.id));
        const slots = razas.map(r => `
            <button type="button" class="race-slot" data-raza="${r.id}" data-faccion="${f.id}" title="${escapeHtml(r.nombre)}">
                ${arteMini('razas', r)}
            </button>
        `).join('') || '<p style="font-size:.7rem;color:var(--muted);text-align:center">Sin razas</p>';
        return `<div class="faction-col ${escapeHtml(color)}">
            <h4>${escapeHtml(f.nombre)}</h4>
            <div class="race-stack">${slots}</div>
        </div>`;
    }).join('');
    board.querySelectorAll('.race-slot').forEach(btn => {
        btn.addEventListener('click', () => {
            board.querySelectorAll('.race-slot').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            const razaSel = document.getElementById('razaSelect');
            const facSel = document.getElementById('faccionSelect');
            if (razaSel) { razaSel.value = btn.dataset.raza; razaSel.dispatchEvent(new Event('change')); }
            if (facSel) { facSel.value = btn.dataset.faccion; }
            updatePreview();
        });
    });
    const actual = document.getElementById('razaSelect')?.value;
    if (actual) {
        const match = board.querySelector(`.race-slot[data-raza="${actual}"]`);
        if (match) match.classList.add('selected');
    } else {
        const first = board.querySelector('.race-slot');
        if (first) first.click();
    }
}

function mostrarVistaJugador(cual) {
    const forge = document.getElementById('crearPersonajeForm');
    const lista = document.getElementById('listaHeroes');
    if (!forge || !lista) return;
    const crear = cual !== 'lista';
    forge.hidden = !crear;
    lista.hidden = crear;
    if (!crear) cargarPersonajesJugador();
}

function poblarSelects(ids, datos, placeholder) {
    ids.forEach(id => {
        const select = document.getElementById(id);
        if (!select) return;
        select.innerHTML = `<option value="">${placeholder}</option>`;
        (datos || []).forEach(item => {
            const option = document.createElement('option');
            option.value = item.id;
            option.textContent = item.nombre;
            select.appendChild(option);
        });
    });
}

function renderPicker(containerId, items, tipo, selectId) {
    const el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = (items || []).map(item => `
        <button type="button" class="pick-card" data-id="${item.id}">
            <div class="mini-art">${arteMini(tipo, item)}</div>
            <span>${escapeHtml(item.nombre)}</span>
        </button>
    `).join('');
    el.querySelectorAll('.pick-card').forEach(btn => {
        btn.addEventListener('click', () => {
            el.querySelectorAll('.pick-card').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            const sel = document.getElementById(selectId);
            if (sel) { sel.value = btn.dataset.id; sel.dispatchEvent(new Event('change')); }
            updatePreview();
        });
    });
}

function selectedText(id) {
    const s = document.getElementById(id);
    if (!s || !s.value) return '';
    return s.options[s.selectedIndex]?.textContent || '';
}

function itemBySelect(tipo, selectId) {
    const id = document.getElementById(selectId)?.value;
    return (catalogoCache[tipo] || []).find(x => String(x.id) === String(id));
}

function pintarLore(elId, titulo, item, tipo) {
    const el = document.getElementById(elId);
    if (!el) return;
    if (!item) {
        el.innerHTML = `<header><h4>${titulo}</h4></header><p>Elegí una opción para ver su lore.</p>`;
        return;
    }
    const desc = item.descripcion || 'Sin lore cargado todavía.';
    el.innerHTML = `<header>
        <div class="mini-art">${arteMini(tipo, item)}</div>
        <h4>${escapeHtml(item.nombre)}</h4>
    </header><p>${escapeHtml(desc)}</p>`;
}

function updatePreview() {
    const stage = document.getElementById('heroStage');
    const razaItem = itemBySelect('razas', 'razaSelect');
    const faccionItem = itemBySelect('facciones', 'faccionSelect')
        || (catalogoCache.facciones || []).find(f => String(f.id) === String(razaItem?.faccion_id));
    const poderItem = itemBySelect('poderes', 'poderSelect');
    if (stage) {
        const foto = imagenPersonajePendiente || razaItem?.imagen || '';
        const nombreRaza = razaItem?.nombre || 'Humano';
        stage.innerHTML = `<div class="stage-hero">${foto ? `<img src="${escapeHtml(foto)}" alt="">` : svgRaza(nombreRaza)}</div>`;
        stage.onclick = () => document.getElementById('imagenPersonaje')?.click();
    }
    pintarLore('loreFaccion', 'Facción', faccionItem, 'facciones');
    pintarLore('loreRaza', 'Raza', razaItem, 'razas');
    pintarLore('lorePoder', 'Poder', poderItem, 'poderes');
    const facSel = document.getElementById('faccionSelect');
    if (facSel && razaItem?.faccion_id && !facSel.value) facSel.value = razaItem.faccion_id;
}

function pintarCodex() {
    const map = [
        ['galeriaFacciones', catalogoCache.facciones, 'facciones'],
        ['galeriaRazas', catalogoCache.razas, 'razas'],
        ['galeriaHabilidades', catalogoCache.habilidades, 'habilidades'],
        ['galeriaPoderes', catalogoCache.poderes, 'poderes'],
        ['galeriaEquipamiento', catalogoCache.equipamiento, 'equipamiento']
    ];
    map.forEach(([id, items, tipo]) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.innerHTML = (items || []).map(item => `
            <article class="codex-card">
                <div class="codex-art">${arteMini(tipo, item)}</div>
                <strong>${escapeHtml(item.nombre)}</strong>
                <div class="codex-actions">
                    <button type="button" class="btn-foto btn-edit-cat" data-tipo="${tipo}" data-id="${item.id}">Editar</button>
                    <button type="button" class="btn-foto btn-img-cat" data-tipo="${tipo}" data-id="${item.id}">Imagen</button>
                    <button type="button" class="btn-danger btn-del-cat" data-tipo="${tipo}" data-id="${item.id}">Borrar</button>
                </div>
            </article>
        `).join('');
        el.querySelectorAll('.btn-img-cat').forEach(btn => {
            btn.addEventListener('click', () => {
                catalogoEditTarget = { tipo: btn.dataset.tipo, id: btn.dataset.id };
                document.getElementById('imgCatalogoFile')?.click();
            });
        });
        el.querySelectorAll('.btn-edit-cat').forEach(btn => {
            btn.addEventListener('click', () => abrirModalCatalogo(btn.dataset.tipo, btn.dataset.id));
        });
        el.querySelectorAll('.btn-del-cat').forEach(btn => {
            btn.addEventListener('click', () => borrarCatalogo(btn.dataset.tipo, btn.dataset.id, btn.closest('article').querySelector('strong')?.textContent));
        });
    });
}

async function crearPersonaje(event) {
    event.preventDefault();
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
        equipamiento_id: parseInt(document.getElementById('equipamientoSelect').value),
        imagen: imagenPersonajePendiente || null,
        faccion_id: parseInt(document.getElementById('faccionSelect').value) || null
    };
    try {
        const response = await fetch(`${API_URL}/personajes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
            body: JSON.stringify(personaje)
        });
        if (response.ok) {
            document.getElementById('crearExito').textContent = 'Personaje creado exitosamente';
            document.getElementById('crearError').textContent = '';
            document.getElementById('crearPersonajeForm').reset();
            imagenPersonajePendiente = '';
            document.querySelectorAll('.picker .selected').forEach(b => b.classList.remove('selected'));
            updatePreview();
            setTimeout(() => cargarPersonajesJugador(), 400);
        } else {
            const data = await response.json();
            document.getElementById('crearError').textContent = data.error || 'Error al crear personaje';
        }
    } catch (error) {
        document.getElementById('crearError').textContent = 'Error de conexión';
    }
}

async function cargarPersonajesJugador() {
    try {
        const response = await fetch(`${API_URL}/personajes`, { headers: { 'Authorization': `Bearer ${getToken()}` } });
        mostrarPersonajes(await response.json(), 'personajesList', true);
    } catch (error) { console.error('Error cargando personajes', error); }
}
async function cargarTodosPersonajes() {
    try {
        const response = await fetch(`${API_URL}/personajes`, { headers: { 'Authorization': `Bearer ${getToken()}` } });
        mostrarPersonajes(await response.json(), 'todosPersonajesList', false);
    } catch (error) { console.error('Error cargando personajes', error); }
}

function mostrarPersonajes(personajes, containerId, esJugador) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    if (!personajes || personajes.length === 0) {
        container.innerHTML = '<p>No hay personajes todavía. ¡Crea el primero!</p>';
        return;
    }
    personajes.forEach((p, i) => {
        const card = document.createElement('div');
        const estado = p.estado || 'vivo';
        card.className = `personaje-card is-${estado}`;
        card.style.animationDelay = (i * 0.05) + 's';
        const raza = p.raza_nombre || 'Desconocida';
        const barra = Math.min(100, (Number(p.nivel) || 1) * 8);
        card.innerHTML = `
            <div class="portrait">
                <div class="portrait-box">${arteRetrato(raza, urlRetrato(p))}</div>
                <div class="level-badge">${escapeHtml(p.nivel)}</div>
            </div>
            <div class="card-body">
                <h4>${escapeHtml(p.nombre)}</h4>
                <p class="who">${p.faccion_nombre ? `<span class="faction-chip ${escapeHtml(p.faccion_color || '')}">${escapeHtml(p.faccion_nombre)}</span> ` : ''}${escapeHtml(raza)}${!esJugador ? ' · ' + escapeHtml(p.jugador || '') : ''}</p>
                <div class="level-bar"><span style="width:${barra}%"></span></div>
                <div class="trait-list">
                    ${trait('Habilidad', p.habilidad1, 'habilidades')}
                    ${trait('Habilidad', p.habilidad2, 'habilidades')}
                    ${trait('Hechizo', p.poder, 'poderes')}
                    ${trait('Equipo', p.equipamiento, 'equipamiento')}
                </div>
                <span class="estado ${estado}">${escapeHtml(labelEstado(estado))}</span>
            </div>
        `;
        if (esJugador && estado !== 'muerto') {
            const btn = document.createElement('button');
            btn.textContent = 'Editar';
            btn.addEventListener('click', () => abrirModalEditar(p));
            card.querySelector('.card-body').appendChild(btn);
        }
        if (!esJugador) {
            const btn = document.createElement('button');
            btn.textContent = 'Administrar';
            btn.addEventListener('click', () => abrirModalGM(p));
            card.querySelector('.card-body').appendChild(btn);
        }
        const btnDel = document.createElement('button');
        btnDel.textContent = 'Eliminar';
        btnDel.className = 'btn-danger';
        btnDel.addEventListener('click', () => borrarPersonaje(p.id, p.nombre, esJugador));
        card.querySelector('.card-body').appendChild(btnDel);
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
    const ef = document.getElementById('editFaccionSelect');
    if (ef) ef.value = personaje.faccion_id || '';
    document.getElementById('editError').textContent = '';
    imagenEdicionPendiente = personaje.imagen || '';
    const thumb = document.getElementById('editImagenPreview');
    if (thumb) {
        if (imagenEdicionPendiente) {
            thumb.src = imagenEdicionPendiente;
            thumb.style.display = 'block';
        } else {
            thumb.removeAttribute('src');
            thumb.style.display = 'none';
        }
    }
    document.getElementById('editImagen').value = '';
    document.getElementById('modalEditar').style.display = 'block';
}
function cerrarModal() { document.getElementById('modalEditar').style.display = 'none'; }

async function guardarEdicionPersonaje(event) {
    event.preventDefault();
    const habilidad1 = parseInt(document.getElementById('editHabilidad1Select').value);
    const habilidad2 = parseInt(document.getElementById('editHabilidad2Select').value);
    if (habilidad1 === habilidad2) {
        document.getElementById('editError').textContent = 'Las habilidades deben ser diferentes';
        return;
    }
    const payload = {
        nombre: document.getElementById('editNombre').value,
        raza_id: parseInt(document.getElementById('editRazaSelect').value),
        habilidad1_id: habilidad1,
        habilidad2_id: habilidad2,
        poder_id: parseInt(document.getElementById('editPoderSelect').value),
        equipamiento_id: parseInt(document.getElementById('editEquipamientoSelect').value),
        faccion_id: parseInt(document.getElementById('editFaccionSelect').value) || null
    };
    if (imagenEdicionPendiente) payload.imagen = imagenEdicionPendiente;
    try {
        const response = await fetch(`${API_URL}/personajes/${document.getElementById('editPersonajeId').value}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
            body: JSON.stringify(payload)
        });
        if (response.ok) { cerrarModal(); cargarPersonajesJugador(); }
        else {
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
    document.getElementById('gmNivelInput').value = personaje.nivel || 1;
    document.getElementById('gmError').textContent = '';
    pintarEstadosGM(personaje.estado || 'vivo');
    document.getElementById('modalGM').style.display = 'block';
}
function cerrarModalGM() { document.getElementById('modalGM').style.display = 'none'; }

async function borrarPersonaje(id, nombre, esJugador) {
    if (!confirm(`¿Eliminar a ${nombre}? Esta acción no se puede deshacer.`)) return;
    try {
        const response = await fetch(`${API_URL}/personajes/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            alert(data.error || 'No se pudo eliminar');
            return;
        }
        if (esJugador) cargarPersonajesJugador();
        else cargarTodosPersonajes();
    } catch (err) {
        alert('Error de conexión');
    }
}

function abrirModalCatalogo(tipo, id) {
    const item = (catalogoCache[tipo] || []).find(x => String(x.id) === String(id));
    if (!item) return;
    document.getElementById('catEditTipo').value = tipo;
    document.getElementById('catEditId').value = id;
    document.getElementById('catEditNombre').value = item.nombre || '';
    document.getElementById('catalogoEditTitulo').textContent = 'Editar ' + tipo;
    document.getElementById('catEditError').textContent = '';
    document.getElementById('catEditImagen').value = '';
    const extra = document.getElementById('catEditExtra');
    extra.innerHTML = '';
    if (tipo === 'facciones') {
        extra.innerHTML = `<label>Color</label>
            <select id="catEditColor">
                <option value="azul">Azul</option>
                <option value="rojo">Rojo</option>
                <option value="verde">Verde</option>
                <option value="violeta">Violeta</option>
                <option value="oro">Oro</option>
            </select>
            <label>Descripción</label>
            <input type="text" id="catEditDesc" value="${escapeHtml(item.descripcion || '')}">`;
        document.getElementById('catEditColor').value = item.color || 'azul';
    } else if (tipo === 'razas') {
        const opts = (catalogoCache.facciones || []).map(f =>
            `<option value="${f.id}" ${String(f.id) === String(item.faccion_id) ? 'selected' : ''}>${escapeHtml(f.nombre)}</option>`
        ).join('');
        extra.innerHTML = `<label>Facción</label>
            <select id="catEditFaccion"><option value="">Sin facción</option>${opts}</select>
            <label>Descripción</label>
            <input type="text" id="catEditDesc" value="${escapeHtml(item.descripcion || '')}">`;
    } else if (tipo === 'poderes') {
        extra.innerHTML = `<label>Descripción</label>
            <input type="text" id="catEditDesc" value="${escapeHtml(item.descripcion || '')}">`;
    }
    document.getElementById('modalCatalogo').style.display = 'block';
}

function cerrarModalCatalogo() {
    const m = document.getElementById('modalCatalogo');
    if (m) m.style.display = 'none';
}

async function guardarCatalogo(event) {
    event.preventDefault();
    const tipo = document.getElementById('catEditTipo').value;
    const id = document.getElementById('catEditId').value;
    const payload = { nombre: document.getElementById('catEditNombre').value };
    const color = document.getElementById('catEditColor');
    const desc = document.getElementById('catEditDesc');
    const fac = document.getElementById('catEditFaccion');
    if (color) payload.color = color.value;
    if (desc) payload.descripcion = desc.value;
    if (fac) payload.faccion_id = fac.value ? parseInt(fac.value) : null;
    try {
        const file = document.getElementById('catEditImagen')?.files?.[0];
        if (file) payload.imagen = await subirImagen(file);
        const response = await fetch(`${API_URL}/catalogo/${tipo}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            document.getElementById('catEditError').textContent = data.error || 'No se pudo guardar';
            return;
        }
        cerrarModalCatalogo();
        cargarCatalogo();
    } catch (err) {
        document.getElementById('catEditError').textContent = err.message || 'Error de conexión';
    }
}

async function borrarCatalogo(tipo, id, nombre) {
    if (!confirm(`¿Borrar ${nombre || 'este ítem'} del catálogo?`)) return;
    try {
        const response = await fetch(`${API_URL}/catalogo/${tipo}/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            alert(data.error || 'No se pudo borrar');
            return;
        }
        cargarCatalogo();
    } catch (err) {
        alert('Error de conexión');
    }
}

async function guardarAdminGM(event) {
    event.preventDefault();
    const estado = document.getElementById('gmEstadoSelect').value;
    const nivel = parseInt(document.getElementById('gmNivelInput').value, 10);
    if (!estado || isNaN(nivel) || nivel < 1) {
        document.getElementById('gmError').textContent = 'Estado y nivel válidos son requeridos (nivel ≥ 1)';
        return;
    }
    try {
        const response = await fetch(`${API_URL}/personajes/${document.getElementById('gmPersonajeId').value}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
            body: JSON.stringify({ estado, nivel })
        });
        if (response.ok) { cerrarModalGM(); cargarTodosPersonajes(); }
        else {
            const data = await response.json().catch(() => ({}));
            document.getElementById('gmError').textContent = data.error || 'Error al actualizar';
        }
    } catch (error) {
        document.getElementById('gmError').textContent = 'Error de conexión';
    }
}

function mostrarTab(tabName, event) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    const tab = document.getElementById(tabName === 'personajes' ? 'personajesTab' : 'catalogoTab');
    if (tab) tab.classList.add('active');
    if (event && event.target) event.target.classList.add('active');
}

async function altaCatalogo(event, url, nombreId, imgId, formId, errorId, msg) {
    event.preventDefault();
    try {
        const file = document.getElementById(imgId)?.files?.[0];
        const imagen = file ? await subirImagen(file) : null;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
            body: JSON.stringify({ nombre: document.getElementById(nombreId).value, imagen })
        });
        if (response.ok) {
            document.getElementById(formId).reset();
            document.getElementById(errorId).textContent = '';
            cargarCatalogo();
        } else {
            document.getElementById(errorId).textContent = msg;
        }
    } catch (error) {
        document.getElementById(errorId).textContent = error.message || 'Error de conexión';
    }
}

async function agregarRaza(event) {
    event.preventDefault();
    try {
        const file = document.getElementById('imgRaza')?.files?.[0];
        const imagen = file ? await subirImagen(file) : null;
        const faccion_id = parseInt(document.getElementById('faccionRaza')?.value) || null;
        const response = await fetch(`${API_URL}/catalogo/razas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
            body: JSON.stringify({
                nombre: document.getElementById('nombreRaza').value,
                imagen,
                faccion_id,
                descripcion: document.getElementById('descRaza')?.value || ''
            })
        });
        if (response.ok) {
            document.getElementById('agregarRazaForm').reset();
            document.getElementById('razaError').textContent = '';
            cargarCatalogo();
        } else {
            document.getElementById('razaError').textContent = 'La raza ya existe';
        }
    } catch (error) {
        document.getElementById('razaError').textContent = error.message || 'Error de conexión';
    }
}
async function agregarFaccion(event) {
    event.preventDefault();
    try {
        const file = document.getElementById('imgFaccion')?.files?.[0];
        const imagen = file ? await subirImagen(file) : null;
        const response = await fetch(`${API_URL}/catalogo/facciones`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
            body: JSON.stringify({
                nombre: document.getElementById('nombreFaccion').value,
                color: document.getElementById('colorFaccion').value,
                descripcion: document.getElementById('descFaccion').value,
                imagen
            })
        });
        if (response.ok) {
            document.getElementById('agregarFaccionForm').reset();
            document.getElementById('faccionError').textContent = '';
            cargarCatalogo();
        } else {
            document.getElementById('faccionError').textContent = 'La facción ya existe';
        }
    } catch (error) {
        document.getElementById('faccionError').textContent = error.message || 'Error de conexión';
    }
}
async function agregarHabilidad(event) {
    await altaCatalogo(event, `${API_URL}/catalogo/habilidades`, 'nombreHabilidad', 'imgHabilidad', 'agregarHabilidadForm', 'habilidadError', 'La habilidad ya existe');
}
async function agregarPoder(event) {
    event.preventDefault();
    try {
        const file = document.getElementById('imgPoder')?.files?.[0];
        const imagen = file ? await subirImagen(file) : null;
        const response = await fetch(`${API_URL}/catalogo/poderes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
            body: JSON.stringify({
                nombre: document.getElementById('nombrePoder').value,
                imagen,
                descripcion: document.getElementById('descPoder')?.value || ''
            })
        });
        if (response.ok) {
            document.getElementById('agregarPoderForm').reset();
            document.getElementById('poderError').textContent = '';
            cargarCatalogo();
        } else {
            document.getElementById('poderError').textContent = 'El poder ya existe';
        }
    } catch (error) {
        document.getElementById('poderError').textContent = error.message || 'Error de conexión';
    }
}
async function agregarEquipamiento(event) {
    await altaCatalogo(event, `${API_URL}/catalogo/equipamiento`, 'nombreEquipamiento', 'imgEquipamiento', 'agregarEquipamientoForm', 'equipamientoError', 'El equipamiento ya existe');
}

window.cerrarModal = cerrarModal;
window.cerrarModalGM = cerrarModalGM;
window.cerrarModalCatalogo = cerrarModalCatalogo;
window.logout = logout;
window.mostrarLogin = mostrarLogin;
window.mostrarRegistro = mostrarRegistro;
window.mostrarTab = mostrarTab;
window.mostrarVistaJugador = mostrarVistaJugador;

document.addEventListener('DOMContentLoaded', () => {
    iniciarEmbers();
    if (document.getElementById('loginForm')) document.getElementById('loginForm').addEventListener('submit', login);
    if (document.getElementById('registroForm')) document.getElementById('registroForm').addEventListener('submit', registro);
    if (document.getElementById('crearPersonajeForm')) document.getElementById('crearPersonajeForm').addEventListener('submit', crearPersonaje);
    if (document.getElementById('editarPersonajeForm')) document.getElementById('editarPersonajeForm').addEventListener('submit', guardarEdicionPersonaje);
    if (document.getElementById('gmAdminForm')) document.getElementById('gmAdminForm').addEventListener('submit', guardarAdminGM);
    if (document.getElementById('editarCatalogoForm')) document.getElementById('editarCatalogoForm').addEventListener('submit', guardarCatalogo);
    if (document.getElementById('agregarRazaForm')) document.getElementById('agregarRazaForm').addEventListener('submit', agregarRaza);
    if (document.getElementById('agregarFaccionForm')) document.getElementById('agregarFaccionForm').addEventListener('submit', agregarFaccion);
    if (document.getElementById('agregarHabilidadForm')) document.getElementById('agregarHabilidadForm').addEventListener('submit', agregarHabilidad);
    if (document.getElementById('agregarPoderForm')) document.getElementById('agregarPoderForm').addEventListener('submit', agregarPoder);
    if (document.getElementById('agregarEquipamientoForm')) document.getElementById('agregarEquipamientoForm').addEventListener('submit', agregarEquipamiento);

    const nombre = document.getElementById('nombrePersonaje');
    if (nombre) nombre.addEventListener('input', updatePreview);
    ['razaSelect', 'habilidad1Select', 'habilidad2Select', 'poderSelect', 'equipamientoSelect', 'faccionSelect'].forEach(id => {
        document.getElementById(id)?.addEventListener('change', updatePreview);
    });

    document.getElementById('imagenPersonaje')?.addEventListener('change', async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            imagenPersonajePendiente = await subirImagen(file);
            updatePreview();
        } catch (err) {
            alert(err.message);
        }
    });

    document.getElementById('editImagen')?.addEventListener('change', async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            imagenEdicionPendiente = await subirImagen(file);
            const thumb = document.getElementById('editImagenPreview');
            if (thumb) { thumb.src = imagenEdicionPendiente; thumb.style.display = 'block'; }
        } catch (err) {
            document.getElementById('editError').textContent = err.message;
        }
    });

    document.getElementById('imgCatalogoFile')?.addEventListener('change', async (e) => {
        const file = e.target.files?.[0];
        const target = catalogoEditTarget;
        e.target.value = '';
        if (!file || !target) return;
        try {
            const url = await subirImagen(file);
            const response = await fetch(`${API_URL}/catalogo/${target.tipo}/${target.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
                body: JSON.stringify({ imagen: url })
            });
            if (!response.ok) throw new Error('No se pudo guardar la imagen');
            cargarCatalogo();
        } catch (err) {
            alert(err.message);
        }
    });

    if (document.getElementById('gmEstadoSelect')) pintarEstadosGM('vivo');
    if (document.getElementById('personajesList')) { cargarCatalogo(); cargarPersonajesJugador(); }
    if (document.getElementById('todosPersonajesList')) { cargarCatalogo(); cargarTodosPersonajes(); }
});