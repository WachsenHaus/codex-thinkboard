import { Handle, Position, type NodeProps } from '@xyflow/react';

import type { BoardNode } from '../service/serviceBoard';
import { BOARD_TEXT } from '../service/serviceBoardLocale';

export const TCompoBoardCard = ({ data, selected }: NodeProps<BoardNode>) => {
  const { card, language } = data;
  const text = BOARD_TEXT[language];
  const isResolved = card.status === 'resolved';
  return (
    <article className={`board-card board-card--${card.type} ${isResolved ? 'board-card--resolved' : ''} ${selected ? 'board-card--selected' : ''}`}>
      <Handle type="target" position={Position.Left} />
      <div className="board-card__pin" aria-hidden="true" />
      <header>
        <span>{isResolved ? `✓ ${text.resolvedItem}` : text.cardTypes[card.type]}</span>
        <small>{isResolved ? `✓ ${text.statuses.resolved}` : text.statuses[card.status]}</small>
      </header>
      <p>{card.text}</p>
      {card.tags.length > 0 && (
        <footer>{card.tags.map((tag) => <span key={tag}>#{tag}</span>)}</footer>
      )}
      <Handle type="source" position={Position.Right} />
    </article>
  );
};
