import {Marker} from '../lib/marker';
import * as marker from '../lib/marker';
import * as markerCollection from '../lib/marker-collection';
import * as icons from '../lib/icons';
import * as color from '../lib/color';

const markers: Set<Marker> = new Set();
let cleanupFn: (() => void) | void = void 0;

export async function runPlaygroundJs(
  js: string,
  map: google.maps.Map
): Promise<void> {
  // remove all markers
  for (const m of markers) m.map = null;
  markers.clear();

  // if the last setup left a cleanup-function behind,
  // now is the time to call it
  if (cleanupFn) cleanupFn();

  // wrap code in a function with exports and require
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  const tmpFn = new Function('exports', 'require', js);

  const exports: {
    default?: (map: google.maps.Map) => Promise<(() => void) | void>;
  } = {};

  // we need a proxy for the Marker class to keep track of markers
  // added to the map, so they don't have to be removed manually
  class MarkerProxy extends Marker {
    constructor(...args: never[]) {
      super(...args);

      markers.add(this);
    }
  }

  const modules: Record<string, unknown> = {
    './lib/marker': marker,
    './lib/marker-collection': markerCollection,
    './lib/color': color,
    './lib/icons': icons
  };
  const require = (moduleString: string) => {
    // fixme: can we somehow hack the markerCollection to also use the
    //  patched marker-class?
    if (moduleString === './lib/marker')
      return {
        ...marker,
        Marker: MarkerProxy
      };
    else if (modules[moduleString]) {
      return modules[moduleString];
    }

    throw new Error(`unsupported module: ${moduleString}`);
  };

  // run function to get exports defined
  tmpFn(exports, require);

  // run default-export
  if (!exports.default) {
    console.warn('no default export.');
    return;
  }

  cleanupFn = await exports.default(map);
}
