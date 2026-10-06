import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export type BottomNavKey = "home" | "pets" | "action" | "timeline" | "alerts";

type Props = {
  active?: BottomNavKey;
  onHomePress?: () => void;
  onPetsPress?: () => void;
  onActionPress?: () => void;
  onTimelinePress?: () => void;
  onAlertsPress?: () => void;
};

export function BottomNavBar({
  active,
  onHomePress,
  onPetsPress,
  onActionPress,
  onTimelinePress,
  onAlertsPress,
}: Props) {
  return (
    <View style={styles.bottomNav}>
      <BottomNavItem icon="home-outline" label="Home" active={active === "home"} onPress={onHomePress} />
      <BottomNavItem icon="paw" label="Pets" active={active === "pets"} onPress={onPetsPress} />
      <TouchableOpacity style={styles.centerAction} onPress={onActionPress} disabled={!onActionPress}>
        <Ionicons name="sparkles" size={22} color="#FFFFFF" />
      </TouchableOpacity>
      <BottomNavItem
        icon="analytics-outline"
        label="Timeline"
        active={active === "timeline"}
        onPress={onTimelinePress}
      />
      <BottomNavItem icon="notifications" label="Alerts" active={active === "alerts"} onPress={onAlertsPress} />
    </View>
  );
}

export default BottomNavBar;

function BottomNavItem({
  icon,
  label,
  active,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  active?: boolean;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity style={styles.bottomNavItem} onPress={onPress} disabled={!onPress}>
      <Ionicons name={icon} size={19} color={active ? "#00796B" : "#3E4946"} />
      <Text style={[styles.bottomNavText, active && styles.bottomNavTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderTopColor: "#E5E1DB",
    borderTopWidth: 1,
    bottom: 0,
    flexDirection: "row",
    height: 64,
    justifyContent: "space-around",
    left: 0,
    paddingHorizontal: 12,
    position: "absolute",
    right: 0,
  },
  bottomNavItem: {
    alignItems: "center",
    gap: 3,
    justifyContent: "center",
    minWidth: 50,
  },
  bottomNavText: {
    color: "#3E4946",
    fontSize: 10,
    fontWeight: "700",
  },
  bottomNavTextActive: {
    color: "#00796B",
  },
  centerAction: {
    alignItems: "center",
    backgroundColor: "#238575",
    borderRadius: 22,
    height: 44,
    justifyContent: "center",
    marginBottom: 18,
    width: 44,
  },
});
