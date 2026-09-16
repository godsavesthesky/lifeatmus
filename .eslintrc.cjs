/**
 * Script `lint` sudah ada di package.json sejak awal, tapi tidak pernah ada
 * berkas konfigurasinya — `npm run lint` selalu berhenti dengan "couldn't
 * find a configuration file". Ini berkas itu.
 *
 * ESLint 8 memakai format .eslintrc (bukan eslint.config.js milik v9).
 */
module.exports = {
  root: true,
  env: { browser: true, es2022: true },
  parser: '@typescript-eslint/parser',
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module', ecmaFeatures: { jsx: true } },
  plugins: ['@typescript-eslint', 'react-hooks', 'react-refresh'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', 'node_modules', '*.config.js', '*.config.ts', '.eslintrc.cjs'],
  rules: {
    'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    // Argumen/variabel yang sengaja dibuang diawali garis bawah, misal saat
    // memisahkan field dengan destructuring: `const { id: _id, ...rest } = e`.
    '@typescript-eslint/no-unused-vars': [
      'warn',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
    ],
  },
}
