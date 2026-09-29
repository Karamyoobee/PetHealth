import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { FontAwesome, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";

import { colors, spacing } from "../../theme";

WebBrowser.maybeCompleteAuthSession();

type AuthMode = "welcome" | "signup" | "signin";

type Props = {
  mode: AuthMode;
  busy: boolean;
  error?: string | null;
  onModeChange: (mode: AuthMode) => void;
  onGoogleToken: (idToken: string) => void;
};

const googleClientIds = {
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
};

function platformClientId() {
  if (Platform.OS === "ios") return googleClientIds.iosClientId;
  if (Platform.OS === "android") return googleClientIds.androidClientId;
  return googleClientIds.webClientId;
}

export function AuthScreen({ mode, busy, error, onModeChange, onGoogleToken }: Props) {
  const [localError, setLocalError] = useState<string | null>(null);
  const configuredClientId = platformClientId();
  const fallbackClientId =
    configuredClientId ?? googleClientIds.webClientId ?? googleClientIds.androidClientId ?? googleClientIds.iosClientId;

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    ...googleClientIds,
    clientId: fallbackClientId ?? "missing-google-client-id",
    selectAccount: true,
  }, {
    native: "pethealth.com:/oauthredirect",
  });

  useEffect(() => {
    if (!response) return;

    if (response.type === "success") {
      const idToken = response.params.id_token;
      if (idToken) {
        setLocalError(null);
        onGoogleToken(idToken);
      } else {
        setLocalError("Google did not return an ID token. Check the client ID setup.");
      }
    } else if (response.type === "error") {
      setLocalError(response.error?.message ?? "Google sign-in failed.");
    }
  }, [onGoogleToken, response]);

  const sharedProps = useMemo(
    () => ({
      busy,
      error: error ?? localError,
      googleDisabled: busy || !request,
      onGooglePress: () => {
        if (!configuredClientId) {
          setLocalError("Add the matching EXPO_PUBLIC_GOOGLE_*_CLIENT_ID before using Google sign-in.");
          return;
        }
        promptAsync();
      },
      onModeChange,
    }),
    [busy, configuredClientId, error, localError, onModeChange, promptAsync, request],
  );

  if (mode === "signup") {
    return <SignUpScreen {...sharedProps} />;
  }

  if (mode === "signin") {
    return <SignInScreen {...sharedProps} />;
  }

  return <WelcomeScreen {...sharedProps} />;
}

type ScreenProps = {
  busy: boolean;
  error?: string | null;
  googleDisabled: boolean;
  onGooglePress: () => void;
  onModeChange: (mode: AuthMode) => void;
};

function WelcomeScreen({ busy, error, googleDisabled, onGooglePress, onModeChange }: ScreenProps) {
  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.heroHeader}>
        <PawMark size={48} />
        <Text style={styles.title}>Welcome to Pet Health</Text>
        <Text style={styles.subtitle}>Your pet's health, all in one place.</Text>
      </View>

      <View style={styles.previewArt}>
        <Text style={styles.previewTiny}>Welcome to</Text>
        <Text style={styles.previewTitle}>Pet Health</Text>
        <View style={styles.petRow}>
          <MaterialCommunityIcons name="dog" size={64} color="#6B8F86" />
          <MaterialCommunityIcons name="cat" size={58} color="#83939C" />
        </View>
      </View>

      <View style={styles.actionBlock}>
        <GoogleButton busy={busy} disabled={googleDisabled} onPress={onGooglePress} />
        <Divider />
        <TouchableOpacity style={styles.secondaryButton} onPress={() => onModeChange("signup")}>
          <Text style={styles.secondaryButtonText}>Get Started</Text>
        </TouchableOpacity>
      </View>

      <LegalText />
      <AuthFooter text="Already have an account?" action="Sign In" onPress={() => onModeChange("signin")} />
      <ErrorText error={error} />
    </ScrollView>
  );
}

