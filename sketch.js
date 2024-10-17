import { RivetBox } from "./rivets.js";
import { Point, RivetControlPoint, Vector } from "./vectors.js";
import { isMouseInBox } from "./utils.js";
import { addToDom, change2CompassTexture } from "./preview.js";

let compass_base;
const canvasSize = window.innerHeight - 20;
window.canvasSize = canvasSize;

let offscreen;
let rivetImage;

const rivetStyles = {
  DEFAULT: {
    img: rivetImage,
    size: 4,
  },
};

const textureSize = 2048;

window.print = console.log;

let activeRB = null;
// const FrozenPoint = [];

let mouseMode = null;
const MOUSE_MODE_POINT_DRAG = 10;
const MOUSE_MODE_DEFAULT = 20;
const MOUSE_MODE_MULTIPLE_SELECTION = 30;
mouseMode = MOUSE_MODE_DEFAULT;

class Selection extends Map {
  unselectAll() {
    this.forEach((v) => (v.selected = false));
    this.clear();
  }

  unselect(id) {
    const el = this.get(id);
    el.selected = false;
    this.delete(id);
  }

  select(value) {
    value.selected = true;
    this.set(value.id, value);
  }

  preview() {
    const [val] = this.values();
    return val;
  }
}
const selection = new Selection();

// window.selection = selection;

class RivetManager {
  constructor(activeLayer, frozenLayer, mainCanvas) {
    this.rivetboxes = new Map();
    this.activeCnv = activeLayer;
    this.frozenCnv = frozenLayer;
    this.mainCanvas = mainCanvas;
  }

  addRB(RB) {
    activeRB = RB;
    this.rivetboxes.set(RB.id, RB);
  }

  initRivetBox(initPoint, segments = 2) {
    const newRB = new RivetBox(this.mainCanvas);
    const baseRBSize = 100;
    // segment_list;
    const mouseP = new RivetControlPoint(initPoint, newRB);
    const mousePE = new RivetControlPoint(
      mouseP.addVec(new Vector(0, baseRBSize)),
      newRB
    );
    newRB.addSegment(mouseP, mousePE);
    for (let i = 1; i < segments; i += 1) {
      const S2S = new RivetControlPoint(
        mouseP.addVec(new Vector(baseRBSize * i, 0)),
        newRB
      );
      const S2E = new RivetControlPoint(
        S2S.addVec(new Vector(0, baseRBSize)),
        newRB
      );

      newRB.addSegment(S2S, S2E);
    }
    this.addRB(newRB);
  }

  drawList() {
    this.activeCnv.clear();

    this.rivetboxes.forEach((RB) => {
      if (RB.needsUpdate) RB.update();
      if (window.globals.drawBoundBoxes) {
        RB.drawBoundBox(this.mainCanvas);
      }
      RB.drawSegments(this.mainCanvas);
    });
  }
}

class ViewportControls {
  constructor(textureSize, canvasSize) {
    this.textureSize = textureSize;
    this.canvasSize = canvasSize;
    this.reset();
  }

  reset() {
    this.offset = { x: 50, y: 50 };
    this.zoom = 100;
  }

  get viewport() {
    const sw = this.textureSize / (this.zoom * 0.01);
    const sx = this.offset.x * 0.01 * this.textureSize - 0.5 * sw;
    const sh = sw;
    const sy = this.offset.y * 0.01 * this.textureSize - 0.5 * sh;
    return { sx, sy, sw, sh };
  }

  mapToTexture(canvasPoint, viewportData = this.viewport) {
    const { sx, sy, sw, sh } = viewportData;

    const tx = sx + (canvasPoint.x / canvasSize) * sw;
    const ty = sy + (canvasPoint.y / canvasSize) * sh;

    return new Point(tx, ty);
  }

  mapToViewport(texturePoint, viewportData = this.viewport) {
    const { sx, sy, sw, sh } = viewportData;

    const cx = ((texturePoint.x - sx) / sw) * this.canvasSize;
    const cy = ((texturePoint.y - sy) / sh) * this.canvasSize;

    return new Point(cx, cy);
  }
}

const CC = new ViewportControls(textureSize, canvasSize);
let RM = null;

let frozenLayer;
let activeLayer;

const MIN_SEARCH_DISTANCE = 5;
const MAX_SEARCH_DISTANCE = 100;

class SelectionCandidate {
  constructor(P, dist) {
    this.P = P;
    this.dist = dist;
  }
}

