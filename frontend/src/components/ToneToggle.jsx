/**
 * ToneToggle - three-way toggle for switching AI response tone.
 * Options: Professional | Casual | Concise
 */
import { useAppStore } from '../context/appStore';

const TONES = [
  { key: 'professional', label: 'Professional', emoji: '🎩' },
  { key: 'casual', label: 'Casual', emoji: '😊' },
  { key: 'concise', label: 'Concise', emoji: '⚡' },
];

export function ToneToggle({ disabled = false }) {
  const tone = useAppStore((s) => s.tone);
  const setTone = useAppStore((s) => s.setTone);

  return (
    <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl" role="group" aria-label="Select tone">
      {TONES.map(({ key, label, emoji }) => (
        <button
          key={key}
          onClick={() => !disabled && setTone(key)}
          disabled={disabled}
          aria-pressed={tone === key}
          aria-label={`${label} tone`}
          title={label}
          className={`
            flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
            transition-all duration-200 select-none
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            ${
              tone === key
                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }
          `}
        >
          <span role="img" aria-hidden="true">{emoji}</span>
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  );
}
