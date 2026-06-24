import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { LangProvider } from "./i18n.js";
import { RoleProvider } from "./role.js";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <LangProvider>
      <RoleProvider>
        <App />
      </RoleProvider>
    </LangProvider>
  </React.StrictMode>
);
