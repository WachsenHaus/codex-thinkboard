import type { Board, BoardConnectionStatus } from '../type/typesBoard';
import { BOARD_TEXT, type UiLanguage } from '../service/serviceBoardLocale';
import { TCompoLanguageSelect } from './TCompoLanguageSelect';

type TCompoBoardHeaderProps = {
  title: string;
  phase: Board['phase'];
  language: UiLanguage;
  connectionStatus: BoardConnectionStatus;
  lastSyncedAt: number | null;
  onLanguageChange: (language: UiLanguage) => void;
};

export const TCompoBoardHeader = ({
  title,
  phase,
  language,
  connectionStatus,
  lastSyncedAt,
  onLanguageChange,
}: TCompoBoardHeaderProps) => {
  const text = BOARD_TEXT[language];
  return (
    <header className="case-board__header">
      <div>
        <p className="eyebrow">{text.localCase}</p>
        <h1>{title}</h1>
      </div>
      <div className="case-board__header-actions">
        <TCompoLanguageSelect language={language} onChange={onLanguageChange} />
        <div className={`case-board__status case-board__status--${connectionStatus}`}>
          <span className="status-dot" aria-hidden="true" />
          <span className="case-board__status-copy">
            <span aria-live="polite">
              {text.connectionStates[connectionStatus]} · {text.phases[phase]}
            </span>
            {lastSyncedAt && (
              <small>
                {text.lastChecked} {new Date(lastSyncedAt).toLocaleTimeString(language)}
              </small>
            )}
          </span>
          <strong>{text.readOnly}</strong>
        </div>
      </div>
    </header>
  );
};
