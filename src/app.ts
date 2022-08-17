import { createFluidGrid } from "./fluid-grid/fluid-grid";

// create the canvas element
const canvas = document.createElement("canvas");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
canvas.style.position = "absolute";
canvas.style.left = "0px";
canvas.style.right = "0px";
canvas.style.top = "0px";
canvas.style.bottom = "0px";
canvas.style.width = "100vw";
canvas.style.height = "100vh";
document.body.appendChild(canvas);

window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
})


const { setShouldShowFluidSimulation } = createFluidGrid(canvas);


const showSimToggle = document.querySelector("#show-simulation") as HTMLInputElement;
showSimToggle.addEventListener("change", (e) => {
  if (showSimToggle.checked) {
    setShouldShowFluidSimulation(true);
  } else {
    setShouldShowFluidSimulation(false);
  }
})