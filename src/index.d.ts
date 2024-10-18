//interfaces with the help of CJ Moshy
interface Point {
  x: number;
  y: number;
}

interface Displayable {
  display(ctx: CanvasRenderingContext2D): void;
  drag(x: number, y: number): void;
}

type RenderEngine = (ctx: CanvasRenderingContext2D, line: Point[]) => void;

type DrawLineCommand = (engine: RenderEngine) => void;

type ActiveCursor = boolean;
