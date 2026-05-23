import Constants from "expo-constants";

const ENV = {
  dev: {
    apiUrl: Constants.expoConfig?.extra?.apiUrl,
  },
  prod: {
    apiUrl: Constants.expoConfig?.extra?.apiUrl,
  },
};

const getEnvVars = () => {
  if (__DEV__) {
    return ENV.dev;
  }
  return ENV.prod;
};

export default getEnvVars();
