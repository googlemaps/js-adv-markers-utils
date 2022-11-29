export type RGBAColor = [number, number, number, number];
export type RGBColor = [number, number, number];
export type HSLColor = [number, number, number];
export declare function parseCssColorValue(color: string): RGBAColor;
export declare function rgbaToString(rgb: RGBColor | RGBAColor): string;
export declare function luminance(rgb: RGBColor | RGBAColor): number;
export declare function adjustLightness(rgb: RGBAColor, factor: number): RGBAColor;
export declare function adjustLightness(rgb: RGBColor, factor: number): RGBColor;
