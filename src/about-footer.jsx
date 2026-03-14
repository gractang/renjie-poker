import React from "react";
import ReactDOM from "react-dom/client";
import SiteFooter from "./components/SiteFooter";

const mountNode = document.getElementById("site-footer-root");

if (mountNode) {
  ReactDOM.createRoot(mountNode).render(
    <React.StrictMode>
      <SiteFooter />
    </React.StrictMode>,
  );
}
