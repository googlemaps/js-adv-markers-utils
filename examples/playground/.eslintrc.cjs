module.exports = {
  extends: ['eslint:recommended'],
  root: true,

  parserOptions: {
    sourceType: 'module',
    ecmaVersion: 2020
  },

  overrides: [
    {
      files: ['**/*.ts'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        sourceType: 'module',
        tsconfigRootDir: __dirname,
        project: ['./tsconfig.json']
      },
      plugins: ['@typescript-eslint'],
      extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:@typescript-eslint/recommended-requiring-type-checking'
      ],
      rules: {
        '@typescript-eslint/no-inferrable-types': 'off',
        '@typescript-eslint/no-empty-function': 'off',
        '@typescript-eslint/require-await': 'off',
        'prefer-const': ['error', {destructuring: 'all'}]
      }
    }
  ]
};
