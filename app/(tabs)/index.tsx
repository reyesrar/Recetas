import { ScrollView, StyleSheet, Text, View } from "react-native";

export default function TabHomeScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcome}>Welcome!</Text>
        <Text style={styles.subtitle}>What we cooking today?</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.imagePlaceholder} />
        <View style={styles.info}>
          <Text style={styles.recipeTitle}>Something</Text>
          <Text style={styles.recipeDesc}>Something Something</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FDF8F5" },
  header: { padding: 25, paddingTop: 60 },
  welcome: { fontSize: 28, fontWeight: "bold", color: "#4A3728" },
  subtitle: { fontSize: 16, color: "#8D6E63" },
  card: {
    margin: 20,
    backgroundColor: "#FFF",
    borderRadius: 15,
    overflow: "hidden",
    elevation: 2,
  },
  imagePlaceholder: { height: 150, backgroundColor: "#E6D5C3" },
  info: { padding: 15 },
  recipeTitle: { fontSize: 18, fontWeight: "bold", color: "#4A3728" },
  recipeDesc: { color: "#A9927D", marginTop: 5 },
});
