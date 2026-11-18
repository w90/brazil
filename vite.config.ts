import { defineConfig, type ConfigEnv } from "vite";
import react from "@vitejs/plugin-react";

function createConfig(env: ConfigEnv) {
  const isProductionBuild = env.command === "build";
  const base = isProductionBuild ? "/brazil/" : "/";

  return {
    base,
    plugins: [react()],
    server: {
      port: 5173,
    },
  };
}

export default defineConfig(createConfig);
