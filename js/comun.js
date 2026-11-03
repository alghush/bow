const IDIOMA_BASE = "es";

function idiomaInicial() {
    const guardado = localStorage.getItem("idioma");
    if (guardado && IDIOMAS[guardado]) return guardado;
    const delNavegador = navigator.language.slice(0, 2);
    return IDIOMAS[delNavegador] ? delNavegador : IDIOMA_BASE;
}

function aplicarIdioma(idioma) {
    document.documentElement.lang = idioma;

    document.querySelectorAll("[data-i18n]").forEach(el => {
        const clave = el.dataset.i18n;
        const texto = IDIOMAS[idioma][clave] || IDIOMAS[IDIOMA_BASE][clave];
        if (texto) el.textContent = texto;
    });

    document.querySelectorAll("[data-idioma]").forEach(btn => {
        btn.classList.toggle("activo", btn.dataset.idioma === idioma);
    });

    const etiqueta = document.getElementById("idioma-actual");
    if (etiqueta) etiqueta.textContent = idioma.toUpperCase();
}

document.addEventListener("click", e => {
    const boton = e.target.closest(".idiomas__boton");
    const abierto = document.querySelector(".idiomas.abierto");

    if (boton) {
        const selector = boton.closest(".idiomas");
        const abrir = !selector.classList.contains("abierto");
        selector.classList.toggle("abierto", abrir);
        boton.setAttribute("aria-expanded", abrir);
        return;
    }

    if (abierto) {
        abierto.classList.remove("abierto");
        abierto.querySelector(".idiomas__boton").setAttribute("aria-expanded", "false");
    }
});

document.addEventListener("click", e => {
    const opcion = e.target.closest("[data-idioma]");
    if (!opcion) return;
    localStorage.setItem("idioma", opcion.dataset.idioma);
    aplicarIdioma(opcion.dataset.idioma);
});

document.addEventListener("DOMContentLoaded", () => {
    aplicarIdioma(idiomaInicial());
});

window.addEventListener("hashchange", () => {
    document.querySelectorAll(".nav__check, .nav__check-sub").forEach(check => {
        check.checked = false;
    });
});
