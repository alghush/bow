// ============================================================
//  BOW — horarios.js
//  Única fuente de verdad para horarios, feriados y puentes.
//  Lo usan: el acordeón del index, la carta de Bow y el formulario.
//  Todo se calcula con la hora de Argentina, no la del dispositivo.
// ============================================================
const Horarios = (() => {

  // ==========================================================
  //  ✏️ CONFIGURACIÓN — lo único que se toca
  // ==========================================================

  const ZONA = "America/Argentina/Buenos_Aires";

  // Cada cuántos minutos se ofrece un horario en el formulario
  const INTERVALO_MIN = 10;

  // Para reservas del mismo día: no se ofrece un horario que empiece
  // en menos de X minutos desde ahora (0 = solo se ocultan los pasados)
  const MARGEN_MIN = 10;

  // Feriados fijos. Revisar mes por mes.
  const FERIADOS = [
    "2026-11-20",   // ⚠️ cae viernes: ¿se traslada al lunes 2026-11-23?
    "2026-12-08",
    "2026-12-25"
    // ...completar el resto del año
  ];

  // Puentes: están cargados pero APAGADOS. Poné activo: true
  // cuando el local decida tratar ese día como feriado.
  // ⚠️ Verificar las fechas contra el decreto oficial.
  const PUENTES = [
    { fecha: "2026-03-23", activo: false },
    { fecha: "2026-07-10", activo: false },
    { fecha: "2026-12-07", activo: false }
  ];

  // TABLA 1 — Qué se muestra (carta de Bow y acordeón del index).
  // Lo que no entre en ningún tramo (20:00 a 7:00) muestra "restaurant".
  // "mediodia" se resuelve según el día: ejecutivo o restaurant.
  const CARTA = [
    { desde: "07:00", hasta: "12:00", seccion: "desayuno" },
    { desde: "12:00", hasta: "16:00", seccion: "mediodia" },
    { desde: "16:00", hasta: "20:00", seccion: "desayuno" }
  ];

  // TABLA 2 — Qué se puede reservar (formulario).
  // "ultima" es el último horario que se ofrece, no el cierre de la franja.
  const RESERVAS = {
    bow: [
      { id: "desayuno", nombre: "Desayuno",
        desde: "07:00", ultima: "11:30" },
      { id: "mediodia", nombre: { habil: "Menú ejecutivo", especial: "Almuerzo" },
        desde: "12:00", ultima: "15:30" },
      { id: "merienda", nombre: "Merienda",
        desde: "16:00", ultima: "19:30" },
      { id: "cena", nombre: "Cena",
        desde: "20:00", ultima: "22:30" }
    ],
    // ⚠️ PROVISORIO: Rooftop reserva desde las 18:00; falta confirmar
    // el último horario y si cambia entre semana y fin de semana.
    rooftop: [
      { id: "noche", nombre: "Noche",
        desde: "18:00", ultima: "23:00" }
    ]
  };

  // ==========================================================
  //  AUXILIARES (no tocar)
  // ==========================================================

  // "07:30" → 450 (minutos desde medianoche)
  const aMinutos = (hhmm) => {
    const [h, m] = hhmm.split(":").map(Number);
    return h * 60 + m;
  };

  // 450 → "07:30"
  const aHHMM = (min) =>
    String(Math.floor(min / 60)).padStart(2, "0") + ":" +
    String(min % 60).padStart(2, "0");

  // Fecha y hora actuales en Argentina: { fecha: "2026-11-02", minutos: 850 }
  function ahora() {
    const partes = new Intl.DateTimeFormat("en-CA", {
      timeZone: ZONA, hourCycle: "h23",
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit"
    }).formatToParts(new Date());
    const p = Object.fromEntries(partes.map(x => [x.type, x.value]));
    return {
      fecha: `${p.year}-${p.month}-${p.day}`,
      minutos: Number(p.hour) * 60 + Number(p.minute)
    };
  }

  // ¿Sábado, domingo, feriado o puente activo?
  function esDiaEspecial(fecha) {
    const [a, m, d] = fecha.split("-").map(Number);
    const dia = new Date(a, m - 1, d).getDay();   // fecha local, sin pasar por UTC
    if (dia === 0 || dia === 6) return true;
    if (FERIADOS.includes(fecha)) return true;
    return PUENTES.some(p => p.activo && p.fecha === fecha);
  }

  // ==========================================================
  //  FUNCIONES PÚBLICAS
  // ==========================================================

  // Sección de la carta que corresponde a esa fecha y hora:
  // "desayuno" | "menu-ejecutivo" | "restaurant"
  function seccionVisible(fecha, minutos) {
    const tramo = CARTA.find(t =>
      minutos >= aMinutos(t.desde) && minutos < aMinutos(t.hasta));
    if (!tramo) return "restaurant";
    if (tramo.seccion === "mediodia") {
      return esDiaEspecial(fecha) ? "restaurant" : "menu-ejecutivo";
    }
    return tramo.seccion;
  }

  // Franjas y horarios reservables para una fecha elegida:
  // [{ id, nombre, horarios: ["12:00", "12:30", ...] }, ...]
  function franjasReservables(fecha, destino = "bow") {
    const hoy = ahora();
    if (fecha < hoy.fecha) return [];             // fecha pasada
    const esHoy = fecha === hoy.fecha;
    const especial = esDiaEspecial(fecha);

    return (RESERVAS[destino] || []).map(f => {
      const horarios = [];
      for (let t = aMinutos(f.desde); t <= aMinutos(f.ultima); t += INTERVALO_MIN) {
        if (esHoy && t < hoy.minutos + MARGEN_MIN) continue;
        horarios.push(aHHMM(t));
      }
      const nombre = typeof f.nombre === "string"
        ? f.nombre
        : (especial ? f.nombre.especial : f.nombre.habil);
      return { id: f.id, nombre, horarios };
    }).filter(f => f.horarios.length > 0);
  }

  return { ahora, esDiaEspecial, seccionVisible, franjasReservables };
})();

// Solo para poder probarlo con Node; el navegador lo ignora
if (typeof module !== "undefined") module.exports = Horarios;