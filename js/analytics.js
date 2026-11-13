// Envoltorio seguro: la analítica nunca debe romper la página
window.trackear = function (nombre, params) {
  try {
    if (typeof window.gtag === "function") window.gtag("event", nombre, params || {});
  } catch (_) { /* se ignora a propósito */ }
};

document.addEventListener("click", (e) => {
  const a = e.target.closest("a[href]");
  if (!a) return;

  const href = a.href;
  const origen = a.closest("footer") ? "footer" : "pagina";

  if (href.includes("instagram.com")) trackear("click_instagram", { origen });

  if (a.classList.contains("splash__btn--ubi") || href.includes("google.com/maps")) {
    trackear("click_ubicacion", { origen });
  }

  if (href.includes("wa.me")) trackear("click_whatsapp_eventos", { origen });

  if (a.hasAttribute("data-cotizar")) trackear("cotizar_abrir");
});