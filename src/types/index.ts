export type Priority = 'high' | 'medium' | 'low';
export type HabitFrequency = 'daily' | 'weekdays' | 'weekends' | 'custom';
export type HabitTimeOfDay = 'morning' | 'afternoon' | 'evening' | 'anytime';
export type HabitType = 'boolean' | 'count';
export type Urgency = 'today' | 'week' | 'month' | 'someday';
export type TaskMode = 'digital' | 'analog';
export type TaskLocation = 'anywhere' | 'home' | 'outside';
export type ProgressType = 'checkbox' | 'counter' | 'subtasks';
export type Language = 'de' | 'en' | 'es' | 'pt';
export type Theme = 'light' | 'dark';
export type Screen = 'today' | 'tasks' | 'projects' | 'habits' | 'review' | 'settings' | 'shopping' | 'einordnen';

export interface ShoppingItem {
  id: string;
  name: string;
  quantity?: string;
  isChecked: boolean;
  createdAt: string;
}

export interface Habit {
  id: string;
  name: string;
  icon: string;
  color: string;
  timeOfDay: HabitTimeOfDay;
  frequency: HabitFrequency;
  daysOfWeek?: number[];
  type: HabitType;
  targetCount?: number;
  unit?: string;
  order: number;
  createdAt: string;
  isArchived: boolean;
}

export interface HabitLog {
  date: string;
  habitId: string;
  done: boolean;
  count: number;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  order: number;
}

export interface Project {
  id: string;
  categoryId: string;
  name: string;
  description?: string;
  isArchived: boolean;
  createdAt: string;
}

export interface SubTask {
  id: string;
  title: string;
  isCompleted: boolean;
  completedAt?: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  categoryId: string;
  projectId?: string;
  priority: Priority;
  urgency: Urgency;
  mode: TaskMode;
  location: TaskLocation;
  dueDate?: string;
  address?: string;
  estimatedMinutes?: number;
  isRecurring: boolean;
  recurringPattern?: {
    type: 'daily' | 'weekly' | 'monthly';
    interval: number;
    daysOfWeek?: number[];
  };
  progress: {
    type: ProgressType;
    current?: number;
    total?: number;
    unit?: string;
  };
  subTasks?: SubTask[];
  status: 'active' | 'completed' | 'archived';
  motivationSource?: 'obligation' | 'self' | 'other' | null;
  inProgress?: boolean;
  showInMatrix?: boolean;
  lastCompletedDate?: string;
  createdAt: string;
  completedAt?: string;
  lastWorkedOn?: string;
}

export interface ProgressEntry {
  taskId: string;
  taskTitle: string;
  fromValue: number;
  toValue: number;
  timestamp: string;
  subtaskTitle?: string;
}

export interface JournalEntry {
  id: string;
  text: string;
  createdAt: string;
  updatedAt?: string;
}

export interface DayLog {
  date: string;
  title?: string;
  note?: string;
  journalEntries: JournalEntry[];
  completedTaskIds: string[];
  progressEntries: ProgressEntry[];
}

export interface ActiveContext {
  selectedCategoryId?: string;
  selectedMode?: TaskMode;
  selectedLocation?: TaskLocation;
}

export interface AppState {
  categories: Category[];
  projects: Project[];
  tasks: Task[];
  dayLogs: DayLog[];
  habits: Habit[];
  habitLogs: HabitLog[];
  shoppingItems: ShoppingItem[];
  activeContext: ActiveContext;
  settings: {
    theme: Theme;
    language: Language;
  };
}
