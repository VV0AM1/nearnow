import { execSync } from 'child_process';
import './e2e-env';

/** Resets and migrates the dedicated test database. Refuses to touch anything else. */
export default function globalSetup() {
  const url = process.env.DATABASE_URL!;
  if (
    !/\/nearnow_test(\?|$)/.test(url) ||
    !/@(localhost|127\.0\.0\.1)[:/]/.test(url)
  ) {
    throw new Error(
      'E2E tests only run against a local database named nearnow_test',
    );
  }
  execSync('npx prisma migrate reset --force --skip-seed --skip-generate', {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: url, DIRECT_URL: url },
  });
}
