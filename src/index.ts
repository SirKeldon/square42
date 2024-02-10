// RXJS IMPORTS
import {
  animationFrameScheduler,
  BehaviorSubject,
  interval,
  Observable,
  withLatestFrom,
  startWith,
  switchMap,
  takeWhile,
  repeat,
  map,
  of,
  tap,
  share,
  scan,
  skip,
} from "rxjs";

import { composeScene, render, renderSpeed, play$, reset$, slider$, canCrossClick$, canCrossClick } from "./drawer";
import { next, generateMatrix, survivors } from "./gof";
import { settings, GameOfLife } from "./constants";

require("./styles.scss");

/**
 * INITIAL SETTINGS
 *
 * Add the canvas to an specified 'htmlID'
 * 'FPS':                maintains the rate of how often the screen should be repainted
 * 'tick$':              is an interval based on 'speed$' and
 *                       controls how often the matrix is updated to the next generation
 * 'gameAvailable$':     is a flag to determine the state of the general game
 */

const { canvasElement, canvas } = composeScene("game");

const FPS = 60;
const speed$ = new BehaviorSubject<number>(settings.speed);
const tick$ = speed$.pipe(switchMap((period: number) => interval(period, animationFrameScheduler)));

function createGame(fps$: Observable<number>): Observable<GameOfLife> {
  /**
   * Basics
   *
   * 'generation$'    will keep track each time the matrix upgrades of how many generations have passed
   * 'canCross$'      is a game control that allows the cells to mimic an infinite plane
   * 'running$'       is a game control that allows to play/pause the simulation and will affect 'matrix$'
   * 'matrix$'        is the real array of dots that each 'tick$' gets mapped through 'next' function
   * 'survivors$'     each time the 'matrix$' changes all of its survivors are mapped through generations
   * 'timeSpent$'     each time the 'matrix$' changes time is counted according to 'speed$' value
   */

  const generation$ = new BehaviorSubject<number>(0);
  const canCross$ = new BehaviorSubject<boolean>(settings.canCross);
  const running$ = new BehaviorSubject<boolean>(false);

  let matrix = generateMatrix();

  const matrix$ = tick$.pipe(
    withLatestFrom(running$, canCross$),
    takeWhile(([_, running]) => running),
    repeat(),
    scan(next, matrix),
    share()
  );

  matrix$
    .pipe(
      withLatestFrom(generation$),
      tap(([_, generation]) => generation$.next(generation + 1))
    )
    .subscribe();

  const survivors$ = matrix$.pipe(map(survivors));

  const timeSpent$ = new BehaviorSubject<number>(0);
  const elapsed$ = matrix$.pipe(
    skip(1),
    withLatestFrom(timeSpent$, speed$, (_, timeSpent, speed) => ({ timeSpent, speed })),
    tap(({ timeSpent, speed }) => timeSpent$.next(timeSpent + speed)),
    map(({ timeSpent, speed }) => timeSpent + speed)
  );

  // VIEW INTERACTIONS
  play$.pipe(withLatestFrom(running$, (_, running) => ({ running }))).subscribe(({ running }) => {
    running$.next(!running);
  });

  canCrossClick$.subscribe((val) => {
    canCrossClick.checked = val;
    canCross$.next(val === "on");
  });

  speed$.next(settings.speed);
  slider$.subscribe((val) => speed$.next(parseInt(val)));
  speed$.subscribe((speed) => renderSpeed(speed));

  // Let the game be available
  gameAvailable$.next(true);

  // Generate the main scene
  return fps$.pipe(
    withLatestFrom(
      canCross$,
      running$,
      generation$,
      matrix$,
      survivors$,
      elapsed$,
      (_, canCross, running, generation, matrix, survivors, elapsed) => ({
        canCross,
        running,
        generation,
        matrix,
        survivors,
        elapsed,
      })
    ),
    startWith({
      matrix,
      survivors: survivors(matrix),
      canCross: settings.canCross,
      elapsed: 0,
      generation: 0,
      running: false,
    })
  );
}

/**
 * Main Game Interaction
 *  - 'game$' Creates an observable that will create a game as soon as the game is available (via 'gameAvailable$')
 *      - 'createGame' sets gameAvailable to "true" once has performed all its operations
 *      - Player can reset via 'reset$' to make 'gameAvailable$' false
 *      - 'newGame$' will subscribe/unsubscribe in order to play/stop all the flow once the 'gameAvailable$'
 */
let newGame$: any;
const gameAvailable$ = new BehaviorSubject<boolean>(false);
const game$ = of("Start").pipe(
  map(() => interval(1000 / FPS, animationFrameScheduler)),
  switchMap(createGame),
  withLatestFrom(gameAvailable$, (scene, gameAvailable) => ({ scene, gameAvailable })),
  takeWhile(({ gameAvailable }) => gameAvailable),
  repeat()
);

const startGame = () => {
  newGame$ = game$.subscribe({
    next: ({ scene: { matrix, survivors, canCross, generation, elapsed } }) =>
      render(canvas, canvasElement, { matrix, survivors, canCross, generation, elapsed }),
  });
};

reset$.pipe().subscribe({
  next: () => {
    gameAvailable$.next(false);
    newGame$.unsubscribe();
    startGame();
  },
});

startGame();
