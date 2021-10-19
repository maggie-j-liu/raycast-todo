import { ActionPanel, clearSearchBar, Color, environment, Icon, List, showToast, ToastStyle } from "@raycast/api";
import { useEffect, useState } from "react";
import fs from "fs/promises";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { todoAtom, TodoItem } from "./atoms";
import { useAtom } from "jotai";
import { DEFAULT_SECTIONS, SECTIONS, SECTIONS_DATA } from "./config";
import _ from "lodash";

const TODO_FILE = `${environment.supportPath}/todo.json`;

const compare = (a: TodoItem, b: TodoItem) => {
  if (a.completed && !b.completed) return 1;
  if (b.completed && !a.completed) return -1;
  if (a.timeAdded < b.timeAdded) return -1;
  return 1;
};

const insertIntoSection = (currentSection: TodoItem[], newItem: TodoItem, cmp: Function) => {
  let low = -1;
  let high = currentSection.length - 1;
  while (low < high) {
    let mid = Math.floor((low + high + 1) / 2);
    if (cmp(newItem, currentSection[mid]) < 0) {
      high = mid - 1;
    } else {
      low = mid;
    }
  }
  currentSection.splice(low + 1, 0, newItem);
  return currentSection;
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
        await fs.writeFile(TODO_FILE, JSON.stringify(DEFAULT_SECTIONS));
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
    todoSections[SECTIONS.OTHER] = [
      ...insertIntoSection(
        todoSections[SECTIONS.OTHER],
        {
          title: searchText,
          completed: false,
          timeAdded: Date.now(),
        },
        compare
      ),
    ];
    await clearSearchBar();
    setTodoSections(_.cloneDeep(todoSections));
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
        <List.Section title={SECTIONS_DATA[idx].name} key={idx}>
          {section.map((item, i) => (
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

  const setClone = () => {
    setTodoSections(_.cloneDeep(todoSections));
  };

  const toggleCompleted = () => {
    todoSections[section][idx].completed = !todoSections[section][idx].completed;
    todoSections[section].splice(idx, 1);
    todoSections[section] = [...insertIntoSection(todoSections[section], item, compare)];
    setClone();
  };

  const moveToSection = (newSection: number) => {
    todoSections[newSection] = [...insertIntoSection(todoSections[newSection], item, compare)];
    todoSections[section].splice(idx, 1);
    setClone();
  };

  const deleteTodo = () => {
    todoSections[section].splice(idx, 1);
    setClone();
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
              onAction={() => moveToSection(SECTIONS.OTHER)}
              shortcut={{ modifiers: ["cmd"], key: "p" }}
            />
          ) : (
            <ActionPanel.Item
              title="Pin Todo"
              icon={Icon.Pin}
              onAction={() => moveToSection(SECTIONS.PINNED)}
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
      onAction={() => setTodoItems(_.cloneDeep(DEFAULT_SECTIONS))}
      shortcut={{ modifiers: ["cmd", "shift"], key: "d" }}
    />
  );
};
