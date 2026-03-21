"use client";

import { Loader2 } from "lucide-react";

function basename(path: string): string {
  return path.replace(/\\/g, "/").split("/").filter(Boolean).pop() ?? "";
}

export function getToolLabel(
  toolName: string,
  args: Record<string, any> | undefined | null
): string {
  const safeArgs = args ?? {};
  const file = safeArgs.path ? basename(safeArgs.path) : "";

  if (toolName === "str_replace_editor" && file) {
    switch (safeArgs.command) {
      case "create":
        return `Creating ${file}`;
      case "str_replace":
        return `Editing ${file}`;
      case "insert":
        return `Editing ${file}`;
      case "view":
        return `Reading ${file}`;
      case "undo_edit":
        return `Undoing edit in ${file}`;
    }
  }

  if (toolName === "file_manager" && file) {
    switch (safeArgs.command) {
      case "rename":
        return `Renaming ${file}`;
      case "delete":
        return `Deleting ${file}`;
    }
  }

  return toolName;
}

interface ToolInvocationBadgeProps {
  toolName: string;
  args: Record<string, any>;
  state: string;
  result?: any;
}

export function ToolInvocationBadge({
  toolName,
  args,
  state,
  result,
}: ToolInvocationBadgeProps) {
  const label = getToolLabel(toolName, args);
  const fullPath = args?.path ?? "";
  const isDone = state === "result" && Boolean(result);

  return (
    <div
      className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs font-mono border border-neutral-200"
      title={fullPath}
    >
      {isDone ? (
        <>
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-neutral-700">{label}</span>
        </>
      ) : (
        <>
          <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
          <span className="text-neutral-700">{label}</span>
        </>
      )}
    </div>
  );
}
