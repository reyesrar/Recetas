import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View
} from "react-native";
import { useAuth } from "../../_shared/_contexts";
import { strings } from "../../_shared/strings";
import {
  colors,
  fontSize,
  fontWeight,
  spacing
} from "../../_shared/theme";

export default function RecipesScreen() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{strings.tabs.recipes}</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.welcomeText}>
          {strings.recipes.welcome.replace("{name}", user?.name || "User")}
        </Text>
        <Text style={styles.description}>{strings.recipes.comingSoon}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    backgroundColor: colors.primary,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  headerTitle: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.md,
  },
  welcomeText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    textAlign: "center",
  },
  description: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
    textAlign: "center",
  },
});
