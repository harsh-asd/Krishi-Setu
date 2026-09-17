
window.addEventListener('error', function(event) {
  fetch('http://localhost:5000/api/log_error', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: event.message, filename: event.filename, lineno: event.lineno, colno: event.colno, error: event.error ? event.error.stack : null })
  }).catch(e => console.error(e));
});
window.addEventListener('unhandledrejection', function(event) {
  fetch('http://localhost:5000/api/log_error', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: event.reason ? event.reason.toString() : 'Unhandled promise rejection', stack: event.reason ? event.reason.stack : null })
  }).catch(e => console.error(e));
});
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router";
import App from "./App.jsx";
import "./index.css";
import { LanguageProvider } from "./translations/LanguageContext";
import SmoothScroll from "./components/SmoothScroll";

ReactDOM.createRoot(
  document.getElementById("root")
).render(
  <React.StrictMode>

    <BrowserRouter>

      <LanguageProvider>

        <SmoothScroll />

        <App />

      </LanguageProvider>

    </BrowserRouter>

  </React.StrictMode>
);