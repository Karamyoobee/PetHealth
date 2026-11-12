import React, { useCallback, useEffect, useRef, useState } from "react";
import { Entypo, Ionicons, MaterialIcons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  AppState,
  Image,
  Linking,
  Modal,
  Pressable,
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
  | "reminders"
  | "predictiveFlagging";

type Props = {
  user: User;
  availableScreens: readonly HomeDestination[];
  onNavigate: (screen: HomeDestination, petId?: string) => void;
  onSignOut: () => void;
  signingOut: boolean;
  onDeleteAccount: () => void;
  deletingAccount: boolean;
};

type HomeCounts = {
  vaccinations: number;
  medications: number;
  vetVisits: number;
};

export default function HomeScreen({ user, availableScreens, onNavigate, onSignOut, signingOut, onDeleteAccount, deletingAccount }: Props) {
  const [pets, setPets] = useState<Pet[]>([]);
  const [counts, setCounts] = useState<HomeCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const requestId = useRef(0);

  const loadHome = useCallback(async () => {
    // Use the phone's local date so today's counts match the user's day.
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
  const closeAccountMenu = () => setAccountMenuOpen(false);
  const openExternalPage = (path: "privacy" | "terms") => {
    closeAccountMenu();
    void Linking.openURL(`https://pethealth-backend-9hbs.onrender.com/${path}`);
  };
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
        <View style={styles.greetingRow}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Open account menu"
            style={styles.greetingButton}
            onPress={() => setAccountMenuOpen(true)}
          >
            <View style={styles.greetingContent}>
              <Text numberOfLines={1} style={styles.greeting}>Hello{firstName ? `, ${firstName}` : ""}</Text>
              <MaterialIcons name="waving-hand" size={21} color="#238575" />
            </View>
            <Ionicons name="chevron-down" size={18} color="#5D706A" />
          </TouchableOpacity>
        </View>
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
              <Text style={styles.count}>{stat.count ?? "-"}</Text>
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
              onPress={() => onNavigate(action.screen, pets.length === 1 ? pets[0].id : undefined)}
            >
              <View style={[styles.iconCircle, { backgroundColor: action.tint }]}>{action.icon}</View>
              <Text style={styles.actionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={styles.upcomingCard}
          onPress={() => onNavigate("predictiveFlagging", pets.length === 1 ? pets[0].id : undefined)}
        >
          <View style={styles.upcomingIcon}>
            <Entypo name="flag" size={23} color="#238575" />
          </View>
          <View style={styles.upcomingDetails}>
            <Text style={styles.upcomingTitle}>Predictive Flagging</Text>
            <Text numberOfLines={1} style={styles.upcomingText}>Review your pet's weight trends and health insights</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#71817C" />
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={accountMenuOpen} transparent animationType="slide" onRequestClose={closeAccountMenu}>
        <View style={styles.modalRoot}>
          <Pressable accessibilityRole="button" accessibilityLabel="Close account menu" style={styles.backdrop} onPress={closeAccountMenu} />
          <View style={styles.accountDrawer}>
            <View style={styles.drawerHandle} />
            <View style={styles.drawerHeader}>
              <View style={styles.accountAvatar}>
                <Ionicons name="person" size={23} color="#238575" />
              </View>
              <View style={styles.accountDetails}>
                <Text numberOfLines={1} style={styles.accountName}>{user.name || "Pet Health user"}</Text>
                <Text numberOfLines={1} style={styles.accountEmail}>{user.email}</Text>
              </View>
              <TouchableOpacity accessibilityRole="button" accessibilityLabel="Close account menu" style={styles.closeButton} onPress={closeAccountMenu}>
                <Ionicons name="close" size={22} color="#40514C" />
              </TouchableOpacity>
            </View>

            <View style={styles.drawerItems}>
              <TouchableOpacity accessibilityRole="link" style={styles.drawerItem} onPress={() => openExternalPage("privacy")}>
                <Ionicons name="shield-checkmark-outline" size={21} color="#238575" />
                <Text style={styles.drawerItemText}>Privacy Policy</Text>
                <Ionicons name="open-outline" size={18} color="#71817C" />
              </TouchableOpacity>
              <TouchableOpacity
                accessibilityRole="button"
                disabled={signingOut || deletingAccount}
                style={styles.drawerItem}
                onPress={() => { closeAccountMenu(); onSignOut(); }}
              >
                <Ionicons name="log-out-outline" size={21} color="#40514C" />
                <Text style={styles.drawerItemText}>{signingOut ? "Signing out..." : "Sign Out"}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                accessibilityRole="button"
                disabled={signingOut || deletingAccount}
                style={[styles.drawerItem, styles.deleteAccountItem]}
                onPress={() => { closeAccountMenu(); onDeleteAccount(); }}
              >
                <Ionicons name="trash-outline" size={21} color="#A74337" />
                <Text style={styles.deleteAccountText}>{deletingAccount ? "Deleting..." : "Delete Account"}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.drawerFooter}>
              <TouchableOpacity accessibilityRole="link" onPress={() => openExternalPage("terms")}>
                <Text style={styles.termsText}>Terms & Conditions</Text>
              </TouchableOpacity>
              <Text style={styles.footerBrand}>Pet Health</Text>
            </View>
          </View>
        </View>
      </Modal>

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
  greetingRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  greetingButton: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 4,
    paddingRight: 4,
  },
  greetingContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexShrink: 1,
  },
  deleteAccountText: {
    color: "#A74337",
    fontSize: 15,
    fontWeight: "600",
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
  upcomingCard: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 22,
    minHeight: 82,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D9EAE5",
    backgroundColor: "#F1F8F5",
  },
  upcomingIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DDF1EA",
  },
  upcomingDetails: {
    flex: 1,
    marginHorizontal: 12,
  },
  upcomingTitle: {
    color: "#293B35",
    fontSize: 15,
    fontWeight: "700",
  },
  upcomingText: {
    color: "#5D706A",
    fontSize: 13,
    marginTop: 3,
  },
  unavailable: {
    opacity: 0.5,
  },
  error: {
    color: "#B42318",
    marginTop: 12,
    lineHeight: 20,
  },
  modalRoot: {
    flex: 1,
    flexDirection: "row",
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(22, 36, 31, 0.38)",
  },
  accountDrawer: {
    width: "86%",
    maxWidth: 360,
    backgroundColor: "#FAF8F4",
    paddingTop: 14,
    paddingHorizontal: 20,
    paddingBottom: 32,
    justifyContent: "space-between",
  },
  drawerHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D7D3CC",
    alignSelf: "center",
    marginBottom: 20,
  },
  drawerHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 22,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E1DB",
  },
  accountAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E3F5F2",
  },
  accountDetails: {
    flex: 1,
    marginLeft: 12,
  },
  accountName: {
    color: "#293B35",
    fontSize: 16,
    fontWeight: "700",
  },
  accountEmail: {
    color: "#71817C",
    fontSize: 13,
    marginTop: 3,
  },
  closeButton: {
    padding: 7,
  },
  drawerItems: {
    flex: 1,
    paddingTop: 18,
  },
  drawerItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEAE4",
  },
  drawerItemText: {
    flex: 1,
    color: "#293B35",
    fontSize: 15,
    fontWeight: "600",
  },
  deleteAccountItem: {
    marginTop: 8,
  },
  drawerFooter: {
    alignItems: "center",
    gap: 10,
  },
  termsText: {
    color: "#238575",
    fontSize: 13,
    fontWeight: "600",
  },
  footerBrand: {
    color: "#8B9692",
    fontSize: 12,
  },
});
