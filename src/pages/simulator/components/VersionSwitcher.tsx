import { CSAT_VERSION_LIST } from "@/mocks/csatSchedule";
import type { CsatVersionId } from "@/mocks/csatSchedule";

interface VersionSwitcherProps {
  value: CsatVersionId;
  onChange: (id: CsatVersionId) => void;
}

export default function VersionSwitcher({ value, onChange }: VersionSwitcherProps) {
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-background-200 bg-background-100 p-1">
      {CSAT_VERSION_LIST.map((version) => {
        const active = version.id === value;
        return (
          <button
            key={version.id}
            type="button"
            onClick={() => onChange(version.id)}
            aria-pressed={active}
            className={`inline-flex cursor-pointer items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              active
                ? "bg-primary-500 text-background-50 dark:text-foreground-950"
                : "text-foreground-700 hover:bg-background-200/70"
            }`}
          >
            <i
              className={active ? "ri-checkbox-circle-fill" : "ri-circle-line"}
              aria-hidden="true"
            ></i>
            {version.longLabel}
          </button>
        );
      })}
    </div>
  );
}