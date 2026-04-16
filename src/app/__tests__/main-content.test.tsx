import { test, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MainContent } from "../main-content";

// Mock context providers so they just pass children through
vi.mock("@/lib/contexts/file-system-context", () => ({
  FileSystemProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

vi.mock("@/lib/contexts/chat-context", () => ({
  ChatProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

// Mock child components that would depend on contexts or heavy APIs
vi.mock("@/components/chat/ChatInterface", () => ({
  ChatInterface: () => <div data-testid="chat-interface">Chat</div>,
}));

vi.mock("@/components/editor/FileTree", () => ({
  FileTree: () => <div data-testid="file-tree">File Tree</div>,
}));

vi.mock("@/components/editor/CodeEditor", () => ({
  CodeEditor: () => <div data-testid="code-editor">Code Editor</div>,
}));

vi.mock("@/components/preview/PreviewFrame", () => ({
  PreviewFrame: () => <div data-testid="preview-frame">Preview</div>,
}));

vi.mock("@/components/HeaderActions", () => ({
  HeaderActions: () => <div data-testid="header-actions">Header</div>,
}));

// Mock resizable panels since they depend on DOM measurements
vi.mock("@/components/ui/resizable", () => ({
  ResizablePanelGroup: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  ResizablePanel: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  ResizableHandle: () => <div />,
}));

afterEach(() => {
  cleanup();
});

test("renders Preview and Code tabs", () => {
  render(<MainContent />);

  expect(screen.getByRole("tab", { name: "Preview" })).toBeDefined();
  expect(screen.getByRole("tab", { name: "Code" })).toBeDefined();
});

test("Preview tab is selected by default", () => {
  render(<MainContent />);

  const previewTab = screen.getByRole("tab", { name: "Preview" });
  const codeTab = screen.getByRole("tab", { name: "Code" });

  expect(previewTab.getAttribute("aria-selected")).toBe("true");
  expect(codeTab.getAttribute("aria-selected")).toBe("false");
});

test("shows PreviewFrame when Preview tab is active", () => {
  render(<MainContent />);

  expect(screen.getByTestId("preview-frame")).toBeDefined();
  expect(screen.queryByTestId("code-editor")).toBeNull();
  expect(screen.queryByTestId("file-tree")).toBeNull();
});

test("switches to code view when Code tab is clicked", async () => {
  const user = userEvent.setup();
  render(<MainContent />);

  const codeTab = screen.getByRole("tab", { name: "Code" });
  await user.click(codeTab);

  expect(codeTab.getAttribute("aria-selected")).toBe("true");
  expect(screen.getByRole("tab", { name: "Preview" }).getAttribute("aria-selected")).toBe("false");
  expect(screen.queryByTestId("preview-frame")).toBeNull();
  expect(screen.getByTestId("code-editor")).toBeDefined();
  expect(screen.getByTestId("file-tree")).toBeDefined();
});

test("switches back to preview when Preview tab is clicked after Code", async () => {
  const user = userEvent.setup();
  render(<MainContent />);

  // First switch to Code
  await user.click(screen.getByRole("tab", { name: "Code" }));

  // Then switch back to Preview
  await user.click(screen.getByRole("tab", { name: "Preview" }));

  const previewTab = screen.getByRole("tab", { name: "Preview" });
  const codeTab = screen.getByRole("tab", { name: "Code" });

  expect(previewTab.getAttribute("aria-selected")).toBe("true");
  expect(codeTab.getAttribute("aria-selected")).toBe("false");
  expect(screen.getByTestId("preview-frame")).toBeDefined();
  expect(screen.queryByTestId("code-editor")).toBeNull();
  expect(screen.queryByTestId("file-tree")).toBeNull();
});

test("clicking the already-active Preview tab keeps preview visible", async () => {
  const user = userEvent.setup();
  render(<MainContent />);

  // Click Preview when it's already active
  await user.click(screen.getByRole("tab", { name: "Preview" }));

  expect(screen.getByRole("tab", { name: "Preview" }).getAttribute("aria-selected")).toBe("true");
  expect(screen.getByTestId("preview-frame")).toBeDefined();
});

test("clicking the already-active Code tab keeps code editor visible", async () => {
  const user = userEvent.setup();
  render(<MainContent />);

  // Switch to Code first
  await user.click(screen.getByRole("tab", { name: "Code" }));

  // Click Code again
  await user.click(screen.getByRole("tab", { name: "Code" }));

  expect(screen.getByRole("tab", { name: "Code" }).getAttribute("aria-selected")).toBe("true");
  expect(screen.getByTestId("code-editor")).toBeDefined();
});

test("tab switching works multiple times in a row", async () => {
  const user = userEvent.setup();
  render(<MainContent />);

  // Preview → Code → Preview → Code
  await user.click(screen.getByRole("tab", { name: "Code" }));
  expect(screen.queryByTestId("preview-frame")).toBeNull();
  expect(screen.getByTestId("code-editor")).toBeDefined();

  await user.click(screen.getByRole("tab", { name: "Preview" }));
  expect(screen.getByTestId("preview-frame")).toBeDefined();
  expect(screen.queryByTestId("code-editor")).toBeNull();

  await user.click(screen.getByRole("tab", { name: "Code" }));
  expect(screen.queryByTestId("preview-frame")).toBeNull();
  expect(screen.getByTestId("code-editor")).toBeDefined();
});
