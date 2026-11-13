// BOW - carruseles.js
// Botones « » de los carruseles de categorías (Bow, Restaurant, Bebidas, Rooftop)

document.addEventListener("click", (e) => {
    const boton = e.target.closest(".carrusel-btn");
    if (!boton) return;

    const caja = boton.closest(".categorias-wrapper");
    const carrusel = caja && caja.querySelector(".categorias-carrusel");
    if (!carrusel) return;

    // El primer botón de cada caja retrocede; el segundo avanza
    const botones = caja.querySelectorAll(".carrusel-btn");
    const direccion = boton === botones[0] ? -1 : 1;

    const reducir = matchMedia("(prefers-reduced-motion: reduce)").matches;

    carrusel.scrollBy({
        left: direccion * carrusel.clientWidth * 0.8,
        behavior: reducir ? "auto" : "smooth"
    });
});