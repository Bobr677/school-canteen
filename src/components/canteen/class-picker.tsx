"use client";

import { Check } from "lucide-react";
import { ALL_CLASSES, GRADES, getClass } from "@/lib/school-data";
import { cn } from "@/lib/utils";

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
          <h2 className="text-base font-extrabold sm:text-lg">Классы школы</h2>
          <p className="text-xs font-medium text-muted-foreground sm:text-sm">
            {GRADES.length} параллелей с 5 по 11, всего {ALL_CLASSES.length} классов.
          </p>
        </div>
        <p className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
          <span className="inline-block h-2 w-2 rounded-[2px] bg-lunch" aria-hidden />
          класс уже отправил заказ
        </p>
      </div>

      <div
        role="radiogroup"
        aria-label="Сетка классов"
        className="grid grid-cols-5 gap-px overflow-hidden rounded-md border border-border bg-border sm:grid-cols-7 md:grid-cols-10"
      >
        {ALL_CLASSES.map((c) => {
          const isSelected = c.key === selected;
          const isSent = sentKeys.has(c.key);
          return (
            <button
              key={c.key}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onSelect(c.key)}
              className={cn(
                "group relative flex min-h-[44px] items-center justify-center text-sm font-extrabold transition-colors",
                isSelected
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-foreground/80 hover:bg-accent hover:text-accent-foreground",
              )}
              title={`${c.key} — ${c.students.length} учеников`}
            >
              {c.key}
              {isSent && (
                <Check
                  className={cn(
                    "absolute right-1 top-1 h-3 w-3",
                    isSelected ? "text-primary-foreground" : "text-lunch",
                  )}
                  strokeWidth={3.5}
                  aria-label="заказ отправлен"
                />
              )}
            </button>
          );
        })}
        <span className="hidden bg-card md:block" aria-hidden />
        <span className="hidden bg-card md:block" aria-hidden />
        <span className="hidden bg-card md:block" aria-hidden />
        <span className="hidden bg-card md:block" aria-hidden />
        <span className="hidden bg-card md:block" aria-hidden />
      </div>

      <p className="px-1 text-xs font-bold text-muted-foreground sm:text-sm">
        Выбран класс {cls.key}, в нём {cls.students.length} учеников.
      </p>
    </section>
  );
}
