import { defineConfig } from '@playwright/test';
import { existsSync } from 'node:fs';

// Em ambientes com Chromium pré-instalado (como a nuvem do Claude Code), usa esse binário.
// No CI e no seu computador, o navegador vem de "npx playwright install chromium".
const chromiumLocal = process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium';
const executablePath = !process.env.CI && existsSync(chromiumLocal) ? chromiumLocal : undefined;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://127.0.0.1:4321',
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
    launchOptions: { executablePath },
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'celular',
      use: { viewport: { width: 390, height: 780 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
    },
    { name: 'computador', use: { viewport: { width: 1280, height: 800 } } },
  ],
  // Serve o site já gerado em dist/ (o "npm test" roda o build antes).
  webServer: {
    command: 'npx astro preview --host 127.0.0.1 --port 4321 --ignore-lock',
    url: 'http://127.0.0.1:4321/',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
