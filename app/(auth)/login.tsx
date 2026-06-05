import { Link, router } from "expo-router";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useAuth } from "../_shared/_contexts";
import type { LoginCredentials } from "../_shared/_types";
import { strings } from "../_shared/strings";
import {
    borderRadius,
    colors,
    fontSize,
    fontWeight,
    spacing,
} from "../_shared/theme";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  const handleLogin = async (): Promise<void> => {
    if (!email || !password) {
      Alert.alert(strings.alerts.error, strings.alerts.fillAllFields);
      return;
    }

    const credentials: LoginCredentials = {
      email,
      password,
    };

    setLoading(true);
    const result = await signIn(credentials);
    setLoading(false);

    if (result.success) {
      router.replace("/(tabs)" as any);
    } else {
      Alert.alert(strings.alerts.error, result.message);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "android" ? "height" : "padding"}
      style={styles.container}
    >
      <View style={styles.content}>
        <Text style={styles.title}>{strings.auth.login.title}</Text>
        <Text style={styles.subtitle}>{strings.auth.login.subtitle}</Text>

        <TextInput
          style={styles.input}
          placeholder={strings.auth.login.email}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          editable={!loading}
          placeholderTextColor={colors.gray}
        />

        <TextInput
          style={styles.input}
          placeholder={strings.auth.login.password}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="password"
          editable={!loading}
          placeholderTextColor={colors.gray}
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.buttonText}>{strings.auth.login.signIn}</Text>
          )}
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>{strings.auth.login.noAccount} </Text>
          <Link href="../register" asChild>
            <TouchableOpacity disabled={loading}>
              <Text style={styles.link}>{strings.auth.login.signUp}</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    padding: spacing.md,
  },
  title: {
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.bold,
    color: colors.primary,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fontSize.lg,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: spacing.xl,
  },
  input: {
    backgroundColor: colors.lightGray,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
    fontSize: fontSize.base,
    borderWidth: 1,
    borderColor: colors.gray,
    color: colors.textPrimary,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: "center",
    marginTop: spacing.md,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: colors.white,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: spacing.lg,
  },
  footerText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
  },
  link: {
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
});
