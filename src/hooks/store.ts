import { create } from "zustand";

interface GlobalState {
  authenticated: boolean;
  loginSuccess: boolean;
  setLoginSuccess: (value: boolean) => void;
  login: () => void;
  logout: () => void;
  blogPreview: string | null;
  setBlogPreview: (value: string | null) => void;
}

export const useGlobalStore = create<GlobalState>((set) => ({
  authenticated:
    typeof window !== "undefined"
      ? localStorage.getItem("authenticated") === "true"
      : false,
  loginSuccess: false,
  setLoginSuccess: (value) => set({ loginSuccess: value }),
  login: () => {
    localStorage.setItem("authenticated", "true");
    set({ authenticated: true });
  },
  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("authenticated", "false");
    }
    set({ authenticated: false });
  },
  blogPreview:
    typeof window !== "undefined" ? localStorage.getItem("blogPreview") : null,
  setBlogPreview: (value) => set({ blogPreview: value }),
}));


type CollapsedState = {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
  toggleCollapsed: () => void;
};

// Create the zustand store
export const useCollapsedStore = create<CollapsedState>((set) => ({
  isCollapsed: false,
  setIsCollapsed: (value: boolean) => set({ isCollapsed: value }),
  toggleCollapsed: () => set((state) => ({ isCollapsed: !state.isCollapsed })),
}));

