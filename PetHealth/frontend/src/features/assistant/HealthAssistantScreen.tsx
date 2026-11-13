import React, { useEffect, useMemo, useRef, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import * as Crypto from "expo-crypto";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { api } from "../../api/client";
import type { AssistantHistoryMessage, Pet, SavedAssistantMessage } from "../../types";
import { findVet, possibleEmergency } from "./emergency";

type Props = {
  onBack?: () => void;
};

type ChatMessage = AssistantHistoryMessage & {
  id: string;
  createdAt: Date;
  vetSearch?: "nearby" | "emergency";
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

function savedMessages(messages: SavedAssistantMessage[]): ChatMessage[] {
  return messages.map((message) => ({ ...message, createdAt: new Date(message.createdAt) }));
}

export function HealthAssistantScreen({ onBack }: Props) {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const chatRequest = useRef(0);
  const contentHeight = useRef(0);
  const scrollOffset = useRef(0);
  const olderAnchor = useRef<{ height: number; offset: number } | null>(null);
  const autoScroll = useRef(true);
  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedPetId, setSelectedPetId] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([welcomeMessage()]);
  const [draft, setDraft] = useState("");
  const [loadingPets, setLoadingPets] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emergency, setEmergency] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [conversationVersion, setConversationVersion] = useState(0);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [historyRetry, setHistoryRetry] = useState(0);

  const selectedPet = useMemo(
    () => pets.find((pet) => pet.id === selectedPetId),
    [pets, selectedPetId],
  );
  const showQuickPrompts = !messages.some((message) => message.role === "user");
  const canSend = Boolean(selectedPet) && historyLoaded && !loadingHistory && !sending && !clearing;

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

  useEffect(() => {
    const requestId = ++chatRequest.current;
    if (!selectedPet) return;
    setLoadingHistory(true);
    setHistoryLoaded(false);
    setLoadingOlder(false);
    setError(null);
    autoScroll.current = true;
    olderAnchor.current = null;
    api.getAssistantChat(selectedPet.id)
      .then((conversation) => {
        if (requestId !== chatRequest.current) return;
        const saved = savedMessages(conversation.messages);
        setMessages(saved.length ? saved : [welcomeMessage(selectedPet.name)]);
        setConversationVersion(conversation.conversationVersion);
        setNextCursor(conversation.nextCursor);
        setHistoryLoaded(true);
      })
      .catch((loadError) => {
        if (requestId === chatRequest.current) setError(loadError instanceof Error ? loadError.message : "Could not load this conversation.");
      })
      .finally(() => {
        if (requestId === chatRequest.current) setLoadingHistory(false);
      });
    return () => { chatRequest.current += 1; };
  }, [selectedPet, historyRetry]);

  async function loadOlderMessages() {
    // Keep the reading position when earlier messages are added above the chat.
    if (!selectedPet || !nextCursor || loadingOlder || sending || clearing) return;
    const requestId = chatRequest.current;
    setLoadingOlder(true);
    autoScroll.current = false;
    try {
      const conversation = await api.getAssistantChat(selectedPet.id, nextCursor);
      if (requestId !== chatRequest.current) return;
      if (conversation.conversationVersion !== conversationVersion) {
        setHistoryRetry((current) => current + 1);
        return;
      }
      olderAnchor.current = { height: contentHeight.current, offset: scrollOffset.current };
      setMessages((current) => [...savedMessages(conversation.messages), ...current]);
      setNextCursor(conversation.nextCursor);
    } catch (loadError) {
      if (requestId === chatRequest.current) setError(loadError instanceof Error ? loadError.message : "Could not load older messages.");
    } finally {
      if (requestId === chatRequest.current) setLoadingOlder(false);
    }
  }

  function confirmClearConversation() {
    // Ask before deleting saved messages, and keep health records untouched.
    if (!selectedPet || sending || clearing || !historyLoaded) return;
    const requestId = chatRequest.current;
    Alert.alert("Clear conversation?", `This will delete the saved chat for ${selectedPet.name}. Their health records will stay saved.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Clear", style: "destructive", onPress: async () => {
        if (requestId !== chatRequest.current) return;
        const clearRequest = ++chatRequest.current;
        setClearing(true);
        setError(null);
        try {
          const result = await api.clearAssistantChat(selectedPet.id, conversationVersion);
          if (clearRequest !== chatRequest.current) return;
          setMessages([welcomeMessage(selectedPet.name)]);
          autoScroll.current = true;
          setConversationVersion(result.conversationVersion);
          setNextCursor(null);
          setEmergency(false);
          setDraft("");
        } catch (clearError) {
          if (clearRequest === chatRequest.current) {
            setError(clearError instanceof Error ? clearError.message : "Could not clear this conversation.");
            setHistoryLoaded(false);
          }
        } finally {
          if (clearRequest === chatRequest.current) { setClearing(false); setLoadingOlder(false); }
        }
      } },
    ]);
  }

  function selectPet(pet: Pet) {
    // Each pet has its own conversation, so clear the previous pet's screen state.
    if (pet.id === selectedPetId || sending || clearing) return;
    chatRequest.current += 1;
    setSelectedPetId(pet.id);
    setMessages([welcomeMessage(pet.name)]);
    setDraft("");
    setError(null);
    setEmergency(false);
    setHistoryLoaded(false);
    setNextCursor(null);
  }

  async function openVetSearch(emergencySearch = false) {
    // Show a helpful message if neither Maps nor the browser can open.
    try {
      await findVet(emergencySearch);
    } catch {
      setError("Could not open Maps. Please search for a nearby veterinarian in your browser.");
    }
  }

  async function sendMessage(prefilledMessage?: string) {
    // Give each send an ID so the server can recognise repeated requests.
    const text = (prefilledMessage ?? draft).trim();
    if (!text || sending || clearing || !historyLoaded) return;

    if (!selectedPet) {
      setError("Add or select a pet before asking the assistant.");
      return;
    }

    const requestId = chatRequest.current;
    const messageId = Crypto.randomUUID();
    autoScroll.current = true;
    const userMessage: ChatMessage = {
      id: messageId,
      role: "user",
      text,
      createdAt: new Date(),
    };

    setMessages((current) => [...current, userMessage]);
    setDraft("");
    setError(null);
    setSending(true);
    const urgent = possibleEmergency(text);
    if (urgent) setEmergency(true);

    try {
      const reply = await api.askHealthAssistant(selectedPet.id, text, conversationVersion, messageId);
      if (requestId !== chatRequest.current) return;
      if (reply.isEmergency) setEmergency(true);
      setMessages((current) => [...current.filter((message) => message.id !== messageId && !message.id.startsWith("welcome-")), ...savedMessages(reply.messages)]);
      setConversationVersion(reply.conversationVersion);
    } catch (sendError) {
      if (requestId === chatRequest.current) {
        setError(`${sendError instanceof Error ? sendError.message : "The assistant could not respond."} Reload the conversation before trying again.`);
        setHistoryLoaded(false);
      }
    } finally {
      if (requestId === chatRequest.current) setSending(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
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
        <TouchableOpacity
          accessibilityLabel="Clear conversation"
          accessibilityRole="button"
          disabled={!historyLoaded || sending || clearing || !messages.some((message) => message.role === "user")}
          onPress={confirmClearConversation}
          style={styles.clearButton}
          hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
        >
          {clearing ? <ActivityIndicator color="#087F70" size="small" /> : (
            <Ionicons name="trash-outline" size={20} color={historyLoaded && !sending && messages.some((message) => message.role === "user") ? "#5B6763" : "#C8D0CD"} />
          )}
        </TouchableOpacity>
      </View>

      {emergency ? (
        <View accessibilityRole="alert" style={styles.emergencyNotice}>
          <View style={styles.emergencyIcon}>
            <Ionicons name="alert-circle-outline" size={20} color="#8B5A2B" />
          </View>
          <View style={styles.emergencyContent}>
            <View style={styles.emergencyHeader}>
              <Text style={styles.emergencyTitle}>Possible pet emergency</Text>
              <TouchableOpacity
                accessibilityLabel="Close emergency notice"
                accessibilityRole="button"
                hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
                onPress={() => setEmergency(false)}
                style={styles.dismissEmergencyButton}
              >
                <Ionicons name="close" size={18} color="#5B6763" />
              </TouchableOpacity>
            </View>
            <Text style={styles.emergencyText}>
              Contact an emergency vet now. Call ahead to confirm the clinic is open and can help.
            </Text>
            <TouchableOpacity accessibilityRole="button" onPress={() => void openVetSearch(true)} style={styles.emergencyButton}>
              <Ionicons name="location-outline" size={16} color="#087F70" />
              <Text style={styles.emergencyButtonText}>Find an emergency vet</Text>
              <Ionicons name="arrow-forward" size={15} color="#087F70" />
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.chatContent}
        keyboardShouldPersistTaps="handled"
        onScroll={(event) => { scrollOffset.current = event.nativeEvent.contentOffset.y; }}
        scrollEventThrottle={16}
        onContentSizeChange={(_width, height) => {
          contentHeight.current = height;
          if (olderAnchor.current) {
            scrollRef.current?.scrollTo({ y: olderAnchor.current.offset + height - olderAnchor.current.height, animated: false });
            olderAnchor.current = null;
          } else if (autoScroll.current) scrollRef.current?.scrollToEnd({ animated: true });
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.safetyNotice}>
          <Ionicons name="shield-checkmark-outline" size={17} color="#8B5A2B" />
          <Text style={styles.safetyText}>
            General guidance only. Contact a veterinarian for diagnosis, treatment, or urgent symptoms.
          </Text>
        </View>

        <View style={styles.dayPill}>
          <Text style={styles.dayPillText}>CONVERSATION</Text>
        </View>

        {loadingHistory ? <ActivityIndicator accessibilityLabel="Loading conversation" color="#087F70" /> : null}
        {nextCursor ? (
          <TouchableOpacity accessibilityRole="button" disabled={loadingOlder || sending || clearing} onPress={() => void loadOlderMessages()} style={styles.historyButton}>
            <Text style={styles.quickPromptText}>{loadingOlder ? "Loading..." : "Load older messages"}</Text>
          </TouchableOpacity>
        ) : null}

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
              {message.vetSearch ? (
                <TouchableOpacity
                  accessibilityRole="button"
                  onPress={() => void openVetSearch(message.vetSearch === "emergency")}
                  style={styles.quickPrompt}
                >
                  <Text style={styles.quickPromptText}>
                    {message.vetSearch === "emergency" ? "Find an emergency vet" : "Find nearby vets"}
                  </Text>
                </TouchableOpacity>
              ) : null}
              <Text style={[styles.messageTime, message.role === "user" && styles.userMessageTime]}>
                {message.createdAt.toDateString() !== new Date().toDateString() ? `${message.createdAt.toLocaleDateString()} · ` : ""}
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
                disabled={!canSend}
                onPress={() => void sendMessage(prompt.message)}
                style={[styles.quickPrompt, !canSend && styles.controlDisabled]}
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

      {/* Leave room for the phone navigation area when the keyboard is closed. */}
      <View style={[styles.composerArea, { paddingBottom: 8 + insets.bottom }]}>
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
                  accessibilityRole="button"
                  accessibilityLabel={`Select ${pet.name}`}
                  accessibilityState={{ selected, disabled: sending || clearing }}
                  disabled={sending || clearing}
                  onPress={() => selectPet(pet)}
                  style={[styles.petChip, selected && styles.petChipSelected]}
                >
                  <Ionicons name={petIcon(pet)} size={14} color={selected ? "#FFFFFF" : "#5B6763"} />
                  <Text style={[styles.petChipText, selected && styles.petChipTextSelected]}>{pet.name}</Text>
                  <View style={styles.petSelectionMark}>
                    {selected ? <Ionicons name="checkmark-circle" size={14} color="#FFFFFF" /> : null}
                  </View>
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
        {selectedPet && !historyLoaded && !loadingHistory ? (
          <TouchableOpacity accessibilityRole="button" onPress={() => setHistoryRetry((current) => current + 1)} style={styles.historyButton}>
            <Text style={styles.quickPromptText}>Reload conversation</Text>
          </TouchableOpacity>
        ) : null}

        <View style={styles.composerRow}>
          <TextInput
            accessibilityLabel="Message the health assistant"
            editable={canSend}
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
            disabled={!draft.trim() || !canSend}
            onPress={() => void sendMessage()}
            style={[
              styles.sendButton,
              (!draft.trim() || !canSend) && styles.sendButtonDisabled,
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
  clearButton: {
    position: "absolute",
    right: 16,
    padding: 6,
  },
  historyButton: {
    alignSelf: "center",
    padding: 10,
    marginBottom: 8,
  },
  emergencyNotice: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E1DB",
    borderLeftColor: "#F0D3B5",
    borderLeftWidth: 3,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    padding: 12,
    gap: 10,
  },
  emergencyIcon: {
    alignItems: "center",
    backgroundColor: "#FFF4E8",
    borderRadius: 16,
    height: 32,
    justifyContent: "center",
    width: 32,
  },
  emergencyContent: {
    flex: 1,
    gap: 8,
  },
  emergencyHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dismissEmergencyButton: {
    alignItems: "center",
    height: 28,
    justifyContent: "center",
    width: 28,
  },
  emergencyTitle: {
    color: "#24312E",
    fontSize: 14,
    fontWeight: "700",
  },
  emergencyText: {
    color: "#35413E",
    fontSize: 12,
    lineHeight: 17,
  },
  emergencyButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#E6F5F1",
    borderColor: "#C8E6DE",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 7,
  },
  emergencyButtonText: {
    color: "#087F70",
    flexShrink: 1,
    fontSize: 12,
    fontWeight: "700",
  },
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
    paddingTop: 8,
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
    paddingBottom: 6,
    paddingTop: 4,
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
    paddingVertical: 5,
  },
  petChipSelected: {
    backgroundColor: "#087F70",
    borderColor: "#087F70",
  },
  petSelectionMark: {
    width: 14,
    height: 14,
  },
  petChipText: {
    color: "#5B6763",
    fontSize: 12,
    fontWeight: "700",
  },
  petChipTextSelected: {
    color: "#FFFFFF",
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
    maxHeight: 80,
    minHeight: 42,
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
  sendButton: {
    alignItems: "center",
    backgroundColor: "#F29A4A",
    borderRadius: 8,
    height: 42,
    justifyContent: "center",
    width: 42,
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
