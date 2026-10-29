import React, { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { FontAwesome, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";

import { colors, spacing } from "../../theme";
import { api, ApiError } from "../../api/client";
import type { AuthSession } from "../../types";

WebBrowser.maybeCompleteAuthSession();

type AuthMode = "welcome" | "signin" | "register";
const passwordRequirement = "Include at least one special character, such as @, #, $ or !.";

function hasSpecialCharacter(password: string) {
  const specialCharacters = "!@#$%^&*()-_=+[]{};:'\",.<>/?\\|`~";
  return Array.from(password).some((character) => specialCharacters.includes(character));
}

type Props = {
  mode: AuthMode;
  busy: boolean;
  error?: string | null;
  onModeChange: (mode: AuthMode) => void;
  onGoogleToken: (idToken: string, allowRegistration: boolean) => void;
  onPasswordLogin: (email: string, password: string) => Promise<void>;
  onRegistrationComplete: (session: AuthSession) => Promise<void>;
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

export function AuthScreen({ mode, busy, error, onModeChange, onGoogleToken, onPasswordLogin, onRegistrationComplete }: Props) {
  const [localError, setLocalError] = useState<string | null>(null);
  const [googlePending, setGooglePending] = useState(false);
  const allowRegistration = useRef(false);
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
    setGooglePending(false);

    if (response.type === "success") {
      const idToken = response.params.id_token;
      if (idToken) {
        setLocalError(null);
        onGoogleToken(idToken, allowRegistration.current);
      } else {
        setLocalError("Google did not return an ID token. Check the client ID setup.");
      }
    } else if (response.type === "error") {
      setLocalError(response.error?.message ?? "Google sign-in failed.");
    }
  }, [onGoogleToken, response]);

  const sharedProps = useMemo(
    () => ({
      busy: busy || googlePending,
      error: error ?? localError,
      googleDisabled: busy || googlePending || !request,
      onGooglePress: () => {
        if (!configuredClientId) {
          setLocalError("Add the matching EXPO_PUBLIC_GOOGLE_*_CLIENT_ID before using Google sign-in.");
          return;
        }
        setLocalError(null);
        allowRegistration.current = mode === "welcome";
        setGooglePending(true);
        promptAsync().catch(() => {
          setGooglePending(false);
          setLocalError("Could not open Google sign-in. Please try again.");
        });
      },
      onModeChange: (nextMode: AuthMode) => {
        setLocalError(null);
        onModeChange(nextMode);
      },
    }),
    [busy, configuredClientId, error, googlePending, localError, mode, onModeChange, promptAsync, request],
  );

  if (mode === "register") {
    return <RegistrationScreen onModeChange={sharedProps.onModeChange} onComplete={onRegistrationComplete} />;
  }

  if (mode === "signin") {
    return <SignInScreen {...sharedProps} onPasswordLogin={onPasswordLogin} />;
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
        <TouchableOpacity disabled={busy} style={styles.secondaryButton} onPress={() => onModeChange("register")}>
          <Text style={styles.secondaryButtonText}>Get Started</Text>
        </TouchableOpacity>
      </View>

      <LegalText />
      <AuthFooter text="Already have an account?" action="Sign In" onPress={() => onModeChange("signin")} />
      <ErrorText error={error} />
    </ScrollView>
  );
}

type RegistrationProps = {
  onModeChange: (mode: AuthMode) => void;
  onComplete: (session: AuthSession) => Promise<void>;
};

function RegistrationScreen({ onModeChange, onComplete }: RegistrationProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [code, setCode] = useState("");
  const [challengeId, setChallengeId] = useState("");
  const [verifiedSession, setVerifiedSession] = useState<AuthSession | null>(null);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const register = async () => {
    if (working) return;
    setError(null);
    if (!challengeId && !verifiedSession) {
      if (!name.trim() || !email.trim()) {
        setError("Enter your name and email address.");
        return;
      }
      if (!hasSpecialCharacter(password)) {
        setError(passwordRequirement);
        return;
      }
      if (password !== confirmPassword) {
        setError("The passwords do not match.");
        return;
      }
    } else if (!verifiedSession && !/^\d{8}$/.test(code)) {
      setError("Enter the eight-digit verification code from your email.");
      return;
    }

    setWorking(true);
    try {
      if (verifiedSession) {
        await onComplete(verifiedSession);
      } else if (challengeId) {
        const session = await api.verifyRegistration(email.trim(), challengeId, code);
        setVerifiedSession(session);
        setCode("");
        setMessage("Your email is verified. Continue to Home.");
        await onComplete(session);
      } else {
        const result = await api.requestRegistrationCode(name.trim(), email.trim(), password);
        setChallengeId(result.challengeId);
        setMessage(result.message);
        setPassword("");
        setConfirmPassword("");
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 409 && !verifiedSession) {
        setChallengeId("");
        setCode("");
        setMessage(null);
      }
      setError(err instanceof Error ? err.message : "Could not complete registration. Please try again.");
    } finally {
      setWorking(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
      <BackButton onPress={() => { if (!working) onModeChange("welcome"); }} />
      <View style={styles.centerHeader}>
        <PawMark size={74} />
        <Text style={styles.title}>Create Your Account</Text>
        <Text style={styles.subtitle}>Start managing your pet's health today.</Text>
      </View>
      <View style={styles.sectionRule} />

      <View style={styles.passwordForm}>
        {challengeId ? (
          <>
            <Text style={styles.infoTitle}>Verify your email</Text>
            <Text style={styles.infoText}>Enter the code sent to {email.trim()}. It expires in 10 minutes.</Text>
            {!verifiedSession ? (
              <TextInput
                accessibilityLabel="Registration verification code"
                style={styles.input}
                value={code}
                onChangeText={setCode}
                editable={!working}
                keyboardType="number-pad"
                maxLength={8}
                autoComplete="one-time-code"
                placeholder="Eight-digit code"
                placeholderTextColor="#66716D"
              />
            ) : null}
          </>
        ) : (
          <>
            <Text style={styles.inputLabel}>Name</Text>
            <TextInput
              accessibilityLabel="Name"
              style={styles.input}
              value={name}
              onChangeText={setName}
              editable={!working}
              maxLength={80}
              autoComplete="name"
              placeholder="Your name"
              placeholderTextColor="#66716D"
            />
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              accessibilityLabel="Email"
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              editable={!working}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              placeholder="Email address"
              placeholderTextColor="#66716D"
            />
            <Text style={styles.inputLabel}>Password</Text>
            <TextInput
              accessibilityLabel="Password"
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              editable={!working}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="new-password"
              placeholder="Create a password"
              placeholderTextColor="#66716D"
            />
            {!hasSpecialCharacter(password) ? <Text accessibilityLiveRegion="polite" style={styles.messageText}>{passwordRequirement}</Text> : null}
            <Text style={styles.inputLabel}>Confirm password</Text>
            <TextInput
              accessibilityLabel="Confirm password"
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              editable={!working}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="new-password"
              placeholder="Repeat your password"
              placeholderTextColor="#66716D"
            />
          </>
        )}
        <TouchableOpacity accessibilityRole="button" disabled={working} style={[styles.googleButton, working && styles.disabledButton]} onPress={register}>
          {working ? <ActivityIndicator color={colors.white} /> : null}
          <Text style={styles.googleButtonText}>
            {working ? "Please wait..." : verifiedSession ? "Continue to Home" : challengeId ? "Verify and Continue" : "Send Verification Code"}
          </Text>
        </TouchableOpacity>
        {challengeId && !verifiedSession ? (
          <TouchableOpacity disabled={working} onPress={() => {
            setChallengeId("");
            setCode("");
            setError(null);
            setMessage("Enter your details again to request a new code.");
          }}>
            <Text style={styles.linkText}>Change Details / Request New Code</Text>
          </TouchableOpacity>
        ) : null}
        {message ? <Text accessibilityLiveRegion="polite" style={styles.messageText}>{message}</Text> : null}
        <ErrorText error={error} />
      </View>

      <LegalText />
      <AuthFooter text="Already have an account?" action="Sign In" onPress={() => { if (!working) onModeChange("signin"); }} />
    </ScrollView>
  );
}

type SignInProps = ScreenProps & {
  onPasswordLogin: (email: string, password: string) => Promise<void>;
};

function SignInScreen({ busy, error, googleDisabled, onGooglePress, onModeChange, onPasswordLogin }: SignInProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [code, setCode] = useState("");
  const [challengeId, setChallengeId] = useState("");
  const [step, setStep] = useState<"login" | "request" | "reset">("login");
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const disabled = busy || working;

  const changeStep = (nextStep: "login" | "request") => {
    setStep(nextStep);
    setPassword("");
    setConfirmPassword("");
    setCode("");
    setChallengeId("");
    setFormError(null);
    setMessage(null);
  };

  const submitPassword = async () => {
    if (disabled) return;
    setFormError(null);
    setMessage(null);
    if (!email.trim()) {
      setFormError("Enter your registered email address.");
      return;
    }
    if (step === "login" && !password) {
      setFormError("Enter the Pet Health password you chose when registering.");
      return;
    }
    if (step === "reset") {
      if (!/^\d{8}$/.test(code)) {
        setFormError("Enter the eight-digit code from your email.");
        return;
      }
      if (!hasSpecialCharacter(password)) {
        setFormError(passwordRequirement);
        return;
      }
      if (password !== confirmPassword) {
        setFormError("The passwords do not match.");
        return;
      }
    }

    setWorking(true);
    try {
      if (step === "login") {
        await onPasswordLogin(email.trim(), password);
      } else if (step === "request") {
        const result = await api.requestPasswordCode(email.trim());
        setChallengeId(result.challengeId);
        setMessage(result.message);
        setStep("reset");
      } else {
        const result = await api.resetPassword(email.trim(), challengeId, code, password);
        changeStep("login");
        setMessage(result.message);
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not complete the request. Please try again.");
    } finally {
      setWorking(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
      <BackButton onPress={() => { if (!disabled) onModeChange("welcome"); }} />
      <View style={styles.centerHeader}>
        <PawMark size={74} />
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Sign in to continue managing your pet's health.</Text>
      </View>

      <GoogleButton busy={busy} disabled={googleDisabled || working} onPress={onGooglePress} />
      <View style={styles.sectionRule} />

      <View style={styles.passwordForm}>
        <Text style={styles.infoTitle}>{step === "login" ? "Sign in with email" : "Reset your password"}</Text>
        <Text style={styles.infoText}>Use your registered email and Pet Health password. Google-only accounts can continue with Google.</Text>
        <Text style={styles.inputLabel}>Email</Text>
        <TextInput
          accessibilityLabel="Email"
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          editable={!disabled && step !== "reset"}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          placeholder="Email address"
          placeholderTextColor="#66716D"
        />
        {step === "reset" ? (
          <>
            <Text style={styles.inputLabel}>Email code</Text>
            <TextInput
              accessibilityLabel="Email verification code"
              style={styles.input}
              value={code}
              onChangeText={setCode}
              editable={!disabled}
              keyboardType="number-pad"
              maxLength={8}
              autoComplete="one-time-code"
              placeholder="Eight-digit code"
              placeholderTextColor="#66716D"
            />
          </>
        ) : null}
        {step !== "request" ? (
          <>
            <Text style={styles.inputLabel}>{step === "reset" ? "New Pet Health password" : "Password"}</Text>
            <TextInput
              accessibilityLabel={step === "reset" ? "New password" : "Password"}
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              editable={!disabled}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete={step === "reset" ? "new-password" : "current-password"}
              placeholder={step === "reset" ? "Create a new password" : "Pet Health password"}
              placeholderTextColor="#66716D"
            />
            {step === "reset" && !hasSpecialCharacter(password) ? <Text accessibilityLiveRegion="polite" style={styles.messageText}>{passwordRequirement}</Text> : null}
          </>
        ) : null}
        {step === "reset" ? (
          <>
            <Text style={styles.inputLabel}>Confirm password</Text>
            <TextInput
              accessibilityLabel="Confirm password"
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              editable={!disabled}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="new-password"
              placeholder="Repeat new password"
              placeholderTextColor="#66716D"
            />
          </>
        ) : null}
        <TouchableOpacity
          accessibilityRole="button"
          disabled={disabled}
          style={[styles.googleButton, disabled && styles.disabledButton]}
          onPress={submitPassword}
        >
          {working ? <ActivityIndicator color={colors.white} /> : null}
          <Text style={styles.googleButtonText}>
            {working ? "Please wait..." : step === "login" ? "Sign In" : step === "request" ? "Send Code" : "Save Password"}
          </Text>
        </TouchableOpacity>
        {step === "login" ? (
          <View style={styles.passwordLinks}>
            <TouchableOpacity disabled={disabled} onPress={() => changeStep("request")}>
              <Text style={styles.linkText}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.passwordLinks}>
            <TouchableOpacity disabled={disabled} onPress={() => changeStep("login")}>
              <Text style={styles.linkText}>Back to Sign In</Text>
            </TouchableOpacity>
            {step === "reset" ? (
              <TouchableOpacity disabled={disabled} onPress={() => changeStep("request")}>
                <Text style={styles.linkText}>Request New Code</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        )}
        {message ? <Text accessibilityLiveRegion="polite" style={styles.messageText}>{message}</Text> : null}
        <ErrorText error={formError} />
      </View>

      <InfoCard icon="lock-closed" title="Secure Login" text="Your pet's health data is encrypted." />
      <InfoCard icon="refresh" title="Pick Up Where You Left Off" text="Instant access to recent records." />

      <View style={styles.footerSpacer} />
      <AuthFooter text="Don't have an account?" action="Get Started" onPress={() => { if (!disabled) onModeChange("register"); }} />
      <ErrorText error={message ? null : error} />
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
  passwordForm: {
    gap: spacing.sm,
    marginBottom: 24,
  },
  inputLabel: {
    color: "#31413E",
    fontSize: 13,
    fontWeight: "700",
    marginTop: spacing.xs,
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: "#DDE3E0",
    borderRadius: 8,
    borderWidth: 1,
    color: "#15211F",
    minHeight: 48,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 14,
  },
  passwordLinks: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  messageText: {
    color: "#08705F",
    fontSize: 12,
    lineHeight: 18,
  },
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
  featureTextBlock: {
    flex: 1,
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
