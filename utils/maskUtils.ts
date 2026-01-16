
import { getStroke } from 'perfect-freehand';

export interface Point {
  x: number;
  y: number;
  pressure?: number;
}

export function getSvgPathFromStroke(stroke: number[][]): string {
  if (!stroke.length) return "";

  const d = stroke.reduce(
    (acc, [x0, y0], i, arr) => {
      const [x1, y1] = arr[(i + 1) % arr.length];
      acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
      return acc;
    },
    ["M", ...stroke[0], "Q"]
  );

  d.push("Z");
  return d.join(" ");
}

/**
 * Generates a variable-width path data string from input points.
 * @param points Array of input points {x, y, pressure}
 * @param options Styling options for the stroke
 */
export function generateOrganicMaskPath(
  points: Point[], 
  options: { size?: number; thinning?: number; smoothing?: number; streamline?: number } = {}
): string {
  const strokePoints = getStroke(points, {
    size: options.size || 16,
    thinning: options.thinning || 0.5,
    smoothing: options.smoothing || 0.5,
    streamline: options.streamline || 0.5,
    easing: (t) => t,
    start: {
      taper: 0,
      easing: (t) => t,
      cap: true
    },
    end: {
      taper: 0,
      easing: (t) => t,
      cap: true
    }
  });

  return getSvgPathFromStroke(strokePoints);
}
