import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
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
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    ingredients: "",
    steps: "",
    servings: "",
    cookingTime: "",
    difficulty: "easy" as "easy" | "medium" | "hard",
  });

  const params = useLocalSearchParams();

  useEffect(() => {
    fetchRecipes();
    fetchGroups();
  }, [viewType, selectedGroup]);

  useEffect(() => {
    // If navigated with a group param, apply it
    if (params?.group) {
      setSelectedGroup((params as any).group as string);
      setViewType(((params as any).view as "my" | "all") || "all");
    }
  }, [params]);

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
      const servingsValue =
        formData.servings.trim() === "" ? 1 : parseInt(formData.servings, 10);
      const cookingTimeValue =
        formData.cookingTime.trim() === ""
          ? 0
          : parseInt(formData.cookingTime, 10);
      const data = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        ingredients: formData.ingredients.split("\n").filter((i) => i.trim()),
        steps: formData.steps.split("\n").filter((s) => s.trim()),
        servings: servingsValue,
        cookingTime: cookingTimeValue,
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
      servings: "",
      cookingTime: "",
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

      {/* Search input for My / All */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search recipes by name"
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
        />
      </View>

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
          data={recipes.filter((r) =>
            r.title.toLowerCase().includes(searchQuery.toLowerCase()),
          )}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => {
                setSelectedRecipe(item);
                setDetailModalVisible(true);
              }}
            >
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
              </View>
            </TouchableOpacity>
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

      {/* Detail modal for a selected recipe */}
      <Modal
        visible={detailModalVisible}
        transparent
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setDetailModalVisible(false)}>
          <View style={styles.modal}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
              >
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>{selectedRecipe?.title}</Text>
                  <Text style={styles.recipeMeta}>
                    {selectedRecipe?.cookingTime}min •{" "}
                    {selectedRecipe?.difficulty} • {selectedRecipe?.servings}s
                  </Text>
                  <Text style={styles.label}>
                    Created by:{" "}
                    {selectedRecipe && typeof selectedRecipe.userId !== "string"
                      ? (selectedRecipe.userId as any).name
                      : "Unknown"}
                  </Text>
                  {selectedRecipe?.description && (
                    <Text style={styles.recipeDesc}>
                      {selectedRecipe.description}
                    </Text>
                  )}
                  <Text style={[styles.modalTitle, { marginTop: spacing.md }]}>
                    Ingredients
                  </Text>
                  {selectedRecipe?.ingredients.map((ing, i) => (
                    <Text key={i} style={styles.inputText}>
                      • {ing}
                    </Text>
                  ))}
                  <Text style={[styles.modalTitle, { marginTop: spacing.md }]}>
                    Steps
                  </Text>
                  {selectedRecipe?.steps.map((s, i) => (
                    <Text key={i} style={styles.inputText}>
                      {i + 1}. {s}
                    </Text>
                  ))}

                  <View style={[styles.buttonRow, { marginTop: spacing.md }]}>
                    {user &&
                      selectedRecipe &&
                      (typeof selectedRecipe.userId !== "string"
                        ? (selectedRecipe.userId as any)._id === user._id
                        : selectedRecipe.userId === user._id) && (
                        <>
                          <TouchableOpacity
                            style={[styles.button, styles.saveBtn]}
                            onPress={() => {
                              openEditModal(selectedRecipe);
                              setDetailModalVisible(false);
                            }}
                          >
                            <Text style={styles.buttonText}>Edit</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.button, styles.deleteBtn]}
                            onPress={() => {
                              handleDeleteRecipe(selectedRecipe._id);
                              setDetailModalVisible(false);
                            }}
                          >
                            <Text style={styles.buttonText}>Delete</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.button, styles.actionBtn]}
                            onPress={() => {
                              setSelectedRecipeForGroups(selectedRecipe);
                              setGroupsModalVisible(true);
                              setDetailModalVisible(false);
                            }}
                          >
                            <Text style={styles.buttonText}>Add to group</Text>
                          </TouchableOpacity>
                        </>
                      )}

                    <TouchableOpacity
                      style={[styles.button, styles.cancelBtn]}
                      onPress={() => setDetailModalVisible(false)}
                    >
                      <Text style={styles.buttonText}>Close</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </KeyboardAvoidingView>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={resetForm}
      >
        <TouchableWithoutFeedback onPress={resetForm}>
          <View style={styles.modal}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
              >
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>
                    {editingRecipe ? "Edit Recipe" : "New Recipe"}
                  </Text>
                  <ScrollView keyboardShouldPersistTaps="handled">
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

                    <Text
                      style={[styles.modalTitle, { marginTop: spacing.md }]}
                    >
                      Difficulty
                    </Text>
                    <View style={styles.difficultyRow}>
                      {(["easy", "medium", "hard"] as const).map((d) => (
                        <TouchableOpacity
                          key={d}
                          style={[
                            styles.difficultyBtn,
                            formData.difficulty === d &&
                              styles.difficultyBtnActive,
                          ]}
                          onPress={() =>
                            setFormData({ ...formData, difficulty: d })
                          }
                        >
                          <Text
                            style={
                              formData.difficulty === d
                                ? styles.difficultyTextActive
                                : styles.difficultyText
                            }
                          >
                            {d}
                          </Text>
                        </TouchableOpacity>
                      ))}
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
              </KeyboardAvoidingView>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Modal
        visible={groupsModalVisible}
        transparent
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setGroupsModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setGroupsModalVisible(false)}>
          <View style={styles.modal}>
            <TouchableWithoutFeedback onPress={() => {}}>
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
                          {selectedRecipeForGroups?.groups?.includes(
                            group._id,
                          ) && <Text style={styles.checkboxCheck}>✓</Text>}
                        </View>
                        <Text style={styles.groupOptionText}>{group.name}</Text>
                      </TouchableOpacity>
                    ))
                  )}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
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
  cancelBtn: { backgroundColor: colors.darkGray },
  searchRow: { padding: spacing.md, backgroundColor: colors.white },
  searchInput: {
    backgroundColor: colors.lightGray,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.gray,
    color: colors.textPrimary,
  },
  label: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  inputText: {
    fontSize: fontSize.base,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  difficultyRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  difficultyBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.lightGray,
  },
  difficultyBtnActive: { backgroundColor: colors.primary },
  difficultyText: { color: colors.textPrimary },
  difficultyTextActive: {
    color: colors.white,
    fontWeight: fontWeight.semibold,
  },
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
