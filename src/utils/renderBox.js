/**
 * Рисует рамки предсказаний на canvas.
 * Код взят из шаблона курса (react.md) без изменений — это чистая отрисовка,
 * специфики наших трёх классов здесь нет.
 * @param {CanvasRenderingContext2D} ctx контекст canvas
 * @param {Array[Object]} boxes массив рамок { label, probability, color, bounding }
 */
export const renderBoxes = (ctx, boxes) => {
  const font = `${Math.max(
    Math.round(Math.max(ctx.canvas.width, ctx.canvas.height) / 40),
    14
  )}px Arial`;
  ctx.font = font;
  ctx.textBaseline = "top";

  boxes.forEach((box) => {
    const klass = box.label;
    const color = box.color;
    const score = (box.probability * 100).toFixed(1);
    const [x1, y1, width, height] = box.bounding;

    // рамка объекта
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(Math.min(ctx.canvas.width, ctx.canvas.height) / 200, 2.5);
    ctx.strokeRect(x1, y1, width, height);

    // подложка под подпись
    ctx.fillStyle = color;
    const textWidth = ctx.measureText(klass + " - " + score + "%").width;
    const textHeight = parseInt(font, 10);
    const yText = y1 - (textHeight + ctx.lineWidth);
    ctx.fillRect(
      x1 - 1,
      yText < 0 ? 0 : yText,
      textWidth + ctx.lineWidth,
      textHeight + ctx.lineWidth
    );

    // подпись
    ctx.fillStyle = "#ffffff";
    ctx.fillText(klass + " - " + score + "%", x1 - 1, yText < 0 ? 1 : yText + 1);
  });
};

export class Colors {
  // палитра ultralytics — по одному цвету на класс, всего 20 значений
  constructor() {
    this.palette = [
      "#FF3838", "#FF9D97", "#FF701F", "#FFB21D", "#CFD231",
      "#48F90A", "#92CC17", "#3DDB86", "#1A9334", "#00D4BB",
      "#2C99A8", "#00C2FF", "#344593", "#6473FF", "#0018EC",
      "#8438FF", "#520085", "#CB38FF", "#FF95C8", "#FF37C7",
    ];
    this.n = this.palette.length;
  }

  get = (i) => this.palette[Math.floor(i) % this.n];

  static hexToRgba = (hex, alpha) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16), alpha]
      : null;
  };
}
