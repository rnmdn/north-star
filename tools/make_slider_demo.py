"""Generate the short, silent Skills today walkthrough."""

import os
import shutil
import subprocess
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "skill-slider-demo.mp4"
POSTER = ROOT / "assets" / "skill-slider-demo.png"
FONT = Path("C:/Windows/Fonts/segoeui.ttf")
BOLD = Path("C:/Windows/Fonts/segoeuib.ttf")
W, H = 800, 450
FPS = 10
FRAMES = 90
BLUE = "#3d62ee"
INK = "#092451"
MUTED = "#547095"
PALE = "#e9f2ff"


def font(size, bold=False):
    return ImageFont.truetype(str(BOLD if bold else FONT), size)


def center(draw, x, y, label, size, color, bold=False):
    draw.text((x, y), label, anchor="mt", font=font(size, bold), fill=color)


def frame(index):
    seconds = index / FPS
    image = Image.new("RGB", (W, H), "#f5f8fd")
    draw = ImageDraw.Draw(image)
    draw.rounded_rectangle((20, 20, 780, 430), radius=20, fill="white", outline="#c6d8f2", width=2)
    draw.rounded_rectangle((20, 20, 780, 104), radius=20, fill=PALE)
    draw.rectangle((20, 83, 780, 104), fill=PALE)
    draw.text((52, 48), "Skills today", font=font(30, True), fill=INK)
    draw.text((52, 124), "Programming", font=font(25, True), fill=INK)

    if seconds < 2:
        value = 0
        caption = "Move the slider to choose your level"
    elif seconds < 5.5:
        value = min(2, (seconds - 2) / 1.5)
        caption = "Choose what you can demonstrate today"
    elif seconds < 7:
        value = 2
        caption = "Can apply: I can do it independently"
    else:
        value = 2
        caption = "Your choice saves in this tab"

    output = "Move slider to choose" if seconds < 2 else ["Not yet", "Getting started", "Can apply"][min(2, round(value))]
    draw.text((52, 168), output, font=font(19, True), fill="#087c91")

    left, right, y = 95, 705, 248
    x = round(left + (right - left) * value / 3)
    draw.rounded_rectangle((left, y - 4, right, y + 4), radius=4, fill="#dbe3ef")
    draw.rounded_rectangle((left, y - 4, max(left + 4, x), y + 4), radius=4, fill=BLUE)
    for stop in range(4):
        sx = round(left + (right - left) * stop / 3)
        draw.ellipse((sx - 6, y - 6, sx + 6, y + 6), fill=BLUE if sx <= x else "#aebbd0")
    draw.ellipse((x - 14, y - 14, x + 14, y + 14), fill="white", outline=BLUE, width=4)

    for stop, label in enumerate(["Not yet", "Getting started", "Can apply", "Confident"]):
        sx = left + (right - left) * stop / 3
        center(draw, sx, 278, label, 17, INK if stop == round(value) else MUTED, stop == round(value))

    draw.rounded_rectangle((52, 344, 748, 398), radius=10, fill=PALE)
    center(draw, 400, 355, caption, 21, INK, True)
    return image


encoder = os.environ.get("FFMPEG_BIN") or shutil.which("ffmpeg")
if not encoder:
    raise SystemExit("Set FFMPEG_BIN to the ffmpeg executable before generating the demo.")

frames_dir = ROOT / "tools" / "demo-frames"
frames_dir.mkdir(exist_ok=True)
try:
    for index in range(FRAMES):
        image = frame(index)
        if index == 0:
            image.save(POSTER)
        image.save(frames_dir / f"frame-{index:03}.png")
    subprocess.run(
        [encoder, "-y", "-loglevel", "error", "-framerate", str(FPS),
         "-i", str(frames_dir / "frame-%03d.png"), "-c:v", "libx264",
         "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(OUT)],
        check=True,
    )
finally:
    shutil.rmtree(frames_dir)
print(f"Saved {OUT} ({OUT.stat().st_size:,} bytes)")
