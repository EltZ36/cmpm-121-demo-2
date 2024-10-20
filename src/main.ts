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
const redoList: Drawable[] = [];
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
function updateCanvasView(
  currentContext: CanvasRenderingContext2D,
  currentCanvas,
) {
  currentContext.clearRect(0, 0, currentCanvas.width, currentCanvas.height);
  drawables.forEach((drawable) => drawable.display(currentContext));
  if (stickerMode != true) {
    const runner = createLine(ongoingLine.points, selectedMarkerSize);
    runner.display(ctx);
  }
  if (stickerMode) {
    const position = { x: cursor.x, y: cursor.y };
    const stickerPreview = createSticker(position, currentSticker);
    stickerPreview.display(ctx);
  } else {
    const cursorPreviewCmd = createCursorDrawCommand(
      ctx,
      selectedMarkerSize,
      stickerMode,
    );
    cursorPreviewCmd((ctx, currentThickness, isStickerMode) => {
      if (!isStickerMode) {
        ctx.beginPath();
        ctx.arc(cursor.x, cursor.y, currentThickness / 2, 0, 2 * Math.PI);
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
  updateCanvasView(ctx, canvas);
});
canvas.addEventListener("tool-updated", () => {
  updateCanvasView(ctx, canvas);
});
canvas.addEventListener("sticker-updated", () => {
  updateCanvasView(ctx, canvas);
});

canvas.addEventListener("mousedown", () => {
  if (!stickerMode) {
    cursor.isDrawing = true;
    ongoingLine = createLine([], selectedMarkerSize);
    addNewPoint(cursor.x, cursor.y);
  } else {
    const newSticker = createSticker(
      { x: cursor.x, y: cursor.y },
      currentSticker,
    );
    drawables.push(newSticker);
    canvas.dispatchEvent(new Event("canvas-updated"));
  }
});

canvas.addEventListener("mouseout", () => {
  [cursor.x, cursor.y, cursor.isDrawing] = [NaN, NaN, false];
  canvas.dispatchEvent(new Event("tool-updated"));
});

canvas.addEventListener("mousemove", (event) => {
  [cursor.x, cursor.y] = [event.offsetX, event.offsetY];
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

function makeButton(
  buttonDescription: string,
  onClick: () => void,
): HTMLButtonElement {
  const button = document.createElement("button");
  button.innerHTML = buttonDescription;
  button.addEventListener("click", onClick);
  return button;
}

const clearCanvasButton = makeButton("Clear", () => {
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
  const poppedElement = fromArray.pop();
  if (poppedElement) {
    toArray.push(poppedElement);
    canvas.dispatchEvent(new Event(eventType));
  }
}

const undoRedoContainer = document.createElement("div");
undoRedoContainer.id = "undoRedoDiv";

// Undo and redo buttons
const undoButton = makeButton("undo", () => {
  moveBetweenStacks(drawables, redoList, "canvas-updated");
});

const redoButton = makeButton("redo", () => {
  moveBetweenStacks(redoList, drawables, "canvas-updated");
});

undoRedoContainer.appendChild(undoButton);
undoRedoContainer.appendChild(redoButton);
undoRedoContainer.appendChild(clearCanvasButton);

const switchMarkerTool = (selectedSize: string) => {
  stickerMode = false;
  selectedMarkerSize = selectedSize === "thin"
    ? MARKER_SIZES.THIN
    : MARKER_SIZES.THICK;
  canvas.dispatchEvent(new Event("tool-updated"));
};

const selectSticker = (index: number) => {
  stickerMode = true;
  currentSticker = STICKERS[index];
  canvas.dispatchEvent(new Event("sticker-updated"));
};

// Marker tool buttons
const thinMarkerButton = makeButton("Thin", () => {
  switchMarkerTool("thin");
});
const thickMarkerButton = makeButton("Thick", () => {
  switchMarkerTool("thick");
});

function makeStickerButton(sticker, index) {
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

const customStickerButton = makeButton("Create Custom Sticker", () => {
  const newSticker = String(prompt("Make a Custom Sticker", "🧽"));
  STICKERS.push(newSticker);
  const newStickerButton = makeStickerButton(newSticker, STICKERS.length - 1);
  stickerButtonsContainer.appendChild(newStickerButton);
});

stickerButtonsContainer.appendChild(customStickerButton);

const exportButtonContainer = document.createElement("div");
exportButtonContainer.id = "exportButtonDiv";

const exportButton = makeButton("Export Canvas", () => exportCanvas(4));

function exportCanvas(scaleFactor: number) {
  const tempCanvas = document.createElement("canvas");
  [tempCanvas.width, tempCanvas.height] = [
    canvas.width * scaleFactor,
    canvas.height * scaleFactor,
  ];
  const tempctx = tempCanvas.getContext("2d")!;
  tempctx.scale(scaleFactor, scaleFactor);
  updateCanvasView(tempctx, tempCanvas);
  tempctx.save();
  const anchor = document.createElement("a");
  anchor.href = tempCanvas.toDataURL("image/png");
  anchor.download = "sketchpad.png";
  anchor.click();
}

exportButtonContainer.appendChild(exportButton);

// Append buttons to the app UI
app.append(
  thinMarkerButton,
  thickMarkerButton,
  undoRedoContainer,
  stickerButtonsContainer,
  exportButtonContainer,
);
