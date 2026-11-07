import path from "node:path"
import type { NextConfig } from "next"

/** Playground del theme: usa el código de ../src directamente, como lo haría un proyecto con el paquete instalado. */
const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname, ".."),
    rules: { "*.css": { loaders: ["@tailwindcss/turbopack"], as: "*.css" } },
  },
}

export default nextConfig
