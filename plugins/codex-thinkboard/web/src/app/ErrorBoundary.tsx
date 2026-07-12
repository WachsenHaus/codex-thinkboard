import { Component, type ErrorInfo, type ReactNode } from 'react';

type ErrorBoundaryProps = {
  children: ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
};

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Thinkboard render failed', error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <main className="system-state">
          <p className="eyebrow">LOCAL CANVAS</p>
          <h1>보드를 그리는 중 문제가 생겼습니다.</h1>
          <button type="button" onClick={() => window.location.reload()}>
            다시 불러오기
          </button>
        </main>
      );
    }
    return this.props.children;
  }
}
