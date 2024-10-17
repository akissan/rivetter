import { Point } from "./vectors.js";
import { createPutCircle, createPutVertex } from "./drawing.js";
import { getUID } from "./utils.js";

export class RivetBox {
  constructor(cnv) {
    this.segments = [];
    this.xdiv = 20;
    this.ydiv = 4;

    this.style = "DEFAULT";

    this.xsplit = 5;
    this.ysplit = 16;

    this.isActive = false;
    this.id = "rb_" + getUID();
    this._boundBox = null;
    this.cnv = cnv;
    this.element = this.initRBElement();
    // this.segMap = new Map();
    this.needsUpdate = false;
    this._selected = new Set();
    this._cachedRPs = null;
  }

  select(element) {
    this._selected.add(element);
    this.element.addClass("selected");
  }

  deselect(element) {
    this._selected.delete(element);
    if (!this.selected) {
      this.element.removeClass("selected");
    }
  }

  get selected() {
    return this._selected.size > 0;
  }

  initSegElement(seg) {
    const segElem = this.cnv.createDiv();
    segElem.addClass("segment");
    const seglabel = this.cnv.createP(seg.id);
    seglabel.addClass("seg_label");
    const segPointContainer = this.cnv.createDiv();
    segPointContainer.addClass("point_list");

    seg.points.forEach((p) => {
      const pointElem = this.cnv.createDiv();
      pointElem.addClass("point");
      const pointLabel = this.cnv.createP(p.id);
      pointLabel.addClass("point_label");
      p.element = pointElem;

      pointLabel.parent(pointElem);
      pointElem.parent(segPointContainer);
    });

    seglabel.parent(segElem);
    segPointContainer.parent(segElem);
    segElem.parent(this.segList);
    seg.element = segElem;
  }

  initRBElement() {
    const rbElem = this.cnv.createDiv();
    rbElem.addClass("rivetbox");
    const segList = this.cnv.createDiv();
    segList.addClass("segment_list");
    this.segList = segList;

    const rbControl = this.cnv.createDiv();
    rbControl.addClass("rb_control");

    const rbLabel = this.cnv.createP(this.id);
    rbLabel.addClass("rb_label");

    const changeXdiv = (event) => {
      this.xdiv = event.target.valueAsNumber;
    };
    const rbXdiv = this.cnv.createInput(this.xdiv, "number");
    rbXdiv.input(changeXdiv);

    const changeYdiv = (event) => {
      this.ydiv = event.target.valueAsNumber;
    };
    const rbYdiv = this.cnv.createInput(this.ydiv, "number");
    rbYdiv.input(changeYdiv);

    const changeXsplit = (event) => {
      this.xsplit = event.target.valueAsNumber;
    };
    const rbXsplit = this.cnv.createInput(this.xsplit, "number");
    rbXsplit.input(changeXsplit);

    const changeYsplit = (event) => {
      this.ysplit = event.target.valueAsNumber;
    };
    const rbYsplit = this.cnv.createInput(this.ysplit, "number");
    rbYsplit.input(changeYsplit);

    rbLabel.parent(rbElem);
    rbControl.parent(rbElem);
    rbYdiv.parent(rbControl);
    rbXdiv.parent(rbControl);
    rbYsplit.parent(rbControl);
    rbXsplit.parent(rbControl);
    segList.parent(rbElem);
    rbElem.parent("rb_list");

    rbElem.elt.addEventListener("click", () => {
      print(this);
    });

    return rbElem;
  }

  addSegment(startPoint, endPoint) {
    const segment = new Segment(startPoint, endPoint);
    startPoint.segment = segment;
    endPoint.segment = segment;
    this.segments.push(segment);
    this.initSegElement(segment);
    this._recalcBoundBox();
  }

  _recalcBoundBox() {
    let [min_x, min_y, max_x, max_y] = [9999, 9999, -1, -1];

    this.segments.forEach(({ start, end }) => {
      min_x = Math.min(min_x, start.x, end.x);
      min_y = Math.min(min_y, start.y, end.y);
      max_x = Math.max(max_x, start.x, end.x);
      max_y = Math.max(max_y, start.y, end.y);
    });

    this._boundBox = [
      new Point(min_x, min_y),
      new Point(max_x, min_y),
      new Point(max_x, max_y),
      new Point(min_x, max_y),
    ];
  }

  isOnscreen(viewportData) {
    if (!this._boundBox) {
      return false;
    }
    return this._boundBox.some(
      ({ x, y }) =>
        x >= viewportData.sx &&
        x <= viewportData.sx + viewportData.sw &&
        y >= viewportData.sy &&
        y <= viewportData.sy + viewportData.sh
    );
  }

  update() {
    // print("updating: ", this.id);
    this._recalcBoundBox();
    this.needsUpdate = false;
  }

  drawBoundBox(cnv) {
    const viewportData = cnv.CC.viewport;
    if (!this.isOnscreen(viewportData)) return;

    const putVertex = createPutVertex(cnv, viewportData);

    // cnv.fill("AA202040");
    cnv.fill("#00AA0030");
    cnv.stroke("AA2020");
    cnv.drawingContext.setLineDash([5]);

    cnv.beginShape();
    this._boundBox.forEach(putVertex);
    cnv.endShape(cnv.CLOSE);
    cnv.drawingContext.setLineDash([]);
  }

