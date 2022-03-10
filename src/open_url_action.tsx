import { Action } from "@raycast/api";
import { nanoid } from "nanoid";

const OpenUrlAction = ({ title }: { title: string }) => {
  return (
    <>
      <Action.OpenInBrowser key={nanoid()} url={title} />
    </>
  );
};

export default OpenUrlAction;
