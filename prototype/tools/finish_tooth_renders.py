"""Prepare lightweight transparent WebP previews and shareable JPGs from Blender renders."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

out = Path(__file__).resolve().parents[1] / 'assets' / 'tooth3d'
for name in ('hero', 'anatomy'):
    art = Image.open(out / f'{name}.png').convert('RGBA')
    width, height = art.size
    art.save(out / f'{name}.webp', format='WEBP', quality=93, method=6)

    background = Image.new('RGBA', art.size)
    draw = ImageDraw.Draw(background)
    for y in range(height):
        t = y / (height - 1)
        draw.line((0, y, width, y), fill=(int(239 - 11*t), int(250 - 7*t), int(255 - 3*t), 255))
    glow = Image.new('RGBA', art.size)
    ImageDraw.Draw(glow).ellipse((width*.14, height*.12, width*.86, height*.85), fill=(60, 205, 225, 25))
    background = Image.alpha_composite(background, glow.filter(ImageFilter.GaussianBlur(width*.075)))
    Image.alpha_composite(background, art).convert('RGB').save(
        out / f'{name}.jpg', quality=95, optimize=True, subsampling=0
    )
    print(f'{name}: WebP and JPG updated')
