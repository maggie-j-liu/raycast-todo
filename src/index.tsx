import { ActionPanel, clearSearchBar, Color, environment, Icon, List, showToast, ToastStyle } from "@raycast/api";
import { createContext, useContext, useEffect, useState } from "react";
import fs from "fs/promises";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { todoAtom, TodoItem } from "./atoms";
import { useAtom } from "jotai";

const TODO_FILE = `${environment.supportPath}/todo.json`;

const sortFunc = (a: TodoItem, b: TodoItem) => {
  if (a.pinned && !b.pinned) return -1;
  if (b.pinned && !a.pinned) return 1;
  if (a.completed && !b.completed) return 1;
  if (b.completed && !a.completed) return -1;
  if (a.timeAdded < b.timeAdded) return -1;
  return 1;
};

export default function TodoList() {
  const [todoItems, setTodoItems] = useAtom(todoAtom);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      try {
        const storedItemsBuffer = await fs.readFile(TODO_FILE);
        const storedItems = JSON.parse(storedItemsBuffer.toString());
        setTodoItems(storedItems);
      } catch (error) {
        await fs.mkdir(environment.supportPath, { recursive: true });
        await fs.writeFile(TODO_FILE, JSON.stringify([]));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const addTodo = async () => {
    if (searchText.length === 0) {
      await showToast(ToastStyle.Failure, "Empty todo", "Todo items cannot be empty.");
      return;
    }
    const newTodos = [
      {
        title: searchText,
        completed: false,
        timeAdded: Date.now(),
        pinned: false,
      },
      ...todoItems,
    ].sort(sortFunc);
    await clearSearchBar();
    await setTodoItems(newTodos);
  };
  return (
    <List
      isLoading={loading}
      actions={
        <ActionPanel>
          <ActionPanel.Item title="Create Todo" onAction={() => addTodo()} />
          <DeleteAllAction />
        </ActionPanel>
      }
      onSearchTextChange={(text) => setSearchText(text.trimEnd())}
      searchBarPlaceholder="Type a todo item..."
    >
      {todoItems.map((item, idx) => (
        <TodoItem item={item} key={idx} idx={idx} />
      ))}
    </List>
  );
}

const TodoItem = ({ item, idx }: { item: TodoItem; idx: number }) => {
  const [todoItems, setTodoItems] = useAtom(todoAtom);
  const changeProperty = (property: "completed" | "pinned", newStatus: boolean) => {
    const newTodo = [...todoItems];
    newTodo[idx][property] = newStatus;
    const sortedTodos = [...newTodo].sort(sortFunc);
    setTodoItems(sortedTodos);
  };
  const deleteTodo = () => {
    const newTodo = [...todoItems];
    newTodo.splice(idx, 1);
    setTodoItems(newTodo);
  };
  dayjs.extend(customParseFormat);
  const datePart = dayjs(item.timeAdded).format("MMM D");
  const nowDatePart = dayjs(Date.now()).format("MMM D");
  const timePart = dayjs(item.timeAdded).format("h:mm A");
  const time = datePart === nowDatePart ? `at ${timePart}` : `on ${datePart}`;
  return (
    <List.Item
      title={item.title}
      subtitle={`Added ${time}`}
      icon={
        item.completed
          ? { source: Icon.Checkmark, tintColor: Color.Green }
          : { source: Icon.Circle, tintColor: Color.Red }
      }
      accessoryIcon={item.pinned ? { source: Icon.Pin, tintColor: Color.Blue } : undefined}
      actions={
        <ActionPanel>
          {item.completed ? (
            <ActionPanel.Item
              title="Mark as Uncompleted"
              icon={{ source: Icon.XmarkCircle, tintColor: Color.Red }}
              onAction={() => changeProperty("completed", false)}
            />
          ) : (
            <ActionPanel.Item
              title="Mark as Completed"
              icon={{ source: Icon.Checkmark, tintColor: Color.Green }}
              onAction={() => changeProperty("completed", true)}
            />
          )}
          <ActionPanel.Item
            title="Delete Todo"
            icon={Icon.Trash}
            onAction={() => deleteTodo()}
            shortcut={{ modifiers: ["cmd"], key: "d" }}
          />
          {item.pinned ? (
            <ActionPanel.Item
              title="Unpin Todo"
              icon={Icon.Pin}
              onAction={() => changeProperty("pinned", false)}
              shortcut={{ modifiers: ["cmd"], key: "p" }}
            />
          ) : (
            <ActionPanel.Item
              title="Pin Todo"
              icon={Icon.Pin}
              onAction={() => changeProperty("pinned", true)}
              shortcut={{ modifiers: ["cmd"], key: "p" }}
            />
          )}
          <DeleteAllAction />
        </ActionPanel>
      }
    />
  );
};

const DeleteAllAction = () => {
  const [, setTodoItems] = useAtom(todoAtom);
  return (
    <ActionPanel.Item
      title="Delete All"
      onAction={() => setTodoItems([])}
      shortcut={{ modifiers: ["cmd", "shift"], key: "d" }}
    />
  );
};
