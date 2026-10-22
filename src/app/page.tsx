"use client";

import { useMemo, useState } from "react";
import { toast } from "@/hooks/use-toast";
import { Header, type Role } from "@/components/canteen/header";
import { WelcomeScreen } from "@/components/canteen/welcome-screen";
import { StarostaSetup } from "@/components/canteen/starosta-setup";
import { StudentList } from "@/components/canteen/student-list";
import { KitchenDashboard } from "@/components/canteen/kitchen-dashboard";
import {
  countMeals,
  getClass,
  initialOrders,
  type ClassOrder,
  type MealState,
} from "@/lib/school-data";

type Screen = "welcome" | "setup" | "monitor" | "kitchen";

export default function Home() {
  const [screen, setScreen] = useState<Screen>("welcome");
  const [role, setRole] = useState<Role>("monitor");
  const [selectedClass, setSelectedClass] = useState("5А");
  const [orders, setOrders] = useState<Record<string, ClassOrder>>(() => initialOrders());

  const cls = useMemo(() => getClass(selectedClass), [selectedClass]);
  const order = orders[selectedClass];

  const sentKeys = useMemo(
    () => new Set(Object.entries(orders).filter(([, o]) => o.sent).map(([k]) => k)),
    [orders],
  );

  function patchOrder(key: string, patch: (prev: ClassOrder) => ClassOrder) {
    setOrders((prev) => ({ ...prev, [key]: patch(prev[key]) }));
  }

  function toggleMeal(studentId: number, meal: keyof MealState) {
    patchOrder(selectedClass, (prev) => ({
      ...prev,
      sent: false,
      meals: {
        ...prev.meals,
        [studentId]: { ...prev.meals[studentId], [meal]: !prev.meals[studentId]?.[meal] },
      },
    }));
  }

  function setAll(meal: "breakfast" | "lunch" | "none") {
    patchOrder(selectedClass, (prev) => {
      const meals: Record<number, MealState> = {};
      for (const s of cls.students) {
        const cur = prev.meals[s.id] ?? { breakfast: false, lunch: false };
        meals[s.id] =
          meal === "none"
            ? { breakfast: false, lunch: false }
            : {
                breakfast: meal === "breakfast" ? true : cur.breakfast,
                lunch: meal === "lunch" ? true : cur.lunch,
              };
      }
      return { ...prev, sent: false, meals };
    });
    if (meal !== "none") {
      toast({
        title: meal === "breakfast" ? "🥐 Завтрак отмечен всем" : "🍲 Обед отмечен всем",
        description: `Класс ${cls.key}: каждый ученик получит ${meal === "breakfast" ? "завтрак" : "обед"}.`,
      });
    }
  }

  function sendOrder() {
    const { breakfast, lunch } = countMeals(order);
    const time = new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
    patchOrder(selectedClass, (prev) => ({ ...prev, sent: true, sentAt: time }));
    toast({
      title: `Заказ ${cls.key} отправлен в столовую 🎉`,
      description: `Завтраков: ${breakfast} · обедов: ${lunch}. Повара уже видят заявку.`,
    });
  }

  function editOrder() {
    patchOrder(selectedClass, (prev) => ({ ...prev, sent: false, sentAt: undefined }));
    toast({
      title: `Заказ ${cls.key} снова открыт для правок`,
      description: "Внесите изменения и отправьте в столовую повторно.",
    });
  }

  function handleLogin(classKey: string) {
    setSelectedClass(classKey);
    setRole("monitor");
    setScreen("monitor");
    toast({
      title: `Вы вошли как староста ${classKey} ✅`,
      description: "Отметьте завтраки и обеды и отправьте заказ в столовую.",
    });
  }

  function logout() {
    setScreen("welcome");
    toast({
      title: "Вы вышли из аккаунта",
      description: "Выберите роль заново: староста или столовая.",
    });
  }

  if (screen === "welcome") {
    return (
      <WelcomeScreen
        onPick={(picked) => {
          if (picked === "monitor") {
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
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-background via-background to-accent/30">
      <Header role={role} classKey={screen === "monitor" ? selectedClass : undefined} onLogout={logout} />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        {screen === "setup" && (
          <StarostaSetup sentKeys={sentKeys} onBack={() => setScreen("welcome")} onComplete={handleLogin} />
        )}

        {screen === "monitor" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-extrabold tracking-tight sm:text-2xl">
                Добрый день, староста {cls.key} класса! 👋
              </h2>
              <p className="mt-1 max-w-2xl text-sm font-semibold text-muted-foreground sm:text-base">
                Отметьте, кто идёт на завтрак и обед, и отправьте заказ в столовую одним нажатием.
              </p>
            </div>

            <StudentList
              cls={cls}
              order={order}
              onToggle={toggleMeal}
              onSetAll={setAll}
              onSend={sendOrder}
              onEdit={editOrder}
            />
          </div>
        )}

        {screen === "kitchen" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-extrabold tracking-tight sm:text-2xl">
                Экран столовой 👩‍🍳
              </h2>
              <p className="mt-1 max-w-2xl text-sm font-semibold text-muted-foreground sm:text-base">
                Сводка заказов по всей школе: сколько завтраков и обедов готовить на сегодня.
              </p>
            </div>
            <KitchenDashboard orders={orders} />
          </div>
        )}
      </main>

      <footer className="mt-auto border-t border-border/70 bg-card/60">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-4 text-xs font-semibold text-muted-foreground sm:px-6">
          <p>ОбедКласс — макет визуального дизайна. Данные демонстрационные.</p>
          <p>35 классов (5–11) · завтрак и обед · кнопка «Отправить в столовую»</p>
        </div>
      </footer>
    </div>
  );
}
