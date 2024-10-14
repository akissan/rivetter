import { RivetBox } from "./rivets.js";
import { Point, Vector } from "./vectors.js";
import { isMouseInBox } from "./utils.js";

let compass_base;
const canvasSize = window.innerHeight - 20;

const textureSize = 2048;

window.print = console.log;

let activeRB = null;
// const FrozenPoint = [];

class RivetManager {
  constructor(activeLayer, frozenLayer) {
    this.rivetboxes = [];
    this.activeCnv = activeLayer;
    this.frozenCnv = frozenLayer;
    // this.mainCanvas;
  }

  addRB(RB) {
    activeRB = RB;
    this.rivetboxes.push(RB);
  }

  initRivetBox(initPoint) {
    const newRB = new RivetBox();
    const baseRBSize = 20;

    const mouseP = initPoint;
    const mousePE = mouseP.addVec(new Vector(0, baseRBSize));
    const S2S = mouseP.addVec(new Vector(baseRBSize, 0));
    const S2E = S2S.addVec(new Vector(0, baseRBSize));

    newRB.addSegment(mouseP, mousePE);
    newRB.addSegment(S2S, S2E);

    this.addRB(newRB);
    this.printList();
  }

  printList() {
    for (const RB of this.rivetboxes) {
      print(RB);
    }
  }

  drawList() {
    this.activeCnv.clear();

    for (const RB of this.rivetboxes) {
      RB.drawSegments(this.activeCnv);
    }
  }
}

class ViewportControls {
  constructor() {
    this.reset();
  }

  reset() {
    this.offset = { x: 50, y: 50 };
    this.zoom = 100;
  }
}

const CC = new ViewportControls();
let RM = null;

let frozenLayer;
let activeLayer;

const maincnv = function (cnv) {
  cnv.preload = function () {
    compass_base = cnv.loadImage("cbt.png");
  };

  const circles = [];

  cnv.setup = function () {
    const mainCanvas = cnv.createCanvas(canvasSize, canvasSize);
    mainCanvas.parent("canvas_container");
    frozenLayer = cnv.createGraphics(textureSize, textureSize);
    activeLayer = cnv.createGraphics(textureSize, textureSize);
    activeLayer.strokeWeight("2");

    RM = new RivetManager(activeLayer, frozenLayer);

    for (let i = 0; i < 1000; i += 1) {
      circles.push(
        new Point(cnv.random(0, textureSize), cnv.random(0, textureSize))
      );
    }

    cnv.textAlign(cnv.RIGHT, cnv.TOP);
    cnv.textSize(16);

    // RM.printList();
    RM.initRivetBox(new Point(300, 300));
  };

  function redrawFrozen() {
    cnv.stroke("red");
    cnv.fill("44000030");
    frozenLayer.clear();
  }

  function redrawActive() {
    activeLayer.strokeWeight(4);
    RM.drawList();
  }

  cnv.keyPressed = function () {
    switch (cnv.key) {
      case "a":
        // print(cnv.mouseX, cnv.mouseY);!== undefined ? initPoint :
        RM.initRivetBox(Point.fromMouse(cnv));
        break;
    }
    return false;
  };

  cnv.draw = function () {
    const start_timing = cnv.millis();
    redrawActive();

    cnv.background("#182330");

    const sw = textureSize / (CC.zoom * 0.01);
    const sx = CC.offset.x * 0.01 * textureSize - 0.5 * sw;

    const sh = sw;
    const sy = CC.offset.y * 0.01 * textureSize - 0.5 * sh;

    cnv.image(compass_base, 0, 0, canvasSize, canvasSize, sx, sy, sw, sh);
    cnv.image(frozenLayer, 0, 0, canvasSize, canvasSize, sx, sy, sw, sh);
    cnv.image(activeLayer, 0, 0, canvasSize, canvasSize, sx, sy, sw, sh);

    const end_timing = cnv.millis();
    cnv.text(`${end_timing - start_timing}`, canvasSize, 10);
  };
};

new p5(maincnv);

const minimap = function (cnv) {
  const mapSize = 200;
  const mapScaling = 100 / mapSize;
  cnv.setup = function () {
    const minimapCanvas = cnv.createCanvas(mapSize, mapSize);
    minimapCanvas.elt.addEventListener("contextmenu", (e) =>
      e.preventDefault()
    );
    minimapCanvas.addClass("minimap");
    minimapCanvas.parent("minimap_container");
    minimapCanvas.mousePressed(onMapClick);

    cnv.fill("#0000FF40");
    cnv.stroke("#00CCFF");
    cnv.strokeWeight(2);
  };

  cnv.mouseDragged = function () {
    if (isMouseInBox(cnv, mapSize)) {
      onMapClick();
    }
  };

  cnv.draw = function () {
    cnv.image(compass_base, 0, 0, mapSize, mapSize);
    const viewportSize = cnv.round(mapSize / (CC.zoom * 0.01));
    const viewportX = cnv.round(
      CC.offset.x * mapSize * 0.01 - viewportSize * 0.5
    );
    const viewportY = cnv.round(
      CC.offset.y * mapSize * 0.01 - viewportSize * 0.5
    );
    cnv.rect(viewportX, viewportY, viewportSize, viewportSize);
  };

  const onMapClick = function () {
    switch (cnv.mouseButton) {
      case cnv.LEFT:
        const x = cnv.mouseX * mapScaling;
        const y = cnv.mouseY * mapScaling;
        CC.offset = { x, y };
        break;
      case cnv.RIGHT:
        CC.reset();
        break;
    }
    return false;
  };

  cnv.mouseWheel = function (event) {
    if (event.delta > 0) {
      CC.zoom += 25;
    } else {
      if (CC.zoom > 100) {
        CC.zoom -= 25;
      }
    }
  };
};

new p5(minimap);
