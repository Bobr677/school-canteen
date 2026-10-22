"use client";

import { ChefHat, Sparkles, UserCheck, UtensilsCrossed } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";

export type Role = "monitor" | "kitchen";

interface HeaderProps {
  role: Role;
  onRoleChange: (role: Role) => void;
}

export function Header({ role, onRoleChange }: HeaderProps) {
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

        {/* Переключатель роли */}
        <div className="flex items-center gap-2">
          <div
            role="tablist"
            aria-label="Режим работы"
            className="flex items-center gap-1 rounded-2xl border border-border/70 bg-secondary p-1"
          >
            <RoleButton
              active={role === "monitor"}
              onClick={() => onRoleChange("monitor")}
              icon={<UserCheck className="h-4 w-4" aria-hidden />}
              label="Староста"
            />
            <RoleButton
              active={role === "kitchen"}
              onClick={() => onRoleChange("kitchen")}
              icon={<ChefHat className="h-4 w-4" aria-hidden />}
              label="Столовая"
            />
          </div>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

function RoleButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      aria-label={label}
      onClick={onClick}
      className={`inline-flex min-h-[40px] items-center gap-1.5 rounded-xl px-3 text-sm font-bold transition-all sm:px-4 ${
        active
          ? "bg-card text-foreground shadow-md shadow-black/5 ring-1 ring-border"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
