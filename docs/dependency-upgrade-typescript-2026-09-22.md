# TypeScript 7 compatibility assessment

Decision: retain TypeScript 6.0.3 as the frontend compiler/API dependency and the backend's existing `typescript: npm:@typescript/typescript6@6.0.2` compatibility alias, whose effective compiler is also 6.0.3. Do not replace the `typescript` module with 7.0.2. The native CLI and the JavaScript compiler API are separate compatibility questions.

## Official evidence and source inspection

- [TypeScript 7 release announcement](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/) and [7.0.2 release](https://github.com/microsoft/typescript-go/releases/tag/typescript%2Fv7.0.2).
- [Intentional compiler changes](https://github.com/microsoft/typescript-go/blob/2bd066d87f5bafd315be9f40889d0a60b9e58e0b/CHANGES.md): reviewed the JS/JSDoc, parser, Unicode template inference and declaration-emit differences.
- The registry's repository field points to Microsoft/TypeScript, but the 7.0.2 gitHead is actually available in the native repository. The attempted old/new URL returned 404; it was not accepted as evidence. Cloned the exact native release commit `2bd066d87f5bafd315be9f40889d0a60b9e58e0b`, read package exports, version entry point, executable resolution and the [release commit diff](https://github.com/microsoft/typescript-go/commit/2bd066d87f5bafd315be9f40889d0a60b9e58e0b). The JS and native repositories do not provide an ordinary single-history 6.0.3→7.0.2 source comparison.
- Downloaded both official npm tarballs and inspected their actual entry points. TypeScript 7.0.2's default export resolves to `lib/version.cjs`, exporting only `version` and `versionMajorMinor`. Experimental APIs live under distinct `unstable/*` exports; they are not replacements for the TS6 API. Its CLI resolves a platform-native optional package. The release source's `_packages/native-preview` name is rewritten during publishing; the published tarball confirms the final `typescript` package contract.

## Concrete incompatibilities

The installed `@typescript-eslint/typescript-estree@8.63.0` declares `typescript >=4.8.4 <6.1.0` and calls TS6 `createSourceFile`, `ScriptTarget`, `ScriptKind` and other compiler APIs. Backend `vite-plugin-checker` also calls `ts.sys`, `findConfigFile`, `createWatchCompilerHost`, `createWatchProgram` and solution-builder APIs. These properties are absent from the actual TypeScript 7 root export.

An isolated child-process experiment loaded the installed `@typescript-eslint/parser` and parsed `const answer: number = 42`, replacing only its `typescript` module resolution with each downloaded official compiler entry point. TypeScript 6.0.3 passed. TypeScript 7.0.2 failed during parser initialization with `TypeError: Cannot read properties of undefined (reading 'Cjs')`. Evidence: `/tmp/folo-typescript-api-probe.log`. Repository dependencies were not modified for this experiment.

TypeScript 7 also removes previously deprecated flags and changes JS checking/emit details. Those deserve an independent native-CLI migration with full typechecks and build verification; an existing `@typescript/native-preview` dependency does not demonstrate compatibility of the `typescript` API module. The official 6.x compatibility package's latest registry version is 6.0.2, despite the ordinary `typescript` package having a 6.0.3 release. No unpublished alias version was inferred.

This is a source- and experiment-backed hold, not an untested version bump. The full native compiler implementation was not audited or approved for replacement in this change.

## Backend alias clarification

The official `@typescript/typescript6@6.0.2` package is a nine-file compatibility wrapper. It depends on `@typescript/old: npm:typescript@^6`; its `lib/typescript.js` only re-exports `require("@typescript/old")`. The backend lockfile resolves that dependency to 6.0.3, and a real `require("typescript").version` check returned 6.0.3. Thus the alias's 6.0.2 label is not an older effective compiler. The root reviewer also read the [6.0.3 release](https://github.com/microsoft/TypeScript/releases/tag/v6.0.3) and complete 180-line [compiler source diff](https://github.com/microsoft/TypeScript/compare/v6.0.2...v6.0.3): class-property control-flow analysis and typing-installer package-name validation are the relevant patch changes. No alias change is necessary.
