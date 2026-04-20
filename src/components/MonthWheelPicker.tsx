import { ChevronUp, ChevronDown } from "lucide-react";

const MESI = [
  "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
  "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre",
];

function formatMese(key: string) {
  const [anno, mese] = key.split("-").map(Number);
  return { mese: MESI[mese - 1], anno };
}

interface Props {
  value: string;
  options: string[];
  onChange: (val: string) => void;
}

export function MonthWheelPicker({ value, options, onChange }: Props) {
  const idx = options.indexOf(value);

  const go = (dir: -1 | 1) => {
    const next = idx + dir;
    if (next >= 0 && next < options.length) onChange(options[next]);
  };

  const prev = idx > 0 ? options[idx - 1] : null;
  const next = idx < options.length - 1 ? options[idx + 1] : null;
  const current = formatMese(value);

  return (
    <div className="flex flex-col items-center select-none w-full">
      <button
        type="button"
        onClick={() => go(-1)}
        disabled={!prev}
        className="text-stat-foreground opacity-40 hover:opacity-100 disabled:opacity-10 transition-opacity"
      >
        <ChevronUp className="h-4 w-4" />
      </button>

      {prev && (
        <button
          type="button"
          onClick={() => go(-1)}
          className="text-stat-foreground/40 text-xs font-medium leading-tight hover:text-stat-foreground/70 transition-colors"
        >
          {formatMese(prev).mese} {formatMese(prev).anno}
        </button>
      )}

      <div className="py-0.5 text-center">
        <p className="text-stat-foreground font-bold text-base leading-tight">{current.mese} {current.anno}</p>
      </div>

      {next && (
        <button
          type="button"
          onClick={() => go(1)}
          className="text-stat-foreground/40 text-xs font-medium leading-tight hover:text-stat-foreground/70 transition-colors"
        >
          {formatMese(next).mese} {formatMese(next).anno}
        </button>
      )}

      <button
        type="button"
        onClick={() => go(1)}
        disabled={!next}
        className="text-stat-foreground opacity-40 hover:opacity-100 disabled:opacity-10 transition-opacity"
      >
        <ChevronDown className="h-4 w-4" />
      </button>
    </div>
  );
}
