import { ActionPanel, clearSearchBar, Color, environment, Icon, List, showToast, ToastStyle } from "@raycast/api";
import { useEffect, useState } from "react";
import fs from "fs/promises";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { todoAtom, TodoItem } from "./atoms";
import { useAtom } from "jotai";

const TODO_FILE = `${environment.supportPath}/todo.json`;

const sortFunc = (a: TodoItem, b: TodoItem) => {
  if (a.completed && !b.completed) return 1;
  if (b.completed && !a.completed) return -1;
  if (a.timeAdded < b.timeAdded) return -1;
  return 1;
};

export default function TodoList() {
  const [todoSections, setTodoSections] = useAtom(todoAtom);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      try {
        const storedItemsBuffer = await fs.readFile(TODO_FILE);
        const storedItems = JSON.parse(storedItemsBuffer.toString());
        setTodoSections(storedItems);
      } catch (error) {
        await fs.mkdir(environment.supportPath, { recursive: true });
        await fs.writeFile(
          TODO_FILE,
          JSON.stringify([
            { name: "pinned", items: [] },
            { name: "other", items: [] },
          ])
        );
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
    todoSections[1].items = [
      {
        title: searchText,
        completed: false,
        timeAdded: Date.now(),
      },
      ...todoSections[1].items,
    ];
    await clearSearchBar();
    await setTodoSections([...todoSections]);
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
      {todoSections.map((section, idx) => (
        <List.Section title={section.name} key={idx}>
          {section.items.map((item, i) => (
            <TodoItem item={item} key={i} section={idx} idx={i} pinned={idx === 0} />
          ))}
        </List.Section>
      ))}
    </List>
  );
}

const TodoItem = ({
  item,
  section,
  idx,
  pinned = false,
}: {
  item: TodoItem;
  section: number;
  idx: number;
  pinned?: boolean;
}) => {
  const [todoSections, setTodoSections] = useAtom(todoAtom);

  const toggleCompleted = () => {
    todoSections[section].items[idx].completed = !todoSections[section].items[idx].completed;
    setTodoSections([...todoSections]);
  };

  const moveToSection = (newSection: number) => {
    todoSections[newSection].items = [...todoSections[newSection].items, item];
    todoSections[section].items.splice(idx, 1);
    setTodoSections([...todoSections]);
  };

  const deleteTodo = () => {
    todoSections[section].items.splice(idx, 1);
    setTodoSections([...todoSections]);
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
      accessoryIcon={pinned ? { source: Icon.Pin, tintColor: Color.Blue } : undefined}
      actions={
        <ActionPanel>
          {item.completed ? (
            <ActionPanel.Item
              title="Mark as Uncompleted"
              icon={{ source: Icon.XmarkCircle, tintColor: Color.Red }}
              onAction={() => toggleCompleted()}
            />
          ) : (
            <ActionPanel.Item
              title="Mark as Completed"
              icon={{ source: Icon.Checkmark, tintColor: Color.Green }}
              onAction={() => toggleCompleted()}
            />
          )}
          <ActionPanel.Item
            title="Delete Todo"
            icon={Icon.Trash}
            onAction={() => deleteTodo()}
            shortcut={{ modifiers: ["cmd"], key: "d" }}
          />
          {pinned ? (
            <ActionPanel.Item
              title="Unpin Todo"
              icon={Icon.Pin}
              onAction={() => moveToSection(1)}
              shortcut={{ modifiers: ["cmd"], key: "p" }}
            />
          ) : (
            <ActionPanel.Item
              title="Pin Todo"
              icon={Icon.Pin}
              onAction={() => moveToSection(0)}
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
      onAction={() =>
        setTodoItems([
          { name: "pinned", items: [] },
          { name: "other", items: [] },
        ])
      }
      shortcut={{ modifiers: ["cmd", "shift"], key: "d" }}
    />
  );
};
