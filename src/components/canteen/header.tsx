"use client";

import { ChefHat, LogOut, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";

export type Role = "monitor" | "kitchen";

interface HeaderProps {
  role: Role;
  classKey?: string;
  onLogout: () => void;
}

export function Header({ role, classKey, onLogout }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/92 backdrop-blur-sm">
      <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary text-lg font-black text-primary-foreground"
            aria-hidden
          >
            О
          </div>
          <div className="min-w-0 leading-tight">
            <div className="flex items-baseline gap-2">
              <h1 className="truncate text-lg font-extrabold tracking-tight sm:text-xl">
                ОбедКласс
              </h1>
              <span className="hidden shrink-0 rounded border border-border px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground sm:inline">
                макет
              </span>
            </div>
            <p className="hidden font-hand text-base font-bold leading-none text-muted-foreground sm:block">
              завтраки и обеды
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {role === "monitor" ? (
            <span
              className="inline-flex min-h-[32px] items-center gap-1.5 rounded-md border border-primary/30 bg-accent px-2.5 text-xs font-extrabold text-primary"
              title="Вы вошли как староста"
            >
              <UserCheck className="h-4 w-4" aria-hidden />
              <span className="hidden sm:inline">Староста</span>
              {classKey && <span>{classKey}</span>}
            </span>
          ) : (
            <span
              className="inline-flex min-h-[32px] items-center gap-1.5 rounded-md border border-lunch/30 bg-lunch/10 px-2.5 text-xs font-extrabold text-lunch"
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
            className="min-h-[40px] rounded-md bg-card font-bold shadow-none"
          >
            <LogOut className="h-4 w-4" aria-hidden />
            <span className="hidden sm:inline">Выйти</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
