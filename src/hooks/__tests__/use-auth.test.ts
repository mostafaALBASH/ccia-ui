import { describe, test, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAuth } from "@/hooks/use-auth";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("@/actions", () => ({
  signIn: vi.fn(),
  signUp: vi.fn(),
}));

vi.mock("@/lib/anon-work-tracker", () => ({
  getAnonWorkData: vi.fn(),
  clearAnonWork: vi.fn(),
}));

vi.mock("@/actions/get-projects", () => ({
  getProjects: vi.fn(),
}));

vi.mock("@/actions/create-project", () => ({
  createProject: vi.fn(),
}));

import { signIn as signInAction, signUp as signUpAction } from "@/actions";
import { getAnonWorkData, clearAnonWork } from "@/lib/anon-work-tracker";
import { getProjects } from "@/actions/get-projects";
import { createProject } from "@/actions/create-project";

describe("useAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getAnonWorkData as ReturnType<typeof vi.fn>).mockReturnValue(null);
    (getProjects as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (createProject as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "new-project-id" });
  });

  test("initial state: isLoading is false", () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.isLoading).toBe(false);
  });

  test("returns signIn and signUp functions", () => {
    const { result } = renderHook(() => useAuth());
    expect(typeof result.current.signIn).toBe("function");
    expect(typeof result.current.signUp).toBe("function");
  });

  describe("signIn", () => {
    test("sets isLoading to true while signing in, false after", async () => {
      let resolveSignIn!: (v: { success: boolean }) => void;
      (signInAction as ReturnType<typeof vi.fn>).mockReturnValue(
        new Promise((res) => { resolveSignIn = res; })
      );

      const { result } = renderHook(() => useAuth());

      act(() => { result.current.signIn("user@example.com", "password123"); });
      expect(result.current.isLoading).toBe(true);

      await act(async () => { resolveSignIn({ success: false }); });
      expect(result.current.isLoading).toBe(false);
    });

    test("calls signInAction with provided credentials", async () => {
      (signInAction as ReturnType<typeof vi.fn>).mockResolvedValue({ success: false });

      const { result } = renderHook(() => useAuth());
      await act(async () => { await result.current.signIn("user@example.com", "password123"); });

      expect(signInAction).toHaveBeenCalledWith("user@example.com", "password123");
    });

    test("returns result from signInAction", async () => {
      const authResult = { success: false, error: "Invalid credentials" };
      (signInAction as ReturnType<typeof vi.fn>).mockResolvedValue(authResult);

      const { result } = renderHook(() => useAuth());
      let returned: unknown;
      await act(async () => { returned = await result.current.signIn("a@b.com", "pass"); });

      expect(returned).toEqual(authResult);
    });

    test("does not navigate when signIn fails", async () => {
      (signInAction as ReturnType<typeof vi.fn>).mockResolvedValue({ success: false, error: "Bad creds" });

      const { result } = renderHook(() => useAuth());
      await act(async () => { await result.current.signIn("a@b.com", "bad"); });

      expect(mockPush).not.toHaveBeenCalled();
    });

    test("sets isLoading to false even if signInAction throws", async () => {
      (signInAction as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("Network error"));

      const { result } = renderHook(() => useAuth());
      await act(async () => {
        await result.current.signIn("a@b.com", "pass").catch(() => {});
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("signUp", () => {
    test("sets isLoading to true while signing up, false after", async () => {
      let resolveSignUp!: (v: { success: boolean }) => void;
      (signUpAction as ReturnType<typeof vi.fn>).mockReturnValue(
        new Promise((res) => { resolveSignUp = res; })
      );

      const { result } = renderHook(() => useAuth());

      act(() => { result.current.signUp("user@example.com", "password123"); });
      expect(result.current.isLoading).toBe(true);

      await act(async () => { resolveSignUp({ success: false }); });
      expect(result.current.isLoading).toBe(false);
    });

    test("calls signUpAction with provided credentials", async () => {
      (signUpAction as ReturnType<typeof vi.fn>).mockResolvedValue({ success: false });

      const { result } = renderHook(() => useAuth());
      await act(async () => { await result.current.signUp("new@example.com", "securepass"); });

      expect(signUpAction).toHaveBeenCalledWith("new@example.com", "securepass");
    });

    test("returns result from signUpAction", async () => {
      const authResult = { success: true };
      (signUpAction as ReturnType<typeof vi.fn>).mockResolvedValue(authResult);
      (getProjects as ReturnType<typeof vi.fn>).mockResolvedValue([{ id: "p1" }]);

      const { result } = renderHook(() => useAuth());
      let returned: unknown;
      await act(async () => { returned = await result.current.signUp("a@b.com", "pass1234"); });

      expect(returned).toEqual(authResult);
    });

    test("does not navigate when signUp fails", async () => {
      (signUpAction as ReturnType<typeof vi.fn>).mockResolvedValue({ success: false, error: "Email taken" });

      const { result } = renderHook(() => useAuth());
      await act(async () => { await result.current.signUp("a@b.com", "pass"); });

      expect(mockPush).not.toHaveBeenCalled();
    });

    test("sets isLoading to false even if signUpAction throws", async () => {
      (signUpAction as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("Network error"));

      const { result } = renderHook(() => useAuth());
      await act(async () => {
        await result.current.signUp("a@b.com", "pass").catch(() => {});
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("post-sign-in navigation (handlePostSignIn)", () => {
    beforeEach(() => {
      (signInAction as ReturnType<typeof vi.fn>).mockResolvedValue({ success: true });
    });

    test("creates project from anon work and navigates when messages exist", async () => {
      const anonWork = {
        messages: [{ role: "user", content: "Make a button" }],
        fileSystemData: { "/App.jsx": { content: "..." } },
      };
      (getAnonWorkData as ReturnType<typeof vi.fn>).mockReturnValue(anonWork);
      (createProject as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "anon-project-id" });

      const { result } = renderHook(() => useAuth());
      await act(async () => { await result.current.signIn("a@b.com", "pass"); });

      expect(createProject).toHaveBeenCalledWith({
        name: expect.stringContaining("Design from"),
        messages: anonWork.messages,
        data: anonWork.fileSystemData,
      });
      expect(clearAnonWork).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/anon-project-id");
    });

    test("does not use anon work when messages array is empty", async () => {
      (getAnonWorkData as ReturnType<typeof vi.fn>).mockReturnValue({
        messages: [],
        fileSystemData: {},
      });
      (getProjects as ReturnType<typeof vi.fn>).mockResolvedValue([{ id: "existing-project" }]);

      const { result } = renderHook(() => useAuth());
      await act(async () => { await result.current.signIn("a@b.com", "pass"); });

      expect(clearAnonWork).not.toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/existing-project");
    });

    test("navigates to most recent project when no anon work", async () => {
      (getAnonWorkData as ReturnType<typeof vi.fn>).mockReturnValue(null);
      (getProjects as ReturnType<typeof vi.fn>).mockResolvedValue([
        { id: "recent-project" },
        { id: "older-project" },
      ]);

      const { result } = renderHook(() => useAuth());
      await act(async () => { await result.current.signIn("a@b.com", "pass"); });

      expect(mockPush).toHaveBeenCalledWith("/recent-project");
    });

    test("creates new project and navigates when no anon work and no existing projects", async () => {
      (getAnonWorkData as ReturnType<typeof vi.fn>).mockReturnValue(null);
      (getProjects as ReturnType<typeof vi.fn>).mockResolvedValue([]);
      (createProject as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "brand-new-project" });

      const { result } = renderHook(() => useAuth());
      await act(async () => { await result.current.signIn("a@b.com", "pass"); });

      expect(createProject).toHaveBeenCalledWith({
        name: expect.stringMatching(/^New Design #\d+$/),
        messages: [],
        data: {},
      });
      expect(mockPush).toHaveBeenCalledWith("/brand-new-project");
    });

    test("anon work project name includes current time string", async () => {
      const anonWork = {
        messages: [{ role: "user", content: "Hello" }],
        fileSystemData: {},
      };
      (getAnonWorkData as ReturnType<typeof vi.fn>).mockReturnValue(anonWork);
      (createProject as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "t-id" });

      const { result } = renderHook(() => useAuth());
      await act(async () => { await result.current.signIn("a@b.com", "pass"); });

      const call = (createProject as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(call.name).toMatch(/^Design from /);
    });

    test("signUp also runs post-sign-in logic on success", async () => {
      (signUpAction as ReturnType<typeof vi.fn>).mockResolvedValue({ success: true });
      (getAnonWorkData as ReturnType<typeof vi.fn>).mockReturnValue(null);
      (getProjects as ReturnType<typeof vi.fn>).mockResolvedValue([{ id: "user-project" }]);

      const { result } = renderHook(() => useAuth());
      await act(async () => { await result.current.signUp("new@example.com", "pass1234"); });

      expect(mockPush).toHaveBeenCalledWith("/user-project");
    });
  });
});
