(function () {
    const vistas = Array.from(document.querySelectorAll("main"));
    if (!vistas.length) return;

    const DURACION = 450;                               // ms
    const EASING = "cubic-bezier(.22,.61,.36,1)";
    const DURACION_LOGO = 200;                          // ms, tiene que coincidir con el CSS (0.2s)
    const reducir = matchMedia("(prefers-reduced-motion: reduce)");

    let actual = vistas.findIndex(v => !v.hidden);
    if (actual < 0) actual = 0;
    vistas.forEach((v, i) => { v.hidden = i !== actual; });

    let cortarAnimacion = null;

    // ---- Logo del nav: cambia según la vista, con fade ----
    const enlaceLogo = document.querySelector(".nav__logo");
    const imgLogo = enlaceLogo?.querySelector("img");
    let timerLogo = null;

    if (!imgLogo) {
        console.warn("[vistas.js] No hay <img> dentro de .nav__logo");
    } else {
        ["data-logo-bow", "data-logo-rooftop"].forEach(attr => {
            const s = imgLogo.getAttribute(attr);
            if (s) new Image().src = s;
        });
    }

    function ponerLogoNav(animar) {
        if (!imgLogo) return;
        const esRooftop = vistas[actual].id === "rooftop";
        const src = imgLogo.getAttribute(esRooftop ? "data-logo-rooftop" : "data-logo-bow");
        if (!src) return;

        // Datos funcionales: cambian al instante
        enlaceLogo.setAttribute("href", esRooftop ? "#rooftop" : "#bow");
        imgLogo.alt = esRooftop ? "BOW Rooftop" : "BOW";

        // Si había un cambio a medias, se cancela
        clearTimeout(timerLogo);

        // Ya es el logo correcto (o el usuario volvió atrás a mitad del fade)
        if (imgLogo.getAttribute("src") === src) {
            imgLogo.classList.remove("nav__logo-img--saliendo");
            return;
        }

        // Sin animación: carga inicial o "reducir movimiento"
        if (!animar || reducir.matches) {
            imgLogo.setAttribute("src", src);
            imgLogo.classList.remove("nav__logo-img--saliendo");
            return;
        }

        imgLogo.classList.add("nav__logo-img--saliendo");          // fade-out
        timerLogo = setTimeout(() => {
            imgLogo.setAttribute("src", src);                       // cambio con el logo invisible
            imgLogo.classList.remove("nav__logo-img--saliendo");    // fade-in
        }, DURACION_LOGO);
    }

    function marcarNav(animar) {
        ponerLogoNav(animar);
        document.querySelectorAll(".nav__link").forEach(a => {
            a.classList.toggle("activo", a.getAttribute("href") === "#" + vistas[actual].id);
        });
    }

    function mostrar(i, animar) {
        if (i === actual) return;
        if (cortarAnimacion) cortarAnimacion();

        const saliente = vistas[actual];
        const entrante = vistas[i];
        const dir = i > actual ? 1 : -1;
        const scrollAnterior = window.scrollY;
        actual = i;
        marcarNav(animar);                              // ← ahora le pasamos si hay animación

        if (!animar || reducir.matches || !entrante.animate) {
            saliente.hidden = true;
            entrante.hidden = false;
            window.scrollTo({ top: 0, behavior: "instant" });
            return;
        }

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

    function ir(hash, animar) {
        const id = decodeURIComponent((hash || "").replace("#", ""));
        const destino = id && document.getElementById(id);
        if (!destino) return false;
        const vista = destino.closest("main");
        if (!vista) return false;

        const i = vistas.indexOf(vista);
        const cambia = i !== actual;
        if (cambia) mostrar(i, animar);
        if (cambia && destino !== vista) destino.scrollIntoView({ block: "start" });
        return true;
    }

    window.addEventListener("hashchange", () => ir(location.hash, true));

    marcarNav(false);                                   // ← carga inicial sin fade
    ir(location.hash, false);
})();