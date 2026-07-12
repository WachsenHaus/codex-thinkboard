import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  useEdgesState,
  useNodesState,
  type Node,
  type ReactFlowInstance,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import {
  createEdges,
  createNodes,
  createSelectionHighlight,
  createVisibleBoard,
  getCardRelationships,
  loadLayout,
  saveLayout,
  type BoardFlowEdge,
  type BoardLayoutMode,
  type BoardNode,
} from '../service/serviceBoard';
import type { Board, BoardConnectionStatus } from '../type/typesBoard';
import { BOARD_TEXT, type UiLanguage } from '../service/serviceBoardLocale';
import { TCompoBoardCard } from './TCompoBoardCard';
import { TCompoBoardHeader } from './TCompoBoardHeader';
import { TCompoBoardInspector } from './TCompoBoardInspector';
import { TCompoBoardString } from './TCompoBoardString';

type CompoBoardCanvasProps = {
  board: Board;
  language: UiLanguage;
  connectionStatus: BoardConnectionStatus;
  lastSyncedAt: number | null;
  onLanguageChange: (language: UiLanguage) => void;
};

const nodeTypes = { boardCard: TCompoBoardCard };
const edgeTypes = { boardString: TCompoBoardString };

const useBoardLayoutMode = (): BoardLayoutMode => {
  const [layoutMode, setLayoutMode] = useState<BoardLayoutMode>(() => (
    window.matchMedia('(max-width: 800px)').matches ? 'compact' : 'wide'
  ));

  useEffect(() => {
    const media = window.matchMedia('(max-width: 800px)');
    const handleChange = (event: MediaQueryListEvent): void => setLayoutMode(event.matches ? 'compact' : 'wide');
    media.addEventListener('change', handleChange);
    return () => media.removeEventListener('change', handleChange);
  }, []);

  return layoutMode;
};

export const CompoBoardCanvas = ({
  board,
  language,
  connectionStatus,
  lastSyncedAt,
  onLanguageChange,
}: CompoBoardCanvasProps) => {
  const text = BOARD_TEXT[language];
  const layoutMode = useBoardLayoutMode();
  const [showResolved, setShowResolved] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [isInspectorExpanded, setIsInspectorExpanded] = useState(false);
  const resolvedCardCount = board.cards.filter((card) => card.status === 'resolved').length;
  const projection = useMemo(() => {
    const visibleBoard = createVisibleBoard(board, showResolved);
    const savedLayout = loadLayout(board.id, layoutMode);
    const selection = createSelectionHighlight(visibleBoard, selectedCardId);
    return {
      visibleBoard,
      nodes: createNodes(visibleBoard, savedLayout, language, layoutMode, selection),
      edges: createEdges(visibleBoard, language, selection),
    };
  }, [board, language, layoutMode, selectedCardId, showResolved]);
  const [nodes, setNodes, onNodesChange] = useNodesState<BoardNode>(projection.nodes);
  const [edges, setEdges] = useEdgesState<BoardFlowEdge>(projection.edges);
  const flowInstance = useRef<ReactFlowInstance<BoardNode, BoardFlowEdge> | null>(null);
  const selectedCard = board.cards.find((card) => card.id === selectedCardId) ?? null;
  const selectedRelationships = getCardRelationships(board, selectedCardId);

  useEffect(() => {
    setNodes(projection.nodes);
    setEdges(projection.edges);
  }, [projection, setEdges, setNodes]);

  useEffect(() => {
    if (layoutMode !== 'compact') return;
    const timer = window.setTimeout(() => {
      const selectedNodes = isInspectorExpanded && selectedCardId
        ? [{ id: selectedCardId }]
        : undefined;
      void flowInstance.current?.fitView({
        nodes: selectedNodes,
        padding: selectedNodes ? 0.8 : 0.08,
        minZoom: selectedNodes ? 0.72 : 0.55,
        maxZoom: selectedNodes ? 0.88 : 0.82,
        duration: 240,
      });
    }, 220);
    return () => window.clearTimeout(timer);
  }, [isInspectorExpanded, layoutMode, selectedCardId]);

  const handleNodeClick = (_event: React.MouseEvent, node: Node): void => {
    setSelectedCardId(node.id);
    setIsInspectorExpanded(true);
  };

  const handlePaneClick = (): void => {
    setSelectedCardId(null);
    setIsInspectorExpanded(false);
  };

  const handleNodeDragStop = (): void => {
    saveLayout(board.id, layoutMode, nodes);
  };

  const handleResolvedToggle = (): void => {
    if (showResolved && selectedCard?.status === 'resolved') setSelectedCardId(null);
    setShowResolved((value) => !value);
  };

  return (
    <main className="case-board">
      <TCompoBoardHeader
        title={board.title}
        phase={board.phase}
        language={language}
        connectionStatus={connectionStatus}
        lastSyncedAt={lastSyncedAt}
        onLanguageChange={onLanguageChange}
      />

      <section className={`case-board__workspace ${isInspectorExpanded ? 'case-board__workspace--inspector-expanded' : ''}`}>
        <div className="case-board__canvas">
          <div className="case-board__canvas-toolbar">
            {resolvedCardCount > 0 && (
              <button
                type="button"
                className="case-board__resolved-toggle"
                aria-pressed={showResolved}
                onClick={handleResolvedToggle}
              >
                <span aria-hidden="true">✓</span>
                {showResolved ? text.hideResolved : text.showResolved}
                <strong>{resolvedCardCount}</strong>
              </button>
            )}
          </div>
          <div className="case-board__flow">
            <ReactFlow
              key={layoutMode}
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              onNodesChange={onNodesChange}
              onInit={(instance) => { flowInstance.current = instance; }}
              onNodeClick={handleNodeClick}
              onPaneClick={handlePaneClick}
              onNodeDragStop={handleNodeDragStop}
              nodesConnectable={false}
              edgesReconnectable={false}
              deleteKeyCode={null}
              fitView
              fitViewOptions={layoutMode === 'compact'
                ? { padding: 0.08, minZoom: 0.68, maxZoom: 0.82 }
                : { padding: 0.16, maxZoom: 1 }}
              minZoom={layoutMode === 'compact' ? 0.55 : 0.35}
              maxZoom={1.6}
            >
              <Background color="#4b4038" gap={28} size={1} />
              <MiniMap pannable zoomable nodeColor="#6b4e3f" maskColor="rgba(10, 9, 8, 0.72)" />
              <Controls showInteractive={false} />
            </ReactFlow>
          </div>
        </div>

        <TCompoBoardInspector
          selectedCard={selectedCard}
          relationships={selectedRelationships}
          visibleCounts={{
            cards: projection.visibleBoard.cards.length,
            edges: projection.visibleBoard.edges.length,
          }}
          language={language}
          isExpanded={isInspectorExpanded}
          onToggle={() => setIsInspectorExpanded((value) => !value)}
        />
      </section>
    </main>
  );
};
