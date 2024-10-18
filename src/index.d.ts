//interfaces with the help of CJ Moshy
interface Point {
  x: number;
  y: number;
}

type RenderDisplay = (ctx: CanvasRenderingContext2D, line: Point[]) => void;

type DrawLineCommand = (display: RenderDisplay) => void;

type ActiveCursor = boolean;
