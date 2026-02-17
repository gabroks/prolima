import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initSavedTheme } from "./lib/initTheme";

// Apply saved theme before render to avoid flash
initSavedTheme();

createRoot(document.getElementById("root")!).render(<App />);
