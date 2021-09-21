import React from "react";
import ReactDOM from "react-dom";
import WhatIsOso from "./WhatIsOso";
import "./style.css";
window.process = undefined;

export function run() {
  window.addEventListener("load", () => {
    const target = document.getElementById("oso-web-demo");
    ReactDOM.render(<WhatIsOso />, target);
  });
}
