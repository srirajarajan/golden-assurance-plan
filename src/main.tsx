import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Basic front-end hardening (not foolproof, but adds a layer)
if (import.meta.env.PROD) {
  document.addEventListener("contextmenu", (e) => e.preventDefault());
  document.addEventListener("keydown", (e) => {
    if (
      e.key === "F12" ||
      (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "i")) ||
      (e.ctrlKey && (e.key === "U" || e.key === "u"))
    ) {
      e.preventDefault();
    }
  });
}

createRoot(document.getElementById("root")!).render(<App />);
