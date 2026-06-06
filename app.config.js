export default {
  expo: {
    name: "recetas",
    slug: "recetas",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "recetas",
    userInterfaceStyle: "automatic",
    splash: {
      image: "./assets/images/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/android-icon-foreground.png",
        backgroundColor: "#ffffff",
      },
      package: "com.recetas.app",
    },
    plugins: ["expo-router"],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      apiUrl: process.env.API_URL || "http://10.0.2.2:5000/api",
      eas: {
        projectId: "ec9fb48c-9404-42c7-8956-75ac7f006756",
      },
    },
  },
};
