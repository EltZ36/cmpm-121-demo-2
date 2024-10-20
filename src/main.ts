import "./style.css";

const APPLICATION_NAME = "Drawing App";
const applicationContainer = document.querySelector<HTMLDivElement>("#app")!;
document.title = APPLICATION_NAME;
applicationContainer.innerHTML = APPLICATION_NAME;

const headerTitle = document.createElement("h1");
headerTitle.innerText = "Draw down below";

const canvas = document.createElement("canvas");
canvas.id = "drawingCanvas";
canvas.width = 256;
canvas.height = 256;

applicationContainer.append(headerTitle, canvas);

const canvasContext = canvas.getContext("2d")!;

const cursorStatus = {
  x: 0,
  y: 0,
  isDrawing: false,
};

let selectedMarkerSize = 1;

const MARKER_SIZES = {
  THIN: 1,
  THICK: 5,
};

// Structures for managing lines and command history
const allLines: Line[] = [];
let ongoingLine: Line = { points: [], thickness: selectedMarkerSize };
const redoLineBuffer: Line[] = [];

/*lines 27 - 54 were in done in collaboration with CJ Moshy to get the command line pattern
code was also taken from email about functional prog.
source: https://www.typescriptlang.org/play/?#code...
*/

// Display functions for drawing lines on the canvas
const renderLine: RenderDisplay = (context, linePoints, lineThickness) => {
  if (linePoints.length === 0) return;

  context.beginPath();
  context.lineWidth = lineThickness;
  const [{ x: startX, y: startY }, ...otherPoints] = linePoints;
  context.moveTo(startX, startY);

  otherPoints.forEach(point => {
    context.lineTo(point.x, point.y);
  });

  context.stroke();
};

// Command functions for drawing lines and cursor previews
function createDrawLineCommand(ctx: CanvasRenderingContext2D, line: Line): DrawLineCommand {
  return (render: RenderDisplay) => {
    render(ctx, line.points, line.thickness);
  };
}

const renderToolPreview: ToolPreview = (ctx, currentThickness, isActive) => {
  if (!isActive) {
    ctx.beginPath();
    ctx.arc(cursorStatus.x, cursorStatus.y, currentThickness, 0, 2 * Math.PI);
    ctx.stroke();
  }
};

function createCursorDrawCommand(ctx: CanvasRenderingContext2D, thickness: number, isActive: boolean): DrawCursorCommand {
  return (renderPreview: ToolPreview) => {
    renderPreview(ctx, thickness, isActive);
  };
}

function updateCanvasView() {
  canvasContext.clearRect(0, 0, canvas.width, canvas.height);

  allLines.forEach(line => {
    const drawLineCmd = createDrawLineCommand(canvasContext, line);
    drawLineCmd(renderLine);
  });

  if (cursorStatus.isDrawing) {
    const currentLineCmd = createDrawLineCommand(canvasContext, ongoingLine);
    currentLineCmd(renderLine);
  }

  const cursorPreviewCmd = createCursorDrawCommand(canvasContext, selectedMarkerSize, false);
  cursorPreviewCmd(renderToolPreview);
}

function addNewPoint(x: number, y: number) {
  ongoingLine.points.push({ x, y });
  canvas.dispatchEvent(new Event("canvas-updated"));
}

canvas.addEventListener("canvas-updated", updateCanvasView);

canvas.addEventListener("tool-updated", updateCanvasView);

canvas.addEventListener("mousedown", (event) => {
  handleMouseDownEvent(event);
});

canvas.addEventListener("mouseout", () => {
  cursorStatus.x = NaN;
  cursorStatus.y = NaN;
  cursorStatus.isDrawing = false;
  canvas.dispatchEvent(new Event("tool-updated"));
});

canvas.addEventListener("mousemove", (event) => {
  cursorStatus.x = event.offsetX;
  cursorStatus.y = event.offsetY;
  
  if (!cursorStatus.isDrawing) {
    canvas.dispatchEvent(new Event("tool-updated"));
  } else {
    addNewPoint(cursorStatus.x, cursorStatus.y);
  }
});

canvas.addEventListener("mouseup", () => {
  if (cursorStatus.isDrawing) {
    allLines.push(ongoingLine);
    ongoingLine = { points: [], thickness: selectedMarkerSize };
    cursorStatus.isDrawing = false;
  }
});

const clearCanvasButton = document.createElement("button");
clearCanvasButton.id = "clearButton";
clearCanvasButton.innerHTML = "Clear";
clearCanvasButton.addEventListener("click", () => {
  canvasContext.clearRect(0, 0, canvas.width, canvas.height);
  allLines.length = 0;
  ongoingLine = { points: [], thickness: selectedMarkerSize };
});

function handleMouseDownEvent(event: MouseEvent) {
  cursorStatus.isDrawing = true;
  ongoingLine = { points: [], thickness: selectedMarkerSize };
  cursorStatus.x = event.offsetX;
  cursorStatus.y = event.offsetY;
  addNewPoint(cursorStatus.x, cursorStatus.y);
}

/* asking Brace if there was a way to make the undo and redo function together and make it readable
   this pushes and pops the "stacks" the display list and redo list.*/
function moveLinesBetweenArrays(fromArray: Line[], toArray: Line[], eventType: string) {
  if (fromArray.length === 0) return;

  const movedLine = fromArray.pop();
  if (movedLine) {
    toArray.push(movedLine);
    canvas.dispatchEvent(new Event(eventType));
  }
}

// Undo and redo buttons
const undoButton = document.createElement("button");
undoButton.id = "undoButton";
undoButton.innerHTML = "Undo";
undoButton.addEventListener("click", () => {
  moveLinesBetweenArrays(allLines, redoLineBuffer, "canvas-updated");
});

const redoButton = document.createElement("button");
redoButton.id = "redoButton";
redoButton.innerHTML = "Redo";
redoButton.addEventListener("click", () => {
  moveLinesBetweenArrays(redoLineBuffer, allLines, "canvas-updated");
});

const switchMarkerTool = (selectedSize: string) => {
  selectedMarkerSize = selectedSize === "thin" ? MARKER_SIZES.THIN : MARKER_SIZES.THICK;
};

const thinMarkerButton = document.createElement("button");
thinMarkerButton.id = "thinMarker";
thinMarkerButton.innerHTML = "Thin";
thinMarkerButton.addEventListener("click", () => {
  switchMarkerTool("thin");
});

const thickMarkerButton = document.createElement("button");
thickMarkerButton.id = "thickMarker";
thickMarkerButton.innerHTML = "Thick";
thickMarkerButton.addEventListener("click", () => {
  switchMarkerTool("thick");
});

applicationContainer.append(thinMarkerButton, thickMarkerButton, clearCanvasButton, undoButton, redoButton);