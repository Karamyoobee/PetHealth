import React, { useEffect, useRef, useState } from "react";
import { Platform, StyleSheet, Text, ToastAndroid, View } from "react-native";

let displayToast: ((message: string) => void) | null = null;

export function showToast(message: string) {
  // Use Android's own toast and the app message on other platforms.
  if (Platform.OS === "android") {
    ToastAndroid.show(message, ToastAndroid.LONG);
  } else {
    displayToast?.(message);
  }
}

export default function Toast() {
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    displayToast = (value) => {
      if (timer.current) clearTimeout(timer.current);
      setMessage(value);
      timer.current = setTimeout(() => setMessage(null), 4000);
    };
    return () => {
      displayToast = null;
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  if (!message) return null;
  return (
    <View pointerEvents="none" style={styles.toast} accessibilityLiveRegion="polite">
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  toast: {
    backgroundColor: "#00796B",
    borderRadius: 8,
    bottom: 100,
    left: 20,
    padding: 14,
    position: "absolute",
    right: 20,
  },
  text: {
    color: "#FFFFFF",
    fontSize: 13,
    textAlign: "center",
  },
});
