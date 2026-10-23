"use client";

import * as React from "react";
import { useState } from "react";
import {
  ArrowLeft,
  Check,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
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

type Mode = "idle" | "checking" | "create" | "login";

export function StarostaSetup({ sentKeys, onBack, onComplete }: StarostaSetupProps) {
  const [classKey, setClassKey] = useState("");
  const [mode, setMode] = useState<Mode>("idle");
  const [pin, setPin] = useState("");
  const [pin2, setPin2] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const tooShort = pin.length > 0 && pin.length < 6;
  const mismatch = pin2.length === 6 && pin !== pin2;
  const cls = classKey ? getClass(classKey) : null;

  const canSubmit =
    !busy && classKey !== "" && (mode === "login" ? pin.length === 6 : pin.length === 6 && pin === pin2);

  async function pickClass(key: string) {
    setClassKey(key);
    setPin("");
    setPin2("");
    setError("");
    setMode("checking");
    try {
      const res = await fetch(`/api/auth/status?classId=${encodeURIComponent(key)}`);
      if (!res.ok) throw new Error("status");
      const data = (await res.json()) as { registered?: boolean };
      setMode(data.registered ? "login" : "create");
    } catch {
      setMode("idle");
      setError("Не удалось проверить класс. Попробуйте выбрать его ещё раз.");
    }
  }

  async function submit() {
    if (!canSubmit || !cls) return;
    setBusy(true);
    setError("");
    try {
      if (mode === "create") {
        const res = await fetch("/api/auth/setup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ classId: classKey, pin }),
        });
        if (res.status === 409) {
          setMode("login");
          setPin("");
          setPin2("");
          setError("Код для этого класса уже создан — введите его, чтобы войти");
          return;
        }
        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as { error?: string };
          setError(data.error ?? "Не получилось создать код. Попробуйте ещё раз.");
          return;
        }
        onComplete(classKey);
      } else {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ classId: classKey, pin }),
        });
        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as { error?: string };
          setError(data.error ?? "Неверный код");
          return;
        }
        onComplete(classKey);
      }
    } catch {
      setError("Сервер не отвечает. Проверьте связь и попробуйте ещё раз.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-extrabold tracking-tight sm:text-2xl">
            <UserCheck className="h-6 w-6 text-primary" aria-hidden />
            Вход для старосты
          </h2>
          <p className="mt-1 max-w-2xl text-sm font-medium text-muted-foreground sm:text-base">
            Выберите свой класс. Если код ещё не создан — придумайте его, он сохранится
            на сервере и станет паролем класса.
          </p>
        </div>
        <Button
          variant="ghost"
          onClick={onBack}
          className="min-h-[44px] rounded-md text-sm font-bold text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Назад
        </Button>
      </div>

      <ClassPicker selected={classKey || "5А"} sentKeys={sentKeys} onSelect={pickClass} />

      <section
        aria-label={mode === "login" ? "Введите код класса" : "Придумайте код-пароль"}
        className="rounded-lg border border-border bg-card p-4 sm:p-6"
      >
        {mode === "login" ? (
          <>
            <h3 className="flex items-center gap-2 text-base font-extrabold sm:text-lg">
              <KeyRound className="h-5 w-5 text-primary" aria-hidden />
              Введите код класса
            </h3>
            <p className="mt-1 text-xs font-medium text-muted-foreground sm:text-sm">
              6 цифр, которые придумал староста {cls ? cls.key : ""} при регистрации.
              Код хранится на сервере в зашифрованном виде.
            </p>

            <div className="mt-4 max-w-sm space-y-2">
              <div className="flex min-h-[32px] items-center justify-between">
                <span className="text-xs font-extrabold text-muted-foreground">Код класса</span>
                <button
                  type="button"
                  onClick={() => setShowPin((v) => !v)}
                  className="inline-flex min-h-[32px] items-center gap-1 rounded-md px-2 text-xs font-bold text-muted-foreground hover:text-foreground"
                >
                  {showPin ? <EyeOff className="h-3.5 w-3.5" aria-hidden /> : <Eye className="h-3.5 w-3.5" aria-hidden />}
                  {showPin ? "Скрыть" : "Показать"}
                </button>
              </div>
              <InputOTP
                maxLength={6}
                pattern={REGEXP_ONLY_DIGITS}
                value={pin}
                onChange={(v) => {
                  setPin(v);
                  setError("");
                }}
                autoFocus
              >
                <InputOTPGroup className="gap-1.5">
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <PinSlot key={i} index={i} masked={!showPin} invalid={Boolean(error) || tooShort} />
                  ))}
                </InputOTPGroup>
              </InputOTP>
              {error ? (
                <p className="text-xs font-bold text-destructive">{error}</p>
              ) : (
                tooShort && <p className="text-xs font-bold text-destructive">Введите все 6 цифр</p>
              )}
            </div>
          </>
        ) : (
          <>
            <h3 className="flex items-center gap-2 text-base font-extrabold sm:text-lg">
              <KeyRound className="h-5 w-5 text-primary" aria-hidden />
              Придумайте код-пароль класса
            </h3>
            <p className="mt-1 text-xs font-medium text-muted-foreground sm:text-sm">
              6 цифр, как PIN-код на телефоне. Код сохранится на сервере в зашифрованном
              виде — запишите его, чтобы войти завтра.
            </p>

            <div className="mt-4 grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <div className="flex min-h-[32px] items-center justify-between">
                  <span className="text-xs font-extrabold text-muted-foreground">
                    Код-пароль
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowPin((v) => !v)}
                    className="inline-flex min-h-[32px] items-center gap-1 rounded-md px-2 text-xs font-bold text-muted-foreground hover:text-foreground"
                  >
                    {showPin ? <EyeOff className="h-3.5 w-3.5" aria-hidden /> : <Eye className="h-3.5 w-3.5" aria-hidden />}
                    {showPin ? "Скрыть" : "Показать"}
                  </button>
                </div>
                <InputOTP
                  maxLength={6}
                  pattern={REGEXP_ONLY_DIGITS}
                  value={pin}
                  onChange={(v) => {
                    setPin(v);
                    setError("");
                  }}
                  autoFocus
                >
                  <InputOTPGroup className="gap-1.5">
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                      <PinSlot key={i} index={i} masked={!showPin} invalid={tooShort || mismatch || Boolean(error)} />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
                {tooShort && (
                  <p className="text-xs font-bold text-destructive">Введите все 6 цифр</p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex min-h-[32px] items-center">
                  <span className="text-xs font-extrabold text-muted-foreground">
                    Повторите код
                  </span>
                </div>
                <InputOTP
                  maxLength={6}
                  pattern={REGEXP_ONLY_DIGITS}
                  value={pin2}
                  onChange={(v) => {
                    setPin2(v);
                    setError("");
                  }}
                >
                  <InputOTPGroup className="gap-1.5">
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                      <PinSlot key={i} index={i} masked={!showPin} invalid={mismatch || Boolean(error)} />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
                {mismatch ? (
                  <p className="text-xs font-bold text-destructive">Коды не совпадают</p>
                ) : (
                  pin.length === 6 && pin2.length === 6 && pin === pin2 && (
                    <p className="flex items-center gap-1 text-xs font-bold text-primary">
                      <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden />
                      Коды совпадают
                    </p>
                  )
                )}
              </div>
            </div>
          </>
        )}

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
          <p className="text-xs font-bold text-muted-foreground">
            {mode === "checking" ? (
              <span className="inline-flex items-center gap-1.5">
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                Проверяем класс…
              </span>
            ) : cls ? (
              mode === "login" ? (
                <>
                  Вход как староста <span className="text-foreground">{cls.key}</span>, в классе{" "}
                  {cls.students.length} учеников
                </>
              ) : (
                <>
                  Регистрация класса <span className="text-foreground">{cls.key}</span>, в классе{" "}
                  {cls.students.length} учеников
                </>
              )
            ) : (
              "Сначала выберите класс"
            )}
          </p>
          <Button
            size="lg"
            onClick={submit}
            disabled={!canSubmit}
            className="min-h-[48px] rounded-md px-6 text-base font-extrabold"
          >
            {busy ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                {mode === "login" ? "Входим…" : "Создаём код…"}
              </>
            ) : (
              <>
                <UserCheck className="h-5 w-5" aria-hidden />
                {mode === "login" ? (
                  <>Войти как староста{cls ? ` ${cls.key}` : ""}</>
                ) : (
                  <>Создать код и войти{cls ? ` ${cls.key}` : ""}</>
                )}
              </>
            )}
          </Button>
        </div>
      </section>

      <p className="px-1 text-xs font-medium text-muted-foreground">
        Заказ класса может менять только тот, кто знает его код. Забыли код —
        попросите учителя сбросить его в базе столовой.
      </p>
    </div>
  );
}

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
        "data-[active=true]:border-ring data-[active=true]:ring-ring/40 relative flex h-12 w-10 items-center justify-center rounded-md border bg-card text-lg font-extrabold transition-all outline-none sm:h-14 sm:w-12 data-[active=true]:z-10 data-[active=true]:ring-[3px]",
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
