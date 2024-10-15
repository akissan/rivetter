export class Point {
  constructor(x, y) {
    this.x = Math.round(x);
    this.y = Math.round(y);
  }

  static fromMouse(cnv) {
    return new Point(cnv.mouseX, cnv.mouseY);
  }

  addVec(vec) {
    return new Point(this.x + vec.x, this.y + vec.y);
  }

  subVec(vec) {
    return new Point(this.x + vec.x, this.y + vec.y);
  }
}

export class Vector extends Point {}
