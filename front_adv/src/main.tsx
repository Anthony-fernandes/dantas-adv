import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const root = document.getElementById("root")!;

try {
  createRoot(root).render(<App />);
} catch (e) {
  root.innerHTML = `<pre style="padding:2rem;color:red;white-space:pre-wrap;font-size:13px">${e}</pre>`;
}
