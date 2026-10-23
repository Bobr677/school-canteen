"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Header, type Role } from "@/components/canteen/header";
import { WelcomeScreen } from "@/components/canteen/welcome-screen";
import { StarostaSetup } from "@/components/canteen/starosta-setup";
import { StudentList } from "@/components/canteen/student-list";
import { KitchenDashboard } from "@/components/canteen/kitchen-dashboard";
import {
  countMeals,
  getClass,
  todayKey,
  type ClassOrder,
  type MealState,
} from "@/lib/school-data";

type Screen = "welcome" | "setup" | "monitor" | "kitchen";
type SaveState = "idle" | "saving" | "saved" | "error";

interface MarkJson {
  name: string;
  breakfast: boolean;
  lunch: boolean;
}

interface OrderJson {
  classId: string;
  sent: boolean;
  sentAt?: string;
  marks: MarkJson[];
}

function ordersFromServer(rows: OrderJson[]): Record<string, ClassOrder> {
  const out: Record<string, ClassOrder> = {};
  for (const row of rows) {
    const cls = getClass(row.classId);
    const meals: Record<number, MealState> = {};
    for (const m of row.marks) {
      const student = cls.students.find((s) => s.name === m.name);
      if (student) meals[student.id] = { breakfast: m.breakfast, lunch: m.lunch };
    }
    out[row.classId] = { meals, sent: row.sent, sentAt: row.sentAt };
  }
  return out;
}

