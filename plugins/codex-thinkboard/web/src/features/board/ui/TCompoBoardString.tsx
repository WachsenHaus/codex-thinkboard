import { BaseEdge, EdgeLabelRenderer, getBezierPath, type EdgeProps } from '@xyflow/react';

import type { BoardFlowEdge } from '../service/serviceBoard';

const STRING_STYLES = {
  depends_on: { stroke: '#c59a68', strokeWidth: 3, strokeDasharray: '2 3' },
  blocks: { stroke: '#b94238', strokeWidth: 3 },
  contradicts: { stroke: '#e15346', strokeWidth: 3.5, strokeDasharray: '8 4' },
  resolves: { stroke: '#719a78', strokeWidth: 3 },
} as const;

export const TCompoBoardString = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  label,
  data,
  selected,
}: EdgeProps<BoardFlowEdge>) => {
  const [path, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    curvature: 0.28,
  });
  const kind = data?.kind ?? 'depends_on';
  const stringStyle = STRING_STYLES[kind];
  const emphasisClass = data?.isDimmed
    ? 'board-string--dimmed'
    : data?.isRelated
      ? 'board-string--related'
      : '';

  return (
    <>
      <BaseEdge
        id={`${id}-shadow`}
        path={path}
        className={`board-string__shadow ${emphasisClass}`}
        style={{ stroke: 'rgba(0, 0, 0, 0.56)', strokeWidth: 7, strokeLinecap: 'round' }}
      />
      <BaseEdge
        id={id}
        path={path}
        className={`board-string board-string--${kind} ${emphasisClass} ${selected ? 'board-string--selected' : ''}`}
        style={{
          ...stringStyle,
          strokeWidth: selected ? Number(stringStyle.strokeWidth) + 1.5 : stringStyle.strokeWidth,
          strokeLinecap: 'round',
        }}
      />
      <EdgeLabelRenderer>
        <div
          className={`board-string__label board-string__label--${kind} ${emphasisClass}`}
          style={{ transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)` }}
        >
          {label}
        </div>
      </EdgeLabelRenderer>
    </>
  );
};
