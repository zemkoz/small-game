
const TILE_SIZE = 30;
const FPS = 30;
const SLEEP = 1000 / FPS;

enum RawTile {
  AIR,
  FLUX,
  UNBREAKABLE,
  PLAYER,
  STONE, FALLING_STONE,
  BOX, FALLING_BOX,
  KEY1, LOCK1,
  KEY2, LOCK2
}

interface Input {
  isRight(): boolean;
  isLeft(): boolean;
  isUp(): boolean;
  isDown(): boolean;
  handle(): void;
}

class Right implements Input {
  isRight(): boolean {
    return true;
  }

  isLeft(): boolean {
    return false;
  }

  isUp(): boolean {
    return false;
  }

  isDown(): boolean {
    return false;
  }

  handle(): void {
    map[playery][playerx + 1].moveHorizontal(1);
  }
}

class Left implements Input {
  isRight(): boolean {
    return false;
  }

  isLeft(): boolean {
    return true;
  }

  isUp(): boolean {
    return false;
  }

  isDown(): boolean {
    return false;
  }

  handle(): void {
    map[playery][playerx -1].moveHorizontal(-1);
  }
}

class Up implements Input {
  isRight(): boolean {
    return false;
  }

  isLeft(): boolean {
    return false;
  }

  isUp(): boolean {
    return true;
  }

  isDown(): boolean {
    return false;
  }

  handle(): void {
    map[playery - 1][playerx].moveVertical(-1);
  }
}

class Down implements Input {
  isRight(): boolean {
    return false;
  }

  isLeft(): boolean {
    return false;
  }

  isUp(): boolean {
    return false;
  }

  isDown(): boolean {
    return true;
  }

  handle(): void {
    map[playery + 1][playerx].moveVertical(1);
  }
}

interface Tile {
  isLock1(): boolean;
  isLock2(): boolean;
  isAir(): boolean;

  draw(g: CanvasRenderingContext2D, x: number, y: number): void;
  moveHorizontal(dx: number): void;
  moveVertical(dy: number): void;
  update(x: number, y: number): void;
}

class Flux implements Tile {
  isLock1(): boolean {
    return false;
  }

  isLock2(): boolean {
    return false;
  }

  isAir(): boolean {
    return false;
  }

  draw(g: CanvasRenderingContext2D, x: number, y: number): void {
    g.fillStyle = "#ccffcc";
    g.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
  }

  moveHorizontal(dx: number): void {
    moveToTile(playerx + dx, playery);
  }

  moveVertical(dy: number): void {
    moveToTile(playerx, playery + dy);
  }

  update(x: number, y: number): void {
    // Empty
  }
}

class Unbreakable implements Tile {
  isLock1(): boolean {
    return false;
  }

  isLock2(): boolean {
    return false;
  }

  isAir(): boolean {
    return false;
  }

  draw(g: CanvasRenderingContext2D, x: number, y: number): void {
    g.fillStyle = "#999999";
    g.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
  }

  moveHorizontal(dx: number): void {
    // Empty
  }

  moveVertical(dy: number): void {
    // Empty
  }

  update(x: number, y: number): void {
    // Empty
  }
}

class Stone implements Tile {
  private fallStrategy: FallStrategy;

  constructor(falling: FallingState) {
    this.fallStrategy = new FallStrategy(falling);
  }

  isLock1(): boolean {
    return false;
  }

  isLock2(): boolean {
    return false;
  }

  isAir(): boolean {
    return false;
  }

  draw(g: CanvasRenderingContext2D, x: number, y: number): void {
    g.fillStyle = "#0000cc";
    g.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
  }

  moveHorizontal(dx: number): void {
    this.fallStrategy.getFalling().moveHorizontal(this, dx);
  }

  moveVertical(dy: number): void {
    // Empty
  }

  update(x: number, y: number): void {
    this.fallStrategy.update(this, x, y);
  }
}

class Box implements Tile {
  constructor(private falling: Falling) {
  }

  isLock1(): boolean {
    return false;
  }

  isLock2(): boolean {
    return false;
  }

  isAir(): boolean {
    return false;
  }

  draw(g: CanvasRenderingContext2D, x: number, y: number): void {
    g.fillStyle = "#8b4513";
    g.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
  }

  moveHorizontal(dx: number): void {
    this.falling.moveHorizontal(this, dx);
  }

  moveVertical(dy: number): void {
    // Empty
  }

