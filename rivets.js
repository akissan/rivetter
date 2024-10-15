import { Point } from "./vectors.js";
import { createPutCircle, createPutVertex } from "./drawing.js";

export class RivetBox {
  constructor() {
    this.segments = [];
    this.xdiv = 5;
    this.ydiv = 7;
    this.isActive = false;
    this.id = Math.floor(Math.random() * 10000);
    this._boundBox = null;
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
    print(
      `VD: ${JSON.stringify(viewportData)} -> BB: ${JSON.stringify(
        this._boundBox
      )}`
    );
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

  drawBoundBox(cnv) {
    const viewportData = cnv.CC.viewport;
    if (!this.isOnscreen(viewportData)) return;

    const putVertex = createPutVertex(cnv, viewportData);

    cnv.fill("AA202040");
    cnv.stroke("AA2020");
    cnv.drawingContext.setLineDash([5]);

    cnv.beginShape();
    this._boundBox.forEach(putVertex);
    cnv.endShape();
    cnv.drawingContext.setLineDash([]);
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

    alternativeOrder.all.forEach(putCircle);
  }
}

export class Segment {
  constructor(startPoint, endPoint) {
    this.start = startPoint;
    this.end = endPoint;
  }
}
