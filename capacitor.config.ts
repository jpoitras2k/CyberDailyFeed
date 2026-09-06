import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "ai.skylocity.cyberdailyfeed",
  appName: "Cyber Daily Feed",
  webDir: "dist",
  server: {
    androidScheme: "https",
  },
};

export default config;
