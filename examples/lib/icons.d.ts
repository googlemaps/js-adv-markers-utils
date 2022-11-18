export declare type IconProvider = (iconId: string) => HTMLElement;
export declare enum MaterialIconsStyle {
    FILLED = "filled",
    OUTLINED = "outlined",
    ROUNDED = "rounded",
    SHARP = "sharp",
    TWOTONE = "twotone"
}
export declare type MaterialIconsOptions = {
    style: MaterialIconsStyle;
    appendFontStylesheet: boolean;
};
export declare function MaterialIcons(options?: Partial<MaterialIconsOptions>): IconProvider;
