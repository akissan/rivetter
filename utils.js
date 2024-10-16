export const isMouseInBox = (cnv, box_side) => {
  return Boolean(
    cnv.mouseX > 0 &&
      cnv.mouseY > 0 &&
      cnv.mouseX < box_side &&
      cnv.mouseY < box_side
  );
};

const UIDS = new Set();
const UID_LENGTH = 12;

const generateID = () =>
  "id" + (Math.random() + 1).toString(36).slice(2, 2 + UID_LENGTH);

export const getUID = () => {
  let uid = generateID();
  while (UIDS.has(uid)) {
    uid = generateID();
  }
  UIDS.add(uid);
  return uid;
};
