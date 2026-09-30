export type LogEventArgs = {
    actor: string;
    studentId?: string | null;
    courseId?: string | null;
    description: string;
  };