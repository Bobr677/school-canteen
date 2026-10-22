"use client";

import { ChefHat, UserCheck } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";

interface WelcomeScreenProps {
  onPick: (role: "monitor" | "kitchen") => void;
}

export function WelcomeScreen({ onPick }: WelcomeScreenProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="mx-auto flex w-full max-w-5xl justify-end px-4 pt-5 sm:px-6">
        <ThemeToggle />
      </div>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-4 py-12 text-center sm:px-6">
        <p className="font-hand text-2xl font-bold text-lunch sm:text-3xl">
          кто сегодня ест?
        </p>
        <div className="relative mt-1 inline-block">
          <h1 className="text-5xl font-black tracking-tight sm:text-6xl">
            ОбедКласс
          </h1>
          <svg
            className="absolute -bottom-3 left-0 w-full text-lunch"
            viewBox="0 0 300 12"
            fill="none"
            aria-hidden
          >
            <path
              d="M4 8 C 70 2, 160 11, 296 5"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <p className="mt-7 max-w-md text-sm font-medium text-muted-foreground sm:text-base">
          Отметки завтраков и обедов для школьной столовой. Выберите, кто вы,
          и работайте со своим списком класса.
        </p>

        <div className="mt-9 grid w-full gap-4 text-left sm:grid-cols-2">
          <RoleCard
            onClick={() => onPick("monitor")}
            icon={<UserCheck className="h-5 w-5" aria-hidden />}
            title="Я староста"
            description="Выберу свой класс, отмечу учеников на завтрак и обед и отправлю заказ в столовую."
            note="нужен код из 6 цифр"
            tone="text-primary border-primary/35 hover:border-primary/70"
          />
          <RoleCard
            onClick={() => onPick("kitchen")}
            icon={<ChefHat className="h-5 w-5" aria-hidden />}
            title="Я из столовой"
            description="Посмотрю сводку по всей школе: сколько завтраков и обедов готовить на сегодня."
            note="без пароля"
            tone="text-lunch border-lunch/35 hover:border-lunch/70"
          />
        </div>

        <p className="mt-7 max-w-md text-xs font-medium text-muted-foreground">
          Классы с 5 по 11, буквы от А до Д — всего 35 журналов.
        </p>
      </main>

      <footer className="flex flex-col items-center gap-1.5 pb-7 text-center">
        <p className="font-hand text-xl font-bold text-foreground/75 sm:text-2xl">
          сделал Авдалян Макар, ученик 6 «В» класса
        </p>
        <p className="text-xs font-medium text-muted-foreground">
          ОбедКласс — макет визуального дизайна, данные демонстрационные.
        </p>
      </footer>
    </div>
  );
}

function RoleCard({
  onClick,
  icon,
  title,
  description,
  note,
  tone,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  description: string;
  note: string;
  tone: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`lift group flex min-h-[44px] flex-col gap-2 rounded-lg border bg-card p-5 text-left ${tone}`}
    >
      <span className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-md border border-inherit bg-background" aria-hidden>
          {icon}
        </span>
        <span className="text-lg font-extrabold text-foreground">{title}</span>
      </span>
      <span className="text-sm font-medium text-muted-foreground">{description}</span>
      <span className="mt-1 font-hand text-lg font-bold leading-none opacity-90">
        {note}
      </span>
    </button>
  );
}
