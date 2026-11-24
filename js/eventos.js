document.addEventListener("DOMContentLoaded", () => {
    const lightbox = document.getElementById("lightbox");
    if (!lightbox) return;

    const reducir = matchMedia("(prefers-reduced-motion: reduce)");
    const INTERVALO = 4000;
    const PAUSA = 6000;

    const lightboxImg = lightbox.querySelector(".lightbox__img");
    const cerrar = lightbox.querySelector(".lightbox__cerrar");
    const lbPrev = lightbox.querySelector(".lightbox__nav--prev");
    const lbNext = lightbox.querySelector(".lightbox__nav--next");

    let origen = null;
    let galeria = null;
    let posicion = 0;
    let temporizador = null;
    let inicioX = null;

    function mostrar(i, animar) {
        posicion = (i + galeria.imagenes.length) % galeria.imagenes.length;
        const img = galeria.imagenes[posicion];
        const poner = () => {
            lightboxImg.src = img.currentSrc || img.src;
            lightboxImg.alt = img.alt;
            lightboxImg.classList.remove("cambiando");
        };

        clearTimeout(temporizador);
        if (!animar || reducir.matches) {
            poner();
            return;
        }
        lightboxImg.classList.add("cambiando");
        temporizador = setTimeout(poner, 200);
    }

    function abrirLightbox(datos, i) {
        origen = document.activeElement;
        galeria = datos;
        mostrar(i, false);
        lightbox.classList.add("abierto");
        lightbox.setAttribute("aria-hidden", "false");
        document.documentElement.classList.add("lightbox-abierto");
        cerrar.focus();
    }

    function cerrarLightbox() {
        clearTimeout(temporizador);
        lightbox.classList.remove("abierto");
        lightbox.setAttribute("aria-hidden", "true");
        document.documentElement.classList.remove("lightbox-abierto");
        if (galeria) galeria.ir(posicion);
        if (origen) origen.focus();
    }

    const abierto = () => lightbox.classList.contains("abierto");

    cerrar.addEventListener("click", cerrarLightbox);
    lbPrev.addEventListener("click", () => mostrar(posicion - 1, true));
    lbNext.addEventListener("click", () => mostrar(posicion + 1, true));

    lightbox.addEventListener("click", e => {
        if (e.target === lightbox) cerrarLightbox();
    });

    lightbox.addEventListener("touchstart", e => {
        inicioX = e.touches[0].clientX;
    }, { passive: true });

    lightbox.addEventListener("touchend", e => {
        if (inicioX === null) return;
        const dx = e.changedTouches[0].clientX - inicioX;
        inicioX = null;
        if (Math.abs(dx) > 50) mostrar(posicion + (dx < 0 ? 1 : -1), true);
    }, { passive: true });

    document.addEventListener("keydown", e => {
        if (!abierto()) return;
        if (e.key === "Escape") cerrarLightbox();
        if (e.key === "ArrowLeft") mostrar(posicion - 1, true);
        if (e.key === "ArrowRight") mostrar(posicion + 1, true);
    });

    document.querySelectorAll("#eventos .galeria-wrap, #rooftop-salon .galeria-wrap").forEach(wrap => {
        const carrusel = wrap.querySelector(".galeria-carrusel");
        const figuras = [...carrusel.querySelectorAll("figure")];
        const prev = wrap.querySelector(".galeria__btn--prev");
        const next = wrap.querySelector(".galeria__btn--next");

        if (figuras.length < 2) {
            if (prev) prev.remove();
            if (next) next.remove();
            return;
        }

        let visible = false;
        let encima = false;
        let ultimoToque = 0;

        const paso = () => figuras[1].offsetLeft - figuras[0].offsetLeft;
        const indice = () => {
            const p = paso();
            return p ? Math.round(carrusel.scrollLeft / p) : 0;
        };

        const marcar = () => {
            const actual = indice();
            figuras.forEach((f, i) => f.classList.toggle("activa", i === actual));
        };

        const ir = i => {
            const n = (i + figuras.length) % figuras.length;
            carrusel.scrollTo({
                left: n * paso(),
                behavior: reducir.matches ? "auto" : "smooth"
            });
        };

        const datos = {
            imagenes: figuras.map(f => f.querySelector("img")),
            ir
        };

        const tocado = () => { ultimoToque = Date.now(); };

        carrusel.addEventListener("scroll", () => requestAnimationFrame(marcar), { passive: true });

        prev.addEventListener("click", () => { tocado(); ir(indice() - 1); });
        next.addEventListener("click", () => { tocado(); ir(indice() + 1); });

        carrusel.addEventListener("click", e => {
            const figura = e.target.closest("figure");
            if (figura) abrirLightbox(datos, figuras.indexOf(figura));
        });

        carrusel.addEventListener("pointerdown", tocado);
        carrusel.addEventListener("touchstart", tocado, { passive: true });
        carrusel.addEventListener("wheel", tocado, { passive: true });
        carrusel.addEventListener("pointerenter", e => {
            if (e.pointerType === "mouse") encima = true;
        });
        carrusel.addEventListener("pointerleave", () => {
            encima = false;
            tocado();
        });

        new IntersectionObserver(([entrada]) => {
            visible = entrada.isIntersecting;
            if (visible) marcar();
        }, { threshold: 0.5 }).observe(carrusel);

        marcar();

        setInterval(() => {
            if (reducir.matches || document.hidden || !visible || encima) return;
            if (abierto()) return;
            if (Date.now() - ultimoToque < PAUSA) return;
            ir(indice() + 1);
        }, INTERVALO);
    });
});


(() => {
    const overlay = document.getElementById("modal-cotizar-overlay");
    if (!overlay) return;

    const marco = overlay.querySelector(".cotizar__marco");
    const cerrar = overlay.querySelector(".modal-close");
    let origen = null;

    function abrir() {
        origen = document.activeElement;
        if (!marco.getAttribute("src")) marco.src = marco.dataset.src;
        overlay.classList.add("activo");
        document.documentElement.classList.add("lightbox-abierto");
        cerrar.focus();
    }

    function cerrarModal() {
        overlay.classList.remove("activo");
        document.documentElement.classList.remove("lightbox-abierto");
        if (origen) origen.focus();
    }

    document.addEventListener("click", e => {
        if (e.target.closest("[data-cotizar]")) {
            e.preventDefault();
            abrir();
            return;
        }
        if (e.target === overlay || e.target.closest("[data-cotizar-cerrar]")) cerrarModal();
    });

    document.addEventListener("keydown", e => {
        if (e.key === "Escape" && overlay.classList.contains("activo")) cerrarModal();
    });
})();