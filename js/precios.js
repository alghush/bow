const URL_PRECIOS = "https://script.google.com/macros/s/AKfycbxb1HxUIJKrFIlFbkW972ebHMxf_OLIjJ7dHOvnPlCDRI1XYp_1pzjJwa8u7g-k6_Lo2A/exec";
 
function leerCache() {
    try {
        return JSON.parse(localStorage.getItem("precios"));
    } catch {
        return null;
    }
}
 
async function cargarPrecios() {
    // Los precios se muestran enseguida desde la caché. El ejecutivo NO: un menú de otra
    // semana mostrado como si fuera el de hoy es peor que mostrar Restaurant un instante.
    const cache = leerCache();
    if (cache) aplicarPrecios(cache);
 
    try {
        const respuesta = await fetch(URL_PRECIOS + "?t=" + Date.now());
        const precios = await respuesta.json();
        aplicarPrecios(precios);
        localStorage.setItem("precios", JSON.stringify(precios));
        pintarEjecutivo(precios);
        console.log("✅ Precios actualizados");
    } catch (error) {
        console.error("❌ Error al cargar precios:", error);
        pintarEjecutivo({}); // sin datos frescos no hay ejecutivo: avisa "abierto: false" y queda Restaurant
    }
}
 
function aplicarPrecios(precios) {
    for (const id in precios) {
        const elemento = document.getElementById(id.trim());
        if (!elemento) continue;
 
        const precio = precios[id];
        const item = elemento.closest(".plato, .ejecutivo__precio");
 
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
 
 
/* ===== Menú ejecutivo =====
   Recibe `datos`: un objeto plano { id: valor } con lo que trae la planilla, por ejemplo
   { "ej-1": "Pechuga...", "ej-f1": "Suprema...", "ej-v1": "Ñoquis...", "p-ej-bow": 20500 }.
   Devuelve true si hay ejecutivo para mostrar y false si no (para caer a Restaurant).
 
   Ids de la planilla:
     ej-1 ... ej-5   plato del día (lunes a viernes)
     ej-f1 ... ej-f8 platos fijos de la semana (los vacíos se ignoran)
     ej-v1 ... ej-v5 opciones veggie (los vacíos se ignoran) */
 
const DIAS_EJECUTIVO = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5 };
 
/* Día de la semana según hora de Argentina (no la del celular del cliente). */
function diaEjecutivo() {
    const dia = new Intl.DateTimeFormat("en-US", {
        weekday: "short",
        timeZone: "America/Argentina/Buenos_Aires"
    }).format(new Date());
    return DIAS_EJECUTIVO[dia] || 0; // 0 = sábado o domingo
}
 
/* Junta los textos no vacíos de ej-<prefijo>1, ej-<prefijo>2... en orden numérico. */
function textosEjecutivo(datos, prefijo) {
    const patron = new RegExp("^ej-" + prefijo + "(\\d+)$");
    return Object.keys(datos)
        .map(clave => {
            const m = patron.exec(clave);
            return m ? { n: Number(m[1]), texto: String(datos[clave] ?? "").trim() } : null;
        })
        .filter(item => item && item.texto)
        .sort((a, b) => a.n - b.n)
        .map(item => item.texto);
}
 
/* Llena un <ul> con un <li> por texto. textContent evita inyectar HTML desde la planilla. */
function llenarListaEjecutivo(id, textos) {
    const ul = document.getElementById(id);
    if (!ul) return 0;
    const items = textos.map(texto => {
        const li = document.createElement("li");
        li.className = "ejecutivo__item";
        li.textContent = texto;
        return li;
    });
    ul.replaceChildren(...items);
    return items.length;
}
 
function pintarEjecutivo(crudos) {
    // Mismas claves limpias que usa aplicarPrecios (id.trim()), por si la planilla trae un espacio de más
    const datos = {};
    for (const clave in crudos) datos[clave.trim()] = crudos[clave];
 
    const dia = diaEjecutivo();
    const platoDia = dia ? String(datos["ej-" + dia] ?? "").trim() : "";
 
    const hayDia = llenarListaEjecutivo("ej-hoy", platoDia ? [platoDia] : []);
    llenarListaEjecutivo("ej-fijos", textosEjecutivo(datos, "f"));
    const hayVeggie = llenarListaEjecutivo("ej-veggie", textosEjecutivo(datos, "v"));
 
    const bloqueVeggie = document.getElementById("ej-veggie-bloque");
    if (bloqueVeggie) bloqueVeggie.hidden = !hayVeggie;
 
    // Sin plato del día cargado (o en finde) no hay ejecutivo y se usa Restaurant.
    // Los fijos no se evalúan a propósito: una semana a medio cargar no debe publicarse.
    const abierto = hayDia > 0;
 
    // Aviso para quien decide qué sección se abre (el selector de horario en bow.js),
    // así no importa en qué archivo ni en qué momento se llame a esta función.
    document.dispatchEvent(new CustomEvent("ejecutivo:listo", { detail: { abierto } }));
    return abierto;
}
 
cargarPrecios();