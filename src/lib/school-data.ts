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

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(arr: T[], rand: () => number): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const BOY_NAMES = [
  "Александр", "Максим", "Иван", "Артём", "Дмитрий", "Никита", "Кирилл",
  "Роман", "Егор", "Данил", "Тимофей", "Марк", "Лев", "Пётр", "Семён",
];

const GIRL_NAMES = [
  "Анастасия", "Мария", "Дарья", "Анна", "Виктория", "София", "Елизавета",
  "Полина", "Екатерина", "Ксения", "Алиса", "Вера", "Милана", "Арина", "Ульяна",
];

const SURNAMES = [
  "Смирнов", "Иванов", "Кузнецов", "Попов", "Соколов", "Лебедев", "Козлов",
  "Новиков", "Морозов", "Петров", "Волков", "Соловьёв", "Васильев", "Зайцев",
  "Павлов", "Семёнов", "Голубев", "Виноградов", "Богданов", "Воробьёв",
  "Фёдоров", "Михайлов", "Беляев", "Тарасов", "Белов",
];

function feminize(surname: string): string {
  if (surname.endsWith("ой") || surname.endsWith("ых") || surname.endsWith("их")) return surname;
  return surname + "а";
}

interface Person {
  name: string;
  female: boolean;
}

const PERSON_POOL: Person[] = (() => {
  const pool: Person[] = [];
  for (const surname of SURNAMES) {
    for (const maleName of BOY_NAMES.slice(0, 3)) {
      pool.push({ name: `${surname} ${maleName}`, female: false });
    }
    for (const femaleName of GIRL_NAMES.slice(0, 3)) {
      pool.push({ name: `${feminize(surname)} ${femaleName}`, female: true });
    }
  }
  return pool;
})();

function classSeed(grade: number, letterIndex: number): number {
  return grade * 7919 + letterIndex * 104729 + 17;
}

function generateStudents(grade: number, letterIndex: number): Student[] {
  const rand = mulberry32(classSeed(grade, letterIndex));
  const count = 14 + Math.floor(rand() * 9);
  const pool = shuffle(PERSON_POOL, rand).slice(0, count);
  return pool.map((p, i) => ({
    id: i + 1,
    name: p.name,
    isMonitor: i === 0,
  }));
}

export const ALL_CLASSES: ClassInfo[] = GRADES.flatMap((grade) =>
  LETTERS.map((letter, letterIndex) => ({
    key: `${grade}${letter}`,
    grade,
    letter,
    students: generateStudents(grade, letterIndex),
  })),
);

export function getClass(key: string): ClassInfo {
  return ALL_CLASSES.find((c) => c.key === key) ?? ALL_CLASSES[0];
}

export function initialOrders(): Record<string, ClassOrder> {
  const orders: Record<string, ClassOrder> = {};
  for (const cls of ALL_CLASSES) {
    const rand = mulberry32(classSeed(cls.grade, LETTERS.indexOf(cls.letter as (typeof LETTERS)[number])) + 999);
    const sent = rand() < 0.42;
    const meals: Record<number, MealState> = {};
    if (sent) {
      for (const s of cls.students) {
        meals[s.id] = {
          breakfast: rand() < 0.55,
          lunch: rand() < 0.75,
        };
      }
    }
    orders[cls.key] = {
      meals,
      sent,
      sentAt: sent
        ? `0${7 + Math.floor(rand() * 2)}:${String(Math.floor(rand() * 60)).padStart(2, "0")}`
        : undefined,
    };
  }
  return orders;
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
