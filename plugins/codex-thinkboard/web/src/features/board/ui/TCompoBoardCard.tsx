import { Handle, Position, type NodeProps } from '@xyflow/react';

import type { BoardNode } from '../service/serviceBoard';
import { TCompoBoardPostit } from './TCompoBoardPostit';

export const TCompoBoardCard = ({ data, selected }: NodeProps<BoardNode>) => {
  const { card, language } = data;
  return (
    <>
      <Handle type="target" position={Position.Left} />
      <TCompoBoardPostit card={card} language={language} isSelected={selected} />
      <Handle type="source" position={Position.Right} />
    </>
  );
};
