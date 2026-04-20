# @1001-digital/fine-images

## 0.1.1

### Patch Changes

- Re-export `configure` and `stubsRoot` from the package's main entry so `node ace configure @1001-digital/fine-images` picks up the hook. Without this, consumers see a "module does not export the configure hook" warning and have to wire the provider + migration by hand.
