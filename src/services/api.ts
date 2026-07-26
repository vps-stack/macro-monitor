import { Options } from "../context/OptionContext";

const URL: string = import.meta.env.VITE_API_URL || "/api";

type ApiError = Error & {
   response?: {
      data: unknown;
      status: number;
   };
};

/**
 * Check if user is authenticated (doesn't redirect on failure)
 */
export const checkAuth = async () => {
   try {
      const response = await fetch(URL + "/profile", {
         credentials: "include",
      });

      if (response.ok) {
         return await response.json();
      }
      return null;
   } catch (error) {
      console.error("Auth check error:", error);
      return null;
   }
};

/**
 * Handle fetch with error handling
 */
const apiFetch = async (url: string, options?: RequestInit) => {
   const response = await fetch(url, { ...options, credentials: "include" });

   // Handle 401 - but DON'T redirect for login/register endpoints
   if (response.status === 401) {
      const isAuthEndpoint = url.includes("/login") || url.includes("/register");

      if (!isAuthEndpoint) {
         // Only redirect if it's a protected endpoint (not login/register)
         window.location.href = "/";
      }

      // Extract error message from response
      const errorData = await response.json().catch(() => ({ message: "Unauthorized" }));
      const error = new Error(errorData.message || errorData.msg || "Unauthorized") as ApiError;
      error.response = { data: errorData, status: 401 };
      throw error;
   }

   if (!response.ok) {
      // Handle other error responses (400, 500, etc.)
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(
         errorData.message || errorData.msg || errorData.error || `Error: ${response.status}`
      ) as ApiError;
      error.response = { data: errorData, status: response.status };
      throw error;
   }

   // Handle 204 No Content
   if (response.status === 204) {
      return true;
   }

   return await response.json();
};

// ============================================
// AUTH FUNCTIONS
// ============================================

export const register = async (email: string, password: string, name?: string) => {
   return apiFetch(URL + "/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name }),
   });
};

export const login = async (email: string, password: string) => {
   return apiFetch(URL + "/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
   });
};

export const logout = async () => {
   await apiFetch(URL + "/logout", {
      method: "POST",
   });
   window.location.href = "/";
};

export const getProfile = async () => {
   return apiFetch(URL + "/profile");
};

export const updateEmail = async (email: string, currentPassword: string) => {
   return apiFetch(URL + "/profile/email", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, currentPassword }),
   });
};

export const updatePassword = async (currentPassword: string, newPassword: string) => {
   return apiFetch(URL + "/profile/password", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
   });
};

export const deleteAccount = async (password: string) => {
   return apiFetch(URL + "/profile", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
   });
};

// ============================================
// OPTIONS
// ============================================

export const createOptions = async (payload: object) => {
   return apiFetch(URL + "/options", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
   });
};

export const updateOptions = async (payload: object) => {
   return apiFetch(URL + "/options", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
   });
};

export const getAllOptions = async () => {
   return apiFetch(URL + "/options", {
      headers: { "Content-Type": "application/json" },
   });
};

// ============================================
// FOOD
// ============================================

export const createFood = async (payload: object) => {
   return apiFetch(URL + "/food", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
   });
};

export const getAllFood = async () => {
   return apiFetch(URL + "/food", {
      headers: { "Content-Type": "application/json" },
   });
};

export const deleteFoodItem = async (payload: object) => {
   return apiFetch(URL + "/food", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
   });
};

export const uploadImage = async (
   id: string,
   image: string,
   base64Image: string | ArrayBuffer
): Promise<void> => {
   return apiFetch(URL + "/food/images/" + id, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ previousImage: image, image: base64Image }),
   });
};

// ============================================
// CONSUMPTION
// ============================================

export const saveConsumption = async (payload: Options[]) => {
   return apiFetch(URL + "/consumption", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
   });
};

export const getConsumption = async () => {
   return apiFetch(URL + "/consumption", {
      headers: { "Content-Type": "application/json" },
   });
};

export const deleteConsumptionItem = async (id: string): Promise<void> => {
   return apiFetch(URL + `/consumption/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
   });
};

export const deleteConsumption = async (): Promise<void> => {
   return apiFetch(URL + "/consumption", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
   });
};

// ============================================
// ARCHIVE
// ============================================

export const createArchiveItem = async (payload: object) => {
   return apiFetch(URL + "/archive", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
   });
};

export const getArchive = async () => {
   return apiFetch(URL + "/archive", {
      headers: { "Content-Type": "application/json" },
   });
};

export const deleteArchiveItem = async (id: string): Promise<void> => {
   return apiFetch(URL + `/archive/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
   });
};

export const deleteArchive = async (): Promise<void> => {
   return apiFetch(URL + "/archive", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
   });
};
