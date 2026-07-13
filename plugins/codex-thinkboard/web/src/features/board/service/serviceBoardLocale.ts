export type UiLanguage = 'ko' | 'en';

export const BOARD_LANGUAGE_STORAGE_KEY = 'thinkboard-language';

export const BOARD_TEXT = {
  ko: {
    language: '언어',
    korean: '한국어',
    english: 'English',
    localCase: 'THINKBOARD · 로컬 보드',
    localCanvas: '로컬 캔버스',
    readOnly: '읽기 전용',
    lastChecked: '마지막 확인',
    connectionStates: {
      connecting: '연결 중',
      live: '실시간 연결',
      fallback: '폴링 복구 중',
      offline: '연결 끊김',
    },
    spotlight: '집중 보기',
    selectCard: '카드를 선택하세요',
    selectCardHelp: '카드를 선택하면 의미와 연결 관계를 설명합니다.',
    cardText: '카드 내용',
    status: '상태',
    relationships: '연결된 관계',
    noRelationships: '연결된 관계가 없습니다.',
    correctInCodex: '수정이 필요하면 Codex 대화창에서 자연어로 알려주세요.',
    cards: '카드',
    connections: '연결',
    loading: '보드를 펼치는 중...',
    connectionLost: '연결 끊김',
    connectionError: '로컬 Thinkboard에 연결할 수 없습니다.',
    noBoard: '보드 데이터가 없습니다.',
    reconnect: '다시 연결',
    resolvedItem: '해결된 것',
    showResolved: '해결됨 보기',
    hideResolved: '해결됨 숨기기',
    views: { topics: '주제', relationships: '관계', timeline: '타임라인' },
    topicGroup: '주제 묶음',
    ungrouped: '아직 분류되지 않음',
    existingCard: '기존 카드',
    topic: '주제',
    stage: '사고 단계',
    createdAt: '생성 시각',
    stages: { problem: '문제', idea: '아이디어', decision: '결정', action: '실행' },
    phases: {
      opening: '시작',
      clarifying: '구체화',
      challenging: '검토',
      ready: '준비됨',
    },
    cardTypes: {
      want: '원하는 것',
      unknown: '모르는 것',
      evidence: '확인된 근거',
      assumption: '확인할 가정',
    },
    statuses: {
      candidate: '검토 중',
      confirmed: '확정',
      resolved: '해결됨',
      rejected: '제외됨',
    },
    edges: {
      depends_on: '의존함',
      blocks: '막고 있음',
      contradicts: '충돌함',
      resolves: '해결함',
    },
  },
  en: {
    language: 'Language',
    korean: '한국어',
    english: 'English',
    localCase: 'THINKBOARD · LOCAL BOARD',
    localCanvas: 'LOCAL CANVAS',
    readOnly: 'Read only',
    lastChecked: 'Last checked',
    connectionStates: {
      connecting: 'Connecting',
      live: 'Live',
      fallback: 'Polling fallback',
      offline: 'Offline',
    },
    spotlight: 'SPOTLIGHT',
    selectCard: 'Select a card',
    selectCardHelp: 'Select a card to understand its meaning and relationships.',
    cardText: 'Card content',
    status: 'Status',
    relationships: 'Relationships',
    noRelationships: 'This card has no relationships.',
    correctInCodex: 'To correct the meaning, describe the change in your Codex conversation.',
    cards: 'Cards',
    connections: 'Connections',
    loading: 'Opening the board...',
    connectionLost: 'CONNECTION LOST',
    connectionError: 'Cannot connect to the local Thinkboard.',
    noBoard: 'No board data is available.',
    reconnect: 'Reconnect',
    resolvedItem: 'Resolved item',
    showResolved: 'Show resolved',
    hideResolved: 'Hide resolved',
    views: { topics: 'Topics', relationships: 'Relationships', timeline: 'Timeline' },
    topicGroup: 'Topic group',
    ungrouped: 'Not grouped yet',
    existingCard: 'Existing card',
    topic: 'Topic',
    stage: 'Thinking stage',
    createdAt: 'Created',
    stages: { problem: 'Problem', idea: 'Idea', decision: 'Decision', action: 'Action' },
    phases: {
      opening: 'Opening',
      clarifying: 'Clarifying',
      challenging: 'Challenging',
      ready: 'Ready',
    },
    cardTypes: {
      want: 'Want',
      unknown: 'Unknown',
      evidence: 'Evidence',
      assumption: 'Assumption',
    },
    statuses: {
      candidate: 'Candidate',
      confirmed: 'Confirmed',
      resolved: 'Resolved',
      rejected: 'Rejected',
    },
    edges: {
      depends_on: 'Depends on',
      blocks: 'Blocks',
      contradicts: 'Contradicts',
      resolves: 'Resolves',
    },
  },
} as const;

export const resolveLanguage = (storedLanguage: string | null, browserLanguage: string): UiLanguage => {
  if (storedLanguage === 'ko' || storedLanguage === 'en') return storedLanguage;
  return browserLanguage.toLowerCase().startsWith('ko') ? 'ko' : 'en';
};

export const loadLanguage = (): UiLanguage => {
  try {
    return resolveLanguage(window.localStorage.getItem(BOARD_LANGUAGE_STORAGE_KEY), window.navigator.language);
  } catch {
    return 'ko';
  }
};

export const saveLanguage = (language: UiLanguage): void => {
  try {
    window.localStorage.setItem(BOARD_LANGUAGE_STORAGE_KEY, language);
  } catch {
    // The setting still applies for this session when browser storage is unavailable.
  }
};
