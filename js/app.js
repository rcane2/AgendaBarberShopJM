// ===== Estado en memoria =====
let citas = [];

// ===== Utilidades de fecha/hora =====
function hoyISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function generarHorasTrabajo() {
  const horas = [];
  // Jornada de 09:00 a 18:00, incrementos de 30 min
  for (let h = 9; h <= 18; h++) {
    horas.push(`${h}:00`);
    if (h < 18) horas.push(`${h}:30`);
  }
  return horas;
}

function aMinutos(horaStr) {
  const [h, m] = horaStr.split(":").map(Number);
  return h * 60 + m;
}

// ===== Cargar horas disponibles (futuras y libres) =====
function cargarHoras() {
  const fecha = document.getElementById("fecha").value;
  const horaSelect = document.getElementById("hora");
  horaSelect.innerHTML = "";
  if (!fecha) return;

  const todas = generarHorasTrabajo();
  const ocupadas = new Set(citas.filter(c => c.fecha === fecha).map(c => c.hora));

  const ahora = new Date();
  const hoy = hoyISO();
  const ahoraMin = ahora.getHours() * 60 + ahora.getMinutes();

  const candidatas = todas.filter(h => {
    if (fecha === hoy && aMinutos(h) <= ahoraMin) return false;
    return !ocupadas.has(h);
  });

  if (candidatas.length === 0) {
    const opt = document.createElement("option");
    opt.textContent = "No hay horarios disponibles";
    opt.disabled = true;
    horaSelect.appendChild(opt);
  } else {
    candidatas.forEach(h => {
      const opt = document.createElement("option");
      opt.value = h;
      opt.textContent = h;
      horaSelect.appendChild(opt);
    });
  }
}

// ===== Inicialización =====
document.addEventListener("DOMContentLoaded", () => {
  const fechaEl = document.getElementById("fecha");
  fechaEl.min = hoyISO();
  fechaEl.value = hoyISO();
  cargarHoras();
});

document.getElementById("fecha").addEventListener("change", cargarHoras);

// ===== Reserva de citas con confirmación y WhatsApp =====
const citaForm = document.getElementById("citaForm");
const mensajeConfirmacion = document.getElementById("mensajeConfirmacion");
const btnWhatsapp = document.getElementById("btnWhatsapp");

citaForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const nombre = document.getElementById("nombre").value.trim();
  const celular = document.getElementById("celular").value.trim();
  const fecha = document.getElementById("fecha").value;
  const estilista = document.getElementById("estilista").value;
  const servicio = document.getElementById("servicio").value;
  const duracion = document.getElementById("duracion").value;
  const hora = document.getElementById("hora").value;

  // Validaciones
  if (!nombre || !celular || !fecha || !estilista || !servicio || !duracion || !hora) {
    alert("Por favor completa todos los campos.");
    return;
  }

  // Validar celular: 10 dígitos numéricos
  const regexCel = /^[0-9]{10}$/;
  if (!regexCel.test(celular)) {
    alert("Ingresa un número de celular válido (10 dígitos). Ejemplo: 3001234567");
    return;
  }

  // Evitar doble reserva en misma fecha y hora
  const yaOcupada = citas.some(c => c.fecha === fecha && c.hora === hora);
  if (yaOcupada) {
    alert("Esa hora ya está ocupada. Elige otra.");
    cargarHoras();
    return;
  }

  // Guardar cita
  const cita = { id: Date.now(), nombre, celular, fecha, estilista, servicio, duracion, hora };
  citas.push(cita);

  // Confirmación en pantalla
  mensajeConfirmacion.textContent = `✅ Cita reservada con éxito para ${nombre} a las ${hora}`;

  // Mensaje para WhatsApp (chat directo al número del cliente)
  const mensaje =
    `Hola ${nombre}, tu cita está confirmada:\n` +
    `📅 Fecha: ${fecha}\n` +
    `🕘 Hora: ${hora}\n` +
    `💈 Servicio: ${servicio}\n` +
    `✂️ Estilista: ${estilista}\n` +
    `📱 Celular: ${celular}`;

  // Formato internacional: prefijo 57 + número ingresado (sin signos)
  const url = `https://api.whatsapp.com/send?phone=57${celular}&text=${encodeURIComponent(mensaje)}`;

  btnWhatsapp.style.display = "inline-block";
  btnWhatsapp.onclick = () => window.open(url, "_blank");

  // Reset y refrescar disponibilidad
  citaForm.reset();
  document.getElementById("fecha").value = hoyISO();
  cargarHoras();
  renderCitas();
});

