import "./style.css";

// Define structures for points, lines, and stickers
interface Point {
  x: number;
  y: number;
}

interface Line {
  points: Point[];
  thickness: number;
}

interface Sticker {
  position: Point;
  symbol: string;
  icon: string;
}

// Command types
type RenderDisplay = (
  ctx: CanvasRenderingContext2D,
  line: Point[],
  thickness: number
) => void;

type ToolPreview = (
  ctx: CanvasRenderingContext2D,
  thickness: number,
  stickerMode: boolean
) => void;

type StickerPreview = (
  ctx: CanvasRenderingContext2D,
  isActive: boolean,
  symbol: string
) => void;

// Command execution functions
type DrawLineCommand = (display: RenderDisplay) => void;
type DrawCursorCommand = (display: ToolPreview) => void;
type StickerCommand = (display: StickerPreview) => void;

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

const cursorStatus = {
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

// Structures managing lines, stickers, and command history
const allLines: Line[] = [];
const allStickers: Sticker[] = [];
let ongoingLine: Line = { points: [], thickness: selectedMarkerSize };
const redoLineBuffer: Line[] = [];
const redoStickerBuffer: Sticker[] = [];

/*lines 27 - 54 were in done in collaboration with CJ Moshy to get the command line pattern
code was also taken from email about functional prog.
source: https://www.typescriptlang.org/play/?#code...
*/

// Rendering functions for lines and stickers
const renderLine: RenderDisplay = (context, linePoints, lineThickness) => {
  if (linePoints.length === 0) return;
  context.beginPath();
  context.lineWidth = lineThickness;
  const [{ x: startX, y: startY }, ...otherPoints] = linePoints;
  context.moveTo(startX, startY);
  otherPoints.forEach((point) => {
    context.lineTo(point.x, point.y);
  });
  context.stroke();
};

const renderSticker: StickerPreview = (ctx, isActive, symbol) => {
  if (isActive && symbol) {
    ctx.fillText(symbol, cursorStatus.x, cursorStatus.y);
  }
};

// Command functions for drawing actions
function createDrawLineCommand(
  ctx: CanvasRenderingContext2D,
  line: Line
): DrawLineCommand {
  return (render: RenderDisplay) => {
    render(ctx, line.points, line.thickness);
  };
}

function createStickerCommand(
  ctx: CanvasRenderingContext2D,
  isActive: boolean,
  symbol: string
): StickerCommand {
  return (renderSticker: StickerPreview) => {
    renderSticker(ctx, isActive, symbol);
  };
}

function createCursorDrawCommand(
  ctx: CanvasRenderingContext2D,
  thickness: number,
  stickerMode: boolean
): DrawCursorCommand {
  return (renderTool: ToolPreview) => {
    renderTool(ctx, thickness, stickerMode);
  };
}

// Handles view updates
function updateCanvasView() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Render all lines and stickers individually
  allLines.forEach((line) => {
    const drawLineCmd = createDrawLineCommand(ctx, line);
    drawLineCmd(renderLine);
  });

  allStickers.forEach((sticker) => {
    const singleStickerCmd = createStickerCommand(ctx, true, sticker.symbol);
    singleStickerCmd((ctx, isActive, symbol) => {
      if (isActive) ctx.fillText(symbol, sticker.position.x, sticker.position.y);
    });
  });

  if (cursorStatus.isDrawing && !stickerMode) {
    const currentLineCmd = createDrawLineCommand(ctx, ongoingLine);
    currentLineCmd(renderLine);
  }

  if (stickerMode) {
    const stickerPreviewCmd = createStickerCommand(ctx, true, currentSticker);
    stickerPreviewCmd(renderSticker);
  } else {
    const cursorPreviewCmd = createCursorDrawCommand(
      ctx,
      selectedMarkerSize,
      stickerMode
    );
    cursorPreviewCmd((ctx, currentThickness, isStickerMode) => {
      if (!isStickerMode) {
        ctx.beginPath();
        ctx.arc(cursorStatus.x, cursorStatus.y, currentThickness / 2, 0, 2 * Math.PI);
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
canvas.addEventListener("canvas-updated", updateCanvasView);
canvas.addEventListener("tool-updated", updateCanvasView);
canvas.addEventListener("sticker-updated", updateCanvasView);

canvas.addEventListener("mousedown", (event) => {
  if (!stickerMode) {
    handleMouseDownEvent(event);
  } else {
    placeSticker(event);
  }
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

  if (stickerMode) {
    canvas.dispatchEvent(new Event("sticker-updated"));
  } else if (!cursorStatus.isDrawing) {
    canvas.dispatchEvent(new Event("tool-updated"));
  } else {
    addNewPoint(cursorStatus.x, cursorStatus.y);
  }
});

canvas.addEventListener("mouseup", () => {
  if (cursorStatus.isDrawing && !stickerMode) {
    allLines.push(ongoingLine);
    ongoingLine = { points: [], thickness: selectedMarkerSize };
    cursorStatus.isDrawing = false;
  }
});

const clearCanvasButton = document.createElement("button");
clearCanvasButton.id = "clearButton";
clearCanvasButton.innerHTML = "Clear";
clearCanvasButton.addEventListener("click", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  allLines.length = 0;
  allStickers.length = 0;
  ongoingLine = { points: [], thickness: selectedMarkerSize };
});

function handleMouseDownEvent(event: MouseEvent) {
  cursorStatus.isDrawing = true;
  ongoingLine = { points: [], thickness: selectedMarkerSize };
  cursorStatus.x = event.offsetX;
  cursorStatus.y = event.offsetY;
  addNewPoint(cursorStatus.x, cursorStatus.y);
}

// Function for placing stickers
function placeSticker(event: MouseEvent) {
  const position = { x: event.offsetX, y: event.offsetY };
  const newSticker: Sticker = { position, symbol: currentSticker, icon: currentSticker };
  allStickers.push(newSticker);
  canvas.dispatchEvent(new Event("canvas-updated"));
}

/* asking Brace if there was a way to make the undo and redo function together and make it readable
this pushes and pops the "stacks" the display list and redo list.*/
function moveBetweenStacks(
  fromArray: (Line | Sticker)[],
  toArray: (Line | Sticker)[],
  eventType: string
) {
  if (fromArray.length === 0) return;
  const movedItem = fromArray.pop();
  if (movedItem) {
    toArray.push(movedItem);
    canvas.dispatchEvent(new Event(eventType));
  }
}


const undoButton = document.createElement("button");
undoButton.id = "undoButton";
undoButton.innerHTML = "Undo";
undoButton.addEventListener("click", () => {
  moveBetweenStacks(
    //from brace and checks if allLines has any elements and if it does, return true false and move between the sticker arrays
    allLines.length ? allLines : allStickers,
    allLines.length ? redoLineBuffer : redoStickerBuffer,
    "canvas-updated"
  );
});

const redoButton = document.createElement("button");
redoButton.id = "redoButton";
redoButton.innerHTML = "Redo";
redoButton.addEventListener("click", () => {
  moveBetweenStacks(
    redoLineBuffer.length ? redoLineBuffer : redoStickerBuffer,
    redoLineBuffer.length ? allLines : allStickers,
    "canvas-updated"
  );
});

const switchMarkerTool = (selectedSize: string) => {
  stickerMode = false;
  selectedMarkerSize =
    selectedSize === "thin" ? MARKER_SIZES.THIN : MARKER_SIZES.THICK;
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

// Sticker buttons
const stickerButtons: HTMLButtonElement[] = STICKERS.map((sticker, index) => {
  const button = document.createElement("button");
  button.innerHTML = sticker;
  button.addEventListener("click", () => {
    selectSticker(index);
  });
  return button;
});

// Append buttons to the app UI
app.append(
  thinMarkerButton,
  thickMarkerButton,
  clearCanvasButton,
  undoButton,
  redoButton,
  ...stickerButtons
);