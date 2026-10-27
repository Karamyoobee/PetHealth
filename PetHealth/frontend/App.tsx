import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import { clearSavedSession, restoreSavedSession, SESSION_TOKEN_KEY, SESSION_USER_KEY } from "./src/auth/session";
import type { AuthSession, User } from "./src/types";
import { AuthScreen } from "./src/features/auth/AuthScreens";
import VetVisitForm from "./src/features/vetVisits/VetVisitForm";
import ScheduleVisitScreen from "./src/features/vetVisits/ScheduleVisitScreen";
import MedicationForm from "./src/features/medications/MedicationForm";
import AddMedicationScreen from "./src/features/medications/AddMedicationScreen";
import ReminderForm from "./src/features/reminders/ReminderForm";
import ReportPanel from "./src/features/reports/ReportPanel";
import HealthAssistantScreen from "./src/features/assistant/HealthAssistantScreen";
import HomeScreen, { type HomeDestination } from "./src/features/home/HomeScreen";
import MyPetsScreen from "./src/features/pets/screens/Mypets";
import AddPetScreen from "./src/features/pets/screens/AddPetScreen";
import PetProfileScreen from "./src/features/pets/screens/PetProfileScreen";
import UpdatePetProfile from "./src/features/pets/screens/UpdatePetProfile";
import LogSymptom from "./src/features/quicksymptomlog/screens/LogSymptomForm";
import LogWeight from "./src/features/Weightlog/screens/Newweight";
import WeightDashboard from "./src/features/Weightlog/screens/Weightdashboard";
import MyLogSymptom from "./src/features/quicksymptomlog/screens/LogSymptomLogs";
import PredictiveFlagging from "./src/features/Predictiveflagengine/screens/PredictiveFlag";

type ScreenKey =
  | "home"
  | HomeDestination
  | "petProfile"
  | "updatePet"
  | "scheduleVisit"
  | "addMedication"
  | "reports"
  | "quickLog"
  | "weightLog"
  | "weightDashboard"
  | "mylogSymptom"
  | "predictiveFlagging";

type AuthMode = "welcome" | "signin" | "register";

const availableHomeScreens: HomeDestination[] = ["pets", "addPet", "medications", "vetVisits", "assistant", "reminders", "reports"];

