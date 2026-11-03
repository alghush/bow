document.addEventListener("DOMContentLoaded", () => {

  // Menú: cerrarlo al tocar un ítem del nav
  document.querySelector(".nav__menu")?.addEventListener("click", e => {
    if (!e.target.closest("a")) return;
    document.querySelectorAll(".nav__check, .nav__check-sub").forEach(c => (c.checked = false));
  });

  // Botones « » de los carruseles (un solo listener para todos)
  document.addEventListener("click", e => {
    const btn = e.target.closest(".carrusel-btn");
    if (!btn) return;
    const wrapper = btn.closest(".categorias-wrapper");
    const carrusel = wrapper.querySelector(".categorias-carrusel");
    const esPrev = btn === wrapper.querySelector(".carrusel-btn");
    const paso = Math.max(150, carrusel.clientWidth * 0.7);
    carrusel.scrollBy({ left: esPrev ? -paso : paso, behavior: "smooth" });
  });

  // Categoría activa: cada tarjeta busca su destino por el href (#id)
  const navAlto = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--nav-alto")) || 72;
  const LINEA = navAlto + 110;

  const carruseles = [...document.querySelectorAll(".categorias-wrapper")].map(wrapper => ({
    wrapper,
    carrusel: wrapper.querySelector(".categorias-carrusel"),
    items: [...wrapper.querySelectorAll(".categoria-card")]
      .map(card => ({ card, destino: document.querySelector(card.getAttribute("href")) }))
      .filter(i => i.destino),
    ultima: null
  }));

  let pendiente = false;

  function marcarActiva() {
    pendiente = false;
    carruseles.forEach(c => {
      if (c.wrapper.offsetParent === null) return;

      let activo = null;
      c.items.forEach(i => { if (i.destino.getBoundingClientRect().top <= LINEA) activo = i; });
      c.items.forEach(i => i.card.classList.toggle("active", i === activo));

      if (!activo || c.ultima === activo.card) return;
      c.ultima = activo.card;
      const rc = activo.card.getBoundingClientRect();
      const rk = c.carrusel.getBoundingClientRect();
      c.carrusel.scrollTo({
        left: c.carrusel.scrollLeft + (rc.left - rk.left) - (c.carrusel.clientWidth - rc.width) / 2,
        behavior: "smooth"
      });
    });
  }

  const pedir = () => { if (!pendiente) { pendiente = true; requestAnimationFrame(marcarActiva); } };

  // captura = true: escucha el scroll de la ventana Y el de cualquier contenedor (body, etc.)
  document.addEventListener("scroll", pedir, { passive: true, capture: true });
  window.addEventListener("resize", pedir);
  window.addEventListener("hashchange", pedir);
  window.addEventListener("load", pedir);
  pedir();
});


/////// CAMBIO DE MAIN A OTRO MAIN (VISTAS)

/* vistas.js: una sola vista (<main>) visible a la vez.
   Al cambiar de vista (Bow <-> Rooftop <-> Eventos) la actual sale y la nueva entra
   en horizontal. El orden de los <main> en el HTML define hacia dónde se mueve. */
(function () {
    const vistas = Array.from(document.querySelectorAll("main"));
    if (!vistas.length) return;

    const DURACION = 450;                               // ms
    const EASING = "cubic-bezier(.22,.61,.36,1)";
    const reducir = matchMedia("(prefers-reduced-motion: reduce)");

    let actual = vistas.findIndex(v => !v.hidden);
    if (actual < 0) actual = 0;
    vistas.forEach((v, i) => { v.hidden = i !== actual; });

    let cortarAnimacion = null;                         // para terminar una animación en curso

    function marcarNav() {
        document.querySelectorAll(".nav__link").forEach(a => {
            a.classList.toggle("activo", a.getAttribute("href") === "#" + vistas[actual].id);
        });
    }

    function mostrar(i, animar) {
        if (i === actual) return;
        if (cortarAnimacion) cortarAnimacion();         // si hay una animación a medias, se cierra ya

        const saliente = vistas[actual];
        const entrante = vistas[i];
        const dir = i > actual ? 1 : -1;                // 1 = avanza (entra desde la derecha)
        const scrollAnterior = window.scrollY;
        actual = i;
        marcarNav();

        if (!animar || reducir.matches || !entrante.animate) {
            saliente.hidden = true;
            entrante.hidden = false;
            window.scrollTo({ top: 0, behavior: "instant" });
            return;
        }

        // La saliente se fija en pantalla, exactamente donde estaba (con su propio scroll interno
        // solo durante la animación, así la barra de categorías sigue pegada y no salta)
        saliente.style.cssText = "position:fixed;inset:0;overflow:hidden;pointer-events:none;";
        saliente.scrollTop = scrollAnterior;
        entrante.hidden = false;
        window.scrollTo({ top: 0, behavior: "instant" });

        const opciones = { duration: DURACION, easing: EASING, fill: "both" };
        const aSale = saliente.animate([{ transform: "none" }, { transform: `translateX(${-dir * 100}%)` }], opciones);
        const aEntra = entrante.animate([{ transform: `translateX(${dir * 100}%)` }, { transform: "none" }], opciones);

        const limpiar = () => {
            if (cortarAnimacion !== limpiar) return;
            cortarAnimacion = null;
            aSale.cancel();
            aEntra.cancel();
            saliente.hidden = true;
            saliente.style.cssText = "";
        };
        cortarAnimacion = limpiar;
        aEntra.finished.then(limpiar).catch(() => {});
    }

    // Resuelve un hash: puede ser una vista (#rooftop) o algo que está adentro de una (#rooftop-comida)
    function ir(hash, animar) {
        const id = decodeURIComponent((hash || "").replace("#", ""));
        const destino = id && document.getElementById(id);
        if (!destino) return false;
        const vista = destino.closest("main");
        if (!vista) return false;

        const i = vistas.indexOf(vista);
        const cambia = i !== actual;
        if (cambia) mostrar(i, animar);
        // Si no cambia de vista, el navegador ya hizo el scroll al ancla
        if (cambia && destino !== vista) destino.scrollIntoView({ block: "start" });
        return true;
    }

    window.addEventListener("hashchange", () => ir(location.hash, true));

    marcarNav();
    ir(location.hash, false);                           // carga inicial: si viene con hash, respeta el hash
})();

// Al entrar sin destino explícito (ej. el QR), llevar a la sección que corresponde por hora
(function () {
  if (location.hash && location.hash !== "#bow") return;   // vino de un link con destino: se respeta
  if (typeof Horarios === "undefined") return;

  const { fecha, minutos } = Horarios.ahora();
  const vigente = Horarios.seccionVisible(fecha, minutos);  // "desayuno" | "menu-ejecutivo" | "restaurant"
  const destino = document.getElementById(vigente) || document.getElementById("restaurant");
  if (!destino) return;

  window.addEventListener("load", () => destino.scrollIntoView({ block: "start" }));
})();