import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useAuth } from "../../_shared/_contexts";
import type { Group } from "../../_shared/_types";
import {
    borderRadius,
    colors,
    fontSize,
    fontWeight,
    spacing,
} from "../../_shared/theme";
import apiClient from "../services/api";

export default function GroupsScreen() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "" });

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/groups");
      setGroups(
        response.data.data.sort((a: Group, b: Group) =>
          a.name.localeCompare(b.name),
        ),
      );
    } catch (error) {
      Alert.alert("Error", "Failed to load groups");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGroup = async () => {
    if (!formData.name.trim()) {
      Alert.alert("Error", "Name is required");
      return;
    }

    try {
      const data = {
        name: formData.name.trim(),
        description: formData.description.trim(),
      };
      if (editingGroup) {
        await apiClient.put(`/groups/${editingGroup._id}`, data);
      } else {
        await apiClient.post("/groups", data);
      }
      resetForm();
      fetchGroups();
      Alert.alert("Success", editingGroup ? "Group updated" : "Group created");
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to save group",
      );
    }
  };

  const handleDeleteGroup = async (id: string) => {
    Alert.alert(
      "Delete Group",
      "This will delete your recipes in this group. Continue?",
      [
        { text: "Cancel" },
        {
          text: "Delete",
          onPress: async () => {
            try {
              await apiClient.delete(`/groups/${id}`);
              fetchGroups();
              Alert.alert("Success", "Group deleted");
            } catch (error) {
              Alert.alert("Error", "Failed to delete group");
            }
          },
        },
      ],
    );
  };

  const resetForm = () => {
    setEditingGroup(null);
    setFormData({ name: "", description: "" });
    setModalVisible(false);
  };

  const openEditModal = (group: Group) => {
    setEditingGroup(group);
    setFormData({ name: group.name, description: group.description });
    setModalVisible(true);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Groups</Text>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : groups.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>No groups yet. Create one!</Text>
        </View>
      ) : (
        <FlatList
          data={groups}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <View style={styles.groupCard}>
              <View>
                <Text style={styles.groupName}>{item.name}</Text>
                {item.description && (
                  <Text style={styles.groupDesc}>{item.description}</Text>
                )}
              </View>
              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => openEditModal(item)}
                >
                  <Text style={styles.actionBtnText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.deleteBtn]}
                  onPress={() => handleDeleteGroup(item._id)}
                >
                  <Text style={styles.actionBtnText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          contentContainerStyle={styles.listContent}
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          resetForm();
          setModalVisible(true);
        }}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modal}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingGroup ? "Edit Group" : "New Group"}
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Group name"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
            />
            <TextInput
              style={[styles.input, styles.textarea]}
              placeholder="Description"
              value={formData.description}
              onChangeText={(text) =>
                setFormData({ ...formData, description: text })
              }
              multiline
            />
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.saveBtn]}
                onPress={handleSaveGroup}
              >
                <Text style={styles.buttonText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.cancelBtn]}
                onPress={resetForm}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
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
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { fontSize: fontSize.base, color: colors.textSecondary },
  listContent: { padding: spacing.md },
  groupCard: {
    backgroundColor: colors.lightGray,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  groupName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  groupDesc: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  actions: { flexDirection: "row", gap: spacing.md },
  actionBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: "center",
  },
  deleteBtn: { backgroundColor: colors.error },
  actionBtnText: {
    color: colors.white,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  fab: {
    position: "absolute",
    bottom: spacing.lg,
    right: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  fabText: {
    fontSize: fontSize.xxl,
    color: colors.white,
    fontWeight: fontWeight.bold,
  },
  modal: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    padding: spacing.lg,
    maxHeight: "60%",
  },
  modalTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    marginBottom: spacing.md,
    color: colors.textPrimary,
  },
  input: {
    backgroundColor: colors.lightGray,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
    fontSize: fontSize.sm,
    borderWidth: 1,
    borderColor: colors.gray,
    color: colors.textPrimary,
  },
  textarea: { height: 80, textAlignVertical: "top" },
  buttonRow: { flexDirection: "row", gap: spacing.md },
  button: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: "center",
  },
  saveBtn: { backgroundColor: colors.primary },
  cancelBtn: { backgroundColor: colors.gray },
  buttonText: {
    color: colors.white,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
});
