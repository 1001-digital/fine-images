---
"@1001-digital/fine-images": minor
---

Rename image cache identity fields to `key` and `scope`.

This is a breaking change for existing installations. Before upgrading, add an app migration that renames the image identity column to `key`, the logical bucket/type column to `scope`, and update custom callers or Lucid relations to use the new names.

Image variant filenames now use `@<size>.webp`, for example `avatars/0x123@sm.webp`, instead of `_<size>.webp`.
