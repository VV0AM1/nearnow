import { join } from 'path';
import { tmpdir } from 'os';

// The e2e suite runs against a dedicated, disposable database — never development or production data.
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL =
  process.env.E2E_DATABASE_URL ||
  'postgresql://nearnow_dev:nearnow_dev_local@localhost:5433/nearnow_test?schema=public';
process.env.DIRECT_URL = process.env.DATABASE_URL;
process.env.JWT_SECRET = 'e2e-test-secret-that-is-long-enough-0123456789';
process.env.UPLOAD_DIR = join(tmpdir(), 'nearnow-e2e-uploads');
process.env.EMAIL_USER = '';
process.env.EMAIL_PASS = '';
delete process.env.PUSH_PROVIDER;
delete process.env.GEOCODER_PROVIDER;
