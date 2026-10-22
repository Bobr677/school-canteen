"use client";

import * as React from "react";
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
import { OTPInputContext, REGEXP_ONLY_DIGITS } from "input-otp";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup } from "@/components/ui/input-otp";
import { cn } from "@/lib/utils";
import { ClassPicker } from "./class-picker";
import { getClass } from "@/lib/school-data";

interface StarostaSetupProps {
  sentKeys: Set<string>;
  onBack: () => void;
  onComplete: (classKey: string) => void;
}

export function StarostaSetup({ sentKeys, onBack, onComplete }: StarostaSetupProps) {
  const [classKey, setClassKey] = useState("");
  const [pin, setPin] = useState("");
  const [pin2, setPin2] = useState("");
  const [showPin, setShowPin] = useState(false);

  const tooShort = pin.length > 0 && pin.length < 6;
  const mismatch = pin2.length === 6 && pin !== pin2;
  const matched = pin.length === 6 && pin2.length === 6 && pin === pin2;
  const canEnter = classKey !== "" && matched;
  const cls = classKey ? getClass(classKey) : null;

  function submit() {
    if (canEnter) onComplete(classKey);
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
            Выберите свой класс и придумайте код-пароль — в макете код никуда не сохраняется,
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

      {/* Код-пароль */}
      <section
        aria-label="Придумайте код-пароль"
        className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm sm:p-6"
      >
        <h3 className="flex items-center gap-2 text-base font-extrabold sm:text-lg">
          <KeyRound className="h-5 w-5 text-primary" aria-hidden />
          Придумайте код-пароль класса
        </h3>
        <p className="mt-1 text-xs font-semibold text-muted-foreground sm:text-sm">
          6 цифр, как PIN-код на телефоне. Код нужен, чтобы заказ мог менять только староста.
        </p>

        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          {/* Придумайте код */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground">
                Код-пароль
              </span>
              <button
                type="button"
                onClick={() => setShowPin((v) => !v)}
                className="inline-flex min-h-[32px] items-center gap-1 rounded-lg px-2 text-xs font-bold text-muted-foreground hover:text-foreground"
              >
                {showPin ? <EyeOff className="h-3.5 w-3.5" aria-hidden /> : <Eye className="h-3.5 w-3.5" aria-hidden />}
                {showPin ? "Скрыть" : "Показать"}
              </button>
            </div>
            <InputOTP
              maxLength={6}
              pattern={REGEXP_ONLY_DIGITS}
              value={pin}
              onChange={setPin}
              autoFocus
            >
              <InputOTPGroup className="gap-1.5">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <PinSlot key={i} index={i} masked={!showPin} invalid={tooShort || mismatch} />
                ))}
              </InputOTPGroup>
            </InputOTP>
            {tooShort && (
              <p className="text-xs font-bold text-destructive">Введите все 6 цифр</p>
            )}
          </div>

          {/* Повторите код */}
          <div className="space-y-2">
            <span className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground">
              Повторите код
            </span>
            <InputOTP
              maxLength={6}
              pattern={REGEXP_ONLY_DIGITS}
              value={pin2}
              onChange={setPin2}
            >
              <InputOTPGroup className="gap-1.5">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <PinSlot key={i} index={i} masked={!showPin} invalid={mismatch} />
                ))}
              </InputOTPGroup>
            </InputOTP>
            {mismatch ? (
              <p className="text-xs font-bold text-destructive">Коды не совпадают</p>
            ) : (
              matched && (
                <p className="flex items-center gap-1 text-xs font-bold text-success">
                  <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden />
                  Коды совпадают
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
        Это макет: код не отправляется на сервер и не сохраняется. В будущем здесь будет
        настоящая регистрация старосты.
      </p>
    </div>
  );
}

/** Слот PIN-кода: отдельный квадратик, опционально скрывает цифру точкой */
function PinSlot({
  index,
  masked,
  invalid,
}: {
  index: number;
  masked: boolean;
  invalid: boolean;
}) {
  const ctx = React.useContext(OTPInputContext);
  const { char, hasFakeCaret, isActive } = ctx?.slots[index] ?? {};

  return (
    <div
      data-slot="pin-slot"
      data-active={isActive}
      data-invalid={invalid}
      className={cn(
        "data-[active=true]:border-ring data-[active=true]:ring-ring/50 relative flex h-12 w-10 items-center justify-center rounded-xl border bg-card text-lg font-extrabold shadow-xs transition-all outline-none sm:h-14 sm:w-12 data-[active=true]:z-10 data-[active=true]:ring-[3px]",
        "data-[invalid=true]:border-destructive data-[invalid=true]:text-destructive",
        "data-[active=true]:data-[invalid=true]:ring-destructive/20",
      )}
    >
      {masked && char ? "\u2022" : char}
      {hasFakeCaret && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="animate-caret-blink bg-foreground h-4 w-px duration-1000" />
        </div>
      )}
    </div>
  );
}
