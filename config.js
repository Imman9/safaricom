const config = {
  development: {
    apiUrl: "http://localhost:3000",
  },
  production: {
    apiUrl: "https://safaricom-backend.onrender.com", // Replace with your actual production URL
  },
};

const env =
  window.location.hostname === "localhost" ? "development" : "production";
const currentConfig = config[env];

export default currentConfig;
