/**
 * Дополнительное задание ДЗ-2: "используя модель CLIP для поиска похожих карточек".
 * CLIP грузится динамическим import() и лениво (только по нажатию кнопки),
 * чтобы не раздувать основной бандл и не грузить лишнюю модель тем,
 * кто просто хочет посмотреть сегментацию.
 */
const MODEL_ID = "Xenova/clip-vit-base-patch32";
let classifierPromise = null;

export const loadClip = async (onProgress) => {
  if (classifierPromise) return classifierPromise;
  classifierPromise = (async () => {
    const { pipeline, env } = await import("@huggingface/transformers");
    env.allowLocalModels = false;
    return pipeline("zero-shot-image-classification", MODEL_ID, {
      dtype: "q8",
      progress_callback: (p) => {
        if (onProgress && p.status === "progress" && typeof p.progress === "number") {
          onProgress(`Загрузка CLIP: ${Math.round(p.progress)}%`);
        }
      },
    });
  })();
  return classifierPromise;
};

/**
 * Сравнивает вырезанный фрагмент изображения с текстовыми описаниями карточек
 * одного класса и возвращает карточки, отсортированные по убыванию похожести.
 * @param {String} imageUrl data-URL вырезанного фрагмента
 * @param {Array[Object]} cards карточки одного класса (с полем en)
 * @param {Function} onProgress коллбек статуса загрузки модели
 */
export const findSimilarBreeds = async (imageUrl, cards, onProgress) => {
  const classifier = await loadClip(onProgress);
  const prompts = cards.map((c) => c.en);
  const output = await classifier(imageUrl, prompts);
  const byPrompt = new Map(output.map((o) => [o.label, o.score]));
  return cards
    .map((c) => ({ ...c, score: byPrompt.get(c.en) ?? 0 }))
    .sort((a, b) => b.score - a.score);
};

/**
 * Вырезает область обнаруженного объекта из исходного изображения с небольшим
 * отступом (6%), учитывая letterbox-препроцессинг YOLO (модель квадратная,
 * коэффициент масштабирования = max(W,H) / modelSize).
 */
export const cropDetection = (image, bounding, modelSize) => {
  const [bx, by, bw, bh] = bounding;
  const scale = Math.max(image.naturalWidth, image.naturalHeight) / modelSize;

  const pad = 0.06;
  const x = Math.max(0, (bx - bw * pad) * scale);
  const y = Math.max(0, (by - bh * pad) * scale);
  const w = Math.min(image.naturalWidth - x, bw * (1 + 2 * pad) * scale);
  const h = Math.min(image.naturalHeight - y, bh * (1 + 2 * pad) * scale);

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(w));
  canvas.height = Math.max(1, Math.round(h));
  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, x, y, w, h, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.9);
};
