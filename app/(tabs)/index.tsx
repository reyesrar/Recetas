import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useAuth } from "../../_shared/_contexts";
import type { Group, Recipe } from "../../_shared/_types";
import { strings } from "../../_shared/strings";
import {
    borderRadius,
    colors,
    fontSize,
    fontWeight,
    spacing,
} from "../../_shared/theme";
import apiClient from "../services/api";

export default function RecipesScreen() {
  const { user } = useAuth();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewType, setViewType] = useState<"my" | "all">("my");
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [groupsModalVisible, setGroupsModalVisible] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [selectedRecipeForGroups, setSelectedRecipeForGroups] =
    useState<Recipe | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    ingredients: "",
    steps: "",
    servings: "1",
    cookingTime: "0",
    difficulty: "easy" as "easy" | "medium" | "hard",
  });

  useEffect(() => {
    fetchRecipes();
    fetchGroups();
  }, [viewType, selectedGroup]);

  const fetchRecipes = async () => {
    try {
      setLoading(true);
      let endpoint = viewType === "my" ? "/my-recipes" : "/all";
      if (selectedGroup) {
        endpoint = `/group/${selectedGroup}`;
      }
      const response = await apiClient.get(`/recipes${endpoint}`);
      setRecipes(
        response.data.data.sort((a: Recipe, b: Recipe) =>
          a.title.localeCompare(b.title),
        ),
      );
    } catch (error) {
      Alert.alert("Error", "Failed to load recipes");
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async () => {
    try {
      const response = await apiClient.get("/groups");
      setGroups(response.data.data);
    } catch (error) {
      console.error("Error fetching groups");
    }
  };

  const handleSaveRecipe = async () => {
    if (
      !formData.title.trim() ||
      !formData.ingredients.trim() ||
      !formData.steps.trim()
    ) {
      Alert.alert("Error", "Title, ingredients, and steps are required");
      return;
    }

    try {
      const data = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        ingredients: formData.ingredients.split("\n").filter((i) => i.trim()),
        steps: formData.steps.split("\n").filter((s) => s.trim()),
        servings: parseInt(formData.servings),
        cookingTime: parseInt(formData.cookingTime),
        difficulty: formData.difficulty,
      };

      if (editingRecipe) {
        await apiClient.put(`/recipes/${editingRecipe._id}`, data);
      } else {
        await apiClient.post("/recipes", data);
      }

      resetForm();
      fetchRecipes();
      Alert.alert(
        "Success",
        editingRecipe ? "Recipe updated" : "Recipe created",
      );
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to save recipe",
      );
    }
  };

  const handleDeleteRecipe = async (id: string) => {
    Alert.alert("Delete Recipe", "Are you sure?", [
      { text: "Cancel" },
      {
        text: "Delete",
        onPress: async () => {
          try {
            await apiClient.delete(`/recipes/${id}`);
            fetchRecipes();
          } catch (error) {
            Alert.alert("Error", "Failed to delete recipe");
          }
        },
      },
    ]);
  };

  const handleToggleGroup = async (groupId: string) => {
    if (!selectedRecipeForGroups) return;

    try {
      const isInGroup = selectedRecipeForGroups.groups.includes(groupId);

      if (isInGroup) {
        await apiClient.post("/recipes/group/remove", {
          recipeId: selectedRecipeForGroups._id,
          groupId,
        });
      } else {
        await apiClient.post("/recipes/group/add", {
          recipeId: selectedRecipeForGroups._id,
          groupId,
        });
      }

      fetchRecipes();
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to update groups",
      );
    }
  };

  const resetForm = () => {
    setEditingRecipe(null);
    setFormData({
      title: "",
      description: "",
      ingredients: "",
      steps: "",
      servings: "1",
      cookingTime: "0",
      difficulty: "easy",
    });
    setModalVisible(false);
  };

  const openEditModal = (recipe: Recipe) => {
    setEditingRecipe(recipe);
    setFormData({
      title: recipe.title,
      description: recipe.description,
      ingredients: recipe.ingredients.join("\n"),
      steps: recipe.steps.join("\n"),
      servings: recipe.servings.toString(),
      cookingTime: recipe.cookingTime.toString(),
      difficulty: recipe.difficulty,
    });
    setModalVisible(true);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{strings.tabs.recipes}</Text>
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[
            styles.tab,
            viewType === "my" && !selectedGroup && styles.tabActive,
          ]}
          onPress={() => {
            setViewType("my");
            setSelectedGroup(null);
          }}
        >
          <Text
            style={[
              styles.tabText,
              viewType === "my" && !selectedGroup && styles.tabTextActive,
            ]}
          >
            My
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            viewType === "all" && !selectedGroup && styles.tabActive,
          ]}
          onPress={() => {
            setViewType("all");
            setSelectedGroup(null);
          }}
        >
          <Text
            style={[
              styles.tabText,
              viewType === "all" && !selectedGroup && styles.tabTextActive,
            ]}
          >
            All
          </Text>
        </TouchableOpacity>
      </View>

      {viewType === "my" && groups.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.groupsScroll}
        >
          <TouchableOpacity
            style={[styles.groupChip, !selectedGroup && styles.groupChipActive]}
            onPress={() => setSelectedGroup(null)}
          >
            <Text
              style={[
                styles.groupChipText,
                !selectedGroup && styles.groupChipTextActive,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>
          {groups.map((group) => (
            <TouchableOpacity
              key={group._id}
              style={[
                styles.groupChip,
                selectedGroup === group._id && styles.groupChipActive,
              ]}
              onPress={() => setSelectedGroup(group._id)}
            >
              <Text
                style={[
                  styles.groupChipText,
                  selectedGroup === group._id && styles.groupChipTextActive,
                ]}
              >
                {group.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : recipes.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>No recipes found</Text>
        </View>
      ) : (
        <FlatList
          data={recipes}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <View style={styles.recipeCard}>
              <View>
                <Text style={styles.recipeTitle}>{item.title}</Text>
                <Text style={styles.recipeMeta}>
                  {item.cookingTime}min • {item.difficulty} • {item.servings}s
                </Text>
                {item.description && (
                  <Text style={styles.recipeDesc}>{item.description}</Text>
                )}
                {item.groups.length > 0 && (
                  <View style={styles.groupBadges}>
                    {item.groups.map((g: any) => (
                      <Text key={g._id || g} style={styles.groupBadge}>
                        {typeof g === "string" ? g : g.name}
                      </Text>
                    ))}
                  </View>
                )}
              </View>
              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => {
                    setSelectedRecipeForGroups(item);
                    setGroupsModalVisible(true);
                  }}
                >
                  <Text style={styles.actionBtnText}>Groups</Text>
                </TouchableOpacity>
                {viewType === "my" && (
                  <>
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => openEditModal(item)}
                    >
                      <Text style={styles.actionBtnText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.deleteBtn]}
                      onPress={() => handleDeleteRecipe(item._id)}
                    >
                      <Text style={styles.actionBtnText}>Delete</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          )}
          contentContainerStyle={styles.listContent}
        />
      )}

      {viewType === "my" && !selectedGroup && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => {
            resetForm();
            setModalVisible(true);
          }}
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modal}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingRecipe ? "Edit Recipe" : "New Recipe"}
            </Text>
            <ScrollView>
              <TextInput
                style={styles.input}
                placeholder="Title"
                value={formData.title}
                onChangeText={(text) =>
                  setFormData({ ...formData, title: text })
                }
              />
              <TextInput
                style={styles.input}
                placeholder="Description"
                value={formData.description}
                onChangeText={(text) =>
                  setFormData({ ...formData, description: text })
                }
              />
              <TextInput
                style={[styles.input, styles.textarea]}
                placeholder="Ingredients (one per line)"
                value={formData.ingredients}
                onChangeText={(text) =>
                  setFormData({ ...formData, ingredients: text })
                }
                multiline
              />
              <TextInput
                style={[styles.input, styles.textarea]}
                placeholder="Steps (one per line)"
                value={formData.steps}
                onChangeText={(text) =>
                  setFormData({ ...formData, steps: text })
                }
                multiline
              />
              <View style={styles.row}>
                <TextInput
                  style={[styles.input, styles.halfInput]}
                  placeholder="Servings"
                  value={formData.servings}
                  onChangeText={(text) =>
                    setFormData({ ...formData, servings: text })
                  }
                  keyboardType="numeric"
                />
                <TextInput
                  style={[styles.input, styles.halfInput]}
                  placeholder="Time (min)"
                  value={formData.cookingTime}
                  onChangeText={(text) =>
                    setFormData({ ...formData, cookingTime: text })
                  }
                  keyboardType="numeric"
                />
              </View>
            </ScrollView>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.saveBtn]}
                onPress={handleSaveRecipe}
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

      <Modal visible={groupsModalVisible} transparent animationType="slide">
        <View style={styles.modal}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Assign to Groups</Text>
            <ScrollView>
              {groups.length === 0 ? (
                <Text style={styles.emptyText}>No groups created yet</Text>
              ) : (
                groups.map((group) => (
                  <TouchableOpacity
                    key={group._id}
                    style={styles.groupOption}
                    onPress={() => handleToggleGroup(group._id)}
                  >
                    <View style={styles.checkbox}>
                      {selectedRecipeForGroups?.groups.includes(group._id) && (
                        <Text style={styles.checkboxCheck}>✓</Text>
                      )}
                    </View>
                    <Text style={styles.groupOptionText}>{group.name}</Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
            <TouchableOpacity
              style={[styles.button, styles.saveBtn]}
              onPress={() => setGroupsModalVisible(false)}
            >
              <Text style={styles.buttonText}>Done</Text>
            </TouchableOpacity>
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
  tabBar: {
    flexDirection: "row",
    backgroundColor: colors.lightGray,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray,
  },
  tab: { flex: 1, paddingVertical: spacing.md, alignItems: "center" },
  tabActive: { borderBottomWidth: 3, borderBottomColor: colors.primary },
  tabText: { fontSize: fontSize.sm, color: colors.textSecondary },
  tabTextActive: { color: colors.primary, fontWeight: fontWeight.semibold },
  groupsScroll: {
    backgroundColor: colors.lightGray,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  groupChip: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginRight: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray,
  },
  groupChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  groupChipText: { fontSize: fontSize.xs, color: colors.textPrimary },
  groupChipTextActive: { color: colors.white, fontWeight: fontWeight.semibold },
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { fontSize: fontSize.base, color: colors.textSecondary },
  listContent: { padding: spacing.md },
  recipeCard: {
    backgroundColor: colors.lightGray,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  recipeTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  recipeMeta: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  recipeDesc: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  groupBadges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  groupBadge: {
    backgroundColor: colors.primary,
    color: colors.white,
    fontSize: fontSize.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
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
    maxHeight: "90%",
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
  row: { flexDirection: "row", gap: spacing.md },
  halfInput: { flex: 1 },
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
  groupOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  checkboxCheck: {
    color: colors.primary,
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
  groupOptionText: { fontSize: fontSize.base, color: colors.textPrimary },
});
