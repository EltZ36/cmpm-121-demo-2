//interfaces with the help of CJ Moshy
interface Point {
  x: number;
  y: number;
}

interface Line {
  points: Point[];
  thickness: number;
}

type RenderDisplay = (
  ctx: CanvasRenderingContext2D,
  line: Point[],
  thickness: number,
) => void;

type ToolPreview = (
  ctx: CanvasRenderingContext2D,
  thickness: number,
  sticker: boolean,
) => void;

//use of the drawline command comes from CJ Moshy and looking at his code
type DrawLineCommand = (display: RenderDisplay) => void;

type DrawCursorCommand = (display: ToolPreview) => void;

type MultipleMarkers = (markersize: string) => void;

type ActiveCursor = boolean;
