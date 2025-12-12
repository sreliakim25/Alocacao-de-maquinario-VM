import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
    persist(
        (set) => ({
            user: null,
            isAuthenticated: false,
            isDevelopmentBypass: false,

            login: (userData) => set({
                user: userData,
                isAuthenticated: true,
                isDevelopmentBypass: false
            }),

            loginBypass: () => set({
                user: {
                    id: 'dev-bypass',
                    name: 'Desenvolvedor',
                    email: 'dev@bypass.com',
                    role: 'admin'
                },
                isAuthenticated: true,
                isDevelopmentBypass: true
            }),

            logout: () => set({
                user: null,
                isAuthenticated: false,
                isDevelopmentBypass: false
            }),
        }),
        {
            name: 'auth-storage',
        }
    )
);

export default useAuthStore;
