import { Point } from "./vectors.js";
import { createPutCircle, createPutVertex } from "./drawing.js";
import { getUID } from "./utils.js";

export class RivetBox {
  constructor(cnv) {
    this.segments = [];
    this.xdiv = 5;
    this.ydiv = 7;
    this.isActive = false;
    this.id = "rb_" + getUID();
    this._boundBox = null;
    this.cnv = cnv;
    this.element = this.initRBElement();
    this.needsUpdate = false;
  }

  initRBElement() {
    const rbelement = this.cnv.createDiv();
    const label = this.cnv.createP(this.id);
    // label.parent
    label.parent(rbelement);
    rbelement.parent("rb_list");

    return rbelement;
  }

  addSegment(startPoint, endPoint) {
    this.segments.push(new Segment(startPoint, endPoint));
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
    // print(
    //   `VD: ${JSON.stringify(viewportData)} -> BB: ${JSON.stringify(
    //     this._boundBox
    //   )}`
    // );
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
    print("updating: ", this.id);
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

  calculateRivets(cnv) {
    const viewportData = cnv.CC.viewport;
    const putCircle = createPutCircle(cnv, viewportData, 4);

    cnv.noStroke();
    cnv.fill("white");

    // starts = new Polyline(this.segments.map((s) => s.start));
    // ends = new Polyline(this.segments.map((s) => s.start));

    let last_divs = null;

    this.segments.forEach((s) => {
      const divs = [];
      for (let i = 0; i < 1.01; i += 1 / this.ydiv) {
        const p = s.lerp(i);
        divs.push(p);
        putCircle(p);
      }
      if (last_divs) {
        last_divs.forEach((d, idx) => {
          for (let i = 0; i < 1.01; i += 1 / this.xdiv) {
            const p = d.lerpTo(divs[idx], i);
            putCircle(p);
          }
        });
      }
      last_divs = divs;
    });

    // let last_seg_pos;
    // const delimeters = [0];
    // const startsLen = this.segments.reduce((acc, seg, idx) => {
    //   if (idx == 0) {
    //     last_seg_pos = seg.start;
    //     return 0;
    //   } else {
    //     const len = Math.floor(seg.start.distTo(last_seg_pos));
    //     const pos = seg.start.getScreenPosition(cnv);
    //     cnv.text(len, pos.x, pos.y);
    //     last_seg_pos = seg.start;
    //     acc += len;
    //     delimeters.push(acc);
    //     return acc;
    //   }
    // }, 0);

    // for (let dl = 0; dl < startsLen - 1; dl += startsLen / this.xdiv) {
    //   const seg = delimeters.findIndex((d) => dl < d) - 1;
    //   const p = this.segments[seg].start.lerpTo(
    //     this.segments[seg + 1].start,
    //     (dl - delimeters[seg]) / delimeters[seg + 1]
    //   );
    //   putCircle(p);
    // }

    // for (let dl = 0; dl < startsLen - 1; dl += startsLen / this.xdiv) {
    //   const seg = delimeters.findIndex((d) => dl < d) - 1;
    //   const p = this.segments[seg].start.lerpTo(
    //     this.segments[seg + 1].start,
    //     (dl - delimeters[seg]) / delimeters[seg + 1]
    //   );
    //   putCircle(p);
    // }
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
    // this.needsUpdate = false;
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

export class Polyline {
  constructor(points = []) {
    this.points = points;
  }

  push(point) {
    this.points.push(point);
  }

  get length() {
    return this.points.reduce(
      (len, p, idx, pts) => (idx > 0 ? len + p.distTo(pts[idx - 1]) : 0),
      0
    );
  }

  lerp(val) {}
}
