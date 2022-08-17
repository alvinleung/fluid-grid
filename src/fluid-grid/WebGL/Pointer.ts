export class Pointer {
  id: number;
  texcoordX: number;
  prevTexcoordX: number;
  deltaX: number;
  down: boolean;
  moved: boolean;
  color: number[];
  deltaY: number;
  prevTexcoordY: number;
  texcoordY: number;

  Pointer() {
    this.id = -1;
    this.texcoordX = 0;
    this.texcoordY = 0;
    this.prevTexcoordX = 0;
    this.prevTexcoordY = 0;
    this.deltaX = 0;
    this.deltaY = 0;
    this.down = false;
    this.moved = false;
  }

  update(canvas: HTMLCanvasElement, posX: number, posY: number) {
    this.prevTexcoordX = this.texcoordX;
    this.prevTexcoordY = this.texcoordY;
    this.texcoordX = posX / canvas.width;
    this.texcoordY = 1.0 - posY / canvas.height;
    this.deltaX = correctDeltaX(canvas, this.texcoordX - this.prevTexcoordX);
    this.deltaY = correctDeltaY(canvas, this.texcoordY - this.prevTexcoordY);

    this.moved = Math.abs(this.deltaX) > 0 || Math.abs(this.deltaY) > 0;

  }
}

function correctDeltaX(canvas: HTMLCanvasElement, delta: number) {
  let aspectRatio = canvas.width / canvas.height;
  if (aspectRatio < 1) delta *= aspectRatio;
  return delta;
}

function correctDeltaY(canvas: HTMLCanvasElement, delta: number) {
  let aspectRatio = canvas.width / canvas.height;
  if (aspectRatio > 1) delta /= aspectRatio;
  return delta;
}