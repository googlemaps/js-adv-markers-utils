export type IconProvider = (iconId: string) => HTMLElement | URL | string;

export enum MaterialIconsStyle {
  FILLED = 'filled',
  OUTLINED = 'outlined',
  ROUNDED = 'rounded',
  SHARP = 'sharp',
  TWOTONE = 'twotone'
}

/** The options for the MaterialIcons icon-provider. */
export type MaterialIconsOptions = {
  /** The material icon style to use. */
  style: MaterialIconsStyle;
  /**
   * Wether or not to automatically append the required stylesheet for the
   * icon-font.
   */
  appendFontStylesheet: boolean;
};

const DEFAULT_OPTIONS: MaterialIconsOptions = {
  style: MaterialIconsStyle.FILLED,
  appendFontStylesheet: true
};

const materialIconsClasses = {
  [MaterialIconsStyle.FILLED]: 'material-icons',
  [MaterialIconsStyle.OUTLINED]: 'material-icons-outlined',
  [MaterialIconsStyle.ROUNDED]: 'material-icons-round',
  [MaterialIconsStyle.SHARP]: 'material-icons-sharp',
  [MaterialIconsStyle.TWOTONE]: 'material-icons-two-tone'
};

const materialIconsGFontsFamily = {
  [MaterialIconsStyle.FILLED]: 'Material Icons',
  [MaterialIconsStyle.OUTLINED]: 'Material Icons Outlined',
  [MaterialIconsStyle.ROUNDED]: 'Material Icons Round',
  [MaterialIconsStyle.SHARP]: 'Material Icons Sharp',
  [MaterialIconsStyle.TWOTONE]: 'Material Icons Two Tone'
};

const GFONTS_BASE_URL = 'https://fonts.googleapis.com/css2';

/**
 * Creates the MaterialIcons icon-provider. This will load the appropriate
 * material icons font if it's not detected and return the icon-provider
 * function that creates the dom-elements for the requested icon.
 *
 * @param options
 */
export function MaterialIcons(
  options?: Partial<MaterialIconsOptions>
): IconProvider {
  const optionsWithDefaults: MaterialIconsOptions = {
    ...DEFAULT_OPTIONS,
    ...options
  };

  console.info('initialize MaterialIcons icon provider');

  // fixme: add support for self-hosted fonts
  const requestedFamily = materialIconsGFontsFamily[optionsWithDefaults.style];
  if (
    optionsWithDefaults.appendFontStylesheet &&
    !isFontLoaded(requestedFamily)
  ) {
    console.info(`loading font-family '${requestedFamily}'`);
    appendFontStylesheet(requestedFamily);
  } else {
    console.info(`font-family '${requestedFamily}' already loaded`);
  }

  return iconId =>
    createSpan(materialIconsClasses[optionsWithDefaults.style], iconId, {
      fontSize: 'calc(15px * var(--marker-scale, 1.0))'
    });
}

/**
 * Creates the PlaceIcons icon provider. This provider will use the SVG-icons
 * for the places API.
 */
export function PlaceIcons(): IconProvider {
  return iconId =>
    new URL(
      `https://maps.gstatic.com/mapfiles/place_api/icons/v2/${iconId}_pinlet.svg`
    );
}

/**
 * Creates the span element for the specified icon.
 *
 * @param className
 * @param content
 * @param styles
 */
function createSpan(
  className: string,
  content: string,
  styles: Record<string, string | number> | null = null
): HTMLElement {
  const el = document.createElement('span');

  el.className = className;
  el.textContent = content;

  Object.assign(el.style, styles);

  return el;
}

/**
 * Checks existing google fonts link tags for the specified material-icons
 * font-family.
 *
 * @param family
 */
function isFontLoaded(family: string): boolean {
  const fontStylesheets = Array.from<HTMLLinkElement>(
    document.querySelectorAll(
      'link[rel="stylesheet"][href*="fonts.googleapis.com"]'
    )
  );

  for (const stylesheet of fontStylesheets) {
    const url = new URL(stylesheet.href);

    let families = url.pathname.endsWith('css2')
      ? url.searchParams.getAll('family')
      : url.searchParams.get('family')?.split('|') || [];

    families = families.map(s =>
      s.includes(':') ? s.slice(0, s.indexOf(':')) : s
    );

    if (families.includes(family)) {
      return true;
    }
  }

  return false;
}

/**
 * Appends the stylesheet to load the specified font-family.
 *
 * @param family
 */
function appendFontStylesheet(family: string) {
  const url = new URL(GFONTS_BASE_URL);
  url.searchParams.append('family', family);
  url.searchParams.set('display', 'block');

  const linkEl = document.createElement('link');
  linkEl.rel = 'stylesheet';
  linkEl.href = url.toString();

  document.head.appendChild(linkEl);
}
