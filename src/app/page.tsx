"use client";

import { useMemo, useState } from "react";
import { toast } from "@/hooks/use-toast";
import { Header, type Role } from "@/components/canteen/header";
import { ClassPicker } from "@/components/canteen/class-picker";
import { StudentList } from "@/components/canteen/student-list";
import { KitchenDashboard } from "@/components/canteen/kitchen-dashboard";
import {
  countMeals,
  getClass,
  initialOrders,
  type ClassOrder,
  type MealState,
} from "@/lib/school-data";

export default function Home() {
  const [role, setRole] = useState<Role>("monitor");
  const [selectedClass, setSelectedClass] = useState("7Б");
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
        [studentId]: { ...prev.meals[studentId], breakfast: false, lunch: false, [meal]: !prev.meals[studentId]?.[meal] },
      },
    }));
  }

  function setAll(meal: "breakfast" | "lunch" | "none") {
    patchOrder(selectedClass, (prev) => {
      const meals: Record<number, MealState> = {};
      for (const s of cls.students) {
        meals[s.id] = {
          breakfast: meal === "breakfast",
          lunch: meal === "lunch",
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

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-background via-background to-accent/30">
      <Header role={role} onRoleChange={setRole} />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        {role === "monitor" ? (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-extrabold tracking-tight sm:text-2xl">
                Добрый день, староста! 👋
              </h2>
              <p className="mt-1 max-w-2xl text-sm font-semibold text-muted-foreground sm:text-base">
                Выберите свой класс, отметьте, кто идёт на завтрак и обед,
                и отправьте заказ в столовую одним нажатием.
              </p>
            </div>

            <ClassPicker selected={selectedClass} sentKeys={sentKeys} onSelect={setSelectedClass} />

            <StudentList
              cls={cls}
              order={order}
              onToggle={toggleMeal}
              onSetAll={setAll}
              onSend={sendOrder}
              onEdit={editOrder}
            />
          </div>
        ) : (
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
          <p>55 классов · завтрак и обед · кнопка «Отправить в столовую»</p>
        </div>
      </footer>
    </div>
  );
}
