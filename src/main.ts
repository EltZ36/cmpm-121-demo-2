import "./style.css";

const APP_NAME = "Drawing App";
const app = document.querySelector<HTMLDivElement>("#app")!;
document.title = APP_NAME;
app.innerHTML = APP_NAME;

const title = document.createElement("h1");
title.innerText = "Draw down below";

const drawingCanvas = document.createElement("canvas");
drawingCanvas.id = "drawingCanvas";
drawingCanvas.width = 256;
drawingCanvas.height = 256;

app.append(title);
app.append(drawingCanvas);

const ctx = drawingCanvas.getContext("2d")!;
let cursor_active: ActiveCursor = false;

//changed from Array<array<number>> with the help of CJ Moshy
const lines: Point[][] = [];
let currentLine: Point[] = [];
let redoLines: Point[][] = [];

/*lines 27 - 54 were in done in collaboration with CJ Moshy to get the command line pattern
code was also taken from email about functional prog.
source: https://www.typescriptlang.org/play/?#code/PTAEDEFUDkGEBUCSB5aBlUBBASgUVPABL6QAySAspvPrMhVdACJoBQrIoAmgPYCuoANYA7HgHdQAFwAWAU1CweAWyUBDYQBNQABVWTJsgE7DQACmn6ADgGcAXCEOyAZqoDGknoYCWwgOYA6Xz5DPmANWWsvX2EAWks9A2NrYFdlNU0ASgB+DjBESVBrfk1rUFSlSwAbL1c9WQ0AGlAAKgjLWVcvVUrKgE9m0DE5E17+KUNeqR5QR26vAC95GS9S+P0jEx9QXNB1UB4AIwArDskYzy9ZYQMtS0MeX0NVFR9fM2RkbQzQSvUg1V88mqgnkAClVAA3VT7QwKADUcP87E4AHVhqBRgInD4tJjDNZZJUnKAtr8-HwAfIxF4ZLtQE4+MJ3F4eMJuqA7g8ni8-GZwF9QHJVIZJDtgfI0K45Ep5J4WuCoZLvJZJM0mpjQICCm5XBFSh46Y41IZBKoDn0OcF5E5PEp9sSZLIduV0rcEhtbBAYAgUOgAITIsCYMppdRaYSyer66YHeQ+CE8Wrm2Se+DSPQAcn1clASh41gKhwhLL42deGLGtRMGmm1Np0IZTMkLOEfu2nGDLrDhWk-EqWh4TgMJm6lXEJMkpQARI5dV4IUYp1NQLHCmJVJZ2gO+JJU+nJFmfl4QRzVNZIrzhUEZddrAGOyGVN3rL2+P3QFdajY33U6bH08WcpnrsJiHCc7gVgIVaFB4jgkiOIbXKoPhGJ6-joTsoCICY-I-H8FKAtYTSNsyrKlMK8hHKWBSiIYaiVKAGh6NCUKVHwERNN2GrQQWnhLNKgxyI4C6whq67XAGOxoHwm75lS8gAfIRQykIOL2oxKxVKokxXL4KFSPuZR7I4mhGDB3h+KUNqwo6oClmZBoErISI+IkLi6qATCab8vS4H4+kAN6sKAIUzFc4SGGgkgWb4ph2OZrwZJ6CZeBorAAL6BqAhBGHG5GMXwKg6f5EYGXooBUQWPwPNGBlKalsgHMKiFFJUcYmLZ8C9O0SpeCqHI+Y8xQaEiqTCFVY2tbIfl6aVAC8oBBaFYWmZF0WvHFnoFjF3xLctoWTTwbX+GOsUAAZMIgaDaKQmBcKAuDQAA4og0C4J6AAkAXWOlZ0ZMFoWZZlOwovIShRBYK5LLIFQ3MuagnnszRmttbiqiuZ7yK4vznmVBRfpIVrZnG4TQoOhTKLIyy8jIeg7CsRnxMm6kmRF5Y0gSRKavOVz7KV5MyHJH4lRE-hmIgjGshmBROJGDG+DwPBaGa-AFMs1j+P9KPRWjZQ46UsDqFC1hedYWm9GabWwPri0AyF2tPBBrNGKYukoZ6pvmzNKFJaAKVpcDnBprzYhgxDBQI1jrKuI4BiFHw5q1OeER4xpWj2QyDFiJ4gi2Kw2NnqUpA0kY3SwEwsAfgAHsOGgG0bZ6ez5luyNbhe28tdzzr+1SJN0W3rX4dstdFfDuJ4pi96XlQDztHf7SF1gyS7GQANzD8t6snSXTwMQtU+7+vy2ZctzuGK7Ise952nexGu0b6FbsRv4Z9RTFphbwf3TfJw6sksTfMLSuVygWcs1QIwBmPhldgk0ChyB6DwAAjKABaEYJDFz7pUcusBTBTngWORBU416sHwUgl+4UXaHTarfWQa9QCcEutdW691HovTep6UhiCsrBxDOEXYBweALnpHLUo4oJyDGAmIbw6wTAHEmNCBU0JOSPGeDKWEQxpgMzQcuLqPUY59UkEiTgpAqaHmsHWKUy5lJU2kOWbGckbKaI0CyNQzZXAEG6hEfR-U5F2QvG8YBhh3IRFYIE4JoBsAUKeMzPaIUz4X1mimTy19fIi19v7aBOxCDjhrFhFosCQjuAGHsMCpxU5jWskoWqf8wluFkDkEizZWS5lUCCDB09ImrRbpPHe-cEp+F9p0iKLd55xKpsEEwsT9rxKfkkpuN80mjIXo-EW5DVpvw2l-So-1lmgBPoDTJsDBSEjHAAJhQS0tpvTKhDNLsmXBpDTlEPXo8tZEVTBUOmmk1e9CwCMJundB6z1XrvWOQg053DDJQm8HoFs8EEyVAXMrI8+g2orhpD8PUHJ7gqJUGZJqQSmgHB3OImsERhDS2EYSMUx55DQjUEcOUXgKj3AXDeQx2VxCyBEk0VkSl6IMVjBGbEu4YFkTgScngABmT0tzolotQbIdB1zsEPMlVKohJD1VvMoWRI6XzEk-zAKDXYcEmquEEOuQwdcYjlDWF4ZmdZpB1T1oXGITUCRaHCJEaISIQZYz2Lk2M6xDBtnAJ4LU+xjinCIhVaifjrSMlIuNe8QYVoRXpEmppmxSjWOWNEcpexZBVw6DuOlvhkLjW1BpM2PlhaJKaLTA85Eeh+skJ4iJUTwAmAWgk92yTa0LMNSggAfH7HgqV16sEaXCyO7Td7YHAD0zBs9Eqyq7ZM4escJlmFmVfQdqTh1zTHbMnVa135bOIcDI5pCAAsFy53XMXWqhBt7nlatfR8vV1Dvm-M8ldAFLDgXsLBWOW9WUABCkw5HxHPOWYtVQagYoLsnWNodTXWkcEsaYkc7KWBaGggY7b2ilHJmfTNTYWzWB2N4XwkNyq2THLUbNgwqTqDVtMeydU7ROtVgZHwghywqxJb2CQBoI3qAWPxGG9NrjTGhDuLwvdJjVAOE8CYfr87itzHqSk8VtqvAANoAF0LkmfXjeyVABWddq1u0XL7RGfdXtFnHvrShM9Gy-CmBlOePT-hGU+FMBmDMGRiG+esP5ywpZpC4NkM8v9Uo-jScYsxVOtkZ3NOpD0QYOdBg0mdb8RIrAIv+cZC+LwQ4HnvtK4RfwtaaiyFMKcpoAAGJoU5KhTg6118Lum6vRZfLgngmraui0G7FsbGs2p+BkP4DwXnYphY-WOKzX7xr6poXQhhAHmFArYaC0hVmsqIAqJ4SQ7G9zyGUdyNRglNGlCkTScstlUh8INOkPqP445nSm2dHYZLrAUpopGLQBoRDiBSBRVO1jsWyBiMWlYzZeRyvswzBWL3aw5x2E61OTELtixNTWYHoAIz1GXNTQQ-C+MaJaOIcaRGczCieL0P1nBTucjZVcScK5JjmJpFKcsTh7h2mhCh6w7rMZaFmNUeYsLmkCxzF2TQp4Q3CB2AaBsWaWyS89WFOYcvs1504KAGIoA0DMqqGZawvQkJV2XMW0tcdXuhhV6YTLJhag5ZEkvUoMpBZaC99szCZu0CUzChoMeLGthvfkOaHg5VrKXPLNCro2bSMOiV67tKJuzeYAOEpmkkwDRcY99XO4eoqNmGPd8JPABHPgNQqep-l+NXYj2TlZTRLzTXm4LQ1NJsbsAIUzdMGmBqRSIF+Gowgh6rGNtcfND5cUg4M+I42KVjkE3pvPLj7GJPvYtSPK49EPSS4-ZyIq6XxGAY-vewaC32AXgAgXx9luPcJq5pJiVQKFx6EHqagWgPcBgfACxZBVARodgIMSVidKVrJI0DRwgC44JbJiMkkzo0DO07Me1d1L4B0XMj0x1-ZV4zogA
lines 76 - 80
*/
const display: RenderDisplay = (ctx, line) => {
  if (line.length === 0) return;
  ctx.beginPath();
  const [{ x, y }, ...rest] = line;
  //from lecture 9 and is destructuring assignment
  //move to the first part of the array
  ctx.moveTo(x, y);
  //do the rest
  rest.forEach((point) => {
    ctx.lineTo(point.x, point.y);
  });
  ctx.stroke();
};

