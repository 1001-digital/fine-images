---
'@1001-digital/fine-images': minor
---

Allow `resizeImage` and `fineImages.put` callers to request lossless WebP
variants. This preserves hard edges and exact colours in rendered SVG artwork
while leaving the existing lossy encoding as the default for photographs.
