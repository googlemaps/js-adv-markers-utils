import {Marker} from '../lib/marker';
import * as marker from '../lib/marker';
import * as icons from '../lib/icons';
import * as color from '../lib/color';

let markers: Set<Marker> = new Set();
let cleanupFn: (() => void) | null = null;

export function runPlaygroundJs(js: string, map: google.maps.Map) {
  // remove all markers
  for (let m of markers) m.map = null;
  markers.clear();

  // if the last setup left a cleanup-function behind,
  // now is the time to call it
  if (cleanupFn) cleanupFn();

  // wrap code in a function with exports and require
  const tmpFn = new Function('exports', 'require', js);

  const exports: any = {};

  // we need a proxy for the Marker class to keep track of markers
  // added to the map, so they don't have to be removed manually
  class MarkerProxy extends Marker {
    constructor(...args: any[]) {
      super(...args);

      markers.add(this);
    }
  }

  const modules: Record<string, any> = {
    './lib/marker': marker,
    './lib/color': color,
    './lib/icons': icons
  };
  const require = (moduleString: string) => {
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

  cleanupFn = exports.default(map);
}
