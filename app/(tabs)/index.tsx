import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
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
import { useAuth } from "../_shared/_contexts";
import type { Recipe } from "../_shared/_types";
import { strings } from "../_shared/strings";
import {
  borderRadius,
  colors,
  fontSize,
  fontWeight,
  spacing,
} from "../_shared/theme";

const API_URL = "http://10.0.2.2:5000/api";

export default function RecipesScreen() {
  const { user } = useAuth();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewType, setViewType] = useState<"my" | "all">("my");
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
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
  }, [viewType]);

  const fetchRecipes = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");
      const endpoint = viewType === "my" ? "/my-recipes" : "/all";
      const response = await axios.get(`${API_URL}/recipes${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
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
      const token = await AsyncStorage.getItem("token");
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
        await axios.put(`${API_URL}/recipes/${editingRecipe._id}`, data, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await axios.post(`${API_URL}/recipes`, data, {
          headers: { Authorization: `Bearer ${token}` },
        });
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
            const token = await AsyncStorage.getItem("token");
            await axios.delete(`${API_URL}/recipes/${id}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            fetchRecipes();
          } catch (error) {
            Alert.alert("Error", "Failed to delete recipe");
          }
        },
      },
    ]);
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
          style={[styles.tab, viewType === "my" && styles.tabActive]}
          onPress={() => setViewType("my")}
        >
          <Text
            style={[styles.tabText, viewType === "my" && styles.tabTextActive]}
          >
            My Recipes
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, viewType === "all" && styles.tabActive]}
          onPress={() => setViewType("all")}
        >
          <Text
            style={[styles.tabText, viewType === "all" && styles.tabTextActive]}
          >
            All Recipes
          </Text>
        </TouchableOpacity>
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
          data={recipes}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <View style={styles.recipeCard}>
              <View>
                <Text style={styles.recipeTitle}>{item.title}</Text>
                <Text style={styles.recipeMeta}>
                  {item.cookingTime}min • {item.difficulty} • {item.servings}{" "}
                  servings
                </Text>
                {item.description && (
                  <Text style={styles.recipeDesc}>{item.description}</Text>
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
                  onPress={() => handleDeleteRecipe(item._id)}
                >
                  <Text style={styles.actionBtnText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          contentContainerStyle={styles.listContent}
        />
      )}

      {viewType === "my" && (
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

            <TextInput
              style={styles.input}
              placeholder="Title"
              value={formData.title}
              onChangeText={(text) => setFormData({ ...formData, title: text })}
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
              onChangeText={(text) => setFormData({ ...formData, steps: text })}
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
                placeholder="Cooking time (min)"
                value={formData.cookingTime}
                onChangeText={(text) =>
                  setFormData({ ...formData, cookingTime: text })
                }
                keyboardType="numeric"
              />
            </View>

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
  tabBar: {
    flexDirection: "row",
    backgroundColor: colors.lightGray,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  tabActive: {
    borderBottomWidth: 3,
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
  },
  listContent: {
    padding: spacing.md,
  },
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
  actions: {
    flexDirection: "row",
    gap: spacing.md,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: "center",
  },
  deleteBtn: {
    backgroundColor: colors.error,
  },
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
  textarea: {
    height: 80,
    textAlignVertical: "top",
  },
  row: {
    flexDirection: "row",
    gap: spacing.md,
  },
  halfInput: {
    flex: 1,
  },
  buttonRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  button: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: "center",
  },
  saveBtn: {
    backgroundColor: colors.primary,
  },
  cancelBtn: {
    backgroundColor: colors.gray,
  },
  buttonText: {
    color: colors.white,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
});
