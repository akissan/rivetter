export class RivetBox {
  constructor() {
    this.segments = [];
    this.xdiv = 5;
    this.ydiv = 7;
    this.isActive = false;
    this.id = Math.floor(Math.random() * 10000);
  }

  addSegment(startPoint, endPoint) {
    this.segments.push(new Segment(startPoint, endPoint));
  }

  drawSegments(cnv) {
    cnv.stroke("green");

    const alternativeOrder = { starts: [], ends: [] };

    cnv.beginShape(cnv.LINES);
    for (const segment of this.segments) {
      alternativeOrder.starts.push(segment.start);
      alternativeOrder.ends.push(segment.end);

      cnv.vertex(segment.start.x, segment.start.y);
      cnv.vertex(segment.end.x, segment.end.y);
    }
    cnv.endShape();

    cnv.stroke("yellow");
    cnv.beginShape();
    for (const startp of alternativeOrder.starts) {
      cnv.vertex(startp.x, startp.y);
    }
    cnv.endShape();

    cnv.stroke("orange");
    cnv.beginShape();
    for (const endp of alternativeOrder.ends) {
      cnv.vertex(endp.x, endp.y);
    }
    cnv.endShape();
  }
}

export class Segment {
  constructor(startPoint, endPoint) {
    this.start = startPoint;
    this.end = endPoint;
  }
}
