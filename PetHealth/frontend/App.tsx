import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar as NativeStatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { colors, spacing } from "./src/theme";
import { api, setSessionToken } from "./src/api/client";
import type { User } from "./src/types";
import { AuthScreen } from "./src/features/auth/AuthScreens";
import VetVisitForm from "./src/features/vetVisits/VetVisitForm";
import ScheduleVisitScreen from "./src/features/vetVisits/ScheduleVisitScreen";
import MedicationForm from "./src/features/medications/MedicationForm";
import AddMedicationScreen from "./src/features/medications/AddMedicationScreen";
import ReminderForm from "./src/features/reminders/ReminderForm";
import ReportPanel from "./src/features/reports/ReportPanel";
import HomeScreenView from "./src/features/HomeScreen/screens/HomeScreen";

type ScreenKey =
  | "home"
  | "vetVisits"
  | "scheduleVisit"
  | "medications"
  | "addMedication"
  | "reminders"
  | "reports";

type AuthMode = "welcome" | "signup" | "signin";

const SESSION_TOKEN_KEY = "petHealth.sessionToken";
const SESSION_USER_KEY = "petHealth.sessionUser";

const screens: { key: ScreenKey; label: string }[] = [
  { key: "home", label: "Home" },
  { key: "vetVisits", label: "Vet Visits" },
  { key: "medications", label: "Medications" },
  { key: "reminders", label: "Reminders" },
  { key: "reports", label: "Reports" },
];

export default function App() {
  const [activeScreen, setActiveScreen] = useState<ScreenKey>("home");
  const [authMode, setAuthMode] = useState<AuthMode>("welcome");
  const [authLoading, setAuthLoading] = useState(true);
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

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
        <>
          <View style={styles.nav}>
            {screens.map((screen) => {
              const isActive = activeScreen === screen.key;
              return (
                <TouchableOpacity
                  key={screen.key}
                  onPress={() => setActiveScreen(screen.key)}
                  style={[styles.navButton, isActive && styles.navButtonActive]}
                >
                  <Text style={[styles.navText, isActive && styles.navTextActive]}>{screen.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <HomeScreenView user={currentUser} onSignOut={handleSignOut} onNavigate={setActiveScreen} />
        </>
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

function HomeScreen({ user, onSignOut, onNavigate }: { user: User; onSignOut: () => void; onNavigate?: (screen: ScreenKey) => void; }) {
  
  return (
  <HomeScreenView
    user={user}
    onSignOut={onSignOut}
    onNavigate={onNavigate}
  />

  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
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
  nav: {
    backgroundColor: colors.surface,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.md,
  },
  navButton: {
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  navButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  navText: {
    color: colors.text,
    fontWeight: "800",
  },
  navTextActive: {
    color: colors.white,
  },
  home: {
    flexGrow: 1,
    justifyContent: "center",
    padding: spacing.lg,
  },
  title: {
    color: colors.text,
    fontSize: 30,
    fontWeight: "800",
    textAlign: "center",
  },
  subtitle: {
    color: colors.muted,
    fontSize: 15,
    marginTop: spacing.sm,
    textAlign: "center",
  },
  previewCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: spacing.sm,
    marginTop: spacing.lg,
    padding: spacing.md,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
  },
  cardText: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  signOutButton: {
    alignItems: "center",
    alignSelf: "center",
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  signOutText: {
    color: colors.text,
    fontWeight: "800",
  },
});
