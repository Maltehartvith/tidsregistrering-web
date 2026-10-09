import { request } from "./request";

export async function listLearningGoals(): Promise<string[]> {
  return request<string[]>("/learning-goals");
}

export async function createLearningGoal(text: string): Promise<string[]> {
  return request<string[]>("/learning-goals", {
    method: "POST",
    body: JSON.stringify({ text }),
  });
}

export async function renameLearningGoal(
  from: string,
  to: string,
): Promise<string[]> {
  return request<string[]>("/learning-goals", {
    method: "PATCH",
    body: JSON.stringify({ from, to }),
  });
}

export async function reorderLearningGoals(goals: string[]): Promise<string[]> {
  return request<string[]>("/learning-goals/order", {
    method: "PUT",
    body: JSON.stringify({ goals }),
  });
}

export async function deleteLearningGoal(text: string): Promise<string[]> {
  return request<string[]>("/learning-goals", {
    method: "DELETE",
    body: JSON.stringify({ text }),
  });
}