  update(x: number, y: number): void {
    if (map[y + 1][x].isAir()) {
      this.falling = new Falling();
      map[y + 1][x] = map[y][x];
      map[y][x] = new Air();
    } else if (this.falling.isFalling()) {
      this.falling = new Resting();
    }
  }
}

class Key implements Tile {
  constructor(private readonly keyConfig: KeyConfiguration) {
  }

  isLock1(): boolean {
    return false;
  }

  isLock2(): boolean {
    return false;
  }

  isAir(): boolean {
    return false;
  }

  draw(g: CanvasRenderingContext2D, x: number, y: number): void {
    g.fillStyle = this.keyConfig.getColor();
    g.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
  }

  moveHorizontal(dx: number): void {
    remove(this.keyConfig.getRemoveStrategy());
    moveToTile(playerx + dx, playery);
  }

  moveVertical(dy: number): void {
    remove(new RemoveLock1());
    moveToTile(playerx, playery + dy);
  }

  update(x: number, y: number): void {
    // Empty
  }
}

class DoorLock implements Tile {
  constructor(private readonly keyConfig: KeyConfiguration) {
  }

  isLock1(): boolean {
    return this.keyConfig.isLock1();
  }

  isLock2(): boolean {
    return !this.keyConfig.isLock1();
  }

  isAir(): boolean {
    return false;
  }
  draw(g: CanvasRenderingContext2D, x: number, y: number): void {
    g.fillStyle = this.keyConfig.getColor();
    g.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
  }

  moveHorizontal(dx: number): void {
    // Empty
  }

  moveVertical(dy: number): void {
    // Empty
  }

  update(x: number, y: number): void {
    // Empty
  }
}

class KeyConfiguration {
  constructor(private readonly color: string,
              private readonly lock1: boolean,
              private readonly removeStrategy: RemoveStrategy) {
  }

  getColor(): string {
    return this.color;
  }

  isLock1(): boolean {
    return this.lock1;
  }

  getRemoveStrategy(): RemoveStrategy {
    return this.removeStrategy;
  }
}

class Air implements Tile {
  isLock1(): boolean {
    return false;
  }

  isLock2(): boolean {
    return false;
  }

  isAir(): boolean {
    return true;
  }

  draw(g: CanvasRenderingContext2D, x: number, y: number): void {
    // Empty
  }

  moveHorizontal(dx: number): void {
    moveToTile(playerx + dx, playery);
  }

  moveVertical(dy: number): void {
    moveToTile(playerx, playery + dy);
  }

  update(x: number, y: number): void {
    // Empty
  }
}

class Player implements Tile {
  isLock1(): boolean {
    return false;
  }

  isLock2(): boolean {
    return false;
  }

  isAir(): boolean {
    return false;
  }

  draw(g: CanvasRenderingContext2D, x: number, y: number): void {
    // Empty
  }

  moveHorizontal(dx: number): void {
    // Empty
  }

  moveVertical(dy: number): void {
    // Empty
  }

  update(x: number, y: number): void {
    // Empty
  }
}

interface FallingState {
  isFalling(): boolean;
  moveHorizontal(tile: Tile, dx: number): void;
}

class Falling implements FallingState {
  isFalling(): boolean {
    return true;
  }

  moveHorizontal(tile: Tile, dx: number): void {
      // Empty
  }
}

class Resting implements FallingState {
  isFalling(): boolean {
    return false;
  }

  moveHorizontal(tile: Tile, dx: number): void {
    if (map[playery][playerx + dx + dx].isAir()
        && !map[playery + 1][playerx + dx].isAir()) {
      map[playery][playerx + dx + dx] = tile;
      moveToTile(playerx + dx, playery);
    }
  }
}

class FallStrategy {
  constructor(private falling: FallingState) {
  }

  getFalling(): FallingState {
    return this.falling;
  }

  update(tile: Tile, x: number, y: number): void {
    this.falling = map[y + 1][x].isAir()
        ? new Falling()
        : new Resting();

    this.drop(tile, x, y);
  }

  private drop(tile: Tile, x: number, y: number) {
    if (this.falling.isFalling()) {
      map[y + 1][x] = tile;
      map[y][x] = new Air();
    }
  }
}

let playerx = 1;
let playery = 1;
let rawMap: RawTile[][] = [
  [2, 2, 2, 2, 2, 2, 2, 2],
  [2, 3, 0, 1, 1, 2, 0, 2],
  [2, 4, 2, 6, 1, 2, 0, 2],
  [2, 8, 4, 1, 1, 2, 0, 2],
  [2, 4, 1, 1, 1, 9, 0, 2],
  [2, 2, 2, 2, 2, 2, 2, 2],
];
let map: Tile[][];

