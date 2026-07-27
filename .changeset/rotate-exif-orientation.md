---
'@1001-digital/fine-images': patch
---

Auto-orient rasters from their EXIF orientation tag before resizing. Sharp
neither applies nor preserves the `Orientation` tag by default, so camera JPEGs
tagged 6/8 (portrait shot on a rotated sensor) were resized to sideways webp
variants while the untouched original still displayed upright. `resizeImage`
now calls `.rotate()` and gates size generation on the displayed width.
