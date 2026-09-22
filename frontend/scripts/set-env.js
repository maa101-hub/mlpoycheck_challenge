/**
 * Generates src/environments/environment.prod.ts from the API_URL env var at
 * build time. Angular bakes environment values into the static bundle, so the
 * backend URL must be known when the app is built (not at runtime in the
 * browser). On Vercel, set an `API_URL` environment variable to your Render
 * backend URL, e.g. https://mploycheck-backend.onrender.com/api
 *
 * If API_URL is not set, it falls back to '/api' (useful when a reverse proxy
 * serves the API on the same origin).
 */
const fs = require('fs');
const path = require('path');

const apiUrl = process.env.API_URL || '/api';

const contents = `export const environment = {
  production: true,
  apiUrl: '${apiUrl}'
};
`;

const targetPath = path.join(__dirname, '..', 'src', 'environments', 'environment.prod.ts');
fs.writeFileSync(targetPath, contents, { encoding: 'utf-8' });
console.log(`[set-env] Wrote environment.prod.ts with apiUrl='${apiUrl}'`);
