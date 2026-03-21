import { create } from "zustand";

type Theme = "dark" | "light";

interface UIState {
  sidebarOpen: boolean;
  activeModal: string | null;
  wizardStep: number;
  theme: Theme;
}

interface UIActions {
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  openModal: (modalId: string) => void;
  closeModal: () => void;
  setWizardStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  setTheme: (theme: Theme) => void;
}

type UIStore = UIState & UIActions;

export const useUIStore = create<UIStore>((set) => ({
  // State
  sidebarOpen: false,
  activeModal: null,
  wizardStep: 0,
  theme: "dark",

  // Actions
  toggleSidebar: () =>
    set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  openModal: (modalId) => set({ activeModal: modalId }),

  closeModal: () => set({ activeModal: null }),

  setWizardStep: (step) => set({ wizardStep: step }),

  nextStep: () => set((state) => ({ wizardStep: state.wizardStep + 1 })),

  prevStep: () =>
    set((state) => ({
      wizardStep: state.wizardStep > 0 ? state.wizardStep - 1 : 0,
    })),

  setTheme: (theme) => set({ theme }),
}));
