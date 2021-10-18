import { ActionPanel, clearSearchBar, environment, List, showToast, ToastStyle } from "@raycast/api";
import { useEffect, useState } from "react";
import fs from "fs/promises";

const TODO_FILE = `${environment.supportPath}/todo.json`;

export default function TodoList() {
  const [todoItems, setTodoItems] = useState<string[]>([]);
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
    const newTodos = [searchText, ...todoItems];
    setTodoItems(newTodos);
    await clearSearchBar();
    await fs.writeFile(TODO_FILE, JSON.stringify(newTodos));
  };
  return (
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
        <TodoItem text={item} key={idx} />
      ))}
    </List>
  );
}

const TodoItem = ({ text }: { text: string }) => {
  return <List.Item title={text} />;
};
