import { produce } from 'immer';
import { settings, Coordinate } from './constants';

export const generateMatrix = (
    random:boolean = true,
    value:number = 0, 
    rows:number = settings.rows, 
    cols:number = settings.cols
): Array<Array<number>> => {
    const randish = (min:number, max:number) => 
        Math.floor(Math.random() * (max - min + 1) + min);

    let randomMatrix = [];
    for (let i = 0; i < cols; ++i) {
        randomMatrix[i] = [];
        for (let k = 0; k < rows; ++k) {
            randomMatrix[i][k] = random ? randish(1, 100) > 50 ? 1 : 0 : value;
        }
    } 
    return randomMatrix
}

const countNeighbours = (
    matrix: Array<Array<number>>, 
    { x, y }: Coordinate,
    canCross: boolean
): number => {
    let count = 0;
    const getModHead = (x:number, y:number) => ((y % x) + x) % x
    for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
            const xCoord = ((x+i) >= settings.cols || (x+i) < 0) && canCross 
                ? getModHead(settings.cols, x+i) : x+i;
            const yCoord = ((y+j) >= settings.rows || (y+j) < 0) && canCross 
                ? getModHead(settings.rows, y+j) : y+j;
            count += matrix[xCoord] && matrix[xCoord][yCoord] && matrix[xCoord][yCoord] >= 1 ? 1 : 0;
        }
    }
    count -= matrix[x][y] >= 1 ? 1 : 0;
    return count;
}

export const survivors = (matrix:Array<Array<number>>): Array<number> => {
    // Transformations from matrix to survivors 
    // 1. [[1, 3, 5], [2, 1, 2]] => [1, 1, 2, 2, 3, 5]
    // 2. [1, 1, 2, 2, 3, 5] => [2, 2, 1, 0, 1]
    const battlefield = [].concat.apply([], [...matrix])
        .filter((val: number) => val >= 1)
        .sort((a:number, b: number) => a - b);

    const generations = Array.from({length: battlefield[battlefield.length - 1]}, (_, i) => i + 1);

    const futureCells = generations
        .map((generation) => battlefield.filter(val => val === generation).length)

    return [...futureCells];
}

export function next(matrix: Array<Array<number>>, [tick, running, canCross]): Array<Array<number>> {
    const newState = produce(matrix, draft => {
        for (let x = 0; x < settings.cols; ++x) {
            for (let y = 0; y < settings.rows; ++y) {
                const value = matrix[x][y];
                const neighbours = countNeighbours(matrix, { x, y }, canCross);
                if (value >= 1 && (neighbours < 2 || neighbours > 3))
                    draft[x][y] = 0;

                if (value === 0 && neighbours === 3)
                    draft[x][y] = 1

                if (value >= 1 && (neighbours === 2 || neighbours === 3))
                    draft[x][y] = value+1;
                    // draft[x][y] = 2;
            }
        }
    });
    return newState;
}