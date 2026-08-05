---
'@1001-digital/fine-images': minor
---

Allow `resizeImage` and `fineImages.put` callers to raise Sharp's input pixel
limit to a positive, bounded value without exposing the option to disable the
safety guard for untrusted images.
