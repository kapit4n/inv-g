#!/usr/bin/env node
/**
 * Generates the Inventory Gear application icon set.
 *
 * WHY THIS EXISTS
 * ---------------
 * The repository previously shipped four solid-colour PNGs (#4338CA, a single
 * flat square) and no `.ico` at all. Windows refuses to build a bundle without
 * `icon.ico`, so a Windows installer was impossible to produce. This script
 * renders a real, legible mark and emits every asset Tauri needs, including the
 * multi-resolution `.ico`.
 *
 * ⚠ PLACEHOLDER ARTWORK
 * This is a designed placeholder built from the app's brand indigo. It is NOT
 * the final Inventory Gear logo. Replace it by dropping the real artwork in and
 * re-running `npm run icons:generate`, or by exporting the assets listed in
 * docs/windows-installer.md directly. See "Icon requirements" there.
 *
 * No dependencies: PNG/ICO encoding is done with Node's built-in zlib.
 *
 * Usage: npm run icons:generate
 */

import { deflateSync } from "node:zlib"
import { writeFileSync, mkdirSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const HERE = dirname(fileURLToPath(import.meta.url))
const ICON_DIR = join(HERE, "..", "..", "src-tauri", "icons")

// ── brand ───────────────────────────────────────────────────────────────────
const INDIGO_DARK = [0x43, 0x38, 0xca] // #4338CA
const INDIGO_LIGHT = [0x63, 0x66, 0xf1] // #6366F1
const WHITE = [0xff, 0xff, 0xff]

const SS = 4 // supersampling factor for smooth edges

// ── tiny raster canvas (straight RGBA, non-premultiplied) ───────────────────
class Canvas {
  constructor(size) {
    this.size = size
    this.px = new Uint8Array(size * size * 4) // transparent
  }

  /** Source-over blend of a single pixel. */
  blend(x, y, [r, g, b], a) {
    if (a <= 0 || x < 0 || y < 0 || x >= this.size || y >= this.size) return
    const i = (y * this.size + x) * 4
    const dst = this.px
    const da = dst[i + 3] / 255
    const outA = a + da * (1 - a)
    if (outA <= 0) return
    dst[i] = (r * a + dst[i] * da * (1 - a)) / outA
    dst[i + 1] = (g * a + dst[i + 1] * da * (1 - a)) / outA
    dst[i + 2] = (b * a + dst[i + 2] * da * (1 - a)) / outA
    dst[i + 3] = outA * 255
  }

  /**
   * Fills every pixel for which `inside(x, y)` is true. `color` may be a
   * function of normalised (x, y) for gradients.
   */
  fill(inside, color) {
    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        if (!inside(x + 0.5, y + 0.5)) continue
        const c = typeof color === "function" ? color(x / this.size, y / this.size) : color
        this.blend(x, y, c, 1)
      }
    }
  }
}

/** Signed distance to a rounded rectangle, negative inside. */
function sdRoundRect(px, py, cx, cy, halfW, halfH, r) {
  const qx = Math.abs(px - cx) - (halfW - r)
  const qy = Math.abs(py - cy) - (halfH - r)
  const ax = Math.max(qx, 0)
  const ay = Math.max(qy, 0)
  return Math.hypot(ax, ay) + Math.min(Math.max(qx, qy), 0) - r
}

/** Coverage of a shape over one output pixel, via SS×SS supersampling. */
function coverage(size, sdf) {
  // Build one float coverage buffer for the whole canvas.
  const cov = new Float32Array(size * size)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let hits = 0
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const fx = x + (sx + 0.5) / SS
          const fy = y + (sy + 0.5) / SS
          if (sdf(fx, fy) <= 0) hits++
        }
      }
      cov[y * size + x] = hits / (SS * SS)
    }
  }
  return cov
}

/** Composite a coverage buffer with a colour (or per-pixel colour fn). */
function paint(cv, cov, color) {
  for (let y = 0; y < cv.size; y++) {
    for (let x = 0; x < cv.size; x++) {
      const a = cov[y * cv.size + x]
      if (a <= 0) continue
      const c = typeof color === "function" ? color(x / cv.size, y / cv.size) : color
      cv.blend(x, y, c, a)
    }
  }
}

const lerp = (a, b, t) => a + (b - a) * t
const gradient = (x, y) => [
  Math.round(lerp(INDIGO_LIGHT[0], INDIGO_DARK[0], y)),
  Math.round(lerp(INDIGO_LIGHT[1], INDIGO_DARK[1], y)),
  Math.round(lerp(INDIGO_LIGHT[2], INDIGO_DARK[2], y)),
]

/**
 * The mark: a rounded-square in indigo with a white isometric "crate" glyph —
 * a box outline with a lid seam. Chosen because it stays legible down to 16px,
 * unlike fine detail or text.
 */
