"use client";

import { ArrowRight, ChefHat, UserCheck, UtensilsCrossed } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";

interface WelcomeScreenProps {
  onPick: (role: "monitor" | "kitchen") => void;
}

export function WelcomeScreen({ onPick }: WelcomeScreenProps) {
  return (
    <div className="relative flex min-h-screen flex-col bg-gradient-to-b from-background via-background to-accent/30">
      {/* Тема — в углу */}
      <div className="mx-auto flex w-full max-w-6xl justify-end px-4 pt-5 sm:px-6">
        <ThemeToggle />
      </div>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-4 py-12 text-center sm:px-6">
        {/* Логотип */}
        <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-primary shadow-xl shadow-primary/30">
          <UtensilsCrossed className="h-10 w-10 text-primary-foreground" aria-hidden />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">ОбедКласс</h1>
        <p className="mt-2 max-w-md text-sm font-semibold text-muted-foreground sm:text-base">
          Онлайн-заказы еды для школьной столовой.
          <br />
          Кто вы сегодня?
        </p>

        {/* Выбор роли */}
        <div className="mt-8 grid w-full gap-4 sm:grid-cols-2">
          <RoleCard
            onClick={() => onPick("monitor")}
            icon={<UserCheck className="h-7 w-7" aria-hidden />}
            iconCls="bg-primary/12 text-primary"
            title="Я староста"
            description="Выберу свой класс, отмечу учеников на завтрак и обед и отправлю заказ в столовую"
            accent="border-primary/40 hover:border-primary hover:shadow-lg hover:shadow-primary/10"
          />
          <RoleCard
            onClick={() => onPick("kitchen")}
            icon={<ChefHat className="h-7 w-7" aria-hidden />}
            iconCls="bg-success/12 text-success"
            title="Я из столовой"
            description="Посмотрю сводку заказов по всей школе: сколько завтраков и обедов готовить"
            accent="border-success/40 hover:border-success hover:shadow-lg hover:shadow-success/10"
          />
        </div>

        <p className="mt-6 text-xs font-bold text-muted-foreground">
          Староста при первом входе придумывает код-пароль из 6 цифр — чтобы заказ мог менять только он
        </p>
      </main>

      <footer className="pb-6 text-center text-xs font-semibold text-muted-foreground">
        ОбедКласс — макет визуального дизайна. Данные демонстрационные.
      </footer>
    </div>
  );
}

function RoleCard({
  onClick,
  icon,
  iconCls,
  title,
  description,
  accent,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  iconCls: string;
  title: string;
  description: string;
  accent: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex min-h-[44px] flex-col items-center gap-3 rounded-2xl border-2 bg-card p-6 text-center shadow-sm transition-all ${accent}`}
    >
      <span className={`flex h-14 w-14 items-center justify-center rounded-2xl ${iconCls}`} aria-hidden>
        {icon}
      </span>
      <span className="text-lg font-extrabold">{title}</span>
      <span className="text-sm font-semibold text-muted-foreground">{description}</span>
      <span className="mt-1 inline-flex items-center gap-1 text-sm font-extrabold text-primary">
        Далее
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
      </span>
    </button>
  );
}
