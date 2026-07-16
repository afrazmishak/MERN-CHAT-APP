import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import apiClient from "../api/apiClient"

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const checkSession = useCallback(async () => {
        try {
            const response = await apiClient.get("/auth/me");
            setUser(response.data.user);
        } catch {
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        checkSession();
    }, [checkSession]);

    async function register(registrationData) {
        const response = await apiClient.post(
            "/auth/register",
            registrationData
        );

        setUser(response.data.user);

        return response.data.user;
    }

    async function login(credentials) {
        const response = await apiClient.post("/auth/login", credentials);

        setUser(response.data.user);

        return response.data.user;
    }

    async function logout() {
        await apiClient.post("/auth/logout");
        setUser(null);
    }

    const contextValue = useMemo(
        () => ({
            user, loading, register, login, logout, checkSession,
        }),
        [user, loading, checkSession]
    );

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error("useAuth must be used inside AuthProvider");
    }

    return context;
}