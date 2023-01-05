export type RGBAColor = [number, number, number, number];
export type RGBColor = [number, number, number];
export type LABColor = [number, number, number];

let helperDiv: HTMLElement;
const colorCache: Record<string, RGBAColor> = {};

const rxHexColor = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/;

// slightly simplified regex to parse all rgb() and rgba() formats
const rxRgbColor =
  /^rgba?\(\s*(\d+%?)\s*,\s*(\d+%?)\s*,\s*(\d+%?)(?:\s*[,/]\s*(\d*(?:\.\d*)?%?)?)?\)$/;

/**
 * Parses the given css color-value and returns it as `RGBAColor` (r/g/b in
 * range [0..255] a in range [0..1]).
 *
 * Color values are parsed using a fast-path for hex- and rgb-colors and a
 * hidden dom-element and `getComputedStyle()` to get the rgb-values for any
 * other valid css color-value including css custom-properties. Since computing
 * the color-values this way can be expensive, the values for those more complex
 * formats are cached.
 *
 * @param color
 */
export function parseCssColorValue(color: string): RGBAColor {
  // fast paths for most common formats
  if (rxHexColor.test(color)) {
    return parseHexColor(color);
  } else if (rxRgbColor.test(color)) {
    return parseRgbColor(color);
  }

  if (colorCache[color]) {
    return colorCache[color].slice(0) as RGBAColor;
  }

  if (!helperDiv) {
    helperDiv = document.createElement('div');
    helperDiv.style.cssText = `
        position: absolute;
        visibility: hidden;
        pointer-events: none;
      `;
  }
  helperDiv.style.color = color;
  document.body.appendChild(helperDiv);
  const rgb = getComputedStyle(helperDiv).color;
  helperDiv.remove();

  return (colorCache[color] = parseRgbColor(rgb));
}

function parseHexColor(color: string): RGBAColor {
  if (color.length < 7) {
    // '#rgb'
    return [
      Number('0x' + color[1].repeat(2)),
      Number('0x' + color[2].repeat(2)),
      Number('0x' + color[3].repeat(2)),
      color.length === 4 ? 1 : Number('0x' + color[4].repeat(2))
    ];
  }

  // '#rrggbb' / '#rrggbbaa'
  return [
    Number('0x' + color.slice(1, 3)),
    Number('0x' + color.slice(3, 5)),
    Number('0x' + color.slice(5, 7)),
    color.length === 7 ? 1 : Number('0x' + color.slice(7, 9))
  ];
}

function parseRgbColor(color: string): RGBAColor {
  try {
    const [, r, g, b, a] = color.match(rxRgbColor)!;
    const c = [r, g, b, a];

    return c
      .filter(s => s !== undefined) // alpha might be undefined
      .map(s => (s.endsWith('%') ? Number(s) * 2.55 : Number(s))) as RGBAColor;
  } catch (err) {
    console.error(`rgb-color parsing failed (parsing value: '${color}')`);

    return [0, 0, 0, 1];
  }
}

export function rgbaToString(rgb: RGBColor | RGBAColor): string {
  return (rgb.length === 4 ? `rgba` : `rgb`) + `(${rgb.join(',')})`;
}

/**
 * Computes the relative luminance of the specified color-value (range [0..1]).
 * See http://www.w3.org/TR/2008/REC-WCAG20-20081211/#relativeluminancedef
 */
export function luminance(rgb: RGBColor | RGBAColor) {
  const [r, g, b] = rgb.map(n => n / 255);

  return (
    0.2126 * channelLuminance(r) +
    0.7152 * channelLuminance(g) +
    0.0722 * channelLuminance(b)
  );
}

const channelLuminance = (x: number) =>
  x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);

/**
 * Darkens the given color by the amount specified. An amount of 1 is roughly
 * one step in the material design palette.
 *
 * @param rgb
 * @param amount
 */
export function darken(rgb: RGBColor, amount?: number): RGBColor;
export function darken(rgba: RGBAColor, amount?: number): RGBAColor;
export function darken(rgbIn: RGBColor | RGBAColor, amount = 1) {
  return labBrightnessAdjust(rgbIn, -amount);
}

