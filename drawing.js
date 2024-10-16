export const createPutVertex = (cnv, viewportData) => {
  const putVertex = (p) => {
    const projected = cnv.CC.mapToViewport(p, viewportData);
    cnv.vertex(projected.x, projected.y);
  };
  return putVertex;
};

export const createPutCircle = (cnv, viewportData, rad = 12) => {
  let last_selected = false;

  const putCircle = (p) => {
    const projected = cnv.CC.mapToViewport(p, viewportData);

    if (p.selected != last_selected) {
      if (p.selected === undefined) {
        cnv.fill("black");
      } else if (p.selected) {
        cnv.fill("lightgreen");
      } else {
        cnv.fill("red");
      }
      last_selected = p.selected;
    }

    cnv.circle(projected.x, projected.y, rad);
    // cnv.circle(projected.x, projected.y, 16 * rad);
  };
  return putCircle;
};
