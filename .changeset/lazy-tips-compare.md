---
"@1001-digital/fine-images": minor
---

Rename image cache identity fields from `scope` to `cid`.

This is a breaking change for existing installations. Before upgrading, add an app migration that renames the `image_caches.scope` column to `cid`, and update custom callers or Lucid relations that still reference `scope` to use `cid`.
