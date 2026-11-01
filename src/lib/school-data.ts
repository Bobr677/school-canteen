export interface Student {
  id: number;
  name: string;
  isMonitor: boolean;
}

export interface ClassInfo {
  key: string;
  grade: number;
  letter: string;
  students: Student[];
}

export interface MealState {
  breakfast: boolean;
  lunch: boolean;
}

export interface ClassOrder {
  meals: Record<number, MealState>;
  sent: boolean;
  sentAt?: string;
}

export const GRADES = [5, 6, 7, 8, 9, 10, 11] as const;
export const LETTERS = ["А", "Б", "В", "Г", "Д"] as const;

const CLASS_KEYS = new Set<string>(
  GRADES.flatMap((grade) => LETTERS.map((letter) => `${grade}${letter}`)),
);

export function isValidClassKey(key: string): boolean {
  return CLASS_KEYS.has(key);
}

export const MIN_STUDENTS = 20;
export const MAX_STUDENTS = 35;

export function todayKey(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Moscow",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function formatMoscowTime(date: Date): string {
  return new Intl.DateTimeFormat("ru-RU", {
    timeZone: "Europe/Moscow",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export const ALL_CLASSES: ClassInfo[] = GRADES.flatMap((grade) =>
  LETTERS.map((letter) => ({
    key: `${grade}${letter}`,
    grade,
    letter,
    students: [],
  })),
);

export function getClassInfo(key: string): ClassInfo {
  const keyNorm = CLASS_KEYS.has(key) ? key : "5А";
  return {
    key: keyNorm,
    grade: Number(keyNorm.slice(0, -1)),
    letter: keyNorm.slice(-1),
    students: [],
  };
}

export function rosterToStudents(names: string[]): Student[] {
  return names.map((name, i) => ({ id: i + 1, name, isMonitor: i === 0 }));
}

export function countMeals(order: ClassOrder): { breakfast: number; lunch: number } {
  let breakfast = 0;
  let lunch = 0;
  for (const m of Object.values(order.meals)) {
    if (m.breakfast) breakfast++;
    if (m.lunch) lunch++;
  }
  return { breakfast, lunch };
}