let inputs: Input[] = [];

interface RemoveStrategy {
  check(tile: Tile): boolean;
}

class RemoveLock1 implements RemoveStrategy {
  check(tile: Tile): boolean {
    return tile.isLock1();
  }
}

class RemoveLock2 implements RemoveStrategy {
  check(tile: Tile): boolean {
    return tile.isLock2();
  }
}

function remove(shouldRemove: RemoveStrategy) {
    for (let y = 0; y < map.length; y++) {
    for (let x = 0; x < map[y].length; x++) {
      if (shouldRemove.check(map[y][x])) {
        map[y][x] = new Air();
      }
    }
  }
}

function moveToTile(newx: number, newy: number) {
  map[playery][playerx] = new Air();
  map[newy][newx] = new Player();
  playerx = newx;
  playery = newy;
}

function update() {
  handleInputs();
  updateMap();
}

function handleInputs() {
  while (inputs.length > 0) {
    let current = inputs.pop();
    current.handle();
  }
}

function updateMap() {
  for (let y = map.length - 1; y >= 0; y--) {
    for (let x = 0; x < map[y].length; x++) {
      map[y][x].update(x, y);
    }
  }
}

function draw() {
  let g = createGraphics();
  drawMap(g);
  drawPlayer(g);
}

function createGraphics() {
  let canvas = document.getElementById("GameCanvas") as HTMLCanvasElement;
  let g = canvas.getContext("2d");
  g.clearRect(0, 0, canvas.width, canvas.height);
  return g;
}

function drawMap(g: CanvasRenderingContext2D) {
  for (let y = 0; y < map.length; y++) {
    for (let x = 0; x < map[y].length; x++) {
      map[y][x].draw(g, x, y);
    }
  }
}

function drawPlayer(g: CanvasRenderingContext2D) {
  g.fillStyle = "#ff0000";
  g.fillRect(playerx * TILE_SIZE, playery * TILE_SIZE, TILE_SIZE, TILE_SIZE);
}

function gameLoop() {
  let before = Date.now();
  update();
  draw();
  let after = Date.now();
  let frameTime = after - before;
  let sleep = SLEEP - frameTime;
  setTimeout(() => gameLoop(), sleep);
}

const YELLOW_KEY_CONF = new KeyConfiguration("#ffcc00", true, new RemoveLock1());
const BLUE_KEY_CONF = new KeyConfiguration("#00ccff", false, new RemoveLock2());

function transformTile(tile: RawTile) {
  switch (tile) {
    case RawTile.AIR: return new Air();
    case RawTile.PLAYER: return new Player();
    case RawTile.UNBREAKABLE: return new Unbreakable();
    case RawTile.STONE: return new Stone(new Resting());
    case RawTile.FALLING_STONE: return new Stone(new Falling());
    case RawTile.BOX: return new Box(new Resting());
    case RawTile.FALLING_BOX: return new Box(new Falling());
    case RawTile.FLUX: return new Flux();
    case RawTile.KEY1: return new Key(YELLOW_KEY_CONF);
    case RawTile.LOCK1: return new DoorLock(YELLOW_KEY_CONF);
    case RawTile.KEY2: return new Key(BLUE_KEY_CONF);
    case RawTile.LOCK2: return new DoorLock(BLUE_KEY_CONF);
    default: assertExhausted(tile);
  }
}

function assertExhausted(x: never): never {
  throw new Error("Unexpected object: " + x);
}

function transformMap() {
  map = new Array(rawMap.length);
  for (let y = 0; y < rawMap.length; y++) {
    map[y] = new Array(rawMap[y].length);
    for (let x = 0; x < rawMap[y].length; x++) {
      map[y][x] = transformTile(rawMap[y][x]);
    }
  }
}

window.onload = () => {
  transformMap();
  gameLoop();
}

const LEFT_KEY = "ArrowLeft";
const UP_KEY = "ArrowUp";
const RIGHT_KEY = "ArrowRight";
const DOWN_KEY = "ArrowDown";
window.addEventListener("keydown", e => {
  if (e.key === LEFT_KEY || e.key === "a") inputs.push(new Left());
  else if (e.key === UP_KEY || e.key === "w") inputs.push(new Up());
  else if (e.key === RIGHT_KEY || e.key === "d") inputs.push(new Right());
  else if (e.key === DOWN_KEY || e.key === "s") inputs.push(new Down());
});

