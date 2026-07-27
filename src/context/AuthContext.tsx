import { useState, useEffect, ReactNode } from "react";
import {
   login as apiLogin,
   register as apiRegister,
   logout as apiLogout,
   checkAuth,
} from "../services/api";
import { AuthContext, AuthUser } from "./auth-context";


export const AuthProvider = ({ children }: { children: ReactNode }) => {
   const [user, setUser] = useState<AuthUser | null>(null);
   const [loading, setLoading] = useState(true);

   useEffect(() => {
      checkAuth()
         .then((data) => {
            if (data?.user) {
               setUser(data.user);
            }
            setLoading(false);
         })
         .catch((error) => {
            console.log(error);
            setLoading(false);
         });
   }, []);

   const login = async (email: string, password: string) => {
      try {
         const data = await apiLogin(email, password);

         if (data?.user) {
            setUser(data.user);
         } else {
            throw new Error("Invalid login response - no user data");
         }
      } catch (error) {
         setUser(null);
         throw error; // Re-throw so AuthModal catches it
      }
   };

   const register = async (email: string, password: string, name?: string) => {
      try {
         const data = await apiRegister(email, password, name);

         if (data?.user) {
            setUser(data.user);
         } else {
            throw new Error("Invalid registration response - no user data");
         }
      } catch (error) {
         setUser(null);
         throw error;
      }
   };

   const logout = () => {
      setUser(null);
      apiLogout();
   };

   return (
      <AuthContext.Provider value={{ user, loading, setUser, login, register, logout }}>
         {children}
      </AuthContext.Provider>
   );
};
