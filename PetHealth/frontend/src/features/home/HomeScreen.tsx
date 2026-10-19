import React, { useCallback, useEffect, useRef, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Image, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { api } from "../../api/client";
import BottomNavBar from "../../components/BottomNavBar";
import type { Pet, User } from "../../types";

export type HomeDestination = "pets" | "addPet" | "symptoms" | "weights" | "vaccinations" | "medications" | "vetVisits" | "assistant" | "timeline" | "reminders";
type Props = { user: User; onNavigate: (screen: HomeDestination, petId?: string) => void };

export default function HomeScreen({ user, onNavigate }: Props) {
  const [pets, setPets] = useState<Pet[]>([]);
  const [counts, setCounts] = useState<{ vaccinations: null; medications: number; vetVisits: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);
  const load = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    setError(null);
    setCounts(null);
    try {
      const savedPets = await api.listCurrentUserPets();
      if (id !== requestId.current) return;
      setPets(savedPets);
      const records = await Promise.all(savedPets.map(async pet => {
        const [medications, vetVisits] = await Promise.all([api.listMedications(pet.id), api.listVetVisits(pet.id)]);
        return { medications: medications.length, vetVisits: vetVisits.length };
      }));
      if (id !== requestId.current) return;
      setCounts({
        // The existing backend has no vaccination records endpoint yet.
        vaccinations: null,
        medications: records.reduce((total, record) => total + record.medications, 0),
        vetVisits: records.reduce((total, record) => total + record.vetVisits, 0),
      });
    } catch (err) {
      if (id === requestId.current) setError(err instanceof Error ? err.message : "Could not load your home screen.");
    } finally { if (id === requestId.current) setLoading(false); }
  }, []);
  useEffect(() => { void load(); return () => { requestId.current += 1; }; }, [load]);
  const stats = [
    { label: "Vaccines", key: "vaccinations" as const, icon: "shield-checkmark" as const, color: "#5BAE8C", tint: "#E5F3EB" },
    { label: "Meds", key: "medications" as const, icon: "medkit" as const, color: "#F09B4A", tint: "#FFF0DD" },
    { label: "Vet Visits", key: "vetVisits" as const, icon: "medical" as const, color: "#238575", tint: "#E3F5F2" },
  ];
  const actions = [
    { label: "Log\nSymptom", key: "symptoms" as const, icon: "pulse" as const },
    { label: "Weight\nTracker", key: "weights" as const, icon: "scale-outline" as const },
    { label: "Vet Visits", key: "vetVisits" as const, icon: "calendar-outline" as const },
    { label: "Medications", key: "medications" as const, icon: "bandage-outline" as const },
  ];
  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor="#238575" />}>
        <Text style={styles.greeting}>Hello{user.name.trim() ? `, ${user.name.trim().split(/\s+/)[0]}` : ""} 👋</Text>
        <Text style={styles.subtitle}>How are your pets today?</Text>
        <View style={styles.stats}>
          {stats.map(stat => <TouchableOpacity key={stat.key} accessibilityRole="button" accessibilityLabel={`View ${stat.label}`} style={styles.stat} onPress={() => onNavigate(stat.key)}>
            <View style={[styles.iconCircle, { backgroundColor: stat.tint }]}><Ionicons name={stat.icon} size={21} color={stat.color} /></View>
            <Text style={styles.count}>{counts?.[stat.key] ?? "—"}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </TouchableOpacity>)}
        </View>
        {error && <TouchableOpacity accessibilityRole="button" onPress={load}><Text style={styles.error}>{error} Tap to retry.</Text></TouchableOpacity>}
        <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>My Pets</Text><TouchableOpacity onPress={() => onNavigate("pets")}><Text style={styles.link}>View All</Text></TouchableOpacity></View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pets}>
          {pets.map(pet => <TouchableOpacity key={pet.id} style={styles.pet} onPress={() => onNavigate("pets", pet.id)}>
            <View style={styles.avatarRing}>{pet.imageUrl || pet.photoUrl || pet.avatarUrl ? <Image source={{ uri: pet.imageUrl || pet.photoUrl || pet.avatarUrl }} style={styles.avatar} /> : <View style={[styles.avatar, styles.fallback]}><Ionicons name="paw" size={27} color="#238575" /></View>}</View>
            <Text numberOfLines={1} style={styles.petName}>{pet.name}</Text>
          </TouchableOpacity>)}
          <TouchableOpacity style={styles.pet} onPress={() => onNavigate("addPet")}><View style={styles.addCircle}><Ionicons name="add" size={28} color="#71817C" /></View><Text style={styles.addLabel}>Add New</Text></TouchableOpacity>
        </ScrollView>
        {!loading && !error && pets.length === 0 && <Text style={styles.subtitle}>Add your first pet to start tracking their health.</Text>}
        {loading && pets.length === 0 && <ActivityIndicator color="#238575" />}
        <Text style={[styles.sectionTitle, styles.quickTitle]}>Quick Actions</Text>
        <View style={styles.actions}>{actions.map(action => <TouchableOpacity key={action.key} style={styles.action} onPress={() => onNavigate(action.key)}>
          <View style={[styles.iconCircle, { backgroundColor: action.key === "medications" ? "#FFF0DD" : "#E3F5F2" }]}><Ionicons name={action.icon} size={24} color={action.key === "medications" ? "#F09B4A" : "#238575"} /></View>
          <Text style={styles.actionLabel}>{action.label}</Text>
        </TouchableOpacity>)}</View>
      </ScrollView>
      <BottomNavBar active="home" onHomePress={load} onPetsPress={() => onNavigate("pets")} onActionPress={() => onNavigate("assistant")} onTimelinePress={() => onNavigate("timeline")} onAlertsPress={() => onNavigate("reminders")} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#FAF8F4" },
  content: { padding: 20, paddingBottom: 90 },
  greeting: { fontSize: 22, fontWeight: "600", color: "#293B35", marginTop: 8 },
  subtitle: { fontSize: 14, color: "#7C8985", marginTop: 4 },
  stats: { flexDirection: "row", gap: 9, marginTop: 18 },
  stat: { flex: 1, alignItems: "center", backgroundColor: "white", borderWidth: 1, borderColor: "#E5E1DB", borderRadius: 10, paddingVertical: 12 },
  iconCircle: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  count: { color: "#293B35", fontSize: 17, fontWeight: "600", marginTop: 8 },
  statLabel: { fontSize: 12, color: "#7C8985", marginTop: 3 },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 26, marginBottom: 14 },
  sectionTitle: { color: "#293B35", fontSize: 17, fontWeight: "600" },
  link: { color: "#238575", fontSize: 12, padding: 4 },
  pets: { gap: 12 }, pet: { width: 68, alignItems: "center" },
  avatarRing: { borderRadius: 34, borderWidth: 2, borderColor: "#238575", padding: 3 },
  avatar: { width: 58, height: 58, borderRadius: 29 }, fallback: { backgroundColor: "#E5F3EB", alignItems: "center", justifyContent: "center" },
  petName: { color: "#293B35", fontSize: 12, fontWeight: "600", marginTop: 6 },
  addCircle: { height: 68, width: 68, borderRadius: 34, borderWidth: 1, borderStyle: "dashed", borderColor: "#A4ABA7", backgroundColor: "white", alignItems: "center", justifyContent: "center" },
  addLabel: { color: "#7C8985", fontSize: 12, marginTop: 6 }, quickTitle: { marginTop: 30, marginBottom: 12 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  action: { width: "48%", flexGrow: 1, flexDirection: "row", alignItems: "center", gap: 10, padding: 14, minHeight: 72, borderRadius: 10, borderColor: "#E5E1DB", borderWidth: 1, backgroundColor: "white" },
  actionLabel: { flex: 1, color: "#293B35", fontSize: 14, lineHeight: 20 }, error: { color: "#B42318", marginTop: 12, lineHeight: 20 },
});
