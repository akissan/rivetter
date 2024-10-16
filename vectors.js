import { getUID } from "./utils.js";

const lerp = function (start, end, t) {
  return start * (1 - t) + end * t;
};

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

  distTo2(p) {
    const a = this.x - p.x;
    const b = this.y - p.y;
    return a * a + b * b;
  }

  distTo(p) {
    return Math.sqrt(this.distTo2(p));
  }

  lerpTo(p, val) {
    return new Point(lerp(this.x, p.x, val), lerp(this.y, p.y, val));
  }
}

export class Vector extends Point {}

export class RivetControlPoint extends Point {
  constructor(point, parent) {
    super(point.x, point.y);
    this.id = "rcp_" + getUID();
    this.selected = false;
    this.parent = parent;
  }

  moveToMouse(cnv) {
    this.moveTo(cnv.CC.mapToTexture(Point.fromMouse(cnv)));
  }

  getScreenPosition(cnv) {
    return cnv.CC.mapToViewport(this);
  }

  moveTo(pos) {
    this.x = pos.x;
    this.y = pos.y;
    this.parent.needsUpdate = true;
  }
}
