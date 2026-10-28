import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 45_000,
  fullyParallel: true,
  reporter: [["list"]],
  use: { baseURL: process.env.HARNESS_BASE_URL ?? `http://127.0.0.1:${PORT}` },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  // HARNESS_BASE_URL(배포된 주소)가 없으면 로컬 프로덕션 서버를 띄운다. 먼저 `npm run build`가 필요하다.
  webServer: process.env.HARNESS_BASE_URL ? undefined : {
    command: `npx next start -p ${PORT}`,
    url: `http://127.0.0.1:${PORT}/roadmap`,
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
