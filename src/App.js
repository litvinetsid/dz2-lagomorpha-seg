import React, { useState, useRef } from "react";
import cv from "@techstark/opencv-js";
import { Tensor, InferenceSession } from "onnxruntime-web";
import Loader from "./components/loader";
import BreedCards from "./components/breedCards";
import { detectImage } from "./utils/detect";
import { cropDetection, findSimilarBreeds } from "./utils/clip";
import breeds from "./utils/breeds.json";
import labels from "./utils/labels.json";
import "./style/App.css";

// Логика компонента и постобработка — из шаблона курса (react.md),
// адаптированы заголовок страницы, имя модели, а также добавлено
// дополнительное задание: карточки разновидностей + поиск похожих CLIP.
const App = () => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState({ text: "Загрузка OpenCV.js", progress: null });
  const [image, setImage] = useState(null);
  const [detections, setDetections] = useState([]);
  const [breedResult, setBreedResult] = useState(null);
  const [clipStatus, setClipStatus] = useState(null);
  const inputImage = useRef(null);
  const imageRef = useRef(null);
  const canvasRef = useRef(null);

  // ---- настройки ----
  const modelName = "model.onnx";              // ваш экспорт из ДЗ2_обучение_YOLO.ipynb
  const modelInputShape = [1, 3, 640, 640];     // должно совпадать с imgsz при экспорте
  const topk = 100;
  const iouThreshold = 0.45;
  const scoreThreshold = 0.25;

  // ждём инициализации opencv.js, затем поднимаем три ONNX-сессии
  cv["onRuntimeInitialized"] = async () => {
    setLoading({ text: "Загрузка модели...", progress: null });
    const yolov8 = await InferenceSession.create("./model.onnx");

    setLoading({ text: "Инициализация NMS...", progress: null });
    const nms = await InferenceSession.create("./nms-yolov8.onnx");

    setLoading({ text: "Инициализация маски...", progress: null });
    const mask = await InferenceSession.create("./mask-yolov8-seg.onnx");

    setLoading({ text: "Прогрев модели...", progress: null });
    const tensor = new Tensor(
      "float32",
      new Float32Array(modelInputShape.reduce((a, b) => a * b)),
      modelInputShape
    );
    await yolov8.run({ images: tensor });

    setSession({ net: yolov8, nms: nms, mask: mask });
    setLoading(null);
  };

  // Дополнительное задание: находим лучшую (самую уверенную) рамку,
  // вырезаем её из исходного изображения и сравниваем с карточками
  // соответствующего класса моделью CLIP.
  const handleBreedSearch = async () => {
    if (detections.length === 0) return;
    const best = detections.reduce((a, b) => (b.probability > a.probability ? b : a));
    const classId = labels.indexOf(best.label);
    const cards = breeds.filter((b) => b.classId === classId);

    setClipStatus("Загрузка CLIP: 0%");
    try {
      const crop = cropDetection(imageRef.current, best.bounding, modelInputShape[2]);
      const ranked = await findSimilarBreeds(crop, cards, setClipStatus);
      setBreedResult({ classId, ranked });
      setClipStatus(null);
    } catch (e) {
      setClipStatus("Не удалось загрузить CLIP — проверьте соединение");
    }
  };

  return (
    <div className="App">
      {loading && (
        <Loader>
          {loading.progress ? `${loading.text} - ${loading.progress}%` : loading.text}
        </Loader>
      )}

      <div className="header">
        <h1>Определитель зайцеобразных — сегментация</h1>
        <p>
          Заяц, кролик и пищуха. Сегментация моделью YOLOv8-seg прямо в браузере,
          через <code>onnxruntime-web</code> — сервер не нужен.
        </p>
        <p>
          Модель: <code className="code">{modelName}</code>
        </p>
      </div>

      <div className="content">
        <img
          ref={imageRef}
          src="#"
          alt=""
          style={{ display: image ? "block" : "none" }}
          onLoad={async () => {
            const boxes = await detectImage(
              imageRef.current,
              canvasRef.current,
              session,
              topk,
              iouThreshold,
              scoreThreshold,
              modelInputShape
            );
            setDetections(boxes || []);
            setBreedResult(null);
          }}
        />
        <canvas
          id="canvas"
          width={modelInputShape[2]}
          height={modelInputShape[3]}
          ref={canvasRef}
        />
      </div>

      <input
        type="file"
        ref={inputImage}
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => {
          if (image) {
            URL.revokeObjectURL(image);
            setImage(null);
          }
          const url = URL.createObjectURL(e.target.files[0]);
          imageRef.current.src = url;
          setImage(url);
          setDetections([]);
          setBreedResult(null);
        }}
      />

      <div className="btn-container">
        <button onClick={() => inputImage.current.click()}>
          Выбрать изображение
        </button>
        {image && (
          <button
            onClick={() => {
              inputImage.current.value = "";
              imageRef.current.src = "#";
              URL.revokeObjectURL(image);
              setImage(null);
              setDetections([]);
              setBreedResult(null);
            }}
          >
            Закрыть
          </button>
        )}
        {detections.length > 0 && (
          <button onClick={handleBreedSearch}>Определить разновидность</button>
        )}
      </div>

      {clipStatus && <p className="clip-status">{clipStatus}</p>}

      <BreedCards result={breedResult} />
    </div>
  );
};

export default App;
