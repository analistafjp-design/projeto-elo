"""Gera os ícones PWA do ELO (executado uma vez para popular public/icons).

Uso: python3 scripts/generate-icons.py
"""

from PIL import Image, ImageDraw, ImageFont
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ICONS_DIR = os.path.join(ROOT, "public", "icons")
os.makedirs(ICONS_DIR, exist_ok=True)

BLUE_DARK = (11, 42, 74, 255)      # #0B2A4A
BLUE = (22, 104, 227, 255)         # #1668E3
WHITE = (255, 255, 255, 255)


def draw_mark(draw: ImageDraw.ImageDraw, size: int, color=WHITE):
    """Desenha o monograma 'E' estilizado em formato de elo (dois arcos entrelaçados)."""
    cx, cy = size / 2, size / 2
    r_outer = size * 0.30
    r_stroke = max(int(size * 0.085), 2)

    offset = size * 0.14
    bbox1 = [cx - r_outer - offset, cy - r_outer, cx + r_outer - offset, cy + r_outer]
    bbox2 = [cx - r_outer + offset, cy - r_outer, cx + r_outer + offset, cy + r_outer]

    draw.ellipse(bbox1, outline=color, width=r_stroke)
    draw.ellipse(bbox2, outline=color, width=r_stroke)


def make_icon(size: int, filename: str, padding_ratio: float = 0.0, maskable: bool = False):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    if maskable:
        draw.rectangle([0, 0, size, size], fill=BLUE_DARK)
    else:
        radius = int(size * 0.22)
        draw.rounded_rectangle([0, 0, size, size], radius=radius, fill=BLUE_DARK)

    draw_mark(draw, size, color=WHITE)

    img.save(os.path.join(ICONS_DIR, filename))
    print(f"gerado: {filename} ({size}x{size})")


def make_favicon():
    size = 64
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    radius = int(size * 0.22)
    draw.rounded_rectangle([0, 0, size, size], radius=radius, fill=BLUE_DARK)
    draw_mark(draw, size, color=WHITE)
    img.save(os.path.join(ROOT, "public", "favicon.png"))
    print("gerado: favicon.png")


def make_splash(width: int, height: int, filename: str):
    img = Image.new("RGBA", (width, height), BLUE_DARK)
    draw = ImageDraw.Draw(img)
    mark_size = min(width, height) * 0.32
    cx, cy = width / 2, height / 2
    tmp = Image.new("RGBA", (int(mark_size * 2), int(mark_size * 2)), (0, 0, 0, 0))
    tmp_draw = ImageDraw.Draw(tmp)
    draw_mark(tmp_draw, int(mark_size * 2), color=WHITE)
    img.paste(tmp, (int(cx - mark_size), int(cy - mark_size)), tmp)
    img.save(os.path.join(ICONS_DIR, filename))
    print(f"gerado: {filename} ({width}x{height})")


if __name__ == "__main__":
    make_icon(192, "icon-192.png")
    make_icon(512, "icon-512.png")
    make_icon(192, "icon-maskable-192.png", maskable=True)
    make_icon(512, "icon-maskable-512.png", maskable=True)
    make_icon(180, "apple-touch-icon.png")
    make_favicon()
    make_splash(1170, 2532, "splash-iphone.png")
    make_splash(1024, 1024, "splash-square.png")
    print("Concluído.")
