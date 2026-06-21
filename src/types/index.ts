export type Priority = 'p1' | 'p2' | 'p3' | 'p4';
export type TaskMode = 'digital' | 'analog';
export type TaskLocation = 'anywhere' | 'home' | 'outside';
export type ProgressType = 'checkbox' | 'counter' | 'subtasks';
export type Language = 'de' | 'en' | 'es' | 'pt';
export type Theme = 'light' | 'dark';
export type Screen = 'today' | 'tasks' | 'projects' | 'review' | 'settings';

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
  mode: TaskMode;
  location: TaskLocation;
  dueDate?: string;
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
}

export interface DayLog {
  date: string;
  note?: string;
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
  activeContext: ActiveContext;
  settings: {
    theme: Theme;
    language: Language;
  };
}
