import { configs as airbnbConfigs } from 'eslint-config-airbnb-extended/legacy';
import prettier from 'eslint-config-prettier';
import importPlugin from 'eslint-plugin-import';
import jsdocPlugin from 'eslint-plugin-jsdoc';
import pkgJsonPlugin from 'eslint-plugin-package-json';
import sveltePlugin from 'eslint-plugin-svelte';
import globals from 'globals';

export default [
  // Ignore files (migrated from .eslintrc.yaml ignorePatterns + .eslintignore)
  { ignores: ['**/*.cjs', '**/*.d.ts', 'node_modules/', '.svelte-kit/', 'dist/'] },

  // Airbnb base rules (equivalent to eslint-config-airbnb-base), applied to all
  // files (strip the `files` restriction so .svelte files are also covered)
  ...airbnbConfigs.base.recommended.map(({ files: _f, ...c }) => c),

  // Disable rules that conflict with Prettier
  prettier,

  // JSDoc recommended rules
  jsdocPlugin.configs['flat/recommended'],

  // Svelte recommended + Prettier overrides
  ...sveltePlugin.configs['flat/recommended'],
  ...sveltePlugin.configs['flat/prettier'],

  // package.json linting
  pkgJsonPlugin.configs['recommended-publishable'],
  pkgJsonPlugin.configs.stylistic,

  // Custom settings for all JS/Svelte files
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        ...globals.browser,
        ...globals.es2024,
        ...globals.node,
      },
    },
    plugins: {
      import: importPlugin,
      jsdoc: jsdocPlugin,
    },
    settings: {
      // Prevent eslint-plugin-import from trying to parse .js files using the Svelte parser
      // when following imports from .svelte files. Without this, it causes noisy stderr errors.
      // https://github.com/import-js/eslint-plugin-import/issues/3165
      'import/parsers': {
        espree: ['.js', '.mjs', '.cjs'],
      },
    },
    rules: {
      'class-methods-use-this': 'off',
      'import/extensions': 'off',
      'import/no-extraneous-dependencies': 'off',
      'import/no-mutable-exports': 'off',
      'import/no-unresolved': 'off',
      'import/prefer-default-export': 'off',
      'jsdoc/no-undefined-types': 'off',
      'jsdoc/reject-any-type': 'off',
      'jsdoc/require-jsdoc': [
        'warn',
        {
          require: {
            ArrowFunctionExpression: true,
            ClassDeclaration: true,
            ClassExpression: true,
            FunctionDeclaration: true,
            FunctionExpression: true,
            MethodDefinition: true,
          },
        },
      ],
      // Other JSDoc rules not in the recommended list
      'jsdoc/check-indentation': 1,
      'jsdoc/check-line-alignment': 1,
      'jsdoc/check-syntax': 1,
      'jsdoc/match-description': 1,
      'jsdoc/no-bad-blocks': 1,
      'jsdoc/no-blank-block-descriptions': 1,
      'jsdoc/no-defaults': 1,
      'jsdoc/require-asterisk-prefix': 1,
      'jsdoc/require-description': 1,
      'jsdoc/require-description-complete-sentence': 1,
      'jsdoc/require-hyphen-before-param-description': [
        'error',
        'never',
        { tags: { property: 'never' } },
      ],
      'jsdoc/require-throws': 1,
      'jsdoc/sort-tags': 1,
      'jsdoc/valid-types': 0,
      'max-len': [
        'error',
        {
          code: 100,
          tabWidth: 2,
          ignoreUrls: true,
          ignoreStrings: true,
        },
      ],
      'no-nested-ternary': 'off',
      'no-param-reassign': 'off',
      'no-void': 'off',
      // https://github.com/sveltejs/eslint-plugin-svelte#white_check_mark-rules
      'svelte/no-at-html-tags': 'off',
      // Ignore false errors
      'svelte/no-unused-svelte-ignore': 'off',
      // https://svelte.dev/docs#component-format-script
      'no-undef-init': 'off',
      'no-underscore-dangle': 'off',
      // https://github.com/airbnb/javascript/issues/1660#issuecomment-353018874 + small tweaks
      'padding-line-between-statements': [
        'error',
        {
          blankLine: 'always',
          prev: '*',
          next: [
            'block',
            'block-like',
            'cjs-export',
            'class',
            'const',
            'export',
            'import',
            'let',
            'var',
          ],
        },
        {
          blankLine: 'always',
          prev: [
            'block',
            'block-like',
            'cjs-export',
            'class',
            'const',
            'export',
            'import',
            'let',
            'var',
          ],
          next: '*',
        },
        {
          blankLine: 'never',
          prev: ['singleline-const', 'singleline-let', 'singleline-var'],
          next: ['singleline-const', 'singleline-let', 'singleline-var'],
        },
        { blankLine: 'any', prev: ['export', 'import'], next: ['export', 'import'] },
      ],
    },
  },

  // Silence false errors on .svelte and .svelte.js files
  {
    files: ['**/*.svelte', '**/*.svelte.js'],
    rules: {
      'svelte/valid-compile': 'off',
    },
  },

  // Allow $state and other Svelte runes as globals in .svelte.js files
  {
    files: ['**/*.svelte.js'],
    languageOptions: {
      globals: {
        $state: 'readonly',
      },
    },
  },
];
