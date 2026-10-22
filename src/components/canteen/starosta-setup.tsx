"use client";

import { useState } from "react";
import {
  ArrowLeft,
  Check,
  Eye,
  EyeOff,
  Info,
  KeyRound,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ClassPicker } from "./class-picker";
import { getClass } from "@/lib/school-data";

interface StarostaSetupProps {
  sentKeys: Set<string>;
  onBack: () => void;
  onComplete: (classKey: string) => void;
}

export function StarostaSetup({ sentKeys, onBack, onComplete }: StarostaSetupProps) {
  const [classKey, setClassKey] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showPass2, setShowPass2] = useState(false);

  const tooShort = password.length > 0 && password.length < 4;
  const mismatch = password2.length > 0 && password !== password2;
  const canEnter = classKey !== "" && password.length >= 4 && password === password2;
  const cls = classKey ? getClass(classKey) : null;

  function submit() {
    if (classKey && canEnter) onComplete(classKey);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-extrabold tracking-tight sm:text-2xl">
            <UserCheck className="h-6 w-6 text-primary" aria-hidden />
            Вход для старосты
          </h2>
          <p className="mt-1 max-w-2xl text-sm font-semibold text-muted-foreground sm:text-base">
            Выберите свой класс и придумайте пароль — в макете пароль никуда не сохраняется,
            это просто дизайн.
          </p>
        </div>
        <Button
          variant="ghost"
          onClick={onBack}
          className="min-h-[44px] rounded-xl text-sm font-bold text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Назад
        </Button>
      </div>

      <ClassPicker selected={classKey || "5А"} sentKeys={sentKeys} onSelect={setClassKey} />

      {/* Пароль */}
      <section
        aria-label="Придумайте пароль"
        className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm sm:p-6"
      >
        <h3 className="flex items-center gap-2 text-base font-extrabold sm:text-lg">
          <KeyRound className="h-5 w-5 text-primary" aria-hidden />
          Придумайте пароль класса
        </h3>
        <p className="mt-1 text-xs font-semibold text-muted-foreground sm:text-sm">
          Пароль нужен, чтобы заказ мог менять только староста. Минимум 4 символа.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label
              htmlFor="new-password"
              className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground"
            >
              Пароль
            </label>
            <div className="relative">
              <Input
                id="new-password"
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Например: obed2026"
                autoComplete="new-password"
                className="min-h-[48px] rounded-xl pr-11 text-base font-bold"
                aria-invalid={tooShort}
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                aria-label={showPass ? "Скрыть пароль" : "Показать пароль"}
                className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                {showPass ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
              </button>
            </div>
            {tooShort && (
              <p className="text-xs font-bold text-destructive">Слишком короткий — минимум 4 символа</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="confirm-password"
              className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground"
            >
              Повторите пароль
            </label>
            <div className="relative">
              <Input
                id="confirm-password"
                type={showPass2 ? "text" : "password"}
                value={password2}
                onChange={(e) => setPassword2(e.target.value)}
                placeholder="Ещё раз"
                autoComplete="new-password"
                className="min-h-[48px] rounded-xl pr-11 text-base font-bold"
                aria-invalid={mismatch}
              />
              <button
                type="button"
                onClick={() => setShowPass2((v) => !v)}
                aria-label={showPass2 ? "Скрыть пароль" : "Показать пароль"}
                className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                {showPass2 ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
              </button>
            </div>
            {mismatch ? (
              <p className="text-xs font-bold text-destructive">Пароли не совпадают</p>
            ) : (
              password.length >= 4 && password === password2 && (
                <p className="flex items-center gap-1 text-xs font-bold text-success">
                  <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden />
                  Пароли совпадают
                </p>
              )
            )}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-5">
          <p className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-success" aria-hidden />
            {cls ? (
              <>
                Вход как староста <span className="text-foreground">{cls.key}</span> ·{" "}
                {cls.students.length} учеников
              </>
            ) : (
              "Сначала выберите класс"
            )}
          </p>
          <Button
            size="lg"
            onClick={submit}
            disabled={!canEnter}
            className="min-h-[48px] rounded-xl px-6 text-base font-extrabold shadow-md shadow-primary/30"
          >
            <UserCheck className="h-5 w-5" aria-hidden />
            Войти как староста{cls ? ` ${cls.key}` : ""}
          </Button>
        </div>
      </section>

      <p className="flex items-start gap-1.5 px-1 text-xs font-semibold text-muted-foreground">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
        Это макет: пароль не отправляется на сервер и не сохраняется. В будущем здесь будет
        настоящая регистрация старосты.
      </p>
    </div>
  );
}
