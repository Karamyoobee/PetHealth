import AsyncStorage from "@react-native-async-storage/async-storage";

import { api, ApiError, setSessionToken } from "../api/client";
import type { User } from "../types";

export const SESSION_TOKEN_KEY = "petHealth.sessionToken";
export const SESSION_USER_KEY = "petHealth.sessionUser";

type RestoredSession =
  | { status: "missing" | "expired" }
  | { status: "restored"; user: User };

export async function clearSavedSession() {
  await AsyncStorage.multiRemove([SESSION_TOKEN_KEY, SESSION_USER_KEY]);
  setSessionToken(null);
}

export async function restoreSavedSession(): Promise<RestoredSession> {
  const token = await AsyncStorage.getItem(SESSION_TOKEN_KEY);
  if (!token) {
    setSessionToken(null);
    return { status: "missing" };
  }

  setSessionToken(token);
  let user: User;
  try {
    user = await api.getCurrentUser();
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      await clearSavedSession();
      return { status: "expired" };
    }
    throw error;
  }

  await AsyncStorage.setItem(SESSION_USER_KEY, JSON.stringify(user));
  return { status: "restored", user };
}
