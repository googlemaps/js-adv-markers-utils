let helperDiv: HTMLElement;

export type RGBAColor = [number, number, number, number];
export type RGBColor = [number, number, number];
export type HSLColor = [number, number, number];

const colorCache: Record<string, RGBAColor> = {};

export function parseCssColorValue(color: string): RGBAColor {
  if (!colorCache[color]) {
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
    const [r = 0, g = 0, b = 0, a = 1] = rgb
      .slice(rgb.indexOf('(') + 1, rgb.indexOf(')'))
      .split(/,\s*/)
      .map(Number);
    helperDiv.remove();
    colorCache[color] = [r, g, b, a];
  }

  return colorCache[color].slice(0) as RGBAColor;
}

export function rgbaToString(rgb: RGBColor | RGBAColor): string {
  if (rgb.length === 4) return `rgba(${rgb.join(',')})`;
  return `rgb(${rgb.join(',')})`;
}

// relative luminance
// see http://www.w3.org/TR/2008/REC-WCAG20-20081211/#relativeluminancedef
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

export function adjustLightness(rgb: RGBAColor, factor: number): RGBAColor;
export function adjustLightness(rgb: RGBColor, factor: number): RGBColor;
export function adjustLightness(rgb: RGBColor | RGBAColor, factor: number) {
  const hsl = rgbToHsl(rgb as RGBColor);
  hsl[2] *= factor;

  const a = rgb[3];
  rgb = hslToRgb(hsl);
  if (a !== undefined) {
    return [...rgb, a];
  }
  return rgb;
}

function rgbToHsl([r, g, b]: RGBColor): HSLColor {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);

  let h;
  let s;
  let l = (max + min) / 2;

  if (max == min) {
    return [0, 0, l]; // achromatic
  }

  const d = max - min;
  s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  if (max === r) {
    h = (g - b) / d + (g < b ? 6 : 0);
  } else if (max === g) {
    h = (b - r) / d + 2;
  } else {
    h = (r - g) / d + 4;
  }
  h /= 6;

  return [h, s, l];
}

function hslToRgb([h, s, l]: HSLColor): RGBColor {
  if (s == 0) {
    // achromatic
    l = Math.round(l * 255);
    return [l, l, l];
  }

  function hue2rgb(p: number, q: number, t: number) {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  }

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  return [
    Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    Math.round(hue2rgb(p, q, h) * 255),
    Math.round(hue2rgb(p, q, h - 1 / 3) * 255)
  ];
}
