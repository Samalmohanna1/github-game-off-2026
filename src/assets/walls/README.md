# Wall images

Every PNG, JPEG or WebP in this folder becomes a wall. Drop a file in and
restart `npm run dev` (or run `npm run build`). There is nothing to register:
`src/data/wall-images.ts` picks up the folder's images by name.

- **Shape:** the wall is about 2.8 : 1 (1144 × 410 px at full size). Other
  shapes are scaled to cover the wall and cropped evenly from the middle, so
  keep the important part near the center.
- **Size:** about 1600 × 580 px is plenty. The wall is never shown larger
  than its full size, and bigger files only slow the first load.
- **Where the hole goes:** the hole is cut from the wall's lower half, in any
  of the seven lanes across it, and opens onto the floor. It changes from wall
  to wall, so any part of the image's lower half can be the missing piece.
- **Order:** the images are shuffled, and each one shows once before any
  repeats.

With no images here, every wall is a plain forest-green panel.