  calculateRivets(cnv = this.cnv) {
    const rivetPositions = [];

    const viewportData = cnv.CC.viewport;
    const putCircle = createPutCircle(cnv, viewportData, 4);

    cnv.noStroke();
    cnv.fill("white");

    let last_divs = null;

    this.segments.forEach((s) => {
      const divs = [];
      for (let i = 0; i < 1.01; i += 1 / this.ydiv) {
        const p = s.lerp(i);
        divs.push(p);
        putCircle(p);
        rivetPositions.push(p);
      }
      if (last_divs) {
        last_divs.forEach((d, idx) => {
          for (let i = 0; i < 1.01; i += 1 / this.xdiv) {
            const p = d.lerpTo(divs[idx], i);
            putCircle(p);
            rivetPositions.push(p);
          }
        });
      }
      last_divs = divs;
    });

    const starts = new Polyline(this.segments.map((s) => s.start)).split(
      this.xsplit
    );
    const ends = new Polyline(this.segments.map((s) => s.end)).split(
      this.xsplit
    );

    starts.forEach((start, idx) => {
      for (let i = 0; i < 1.01; i += 1 / this.ysplit) {
        const p = start.lerpTo(ends[idx], i);
        putCircle(p);
        rivetPositions.push(p);
      }
    });
    this._cachedRPs = rivetPositions;
  }

  get rivetPositions() {
    if (!this._cachedRPs) {
      this.calculateRivets();
    }
    return this._cachedRPs;
  }

  drawSegments(cnv) {
    const viewportData = cnv.CC.viewport;
    if (!this.isOnscreen(viewportData)) return;

    const putVertex = createPutVertex(cnv, viewportData);
    const putCircle = createPutCircle(cnv, viewportData);

    // print(`Attempt to draw a ${this.id} RB`);
    cnv.fill("red");

    // print(`This RB is onscreen`);

    const alternativeOrder = { starts: [], ends: [], all: [] };

    cnv.stroke("skyblue");
    cnv.beginShape(cnv.LINES);
    cnv.noFill();

    this.segments.forEach((segment) => {
      alternativeOrder.starts.push(segment.start);
      alternativeOrder.ends.push(segment.end);
      alternativeOrder.all.push(segment.start);
      alternativeOrder.all.push(segment.end);

      putVertex(segment.start);
      putVertex(segment.end);
    });

    cnv.endShape();

    cnv.stroke("yellow");
    cnv.beginShape();
    alternativeOrder.starts.forEach(putVertex);
    cnv.endShape();

    cnv.stroke("orange");
    cnv.beginShape();
    alternativeOrder.ends.forEach(putVertex);
    cnv.endShape();

    cnv.fill("red");
    cnv.strokeWeight("1");
    alternativeOrder.all.forEach(putCircle);

    this.calculateRivets(cnv);
  }
}

export class Segment {
  constructor(startPoint, endPoint) {
    this.start = startPoint;
    this.end = endPoint;
    this.points = [startPoint, endPoint];
    this.id = "seg_" + getUID();
    this.element = null;
    this._selected = false;
    // this.needsUpdate = false;
  }

  set selected(value) {
    if (value) {
      this._selected = true;
      this.element.addClass("selected");
    } else {
      if (!this.start.selected && !this.end.selected) {
        this.element.removeClass("selected");
        this._selected = false;
      }
    }
  }

  get selected() {
    return this._selected;
  }

  get length() {
    return this.start.distTo(this.end);
  }

  get length2() {
    return this.start.distTo2(this.end);
  }

  lerp(val) {
    return this.start.lerpTo(this.end, val);
  }
}

class Line {
  constructor(start, end) {
    this.start = start;
    this.end = end;
  }

  get length() {
    return this.start.distTo(this.end);
  }
}

export class Polyline {
  constructor(points = []) {
    this.points = points;
    this.lines = [];

    if (points.length > 1) {
      points.forEach((p, idx, pts) => {
        if (idx > 0) {
          this.lines.push(new Line(pts[idx - 1], p));
        }
      });
    }
  }

  push(point) {
    if (this.points.length > 0) {
      const last_p = this.points[this.points.length - 1];
      this.lines.push(new Line(last_p, point));
    }
    this.points.push(point);
  }

  get length() {
    return this.lines.reduce(
      (acc, line) => acc + line.length,
      // (len, p, idx, pts) => (idx > 0 ? len + p.distTo(pts[idx - 1]) : 0),
      0
    );
  }

  split(n) {
    const resultPoints = [];
    const polylineLen = this.length;
    const delta = polylineLen / n;

    let traveled = 0;
    let lastLen = 0;

    // print(delta);

    // current_seg = 0;
    let lineIdx = 0;
    let curLine = this.lines[lineIdx];

    // current_seg_len
    while (traveled < polylineLen + 0.05) {
      const t = (traveled - lastLen) / curLine.length;
      const p = curLine.start.lerpTo(curLine.end, t);
      resultPoints.push(p);
      traveled += delta;

      if (traveled > lastLen + curLine.length && traveled < polylineLen) {
        lastLen += curLine.length;
        lineIdx += 1;
        curLine = this.lines[lineIdx];
        print(lineIdx);
      }
    }

    return resultPoints;
  }

  lerp(val) {}
}
