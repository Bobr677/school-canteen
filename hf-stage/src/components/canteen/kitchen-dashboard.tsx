"use client";

import { useMemo, useState } from "react";
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
      ALL_CLASSES.map((c) => {
        const o = orders[c.key];
        const m = o?.sent ? countMeals(o) : { breakfast: 0, lunch: 0 };
        return { cls: c, order: o, ...m };
      }).filter((r) => {
        if (filter === "sent") return r.order?.sent;
        if (filter === "waiting") return !r.order?.sent;
        return true;
      }),
    [orders, filter],
  );

  const cells = [
    { label: "Классов отправили", value: `${stats.sent} из ${ALL_CLASSES.length}`, tone: "text-foreground" },
    { label: "Завтраков", value: String(stats.breakfast), tone: "text-breakfast" },
    { label: "Обедов", value: String(stats.lunch), tone: "text-lunch" },
    { label: "Всего порций", value: String(stats.total), tone: "text-foreground" },
  ];

  return (
    <section aria-label="Экран столовой" className="space-y-6">
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border lg:grid-cols-4">
        {cells.map((cell) => (
          <div key={cell.label} className="bg-card px-5 py-4">
            <p className={cn("text-3xl font-black tabular-nums tracking-tight", cell.tone)}>
              {cell.value}
            </p>
            <p className="mt-1 text-xs font-bold text-muted-foreground sm:text-sm">
              {cell.label}
            </p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-extrabold sm:text-lg">Заказы по классам</h2>
        <div
          role="tablist"
          aria-label="Фильтр заказов"
          className="flex items-center gap-1 rounded-md border border-border bg-card p-1"
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
              type="button"
              role="tab"
              aria-selected={filter === f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "min-h-[36px] rounded-sm px-3 text-[13px] font-bold transition-colors",
                filter === f.key
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
        {rows.map(({ cls, order, breakfast, lunch }) => {
          const sent = Boolean(order?.sent);
          return (
            <article key={cls.key} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-6">
              <span
                className={cn(
                  "w-12 shrink-0 text-lg font-black tabular-nums",
                  sent ? "text-foreground" : "text-muted-foreground/60",
                )}
              >
                {cls.key}
              </span>

              <span className="min-w-0 flex-1 text-xs font-medium text-muted-foreground sm:text-sm">
                {cls.grade} класс, {cls.students.length} учеников
              </span>

              <div className="flex items-center gap-5">
                <div className="w-12 text-right leading-tight">
                  <p className={cn("text-lg font-black tabular-nums", sent ? "text-breakfast" : "text-muted-foreground/40")}>
                    {sent ? breakfast : "—"}
                  </p>
                  <p className="text-[10px] font-bold text-muted-foreground">завтраков</p>
                </div>
                <div className="w-12 text-right leading-tight">
                  <p className={cn("text-lg font-black tabular-nums", sent ? "text-lunch" : "text-muted-foreground/40")}>
                    {sent ? lunch : "—"}
                  </p>
                  <p className="text-[10px] font-bold text-muted-foreground">обедов</p>
                </div>
                <div className="w-[9.5rem] text-right">
                  {sent ? (
                    <span className="inline-block -rotate-1 rounded border-2 border-lunch/70 px-2 py-0.5 text-[11px] font-black uppercase tracking-wider text-lunch">
                      {order?.sentAt}
                    </span>
                  ) : (
                    <span className="font-hand text-lg font-bold text-muted-foreground">
                      ещё не отправляли
                    </span>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {rows.length === 0 && (
        <div className="rounded-lg border border-dashed border-border bg-card p-10 text-center">
          <p className="font-hand text-2xl font-bold text-muted-foreground">
            {filter === "sent"
              ? "пока ни один класс не отправил заказ"
              : "все классы уже отправили заказы"}
          </p>
        </div>
      )}
    </section>
  );
}
