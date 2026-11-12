import React, { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

type Props = {
  label: string;
  placeholder: string;
  value: string;
  options: string[];
  emptyMessage: string;
  onChangeText: (value: string) => void;
  onSelect: (value: string) => void;
  onClear?: () => void;
  onFocus?: () => void;
  openKey?: string;
  activeKey?: string | null;
  onOpenChange?: (key: string | null) => void;
};

export default function SavedValueInput({
  label,
  placeholder,
  value,
  options,
  emptyMessage,
  onChangeText,
  onSelect,
  onClear,
  onFocus,
  openKey,
  activeKey,
  onOpenChange,
}: Props) {
  const [open, setOpen] = useState(false);
  const isControlled = Boolean(openKey && onOpenChange);
  const isOpen = isControlled ? activeKey === openKey : open;

  const changeOpen = (nextOpen: boolean) => {
    if (isControlled) {
      onOpenChange?.(nextOpen ? openKey ?? null : null);
      return;
    }
    setOpen(nextOpen);
  };

  const handleFocus = () => {
    // Typing a new value should never leave an old list covering the field.
    changeOpen(false);
    onFocus?.();
  };

  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputRow}>
        <TextInput
          placeholder={placeholder}
          placeholderTextColor="#3E4946"
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          onFocus={handleFocus}
        />
        <TouchableOpacity accessibilityLabel={`Show saved ${label.toLowerCase()} choices`} style={styles.toggle} onPress={() => changeOpen(!isOpen)}>
          <Ionicons name="chevron-down" size={18} color="#687076" />
        </TouchableOpacity>
      </View>
      {isOpen ? (
        <View style={styles.menu}>
          {options.length ? (
            <>
              {options.map((option) => (
                <TouchableOpacity key={option} style={styles.option} onPress={() => {
                  onSelect(option);
                  changeOpen(false);
                }}>
                  <Text style={styles.optionText}>{option}</Text>
                </TouchableOpacity>
              ))}
              {onClear ? <TouchableOpacity style={styles.clearButton} onPress={onClear}><Text style={styles.clearText}>Clear saved list</Text></TouchableOpacity> : null}
            </>
          ) : <Text style={styles.emptyText}>{emptyMessage}</Text>}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { color: "#3E4946", fontSize: 12, fontWeight: "700", marginBottom: 7 },
  inputRow: { alignItems: "center", backgroundColor: "#FFFFFF", borderColor: "#DDD8D0", borderRadius: 8, borderWidth: 1, flexDirection: "row", height: 48, marginBottom: 6 },
  input: { color: "#111827", flex: 1, fontSize: 14, height: "100%", paddingHorizontal: 14 },
  toggle: { alignItems: "center", height: "100%", justifyContent: "center", width: 44 },
  menu: { backgroundColor: "#FFFFFF", borderColor: "#DDD8D0", borderRadius: 8, borderWidth: 1, marginBottom: 18, overflow: "hidden" },
  option: { borderBottomColor: "#ECE7DF", borderBottomWidth: 1, paddingHorizontal: 12, paddingVertical: 11 },
  optionText: { color: "#111827", fontSize: 13, fontWeight: "700" },
  clearButton: { alignItems: "center", paddingVertical: 12 },
  clearText: { color: "#A74337", fontSize: 13, fontWeight: "800" },
  emptyText: { color: "#687076", fontSize: 13, lineHeight: 19, padding: 14 },
});
