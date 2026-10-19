import React, { useCallback, useEffect, useRef, useState } from "react";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  AppState,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { api } from "../../api/client";
import BottomNavBar from "../../components/BottomNavBar";
import type { Pet, User } from "../../types";

export type HomeDestination =
  | "pets"
  | "addPet"
  | "symptoms"
  | "weights"
  | "vaccinations"
  | "medications"
  | "vetVisits"
  | "assistant"
  | "timeline"
  | "reminders";

type Props = {
  user: User;
  availableScreens: readonly HomeDestination[];
  onNavigate: (screen: HomeDestination, petId?: string) => void;
};

type HomeCounts = {
  vaccinations: number;
  medications: number;
  vetVisits: number;
};

export default function HomeScreen({ user, availableScreens, onNavigate }: Props) {
  const [pets, setPets] = useState<Pet[]>([]);
  const [counts, setCounts] = useState<HomeCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const loadHome = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    setError(null);
    setCounts(null);

    try {
      const now = new Date();
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      const [savedPets, summary] = await Promise.all([
        api.listCurrentUserPets(),
        api.getTodaySummary(today, now.getTimezoneOffset()),
      ]);
      if (id !== requestId.current) return;
      setPets(savedPets);

      setCounts(summary.counts);
    } catch (err) {
      if (id === requestId.current) {
        setError(err instanceof Error ? err.message : "Could not load your home screen.");
      }
    } finally {
      if (id === requestId.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadHome();
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        loadHome();
      }
    });
    const refreshTimer = setInterval(() => {
      if (AppState.currentState === "active") {
        loadHome();
      }
    }, 60000);

    return () => {
      subscription.remove();
      clearInterval(refreshTimer);
      requestId.current += 1;
    };
  }, [loadHome]);

  const canNavigate = (screen: HomeDestination) => availableScreens.includes(screen);
  const firstName = user.name.trim().split(/\s+/)[0];
  const stats: {
    label: string;
    count: number | null;
    icon: React.ReactNode;
    tint: string;
  }[] = [
    {
      label: "Vaccines",
      count: counts?.vaccinations ?? null,
      icon: <MaterialIcons name="vaccines" size={23} color="#5BAE8C" />,
      tint: "#E5F3EB",
    },
    {
      label: "Meds",
      count: counts?.medications ?? null,
      icon: <MaterialIcons name="medication" size={23} color="#F09B4A" />,
      tint: "#FFF0DD",
    },
    {
      label: "Vet Visits",
      count: counts?.vetVisits ?? null,
      icon: <MaterialIcons name="medical-services" size={23} color="#238575" />,
      tint: "#E3F5F2",
    },
  ];

  const actions: {
    label: string;
    screen: HomeDestination;
    icon: React.ReactNode;
    tint: string;
  }[] = [
    {
      label: "Log\nSymptom",
      screen: "symptoms",
      icon: <MaterialIcons name="monitor-heart" size={24} color="#238575" />,
      tint: "#E3F5F2",
    },
    {
      label: "Weight\nTracker",
      screen: "weights",
      icon: <MaterialIcons name="monitor-weight" size={25} color="#238575" />,
      tint: "#E3F5F2",
    },
    {
      label: "Vet Visits",
      screen: "vetVisits",
      icon: <Ionicons name="calendar-outline" size={24} color="#238575" />,
      tint: "#E3F5F2",
    },
    {
      label: "Medications",
      screen: "medications",
      icon: <Ionicons name="bandage-outline" size={24} color="#F09B4A" />,
      tint: "#FFF0DD",
    },
  ];

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadHome} tintColor="#238575" />}
      >
        <Text style={styles.greeting}>Hello{firstName ? `, ${firstName}` : ""} 👋</Text>
        <Text style={styles.subtitle}>How are your pets today?</Text>

        <View style={styles.stats}>
          {stats.map((stat) => (
            <View
              key={stat.label}
              accessible
              accessibilityLabel={`${stat.label} due today: ${stat.count ?? "loading"}`}
              style={styles.stat}
            >
              <View style={[styles.iconCircle, { backgroundColor: stat.tint }]}>{stat.icon}</View>
              <Text style={styles.count}>{stat.count ?? "—"}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {error ? (
          <TouchableOpacity accessibilityRole="button" onPress={loadHome}>
            <Text style={styles.error}>{error} Tap to retry.</Text>
          </TouchableOpacity>
        ) : null}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>My Pets</Text>
          <TouchableOpacity onPress={() => onNavigate("pets")}>
            <Text style={styles.link}>View All</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pets}>
          {pets.map((pet) => {
            const imageUrl = pet.photoUri || pet.imageUrl || pet.photoUrl || pet.avatarUrl;

            return (
              <TouchableOpacity key={pet.id} style={styles.pet} onPress={() => onNavigate("pets", pet.id)}>
                <View style={styles.avatarRing}>
                  {imageUrl ? (
                    <Image source={{ uri: imageUrl }} style={styles.avatar} />
                  ) : (
                    <View style={[styles.avatar, styles.fallback]}>
                      <Ionicons name="paw" size={27} color="#238575" />
                    </View>
                  )}
                </View>
                <Text numberOfLines={1} style={styles.petName}>{pet.name}</Text>
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Add new pet"
            accessibilityState={{ disabled: !canNavigate("addPet") }}
            disabled={!canNavigate("addPet")}
            style={[styles.pet, !canNavigate("addPet") && styles.unavailable]}
            onPress={() => onNavigate("addPet")}
          >
            <View style={styles.addCircle}>
              <Ionicons name="add" size={28} color="#71817C" />
            </View>
            <Text style={styles.addLabel}>Add New</Text>
          </TouchableOpacity>
        </ScrollView>

        {!loading && !error && pets.length === 0 ? (
          <Text style={styles.subtitle}>Your saved pets will appear here.</Text>
        ) : null}
        {loading && pets.length === 0 ? <ActivityIndicator color="#238575" /> : null}

        <Text style={[styles.sectionTitle, styles.quickTitle]}>Quick Actions</Text>
        <View style={styles.actions}>
          {actions.map((action) => (
            <TouchableOpacity
              key={action.screen}
              accessibilityRole="button"
              accessibilityLabel={action.label.replace("\n", " ")}
              accessibilityState={{ disabled: !canNavigate(action.screen) }}
              disabled={!canNavigate(action.screen)}
              style={[styles.action, !canNavigate(action.screen) && styles.unavailable]}
              onPress={() => onNavigate(action.screen)}
            >
              <View style={[styles.iconCircle, { backgroundColor: action.tint }]}>{action.icon}</View>
              <Text style={styles.actionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <BottomNavBar
        active="home"
        onHomePress={loadHome}
        onPetsPress={() => onNavigate("pets")}
        onActionPress={() => onNavigate("assistant")}
        onTimelinePress={canNavigate("timeline") ? () => onNavigate("timeline") : undefined}
        onAlertsPress={() => onNavigate("reminders")}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#FAF8F4",
  },
  content: {
    padding: 20,
    paddingBottom: 90,
  },
  greeting: {
    fontSize: 22,
    fontWeight: "600",
    color: "#293B35",
    marginTop: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#7C8985",
    marginTop: 4,
  },
  stats: {
    flexDirection: "row",
    gap: 9,
    marginTop: 18,
  },
  stat: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E1DB",
    borderRadius: 10,
    paddingVertical: 12,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  count: {
    color: "#293B35",
    fontSize: 17,
    fontWeight: "600",
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: "#7C8985",
    marginTop: 3,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 26,
    marginBottom: 14,
  },
  sectionTitle: {
    color: "#293B35",
    fontSize: 17,
    fontWeight: "600",
  },
  link: {
    color: "#238575",
    fontSize: 12,
    padding: 4,
  },
  pets: {
    gap: 12,
  },
  pet: {
    width: 68,
    alignItems: "center",
  },
  avatarRing: {
    borderRadius: 34,
    borderWidth: 2,
    borderColor: "#238575",
    padding: 3,
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
  },
  fallback: {
    backgroundColor: "#E5F3EB",
    alignItems: "center",
    justifyContent: "center",
  },
  petName: {
    color: "#293B35",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 6,
  },
  addCircle: {
    height: 68,
    width: 68,
    borderRadius: 34,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#A4ABA7",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  addLabel: {
    color: "#7C8985",
    fontSize: 12,
    marginTop: 6,
  },
  quickTitle: {
    marginTop: 30,
    marginBottom: 12,
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  action: {
    width: "48%",
    flexGrow: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    minHeight: 72,
    borderRadius: 10,
    borderColor: "#E5E1DB",
    borderWidth: 1,
    backgroundColor: "#FFFFFF",
  },
  actionLabel: {
    flex: 1,
    color: "#293B35",
    fontSize: 14,
    lineHeight: 20,
  },
  unavailable: {
    opacity: 0.5,
  },
  error: {
    color: "#B42318",
    marginTop: 12,
    lineHeight: 20,
  },
});
