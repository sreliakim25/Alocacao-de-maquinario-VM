import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useThemeStore = create(
    persist(
        (set) => ({
            mode: 'dark', // default mode
            toggleTheme: () => set((state) => ({ mode: state.mode === 'dark' ? 'light' : 'dark' })),
            setMode: (mode) => set({ mode }),
        }),
        {
            name: 'theme-storage', // name of the item in the storage (must be unique)
        }
    )
);

export default useThemeStore;
