/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
  skipTrailingSlashRedirect: true,
  async rewrites() {
    return [
      {
        source: "/.well-known/carddav",
        destination: "/api/well-known/carddav",
      },
    ];
  },
};

export default config;
