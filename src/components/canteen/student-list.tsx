"use client";

import {
  Check,
  Clock,
  Croissant,
  PencilLine,
  Send,
  Soup,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AVATAR_COLORS, countMeals, initials, type ClassInfo, type ClassOrder } from "@/lib/school-data";

interface StudentListProps {
  cls: ClassInfo;
  order: ClassOrder;
  onToggle: (studentId: number, meal: "breakfast" | "lunch") => void;
  onSetAll: (meal: "breakfast" | "lunch" | "none") => void;
  onSend: () => void;
  onEdit: () => void;
}

export function StudentList({ cls, order, onToggle, onSetAll, onSend, onEdit }: StudentListProps) {
  const { breakfast, lunch } = countMeals(order);

  return (
    <section aria-label={`Отметки класса ${cls.key}`} className="space-y-4">
      <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
        {/* Заголовок списка */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 bg-secondary/50 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/12 text-primary">
              <Users className="h-5 w-5" aria-hidden />
            </div>
            <div className="leading-tight">
              <h2 className="text-base font-extrabold sm:text-lg">Класс {cls.key}</h2>
              <p className="text-xs font-semibold text-muted-foreground">
                {cls.students.length} учеников · отметки на сегодня
              </p>
            </div>
          </div>

          {!order.sent && (
            <div className="flex flex-wrap items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSetAll("breakfast")}
                className="min-h-[36px] rounded-lg border-breakfast/50 bg-breakfast/10 text-[13px] font-bold text-breakfast-foreground hover:bg-breakfast/20"
              >
                <Croissant className="h-3.5 w-3.5" aria-hidden />
                Всем завтрак
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSetAll("lunch")}
                className="min-h-[36px] rounded-lg border-lunch/40 bg-lunch/10 text-[13px] font-bold text-lunch hover:bg-lunch/20"
              >
                <Soup className="h-3.5 w-3.5" aria-hidden />
                Всем обед
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSetAll("none")}
                className="min-h-[36px] rounded-lg text-[13px] font-bold text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" aria-hidden />
                Снять всё
              </Button>
            </div>
          )}
        </div>

        {/* Список учеников */}
        <ul className="nice-scroll max-h-[26rem] divide-y divide-border/60 overflow-y-auto">
          {cls.students.map((student) => {
            const meal = order.meals[student.id] ?? { breakfast: false, lunch: false };
            const avatarColor = AVATAR_COLORS[student.id % AVATAR_COLORS.length];
            return (
              <li
                key={student.id}
                className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-secondary/40 sm:px-6"
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-extrabold ${avatarColor}`}
                  aria-hidden
                >
                  {initials(student.name)}
                </span>

                <span className="min-w-0 flex-1 truncate text-sm font-bold sm:text-[15px]">
                  {student.name}
                  {student.isMonitor && (
                    <span className="ml-2 inline-flex translate-y-[-1px] items-center rounded-full bg-accent px-2 py-0.5 align-middle text-[10px] font-extrabold uppercase tracking-wide text-accent-foreground">
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

        {/* Панель отправки */}
        <div className="border-t border-border/70 bg-secondary/50 px-4 py-4 sm:px-6">
          {order.sent ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 text-sm font-bold text-success">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-success/15">
                  <Check className="h-5 w-5" strokeWidth={3} aria-hidden />
                </span>
                <span>
                  Заказ отправлен в столовую
                  <span className="ml-1.5 inline-flex items-center gap-1 text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" aria-hidden />
                    в {order.sentAt}
                  </span>
                </span>
              </div>
              <Button
                variant="outline"
                onClick={onEdit}
                className="min-h-[44px] rounded-xl border-success/40 text-sm font-extrabold text-success hover:bg-success/10"
              >
                <PencilLine className="h-4 w-4" aria-hidden />
                Изменить заказ
              </Button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-breakfast/15 px-3 py-1.5 text-sm font-extrabold text-breakfast-foreground">
                  <Croissant className="h-4 w-4" aria-hidden />
                  Завтраков: {breakfast}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-lunch/15 px-3 py-1.5 text-sm font-extrabold text-lunch">
                  <Soup className="h-4 w-4" aria-hidden />
                  Обедов: {lunch}
                </span>
              </div>
              <Button
                size="lg"
                onClick={onSend}
                disabled={breakfast === 0 && lunch === 0}
                className="min-h-[48px] rounded-xl bg-success px-6 text-base font-extrabold text-success-foreground shadow-md shadow-success/30 hover:bg-success/90"
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
      ? "border-breakfast bg-breakfast text-breakfast-foreground shadow-sm shadow-breakfast/40"
      : "border-lunch bg-lunch text-lunch-foreground shadow-sm shadow-lunch/40";

  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border px-2.5 text-[13px] font-bold transition-all sm:px-3 ${
        active
          ? activeCls
          : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
      } ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
    >
      {icon}
      <span className="hidden xs:inline sm:inline">{label}</span>
    </button>
  );
}
