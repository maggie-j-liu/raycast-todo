import { ActionPanel, clearSearchBar, showHUD, showToast, ToastStyle } from "@raycast/api";
import { useAtom } from "jotai";
import { searchModeAtom } from "./atoms";

const SearchModeAction = () => {
  const [searchMode, setSearchMode] = useAtom(searchModeAtom);
  return (
    <ActionPanel.Item
      title="Toggle Search Mode"
      onAction={async () => {
        await showToast(ToastStyle.Success, `Switched to ${searchMode ? "insert" : "search"} mode.`);
        setSearchMode(!searchMode);
        await clearSearchBar();
      }}
      shortcut={{ key: "s", modifiers: ["cmd"] }}
    />
  );
};

export default SearchModeAction;
