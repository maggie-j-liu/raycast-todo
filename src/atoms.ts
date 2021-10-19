import { atom } from "jotai";
import { TODO_FILE } from "./config";
import fs from "fs/promises";

export interface TodoItem {
  title: string;
  completed: boolean;
  timeAdded: number;
  pinned: boolean;
}

const todo = atom<TodoItem[]>([]);
export const todoAtom = atom(
  (get) => get(todo),
  async (get, set, newTodo: TodoItem[]) => {
    set(todo, newTodo);
    await fs.writeFile(TODO_FILE, JSON.stringify(newTodo));
  }
);