/**
 * Brightens the given color by the amount specified. An amount of 1 is roughly
 * one step in the material design palette.
 *
 * @param rgb
 * @param amount
 */
export function brighten(rgb: RGBColor, amount?: number): RGBColor;
export function brighten(rgba: RGBAColor, amount?: number): RGBAColor;
export function brighten(rgbIn: RGBColor | RGBAColor, amount = 1) {
  return labBrightnessAdjust(rgbIn, amount);
}

function labBrightnessAdjust(rgbIn: RGBColor | RGBAColor, amount = 1) {
  const [r, g, b, alpha = 1] = rgbIn;

  const lab = rgb2lab([r, g, b]);
  lab[0] += LAB_CONSTANTS.Kn * amount;
  const rgbOut = lab2rgb(lab);

  return alpha === 1 ? rgbOut : [...rgbOut, alpha];
}

// the code below was adapted from the implementation in chroma.js
// Copyright (c) 2011-2019, Gregor Aisch
// Licensed under BSD-3-Clause / Apache-2.0
// https://raw.githubusercontent.com/gka/chroma.js/b2fc17a34d729f4d1fc3a30dabd61caa34245526/LICENSE

const LAB_CONSTANTS = {
  // Corresponds roughly to RGB brighter/darker
  Kn: 18,

  // D65 standard referent
  Xn: 0.95047,
  Yn: 1,
  Zn: 1.08883,

  t0: 0.137931034, // 4 / 29
  t1: 0.206896552, // 6 / 29
  t2: 0.12841855, // 3 * t1 * t1
  t3: 0.008856452 // t1 * t1 * t1
};

function rgb2lab([r, g, b]: RGBColor): LABColor {
  r = rgb_xyz(r);
  g = rgb_xyz(g);
  b = rgb_xyz(b);
  const x = xyz_lab(
    (0.4124564 * r + 0.3575761 * g + 0.1804375 * b) / LAB_CONSTANTS.Xn
  );
  const y = xyz_lab(
    (0.2126729 * r + 0.7151522 * g + 0.072175 * b) / LAB_CONSTANTS.Yn
  );
  const z = xyz_lab(
    (0.0193339 * r + 0.119192 * g + 0.9503041 * b) / LAB_CONSTANTS.Zn
  );

  const l = 116 * y - 16;
  return [l < 0 ? 0 : l, 500 * (x - y), 200 * (y - z)];
}

function rgb_xyz(r: number) {
  if ((r /= 255) <= 0.04045) return r / 12.92;
  return Math.pow((r + 0.055) / 1.055, 2.4);
}

function xyz_lab(t: number) {
  if (t > LAB_CONSTANTS.t3) return Math.pow(t, 1 / 3);
  return t / LAB_CONSTANTS.t2 + LAB_CONSTANTS.t0;
}

/*
 * L* [0..100]
 * a [-100..100]
 * b [-100..100]
 */
function lab2rgb([l, a, b]: LABColor) {
  let x, y, z;

  y = (l + 16) / 116;
  x = isNaN(a) ? y : y + a / 500;
  z = isNaN(b) ? y : y - b / 200;

  y = LAB_CONSTANTS.Yn * lab_xyz(y);
  x = LAB_CONSTANTS.Xn * lab_xyz(x);
  z = LAB_CONSTANTS.Zn * lab_xyz(z);

  const r = xyz_rgb(3.2404542 * x - 1.5371385 * y - 0.4985314 * z); // D65 -> sRGB
  const g = xyz_rgb(-0.969266 * x + 1.8760108 * y + 0.041556 * z);
  const b_ = xyz_rgb(0.0556434 * x - 0.2040259 * y + 1.0572252 * z);

  return [r, g, b_];
}

function xyz_rgb(r: number) {
  return (
    255 * (r <= 0.00304 ? 12.92 * r : 1.055 * Math.pow(r, 1 / 2.4) - 0.055)
  );
}

function lab_xyz(t: number) {
  return t > LAB_CONSTANTS.t1
    ? t * t * t
    : LAB_CONSTANTS.t2 * (t - LAB_CONSTANTS.t0);
}
