import "./style.css";

// Define interfaces for points and drawable items

// Application setup
const APPLICATION_NAME = "Drawing App";
const app = document.querySelector<HTMLDivElement>("#app")!;
document.title = APPLICATION_NAME;
app.innerHTML = APPLICATION_NAME;

const headerTitle = document.createElement("h1");
headerTitle.innerText = "Draw down below";

const canvas = document.createElement("canvas");
canvas.id = "drawingCanvas";
canvas.width = 256;
canvas.height = 256;

app.append(headerTitle, canvas);

const ctx = canvas.getContext("2d")!;

const cursor = {
  x: 0,
  y: 0,
  isDrawing: false,
};

let selectedMarkerSize = 1;
let stickerMode = false;
let currentSticker = "";

const MARKER_SIZES = {
  THIN: 1,
  THICK: 5,
};

const STICKERS = ["🤡", "🧐", "😐"];

// Structures managing drawable items and command history
const drawables: Drawable[] = [];
const redoDrawables: Drawable[] = [];
let ongoingLine: Line = {
  points: [],
  thickness: selectedMarkerSize,
  display: () => {},
};

/* Remainder of code provided by CJ Moshy and enhanced with functional programming patterns. */

// Implements the display function for Line
function createLine(points: Point[], thickness: number): Line {
  return {
    points,
    thickness,
    display(ctx) {
      if (this.points.length === 0) return;
      ctx.lineWidth = this.thickness;
      ctx.beginPath();
      const [{ x: startX, y: startY }, ...otherPoints] = this.points;
      ctx.moveTo(startX, startY);
      otherPoints.forEach((point) => {
        ctx.lineTo(point.x, point.y);
      });
      ctx.stroke();
    },
  };
}

// Implements the display function for Sticker
function createSticker(position: Point, symbol: string): Sticker {
  return {
    position,
    symbol,
    display(ctx) {
      ctx.fillText(this.symbol, this.position.x, this.position.y);
    },
  };
}

// Command to draw cursor
function createCursorDrawCommand(
  ctx: CanvasRenderingContext2D,
  thickness: number,
  stickerMode: boolean,
) {
  return (
    renderTool: (
      ctx: CanvasRenderingContext2D,
      thickness: number,
      stickerMode: boolean,
    ) => void,
  ) => {
    renderTool(ctx, thickness, stickerMode);
  };
}

// Handles view updates
function updateCanvasView() {
  console.log(stickerMode);
  console.log(`Cursor is currently: ${cursor.isDrawing}`);
  console.log()
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawables.forEach((drawable) => drawable.display(ctx));
  if(stickerMode != true){
    const runner = createLine(ongoingLine.points, selectedMarkerSize);
    runner.display(ctx);
  }
  if (stickerMode) {
    const position = { x: cursor.x, y: cursor.y };
    const stickerPreview = createSticker(position, currentSticker);
    stickerPreview.display(ctx);
  } 
  else {
    const cursorPreviewCmd = createCursorDrawCommand(ctx,selectedMarkerSize,stickerMode);
    cursorPreviewCmd((ctx, currentThickness, isStickerMode) => {
      if (!isStickerMode) {
        ctx.beginPath();
        ctx.arc(cursor.x, cursor.y, currentThickness / 2, 0, 2 * Math.PI,);
        ctx.stroke();
      }
    });
  }
}

function addNewPoint(x: number, y: number) {
  ongoingLine.points.push({ x, y });
  canvas.dispatchEvent(new Event("canvas-updated"));
}

// Event listeners
canvas.addEventListener("canvas-updated", () => {
  updateCanvasView();
});
canvas.addEventListener("tool-updated", () => {
  updateCanvasView();
});
canvas.addEventListener("sticker-updated", () => {
  updateCanvasView();
});

canvas.addEventListener("mousedown", () => {
  if (!stickerMode) {
    cursor.isDrawing = true;
    ongoingLine = createLine([], selectedMarkerSize);
    addNewPoint(cursor.x, cursor.y);
  } else {
    const position = { x: cursor.x, y: cursor.y };
    const newSticker = createSticker(position, currentSticker);
    drawables.push(newSticker);
    canvas.dispatchEvent(new Event("canvas-updated"));
  }
});

