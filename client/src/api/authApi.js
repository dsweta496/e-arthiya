import {
  apiRequest,
  setToken,
  clearToken,
} from "./api";

export async function loginUser(credentials) {
  const response = await apiRequest(
    "/auth/login",
    {
      method: "POST",
      body: JSON.stringify(credentials),
    }
  );

  // Backend returns token directly
  if (response?.token) {
    setToken(response.token);
  }

  // Backend returns user directly
  if (response?.user) {
    localStorage.setItem(
      "user",
      JSON.stringify(response.user)
    );
  }

  return response;
}

export async function signupUser(payload) {
  return apiRequest("/auth/signup", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function logoutUser() {
  clearToken();
  localStorage.removeItem("user");
}

export function getStoredUser() {
  const storedUser = localStorage.getItem("user");

  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser);
  } catch {
    localStorage.removeItem("user");
    return null;
  }
}