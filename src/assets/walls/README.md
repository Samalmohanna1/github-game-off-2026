# Wall images

Every PNG, JPEG or WebP in this folder becomes a wall. Drop a file in and
restart `npm run dev` (or run `npm run build`). There is nothing to register:
`src/data/wall-images.ts` picks up the folder's images by name.

- **Shape:** the wall is about 2.8 : 1 (1144 × 410 px at full size). Other
  shapes are scaled to cover the wall and cropped evenly from the middle, so
  a 3 : 2 photo shows only its middle half, top to bottom. Keep the
  important part near the center, or crop to about 2.8 : 1 first.
- **Size:** about 1600 × 580 px is plenty. The wall is never shown larger
  than its full size. The images load in the background after the game
  starts, and walls use whichever have arrived, so big files mostly cost
  download time on itch.io; a 1600 px JPEG at quality 80 is usually well
  under 300 KB.
- **Where the hole goes:** the hole is cut from the wall's lower half, in any
  of the seven lanes across it, and opens onto the floor. It changes from wall
  to wall, so any part of the image's lower half can be the missing piece.
  When the wall is cleared, the figure's pixels take that piece's colors and
  the picture fills back in.
- **Order:** the images are shuffled, and each one shows once before any
  repeats.

Until an image has loaded, the wall is a plain forest-green panel.
