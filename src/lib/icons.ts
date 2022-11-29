export type IconProvider = (iconId: string) => HTMLElement | URL;

export enum MaterialIconsStyle {
  FILLED = 'filled',
  OUTLINED = 'outlined',
  ROUNDED = 'rounded',
  SHARP = 'sharp',
  TWOTONE = 'twotone'
}

export type MaterialIconsOptions = {
  style: MaterialIconsStyle;
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
    createSpan(materialIconsClasses[optionsWithDefaults.style], iconId);
}

export function PlaceIcons(): IconProvider {
  return iconId => createURL(iconId);
}

/**
 * Creates the span element for the specified icon.
 * @param className
 * @param content
 */
function createSpan(className: string, content: string): HTMLElement {
  const el = document.createElement('span');

  el.className = className;
  el.textContent = content;

  return el;
}

function createURL(content: string) {
  return new URL(
    `https://maps.gstatic.com/mapfiles/place_api/icons/v2/${content}_pinlet.svg`
  );
}

/**
 * Checks existing google fonts link tags for the specified material-icons
 * font-family.
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
