import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  Platform,
  SafeAreaView,
  StatusBar as NativeStatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { api, setSessionToken } from "./src/api/client";
import type { User } from "./src/types";
import { AuthScreen } from "./src/features/auth/AuthScreens";
import VetVisitForm from "./src/features/vetVisits/VetVisitForm";
import ScheduleVisitScreen from "./src/features/vetVisits/ScheduleVisitScreen";
import MedicationForm from "./src/features/medications/MedicationForm";
import AddMedicationScreen from "./src/features/medications/AddMedicationScreen";
import ReminderForm from "./src/features/reminders/ReminderForm";
import ReportPanel from "./src/features/reports/ReportPanel";
import HealthAssistantScreen from "./src/features/assistant/HealthAssistantScreen";
import HomeScreen, { type HomeDestination } from "./src/features/home/HomeScreen";
import PetForm from "./src/features/pets/PetForm";

type ScreenKey =
  | "home"
  | HomeDestination
  | "scheduleVisit"
  | "addMedication"
  | "reports";

type AuthMode = "welcome" | "signup" | "signin";

const SESSION_TOKEN_KEY = "petHealth.sessionToken";
const SESSION_USER_KEY = "petHealth.sessionUser";

const availableHomeScreens: HomeDestination[] = ["pets", "medications", "vetVisits", "assistant", "reminders"];

export default function App() {
  const [activeScreen, setActiveScreen] = useState<ScreenKey>("home");
  const [authMode, setAuthMode] = useState<AuthMode>("welcome");
  const [authLoading, setAuthLoading] = useState(true);
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const navigateHome = (screen: HomeDestination) => {
    if (availableHomeScreens.includes(screen)) {
      setActiveScreen(screen);
    }
  };

  useEffect(() => {
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      if (!currentUser || activeScreen === "home") {
        return false;
      }

      if (activeScreen === "addMedication") {
        setActiveScreen("medications");
      } else if (activeScreen === "scheduleVisit") {
        setActiveScreen("vetVisits");
      } else {
        setActiveScreen("home");
      }
      return true;
    });
    return () => subscription.remove();
  }, [activeScreen, currentUser]);

  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      const token = await AsyncStorage.getItem(SESSION_TOKEN_KEY);

      if (!mounted) return;

      if (token) {
        setSessionToken(token);
        try {
          const user = await api.getCurrentUser();
          if (!mounted) return;
          setCurrentUser(user);
          await AsyncStorage.setItem(SESSION_USER_KEY, JSON.stringify(user));
        } catch {
          setSessionToken(null);
          await Promise.all([AsyncStorage.removeItem(SESSION_TOKEN_KEY), AsyncStorage.removeItem(SESSION_USER_KEY)]);
        }
      }

      setAuthLoading(false);
    }

    loadSession().catch(() => {
      setSessionToken(null);
      setAuthLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, []);

  const handleGoogleToken = useCallback(async (idToken: string) => {
    setAuthBusy(true);
    setAuthError(null);

    try {
      const session = await api.googleLogin(idToken);
      setSessionToken(session.token);
      setCurrentUser(session.user);
      await Promise.all([
        AsyncStorage.setItem(SESSION_TOKEN_KEY, session.token),
        AsyncStorage.setItem(SESSION_USER_KEY, JSON.stringify(session.user)),
      ]);
      setActiveScreen("home");
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Sign-in failed.");
      setSessionToken(null);
    } finally {
      setAuthBusy(false);
    }
  }, []);

  const handleSignOut = useCallback(async () => {
    setSessionToken(null);
    setCurrentUser(null);
    setAuthMode("signin");
    await Promise.all([AsyncStorage.removeItem(SESSION_TOKEN_KEY), AsyncStorage.removeItem(SESSION_USER_KEY)]);
  }, []);

  if (authLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        <View style={styles.loadingScreen}>
          <ActivityIndicator color="#08705F" />
        </View>
      </SafeAreaView>
    );
  }

  if (!currentUser) {
    return (
      <SafeAreaView style={styles.authSafeArea}>
        <StatusBar style="dark" />
        <AuthScreen
          mode={authMode}
          busy={authBusy}
          error={authError}
          onModeChange={setAuthMode}
          onGoogleToken={handleGoogleToken}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      {activeScreen === "home" ? (
        <HomeScreen user={currentUser} availableScreens={availableHomeScreens} onNavigate={navigateHome} />
      ) : activeScreen === "pets" ? (
        <View style={styles.petScreen}>
          <View style={styles.petNavigation}>
            <TouchableOpacity onPress={() => setActiveScreen("home")}>
              <Text>Back to Home</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSignOut}>
              <Text>Sign Out</Text>
            </TouchableOpacity>
          </View>
          <PetForm />
        </View>
      ) : activeScreen === "assistant" ? (
        <HealthAssistantScreen onBack={() => setActiveScreen("home")} />
      ) : activeScreen === "vetVisits" ? (
        <VetVisitForm
          onBack={() => setActiveScreen("home")}
          onScheduleVisit={() => setActiveScreen("scheduleVisit")}
        />
      ) : activeScreen === "scheduleVisit" ? (
        <ScheduleVisitScreen
          onBack={() => setActiveScreen("vetVisits")}
          onSubmit={() => setActiveScreen("vetVisits")}
        />
      ) : activeScreen === "medications" ? (
        <MedicationForm
          onBack={() => setActiveScreen("home")}
          onAddMedication={() => setActiveScreen("addMedication")}
        />
      ) : activeScreen === "addMedication" ? (
        <AddMedicationScreen
          onBack={() => setActiveScreen("medications")}
          onSubmit={() => setActiveScreen("medications")}
        />
      ) : activeScreen === "reminders" ? (
        <ReminderForm onBack={() => setActiveScreen("home")} />
      ) : activeScreen === "reports" ? (
        <ReportPanel onBack={() => setActiveScreen("home")} />
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  petScreen: {
    flex: 1,
  },
  petNavigation: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 20,
  },
  safeArea: {
    flex: 1,
    backgroundColor: "#FAF8F4",
    paddingTop: Platform.OS === "android" ? NativeStatusBar.currentHeight ?? 0 : 0,
  },
  authSafeArea: {
    flex: 1,
    backgroundColor: "#FFFCF8",
    paddingTop: Platform.OS === "android" ? NativeStatusBar.currentHeight ?? 0 : 0,
  },
  loadingScreen: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
});
