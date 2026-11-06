// ============================================================
//  BOW — reservas.js
//  Modal de reservas compartido (index.html y bown.html).
//  Requiere js/horarios.js cargado ANTES.
//  Un solo modal, un solo número de WhatsApp. El mensaje dice
//  si la reserva es de Bow o de Rooftop.
// ============================================================
(() => {

  // ==========================================================
  //  ✏️ CONFIGURACIÓN
  // ==========================================================

  // Formato: 549 + código de área sin 0 + número sin 15
  const WA_NUMBER = "5493415608330";

  const DESTINOS = {
    bow:     { nombre: "BOW Café & Bistró", titulo: "RESERVAR EN BOW",     conSector: true  },
    rooftop: { nombre: "BOW Rooftop",       titulo: "RESERVAR EN ROOFTOP", conSector: false }
  };

  // Ids y selectores del HTML del modal. Si en tu HTML se llaman
  // distinto, se cambia acá y en ningún otro lado.
  const SEL = {
    overlay:      "#modal-reserva-overlay",
    titulo:       "#reserva-titulo",
    pasoForm:     "#reserva-paso-form",
    pasoAviso:    "#reserva-paso-aviso",
    nombre:       "#reserva-nombre",
    fecha:        "#reserva-fecha",
    franja:       "#reserva-franja",
    hora:         "#reserva-hora",
    adultos:      "#reserva-adultos",
    ninos:        "#reserva-ninos",
    sectorBloque: "#reserva-sector-bloque",
    sectorBtn:    ".sector-btn",
    error:        "#reserva-error",
    resumen:      "#reserva-resumen",
    enviar:       "#reserva-enviar",
    whatsapp:     "#reserva-whatsapp",
    logo:         "#reserva-logo"
  };

  // Atributos que se ponen en los botones del sitio
  //   data-reserva="bow" | "rooftop" | "auto"   abre el modal
  //   data-reserva-cerrar                       lo cierra
  //   data-reserva-volver                       vuelve del aviso al formulario

  // ==========================================================
  //  ESTADO Y ATAJOS
  // ==========================================================

  let destino = "bow";
  let sector  = "Adentro";

  const $ = (clave) => document.querySelector(SEL[clave]);

  // ==========================================================
  //  DESTINO
  // ==========================================================

  // "auto" = la vista (<main>) que está visible. Se usa en el
  // botón flotante de bown.html. En el index se indica a mano.
  function destinoDeLaVista() {
    const visible = Array.from(document.querySelectorAll("main"))
      .find(m => !m.hidden && !m.parentElement.closest("main"));
    return visible && visible.id === "rooftop" ? "rooftop" : "bow";
  }

  // ==========================================================
  //  ABRIR / CERRAR
  // ==========================================================

  function abrirReserva(quien) {
    destino = quien === "auto" || !DESTINOS[quien] ? destinoDeLaVista() : quien;
    const cfg = DESTINOS[destino];

    const logo = $("logo");
if (logo) {
  const src = logo.getAttribute("data-logo-" + destino);   // data-logo-bow | data-logo-rooftop
  if (src) logo.setAttribute("src", src);
  logo.alt = cfg.nombre;
}

    $("titulo").textContent = cfg.titulo;
    $("sectorBloque").hidden = !cfg.conSector;       // Rooftop no tiene sector

    $("fecha").min = Horarios.ahora().fecha;         // no se puede elegir el pasado
    mostrarError("");
    mostrarPaso("form");
    cargarFranjas();

    $("overlay").classList.add("activo");
  }

  function cerrarReserva() {
    $("overlay").classList.remove("activo");
  }

  function mostrarPaso(paso) {
    $("pasoForm").hidden  = paso !== "form";
    $("pasoAviso").hidden = paso !== "aviso";
  }

  function mostrarError(texto) {
    const el = $("error");
    el.textContent = texto;
    el.hidden = !texto;
  }

  // ==========================================================
  //  FRANJAS Y HORARIOS (salen de horarios.js)
  // ==========================================================

  function llenarSelect(select, opciones, vacio) {
    select.innerHTML = "";
    const base = document.createElement("option");
    base.value = "";
    base.textContent = vacio;
    select.appendChild(base);
    opciones.forEach(({ valor, texto }) => {
      const o = document.createElement("option");
      o.value = valor;
      o.textContent = texto;
      select.appendChild(o);
    });
  }

  // Se llama al abrir y cada vez que cambia la fecha
  function cargarFranjas() {
    const fecha = $("fecha").value;
    if (!fecha) {
      llenarSelect($("franja"), [], "Primero elegí la fecha");
      llenarSelect($("hora"),   [], "Elegí una franja");
      return;
    }
    const franjas = Horarios.franjasReservables(fecha, destino);
    llenarSelect(
      $("franja"),
      franjas.map(f => ({ valor: f.id, texto: f.nombre })),
      franjas.length ? "Elegí una franja" : "Sin horarios disponibles"
    );
    llenarSelect($("hora"), [], "Elegí una franja");
  }

  // Se llama cuando cambia la franja
  function cargarHorarios() {
    const franjas = Horarios.franjasReservables($("fecha").value, destino);
    const f = franjas.find(x => x.id === $("franja").value);
    llenarSelect(
      $("hora"),
      f ? f.horarios.map(h => ({ valor: h, texto: h })) : [],
      "Elegí un horario"
    );
  }

  // ==========================================================
  //  VALIDAR Y ARMAR EL MENSAJE
  // ==========================================================

  function fechaLegible(iso) {            // "2026-11-02" → "02/11/2026"
    const [a, m, d] = iso.split("-");
    return `${d}/${m}/${a}`;
  }

  function leerDatos() {
    const franjaSel = $("franja");
    return {
      nombre:  $("nombre").value.trim(),
      fecha:   $("fecha").value,
      franja:  franjaSel.value ? franjaSel.options[franjaSel.selectedIndex].textContent : "",
      hora:    $("hora").value,
      adultos: parseInt($("adultos").value, 10) || 0,
      ninos:   parseInt($("ninos").value, 10) || 0
    };
  }

  function validar(d) {
    if (!d.nombre)  return "Escribí tu nombre.";
    if (!d.fecha)   return "Elegí la fecha.";
    if (!d.franja)  return "Elegí una franja.";
    if (!d.hora)    return "Elegí un horario.";
    if (d.adultos < 1) return "Tiene que haber al menos un adulto.";
    return "";
  }

  // El mensaje va siempre en español, sea cual sea el idioma del sitio
  function armarMensaje(d) {
    const cfg = DESTINOS[destino];
    const lineas = [
      `Hola! Quiero reservar en *${cfg.nombre}*.`,
      `Nombre: ${d.nombre}`,
      `Fecha: ${fechaLegible(d.fecha)}`,
      `Horario: ${d.hora} (${d.franja})`,
      `Adultos: ${d.adultos}`,
      `Niños: ${d.ninos}`
    ];
    if (cfg.conSector) lineas.push(`Sector: ${sector}`);
    lineas.push("Entiendo que el horario está sujeto a confirmación.");
    return lineas.join("\n");
  }

  // ==========================================================
  //  PASOS: FORMULARIO → AVISO → WHATSAPP
  // ==========================================================

  function irAlAviso() {
    const d = leerDatos();
    const problema = validar(d);
    if (problema) { mostrarError(problema); return; }
    mostrarError("");

    const cfg = DESTINOS[destino];
    const filas = [
      ["Lugar", cfg.nombre],
      ["Nombre", d.nombre],
      ["Fecha", fechaLegible(d.fecha)],
      ["Horario", `${d.hora} (${d.franja})`],
      ["Personas", `${d.adultos} adultos, ${d.ninos} niños`]
    ];
    if (cfg.conSector) filas.push(["Sector", sector]);

    $("resumen").innerHTML = "";
    filas.forEach(([k, v]) => {
      const fila = document.createElement("p");
      const b = document.createElement("strong");
      b.textContent = k + ": ";
      fila.append(b, document.createTextNode(v));   // textContent: el nombre no se interpreta como HTML
      $("resumen").appendChild(fila);
    });

    mostrarPaso("aviso");
  }

  // Se llama directo desde un click del usuario, por eso el
  // navegador no lo bloquea como ventana emergente.
  function abrirWhatsApp() {
    if (!/^\d{10,15}$/.test(WA_NUMBER)) {
      console.error("[reservas.js] Falta configurar WA_NUMBER.");
      return;
    }
    const mensaje = armarMensaje(leerDatos());
    window.open(
      `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(mensaje)}`,
      "_blank", "noopener"
    );
    cerrarReserva();
  }

  // ==========================================================
  //  EVENTOS (delegados: no dependen de dónde esté cada botón)
  // ==========================================================

  function iniciar() {
    if (typeof Horarios === "undefined") {
      console.error("[reservas.js] Falta cargar horarios.js antes.");
      return;
    }

    document.addEventListener("click", (e) => {
      const abrir = e.target.closest("[data-reserva]");
      if (abrir) { e.preventDefault(); abrirReserva(abrir.dataset.reserva); return; }

      if (e.target.closest("[data-reserva-cerrar]") || e.target === $("overlay")) {
        cerrarReserva(); return;
      }
      if (e.target.closest("[data-reserva-volver]")) { mostrarPaso("form"); return; }

      const btnSector = e.target.closest(SEL.sectorBtn);
      if (btnSector && $("overlay") && $("overlay").contains(btnSector)) {
        sector = btnSector.dataset.sector || btnSector.textContent.trim();
        $("overlay").querySelectorAll(SEL.sectorBtn)
          .forEach(b => b.classList.toggle("activo", b === btnSector));
        return;
      }

      if (e.target.closest(SEL.enviar))   { irAlAviso(); return; }
      if (e.target.closest(SEL.whatsapp)) { abrirWhatsApp(); }
    });

    document.addEventListener("change", (e) => {
      if (e.target.matches(SEL.fecha))  cargarFranjas();
      if (e.target.matches(SEL.franja)) cargarHorarios();
    });

    document.addEventListener("keydown", (e) => {
      const ov = $("overlay");
      if (e.key === "Escape" && ov && ov.classList.contains("activo")) cerrarReserva();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciar);
  } else {
    iniciar();
  }
})();