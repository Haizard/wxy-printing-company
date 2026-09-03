import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface User {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: {
    fullName: string;
    email?: string;
    phone?: string;
    password: string;
    role?: string;
  }) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load token from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem("printhub_token");
    const savedUser = localStorage.getItem("printhub_user");
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Login failed");
    }

    const data = await response.json();
    setUser(data.user);
    setToken(data.token);
    localStorage.setItem("printhub_token", data.token);
    localStorage.setItem("printhub_user", JSON.stringify(data.user));
    return data.user as User;
  };

  const register = async (data: {
    fullName: string;
    email?: string;
    phone?: string;
    password: string;
    role?: string;
  }) => {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Registration failed");
    }

    const result = await response.json();
    setUser(result.user);
    setToken(result.token);
    localStorage.setItem("printhub_token", result.token);
    localStorage.setItem("printhub_user", JSON.stringify(result.user));
    return result.user as User;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("printhub_token");
    localStorage.removeItem("printhub_user");
  };

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
