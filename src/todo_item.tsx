import { ActionPanel, Color, Icon, List } from "@raycast/api";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { todoAtom, TodoItem, TodoSections } from "./atoms";
import { useAtom } from "jotai";
import { SECTIONS_DATA } from "./config";
import _ from "lodash";
import { insertIntoSection, compare } from "./utils";
import DeleteAllAction from "./delete_all";

const SingleTodoItem = ({ item, idx, sectionKey }: { item: TodoItem; idx: number; sectionKey: keyof TodoSections }) => {
  const [todoSections, setTodoSections] = useAtom(todoAtom);

  const setClone = () => {
    setTodoSections(_.cloneDeep(todoSections));
  };

  const toggleCompleted = () => {
    todoSections[sectionKey][idx].completed = !todoSections[sectionKey][idx].completed;
    todoSections[sectionKey].splice(idx, 1);
    todoSections[sectionKey] = [...insertIntoSection(todoSections[sectionKey], item, compare)];
    setClone();
  };

  const moveToSection = (newSection: keyof TodoSections) => {
    if (newSection === "completed") {
      item.completed = true;
    } else if (newSection === "todo") {
      item.completed = false;
    }
    todoSections[newSection] = [...insertIntoSection(todoSections[newSection], item, compare)];
    todoSections[sectionKey].splice(idx, 1);
    setClone();
  };

  const changeState = (newState: keyof TodoSections | "unpinned") => {
    if (sectionKey === "pinned") {
      if (newState === "unpinned") {
        moveToSection(item.completed ? "completed" : "todo");
      } else {
        toggleCompleted();
      }
    } else {
      moveToSection(newState as keyof TodoSections);
    }
  };

  const deleteTodo = () => {
    todoSections[sectionKey].splice(idx, 1);
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
      accessoryIcon={SECTIONS_DATA[sectionKey].accessoryIcon}
      actions={
        <ActionPanel>
          {item.completed ? (
            <ActionPanel.Item
              title="Mark as Uncompleted"
              icon={{ source: Icon.XmarkCircle, tintColor: Color.Red }}
              onAction={() => changeState("todo")}
            />
          ) : (
            <ActionPanel.Item
              title="Mark as Completed"
              icon={{ source: Icon.Checkmark, tintColor: Color.Green }}
              onAction={() => changeState("completed")}
            />
          )}
          <ActionPanel.Item
            title="Delete Todo"
            icon={Icon.Trash}
            onAction={() => deleteTodo()}
            shortcut={{ modifiers: ["cmd"], key: "d" }}
          />
          {sectionKey === "pinned" ? (
            <ActionPanel.Item
              title="Unpin Todo"
              icon={Icon.Pin}
              onAction={() => changeState("unpinned")}
              shortcut={{ modifiers: ["cmd"], key: "p" }}
            />
          ) : (
            <ActionPanel.Item
              title="Pin Todo"
              icon={Icon.Pin}
              onAction={() => changeState("pinned")}
              shortcut={{ modifiers: ["cmd"], key: "p" }}
            />
          )}
          <DeleteAllAction />
        </ActionPanel>
      }
    />
  );
};
export default SingleTodoItem;
