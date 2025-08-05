
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
  timePerQuestion: number; // seconds
  role?: 'Candidat' | 'Chef de mission' | 'RH';
  createdAt: Date;
  updatedAt: Date;
}

export interface QuizTemplate {
  id: string;
  name: string;
  description: string;
  role: 'Chef de mission' | 'RH' | 'Auditeur';
  level: 'C1' | 'C2' | 'C3' | 'CS1' | 'CS2';
  questions: string[];
  timePerQuestion: number;
  createdAt: Date;
}

export interface Candidate {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  manager: string;
  managerEmail: string;
  department: string;
  level: 'C1' | 'C2' | 'C3' | 'CS1' | 'CS2';
  role: 'Candidat' | 'Chef de mission' | 'RH';
  accessCode: string;
  createdAt: Date;
}

export interface TestSession {
  id: string;
  quizId: string;
  candidateInfo: {
    firstName: string;
    lastName: string;
    email: string;
    manager: string;
    department: string;
    level: 'C1' | 'C2' | 'C3' | 'CS1' | 'CS2';
    role: 'Candidat' | 'Chef de mission' | 'RH';
  };
  status: 'not_started' | 'in_progress' | 'completed' | 'cancelled';
  startedAt?: Date;
  completedAt?: Date;
  completionTime?: number; // in seconds
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
  candidate: Candidate;
  session: TestSession;
  answers: number[];
  corrections: boolean[];
  score: number;
}

export interface EmailLog {
  id: string;
  candidateId: string;
  managerEmail: string;
  quizCode: string;
  candidateCode: string;
  sentAt: Date;
  status: 'sent' | 'failed';
}
