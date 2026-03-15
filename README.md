# bun-cli-starter

![CI Build](https://github.com/coryrylan/node-cli-starter/actions/workflows/build.yml/badge.svg)

Minimal starter kit for building CLI applications with Bun and TypeScript.

## Getting Started

To get started clone the repo locally and run `bun install` at the root of the repo. Run `ncs --version` to see the installed CLI.

## Commands

- `bun start`: execute CLI via bun script
- `bun run build`: compile CLI to a single-file executable in `dist/ncs`
- `bun link`: link CLI globally
- `bun unlink`: unlink CLI globally
- `ncs --version`: log version from CLI
- `ncs greet "world"`: log greeting command from CLI
- `ncs greet "world" --capitalize`: log capitalized greeting from CLI
