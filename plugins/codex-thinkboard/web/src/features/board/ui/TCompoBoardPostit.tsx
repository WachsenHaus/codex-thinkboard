import type { BoardCard } from '../type/typesBoard';
import { BOARD_TEXT, type UiLanguage } from '../service/serviceBoardLocale';

type TCompoBoardPostitProps = {
  card: BoardCard;
  language: UiLanguage;
  isSelected?: boolean;
};

export const TCompoBoardPostit = ({ card, language, isSelected = false }: TCompoBoardPostitProps) => {
  const text = BOARD_TEXT[language];
  const isResolved = card.status === 'resolved';
  return (
    <div className={`board-card board-card--${card.type} ${isResolved ? 'board-card--resolved' : ''} ${isSelected ? 'board-card--selected' : ''}`}>
      <div className="board-card__pin" aria-hidden="true" />
      <header>
        <span>{isResolved ? `✓ ${text.resolvedItem}` : text.cardTypes[card.type]}</span>
        <small>{isResolved ? `✓ ${text.statuses.resolved}` : text.statuses[card.status]}</small>
      </header>
      {(card.topic || card.stage) && (
        <div className="board-card__context">
          {card.topic && <span>{card.topic}</span>}
          {card.stage && <strong>{text.stages[card.stage]}</strong>}
        </div>
      )}
      <p>{card.text}</p>
      {card.tags.length > 0 && (
        <footer>{card.tags.map((tag) => <span key={tag}>#{tag}</span>)}</footer>
      )}
    </div>
  );
};
