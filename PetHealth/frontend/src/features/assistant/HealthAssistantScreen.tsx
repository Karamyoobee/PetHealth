import React, { useEffect, useMemo, useRef, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { api } from "../../api/client";
import type { AssistantHistoryMessage, Pet } from "../../types";

type Props = {
  onBack?: () => void;
};

type ChatMessage = AssistantHistoryMessage & {
  id: string;
  createdAt: Date;
};

const QUICK_PROMPTS = [
  {
    label: "Symptom check",
    message: "Please review the recent symptoms and tell me what I should monitor or discuss with a vet.",
  },
  {
    label: "Nutrition",
    message: "What general nutrition questions should I discuss with my vet for this pet?",
  },
  {
    label: "Vet visit prep",
    message: "Help me prepare a short list of useful questions for our next vet visit.",
  },
];

function welcomeMessage(petName?: string): ChatMessage {
  return {
    id: `welcome-${petName ?? "pet"}`,
    role: "assistant",
    createdAt: new Date(),
    text: petName
      ? `Hello! I can help you review ${petName}'s saved health information and prepare questions for your veterinarian. What would you like to look at?`
      : "Hello! Select a pet and I can help you review saved health information and prepare questions for your veterinarian.",
  };
}

function petIcon(pet: Pet): keyof typeof Ionicons.glyphMap {
  return pet.species === "Cat" ? "logo-octocat" : "paw";
}

export function HealthAssistantScreen({ onBack }: Props) {
  const scrollRef = useRef<ScrollView>(null);
  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedPetId, setSelectedPetId] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([welcomeMessage()]);
  const [draft, setDraft] = useState("");
  const [loadingPets, setLoadingPets] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedPet = useMemo(
    () => pets.find((pet) => pet.id === selectedPetId),
    [pets, selectedPetId],
  );
  const showQuickPrompts = !messages.some((message) => message.role === "user");

  useEffect(() => {
    let mounted = true;

    api
      .listCurrentUserPets()
      .then((savedPets) => {
        if (!mounted) return;

        setPets(savedPets);
        const firstPet = savedPets[0];
        if (firstPet) {
          setSelectedPetId(firstPet.id);
          setMessages([welcomeMessage(firstPet.name)]);
        }
      })
      .catch((loadError) => {
        if (!mounted) return;
        setError(loadError instanceof Error ? loadError.message : "Could not load pets.");
      })
      .finally(() => {
        if (mounted) setLoadingPets(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  function selectPet(pet: Pet) {
    if (pet.id === selectedPetId || sending) return;
    setSelectedPetId(pet.id);
    setMessages([welcomeMessage(pet.name)]);
    setDraft("");
    setError(null);
  }

  async function sendMessage(prefilledMessage?: string) {
    const text = (prefilledMessage ?? draft).trim();
    if (!text || sending) return;

    if (!selectedPet) {
      setError("Add or select a pet before asking the assistant.");
      return;
    }

    const history: AssistantHistoryMessage[] = messages.slice(-8).map(({ role, text: historyText }) => ({
      role,
      text: historyText,
    }));
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text,
      createdAt: new Date(),
    };

    setMessages((current) => [...current, userMessage]);
    setDraft("");
    setError(null);
    setSending(true);

    try {
      const reply = await api.askHealthAssistant(selectedPet.id, text, history);
      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          text: reply.message,
          createdAt: new Date(),
        },
      ]);
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "The assistant could not respond.");
    } finally {
      setSending(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
      style={styles.screen}
    >
      <View style={styles.header}>
        <TouchableOpacity
          accessibilityLabel="Go back"
          hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}
          onPress={onBack}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={24} color="#24312E" />
        </TouchableOpacity>
        <View style={styles.headerTitleRow}>
          <View style={styles.headerIcon}>
            <Ionicons name="sparkles" size={15} color="#087F70" />
          </View>
          <Text style={styles.headerTitle}>Health Assistant</Text>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.chatContent}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.safetyNotice}>
          <Ionicons name="shield-checkmark-outline" size={17} color="#8B5A2B" />
          <Text style={styles.safetyText}>
            General guidance only. Contact a veterinarian for diagnosis, treatment, or urgent symptoms.
          </Text>
        </View>

        <View style={styles.dayPill}>
          <Text style={styles.dayPillText}>TODAY</Text>
        </View>

        {messages.map((message) => (
          <View
            key={message.id}
            style={[styles.messageRow, message.role === "user" && styles.userMessageRow]}
          >
            {message.role === "assistant" ? (
              <View style={styles.botAvatar}>
                <Ionicons name="medkit-outline" size={15} color="#087F70" />
              </View>
            ) : null}
            <View
              style={[
                styles.messageBubble,
                message.role === "user" ? styles.userBubble : styles.assistantBubble,
              ]}
            >
              <Text style={[styles.messageText, message.role === "user" && styles.userMessageText]}>
                {message.text}
              </Text>
              <Text style={[styles.messageTime, message.role === "user" && styles.userMessageTime]}>
                {message.createdAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </Text>
            </View>
          </View>
        ))}

        {showQuickPrompts ? (
          <View style={styles.quickPrompts}>
            {QUICK_PROMPTS.map((prompt) => (
              <TouchableOpacity
                key={prompt.label}
                disabled={sending || !selectedPet}
                onPress={() => void sendMessage(prompt.message)}
                style={[styles.quickPrompt, (!selectedPet || sending) && styles.controlDisabled]}
              >
                <Text style={styles.quickPromptText}>{prompt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}

        {sending ? (
          <View style={styles.messageRow}>
            <View style={styles.botAvatar}>
              <Ionicons name="medkit-outline" size={15} color="#087F70" />
            </View>
            <View style={[styles.messageBubble, styles.assistantBubble, styles.typingBubble]}>
              <ActivityIndicator color="#087F70" size="small" />
              <Text style={styles.typingText}>Reviewing {selectedPet?.name}'s information...</Text>
            </View>
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.composerArea}>
        <View style={styles.petContextRow}>
          <Text style={styles.contextLabel}>CONSULTING FOR</Text>
          {loadingPets ? <ActivityIndicator color="#087F70" size="small" /> : null}
          {!loadingPets && pets.length === 0 ? <Text style={styles.noPetText}>No pets yet</Text> : null}
        </View>

        {pets.length > 0 ? (
          <ScrollView
            horizontal
            contentContainerStyle={styles.petOptions}
            keyboardShouldPersistTaps="handled"
            showsHorizontalScrollIndicator={false}
          >
            {pets.map((pet) => {
              const selected = pet.id === selectedPetId;
              return (
                <TouchableOpacity
                  key={pet.id}
                  accessibilityState={{ selected }}
                  onPress={() => selectPet(pet)}
                  style={[styles.petChip, selected && styles.petChipSelected]}
                >
                  <Ionicons name={petIcon(pet)} size={14} color={selected ? "#087F70" : "#5B6763"} />
                  <Text style={[styles.petChipText, selected && styles.petChipTextSelected]}>{pet.name}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        ) : null}

        {error ? (
          <View style={styles.errorRow}>
            <Ionicons name="alert-circle-outline" size={16} color="#B42318" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.composerRow}>
          <TextInput
            accessibilityLabel="Message the health assistant"
            editable={!sending && Boolean(selectedPet)}
            maxLength={1200}
            multiline
            onChangeText={setDraft}
            onSubmitEditing={() => void sendMessage()}
            placeholder={selectedPet ? `Ask about ${selectedPet.name}` : "Select a pet to begin"}
            placeholderTextColor="#7A8581"
            returnKeyType="send"
            style={styles.input}
            value={draft}
          />
          <TouchableOpacity
            accessibilityLabel="Send message"
            disabled={!draft.trim() || sending || !selectedPet}
            onPress={() => void sendMessage()}
            style={[
              styles.sendButton,
              (!draft.trim() || sending || !selectedPet) && styles.sendButtonDisabled,
            ]}
          >
            {sending ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Ionicons name="arrow-up" size={22} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
        <Text style={styles.privacyText}>Avoid personal information. AI responses can be inaccurate.</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

export default HealthAssistantScreen;

const styles = StyleSheet.create({
  screen: {
    backgroundColor: "#FAF8F4",
    flex: 1,
  },
  header: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderBottomColor: "#E5E1DB",
    borderBottomWidth: 1,
    flexDirection: "row",
    height: 56,
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  backButton: {
    alignItems: "center",
    height: 36,
    justifyContent: "center",
    left: 12,
    position: "absolute",
    width: 36,
  },
  headerTitleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  headerIcon: {
    alignItems: "center",
    backgroundColor: "#E6F5F1",
    borderRadius: 8,
    height: 26,
    justifyContent: "center",
    width: 26,
  },
  headerTitle: {
    color: "#24312E",
    fontSize: 16,
    fontWeight: "800",
  },
  chatContent: {
    flexGrow: 1,
    paddingBottom: 20,
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  safetyNotice: {
    alignItems: "flex-start",
    backgroundColor: "#FFF4E8",
    borderColor: "#F0D3B5",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    padding: 10,
  },
  safetyText: {
    color: "#6E4A27",
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
  },
  dayPill: {
    alignSelf: "center",
    backgroundColor: "#E6F5F1",
    borderRadius: 8,
    marginBottom: 16,
    marginTop: 14,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  dayPillText: {
    color: "#5C716B",
    fontSize: 10,
    fontWeight: "800",
  },
  messageRow: {
    alignItems: "flex-end",
    alignSelf: "stretch",
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  userMessageRow: {
    justifyContent: "flex-end",
  },
  botAvatar: {
    alignItems: "center",
    backgroundColor: "#E6F5F1",
    borderRadius: 8,
    height: 30,
    justifyContent: "center",
    width: 30,
  },
  messageBubble: {
    borderRadius: 8,
    maxWidth: "82%",
    minWidth: 88,
    paddingHorizontal: 13,
    paddingVertical: 10,
  },
  assistantBubble: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E2DED7",
    borderWidth: 1,
  },
  userBubble: {
    backgroundColor: "#087F70",
    borderBottomRightRadius: 2,
  },
  messageText: {
    color: "#35413E",
    fontSize: 14,
    lineHeight: 20,
  },
  userMessageText: {
    color: "#FFFFFF",
  },
  messageTime: {
    alignSelf: "flex-end",
    color: "#8A938F",
    fontSize: 9,
    marginTop: 6,
  },
  userMessageTime: {
    color: "#D5EEE8",
  },
  quickPrompts: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
    marginLeft: 38,
  },
  quickPrompt: {
    backgroundColor: "#E6F5F1",
    borderColor: "#C8E6DE",
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  quickPromptText: {
    color: "#087F70",
    fontSize: 12,
    fontWeight: "700",
  },
  controlDisabled: {
    opacity: 0.45,
  },
  typingBubble: {
    alignItems: "center",
    flexDirection: "row",
    gap: 9,
  },
  typingText: {
    color: "#5B6763",
    fontSize: 12,
  },
  composerArea: {
    backgroundColor: "#FFFFFF",
    borderTopColor: "#E5E1DB",
    borderTopWidth: 1,
    paddingBottom: Platform.OS === "ios" ? 10 : 8,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  petContextRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    minHeight: 20,
  },
  contextLabel: {
    color: "#77827E",
    fontSize: 10,
    fontWeight: "800",
  },
  noPetText: {
    color: "#5B6763",
    fontSize: 12,
  },
  petOptions: {
    gap: 8,
    paddingBottom: 9,
    paddingTop: 7,
  },
  petChip: {
    alignItems: "center",
    backgroundColor: "#F3F5F4",
    borderColor: "#E0E5E3",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  petChipSelected: {
    backgroundColor: "#E6F5F1",
    borderColor: "#B8DED5",
  },
  petChipText: {
    color: "#5B6763",
    fontSize: 12,
    fontWeight: "700",
  },
  petChipTextSelected: {
    color: "#087F70",
  },
  errorRow: {
    alignItems: "flex-start",
    backgroundColor: "#FFF0EE",
    borderRadius: 8,
    flexDirection: "row",
    gap: 7,
    marginBottom: 8,
    padding: 8,
  },
  errorText: {
    color: "#B42318",
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
  },
  composerRow: {
    alignItems: "flex-end",
    flexDirection: "row",
    gap: 9,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderColor: "#DCD8D2",
    borderRadius: 8,
    borderWidth: 1,
    color: "#24312E",
    flex: 1,
    fontSize: 14,
    maxHeight: 96,
    minHeight: 44,
    paddingHorizontal: 13,
    paddingVertical: 10,
  },
  sendButton: {
    alignItems: "center",
    backgroundColor: "#F29A4A",
    borderRadius: 8,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  sendButtonDisabled: {
    backgroundColor: "#D8B899",
  },
  privacyText: {
    color: "#77827E",
    fontSize: 10,
    marginTop: 7,
    textAlign: "center",
  },
});
