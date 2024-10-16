import "./style.css";

const APP_NAME = "Drawing App";
const app = document.querySelector<HTMLDivElement>("#app")!;

document.title = APP_NAME;
app.innerHTML = APP_NAME;

const title = document.createElement("h1");
title.innerText = "Draw down below";

const drawingCanvas = document.createElement('canvas');
drawingCanvas.id = "drawingCanvas";
drawingCanvas.width = 256;
drawingCanvas.height = 256;

app.append(title);
app.append(drawingCanvas);
