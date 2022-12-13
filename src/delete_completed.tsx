import { useAtom } from "jotai";
import { todoAtom } from "./atoms";
import { Action, Color, Icon } from "@raycast/api";
import _ from "lodash";

const DeleteCompletedAction = () => {
  const [todoSections, setTodoItems] = useAtom(todoAtom);
  return (
    <Action
      title="Delete Completed Todos"
      onAction={() => setTodoItems(_.cloneDeep({...todoSections, completed:[]}))}
      shortcut={{ modifiers: ["cmd", "opt"], key: "d" }}
      icon={{ source: Icon.Trash, tintColor: Color.Red }}
    />
  );
};

export default DeleteCompletedAction;
