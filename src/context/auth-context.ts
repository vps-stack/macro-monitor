import { createContext, Dispatch, SetStateAction } from "react";

export type AuthUser = {
   id: string;
   email: string;
   name?: string;
};

export type AuthContextValue = {
   user: AuthUser | null;
   loading: boolean;
   setUser: Dispatch<SetStateAction<AuthUser | null>>;
   login: (email: string, password: string) => Promise<void>;
   register: (email: string, password: string, name?: string) => Promise<void>;
   logout: () => void;
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

