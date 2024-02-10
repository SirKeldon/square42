import { fromEvent, map, startWith, distinctUntilChanged } from "rxjs";
import { settings, Coordinate } from "./constants";

const buildCanvasBackground = (tileSize: number): string => {
  const urlCreator = window.URL || window.webkitURL;
  const svg = `
    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg"> 
        <defs>
            <pattern id="smallGrid" width="${tileSize}" height="${tileSize}" patternUnits="userSpaceOnUse">
                <path d="M ${tileSize} 0 L 0 0 0 ${tileSize}" fill="none" stroke="gray" stroke-width="0.5" />
            </pattern>
            <pattern id="grid" width="${tileSize * settings.rept}" height="${
    tileSize * settings.rept
  }" patternUnits="userSpaceOnUse">
                <rect width="${tileSize * tileSize}" height="${tileSize * tileSize}" fill="url(#smallGrid)" />
                <path d="M ${tileSize * tileSize} 0 L 0 0 0 ${
    tileSize * tileSize
  }" fill="none" stroke="gray" stroke-width="1" />
            </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
    </svg>
    `;
  const blob = new Blob([svg], { type: "image/svg+xml" });
  const url = urlCreator.createObjectURL(blob);
  const image = document.createElement("img");
  image.addEventListener("load", () => urlCreator.revokeObjectURL(url), { once: true });
  image.src = url;

  return url;
};

const composeCanvas = (tileSize: number, rows: number, cols: number): any => {
  const canvasBackground: string = buildCanvasBackground(tileSize);
  const canvasElem = <HTMLCanvasElement>document.createElement("canvas");

  canvasElem.style.backgroundImage = `url('${canvasBackground}')`;
  canvasElem.style.width = `${cols * tileSize + 1}px`;
  canvasElem.style.height = `${rows * tileSize + 1}px`;

  canvasElem.getContext("2d").canvas.width = cols * tileSize + 1;
  canvasElem.getContext("2d").canvas.height = rows * tileSize + 1;

  return { canvasElement: canvasElem, canvas: canvasElem.getContext("2d") };
};

export const composeScene = (htmlId: string): any => {
  const htmlMainElement = <HTMLDivElement>document.getElementById(htmlId);
  const { canvasElement, canvas } = composeCanvas(settings.size, settings.rows, settings.cols);
  htmlMainElement.appendChild(canvasElement);

  return { canvasElement, canvas };
};

export const clearGrid = (canvas: CanvasRenderingContext2D, canvasElement: HTMLCanvasElement) => {
  canvas.clearRect(0, 0, canvasElement.width, canvasElement.height);
};

const calculateDrawDeviation = (integer: number, tileSize: number) => integer * tileSize + 1;
const drawDot = (canvas: CanvasRenderingContext2D, coord: Coordinate, tileSize: number, color: string) => {
  canvas.fillStyle = color;
  canvas.fillRect(
    calculateDrawDeviation(coord.x, tileSize),
    calculateDrawDeviation(coord.y, tileSize),
    tileSize - 1,
    tileSize - 1
  );
};

export const render = (canvas: CanvasRenderingContext2D, canvasElement: HTMLCanvasElement, scene: any) => {
  const { canCross, elapsed, generation, matrix, survivors } = scene;
  clearGrid(canvas, canvasElement);
  renderGrid(canvas, matrix, generation);
  renderSurvivors(survivors);
  renderExtra({ generation, elapsed });
};

const renderGrid = (canvas: CanvasRenderingContext2D, grid: Array<Array<number>>, generation: number) => {
  if (generation === 0) generation = 1;

  const percentageToColor = (percentage, maxHue = 240, minHue = 0) => {
    const hue = percentage * (maxHue - minHue) + minHue; // 240-percentage
    return `hsl(${(240 - percentage) / 2}, 50%, 50%)`;
  };
  grid.forEach((row, x) => {
    row.forEach((element, y) => {
      let percentile;
      if (element >= 1) {
        percentile =
          (element * 360) / generation > 360 ? (element * 360) / generation / 360 : (element * 360) / generation;
        //percentile = (element/generation)*100
        //console.log(percentile);
      }

      if (element === 1) drawDot(canvas, { x, y }, settings.size, percentageToColor(percentile));

      if (element > 1) drawDot(canvas, { x, y }, settings.size, percentageToColor(percentile));
    });
  });
};

const renderSurvivors = (matrix: Array<number>) => {
  const getOrdinal = (i) => {
    var j = i % 10,
      k = i % 100;
    // if (i == 0)
    //     return 'justBorn';
    if (j == 1 && k != 11) return i + "st";
    if (j == 2 && k != 12) return i + "nd";
    if (j == 3 && k != 13) return i + "rd";
    return i + "th";
  };

  const cellsBreakdownDiv = document.getElementById("cells-breakdown");

  cellsBreakdownDiv.innerHTML = "";

  matrix.forEach((survivors, index) => {
    if (survivors >= 1) {
      const div = document.createElement("div");
      div.classList.add("columns");
      div.classList.add("is-gapless");

      const ordinalSpan = document.createElement("span");
      ordinalSpan.classList.add("has-text-weight-bold");
      ordinalSpan.classList.add("column");
      ordinalSpan.classList.add("is-two-thirds");

      ordinalSpan.appendChild(document.createTextNode(getOrdinal(index).concat(" ")));

      const survivorsSpan = document.createElement("span");
      survivorsSpan.classList.add("column");
      survivorsSpan.classList.add("is-one-third");

      survivorsSpan.appendChild(document.createTextNode(survivors.toString()));

      div.appendChild(ordinalSpan);
      div.appendChild(survivorsSpan);

      cellsBreakdownDiv.appendChild(div);
    }
  });

  const currentSurvivors = matrix && matrix.reduce((prev, cur) => prev + cur);

  document.getElementById("currentSurvivors").innerHTML = currentSurvivors.toString();
};

const renderExtra = ({ generation, elapsed }) => {
  document.getElementById("totalIterations").innerHTML = generation.toString();
  document.getElementById("timeElapsed").innerHTML = `${(elapsed / 1000).toString()}s`;
};

export const renderSpeed = (speed) => {
  document.getElementById("currentSpeed").innerHTML = speed.toString();
  slider.value = speed;
};

/**
 * VIEW CONTROLS
 */

export const slider: any = document.getElementById("myRange");
export const slider$ = fromEvent(slider, "change").pipe(
  map((val: any) => val.target.value),
  startWith(settings.speed),
  distinctUntilChanged()
);

export const play: any = document.getElementById("play");
export const play$ = fromEvent(play, "click");

export const reset: any = document.getElementById("reset");
export const reset$ = fromEvent(reset, "click");

export const canCrossClick: any = document.getElementById("canCross");
export const canCrossClick$ = fromEvent(canCrossClick, "click").pipe(
  map((val: any) => val.target.checked),
  startWith("on")
);
