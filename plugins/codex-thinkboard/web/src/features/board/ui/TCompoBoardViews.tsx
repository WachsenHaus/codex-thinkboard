import { createTimeline, createTopicGroups } from '../service/serviceBoard';
import { BOARD_TEXT, type UiLanguage } from '../service/serviceBoardLocale';
import type { BoardCard } from '../type/typesBoard';
import { TCompoBoardPostit } from './TCompoBoardPostit';

type BoardViewProps = {
  cards: BoardCard[];
  language: UiLanguage;
  selectedCardId: string | null;
  onSelect: (cardId: string) => void;
};

const CardButton = ({ card, language, selectedCardId, onSelect }: BoardViewProps & { card: BoardCard }) => (
  <button
    type="button"
    className="board-card-button"
    aria-pressed={card.id === selectedCardId}
    onClick={() => onSelect(card.id)}
  >
    <TCompoBoardPostit card={card} language={language} isSelected={card.id === selectedCardId} />
  </button>
);

export const TCompoTopicBoard = (props: BoardViewProps) => {
  const text = BOARD_TEXT[props.language];
  const groups = createTopicGroups(props.cards);
  return (
    <div className="topic-board" aria-label={text.views.topics}>
      {groups.map((group, index) => (
        <section className="topic-group" key={group.topic ?? `ungrouped-${index}`}>
          <header className="topic-group__header">
            <div>
              <span>{text.topicGroup}</span>
              <h2>{group.topic ?? text.ungrouped}</h2>
            </div>
            <strong>{group.cards.length}</strong>
          </header>
          <div className="topic-group__cards">
            {group.cards.map((card) => <CardButton key={card.id} {...props} card={card} />)}
          </div>
        </section>
      ))}
    </div>
  );
};

export const TCompoTimelineBoard = (props: BoardViewProps) => {
  const text = BOARD_TEXT[props.language];
  const cards = createTimeline(props.cards);
  return (
    <ol className="board-timeline" aria-label={text.views.timeline}>
      {cards.map((card, index) => (
        <li key={card.id}>
          <div className="board-timeline__marker" aria-hidden="true" />
          <time dateTime={card.createdAt}>{card.createdAt
            ? new Intl.DateTimeFormat(props.language, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(card.createdAt))
            : `${text.existingCard} ${index + 1}`}</time>
          <CardButton {...props} card={card} />
        </li>
      ))}
    </ol>
  );
};
