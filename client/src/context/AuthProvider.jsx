import {
  useEffect,
  useMemo,
  useState,
} from "react";

import apiClient from "../api/apiClient";

import AuthContext from "./AuthContext";

export function AuthProvider({
  children,
}) {
  const [
    user,
    setUser,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  useEffect(() => {
    let active = true;

    apiClient
      .get("/auth/me")
      .then((response) => {
        if (!active) {
          return;
        }

        setUser(
          response.data.user
        );
      })
      .catch(() => {
        if (!active) {
          return;
        }

        setUser(null);
      })
      .finally(() => {
        if (!active) {
          return;
        }

        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  async function register(
    registrationData
  ) {
    const response =
      await apiClient.post(
        "/auth/register",
        registrationData
      );

    setUser(
      response.data.user
    );

    return response.data.user;
  }

  async function login(
    credentials
  ) {
    const response =
      await apiClient.post(
        "/auth/login",
        credentials
      );

    setUser(
      response.data.user
    );

    return response.data.user;
  }

  async function logout() {
    await apiClient.post(
      "/auth/logout"
    );

    setUser(null);
  }

  async function checkSession() {
    try {
      const response =
        await apiClient.get(
          "/auth/me"
        );

      setUser(
        response.data.user
      );

      return response.data.user;
    } catch {
      setUser(null);

      return null;
    }
  }

  const contextValue =
    useMemo(
      () => ({
        user,
        loading,
        register,
        login,
        logout,
        checkSession,
      }),
      [
        user,
        loading,
      ]
    );

  return (
    <AuthContext.Provider
      value={contextValue}
    >
      {children}
    </AuthContext.Provider>
  );
}