import { create } from "zustand";
import { persist } from "zustand/middleware";

type SidebarMode = "expanded" | "collapsed";

type AppStatus = "idle" | "working" | "error";

interface UiState {
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
  appStatus: AppStatus;
  operationText: string;
  documentCount: number;
  setAppStatus: (status: AppStatus) => void;
  setOperationText: (text: string) => void;
  setDocumentCount: (count: number) => void;

  // Breadcrumbs
  breadcrumbs: { label: string; href?: string }[];
  setBreadcrumbs: (crumbs: { label: string; href?: string }[]) => void;

  // Top bar actions
  actions: { label: string; onClick: () => void; variant?: string }[];
  setActions: (
    actions: { label: string; onClick: () => void; variant?: string }[]
  ) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      // Sidebar
      sidebarMode: "expanded",
      mobileDrawerOpen: false,
      toggleSidebar: () =>
        set((s) => ({
          sidebarMode:
            s.sidebarMode === "expanded" ? "collapsed" : "expanded",
        })),
      setSidebarMode: (mode) => set({ sidebarMode: mode }),
      setMobileDrawerOpen: (open) => set({ mobileDrawerOpen: open }),

      // Command palette
      commandPaletteOpen: false,
      setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),

      // Status bar
      appStatus: "idle",
      operationText: "All changes saved",
      documentCount: 0,
      setAppStatus: (status) => set({ appStatus: status }),
      setOperationText: (text) => set({ operationText: text }),
      setDocumentCount: (count) => set({ documentCount: count }),

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
