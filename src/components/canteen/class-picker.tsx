"use client";

import { Check, LayoutGrid, Users } from "lucide-react";
import { ALL_CLASSES, getClass } from "@/lib/school-data";

interface ClassPickerProps {
  selected: string;
  sentKeys: Set<string>;
  onSelect: (key: string) => void;
}

export function ClassPicker({ selected, sentKeys, onSelect }: ClassPickerProps) {
  const cls = getClass(selected);

  return (
    <section aria-label="Выбор класса" className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="flex items-center gap-2 text-base font-extrabold sm:text-lg">
            <LayoutGrid className="h-5 w-5 text-primary" aria-hidden />
            Классы школы
          </h2>
          <p className="text-xs font-semibold text-muted-foreground sm:text-sm">
            11 параллелей · буквы А–Д · всего {ALL_CLASSES.length} классов
          </p>
        </div>
        <p className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
          <span className="inline-block h-2 w-2 rounded-full bg-success" aria-hidden />
          заказ уже отправлен
        </p>
      </div>

      <div
        role="radiogroup"
        aria-label="Сетка классов"
        className="grid grid-cols-5 gap-1.5 rounded-2xl border border-border/70 bg-card p-3 shadow-sm sm:gap-2 sm:p-4 md:grid-cols-10 lg:grid-cols-[repeat(10,minmax(0,1fr))] xl:grid-cols-10"
      >
        {ALL_CLASSES.map((c) => {
          const isSelected = c.key === selected;
          const isSent = sentKeys.has(c.key);
          return (
            <button
              key={c.key}
              role="radio"
              aria-checked={isSelected}
              onClick={() => onSelect(c.key)}
              className={`group relative flex min-h-[44px] items-center justify-center rounded-xl border text-sm font-extrabold transition-all ${
                isSelected
                  ? "border-primary bg-primary text-primary-foreground shadow-md shadow-primary/30"
                  : isSent
                    ? "border-success/30 bg-success/10 text-success hover:border-success/60"
                    : "border-border bg-secondary/60 text-foreground/80 hover:border-primary/40 hover:bg-accent hover:text-foreground"
              }`}
              title={`${c.key} — ${c.students.length} учеников`}
            >
              {c.key}
              {isSent && (
                <span
                  className={`absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-card ${
                    isSelected ? "bg-card" : "bg-success"
                  }`}
                  aria-hidden
                >
                  <Check className={`h-2.5 w-2.5 ${isSelected ? "text-success" : "text-success-foreground"}`} strokeWidth={3.5} />
                </span>
              )}
            </button>
          );
        })}
      </div>

      <p className="flex items-center gap-1.5 px-1 text-xs font-bold text-muted-foreground sm:text-sm">
        <Users className="h-4 w-4 text-primary" aria-hidden />
        Выбран {cls.key} · {cls.students.length} учеников · староста отметит завтрак и обед
      </p>
    </section>
  );
}
