import { defineConfig } from '@playwright/test'

const backendCommand = [
  "Set-Location '..\\China_BE'",
  "$env:DATABASE_URL='sqlite:///./playwright_project_case.db'",
  "$env:ENVIRONMENT='development'",
  "if (Test-Path '.\\playwright_project_case.db') { Remove-Item '.\\playwright_project_case.db' -Force }",
  ".\\.venv\\Scripts\\python.exe scripts\\seed_project_case_catalog.py",
  ".\\.venv\\Scripts\\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 18000",
].join('; ')

const frontendCommand = [
  "$env:VITE_API_BASE_URL='http://127.0.0.1:18000/api/v1'",
  'npm run dev -- --host 127.0.0.1 --port 14173',
].join('; ')

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  workers: 1,
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL: 'http://127.0.0.1:14173',
    trace: 'retain-on-failure',
  },
  webServer: [
    {
      command: `powershell -NoProfile -Command "${backendCommand}"`,
      cwd: '.',
      url: 'http://127.0.0.1:18000/api/v1/public/project-case/1676767239059300352',
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command: `powershell -NoProfile -Command "${frontendCommand}"`,
      cwd: '.',
      url: 'http://127.0.0.1:14173/project_list/1676767239059300352.html',
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
})
