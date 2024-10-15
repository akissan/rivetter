export const createPutVertex = (cnv, viewportData) => {
  const putVertex = (p) => {
    const projected = cnv.CC.mapToViewport(p, viewportData);
    cnv.vertex(projected.x, projected.y);
  };
  return putVertex;
};

export const createPutCircle = (cnv, viewportData) => {
  const putCircle = (p) => {
    const projected = cnv.CC.mapToViewport(p, viewportData);

    cnv.circle(projected.x, projected.y, 8);
    cnv.circle(projected.x, projected.y, 8);
  };
  return putCircle;
};
