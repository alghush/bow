// BOW - index.js 
//logica exclusiva de index.html (landing / splash)

document.addEventListener("DOMContentLoaded", () => {

    // Acordeones del index: cerrar el anterior al abrir uno nuevo
    const toggles = document.querySelectorAll(".checkbox__submenu");

    toggles.forEach(toggle => {
        toggle.addEventListener("change", () => {
            if (toggle.checked) {
                toggles.forEach(otro => {
                    if (otro !== toggle) otro.checked = false;
                });
            }
        });
    });

});