# DUET field explorer

[**Open the interactive magnifier →**](https://xfengwei.github.io/magnifier/)

This is a dependency-free static page. GitHub Pages can serve `index.html`,
`styles.css`, and `script.js` directly; there is no framework, package install, or
build step.

## Image assets

The six legacy PNG exports are stored in this repository. The viewer treats
each plain/source pair as the same normalized field footprint so switching
views does not move the sampled position.

The Cloud e filenames are historically reversed: `cloude_sourc.png` is the
unmarked image and `cloude_plain.png` contains the source markers. The mapping
in `script.js` deliberately corrects that naming mismatch.

If the assets are re-exported, preserve an identical crop and aspect ratio for
the plain and source-marked versions. Their intrinsic pixel dimensions may
differ, but their field boundaries must remain registered.

## Magnifier geometry

Pointer locations are stored as normalized coordinates in the image. The lens
image is rendered at the displayed image size multiplied by the selected zoom,
then offset in pixels so the sampled point lands at the lens viewport center:

```text
left = lensWidth / 2 - imageX * zoom
top  = lensHeight / 2 - imageY * zoom
```

This avoids the drift caused by percentage-based CSS background positioning in
the original implementation.

## Controls

- Pointer: move over the image.
- Touch or pen: tap or drag; the last position remains visible.
- Keyboard: focus the viewer, use the arrow keys to move, `+`/`-` to zoom, and
  `Escape` to close the lens.
