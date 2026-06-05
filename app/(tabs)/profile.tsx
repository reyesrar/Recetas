import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../_shared/_contexts";
import { strings } from "../_shared/strings";
import {
  borderRadius,
  colors,
  fontSize,
  fontWeight,
  spacing,
} from "../_shared/theme";
import apiClient from "../services/api";

export default function ProfileScreen() {
  const { user, loading, signOut } = useAuth();
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(user?.name || "");
  const [editEmail, setEditEmail] = useState(user?.email || "");
  const [updating, setUpdating] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const handleSaveProfile = async () => {
    if (!editName.trim() || !editEmail.trim()) {
      Alert.alert("Error", "All fields are required");
      return;
    }

    setUpdating(true);
    try {
      const response = await apiClient.put("/users/profile", {
        name: editName.trim(),
        email: editEmail.trim(),
      });

      if (response.data.success) {
        Alert.alert("Success", "Profile updated");
        setEditing(false);
      }
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to update profile",
      );
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      Alert.alert("Error", "Password is required");
      return;
    }

    setUpdating(true);
    try {
      const response = await apiClient.delete("/users/account", {
        data: { password: deletePassword },
      });

      if (response.data.success) {
        await signOut();
        router.replace("/(auth)/login" as any);
      }
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to delete account",
      );
    } finally {
      setUpdating(false);
      setDeleteModalVisible(false);
      setDeletePassword("");
    }
  };

  const handleLogout = async () => {
    await signOut();
    router.replace("/(auth)/login" as any);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{strings.tabs.profile}</Text>
      </View>

      <View style={styles.content}>
        {!editing ? (
          <View style={styles.userCard}>
            <View style={styles.infoRow}>
              <Text style={styles.label}>{strings.profile.name}</Text>
              <Text style={styles.value}>{user?.name}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.label}>{strings.profile.email}</Text>
              <Text style={styles.value}>{user?.email}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.label}>{strings.profile.memberSince}</Text>
              <Text style={styles.value}>
                {user?.createdAt
                  ? new Date(user.createdAt).toLocaleDateString()
                  : "---"}
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.editCard}>
            <TextInput
              style={styles.editInput}
              placeholder="Name"
              value={editName}
              onChangeText={setEditName}
              editable={!updating}
            />
            <TextInput
              style={styles.editInput}
              placeholder="Email"
              value={editEmail}
              onChangeText={setEditEmail}
              keyboardType="email-address"
              editable={!updating}
            />
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[
                  styles.smallButton,
                  { backgroundColor: colors.primary },
                ]}
                onPress={handleSaveProfile}
                disabled={updating}
              >
                {updating ? (
                  <ActivityIndicator color={colors.white} size="small" />
                ) : (
                  <Text style={styles.smallButtonText}>Save</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.smallButton, { backgroundColor: colors.gray }]}
                onPress={() => setEditing(false)}
                disabled={updating}
              >
                <Text style={styles.smallButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {!editing && (
          <>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setEditing(true)}
            >
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => setDeleteModalVisible(true)}
            >
              <Text style={styles.deleteButtonText}>Delete Account</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <Text style={styles.logoutText}>{strings.profile.logout}</Text>
            </TouchableOpacity>
          </>
        )}

        {deleteModalVisible && (
          <View style={styles.modal}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Delete Account</Text>
              <Text style={styles.modalMessage}>
                This action cannot be undone. Enter your password to confirm.
              </Text>
              <TextInput
                style={styles.editInput}
                placeholder="Password"
                secureTextEntry
                value={deletePassword}
                onChangeText={setDeletePassword}
                editable={!updating}
              />
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[
                    styles.smallButton,
                    { backgroundColor: colors.error },
                  ]}
                  onPress={handleDeleteAccount}
                  disabled={updating}
                >
                  {updating ? (
                    <ActivityIndicator color={colors.white} size="small" />
                  ) : (
                    <Text style={styles.smallButtonText}>Delete</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.smallButton, { backgroundColor: colors.gray }]}
                  onPress={() => {
                    setDeleteModalVisible(false);
                    setDeletePassword("");
                  }}
                  disabled={updating}
                >
                  <Text style={styles.smallButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
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
  content: { padding: spacing.md },
  userCard: {
    backgroundColor: colors.lightGray,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  editCard: {
    backgroundColor: colors.lightGray,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  infoRow: { marginVertical: spacing.md },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  value: {
    fontSize: fontSize.base,
    color: colors.textPrimary,
    fontWeight: fontWeight.medium,
  },
  divider: {
    height: 1,
    backgroundColor: colors.gray,
    marginVertical: spacing.md,
  },
  editInput: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
    fontSize: fontSize.base,
    borderWidth: 1,
    borderColor: colors.gray,
    color: colors.textPrimary,
  },
  buttonRow: { flexDirection: "row", gap: spacing.md },
  smallButton: {
    flex: 1,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  smallButtonText: {
    color: colors.white,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  editButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: "center",
    marginBottom: spacing.md,
  },
  editButtonText: {
    color: colors.white,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  deleteButton: {
    backgroundColor: colors.warning,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: "center",
    marginBottom: spacing.md,
  },
  deleteButtonText: {
    color: colors.white,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  logoutButton: {
    backgroundColor: colors.error,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  logoutText: {
    color: colors.white,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  modal: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.md,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    width: "90%",
  },
  modalTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    marginBottom: spacing.md,
    color: colors.textPrimary,
  },
  modalMessage: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
});