function draw_line(ctx, line): DrawLineCommand {
  return (display: RenderDisplay) => display(ctx, line);
}

function redraw() {
  ctx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
  let runner = draw_line(ctx, currentLine);
  runner(display);

  for (const l of lines) {
    let runner = draw_line(ctx, l);
    runner(display);
  }
}

function addPoint(x: number, y: number) {
  currentLine.push({ x, y });
  drawingCanvas.dispatchEvent(new Event("drawing-changed"));
}

drawingCanvas.addEventListener("drawing-changed", redraw);

drawingCanvas.addEventListener("mousedown", (e) => {
  cursor_active = true;
  const { offsetX, offsetY } = e;
  addPoint(offsetX, offsetY);
});

drawingCanvas.addEventListener("mousemove", (e) => {
  if (!cursor_active) {
    return;
  }
  const { offsetX, offsetY } = e;
  addPoint(offsetX, offsetY);
});

drawingCanvas.addEventListener("mouseup", (e) => {
  if (!cursor_active) {
    return;
  }
  //make a copy of the currentLine
  lines.push([...currentLine]);
  currentLine = [];
  cursor_active = false;
});

const clearButton = document.createElement("button");
clearButton.id = "clearButton";
clearButton.innerHTML = "clear";
clearButton.addEventListener("click", () => {
  ctx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
  lines.length = 0;
  currentLine = [];
});

/* asking Brace if there was a way to make the undo and redo function together and make it readable
  this pushes and pops the "stacks" the display list and redo list.*/
function moveBetweenStacks(
  fromStack: Point[][],
  toStack: Point[][],
  eventType: string,
) {
  //from CJ Moshy helping refactor code
  if (fromStack.length === 0) {
    return;
  }
  const poppedElement = fromStack.pop();
  if (poppedElement) {
    toStack.push(poppedElement);
    drawingCanvas.dispatchEvent(new Event(eventType));
  }
}

const undoButton = document.createElement("button");
undoButton.id = "undoButton";
undoButton.innerHTML = "undo";
undoButton.addEventListener("click", () => {
  moveBetweenStacks(lines, redoLines, "drawing-changed");
});

const redoButton = document.createElement("button");
redoButton.id = "redoButton";
redoButton.innerHTML = "redo";
redoButton.addEventListener("click", () => {
  moveBetweenStacks(redoLines, lines, "drawing-changed");
});

app.append(clearButton);
app.append(undoButton);
app.append(redoButton);
