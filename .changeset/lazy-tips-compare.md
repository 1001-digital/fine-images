---
"@1001-digital/fine-images": minor
---

Rename image cache identity fields to `key` and `scope`.

This is a breaking change for existing installations. Before upgrading, add an app migration that renames the image identity column to `key`, the logical bucket/type column to `scope`, adds a single `id` primary key, and moves the logical cache identity to a unique `(key, scope)` constraint. Update custom callers or Lucid relations to use the new names.
