# Grand Opening asset library

`source/Sec 1` … `source/Sec 7` preserve all 32 supplied PNG exports verbatim,
including the seven artboards used for comparison. Their combined size is about
19 MB, so they are tracked directly in Git. GitHub refused new LFS objects for
this public fork. `.DS_Store` is not imported. These are user-supplied branding
assets, not a new third-party stock-image collection; no additional license is
asserted.

The browser loads only `web/static/invite/grand-opening/*.webp`, never source PNGs
or entire artboards. Runtime derivatives are committed so CI and Docker do not
need to execute the conversion script. Source PNGs are excluded from Docker's
context.

## Reproduce / replace

```sh
python -m pip install Pillow==11.2.1
python scripts/build-grand-opening-assets.py
```

Keep source exports in their original section folders. The explicit layer map in
the conversion script is the authority for arbitrary exporter names (`Layer 9`
is the clock, `Layer 10` the calendar). Update that map when replacing artwork.
The generated manifest records source/crop, dimensions, URL, byte size, and both
source and output SHA-256 hashes. Crops are limited to missing individual exports:
Undangan lettering, brand logo, video poster, and map preview. The map preview
omits the baked-in button; the web supplies the actual linked button.

Lossless WebP protects small lettering/icons; photographic layers use quality 92
and retain their supplied alpha/fades. Widths stay at source resolution (1080px
photos); do not upscale assets. Run the generator before checking/building `web`.
Normal builds do not require Python or Pillow. The source images are ordinary Git
blobs in this public fork; if this repository is moved to a GitHub organization
or non-fork origin with LFS support, the source path can be migrated then.

## Reference fidelity and functional differences

The seven sections use the original 1080px artboard geometry scaled with container
units, original envelope/seal/title/photos/icons, and HTML for replaceable text.
Custom recipient names remain HTML and use bundled Great Vibes: the original
brush script font was not supplied, so arbitrary names cannot yet be pixel-identical.
Static cover/Undangan/closing lettering is the supplied original artwork.

The live RSVP reuses OpenRSVP validation and persistence, not a screenshot. It
retains required email/phone according to event settings and the `maybe` state,
which are not present in the artwork. Optional organization uses an existing text
event question named `Instansi / Perusahaan`; no new table is required. Optional
dietary/plus-one inputs remain available on legacy invitations and manage links.
Success/error/capacity/closed states change form height naturally; sections expand
for longer configurable copy instead of clipping it to a fixed pixel canvas.

The supplied journey image is a poster, not a video file or playable URL. Set
`videoUrl` when provided. Social icons remain non-clickable when a safe URL has
not been configured; no accounts or video destinations are fabricated.
