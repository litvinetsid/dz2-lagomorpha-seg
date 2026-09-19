import React from "react";
import breeds from "../utils/breeds.json";
import "../style/breeds.css";

const GROUPS = [
  { classId: 0, title: "Заяц — разновидности" },
  { classId: 1, title: "Кролик — породы" },
  { classId: 2, title: "Пищуха — виды" },
];

/**
 * Дополнительное задание ДЗ-2: список карточек классов (минимум 10 на класс)
 * с названиями разновидностей. Если передан result — карточки того класса,
 * который был найден на фото, переупорядочиваются по похожести (CLIP),
 * а лучшее совпадение выделяется.
 * @param {{ classId: number, ranked: Array } | null} result
 */
const BreedCards = ({ result }) => {
  return (
    <div className="breeds">
      {GROUPS.map((group) => {
        const isRanked = result && result.classId === group.classId;
        const cards = isRanked
          ? result.ranked
          : breeds.filter((b) => b.classId === group.classId);

        return (
          <div className="breed-group" key={group.classId}>
            <h3>{group.title}</h3>
            <div className="breed-grid">
              {cards.map((card, i) => (
                <div
                  className={`breed-card${isRanked && i === 0 ? " top" : ""}`}
                  key={card.lat}
                >
                  <div className="breed-name">{card.ru}</div>
                  <div className="breed-lat">{card.lat}</div>
                  <div className="breed-note">{card.note}</div>
                  {isRanked && (
                    <div className="breed-bar">
                      <span
                        className="breed-bar-fill"
                        style={{ width: `${Math.round(card.score * 100)}%` }}
                      />
                      <span className="breed-bar-value">
                        {Math.round(card.score * 100)}%
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default BreedCards;
