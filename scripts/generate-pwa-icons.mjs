import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = resolve(process.cwd(), "public/icons");

const palette = {
  background: [5, 7, 13, 255],
  outerGlow: [56, 189, 248, 255],
  innerGlow: [37, 99, 235, 255],
  white: [248, 250, 252, 255],
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function crc32(buffer) {
  let crc = 0xffffffff;

  for (let i = 0; i < buffer.length; i += 1) {
    crc ^= buffer[i];

    for (let bit = 0; bit < 8; bit += 1) {
      const mask = -(crc & 1);
      crc = (crc >>> 1) ^ (0xedb88320 & mask);
    }
  }

  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type, "ascii");
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);

  const crcBuffer = Buffer.alloc(4);
  crcBuffer.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);

  return Buffer.concat([length, typeBuffer, data, crcBuffer]);
}

function pngFromPixels(size, drawPixel) {
  const raw = Buffer.alloc((size * 4 + 1) * size);

  for (let y = 0; y < size; y += 1) {
    const rowStart = y * (size * 4 + 1);
    raw[rowStart] = 0;

    for (let x = 0; x < size; x += 1) {
      const offset = rowStart + 1 + x * 4;
      const [r, g, b, a] = drawPixel(x, y, size);
      raw[offset] = r;
      raw[offset + 1] = g;
      raw[offset + 2] = b;
      raw[offset + 3] = a;
    }
  }

  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8;
  header[9] = 6;
  header[10] = 0;
  header[11] = 0;
  header[12] = 0;

  const signature = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
  ]);
  const body = Buffer.concat([
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);

  return Buffer.concat([signature, body]);
}

function mix(from, to, amount) {
  return [
    Math.round(from[0] + (to[0] - from[0]) * amount),
    Math.round(from[1] + (to[1] - from[1]) * amount),
    Math.round(from[2] + (to[2] - from[2]) * amount),
    255,
  ];
}

function createIcon(size, maskable = false) {
  const center = size / 2;
  const maxRadius = size * (maskable ? 0.34 : 0.42);
  const glowRadius = size * (maskable ? 0.46 : 0.48);
  const barWidth = size * 0.085;
  const barHeight = size * 0.42;
  const gap = size * 0.065;
  const curveRadius = size * 0.08;
  const leftBarX = center - gap - barWidth;
  const rightBarX = center + gap;
  const topY = center - barHeight / 2;
  const bottomY = center + barHeight / 2;
  const bridgeY = center - barHeight * 0.04;

  return pngFromPixels(size, (x, y) => {
    const dx = x - center;
    const dy = y - center;
    const distance = Math.sqrt(dx * dx + dy * dy);

    let pixel = [...palette.background];

    const glowAmount = clamp(1 - distance / glowRadius, 0, 1);
    if (glowAmount > 0) {
      const outer = mix(palette.background, palette.outerGlow, glowAmount * 0.75);
      pixel = outer;
    }

    const coreAmount = clamp(1 - distance / maxRadius, 0, 1);
    if (coreAmount > 0) {
      pixel = mix(pixel, palette.innerGlow, coreAmount * 0.85);
    }

    const inLeftBar =
      x >= leftBarX &&
      x <= leftBarX + barWidth &&
      y >= topY &&
      y <= bottomY;
    const inRightBar =
      x >= rightBarX &&
      x <= rightBarX + barWidth &&
      y >= topY &&
      y <= bottomY;
    const inBridge =
      y >= bridgeY - barWidth / 2 &&
      y <= bridgeY + barWidth / 2 &&
      x >= leftBarX &&
      x <= rightBarX + barWidth;
    const arcDx = x - center;
    const arcDy = y - (bridgeY + curveRadius);
    const arcDistance = Math.sqrt(arcDx * arcDx + arcDy * arcDy);
    const inArc =
      arcDistance >= curveRadius - barWidth / 2 &&
      arcDistance <= curveRadius + barWidth / 2 &&
      y >= bridgeY &&
      y <= bottomY;

    if (inLeftBar || inRightBar || inBridge || inArc) {
      pixel = [...palette.white];
    }

    return pixel;
  });
}

function writeIcon(fileName, size, maskable = false) {
  const filePath = resolve(root, fileName);
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, createIcon(size, maskable));
}

writeIcon("badge-72x72.png", 72);
writeIcon("icon-192x192.png", 192);
writeIcon("icon-512x512.png", 512);
writeIcon("icon-maskable-512x512.png", 512, true);
writeIcon("apple-touch-icon.png", 180);
