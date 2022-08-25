export const settings = {
    cols: 56,
    rows: 16,
    size: 14,
    rept: 8,
    fps: 60,
    speed: 500,
    canCross: true,
}

export interface Coordinate {
    x: number,
    y: number
};

export interface GameOfLife {
    matrix:     Array<Array<number>>
    survivors:  Array<number>,
    canCross:   boolean,            
    elapsed:    number,
    generation: number,
    running:    boolean
}