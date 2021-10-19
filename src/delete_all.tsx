import { useAtom } from "jotai";
import { todoAtom } from "./atoms";
import { DEFAULT_SECTIONS } from "./config";
import { ActionPanel } from "@raycast/api";
import _ from "lodash";

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

export default DeleteAllAction;
