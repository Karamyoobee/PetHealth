import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { api } from "../../api/client";

const INSTALLATION_KEY = "petHealth.notificationInstallation";

type Installation = {
  installationId: string;
  installationSecret: string;
  registrationAttempted: boolean;
};

async function readInstallation(): Promise<Installation | null> {
  const saved = await AsyncStorage.getItem(INSTALLATION_KEY);
  if (!saved) return null;
  const installation = JSON.parse(saved) as Installation;
  if (!installation.installationId || !installation.installationSecret) {
    throw new Error("Could not read this phone's notification registration.");
  }
  return installation;
}

export async function unregisterPushInstallation() {
  if (Platform.OS === "web") return;
  const installation = await readInstallation();
  if (!installation?.registrationAttempted) return;
  await api.unregisterNotificationDevice(installation);
  await AsyncStorage.setItem(INSTALLATION_KEY, JSON.stringify({ ...installation, registrationAttempted: false }));
}

export async function registerPushInstallation(projectId: string, beforeRegister: () => Promise<void>, stillCurrent: () => boolean) {
  // Keep one installation identity so the server can refresh or revoke this phone.
  let installation = await readInstallation();
  if (!installation) {
    installation = {
      installationId: Crypto.randomUUID(), installationSecret: Crypto.randomUUID() + Crypto.randomUUID(),
      registrationAttempted: false,
    };
    await AsyncStorage.setItem(INSTALLATION_KEY, JSON.stringify(installation));
  }
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const token = await Promise.race([
    Notifications.getExpoPushTokenAsync({ projectId }),
    new Promise<never>((_, reject) => {
      timeout = setTimeout(() => reject(new Error("Phone push registration timed out. Please try again.")), 30000);
    }),
  ]).finally(() => { if (timeout) clearTimeout(timeout); });
  if (!stillCurrent()) return;
  await beforeRegister();
  if (!stillCurrent()) return;
  // Persist before the request so sign-out can revoke even if its response is lost.
  installation.registrationAttempted = true;
  await AsyncStorage.setItem(INSTALLATION_KEY, JSON.stringify(installation));
  if (!stillCurrent()) return;
  await api.registerNotificationDevice({ ...installation, token: token.data, platform: Platform.OS });
}