export default function App() {
  const [activeScreen, setActiveScreen] = useState<ScreenKey>("home");
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);
  const [addPetReturnScreen, setAddPetReturnScreen] = useState<"home" | "pets">("home");
  const [authMode, setAuthMode] = useState<AuthMode>("welcome");
  const [authLoading, setAuthLoading] = useState(true);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [sessionAttempt, setSessionAttempt] = useState(0);
  const [signingOut, setSigningOut] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const navigateHome = (screen: HomeDestination | "home", petId?: string) => {
    if (screen === "home" || availableHomeScreens.includes(screen)) {
      if (screen === "pets" && petId) {
        setSelectedPetId(petId);
        setActiveScreen("petProfile");
        return;
      }
      if (screen === "addPet") {
        setAddPetReturnScreen("home");
      }
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
      } else if (activeScreen === "addPet") {
        setActiveScreen(addPetReturnScreen);
      } else if (activeScreen === "petProfile") {
        setActiveScreen("pets");
      } else if (activeScreen === "updatePet") {
        setActiveScreen("petProfile");
      } else if (activeScreen === "quickLog") {
        setActiveScreen("mylogSymptom");
      } else if (activeScreen === "weightLog") {
        setActiveScreen("weightDashboard");
      } else if (["weightDashboard", "mylogSymptom", "predictiveFlagging"].includes(activeScreen)) {
        setActiveScreen("petProfile");
      } else {
        setActiveScreen("home");
      }
      return true;
    });
    return () => subscription.remove();
  }, [activeScreen, addPetReturnScreen, currentUser]);

  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      setAuthLoading(true);
      setSessionError(null);
      try {
        const session = await restoreSavedSession();
        if (!mounted) return;
        if (session.status === "restored") {
          setCurrentUser(session.user);
          setActiveScreen("home");
        } else if (session.status === "expired") {
          setCurrentUser(null);
          setAuthMode("signin");
          setAuthError("Your session has ended. Please sign in again.");
        }
      } catch {
        if (mounted) {
          setSessionError("We couldn't check your saved sign-in. Your session is still saved. Please check your connection and try again.");
        }
      } finally {
        if (mounted) {
          setAuthLoading(false);
        }
      }
    }

    loadSession();

    return () => {
      mounted = false;
    };
  }, [sessionAttempt]);

  const saveSession = useCallback(async (session: AuthSession) => {
    setSessionToken(session.token);
    await Promise.all([
      AsyncStorage.setItem(SESSION_TOKEN_KEY, session.token),
      AsyncStorage.setItem(SESSION_USER_KEY, JSON.stringify(session.user)),
    ]);
    setCurrentUser(session.user);
    setActiveScreen("home");
  }, []);

  const handleGoogleToken = useCallback(async (idToken: string, allowRegistration: boolean) => {
    setAuthBusy(true);
    setAuthError(null);

    try {
      const session = await api.googleLogin(idToken, allowRegistration);
      await saveSession(session);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Sign-in failed.");
      setSessionToken(null);
    } finally {
      setAuthBusy(false);
    }
  }, [saveSession]);

  const handlePasswordLogin = useCallback(async (email: string, password: string) => {
    setAuthBusy(true);
    setAuthError(null);
    try {
      const session = await api.passwordLogin(email, password);
      await saveSession(session);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Sign-in failed.");
      setSessionToken(null);
    } finally {
      setAuthBusy(false);
    }
  }, [saveSession]);

  const handleSignOut = useCallback(async () => {
    setSigningOut(true);
    try {
      await clearSavedSession();
      setCurrentUser(null);
      setSelectedPetId(null);
      setActiveScreen("home");
      setSessionError(null);
      setAuthError(null);
      setAuthMode("signin");
    } catch {
      Alert.alert("Could not sign out", "Please try again to finish signing out.");
    } finally {
      setSigningOut(false);
    }
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

  if (sessionError) {
    return (
      <SafeAreaView style={styles.authSafeArea}>
        <StatusBar style="dark" />
        <View style={styles.sessionRetry}>
          <Text style={styles.sessionTitle}>Couldn't restore your session</Text>
          <Text style={styles.sessionMessage}>{sessionError}</Text>
          <TouchableOpacity disabled={signingOut} style={styles.retryButton} onPress={() => setSessionAttempt((attempt) => attempt + 1)}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
          <TouchableOpacity disabled={signingOut} onPress={handleSignOut}>
            <Text style={styles.signOutText}>{signingOut ? "Signing out..." : "Sign Out"}</Text>
          </TouchableOpacity>
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
          onModeChange={(mode) => {
            setAuthError(null);
            setAuthMode(mode);
          }}
          onGoogleToken={handleGoogleToken}
          onPasswordLogin={handlePasswordLogin}
          onRegistrationComplete={saveSession}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      {activeScreen === "home" ? (
        <HomeScreen
          user={currentUser}
          availableScreens={availableHomeScreens}
          onNavigate={navigateHome}
          onSignOut={handleSignOut}
          signingOut={signingOut}
        />
      ) : activeScreen === "pets" ? (
        <MyPetsScreen
          onBack={() => setActiveScreen("home")}
          onSelectPet={(petId) => {
            setSelectedPetId(petId);
            setActiveScreen("petProfile");
          }}
          onAddNewPet={() => {
            setAddPetReturnScreen("pets");
            setActiveScreen("addPet");
          }}
          onNavigate={navigateHome}
        />
      ) : activeScreen === "addPet" ? (
        <AddPetScreen
          onBack={() => setActiveScreen(addPetReturnScreen)}
          onSaved={() => setActiveScreen("pets")}
        />
      ) : activeScreen === "petProfile" ? (
        <PetProfileScreen
          petId={selectedPetId}
          onBack={() => setActiveScreen("pets")}
          onUpdate={() => setActiveScreen("updatePet")}
          onQuickLog={() => setActiveScreen("quickLog")}
          onWeightLog={() => setActiveScreen("weightDashboard")}
          onPredictiveFlag={() => setActiveScreen("predictiveFlagging")}
          onNavigate={navigateHome}
        />
      ) : activeScreen === "updatePet" ? (
        <UpdatePetProfile petId={selectedPetId} onBack={() => setActiveScreen("petProfile")} />
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
      ) : activeScreen === "quickLog" ? (
        <LogSymptom petId={selectedPetId} onBack={() => setActiveScreen("mylogSymptom")} />
      ) : activeScreen === "weightLog" ? (
        <LogWeight petId={selectedPetId} onBack={() => setActiveScreen("weightDashboard")} />
      ) : activeScreen === "weightDashboard" ? (
        <WeightDashboard
          petId={selectedPetId}
          onBack={() => setActiveScreen("petProfile")}
          onLogNew={() => setActiveScreen("weightLog")}
        />
      ) : activeScreen === "mylogSymptom" ? (
        <MyLogSymptom petId={selectedPetId} onBack={() => setActiveScreen("petProfile")} />
      ) : activeScreen === "predictiveFlagging" ? (
        <PredictiveFlagging petId={selectedPetId} onBack={() => setActiveScreen("petProfile")} />
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  sessionRetry: {
    flex: 1,
    justifyContent: "center",
    padding: 28,
    gap: 20,
  },
  sessionTitle: {
    color: "#10201F",
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
  },
  sessionMessage: {
    color: "#48525B",
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#08705F",
    alignItems: "center",
    borderRadius: 8,
    padding: 14,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  signOutText: {
    color: "#08705F",
    fontWeight: "700",
    textAlign: "center",
    padding: 10,
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
