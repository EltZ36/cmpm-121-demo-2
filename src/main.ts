import "./style.css";

// Define interfaces for points and drawable items

// Application setup
const APPLICATION_NAME = "Drawing App";
const app = document.querySelector<HTMLDivElement>("#app")!;
document.title = APPLICATION_NAME;

const headerTitle = document.createElement("h1");
headerTitle.innerText = "Draw down below";

const canvas = document.createElement("canvas");
canvas.id = "drawingCanvas";
const canvasSize = 256;
canvas.width = canvas.height = canvasSize;

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
let currentHue = 0;

const MARKER_SIZES = {
  THIN: 1,
  THICK: 5,
};

let currentMarkerColor = "black";

const STICKERS = ["🤡", "🧐", "😐"];

// Structures managing drawable items and command history
const drawables: Drawable[] = [];
const redoList: Drawable[] = [];
let ongoingLine: Line = {
  points: [],
  thickness: selectedMarkerSize,
  color: currentMarkerColor,
  display: () => {},
};

//CreateLine done with the help of CJ Moshy
function createLine(points: Point[], thickness: number, color: string): Line {
  return {
    points,
    thickness,
    color,
    display(ctx) {
      ctx.strokeStyle = color;
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

//craateCursorDrawCommand was done with the help of CJ Moshy
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

//UpdateCanvasView and renderPreview also done witht he help of CJ Moshy and email about functional command pattern
function updateCanvasView(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
) {
  clearCanvas(ctx, canvas);
  renderDrawables(ctx);
  renderPreview(ctx);
}

function clearCanvas(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function renderDrawables(ctx: CanvasRenderingContext2D) {
  drawables.forEach((drawable) => drawable.display(ctx));
}

function renderPreview(ctx: CanvasRenderingContext2D) {
  if (!stickerMode) {
    ongoingLine.display(ctx);
  } else {
    const stickerPreview = createSticker(
      { x: cursor.x, y: cursor.y },
      currentSticker,
    );
    stickerPreview.display(ctx);
  }
  createCursorDrawCommand(ctx, selectedMarkerSize, stickerMode)(
    (ctx, thickness, mode) => {
      if (!mode) {
        ctx.beginPath();
        ctx.arc(cursor.x, cursor.y, thickness / 2, 0, 2 * Math.PI);
        ctx.stroke();
      }
    },
  );
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
    ongoingLine = createLine([], selectedMarkerSize, currentMarkerColor);
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
    ongoingLine = createLine([], selectedMarkerSize, currentMarkerColor);
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
  ongoingLine = createLine([], selectedMarkerSize, currentMarkerColor);
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
// fix implicit any
function makeStickerButton(sticker: string, index: number) {
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

// remove implied magic number
const CANVAS_SCALE = 4                                    // was not here
const exportButton = makeButton("Export Canvas", () => exportCanvas(CANVAS_SCALE));
                      // scalefactor only named here
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

const sliderContainer = document.createElement("div");
sliderContainer.id = "sliderContainerDiv";

const slider = document.createElement("input");
slider.id = "hueSlider";
slider.type = "range";
slider.min = "0";
slider.max = "360";
slider.value = `${currentHue}`;

const sliderLabel = document.createElement("span");
sliderLabel.id = "sliderLabel";
sliderLabel.innerText = `Adjust hue:`;

slider.addEventListener("input", () => {
  currentHue += Number(slider.value);
  currentMarkerColor = `hsl(${currentHue}, 50%, 50%)`;
});

sliderContainer.append(sliderLabel, slider);

// Append buttons to the app UI
app.append(
  thinMarkerButton,
  thickMarkerButton,
  undoRedoContainer,
  stickerButtonsContainer,
  exportButtonContainer,
  sliderContainer,
);
