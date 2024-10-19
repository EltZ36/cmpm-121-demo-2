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

//use of the drawline command comes from CJ Moshy and looking at his code
type DrawLineCommand = (display: RenderDisplay) => void;

type MultipleMarkers = (markersize: string) => void;

type ActiveCursor = boolean;
