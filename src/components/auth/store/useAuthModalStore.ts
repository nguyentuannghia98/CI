import { create } from "zustand";

export type AuthView = "LOGIN" | "SIGN_UP" | "FORGOT_PASSWORD" | "NONE";

interface AuthModalStore {
  view: AuthView;
  openLogin: () => void;
  openSignUp: () => void;
  openForgotPassword: () => void;
  closeModal: () => void;
  setView: (view: AuthView) => void;
}

export const useAuthModalStore = create<AuthModalStore>((set) => ({
  view: "NONE",
  openLogin: () => set({ view: "LOGIN" }),
  openSignUp: () => set({ view: "SIGN_UP" }),
  openForgotPassword: () => set({ view: "FORGOT_PASSWORD" }),
  closeModal: () => set({ view: "NONE" }),
  setView: (view) => set({ view }),
}));