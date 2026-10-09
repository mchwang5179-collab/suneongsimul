import { useEffect, useRef, useState } from "react";
import { CSAT_PHRASES } from "@/mocks/csatPhrases";
import type { CsatPhrase } from "@/mocks/csatPhrases";

interface PhraseSelectorProps {
  selected: CsatPhrase | null;
  onSelect: (phrase: CsatPhrase | null) => void;
}

export default function PhraseSelector({
  selected,
  onSelect,
}: PhraseSelectorProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return undefined;
    const handleClick = (event: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const handlePick = (phrase: CsatPhrase) => {
    onSelect(phrase);
    setOpen(false);
  };

  const handleClear = () => {
    onSelect(null);
    setOpen(false);
  };

  return (
    <section className="rounded-lg border border-background-200 bg-background-50 p-5">
      <div className="flex items-center gap-2">
        <i className="ri-quill-pen-line text-lg text-accent-700" aria-hidden="true"></i>
        <h2 className="font-heading text-base font-bold text-foreground-950">
          역대 필적확인란
        </h2>
      </div>

      <p className="mt-2 text-[11px] leading-relaxed text-foreground-500">
        역대 수능 필적확인란 문구 중 하나를 골라보세요. 선택한 문구가 방송
        화면의 <strong className="font-semibold text-foreground-700">현재 시각</strong>{" "}
        옆에 표시됩니다.
      </p>

      <div ref={wrapRef} className="relative mt-4">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          aria-expanded={open}
          className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-md border px-4 py-3 text-left transition-colors ${
            open
              ? "border-accent-400 bg-accent-100/70"
              : "border-background-300 bg-background-50 hover:bg-background-100"
          }`}
        >
          <span className="min-w-0">
            {selected ? (
              <>
                <span className="block truncate text-[13px] font-semibold text-accent-900">
                  {selected.year}학년도
                </span>
                <span className="block truncate text-[11px] text-foreground-500">
                  {selected.phrase}
                </span>
              </>
            ) : (
              <span className="block text-[13px] text-foreground-500">
                역대 필적확인란 문구 선택
              </span>
            )}
          </span>
          <i
            className={`${
              open ? "ri-arrow-up-s-line" : "ri-arrow-down-s-line"
            } shrink-0 text-lg text-foreground-500`}
            aria-hidden="true"
          ></i>
        </button>

        {open && (
          <div className="animate-fade-in absolute left-0 right-0 z-20 mt-2 max-h-72 overflow-y-auto rounded-md border border-background-200 bg-background-50 p-1.5 shadow-none">
            {selected && (
              <button
                type="button"
                onClick={handleClear}
                className="mb-1 flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-left text-[12px] font-medium text-primary-700 transition-colors hover:bg-primary-100/60"
              >
                <i className="ri-close-circle-line" aria-hidden="true"></i>
                선택 해제
              </button>
            )}
            {CSAT_PHRASES.map((phrase) => {
              const active = selected?.year === phrase.year;
              return (
                <button
                  key={phrase.year}
                  type="button"
                  onClick={() => handlePick(phrase)}
                  className={`flex w-full cursor-pointer items-start gap-3 rounded-md px-3 py-2 text-left transition-colors ${
                    active ? "bg-accent-100" : "hover:bg-background-100"
                  }`}
                >
                  <span
                    className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums ${
                      active
                        ? "bg-accent-500 text-background-50 dark:text-foreground-950"
                        : "bg-secondary-100 text-secondary-900"
                    }`}
                  >
                    {phrase.year}
                  </span>
                  <span className="min-w-0">
                    <span
                      className={`block truncate text-[13px] font-medium ${
                        active ? "text-accent-900" : "text-foreground-900"
                      }`}
                    >
                      {phrase.phrase}
                    </span>
                    <span className="block truncate text-[11px] text-foreground-500">
                      {phrase.poet}, {phrase.work}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}