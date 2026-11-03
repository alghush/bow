const URL_PRECIOS = "https://script.google.com/macros/s/AKfycbxb1HxUIJKrFIlFbkW972ebHMxf_OLIjJ7dHOvnPlCDRI1XYp_1pzjJwa8u7g-k6_Lo2A/exec";

function leerCache() {
    try {
        return JSON.parse(localStorage.getItem("precios"));
    } catch {
        return null;
    }
}

async function cargarPrecios() {
    const cache = leerCache();
    if (cache) aplicarPrecios(cache);

    try {
        const respuesta = await fetch(URL_PRECIOS + "?t=" + Date.now());
        const precios = await respuesta.json();
        aplicarPrecios(precios);
        localStorage.setItem("precios", JSON.stringify(precios));
        console.log("✅ Precios actualizados");
    } catch (error) {
        console.error("❌ Error al cargar precios:", error);
    }
}

function aplicarPrecios(precios) {
    for (const id in precios) {
        const elemento = document.getElementById(id.trim());
        if (!elemento) continue;

        const precio = precios[id];
        const item = elemento.closest(".plato");

        if (precio === null) {
            if (item) item.style.display = "none";
            continue;
        }

        if (item) item.style.display = "";
        elemento.textContent = typeof precio === "number"
            ? "$" + precio.toLocaleString("es-AR")
            : precio;
        elemento.classList.add("cargado");
    }
}

cargarPrecios();