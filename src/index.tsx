import { ActionPanel, clearSearchBar, environment, List, showToast, ToastStyle } from "@raycast/api";
import { useEffect, useState } from "react";
import fs from "fs/promises";
import { todoAtom } from "./atoms";
import { useAtom } from "jotai";
import { DEFAULT_SECTIONS, SECTIONS_DATA, TODO_FILE } from "./config";
import _ from "lodash";
import { insertIntoSection, compare } from "./utils";
import SingleTodoItem from "./todo_item";
import DeleteAllAction from "./delete_all";
import TodoSection from "./todo_section";

export default function TodoList() {
  const [todoSections, setTodoSections] = useAtom(todoAtom);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      try {
        const storedItemsBuffer = await fs.readFile(TODO_FILE);
        const storedItems = JSON.parse(storedItemsBuffer.toString());
        // from v1 where items were stored in an array
        if (Array.isArray(storedItems)) {
          const convertedStoredItems = {
            pinned: storedItems[0],
            todo: storedItems[1],
            completed: [],
          };
          setTodoSections(convertedStoredItems);
        } else {
          setTodoSections(storedItems);
        }
      } catch (error) {
        await fs.mkdir(environment.supportPath, { recursive: true });
        setTodoSections(DEFAULT_SECTIONS);
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
    todoSections.todo = [
      ...insertIntoSection(
        todoSections.todo,
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
      searchBarPlaceholder="Type and hit enter to add an item to your list"
    >
      <TodoSection sectionKey={"pinned"} />
      <TodoSection sectionKey={"todo"} />
    </List>
  );
}
