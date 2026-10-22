"use client";

import { useMemo, useState } from "react";
import { Check, ChefHat, Clock, Croissant, Soup, Users } from "lucide-react";
import { ALL_CLASSES, countMeals, type ClassOrder } from "@/lib/school-data";
import { cn } from "@/lib/utils";

type Filter = "all" | "sent" | "waiting";

interface KitchenDashboardProps {
  orders: Record<string, ClassOrder>;
}

export function KitchenDashboard({ orders }: KitchenDashboardProps) {
  const [filter, setFilter] = useState<Filter>("all");

  const stats = useMemo(() => {
    let breakfast = 0;
    let lunch = 0;
    let sent = 0;
    for (const c of ALL_CLASSES) {
      const o = orders[c.key];
      if (!o?.sent) continue;
      sent++;
      const m = countMeals(o);
      breakfast += m.breakfast;
      lunch += m.lunch;
    }
    return { breakfast, lunch, sent, total: breakfast + lunch };
  }, [orders]);

  const rows = useMemo(
    () =>
      ALL_CLASSES
        .map((c) => {
          const o = orders[c.key];
          const m = o?.sent ? countMeals(o) : { breakfast: 0, lunch: 0 };
          return { cls: c, order: o, ...m };
        })
        .filter((r) => {
          if (filter === "sent") return r.order?.sent;
          if (filter === "waiting") return !r.order?.sent;
          return true;
        }),
    [orders, filter],
  );

  const statCards = [
    {
      icon: <ChefHat className="h-5 w-5" aria-hidden />,
      label: "Классов отправили",
      value: `${stats.sent} / ${ALL_CLASSES.length}`,
      tone: "bg-success/12 text-success",
    },
    {
      icon: <Croissant className="h-5 w-5" aria-hidden />,
      label: "Завтраков",
      value: String(stats.breakfast),
      tone: "bg-breakfast/15 text-breakfast-foreground",
    },
    {
      icon: <Soup className="h-5 w-5" aria-hidden />,
      label: "Обедов",
      value: String(stats.lunch),
      tone: "bg-lunch/12 text-lunch",
    },
    {
      icon: <Users className="h-5 w-5" aria-hidden />,
      label: "Всего порций",
      value: String(stats.total),
      tone: "bg-primary/12 text-primary",
    },
  ];

  return (
    <section aria-label="Экран столовой" className="space-y-6">
      {/* Статистика */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm sm:p-5"
          >
            <span
              className={cn(
                "mb-3 flex h-10 w-10 items-center justify-center rounded-xl",
                card.tone,
              )}
              aria-hidden
            >
              {card.icon}
            </span>
            <p className="text-2xl font-extrabold tracking-tight sm:text-3xl">{card.value}</p>
            <p className="mt-0.5 text-xs font-bold text-muted-foreground sm:text-sm">
              {card.label}
            </p>
          </div>
        ))}
      </div>

      {/* Фильтры */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-extrabold sm:text-lg">Заказы по классам</h2>
        <div
          role="tablist"
          aria-label="Фильтр заказов"
          className="flex items-center gap-1 rounded-xl border border-border/70 bg-secondary p-1"
        >
          {(
            [
              { key: "all", label: "Все" },
              { key: "sent", label: "Отправлено" },
              { key: "waiting", label: "Ожидают" },
            ] as const
          ).map((f) => (
            <button
              key={f.key}
              role="tab"
              aria-selected={filter === f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "min-h-[36px] rounded-lg px-3 text-[13px] font-bold transition-all",
                filter === f.key
                  ? "bg-card text-foreground shadow-sm ring-1 ring-border"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Карточки классов */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map(({ cls, order, breakfast, lunch }) => {
          const sent = Boolean(order?.sent);
          return (
            <article
              key={cls.key}
              className={cn(
                "rounded-2xl border bg-card p-4 shadow-sm transition-all hover:shadow-md",
                sent ? "border-success/30" : "border-border/70",
              )}
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-xl text-sm font-extrabold",
                      sent ? "bg-success/12 text-success" : "bg-secondary text-muted-foreground",
                    )}
                    aria-hidden
                  >
                    {cls.key}
                  </span>
                  <div className="leading-tight">
                    <p className="text-sm font-extrabold">{cls.grade} класс</p>
                    <p className="text-xs font-semibold text-muted-foreground">
                      {cls.students.length} учеников
                    </p>
                  </div>
                </div>
                {sent ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-success/12 px-2.5 py-1 text-[11px] font-extrabold text-success">
                    <Check className="h-3 w-3" strokeWidth={3.5} aria-hidden />
                    {order?.sentAt}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-[11px] font-extrabold text-accent-foreground">
                    <Clock className="h-3 w-3" aria-hidden />
                    ожидает
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2 rounded-xl bg-breakfast/10 px-3 py-2">
                  <Croissant className="h-4 w-4 shrink-0 text-breakfast-foreground/70" aria-hidden />
                  <div className="leading-tight">
                    <p className="text-base font-extrabold text-breakfast-foreground">{breakfast}</p>
                    <p className="text-[11px] font-bold text-muted-foreground">завтраков</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-xl bg-lunch/10 px-3 py-2">
                  <Soup className="h-4 w-4 shrink-0 text-lunch/80" aria-hidden />
                  <div className="leading-tight">
                    <p className="text-base font-extrabold text-lunch">{lunch}</p>
                    <p className="text-[11px] font-bold text-muted-foreground">обедов</p>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {rows.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center">
          <ChefHat className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" aria-hidden />
          <p className="text-sm font-bold text-muted-foreground">
            {filter === "sent"
              ? "Пока ни один класс не отправил заказ — загляните позже."
              : "Все классы уже отправили заказы. Кухня работает в полную силу!"}
          </p>
        </div>
      )}
    </section>
  );
}
