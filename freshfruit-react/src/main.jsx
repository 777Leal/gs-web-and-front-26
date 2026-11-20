import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

if (!location.hash) history.replaceState(null, "", "#/dashboard");

createRoot(document.getElementById("root")).render(<StrictMode><App /></StrictMode>);
