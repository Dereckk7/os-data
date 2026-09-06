/* Anti-flash : pose le thème avant le premier rendu React.
   Externalisé de index.html pour être compatible avec une CSP script-src 'self'
   (aucun script inline → pas de 'unsafe-inline' ni de hash à maintenir). */
(function () {
  try {
    var t = localStorage.getItem("dataos.theme.v1") || "light";
    if (t !== "dark" && t !== "light" && t !== "system" && t !== "comfort") t = "light";
    var resolved = t;
    if (t === "system") {
      resolved = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    } else if (t === "comfort") {
      resolved = "dark";
    }
    var root = document.documentElement;
    root.dataset.theme = resolved;
    if (t === "comfort") root.dataset.comfort = "true";
    root.style.backgroundColor = resolved === "light" ? "#f4f3ef" : "#08090a";
  } catch (e) { /* noop */ }
})();
