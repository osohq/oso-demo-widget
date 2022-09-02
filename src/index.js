import React from "react";
import ReactDOM from "react-dom";
import WhatIsOso from "./WhatIsOso";
import OsoValues from "./OsoValues";
import MarketingWidget from "./MarketingWidget";
import "./style.css";
window.process = undefined;

export function run() {
  window.addEventListener("load", () => {
    const marketingWidgetTarget = document.getElementById(
      "oso-marketing-widget"
    );
    if (marketingWidgetTarget)
      ReactDOM.render(<MarketingWidget />, marketingWidgetTarget);

    const demoTarget = document.getElementById("oso-web-demo");
    if (demoTarget) ReactDOM.render(<WhatIsOso />, demoTarget);

    const valuesTarget = document.getElementById("oso-values-widget");
    if (valuesTarget) ReactDOM.render(<OsoValues />, valuesTarget);
  });
}
