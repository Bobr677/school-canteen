"use client";

import {
  ChefHat,
  LogOut,
  Sparkles,
  UserCheck,
  UtensilsCrossed,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";

export type Role = "monitor" | "kitchen";

interface HeaderProps {
  role: Role;
  /** Класс старосты (показывается в бейдже) */
  classKey?: string;
  onLogout: () => void;
}

export function Header({ role, classKey, onLogout }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        {/* Логотип */}
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary shadow-md shadow-primary/30">
            <UtensilsCrossed className="h-6 w-6 text-primary-foreground" aria-hidden />
          </div>
          <div className="min-w-0 leading-tight">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-lg font-extrabold tracking-tight sm:text-xl">
                ОбедКласс
              </h1>
              <span className="hidden items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[11px] font-bold text-accent-foreground sm:inline-flex">
                <Sparkles className="h-3 w-3" aria-hidden />
                макет дизайна
              </span>
            </div>
            <p className="hidden truncate text-xs font-semibold text-muted-foreground sm:block">
              заказы еды для школьной столовой
            </p>
          </div>
        </div>

        {/* Текущая роль + выход */}
        <div className="flex items-center gap-2">
          {role === "monitor" ? (
            <span
              className="inline-flex items-center gap-1.5 rounded-full bg-primary/12 px-3 py-1.5 text-xs font-extrabold text-primary"
              title="Вы вошли как староста"
            >
              <UserCheck className="h-4 w-4" aria-hidden />
              <span className="hidden sm:inline">Староста</span>
              {classKey && <span>· {classKey}</span>}
            </span>
          ) : (
            <span
              className="inline-flex items-center gap-1.5 rounded-full bg-success/12 px-3 py-1.5 text-xs font-extrabold text-success"
              title="Вы вошли как сотрудник столовой"
            >
              <ChefHat className="h-4 w-4" aria-hidden />
              <span className="hidden sm:inline">Столовая</span>
            </span>
          )}
          <ThemeToggle />
          <Button
            variant="outline"
            size="sm"
            onClick={onLogout}
            aria-label="Выйти и сменить роль"
            className="min-h-[40px] rounded-xl border-border/80 bg-card font-bold shadow-sm"
          >
            <LogOut className="h-4 w-4" aria-hidden />
            <span className="hidden sm:inline">Выйти</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
