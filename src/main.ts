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

const ctx = drawingCanvas.getContext('2d')!;
const cursor = { active: false, x : 0, y: 0};

function drawLine(context: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number){
    context.beginPath();
    context.strokeStyle = "black";
    context.lineWidth = 1;
    context.moveTo(x1, y1);
    context.lineTo(x2, y2);
    context.stroke();
    context.closePath();
}

drawingCanvas.addEventListener("mousedown", (e) => {
    cursor.x = e.offsetX;
    cursor.y = e.offsetY;
    cursor.active = true;
});

drawingCanvas.addEventListener("mousemove", (e) => {
    if(cursor.active){
        drawLine(ctx, cursor.x, cursor.y, e.offsetX, e.offsetY);
        cursor.x = e.offsetX;
        cursor.y = e.offsetY;
    }
});

drawingCanvas.addEventListener("mouseup", (e) => {
    if(cursor.active){
        drawLine(ctx, cursor.x, cursor.y, e.offsetX, e.offsetY)
        cursor.x = 0;
        cursor.y = 0;
        cursor.active = false;
    }
});

const clearButton = document.createElement('button');
clearButton.id = "clearButton"
clearButton.innerHTML = "clear";
clearButton.addEventListener('click', () =>{
    ctx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height)
}); 

app.append(clearButton);