function SignUpScreen({ busy, error, googleDisabled, onGooglePress, onModeChange }: ScreenProps) {
  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <BackButton onPress={() => onModeChange("welcome")} />
      <View style={styles.centerHeader}>
        <PawMark size={44} />
        <Text style={styles.title}>Create Your Account</Text>
        <Text style={styles.subtitle}>Start managing your pet's health today.</Text>
      </View>

      <GoogleButton busy={busy} disabled={googleDisabled} onPress={onGooglePress} />
      <View style={styles.sectionRule} />

      <FeatureRow icon="shield-checkmark-outline" title="Secure & Private" text="Your pet's health data is encrypted and kept strictly confidential." />
      <FeatureRow icon="cloud-outline" title="Sync Everywhere" text="Access medical records instantly across all your trusted devices." />
      <FeatureRow icon="analytics-outline" title="Smart Health Insights" text="Track wellness trends and stay ahead of preventative care." />

      <View style={styles.footerSpacer} />
      <AuthFooter text="Already have an account?" action="Sign In" onPress={() => onModeChange("signin")} />
      <ErrorText error={error} />
    </ScrollView>
  );
}

function SignInScreen({ busy, error, googleDisabled, onGooglePress, onModeChange }: ScreenProps) {
  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <BackButton onPress={() => onModeChange("welcome")} />
      <View style={styles.centerHeader}>
        <PawMark size={74} />
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Sign in to continue managing your pet's health.</Text>
      </View>

      <GoogleButton busy={busy} disabled={googleDisabled} onPress={onGooglePress} />
      <View style={styles.sectionRule} />

      <InfoCard icon="lock-closed" title="Secure Login" text="Your pet's health data is encrypted." />
      <InfoCard icon="refresh" title="Pick Up Where You Left Off" text="Instant access to recent records." />

      <View style={styles.footerSpacer} />
      <AuthFooter text="Don't have an account?" action="Sign Up" onPress={() => onModeChange("signup")} />
      <ErrorText error={error} />
    </ScrollView>
  );
}

function PawMark({ size }: { size: number }) {
  return (
    <View style={[styles.pawMark, { width: size, height: size, borderRadius: size / 2 }]}>
      <MaterialCommunityIcons name="paw" size={Math.round(size * 0.52)} color="#00735F" />
    </View>
  );
}

function BackButton({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.backButton} onPress={onPress} accessibilityLabel="Back">
      <Ionicons name="arrow-back" size={22} color={colors.text} />
    </TouchableOpacity>
  );
}

function GoogleButton({ busy, disabled, onPress }: { busy: boolean; disabled: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity disabled={disabled} style={[styles.googleButton, disabled && styles.disabledButton]} onPress={onPress}>
      {busy ? <ActivityIndicator color={colors.white} /> : <FontAwesome name="google" size={20} color={colors.white} />}
      <Text style={styles.googleButtonText}>{busy ? "Signing in..." : "Continue with Google"}</Text>
    </TouchableOpacity>
  );
}

function Divider() {
  return (
    <View style={styles.dividerRow}>
      <View style={styles.dividerLine} />
      <Text style={styles.dividerText}>or</Text>
      <View style={styles.dividerLine} />
    </View>
  );
}

function FeatureRow({ icon, title, text }: { icon: keyof typeof Ionicons.glyphMap; title: string; text: string }) {
  return (
    <View style={styles.featureRow}>
      <View style={styles.featureIcon}>
        <Ionicons name={icon} size={19} color="#59626F" />
      </View>
      <View style={styles.featureTextBlock}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureText}>{text}</Text>
      </View>
    </View>
  );
}

function InfoCard({ icon, title, text }: { icon: keyof typeof Ionicons.glyphMap; title: string; text: string }) {
  return (
    <View style={styles.infoCard}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={20} color="#00735F" />
      </View>
      <View style={styles.featureTextBlock}>
        <Text style={styles.infoTitle}>{title}</Text>
        <Text style={styles.infoText}>{text}</Text>
      </View>
    </View>
  );
}

function LegalText() {
  return (
    <Text style={styles.legal}>
      By continuing, you agree to our <Text style={styles.linkText}>Terms of Service</Text> and{" "}
      <Text style={styles.linkText}>Privacy Policy</Text>.
    </Text>
  );
}

