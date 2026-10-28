// Current-edition presentation only. Image UVs and historical scene data are untouched.
export function frameLayout(width, height) {
  const valid = Number.isFinite(width) && width > 0 && Number.isFinite(height) && height > 0;
  const ratio = valid ? width / height : 1;
  const border = .04, scale = Math.min(1.02 / ratio, .94);
  const artHeight = scale, artWidth = ratio * scale;
  const outerWidth = artWidth + 2 * border, outerHeight = artHeight + 2 * border;
  const cordLength = 2.55 - (1.4 + outerHeight / 2);
  return { artWidth, artHeight, outerWidth, outerHeight, border, cordLength, cordX: outerWidth * .34 };
}
// Pixel rectangle excludes controls, sheet/side panel and safe-area padding.
export function frameFit(width, height, rect, viewport, fov) {
  const tan = Math.tan(fov * Math.PI / 360);
  const fractionX = Math.max(.01, (rect.right - rect.left) / viewport.width);
  const fractionY = Math.max(.01, (rect.bottom - rect.top) / viewport.height);
  const distance = Math.max(1.3, width / (2 * tan * viewport.width / viewport.height * fractionX), height / (2 * tan * fractionY)) * 1.08 + .08;
  const ndcX = (rect.left + rect.right) / viewport.width - 1;
  const ndcY = 1 - (rect.top + rect.bottom) / viewport.height;
  return { distance, shiftX: -ndcX * distance * tan * viewport.width / viewport.height, shiftY: -ndcY * distance * tan };
}
