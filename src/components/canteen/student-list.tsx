"use client";

import {
  AlertCircle,
  Check,
  Croissant,
  Loader2,
  PencilLine,
  Send,
  Soup,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { countMeals, type ClassInfo, type ClassOrder } from "@/lib/school-data";
import { cn } from "@/lib/utils";

type SaveState = "idle" | "saving" | "saved" | "error";

interface StudentListProps {
  cls: ClassInfo;
  order: ClassOrder;
  saveState: SaveState;
  onToggle: (studentId: number, meal: "breakfast" | "lunch") => void;
  onSetAll: (meal: "breakfast" | "lunch" | "none") => void;
  onSend: () => void;
  onEdit: () => void;
}

export function StudentList({ cls, order, saveState, onToggle, onSetAll, onSend, onEdit }: StudentListProps) {
  const { breakfast, lunch } = countMeals(order);

  return (
    <section aria-label={`Отметки класса ${cls.key}`} className="space-y-4">
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-6">
          <div className="leading-tight">
            <h2 className="text-base font-extrabold sm:text-lg">Класс {cls.key}</h2>
            <p className="mt-0.5 text-xs font-medium text-muted-foreground sm:text-sm">
              {cls.students.length} учеников, можно отметить завтрак, обед или оба сразу.
            </p>
          </div>

          {!order.sent && (
            <div className="flex flex-wrap items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSetAll("breakfast")}
                className="min-h-[36px] rounded-md border-breakfast/40 bg-breakfast/8 text-[13px] font-bold text-breakfast hover:bg-breakfast/15"
              >
                <Croissant className="h-3.5 w-3.5" aria-hidden />
                Всем завтрак
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSetAll("lunch")}
                className="min-h-[36px] rounded-md border-lunch/40 bg-lunch/8 text-[13px] font-bold text-lunch hover:bg-lunch/15"
              >
                <Soup className="h-3.5 w-3.5" aria-hidden />
                Всем обед
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSetAll("none")}
                className="min-h-[36px] rounded-md text-[13px] font-bold text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" aria-hidden />
                Снять всё
              </Button>
            </div>
          )}
        </div>

        <ul className="nice-scroll max-h-[26rem] divide-y divide-border overflow-y-auto">
          {cls.students.map((student, index) => {
            const meal = order.meals[student.id] ?? { breakfast: false, lunch: false };
            return (
              <li
                key={student.id}
                className="flex items-center gap-2 px-4 py-2.5 transition-colors hover:bg-secondary/50 sm:gap-3 sm:px-6"
              >
                <span className="w-6 shrink-0 text-right text-xs font-semibold tabular-nums text-muted-foreground" aria-hidden>
                  {index + 1}
                </span>

                <span className="min-w-0 flex-1 truncate text-sm font-bold sm:text-[15px]">
                  {student.name}
                  {student.isMonitor && (
                    <span className="ml-2 inline-block -rotate-2 align-middle font-hand text-base font-bold leading-none text-lunch">
                      староста
                    </span>
                  )}
                </span>

                <div className="flex shrink-0 items-center gap-1.5">
                  <MealToggle
                    active={meal.breakfast}
                    disabled={order.sent}
                    color="breakfast"
                    icon={<Croissant className="h-4 w-4" aria-hidden />}
                    label="Завтрак"
                    onClick={() => onToggle(student.id, "breakfast")}
                  />
                  <MealToggle
                    active={meal.lunch}
                    disabled={order.sent}
                    color="lunch"
                    icon={<Soup className="h-4 w-4" aria-hidden />}
                    label="Обед"
                    onClick={() => onToggle(student.id, "lunch")}
                  />
                </div>
              </li>
            );
          })}
        </ul>

        <div className="border-t border-border px-4 py-4 sm:px-6">
          {order.sent ? (
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="stamp-in inline-flex items-center gap-3 rounded-md border-2 border-lunch px-4 py-2 text-lunch">
                <span className="text-sm font-black uppercase tracking-wider">
                  Отправлено в столовую
                </span>
                <span className="text-xs font-bold opacity-75">{order.sentAt}</span>
              </div>
              <Button
                variant="outline"
                onClick={onEdit}
                className="min-h-[44px] rounded-md border-lunch/40 text-sm font-extrabold text-lunch hover:bg-lunch/10"
              >
                <PencilLine className="h-4 w-4" aria-hidden />
                Изменить заказ
              </Button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-md border border-breakfast/30 bg-breakfast/8 px-3 py-1.5 text-sm font-extrabold text-breakfast">
                  <Croissant className="h-4 w-4" aria-hidden />
                  Завтраков: {breakfast}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-md border border-lunch/30 bg-lunch/8 px-3 py-1.5 text-sm font-extrabold text-lunch">
                  <Soup className="h-4 w-4" aria-hidden />
                  Обедов: {lunch}
                </span>
                <SaveIndicator state={saveState} />
              </div>
              <Button
                size="lg"
                onClick={onSend}
                disabled={breakfast === 0 && lunch === 0}
                className="min-h-[48px] rounded-md px-6 text-base font-extrabold"
              >
                <Send className="h-5 w-5" aria-hidden />
                Отправить в столовую
              </Button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function SaveIndicator({ state }: { state: SaveState }) {
  if (state === "idle") return null;
  if (state === "saving") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-bold text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
        Сохраняем…
      </span>
    );
  }
  if (state === "saved") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-bold text-primary">
        <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden />
        Сохранено
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-bold text-destructive">
      <AlertCircle className="h-3.5 w-3.5" aria-hidden />
      Не сохранилось
    </span>
  );
}

function MealToggle({
  active,
  disabled,
  color,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  disabled: boolean;
  color: "breakfast" | "lunch";
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  const activeCls =
    color === "breakfast"
      ? "border-breakfast bg-breakfast text-breakfast-foreground"
      : "border-lunch bg-lunch text-lunch-foreground";

  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex min-h-[38px] items-center gap-1.5 rounded-md border px-2.5 text-[13px] font-bold transition-colors sm:px-3",
        active
          ? activeCls
          : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
        disabled && "cursor-not-allowed opacity-55",
      )}
    >
      {active ? <Check className="h-4 w-4" aria-hidden /> : icon}
      <span className="hidden xs:inline sm:inline">{label}</span>
    </button>
  );
}
