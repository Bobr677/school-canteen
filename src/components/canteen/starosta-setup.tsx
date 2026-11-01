"use client";

import * as React from "react";
import { useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Minus,
  Plus,
  UserCheck,
  Users,
} from "lucide-react";
import { OTPInputContext, REGEXP_ONLY_DIGITS } from "input-otp";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup } from "@/components/ui/input-otp";
import { cn } from "@/lib/utils";
import { ClassPicker } from "./class-picker";
import { getClassInfo, MAX_STUDENTS, MIN_STUDENTS } from "@/lib/school-data";

interface StarostaSetupProps {
  sentKeys: Set<string>;
  onBack: () => void;
  onComplete: (classKey: string) => void;
}

type Mode = "idle" | "checking" | "create" | "login";
type CreateStep = "pin" | "roster";

const NAME_RE = /^[А-ЯЁ][а-яё]+(?:-[А-ЯЁ][а-яё]+)?( [А-ЯЁ][а-яё]+(?:-[А-ЯЁ][а-яё]+)?){1,2}$/;

function normalizeName(raw: string): string {
  return raw.replace(/\s+/g, " ").trim();
}

function isValidName(raw: string): boolean {
  return NAME_RE.test(normalizeName(raw));
}

export function StarostaSetup({ sentKeys, onBack, onComplete }: StarostaSetupProps) {
  const [classKey, setClassKey] = useState("");
  const [mode, setMode] = useState<Mode>("idle");
  const [createStep, setCreateStep] = useState<CreateStep>("pin");
  const [pin, setPin] = useState("");
  const [pin2, setPin2] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [count, setCount] = useState(MIN_STUDENTS);
  const [names, setNames] = useState<string[]>(() => Array(MIN_STUDENTS).fill(""));
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const nameRefs = useRef<Array<HTMLInputElement | null>>([]);

  const tooShort = pin.length > 0 && pin.length < 6;
  const mismatch = pin2.length === 6 && pin !== pin2;
  const cls = classKey ? getClassInfo(classKey) : null;

  const filled = names.map(normalizeName);
  const invalidRows = filled.map((n) => n !== "" && !isValidName(n));
  const invalidCount = invalidRows.filter(Boolean).length;
  const emptyCount = filled.filter((n) => n === "").length;

  const dupName = (() => {
    const seen = new Set<string>();
    for (const n of filled) {
      if (!isValidName(n)) continue;
      const key = n.toLowerCase();
      if (seen.has(key)) return n;
      seen.add(key);
    }
    return null;
  })();

  const pinReady = pin.length === 6 && pin === pin2;
  const rosterReady = count === names.length && invalidCount === 0 && emptyCount === 0 && !dupName;

  const canSubmit =
    !busy && classKey !== "" && (mode === "login" ? pin.length === 6 : pinReady && rosterReady);

  function changeCount(next: number) {
    const clamped = Math.min(MAX_STUDENTS, Math.max(MIN_STUDENTS, next));
    setCount(clamped);
    setNames((prev) => {
      if (clamped === prev.length) return prev;
      if (clamped < prev.length) return prev.slice(0, clamped);
      return [...prev, ...Array(clamped - prev.length).fill("")];
    });
    setError("");
  }

  function setName(index: number, value: string) {
    setNames((prev) => prev.map((v, i) => (i === index ? value : v)));
    setError("");
  }

  function focusName(index: number) {
    nameRefs.current[index]?.focus();
  }

  async function pickClass(key: string) {
    setClassKey(key);
    setPin("");
    setPin2("");
    setError("");
    setCreateStep("pin");
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
          body: JSON.stringify({
            classId: classKey,
            pin,
            students: filled.filter((n) => isValidName(n)),
          }),
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
          setError(data.error ?? "Не получилось зарегистрировать класс. Попробуйте ещё раз.");
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
            Выберите свой класс. Если код ещё не создан — придумайте его и впишите
            состав класса: сколько учеников и их фамилии с именами.
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
        aria-label={
          mode === "login"
            ? "Введите код класса"
            : mode === "create" && createStep === "roster"
              ? "Состав класса"
              : "Придумайте код-пароль"
        }
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
        ) : mode === "create" && createStep === "roster" ? (
          <>
            <h3 className="flex items-center gap-2 text-base font-extrabold sm:text-lg">
              <Users className="h-5 w-5 text-primary" aria-hidden />
              Состав класса {cls ? cls.key : ""}
            </h3>
            <p className="mt-1 text-xs font-medium text-muted-foreground sm:text-sm">
              Выберите, сколько учеников в классе, и впишите фамилию и имя каждого.
              Первый в списке — тот, кто регистрирует класс.
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Убрать ученика"
                  disabled={count <= MIN_STUDENTS}
                  onClick={() => changeCount(count - 1)}
                  className="h-11 w-11 rounded-md"
                >
                  <Minus className="h-4 w-4" aria-hidden />
                </Button>
                <span
                  aria-live="polite"
                  className="min-w-[3.5rem] text-center text-3xl font-black tabular-nums tracking-tight"
                >
                  {count}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Добавить ученика"
                  disabled={count >= MAX_STUDENTS}
                  onClick={() => changeCount(count + 1)}
                  className="h-11 w-11 rounded-md"
                >
                  <Plus className="h-4 w-4" aria-hidden />
                </Button>
              </div>
              <p className="text-xs font-bold text-muted-foreground sm:text-sm">
                учеников в классе — можно от {MIN_STUDENTS} до {MAX_STUDENTS}
              </p>
            </div>

            <ol className="nice-scroll mt-4 max-h-[28rem] divide-y divide-border overflow-y-auto rounded-md border border-border">
              {names.map((value, i) => {
                const invalid = invalidRows[i];
                return (
                  <li key={i} className="flex items-center gap-3 px-3 py-2 sm:px-4">
                    <span className="w-6 shrink-0 text-right text-xs font-semibold tabular-nums text-muted-foreground">
                      {i + 1}
                    </span>
                    <input
                      ref={(el) => {
                        nameRefs.current[i] = el;
                      }}
                      value={value}
                      onChange={(e) => setName(i, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          focusName(Math.min(i + 1, names.length - 1));
                        }
                      }}
                      placeholder="Фамилия Имя"
                      autoComplete="off"
                      aria-label={`Ученик ${i + 1}: фамилия и имя`}
                      data-invalid={invalid || undefined}
                      className={cn(
                        "h-11 w-full rounded-md border bg-background px-3 text-sm font-bold outline-none transition-colors placeholder:font-medium placeholder:text-muted-foreground/60 focus:border-ring focus:ring-2 focus:ring-ring/30 sm:text-[15px]",
                        invalid
                          ? "border-destructive text-destructive"
                          : "border-border text-foreground",
                      )}
                    />
                  </li>
                );
              })}
            </ol>

            <div className="mt-3 space-y-1.5">
              {invalidCount > 0 && (
                <p className="text-xs font-bold text-destructive">
                  Проверьте выделенные строки: формат — Фамилия Имя, например Иванов Артём.
                </p>
              )}
              {dupName && (
                <p className="text-xs font-bold text-destructive">
                  Ученик указан дважды: {dupName}.
                </p>
              )}
              {!invalidCount && !dupName && emptyCount > 0 && (
                <p className="text-xs font-bold text-muted-foreground">
                  Заполнено {count - emptyCount} из {count}. Осталось вписать: {emptyCount}.
                </p>
              )}
              {error && <p className="text-xs font-bold text-destructive">{error}</p>}
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
                  Вход как староста <span className="text-foreground">{cls.key}</span>
                </>
              ) : createStep === "roster" ? (
                <>
                  Регистрация класса <span className="text-foreground">{cls.key}</span>, учеников:{" "}
                  <span className="text-foreground">{count}</span>
                </>
              ) : (
                <>
                  Регистрация класса <span className="text-foreground">{cls.key}</span>, дальше
                  вписываем состав
                </>
              )
            ) : (
              "Сначала выберите класс"
            )}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {mode === "create" && createStep === "roster" && (
              <Button
                variant="outline"
                onClick={() => setCreateStep("pin")}
                disabled={busy}
                className="min-h-[48px] rounded-md px-4 text-sm font-extrabold"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden />
                К коду
              </Button>
            )}
            <Button
              size="lg"
              onClick={() => {
                if (mode === "create" && createStep === "pin") {
                  if (!pinReady) return;
                  setError("");
                  setCreateStep("roster");
                  setTimeout(() => focusName(0), 50);
                  return;
                }
                void submit();
              }}
              disabled={mode === "create" && createStep === "pin" ? !pinReady || busy : !canSubmit}
              className="min-h-[48px] rounded-md px-6 text-base font-extrabold"
            >
              {busy ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                  {mode === "login" ? "Входим…" : "Сохраняем…"}
                </>
              ) : mode === "login" ? (
                <>
                  <UserCheck className="h-5 w-5" aria-hidden />
                  Войти как староста{cls ? ` ${cls.key}` : ""}
                </>
              ) : createStep === "pin" ? (
                <>
                  Дальше: состав класса
                  <ArrowRight className="h-5 w-5" aria-hidden />
                </>
              ) : (
                <>
                  <UserCheck className="h-5 w-5" aria-hidden />
                  Сохранить и войти{cls ? ` ${cls.key}` : ""}
                </>
              )}
            </Button>
          </div>
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