export default function Home() {
  const [screen, setScreen] = useState<Screen>("welcome");
  const [role, setRole] = useState<Role>("monitor");
  const [selectedClass, setSelectedClass] = useState("5А");
  const [orders, setOrders] = useState<Record<string, ClassOrder>>({});
  const [booted, setBooted] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ordersRef = useRef<Record<string, ClassOrder>>({});

  const applyOrders = useCallback(
    (updater: (prev: Record<string, ClassOrder>) => Record<string, ClassOrder>) => {
      ordersRef.current = updater(ordersRef.current);
      setOrders(ordersRef.current);
    },
    [],
  );

  const cls = useMemo(() => getClass(selectedClass), [selectedClass]);
  const order = orders[selectedClass] ?? { meals: {}, sent: false };

  const sentKeys = useMemo(
    () => new Set(Object.entries(orders).filter(([, o]) => o.sent).map(([k]) => k)),
    [orders],
  );

  const loadOrders = useCallback(async () => {
    try {
      const res = await fetch(`/api/orders?date=${todayKey()}`);
      if (!res.ok) return;
      const data = (await res.json()) as { orders?: OrderJson[] };
      const loaded = ordersFromServer(data.orders ?? []);
      applyOrders((prev) => {
        const next = { ...prev };
        for (const key of Object.keys(loaded)) next[key] = loaded[key];
        return next;
      });
    } catch {
      return;
    }
  }, [applyOrders]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [sessionRes, ordersRes] = await Promise.all([
          fetch("/api/auth/session"),
          fetch(`/api/orders?date=${todayKey()}`),
        ]);
        const session = (await sessionRes.json()) as { classId?: string | null };
        const data = (await ordersRes.json()) as { orders?: OrderJson[] };
        if (cancelled) return;
        ordersRef.current = ordersFromServer(data.orders ?? []);
        setOrders(ordersRef.current);
        if (session.classId) {
          setSelectedClass(session.classId);
          setRole("monitor");
          setScreen("monitor");
        }
      } catch {
        if (!cancelled) setOrders({});
      } finally {
        if (!cancelled) setBooted(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (screen !== "kitchen") return;
    void loadOrders();
    const timer = setInterval(() => void loadOrders(), 15000);
    return () => clearInterval(timer);
  }, [screen, loadOrders]);

  const saveOrder = useCallback(async (classKey: string, next: ClassOrder) => {
    setSaveState("saving");
    try {
      const roster = getClass(classKey).students;
      const marks = roster.map((s) => ({
        name: s.name,
        breakfast: next.meals[s.id]?.breakfast ?? false,
        lunch: next.meals[s.id]?.lunch ?? false,
      }));
      const res = await fetch("/api/orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ marks, sent: next.sent }),
      });
      if (!res.ok) throw new Error(`status ${res.status}`);
      const data = (await res.json()) as { order?: OrderJson };
      if (data.order) {
        const merged = ordersFromServer([data.order]);
        if (merged[classKey]) {
          applyOrders((prev) => ({ ...prev, [classKey]: merged[classKey] }));
        }
      }
      setSaveState("saved");
      setTimeout(() => setSaveState((s) => (s === "saved" ? "idle" : s)), 2500);
    } catch {
      setSaveState("error");
    }
  }, [applyOrders]);

  const scheduleSave = useCallback(
    (classKey: string, next: ClassOrder) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => void saveOrder(classKey, next), 800);
    },
    [saveOrder],
  );

  function cancelPendingSave() {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = null;
  }

  function toggleMeal(studentId: number, meal: keyof MealState) {
    const cur = ordersRef.current[selectedClass] ?? { meals: {}, sent: false };
    const next: ClassOrder = {
      ...cur,
      sent: false,
      meals: {
        ...cur.meals,
        [studentId]: {
          ...cur.meals[studentId],
          [meal]: !cur.meals[studentId]?.[meal],
        },
      },
    };
    applyOrders((prev) => ({ ...prev, [selectedClass]: next }));
    scheduleSave(selectedClass, next);
  }

  function setAll(meal: "breakfast" | "lunch" | "none") {
    const cur = ordersRef.current[selectedClass] ?? { meals: {}, sent: false };
    const meals: Record<number, MealState> = {};
    for (const s of cls.students) {
      const m = cur.meals[s.id] ?? { breakfast: false, lunch: false };
      meals[s.id] =
        meal === "none"
          ? { breakfast: false, lunch: false }
          : {
              breakfast: meal === "breakfast" ? true : m.breakfast,
              lunch: meal === "lunch" ? true : m.lunch,
            };
    }
    const next: ClassOrder = { ...cur, sent: false, meals };
    applyOrders((prev) => ({ ...prev, [selectedClass]: next }));
    scheduleSave(selectedClass, next);
    if (meal !== "none") {
      toast({
        title: meal === "breakfast" ? "Завтрак отмечен всем" : "Обед отмечен всем",
        description: `Класс ${cls.key}: каждый ученик получит ${meal === "breakfast" ? "завтрак" : "обед"}.`,
      });
    }
  }

  async function sendOrder() {
    cancelPendingSave();
    const next: ClassOrder = { ...order, sent: true };
    applyOrders((prev) => ({ ...prev, [selectedClass]: next }));
    await saveOrder(selectedClass, next);
    const { breakfast, lunch } = countMeals(next);
    toast({
      title: `Заказ ${cls.key} отправлен в столовую`,
      description: `Завтраков: ${breakfast}, обедов: ${lunch}. Повара уже видят заявку.`,
    });
  }

  async function editOrder() {
    cancelPendingSave();
    const next: ClassOrder = { meals: ordersRef.current[selectedClass]?.meals ?? {}, sent: false, sentAt: undefined };
    applyOrders((prev) => ({ ...prev, [selectedClass]: next }));
    await saveOrder(selectedClass, next);
    toast({
      title: `Заказ ${cls.key} снова открыт для правок`,
      description: "Внесите изменения и отправьте в столовую повторно.",
    });
  }

  async function handleLogin(classKey: string) {
    setSelectedClass(classKey);
    setRole("monitor");
    setScreen("monitor");
    await loadOrders();
    toast({
      title: `Вы вошли как староста ${classKey}`,
      description: "Отметьте завтраки и обеды и отправьте заказ в столовую.",
    });
  }

  async function logout() {
    cancelPendingSave();
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      return;
    }
    setScreen("welcome");
    toast({
      title: "Вы вышли из аккаунта",
      description: "Выберите роль заново: староста или столовая.",
    });
  }

  if (!booted) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="font-hand text-2xl font-bold text-muted-foreground">открываем журнал…</p>
      </div>
    );
  }

  if (screen === "welcome") {
    return (
      <WelcomeScreen
        onPick={(picked) => {
          if (picked === "monitor") {
            setRole("monitor");
            setScreen("setup");
          } else {
            setRole("kitchen");
            setScreen("kitchen");
          }
        }}
      />
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header role={role} classKey={screen === "monitor" ? selectedClass : undefined} onLogout={logout} />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        {screen === "setup" && (
          <StarostaSetup sentKeys={sentKeys} onBack={() => setScreen("welcome")} onComplete={handleLogin} />
        )}

        {screen === "monitor" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-extrabold tracking-tight sm:text-2xl">
                Добрый день, староста {cls.key} класса!
              </h2>
              <p className="mt-1 max-w-2xl text-sm font-medium text-muted-foreground sm:text-base">
                Отметьте, кто идёт на завтрак и обед, и отправьте заказ в столовую
                одним нажатием. Отметки сохраняются автоматически.
              </p>
            </div>

            <StudentList
              cls={cls}
              order={order}
              saveState={saveState}
              onToggle={toggleMeal}
              onSetAll={setAll}
              onSend={sendOrder}
              onEdit={editOrder}
            />
          </div>
        )}

        {screen === "kitchen" && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-extrabold tracking-tight sm:text-2xl">
                  Экран столовой
                </h2>
                <p className="mt-1 max-w-2xl text-sm font-medium text-muted-foreground sm:text-base">
                  Сколько готовить на сегодня: сводка заказов по всем классам школы.
                  Обновляется сама каждые 15 секунд.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void loadOrders()}
                className="min-h-[36px] rounded-md font-bold"
              >
                <RefreshCw className="h-4 w-4" aria-hidden />
                Обновить
              </Button>
            </div>
            <KitchenDashboard orders={orders} />
          </div>
        )}
      </main>

      <footer className="mt-auto border-t border-border bg-card/70">
        <div className="mx-auto w-full max-w-5xl px-4 py-4 text-xs font-medium text-muted-foreground sm:px-6">
          ОбедКласс — заказы и коды классов хранятся на сервере. Классы с 5 по 11,
          буквы от А до Д.
        </div>
      </footer>
    </div>
  );
}
