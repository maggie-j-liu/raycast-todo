import { ActionPanel, clearSearchBar, Color, environment, Icon, List, showToast, ToastStyle } from "@raycast/api";
import { createContext, useContext, useEffect, useState } from "react";
import fs from "fs/promises";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

const TODO_FILE = `${environment.supportPath}/todo.json`;

interface TodoItem {
  title: string;
  completed: boolean;
  timeAdded: number;
}

const TodoContext = createContext<{ todoItems: TodoItem[]; setTodoItems: (newTodo: TodoItem[]) => Promise<void> }>({
  todoItems: [],
  setTodoItems: async () => {},
});

export default function TodoList() {
  const [todoItems, setTodoItems] = useState<TodoItem[]>([]);
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

  const stickySetTodo = async (newTodo: TodoItem[]) => {
    setTodoItems(newTodo);
    await fs.writeFile(TODO_FILE, JSON.stringify(newTodo));
  };

  const addTodo = async () => {
    if (searchText.length === 0) {
      await showToast(ToastStyle.Failure, "Empty todo", "Todo items cannot be empty.");
      return;
    }
    const newTodos = [{ title: searchText, completed: false, timeAdded: Date.now() }, ...todoItems];
    await clearSearchBar();
    await stickySetTodo(newTodos);
  };
  return (
    <TodoContext.Provider value={{ todoItems, setTodoItems: stickySetTodo }}>
      <List
        isLoading={loading}
        actions={
          <ActionPanel>
            <ActionPanel.Item title="Create todo" onAction={() => addTodo()} />
          </ActionPanel>
        }
        onSearchTextChange={(text) => setSearchText(text.trimEnd())}
        searchBarPlaceholder="Type a todo item..."
      >
        {todoItems.map((item, idx) => (
          <TodoItem item={item} key={idx} idx={idx} />
        ))}
      </List>
    </TodoContext.Provider>
  );
}

const TodoItem = ({ item, idx }: { item: TodoItem; idx: number }) => {
  const { todoItems, setTodoItems } = useContext(TodoContext);
  const changeStatus = (newStatus: boolean) => {
    const newTodo = [...todoItems];
    newTodo[idx].completed = newStatus;
    const sortedTodos = [...newTodo].sort((a: TodoItem, b: TodoItem) => {
      if (a.completed && !b.completed) return 1;
      if (b.completed && !a.completed) return -1;
      if (a.timeAdded > b.timeAdded) return -1;
      return 1;
    });
    setTodoItems(sortedTodos);
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
          : { source: Icon.XmarkCircle, tintColor: Color.Red }
      }
      actions={
        <ActionPanel>
          {item.completed ? (
            <ActionPanel.Item title="Mark as uncompleted" onAction={() => changeStatus(false)} />
          ) : (
            <ActionPanel.Item title="Mark as completed" onAction={() => changeStatus(true)} />
          )}
        </ActionPanel>
      }
    />
  );
};
