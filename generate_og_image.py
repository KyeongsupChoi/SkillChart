"""Generate a 1200x630 Open Graph preview image for SkillChart."""
from PIL import Image, ImageDraw, ImageFont
import os

BASE = os.path.dirname(__file__)
W, H = 1200, 630
out_path = os.path.join(BASE, "public", "og-image.png")

img = Image.new("RGB", (W, H), color=(255, 255, 255))
draw = ImageDraw.Draw(img)

# --- gradient background (purple → indigo) ---
for x in range(W):
    t = x / W
    r = int(102 + t * (90 - 102))
    g = int(126 + t * (103 - 126))
    b = int(234 + t * (216 - 234))
    draw.line([(x, 0), (x, H)], fill=(r, g, b))

# --- white card ---
card_margin = 60
card_x0, card_y0 = card_margin, card_margin
card_x1, card_y1 = W - card_margin, H - card_margin
radius = 24

def rounded_rect(draw, xy, radius, fill):
    x0, y0, x1, y1 = xy
    draw.rectangle([x0 + radius, y0, x1 - radius, y1], fill=fill)
    draw.rectangle([x0, y0 + radius, x1, y1 - radius], fill=fill)
    draw.ellipse([x0, y0, x0 + 2*radius, y0 + 2*radius], fill=fill)
    draw.ellipse([x1 - 2*radius, y0, x1, y0 + 2*radius], fill=fill)
    draw.ellipse([x0, y1 - 2*radius, x0 + 2*radius, y1], fill=fill)
    draw.ellipse([x1 - 2*radius, y1 - 2*radius, x1, y1], fill=fill)

rounded_rect(draw, (card_x0, card_y0, card_x1, card_y1), radius, (255, 255, 255))

# --- fonts ---
try:
    font_title = ImageFont.truetype("arialbd.ttf", 68)
    font_sub   = ImageFont.truetype("arial.ttf",   30)
    font_tag   = ImageFont.truetype("arial.ttf",   24)
except OSError:
    font_title = ImageFont.load_default()
    font_sub   = font_title
    font_tag   = font_title

purple = (102, 126, 234)
indigo = (90,  103, 216)
gray   = (107, 114, 128)
dark   = (31,  41,  55)

# --- logo (left side, circular crop) ---
logo_size = 220
logo_path = os.path.join(BASE, "sclogo.png")
logo = Image.open(logo_path).convert("RGBA")
logo = logo.resize((logo_size, logo_size), Image.LANCZOS)

# circular mask
mask = Image.new("L", (logo_size, logo_size), 0)
ImageDraw.Draw(mask).ellipse([0, 0, logo_size, logo_size], fill=255)
logo.putalpha(mask)

logo_x = card_x0 + 55
logo_y = card_y0 + (card_y1 - card_y0 - logo_size) // 2
img.paste(logo, (logo_x, logo_y), logo)

# --- text block (right of logo) ---
tx = logo_x + logo_size + 50
cx_text = tx + (card_x1 - tx) // 2

# title
title_y = card_y0 + 110
draw.text((cx_text, title_y), "SkillChart", font=font_title, fill=dark, anchor="mm")

# divider
div_y = title_y + 55
draw.rectangle([cx_text - 100, div_y, cx_text + 100, div_y + 3], fill=purple)

# subtitle
draw.text((cx_text, div_y + 42), "Developer Skills Evaluator", font=font_sub, fill=gray, anchor="mm")

# tags
tags = ["Backend", "Data Science", "Python", "SQL", "LLM / AI"]
tag_w, tag_h, tag_gap = 128, 34, 10
total_tag_w = len(tags) * tag_w + (len(tags) - 1) * tag_gap
tag_start_x = cx_text - total_tag_w // 2
tag_y = div_y + 105

for tag in tags:
    rounded_rect(draw, (tag_start_x, tag_y, tag_start_x + tag_w, tag_y + tag_h), 9, (237, 242, 255))
    draw.text((tag_start_x + tag_w // 2, tag_y + tag_h // 2), tag,
              font=font_tag, fill=indigo, anchor="mm")
    tag_start_x += tag_w + tag_gap

# URL
draw.text((cx_text, tag_y + tag_h + 45), "skillchart.onrender.com",
          font=font_tag, fill=gray, anchor="mm")

img.save(out_path, "PNG", optimize=True)
print(f"Saved: {out_path}")