canvas.addEventListener("mouseout", () => {
  cursor.x = NaN;
  cursor.y = NaN;
  cursor.isDrawing = false;
  canvas.dispatchEvent(new Event("tool-updated"));
});

canvas.addEventListener("mousemove", (event) => {
  cursor.x = event.offsetX;
  cursor.y = event.offsetY;
  if (stickerMode) {
    canvas.dispatchEvent(new Event("sticker-updated"));
  } else if (!cursor.isDrawing) {
    canvas.dispatchEvent(new Event("tool-updated"));
  } else {
    addNewPoint(cursor.x, cursor.y);
  }
});

canvas.addEventListener("mouseup", () => {
  if (cursor.isDrawing && !stickerMode) {
    drawables.push(ongoingLine);
    ongoingLine = createLine([], selectedMarkerSize);
    cursor.isDrawing = false;
  }
});

const clearCanvasButton = document.createElement("button");
clearCanvasButton.id = "clearButton";
clearCanvasButton.innerHTML = "Clear";
clearCanvasButton.addEventListener("click", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawables.length = 0;
  ongoingLine = createLine([], selectedMarkerSize);
});

// Function for moving items in undo/redo operations
function moveBetweenStacks(
  fromArray: Drawable[],
  toArray: Drawable[],
  eventType: string,
) {
  if (fromArray.length === 0) return;
  const movedItem = fromArray.pop();
  if (movedItem) {
    toArray.push(movedItem);
    canvas.dispatchEvent(new Event(eventType));
  }
}

// Undo and redo buttons
const undoButton = document.createElement("button");
undoButton.id = "undoButton";
undoButton.innerHTML = "Undo";
undoButton.addEventListener("click", () => {
  moveBetweenStacks(drawables, redoDrawables, "canvas-updated");
});

const redoButton = document.createElement("button");
redoButton.id = "redoButton";
redoButton.innerHTML = "Redo";
redoButton.addEventListener("click", () => {
  moveBetweenStacks(redoDrawables, drawables, "canvas-updated");
});

const switchMarkerTool = (selectedSize: string) => {
  stickerMode = false;
  selectedMarkerSize = selectedSize === "thin"
    ? MARKER_SIZES.THIN
    : MARKER_SIZES.THICK;
};

const selectSticker = (index: number) => {
  stickerMode = true;
  currentSticker = STICKERS[index];
  canvas.dispatchEvent(new Event("sticker-updated"));
};

// Marker tool buttons
const thinMarkerButton = document.createElement("button");
thinMarkerButton.id = "thinMarker";
thinMarkerButton.innerHTML = "Thin";
thinMarkerButton.addEventListener("click", () => {
  switchMarkerTool("thin");
  canvas.dispatchEvent(new Event("tool-updated"));
});

const thickMarkerButton = document.createElement("button");
thickMarkerButton.id = "thickMarker";
thickMarkerButton.innerHTML = "Thick";
thickMarkerButton.addEventListener("click", () => {
  switchMarkerTool("thick");
  canvas.dispatchEvent(new Event("tool-updated"));
});


function makeStickerButton(sticker, index){
  const button = document.createElement("button");
  button.innerHTML = sticker;
  button.addEventListener("click", () => {
    selectSticker(index);
  });
  return button;
}

const stickerButtonsContainer = document.createElement("div");
stickerButtonsContainer.id = "stickerButtons";

STICKERS.forEach((sticker, index) => {
  const button = makeStickerButton(sticker, index);
  stickerButtonsContainer.appendChild(button);
});

app.append(stickerButtonsContainer);

const customStickerButton = document.createElement("button");
customStickerButton.id = "customSticker";
customStickerButton.innerHTML = "Create Custom Sticker"; 
customStickerButton.addEventListener("click", () => {
  const newSticker = String(prompt("Make a Custom Sticker", "🧽"));
  STICKERS.push(newSticker);
  const newStickerButton = makeStickerButton(newSticker, STICKERS.length - 1);
  stickerButtonsContainer.appendChild(newStickerButton)
});

// Append buttons to the app UI
app.append(
  thinMarkerButton,
  thickMarkerButton,
  clearCanvasButton,
  undoButton,
  redoButton,
  customStickerButton,
);
