//interfaces with the help of CJ Moshy
interface Point {
  x: number;
  y: number;
}

interface Drawable {
  display(ctx: CanvasRenderingContext2D): void;
}

interface Line extends Drawable {
  points: Point[];
  thickness: number;
  color: string;
}

interface Sticker extends Drawable {
  position: Point;
  symbol: string;
}

type RenderDisplay = (
  ctx: CanvasRenderingContext2D,
  line: Point[],
  thickness: number,
) => void;

type ToolPreview = (
  ctx: CanvasRenderingContext2D,
  thickness: number,
  isActive: boolean,
  stickerActive: boolean,
) => void;

type StickerPreview = (
  ctx: CanvasRenderingContext2D,
  isActive: boolean,
  symbol: string,
) => void;

//use of the drawline command comes from CJ Moshy and looking at his code
type DrawLineCommand = (display: RenderDisplay) => void;

type DrawCursorCommand = (display: ToolPreview) => void;

type StickerCommand = (display: StickerPreview) => void;

type MultipleMarkers = (markersize: string) => void;

type ActiveCursor = boolean;

//inteface borrowed from CJ Moshy
type AddStickerCommand = () => void;
