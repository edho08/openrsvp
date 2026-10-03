"""Rebuild web derivatives from the supplied PNG layers (pip install Pillow)."""
import hashlib
import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'assets/grand-opening/source'
OUTPUT = ROOT / 'web/static/invite/grand-opening'

# Explicit provenance, never infer an asset from its arbitrary exported layer number.
LAYERS = {
    'envelope-top': ('Sec 1/Kertas Atas.png', None),
    'envelope-bottom': ('Sec 1/Kertas Bawah.png', None),
    'cover-title': ('Sec 1/Judul.png', None),
    'cover-tagline': ('Sec 1/Tagline.png', None),
    'seal': ('Sec 1/Stamp.png', None),
    'scroll': ('Sec 1/scroll.png', None),
    'office-front': ('Sec 2/Foto sec 2.png', None),
    'invitation-title': ('Sec 2/Artboard 2 copy.png', (185, 95, 900, 275)),
    'journey-panel': ('Sec 3/Shape Hijau sec 3.png', None),
    'journey-poster': ('Sec 3/Artboard 3 copy.png', (120, 489, 961, 950)),
    'office-meeting': ('Sec 4/Foto sec 4.png', None),
    'value-collaboration': ('Sec 4/Ruang untuk Berkolaborasi.png', None),
    'value-innovation': ('Sec 4/Energi Baru untuk Berinovasi_.png', None),
    'value-comfort': ('Sec 4/Lingkungan yang Lebih Nyaman.png', None),
    'value-growth': ('Sec 4/Langkah Lebih Jauh untuk UMKM_.png', None),
    'office-workspace': ('Sec 5/Foto sec 5.png', None),
    'detail-calendar': ('Sec 5/Layer 10.png', None),
    'detail-clock': ('Sec 5/Layer 9.png', None),
    'detail-location': ('Sec 5/Layer 11.png', None),
    'maps-frame': ('Sec 5/Shape Maps sec 5.png', None),
    'maps-button': ('Sec 5/Shape button hitau sec 5.png', None),
    'maps-preview': ('Sec 5/Artboard 5 copy.png', (162, 751, 916, 1080)),
    'rsvp-panel': ('Sec 6/Shape sec 6.png', None),
    'office-closing': ('Sec 7/Foto sec 7.png', None),
    'closing-title': ('Sec 7/See you Sec 7.png', None),
    'brand-logo': ('Sec 7/Artboard 7 copy.png', (355, 85, 725, 175)),
    'social-instagram': ('Sec 7/Layer 17.png', None),
    'social-youtube': ('Sec 7/Layer 18.png', None),
    'social-tiktok': ('Sec 7/Layer 19.png', None),
}


def main():
    OUTPUT.mkdir(parents=True, exist_ok=True)
    manifest = {'version': 1, 'referenceWidth': 1080, 'assets': {}}
    for name, (relative, crop) in LAYERS.items():
        path = SOURCE / relative
        image = Image.open(path).convert('RGBA')
        if crop:
            image = image.crop(crop)
        # Keep text, icons and translucent paper lossless; photographic exports
        # already contain fades, so retain alpha in WebP rather than flattening it.
        lossless = image.width < 1000 and name not in ('journey-poster', 'maps-preview', 'journey-panel', 'rsvp-panel')
        output = OUTPUT / f'{name}.webp'
        image.save(output, 'WEBP', quality=92, method=6, lossless=lossless, exact=True)
        manifest['assets'][name] = {
            'source': relative, 'crop': crop, 'width': image.width,
            'height': image.height, 'url': f'/invite/grand-opening/{name}.webp',
            'bytes': output.stat().st_size,
            'sourceSha256': hashlib.sha256(path.read_bytes()).hexdigest(),
            'sha256': hashlib.sha256(output.read_bytes()).hexdigest(),
        }
    (OUTPUT / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
    print(f'{len(LAYERS)} assets; {sum(a["bytes"] for a in manifest["assets"].values()):,} web bytes')


if __name__ == '__main__':
    main()
