
export interface Question {
  id: string;
  question: string;
  choices: string[];
  correctAnswer: number;
  category?: string;
  createdAt: Date;
}

export interface Quiz {
  id: string;
  name: string;
  description: string;
  questions: string[]; // Array of question IDs
  accessCode: string;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  manager: string;
  department: string;
  level: 'C1' | 'C2' | 'C3';
  accessCode: string;
  createdAt: Date;
}

export interface TestSession {
  id: string;
  quizId: string;
  employeeInfo: {
    firstName: string;
    lastName: string;
    email: string;
    manager: string;
    department: string;
    level: 'C1' | 'C2' | 'C3';
  };
  status: 'not_started' | 'in_progress' | 'completed' | 'cancelled';
  startedAt?: Date;
  completedAt?: Date;
  answers: number[];
  score?: number;
  cheatingAttempts: CheatingAttempt[];
}

export interface CheatingAttempt {
  type: 'tab_switch' | 'window_blur';
  timestamp: Date;
  warning: boolean;
}

export interface TestResult {
  employee: Employee;
  session: TestSession;
  answers: number[];
  corrections: boolean[];
  score: number;
}
