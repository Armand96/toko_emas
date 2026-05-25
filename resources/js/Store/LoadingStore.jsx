import { create } from "zustand";

const LoadingStore = create((set) => ({
    isLoading: false,
    setLoading: (value) => set({ isLoading: value }),
}));

export default LoadingStore;
