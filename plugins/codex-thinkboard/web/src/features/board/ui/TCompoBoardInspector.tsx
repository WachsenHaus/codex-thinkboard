import type { BoardCard } from '../type/typesBoard';
import type { BoardRelationship } from '../service/serviceBoard';
import { BOARD_TEXT, type UiLanguage } from '../service/serviceBoardLocale';

type TCompoBoardInspectorProps = {
  selectedCard: BoardCard | null;
  relationships: BoardRelationship[];
  visibleCounts: { cards: number; edges: number };
  language: UiLanguage;
  isExpanded: boolean;
  onToggle: () => void;
};

export const TCompoBoardInspector = ({
  selectedCard,
  relationships,
  visibleCounts,
  language,
  isExpanded,
  onToggle,
}: TCompoBoardInspectorProps) => {
  const text = BOARD_TEXT[language];
  return (
    <aside className={`case-board__inspector ${isExpanded ? 'case-board__inspector--expanded' : 'case-board__inspector--collapsed'}`}>
      <button
        type="button"
        className="inspector-sheet-toggle"
        aria-expanded={isExpanded}
        onClick={onToggle}
      >
        <span className="inspector-sheet-toggle__grip" aria-hidden="true" />
        <span>{selectedCard ? text.cardTypes[selectedCard.type] : text.selectCard}</span>
        <span aria-hidden="true">{isExpanded ? '⌄' : '⌃'}</span>
      </button>
      <div className="inspector-sheet-content">
        <p className="eyebrow">{text.spotlight}</p>
        {!selectedCard && (
          <div className="inspector-empty">
            <h2>{text.selectCard}</h2>
            <p>{text.selectCardHelp}</p>
          </div>
        )}
        {selectedCard && (
          <div className="inspector-card">
            <div className="inspector-card__meta">
              <span>{selectedCard.status === 'resolved' ? text.resolvedItem : text.cardTypes[selectedCard.type]}</span>
              <span>{selectedCard.id}</span>
            </div>
            <span className="inspector-card__label">{text.cardText}</span>
            <p className="inspector-card__text">{selectedCard.text}</p>
            <span className="inspector-card__label">{text.status}</span>
            <p className="inspector-card__value">{text.statuses[selectedCard.status]}</p>
            <span className="inspector-card__label">{text.relationships}</span>
            {relationships.length === 0 && (
              <p className="inspector-card__muted">{text.noRelationships}</p>
            )}
            {relationships.length > 0 && (
              <ul className="relationship-list">
                {relationships.map(({ edge, source, target }) => (
                  <li key={edge.id}>
                    <strong>{text.edges[edge.kind]}</strong>
                    <span>{source?.text} → {target?.text}</span>
                  </li>
                ))}
              </ul>
            )}
            <p className="inspector-card__hint">{text.correctInCodex}</p>
          </div>
        )}
        <footer>
          <span>{text.cards} {visibleCounts.cards}</span>
          <span>{text.connections} {visibleCounts.edges}</span>
        </footer>
      </div>
    </aside>
  );
};
