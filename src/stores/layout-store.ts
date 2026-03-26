import { create } from "zustand";
import { persist } from "zustand/middleware";

type SidebarMode = "expanded" | "collapsed";

type AiStatus = "idle" | "generating" | "error";

interface LayoutState {
  // Sidebar
  sidebarMode: SidebarMode;
  mobileDrawerOpen: boolean;
  toggleSidebar: () => void;
  setSidebarMode: (mode: SidebarMode) => void;
  setMobileDrawerOpen: (open: boolean) => void;

  // Command palette
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;

  // Status bar
  aiStatus: AiStatus;
  operationText: string;
  tokenCount: number;
  estimatedCost: number;
  setAiStatus: (status: AiStatus) => void;
  setOperationText: (text: string) => void;
  setTokenCount: (count: number) => void;
  setEstimatedCost: (cost: number) => void;

  // Breadcrumbs
  breadcrumbs: { label: string; href?: string }[];
  setBreadcrumbs: (crumbs: { label: string; href?: string }[]) => void;

  // Top bar actions
  actions: { label: string; onClick: () => void; variant?: string }[];
  setActions: (actions: { label: string; onClick: () => void; variant?: string }[]) => void;
}

export const useLayoutStore = create<LayoutState>()(
  persist(
    (set) => ({
      // Sidebar
      sidebarMode: "expanded",
      mobileDrawerOpen: false,
      toggleSidebar: () =>
        set((s) => ({
          sidebarMode: s.sidebarMode === "expanded" ? "collapsed" : "expanded",
        })),
      setSidebarMode: (mode) => set({ sidebarMode: mode }),
      setMobileDrawerOpen: (open) => set({ mobileDrawerOpen: open }),

      // Command palette
      commandPaletteOpen: false,
      setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),

      // Status bar
      aiStatus: "idle",
      operationText: "All changes saved",
      tokenCount: 0,
      estimatedCost: 0,
      setAiStatus: (status) => set({ aiStatus: status }),
      setOperationText: (text) => set({ operationText: text }),
      setTokenCount: (count) => set({ tokenCount: count }),
      setEstimatedCost: (cost) => set({ estimatedCost: cost }),

      // Breadcrumbs
      breadcrumbs: [{ label: "Projects" }],
      setBreadcrumbs: (crumbs) => set({ breadcrumbs: crumbs }),

      // Top bar actions
      actions: [],
      setActions: (actions) => set({ actions }),
    }),
    {
      name: "grant-suite-layout",
      partialize: (state) => ({
        sidebarMode: state.sidebarMode,
      }),
    }
  )
);
