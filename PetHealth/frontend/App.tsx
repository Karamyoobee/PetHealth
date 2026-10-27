import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  Platform,
  SafeAreaView,
  StatusBar as NativeStatusBar,
  StyleSheet,
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
import MyPetsScreen from "./src/features/pets/screens/Mypets";
import AddPetScreen from "./src/features/pets/screens/AddPetScreen";
import PetProfileScreen from "./src/features/pets/screens/PetProfileScreen";
import UpdatePetProfile from "./src/features/pets/screens/UpdatePetProfile";
import LogSymptom from "./src/features/quicksymptomlog/screens/LogSymptomForm";
import AddWeightLog from "./src/components/WeightLog/Weightlogform";
import LogWeight from "./src/features/Weightlog/screens/Newweight";
import WeightDashboard from "./src/features/Weightlog/screens/Weightdashboard";
import MyLogSymptom from "./src/features/quicksymptomlog/screens/LogSymptomLogs";
import PredictiveFlagging from "./src/features/Predictiveflagengine/screens/PredictiveFlag";

type ScreenKey =
  | "home"
  | HomeDestination
  | "petProfile"
  | "updatePet"
  | "quickLog"
  | "weightLog"
  | "weightDashboard"
  | "mylogSymptom"
  | "predictiveFlagging";

type AuthMode = "welcome" | "signup" | "signin";

const SESSION_TOKEN_KEY = "petHealth.sessionToken";
const SESSION_USER_KEY = "petHealth.sessionUser";

const screens: { key: ScreenKey; label: string }[] = [
  { key: "home", label: "Home" },
  { key: 'weightLog', label: 'weightLog'},
  { key: 'weightDashboard', label:'Weight Dashboard'},
  { key:'mylogSymptom', label: 'My Log Symptom'},
  { key: "updatePet", label: "Update Pet"},
  { key: "quickLog", label: "Quick Log"},
  { key: "reminders", label: "Reminders" },
  { key: "reports", label: "Reports" },
  { key: "pets", label: "Add Pet"},
];

export default function App() {
  const [activeScreen, setActiveScreen] = useState<ScreenKey>("home");
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);
  const [addPetReturnScreen, setAddPetReturnScreen] = useState<"home" | "pets">("home");
  const [authMode, setAuthMode] = useState<AuthMode>("welcome");
  const [authLoading, setAuthLoading] = useState(true);
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  //PetHealth Screen Connection - to search and find real Pet Id and details to retrieve from database
  const[selectedPetId, setSelectedPetId] = useState<string | null>(null);

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
      ) : activeScreen === "myPets" || activeScreen === "pets" ? (
      <MyPetsScreen 
      onBack={() => setActiveScreen("home")} 
      onSelectPet={(id)=>{
        setSelectedPetId(id);
        setActiveScreen("petProfile");
      }}
      onAddNewPet={() => setActiveScreen('addPet')}
      />
      ) : activeScreen === "petProfile" ? (
      <PetProfileScreen 
      onBack={() => setActiveScreen("myPets")} 
      petId={selectedPetId}
      onUpdate={() => setActiveScreen("updatePet")} 
      onQuickLog={() => setActiveScreen('quickLog')}
      onWeightLog={() => setActiveScreen('weightDashboard')}
      onPredictiveFlag={() => setActiveScreen('predictiveFlagging')}
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
      ) : activeScreen === "updatePet" ? (
        <UpdatePetProfile 
         petId={selectedPetId}
         onBack={() => setActiveScreen("petProfile")}
         />
      ) : activeScreen == "quickLog" ? (
        <LogSymptom
         onBack={() => setActiveScreen("mylogSymptom")}
         petId={selectedPetId}
        />
      ): activeScreen == 'weightLog'?(
        <LogWeight
          onBack={() => setActiveScreen('petProfile')}
          petId={selectedPetId}//connect to real data = petId (from real backend database)
        />
      ):activeScreen == 'weightDashboard' ? (
        <WeightDashboard
          onBack={() => setActiveScreen('petProfile')}
          onLogNew={() => setActiveScreen('weightLog')}
          petId ={selectedPetId}
        />
      ): activeScreen == 'mylogSymptom' ? (
        <MyLogSymptom
          onBack={() => setActiveScreen('petProfile')}
          petId={selectedPetId}
        />
      ): activeScreen == 'predictiveFlagging' ? (
        <PredictiveFlagging
          onBack={() => setActiveScreen('petProfile')}
          petId={selectedPetId}
        />
      ) :null
      }

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
