export const isMouseInBox = (cnv, box_side) => {
  return Boolean(
    cnv.mouseX > 0 &&
      cnv.mouseY > 0 &&
      cnv.mouseX < box_side &&
      cnv.mouseY < box_side
  );
};
