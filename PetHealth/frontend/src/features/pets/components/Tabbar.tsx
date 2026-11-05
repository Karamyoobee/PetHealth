//Main Bottom Navigation Bar - shown on all main application screens
import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";//React Native UI components and style

//Five main tabs: easily mark the one which screen is active
export type BottomNavKey = "home" | "pets" | "action" | "timeline" | "alerts";

//Navigation Bar Props
type Props = {
  active?: BottomNavKey;//Tab that is being highlighted
  onHomePress?: () => void;//Home Button
  onPetsPress?: () => void;//Mypets Screen Button
  onActionPress?: () => void;//AI Health Assistant Button
  onTimelinePress?: () => void;//Timeline Screen Button
  onAlertsPress?: () => void;//Alets Button
};

//Reusable Navigation bar components (4 Main Tab Items (Buttons))
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
      {/*Left-Side Tabs of Navigation bar */}
      <BottomNavItem icon="home-outline" label="Home" active={active === "home"} onPress={onHomePress} />
      <BottomNavItem icon="paw" label="Pets" active={active === "pets"} onPress={onPetsPress} />
     {/*Centered Action (AI Health Assistant Button)*/}
      <TouchableOpacity style={styles.centerAction} onPress={onActionPress} disabled={!onActionPress}>
        <Ionicons name="sparkles" size={22} color="#FFFFFF" />
      </TouchableOpacity>
      {/*Timeline Button - Right Tab Buttons */}
      <BottomNavItem
        icon="analytics-outline"
        label="Timeline"
        active={active === "timeline"}
        onPress={onTimelinePress}
      />
      {/*Alert Button - View Notifications or Reminders Screen */}
      <BottomNavItem icon="notifications" label="Alerts" active={active === "alerts"} onPress={onAlertsPress} />
    </View>
  );
}

//Default export for navigation bar that can be imported anywhere (inside project)
export default BottomNavBar;

//1 Tab Item: icon with label
function BottomNavItem({
  icon,
  label,
  active,
  onPress,
}: {
  //Icons restricted to be valid as Ionicons names
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  active?: boolean;
  onPress?: () => void;
}) {
  return ( //Only display when no handler - avoid pressing by accident
    <TouchableOpacity style={styles.bottomNavItem} onPress={onPress} disabled={!onPress}>
      {/* Change Icon color to green (active) | grey (inactive) */}
      <Ionicons name={icon} size={19} color={active ? "#00796B" : "#3E4946"} />
      {/* Active Style for when active is true */}
      <Text style={[styles.bottomNavText, active && styles.bottomNavTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

//Main Style Sheet
const styles = StyleSheet.create({
  //Navigation bar sticked to the bottom of the screen, full width
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

  //Stacked Icon above label - centered
  bottomNavItem: {
    alignItems: "center",
    gap: 3,
    justifyContent: "center",
    minWidth: 50,
  },

  //Default (inactive) label style
  bottomNavText: {
    color: "#3E4946",
    fontSize: 10,
    fontWeight: "700",
  },

  //Label color - changes color when active
  bottomNavTextActive: {
    color: "#00796B",
  },
  
  //Centered round button: marginBottom is above other tabs
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