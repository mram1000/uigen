import { test, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ToolInvocationBadge, getToolLabel } from "../ToolInvocationBadge";

vi.mock("lucide-react", () => ({
  Loader2: ({ className }: { className?: string }) => (
    <div data-testid="loader" className={className}>
      Loading
    </div>
  ),
}));

afterEach(() => {
  cleanup();
});

// --- getToolLabel unit tests ---

test("getToolLabel: str_replace_editor create", () => {
  expect(getToolLabel("str_replace_editor", { command: "create", path: "/App.jsx" })).toBe(
    "Creating App.jsx"
  );
});

test("getToolLabel: str_replace_editor str_replace", () => {
  expect(
    getToolLabel("str_replace_editor", { command: "str_replace", path: "/components/Button.tsx" })
  ).toBe("Editing Button.tsx");
});

test("getToolLabel: str_replace_editor insert", () => {
  expect(
    getToolLabel("str_replace_editor", { command: "insert", path: "/components/Button.tsx" })
  ).toBe("Editing Button.tsx");
});

test("getToolLabel: str_replace_editor view", () => {
  expect(getToolLabel("str_replace_editor", { command: "view", path: "/App.jsx" })).toBe(
    "Reading App.jsx"
  );
});

test("getToolLabel: str_replace_editor undo_edit", () => {
  expect(getToolLabel("str_replace_editor", { command: "undo_edit", path: "/App.jsx" })).toBe(
    "Undoing edit in App.jsx"
  );
});

test("getToolLabel: file_manager rename", () => {
  expect(getToolLabel("file_manager", { command: "rename", path: "/old.tsx" })).toBe(
    "Renaming old.tsx"
  );
});

test("getToolLabel: file_manager delete", () => {
  expect(getToolLabel("file_manager", { command: "delete", path: "/old.tsx" })).toBe(
    "Deleting old.tsx"
  );
});

test("getToolLabel: unknown tool returns raw toolName", () => {
  expect(getToolLabel("unknown_tool", { command: "create", path: "/App.jsx" })).toBe(
    "unknown_tool"
  );
});

test("getToolLabel: known tool with unknown command returns raw toolName", () => {
  expect(getToolLabel("str_replace_editor", { command: "unknown_cmd", path: "/App.jsx" })).toBe(
    "str_replace_editor"
  );
});

test("getToolLabel: empty args returns raw toolName", () => {
  expect(getToolLabel("str_replace_editor", {})).toBe("str_replace_editor");
});

test("getToolLabel: empty path returns raw toolName", () => {
  expect(getToolLabel("str_replace_editor", { command: "create", path: "" })).toBe(
    "str_replace_editor"
  );
});

test("getToolLabel: undefined path returns raw toolName", () => {
  expect(getToolLabel("str_replace_editor", { command: "create" })).toBe("str_replace_editor");
});

test("getToolLabel: undefined args returns raw toolName", () => {
  expect(getToolLabel("str_replace_editor", undefined as any)).toBe("str_replace_editor");
});

test("getToolLabel: deeply nested path uses basename only", () => {
  expect(
    getToolLabel("str_replace_editor", {
      command: "create",
      path: "/src/components/ui/Button.tsx",
    })
  ).toBe("Creating Button.tsx");
});

test("getToolLabel: Windows-style backslash path uses basename", () => {
  expect(
    getToolLabel("str_replace_editor", { command: "create", path: "\\components\\Button.tsx" })
  ).toBe("Creating Button.tsx");
});

// --- ToolInvocationBadge render tests ---

test("shows spinner when state is call", () => {
  render(
    <ToolInvocationBadge
      toolName="str_replace_editor"
      args={{ command: "create", path: "/App.jsx" }}
      state="call"
    />
  );
  expect(screen.getByTestId("loader")).toBeDefined();
  expect(document.querySelector(".bg-emerald-500")).toBeNull();
});

test("shows spinner when state is partial-call", () => {
  render(
    <ToolInvocationBadge
      toolName="str_replace_editor"
      args={{ command: "create", path: "/App.jsx" }}
      state="partial-call"
    />
  );
  expect(screen.getByTestId("loader")).toBeDefined();
  expect(document.querySelector(".bg-emerald-500")).toBeNull();
});

test("shows spinner when state is result but result is falsy", () => {
  render(
    <ToolInvocationBadge
      toolName="str_replace_editor"
      args={{ command: "create", path: "/App.jsx" }}
      state="result"
      result={null}
    />
  );
  expect(screen.getByTestId("loader")).toBeDefined();
  expect(document.querySelector(".bg-emerald-500")).toBeNull();
});

test("shows green dot when state is result and result is truthy", () => {
  render(
    <ToolInvocationBadge
      toolName="str_replace_editor"
      args={{ command: "create", path: "/App.jsx" }}
      state="result"
      result="File created: /App.jsx"
    />
  );
  expect(screen.queryByTestId("loader")).toBeNull();
  expect(document.querySelector(".bg-emerald-500")).toBeDefined();
});

test("shows human-readable label text", () => {
  render(
    <ToolInvocationBadge
      toolName="str_replace_editor"
      args={{ command: "create", path: "/App.jsx" }}
      state="call"
    />
  );
  expect(screen.getByText("Creating App.jsx")).toBeDefined();
});

test("falls back to raw toolName for unknown tool", () => {
  render(
    <ToolInvocationBadge toolName="unknown_tool" args={{}} state="call" />
  );
  expect(screen.getByText("unknown_tool")).toBeDefined();
});

test("title attribute contains full path", () => {
  const { container } = render(
    <ToolInvocationBadge
      toolName="str_replace_editor"
      args={{ command: "create", path: "/components/ui/Button.tsx" }}
      state="call"
    />
  );
  const badge = container.firstChild as HTMLElement;
  expect(badge.title).toBe("/components/ui/Button.tsx");
});

test("title is empty string when args has no path", () => {
  const { container } = render(
    <ToolInvocationBadge toolName="str_replace_editor" args={{ command: "create" }} state="call" />
  );
  const badge = container.firstChild as HTMLElement;
  expect(badge.title).toBe("");
});
