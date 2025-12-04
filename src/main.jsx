// src/main.jsx  (Vite)
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

console.log("[main] arranca createRoot, buscando #root en DOM");
const container = document.getElementById("root");
if (!container) {
  console.error("[main] No existe element #root en index.html — revisa public/index.html");
} else {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  console.log("[main] App renderizada (deberías ver contenido ahora)");
}
