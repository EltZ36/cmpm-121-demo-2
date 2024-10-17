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

const lines: Array<Array<{ x: number, y: number }>> = []; 
let currentLine: Array<{ x: number, y: number }> = [];

function redraw(){
    ctx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
    lines.forEach(line => {
        if(line.length > 0) {
            ctx.beginPath();
            const [{x, y}, ...rest] = line;
            //from lecture 9 and is destructuring assignment 
            //move to the first part of the array
            ctx.moveTo(x,y);
            //do the rest
            rest.forEach(point => {
                ctx.lineTo(point.x, point.y)
            });

            ctx.stroke();
        }
    })
}

function addPoint(x: number, y: number ){
    currentLine.push({x, y});
    const drawingChangedEvent = new Event("drawing-changed");
    drawingCanvas.dispatchEvent(drawingChangedEvent);
}

drawingCanvas.addEventListener("drawing-changed", redraw); 

drawingCanvas.addEventListener("mousedown", (e) => {
    currentLine = [];
    lines.push(currentLine);
    cursor.active = true; 
    cursor.x = e.offsetX;
    cursor.y = e.offsetY;
    addPoint(cursor.x, cursor.y)
});

drawingCanvas.addEventListener("mousemove", (e) => {
    if(cursor.active){
        cursor.x = e.offsetX;
        cursor.y = e.offsetY;
        addPoint(cursor.x, cursor.y)
    }
});

drawingCanvas.addEventListener("mouseup", (e) => {
    if(cursor.active){
        currentLine = [];
        cursor.x = 0;
        cursor.y = 0;
        cursor.active = false;
    }  
});

const clearButton = document.createElement('button');
    clearButton.id = "clearButton";
    clearButton.innerHTML = "clear";
    clearButton.addEventListener('click', () =>{
    ctx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height)
    lines.length = 0;
    currentLine = [];
}); 


app.append(clearButton);