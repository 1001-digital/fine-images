# @1001-digital/fine-images

## 0.4.0

### Minor Changes

- [#4](https://github.com/1001-digital/fine-images/pull/4) [`16e1ba0`](https://github.com/1001-digital/fine-images/commit/16e1ba01a4e09603904af30eb8b1d27b3e2d8bde) Thanks [@yougogirldoteth](https://github.com/yougogirldoteth)! - Rename image cache identity fields to `key` and `scope`.

  This is a breaking change for existing installations. Before upgrading, add an app migration that renames the image identity column to `key`, the logical bucket/type column to `scope`, and enforces a unique `(key, scope)` constraint. Update custom callers or Lucid relations to use the new names.

## 0.3.0

### Minor Changes

- [#1](https://github.com/1001-digital/fine-images/pull/1) [`17e782c`](https://github.com/1001-digital/fine-images/commit/17e782caf8abfccc20ed8cf5b19d2ce0a05ba505) Thanks [@yougogirldoteth](https://github.com/yougogirldoteth)! - Add an `lg` image variant at 1200px for sources large enough to generate it.

## 0.2.0

### Minor Changes

- Trim `DEFAULT_TYPE_PREFIXES` down to `avatar` only. `header`, `token`, and `contract` are no longer built in — consumers who relied on them must pass their own mapping via `typePrefixes` in the config, e.g. `{ header: 'headers', token: 'tokens', contract: 'contracts' }`. **Breaking**: without this, existing rows resolve to `header/<scope>` instead of `headers/<scope>` on the disk.

## 0.1.1

### Patch Changes

- Re-export `configure` and `stubsRoot` from the package's main entry so `node ace configure @1001-digital/fine-images` picks up the hook. Without this, consumers see a "module does not export the configure hook" warning and have to wire the provider + migration by hand.