function AuthFooter({ text, action, onPress }: { text: string; action: string; onPress: () => void }) {
  return (
    <View style={styles.authFooter}>
      <Text style={styles.footerText}>{text} </Text>
      <Pressable onPress={onPress}>
        <Text style={styles.linkText}>{action}</Text>
      </Pressable>
    </View>
  );
}

function ErrorText({ error }: { error?: string | null }) {
  if (!error) return null;
  return <Text style={styles.errorText}>{error}</Text>;
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 28,
    paddingVertical: 26,
  },
  heroHeader: {
    alignItems: "center",
    gap: spacing.sm,
  },
  centerHeader: {
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  pawMark: {
    alignItems: "center",
    backgroundColor: "#E4F4EF",
    justifyContent: "center",
  },
  title: {
    color: "#10201F",
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: 0,
    textAlign: "center",
  },
  subtitle: {
    color: "#48525B",
    fontSize: 14,
    lineHeight: 20,
    maxWidth: 250,
    textAlign: "center",
  },
  previewArt: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "#F8FBF8",
    borderColor: "#E4E9E7",
    borderWidth: 1,
    height: 150,
    justifyContent: "center",
    marginTop: 34,
    width: 210,
  },
  previewTiny: {
    color: "#78918A",
    fontSize: 10,
    fontWeight: "700",
  },
  previewTitle: {
    color: "#589190",
    fontSize: 18,
    fontWeight: "900",
  },
  petRow: {
    alignItems: "flex-end",
    flexDirection: "row",
    marginTop: spacing.sm,
  },
  actionBlock: {
    gap: spacing.md,
    marginTop: 48,
  },
  googleButton: {
    alignItems: "center",
    backgroundColor: "#08705F",
    borderRadius: 8,
    flexDirection: "row",
    gap: spacing.md,
    height: 48,
    justifyContent: "center",
    paddingHorizontal: spacing.md,
  },
  disabledButton: {
    opacity: 0.7,
  },
  googleButtonText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "800",
  },
  secondaryButton: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: "#DDE3E0",
    borderRadius: 8,
    borderWidth: 1,
    height: 44,
    justifyContent: "center",
  },
  secondaryButtonText: {
    color: "#15211F",
    fontSize: 13,
    fontWeight: "800",
  },
  dividerRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
  },
  dividerLine: {
    backgroundColor: "#E0E5E3",
    flex: 1,
    height: 1,
  },
  dividerText: {
    color: "#66716D",
    fontSize: 12,
  },
  legal: {
    alignSelf: "center",
    color: "#4D5B58",
    fontSize: 11,
    lineHeight: 17,
    marginTop: 22,
    maxWidth: 270,
    textAlign: "center",
  },
  linkText: {
    color: "#00735F",
    fontWeight: "800",
  },
  authFooter: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
  },
  footerText: {
    color: "#31413E",
    fontSize: 13,
  },
  backButton: {
    alignItems: "center",
    height: 42,
    justifyContent: "center",
    marginLeft: -8,
    width: 42,
  },
  sectionRule: {
    backgroundColor: "#E1E7E4",
    height: 1,
    marginVertical: 28,
  },
  featureRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: 24,
  },
  featureIcon: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: "#DEE5E2",
    borderRadius: 18,
    borderWidth: 1,
    height: 36,
    justifyContent: "center",
    shadowColor: "#111827",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    width: 36,
  },
  featureTextBlock: {
    flex: 1,
  },
  featureTitle: {
    color: "#1B2624",
    fontSize: 15,
    fontWeight: "800",
  },
  featureText: {
    color: "#56625F",
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
  },
  infoCard: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: "#DEE5E2",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.md,
    shadowColor: "#111827",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  infoIcon: {
    alignItems: "center",
    backgroundColor: "#DDF4ED",
    borderRadius: 18,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  infoTitle: {
    color: "#1B2624",
    fontSize: 13,
    fontWeight: "800",
  },
  infoText: {
    color: "#56625F",
    fontSize: 11,
    lineHeight: 16,
    marginTop: 2,
  },
  footerSpacer: {
    flex: 1,
    minHeight: 40,
  },
  errorText: {
    color: colors.danger,
    fontSize: 12,
    lineHeight: 17,
    marginTop: spacing.md,
    textAlign: "center",
  },
});
