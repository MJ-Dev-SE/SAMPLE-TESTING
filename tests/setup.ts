// The /vitest entry registers matchers on Vitest's own `expect` — the bare
// package entry assumes a global `expect` (Jest style) and crashes without it.
import '@testing-library/jest-dom/vitest'
