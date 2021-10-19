import { atom } from "jotai";
import { TODO_FILE } from "./config";
import fs from "fs/promises";

export interface TodoItem {
  title: string;
  completed: boolean;
  timeAdded: number;
}

export interface TodoSection {
  name: string;
  items: TodoItem[];
}

const todo = atom<TodoSection[]>([
  { name: "pinned", items: [] },
  { name: "other", items: [] },
]);
export const todoAtom = atom(
  (get) => get(todo),
  async (_get, set, newTodo: TodoSection[]) => {
    set(todo, newTodo);
    await fs.writeFile(TODO_FILE, JSON.stringify(newTodo));
  }
);
