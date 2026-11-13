
// Descripciones de servicios (Eventos) que el cliente edita desde la planilla.
// La planilla devuelve { id: texto }, por ejemplo { "ev-ts-f1": "Bruschettas caprese" }.

const URL_DESCRI = "https://script.google.com/macros/s/AKfycbwG8sRiHXT4CCB5bJPyZ23_2GE_mPe6EbTwAzYVJlgd2AiLLYV0CE1LarkCXOCTQ1_G/exec";          // pegar acá la URL de la aplicación web de Apps Script
const ESPERA_DESCRI_MS = 8000;  // si no responde en este tiempo, se muestra el aviso
 
async function cargarDescri() {
    if (!URL_DESCRI) { mostrarAvisos(true); return; }
 
    const control = new AbortController();
    const temporizador = setTimeout(() => control.abort(), ESPERA_DESCRI_MS);
 
    try {
        const respuesta = await fetch(URL_DESCRI + "?t=" + Date.now(), { signal: control.signal });
        if (!respuesta.ok) throw new Error("HTTP " + respuesta.status);
        const descri = await respuesta.json();
        aplicarDescri(descri);
        mostrarAvisos(false);
        console.log("✅ Descripciones actualizadas");
    } catch (error) {
        console.error("❌ Error al cargar descripciones:", error);
        mostrarAvisos(true);
    } finally {
        clearTimeout(temporizador);
    }
}
 
function aplicarDescri(descri) {
    for (const id in descri) {
        const elemento = document.getElementById(id.trim());
        if (!elemento) continue;
 
        const texto = String(descri[id] ?? "").trim();
        elemento.hidden = !texto;                     // celda vacía = el elemento se oculta
        if (texto) elemento.textContent = texto;      // textContent: lo que escriba el cliente no se interpreta como HTML
    }
}
 
// Con error se muestran todos los avisos. Sin error, solo el de las propuestas
// que quedaron sin ningún ítem visible (por ejemplo, si la planilla está vacía).
function mostrarAvisos(hayError) {
    document.querySelectorAll(".ev-aviso").forEach(aviso => {
        const bloque = aviso.parentElement.querySelector(".ev-incluye");
        const hayItems = bloque && bloque.querySelector("li:not([hidden])");
        aviso.hidden = !hayError && !!hayItems;
    });
}
 
cargarDescri();