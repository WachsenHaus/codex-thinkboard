import { BOARD_TEXT, type UiLanguage } from '../service/serviceBoardLocale';

type TCompoLanguageSelectProps = {
  language: UiLanguage;
  onChange: (language: UiLanguage) => void;
};

export const TCompoLanguageSelect = ({ language, onChange }: TCompoLanguageSelectProps) => {
  const text = BOARD_TEXT[language];

  return (
    <label className="language-select">
      <span>{text.language}</span>
      <select
        aria-label={text.language}
        value={language}
        onChange={(event) => onChange(event.target.value as UiLanguage)}
      >
        <option value="ko">{text.korean}</option>
        <option value="en">{text.english}</option>
      </select>
    </label>
  );
};
