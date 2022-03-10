import { Action, ActionPanel, clearSearchBar, showToast, Toast } from "@raycast/api";
import { useAtom } from "jotai";
import _ from "lodash";
import { newTodoTextAtom, searchModeAtom, todoAtom } from "./atoms";
import DeleteAllAction from "./delete_all";
import SearchModeAction from "./search_mode_action";
import { compare, insertIntoSection } from "./utils";

const ListActions = () => {
  const [searchMode] = useAtom(searchModeAtom);
  const [newTodoText] = useAtom(newTodoTextAtom);
  const [todoSections, setTodoSections] = useAtom(todoAtom);

  const addTodo = async () => {
    if (newTodoText.length === 0) {
      await showToast(Toast.Style.Failure, "Empty todo", "Todo items cannot be empty.");
      return;
    }
    todoSections.todo = [
      ...insertIntoSection(
        todoSections.todo,
        {
          title: newTodoText,
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
    <ActionPanel>
      {!searchMode && <Action title="Create Todo" onAction={() => addTodo()} />}
      <SearchModeAction />
      <DeleteAllAction />
    </ActionPanel>
  );
};
export default ListActions;
