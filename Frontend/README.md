# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Style Guide

- Typography uses `Inter Tight` for headers and branded headings.
- Typography uses regular `Inter` for body text, controls, and fallback usage.
- Font size priorities:
  - Priority 1: hero and screen titles.
  - Priority 2: section headings and major card titles.
  - Priority 3: body copy and primary descriptions.
  - Priority 4: helper text, labels, and supporting copy.
  - Priority 5: metadata, badges, and uppercase annotations.
- Use the semantic classes `type-priority-1` through `type-priority-5` instead of inventing new font sizes when possible.
- Reuse existing components and shared patterns before creating a new UI block.
- Prefer composing from shared components over duplicating markup, spacing, or interaction patterns.
- Forms, cards, dropdowns, labels, and compact action buttons must use shared reusable components.
- Use pill-shaped labels and badges whenever a surface is acting like a status chip, tag, or compact label.
- If a label wraps to two lines, use a non-pill block label style instead of a full pill.
- Prefer fully rounded buttons for compact actions when the button reads as a chip, toggle, or quick action.
- Progress bars must have fully rounded outer tracks and fully rounded inner fills.
- Progress bars must not use border outlines and should use the shared `ProgressBar` component.
- Keep the type scale bold, readable, and high-contrast.
- Prefer compact, purposeful copy over decorative text.
- Do not use em dashes in UI copy or documentation.

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
