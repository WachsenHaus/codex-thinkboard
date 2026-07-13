import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { ErrorBoundary } from './ErrorBoundary';
import { PageBoard } from '../pages/PageBoard';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 500,
    },
  },
});

export const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <PageBoard />
    </QueryClientProvider>
  </ErrorBoundary>
);
