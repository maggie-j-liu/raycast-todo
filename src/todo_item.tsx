import { ActionPanel, Color, Icon, List } from "@raycast/api";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { todoAtom, TodoItem } from "./atoms";
import { useAtom } from "jotai";
import { SECTIONS } from "./config";
import _ from "lodash";
import { insertIntoSection, compare } from "./utils";
import DeleteAllAction from "./delete_all";

const SingleTodoItem = ({
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
export default SingleTodoItem;