const maincnv = function (cnv) {
  cnv.preload = function () {
    compass_base = cnv.loadImage("cbt.png");
    rivetImage = cnv.loadImage("rivets/default.png");

    rivetStyles["DEFAULT"].img = rivetImage;
  };

  cnv.mousePressed = function () {
    if (!isMouseInBox(cnv, canvasSize)) return;
    const mousePos = CC.mapToTexture(Point.fromMouse(cnv));

    if (mouseMode === MOUSE_MODE_DEFAULT) {
      let selection_candidate = null;

      RM.rivetboxes.forEach((RB) => {
        RB.segments.forEach(({ points }) => {
          points.forEach((p) => {
            const toMouseDist = cnv.dist(p.x, p.y, mousePos.x, mousePos.y);
            if (toMouseDist < MAX_SEARCH_DISTANCE) {
              if (
                !selection_candidate ||
                toMouseDist < selection_candidate.dist
              ) {
                selection_candidate = new SelectionCandidate(p, toMouseDist);
              }
            }
          });
        });
      });

      if (selection_candidate) {
        selection.unselectAll();
        selection.select(selection_candidate.P);

        // print(selection.preview());

        // print(
        //   `Selected ${selection.preview().id} ${selection.preview().x}:${
        //     selection.preview().y
        //   } - ${selection_candidate.dist}`
        // );
        mouseMode = MOUSE_MODE_POINT_DRAG;
      } else {
        selection.unselectAll();
      }
    }
  };

  cnv.mouseDragged = function () {
    if (!isMouseInBox(cnv, canvasSize)) return;

    if (mouseMode === MOUSE_MODE_POINT_DRAG) {
      selection.forEach((p) => {
        p.moveToMouse(cnv);
      });
    }
  };

  cnv.mouseReleased = function () {
    if (mouseMode === MOUSE_MODE_POINT_DRAG) {
      mouseMode = MOUSE_MODE_DEFAULT;
    }
  };

  function updateOffscreen() {
    offscreen.clear();
    // offscreen.background("red");

    if (window.globals.exportWithBase) {
      offscreen.image(compass_base, 0, 0, textureSize, textureSize);
    }

    cnv.imageMode(cnv.CENTER);
    RM.rivetboxes.forEach(({ rivetPositions, style }) => {
      for (const { x, y } of rivetPositions) {
        offscreen.image(
          rivetStyles[style].img,
          x,
          y,
          rivetStyles[style].size,
          rivetStyles[style].size
        );
      }
    });
    cnv.imageMode(cnv.CORNER);

    return offscreen;
  }

  cnv.setup = function () {
    offscreen = cnv.createGraphics(textureSize, textureSize);
    // offscreen.id("offscreen");
    // print(offscreen);
    change2CompassTexture(offscreen);
    // window.offscreen = offscreen;

    window.globals = {
      drawBoundBoxes: false,
      exportWithBase: false,
    };
    const drawBoundBoxesCB = cnv.createCheckbox(
      "Draw bound boxes",
      window.globals.drawBoundBoxes
    );
    const drawBoundBoxesInp = (event) => {
      window.globals.drawBoundBoxes = event.target.checked;
    };
    drawBoundBoxesCB.input(drawBoundBoxesInp);
    drawBoundBoxesCB.parent("global_control");

    const exportWithBaseCB = cnv.createCheckbox(
      "Export with base",
      window.globals.exportWithBase
    );
    const exportWithBaseInp = (event) => {
      window.globals.exportWithBase = event.target.checked;
    };
    exportWithBaseCB.input(exportWithBaseInp);
    exportWithBaseCB.parent("global_control");

    const mainCanvas = cnv.createCanvas(canvasSize, canvasSize);
    mainCanvas.parent("canvas_container");
    addToDom(canvasSize);
    frozenLayer = cnv.createGraphics(textureSize, textureSize);
    activeLayer = cnv.createGraphics(textureSize, textureSize);
    activeLayer.strokeWeight("2");

    RM = new RivetManager(activeLayer, frozenLayer, cnv);
    cnv.CC = CC;

    cnv.textAlign(cnv.RIGHT, cnv.TOP);
    cnv.textSize(16);

    RM.initRivetBox(new Point(300, 300));

    function exportTexture() {
      // const exportLayer = cnv.createGraphics(textureSize, textureSize);
      cnv.save(updateOffscreen());
    }

    document.getElementById("export").addEventListener("click", exportTexture);
    // redrawActive();
  };

  function redrawFrozen() {
    cnv.stroke("red");
    cnv.fill("44000030");
    frozenLayer.clear();
  }

  function redrawActive() {
    RM.drawList();
  }

  function extentRivetBox() {
    if (mouseMode === MOUSE_MODE_DEFAULT) {
      if (selection.preview()) {
        const p = selection.preview();
        // const seg = p.segment;
        const rb = p.parent;

        const last_seg = rb.segments[rb.segments.length - 1];
        const prev_seg = rb.segments[rb.segments.length - 2];

        if (!last_seg || !prev_seg)
          throw new Error("Extending RB went wrong, not enough segments");

        const v1 = last_seg.start.subVec(prev_seg.start);
        const v2 = last_seg.end.subVec(prev_seg.end);

        const p1 = last_seg.start.addVec(v1);
        const p2 = last_seg.end.addVec(v2);

        const rp1 = new RivetControlPoint(p1, rb);
        const rp2 = new RivetControlPoint(p2, rb);

        rb.addSegment(rp1, rp2);
      } else {
        print("Select RivetBox for extension");
      }
    }
  }

  cnv.keyPressed = function () {
    const P = CC.mapToTexture(Point.fromMouse(cnv));
    switch (cnv.key) {
      case "a":
        extentRivetBox(P);
        break;
      case "2":
        RM.initRivetBox(P);
        break;
      case "3":
        RM.initRivetBox(P, 3);
        break;
      case "4":
        RM.initRivetBox(P, 4);
        break;
      case "5":
        RM.initRivetBox(P, 5);
        break;
      case "b":
        redrawActive();
        break;
    }
    return false;
  };

  cnv.draw = function () {
    const start_timing = cnv.millis();

    cnv.background("#182330");

    const { sx, sy, sw, sh } = CC.viewport;

    cnv.image(compass_base, 0, 0, canvasSize, canvasSize, sx, sy, sw, sh);
    cnv.image(frozenLayer, 0, 0, canvasSize, canvasSize, sx, sy, sw, sh);
    cnv.image(activeLayer, 0, 0, canvasSize, canvasSize, sx, sy, sw, sh);

    cnv.strokeWeight(2);
    redrawActive();

    updateOffscreen();

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
    // cnv.strokeWeight(2);
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
    if (!isMouseInBox(cnv, mapSize)) return;

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