// ===== Login de administrador =====
const loginBtn = document.getElementById("loginBtn");
const adminPassInput = document.getElementById("adminPass");
const adminSection = document.getElementById("adminSection");
const PASS_ADMIN = "admin123";

loginBtn.addEventListener("click", () => {
  if (adminPassInput.value === PASS_ADMIN) {
    adminSection.style.display = "block";
    alert("Acceso concedido.");
    // Prellenar filtro con hoy si existe
    const filtroFechaEl = document.getElementById("filtroFecha");
    if (filtroFechaEl) filtroFechaEl.value = hoyISO();
    renderCitas();
  } else {
    adminSection.style.display = "none";
    alert("Contraseña incorrecta.");
  }
});

// ===== Módulo administrador: listar, editar, eliminar =====
const listaCitasEl = document.getElementById("listaCitas");
const vacioEl = document.getElementById("vacio");
const filtroFechaEl = document.getElementById("filtroFecha");

function renderCitas() {
  if (!listaCitasEl || !vacioEl) return;

  // Filtrar por fecha si está definida
  let data = [...citas];
  const filtro = filtroFechaEl ? filtroFechaEl.value : "";
  if (filtro) data = data.filter(c => c.fecha === filtro);

  // Ordenar por fecha y hora
  data.sort((a, b) => {
    if (a.fecha === b.fecha) return aMinutos(a.hora) - aMinutos(b.hora);
    return a.fecha.localeCompare(b.fecha);
  });

  listaCitasEl.innerHTML = "";

  if (data.length === 0) {
    vacioEl.style.display = "block";
    return;
  }
  vacioEl.style.display = "none";

  data.forEach(cita => {
    const li = document.createElement("li");
    li.textContent = `${cita.fecha} - ${cita.hora} | ${cita.nombre} (${cita.servicio}) con ${cita.estilista}`;

    const btnEdit = document.createElement("button");
    btnEdit.className = "action edit";
    btnEdit.textContent = "Editar";
    btnEdit.onclick = () => editarCita(cita.id);

    const btnDelete = document.createElement("button");
    btnDelete.className = "action delete";
    btnDelete.textContent = "Eliminar";
    btnDelete.onclick = () => eliminarCita(cita.id);

    li.appendChild(btnEdit);
    li.appendChild(btnDelete);
    listaCitasEl.appendChild(li);
  });
}

if (filtroFechaEl) {
  filtroFechaEl.addEventListener("change", renderCitas);
}

function editarCita(id) {
  const cita = citas.find(c => c.id === id);
  if (!cita) return;

  const nuevoServicio = prompt("Editar servicio:", cita.servicio);
  if (nuevoServicio && nuevoServicio.trim()) {
    cita.servicio = nuevoServicio.trim();
  }

  // Cambiar hora: solo horas libres en esa fecha (o su propia hora)
  const horasDisponibles = generarHorasTrabajo().filter(h => {
    if (h === cita.hora) return true;
    const ocupada = citas.some(c => c.fecha === cita.fecha && c.hora === h && c.id !== cita.id);
    return !ocupada;
  });

  const nuevaHora = prompt(`Editar hora (opciones: ${horasDisponibles.join(", ")}):`, cita.hora);
  if (nuevaHora && horasDisponibles.includes(nuevaHora)) {
    cita.hora = nuevaHora;
  }

  renderCitas();
  cargarHoras();
}

function eliminarCita(id) {
  citas = citas.filter(c => c.id !== id);
  renderCitas();
  cargarHoras();
}