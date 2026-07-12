import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { apiBoard } from '../api/apiBoard';
import type { BoardConnectionStatus } from '../type/typesBoard';

const BOARD_QUERY_KEY = ['thinkboard'] as const;

export const useGearBoard = () => {
  const queryClient = useQueryClient();
  const [isEventConnected, setIsEventConnected] = useState(false);
  const boardQuery = useQuery({
    queryKey: BOARD_QUERY_KEY,
    queryFn: apiBoard.fetchCurrent,
    refetchInterval: isEventConnected ? false : 1500,
  });
  useEffect(() => {
    const events = new EventSource('/api/events');
    events.addEventListener('open', () => {
      setIsEventConnected(true);
      void queryClient.refetchQueries({ queryKey: BOARD_QUERY_KEY });
    });
    events.addEventListener('error', () => setIsEventConnected(false));
    events.addEventListener('board', () => {
      void queryClient.invalidateQueries({ queryKey: BOARD_QUERY_KEY });
    });
    return () => events.close();
  }, [queryClient]);

  let connectionStatus: BoardConnectionStatus = 'fallback';
  if (isEventConnected) connectionStatus = 'live';
  else if (boardQuery.isLoading) connectionStatus = 'connecting';
  else if (boardQuery.isError || boardQuery.isRefetchError) connectionStatus = 'offline';

  return {
    value: {
      board: boardQuery.data,
      isLoading: boardQuery.isLoading,
      error: boardQuery.error,
      connectionStatus,
      lastSyncedAt: boardQuery.dataUpdatedAt || null,
    },
    behavior: {
      refetch: () => void boardQuery.refetch(),
    },
  };
};
