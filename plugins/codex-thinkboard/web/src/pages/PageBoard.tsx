import { useState } from 'react';

import { useGearBoard } from '../features/board/gear/useGearBoard';
import { BOARD_TEXT, loadLanguage, saveLanguage, type UiLanguage } from '../features/board/service/serviceBoardLocale';
import { CompoBoardCanvas } from '../features/board/ui/CompoBoardCanvas';
import { TCompoLanguageSelect } from '../features/board/ui/TCompoLanguageSelect';

export const PageBoard = () => {
  const { value, behavior } = useGearBoard();
  const [language, setLanguage] = useState<UiLanguage>(loadLanguage);
  const text = BOARD_TEXT[language];

  const handleLanguageChange = (nextLanguage: UiLanguage): void => {
    setLanguage(nextLanguage);
    saveLanguage(nextLanguage);
    document.documentElement.lang = nextLanguage;
  };

  if (value.isLoading) {
    return (
      <main className="system-state">
        <TCompoLanguageSelect language={language} onChange={handleLanguageChange} />
        <p className="eyebrow">{text.localCanvas}</p>
        <h1>{text.loading}</h1>
      </main>
    );
  }

  if (!value.board) {
    return (
      <main className="system-state">
        <TCompoLanguageSelect language={language} onChange={handleLanguageChange} />
        <p className="eyebrow">{text.connectionLost}</p>
        <h1>{text.connectionError}</h1>
        <p>{value.error?.message ?? text.noBoard}</p>
        <button type="button" onClick={() => behavior.refetch()}>
          {text.reconnect}
        </button>
      </main>
    );
  }

  return (
    <CompoBoardCanvas
      board={value.board}
      language={language}
      connectionStatus={value.connectionStatus}
      lastSyncedAt={value.lastSyncedAt}
      onLanguageChange={handleLanguageChange}
    />
  );
};
