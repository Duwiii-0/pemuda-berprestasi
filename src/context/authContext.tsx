// src/context/AuthContext.tsx
import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import { dummyAccounts } from "../dummy/rafif";
import type { DummyAccount } from "../dummy/rafif";

interface AuthContextType {
  user: DummyAccount | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<DummyAccount | null>(null);

  const login = (email: string, password: string) => {
    const foundUser = dummyAccounts.find(
      (acc) => acc.email === email && acc.password === password
    );

    if (foundUser) {
      setUser(foundUser); // tidak simpan di localStorage
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
