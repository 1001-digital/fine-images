# @1001-digital/fine-images

## 0.3.0

### Minor Changes

- [#1](https://github.com/1001-digital/fine-images/pull/1) [`17e782c`](https://github.com/1001-digital/fine-images/commit/17e782caf8abfccc20ed8cf5b19d2ce0a05ba505) Thanks [@yougogirldoteth](https://github.com/yougogirldoteth)! - Add an `lg` image variant at 1200px for sources large enough to generate it.

## 0.2.0

### Minor Changes

- Trim `DEFAULT_TYPE_PREFIXES` down to `avatar` only. `header`, `token`, and `contract` are no longer built in — consumers who relied on them must pass their own mapping via `typePrefixes` in the config, e.g. `{ header: 'headers', token: 'tokens', contract: 'contracts' }`. **Breaking**: without this, existing rows resolve to `header/<scope>` instead of `headers/<scope>` on the disk.

## 0.1.1

### Patch Changes

- Re-export `configure` and `stubsRoot` from the package's main entry so `node ace configure @1001-digital/fine-images` picks up the hook. Without this, consumers see a "module does not export the configure hook" warning and have to wire the provider + migration by hand.
