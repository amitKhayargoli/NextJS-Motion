import { useUIStore } from "@/store/ui.store";

beforeEach(() => {
  useUIStore.setState({ sidebarCollapsed: false, hasHydrated: false });
  localStorage.clear();
});

describe("uiStore", () => {
  it("toggleSidebarCollapsed flips the value from false to true", () => {
    expect(useUIStore.getState().sidebarCollapsed).toBe(false);
    useUIStore.getState().toggleSidebarCollapsed();
    expect(useUIStore.getState().sidebarCollapsed).toBe(true);
  });

  it("setSidebarCollapsed sets the value directly", () => {
    useUIStore.getState().setSidebarCollapsed(true);
    expect(useUIStore.getState().sidebarCollapsed).toBe(true);

    useUIStore.getState().setSidebarCollapsed(false);
    expect(useUIStore.getState().sidebarCollapsed).toBe(false);
  });
});
