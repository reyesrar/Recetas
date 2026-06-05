import { Link, router } from "expo-router";
import React, { useState } from "react";
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
import { useAuth } from "../_shared/_contexts";
import type { RegisterCredentials } from "../_shared/_types";
import { strings } from "../_shared/strings";
import {
    borderRadius,
    colors,
    fontSize,
    fontWeight,
    spacing,
} from "../_shared/theme";

interface ValidationErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

const validatePassword = (password: string): string[] => {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push(strings.auth.register.minChars);
  }
  if (!/[A-Z]/.test(password)) {
    errors.push(strings.auth.register.uppercase);
  }
  if (!/[a-z]/.test(password)) {
    errors.push(strings.auth.register.lowercase);
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push(strings.auth.register.special);
  }

  return errors;
};

export default function RegisterScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const { signUp } = useAuth();

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (value.length > 0) {
      setPasswordErrors(validatePassword(value));
    } else {
      setPasswordErrors([]);
    }
  };

  const handleRegister = async (): Promise<void> => {
    const errors: ValidationErrors = {};

    if (!name.trim()) {
      errors.name = "Name is required";
    }

    if (!email.trim()) {
      errors.email = "Email is required";
    }

    if (!password) {
      errors.password = "Password is required";
    } else if (passwordErrors.length > 0) {
      errors.password = passwordErrors.join(", ");
    }

    if (!confirmPassword) {
      errors.confirmPassword = "Please confirm your password";
    } else if (password !== confirmPassword) {
      errors.confirmPassword = strings.auth.register.passwordMismatch;
    }

    if (Object.keys(errors).length > 0) {
      const errorMessages = Object.values(errors).filter(Boolean).join("\n");
      Alert.alert(strings.alerts.validation, errorMessages);
      return;
    }

    const credentials: RegisterCredentials = {
      name: name.trim(),
      email: email.trim(),
      password,
    };

    setLoading(true);
    const result = await signUp(credentials);
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
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={styles.title}>{strings.auth.register.title}</Text>
          <Text style={styles.subtitle}>{strings.auth.register.subtitle}</Text>

          <TextInput
            style={styles.input}
            placeholder={strings.auth.register.fullName}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            autoComplete="name"
            editable={!loading}
            placeholderTextColor={colors.gray}
          />

          <TextInput
            style={styles.input}
            placeholder={strings.auth.register.email}
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
            placeholder={strings.auth.register.password}
            value={password}
            onChangeText={handlePasswordChange}
            secureTextEntry
            editable={!loading}
            placeholderTextColor={colors.gray}
          />

          {passwordErrors.length > 0 && (
            <View style={styles.errorBox}>
              <Text style={styles.errorTitle}>
                {strings.auth.register.passwordRequirements}
              </Text>
              {passwordErrors.map((error, index) => (
                <Text key={index} style={styles.errorText}>
                  • {error}
                </Text>
              ))}
            </View>
          )}

          <TextInput
            style={styles.input}
            placeholder={strings.auth.register.confirmPassword}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            editable={!loading}
            placeholderTextColor={colors.gray}
          />

          {password && confirmPassword && password === confirmPassword && (
            <Text style={styles.successText}>
              {strings.auth.register.passwordMatch}
            </Text>
          )}

          {password && confirmPassword && password !== confirmPassword && (
            <Text style={styles.errorTextSimple}>
              {strings.auth.register.passwordMismatch}
            </Text>
          )}

          <TouchableOpacity
            style={[
              styles.button,
              (loading || passwordErrors.length > 0) && styles.buttonDisabled,
            ]}
            onPress={handleRegister}
            disabled={loading || passwordErrors.length > 0}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.buttonText}>
                {strings.auth.register.signUp}
              </Text>
            )}
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              {strings.auth.register.haveAccount}{" "}
            </Text>
            <Link href="../login" asChild>
              <TouchableOpacity disabled={loading}>
                <Text style={styles.link}>{strings.auth.register.signIn}</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scrollContent: {
    flexGrow: 1,
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
  errorBox: {
    backgroundColor: "#FFF3CD",
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
  },
  errorTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: "#856404",
    marginBottom: spacing.sm,
  },
  errorText: {
    fontSize: fontSize.xs,
    color: "#856404",
    marginBottom: spacing.xs,
  },
  errorTextSimple: {
    fontSize: fontSize.base,
    color: colors.error,
    marginBottom: spacing.md,
    fontWeight: fontWeight.medium,
  },
  successText: {
    fontSize: fontSize.base,
    color: colors.success,
    marginBottom: spacing.md,
    fontWeight: fontWeight.medium,
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