function drawIcon(size) {
  const cv = new Canvas(size)
  const S = size

  // Background: rounded square filling ~92% of the canvas.
  const m = S * 0.04
  const half = (S - 2 * m) / 2
  const radius = S * 0.22
  paint(
    cv,
    coverage(S, (x, y) => sdRoundRect(x, y, S / 2, S / 2, half, half, radius)),
    gradient
  )

  // Glyph geometry, in units of the glyph box.
  const g = S * 0.52 // glyph extent
  const cx = S / 2
  const cy = S / 2
  const hw = g / 2
  const hh = g / 2
  const stroke = Math.max(S * 0.055, 1.15) // ring thickness

  // A box seen straight-on: outline + a lid seam across the upper third.
  const boxOuter = coverage(
    S,
    (x, y) => sdRoundRect(x, y, cx, cy, hw, hh, S * 0.045)
  )
  const boxInner = coverage(
    S,
    (x, y) => sdRoundRect(x, y, cx, cy, hw - stroke, hh - stroke, Math.max(S * 0.02, 0.5))
  )
  // Ring = outer minus inner.
  for (let i = 0; i < boxOuter.length; i++) boxOuter[i] = Math.max(0, boxOuter[i] - boxInner[i])
  paint(cv, boxOuter, WHITE)

  // Lid seam: a filled bar inset from the left/right ring, above centre.
  const seamTop = cy - hh * 0.34
  const seamH = stroke
  const seamHalfW = hw - stroke
  paint(
    cv,
    coverage(S, (x, y) => sdRoundRect(x, y, cx, seamTop + seamH / 2, seamHalfW, seamH / 2, seamH / 2)),
    WHITE
  )

  // Base bar of the box, giving it a "package" read.
  const baseTop = cy + hh * 0.16
  const baseHalfH = stroke * 0.62
  paint(
    cv,
    coverage(
      S,
      (x, y) => sdRoundRect(x, y, cx, baseTop + baseHalfH, seamHalfW, baseHalfH, baseHalfH)
    ),
    WHITE
  )

  return cv
}

// ── PNG encoding ────────────────────────────────────────────────────────────
const CRC_TABLE = (() => {
  const t = new Int32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c
  }
  return t
})()

function crc32(buf) {
  let c = -1
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ -1) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, "ascii"), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([len, body, crc])
}

function encodePng(cv) {
  const { size, px } = cv
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // colour type RGBA
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0

  // Filter type 0 per scanline.
  const raw = Buffer.alloc(size * (size * 4 + 1))
  for (let y = 0; y < size; y++) {
    const o = y * (size * 4 + 1)
    raw[o] = 0
    Buffer.from(px.buffer, y * size * 4, size * 4).copy(raw, o + 1)
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ])
}

// ── ICO encoding (PNG-compressed entries; supported on Windows Vista+) ───────
function encodeIco(images) {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0) // reserved
  header.writeUInt16LE(1, 2) // type: icon
  header.writeUInt16LE(images.length, 4)

  const dir = Buffer.alloc(16 * images.length)
  let offset = header.length + dir.length
  images.forEach((img, i) => {
    const o = i * 16
    dir[o] = img.size >= 256 ? 0 : img.size // 0 means 256
    dir[o + 1] = img.size >= 256 ? 0 : img.size
    dir[o + 2] = 0 // palette
    dir[o + 3] = 0 // reserved
    dir.writeUInt16LE(1, o + 4) // colour planes
    dir.writeUInt16LE(32, o + 6) // bits per pixel
    dir.writeUInt32LE(img.data.length, o + 8)
    dir.writeUInt32LE(offset, o + 12)
    offset += img.data.length
  })

  return Buffer.concat([header, dir, ...images.map((i) => i.data)])
}

// ── emit ────────────────────────────────────────────────────────────────────
mkdirSync(ICON_DIR, { recursive: true })

const cache = new Map()
const render = (size) => {
  if (!cache.has(size)) cache.set(size, encodePng(drawIcon(size)))
  return cache.get(size)
}

const pngs = [
  ["32x32.png", 32],
  ["128x128.png", 128],
  ["128x128@2x.png", 256],
  ["icon.png", 512],
  ["Square150x150Logo.png", 150],
  ["Square44x44Logo.png", 44],
  ["StoreLogo.png", 50],
]
for (const [name, size] of pngs) {
  writeFileSync(join(ICON_DIR, name), render(size))
  console.log(`  ${name.padEnd(24)} ${size}x${size}`)
}

// Windows .ico: the sizes Explorer, the taskbar and the installer actually use.
const icoSizes = [16, 24, 32, 48, 64, 128, 256]
writeFileSync(join(ICON_DIR, "icon.ico"), encodeIco(icoSizes.map((size) => ({ size, data: render(size) }))))
console.log(`  ${"icon.ico".padEnd(24)} ${icoSizes.join(", ")}`)
console.log(`\nWrote ${ICON_DIR}`)
