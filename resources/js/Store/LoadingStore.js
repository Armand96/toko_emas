import { create } from "zustand";

const LoadingStore = create((set) => ({
    loading: false,
    setLoading: (value) => set({ loading: value }),
}));

export default LoadingStore;
