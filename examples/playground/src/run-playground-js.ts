/**
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {Marker, MarkerOptions, MarkerCollection} from '../../../src';

import packageJson from '../../../package.json';

const {
  name: packageName,
  exports: packageExports
}: {name: string; exports: {[src: string]: never}} = packageJson as never;

const markers: Set<Marker> = new Set();
let cleanupFn: (() => void) | void = undefined;

let modulesLoaded = false;
const modules: Record<string, object> = {};

async function loadModules() {
  modules[packageName] = await import('../../../src');

  const moduleCallbacks = import.meta.glob('../../../src/*');
  for (const src of Object.keys(packageExports)) {
    if (src === '.') continue;

    const moduleCallback = moduleCallbacks[
      src.replace('./', '../../../src/') + '.ts'
    ] as () => Promise<object>;

    modules[src.replace('.', packageName)] = await moduleCallback();
  }

  modulesLoaded = true;
}

export async function runPlaygroundJs(
  js: string,
  map: google.maps.Map
): Promise<void> {
  if (!modulesLoaded) {
    await loadModules();
  }

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

  class MarkerCollectionProxy<T extends object> extends MarkerCollection<T> {
    protected createMarker(options: MarkerOptions<T>, data: T): Marker<T> {
      const m = super.createMarker(options, data);
      markers.add(m as Marker);
      return m;
    }
  }

  const require = (moduleString: string) => {
    if (moduleString === packageName) {
      return {
        ...modules[moduleString],
        Marker: MarkerProxy,
        MarkerCollection: MarkerCollectionProxy
      };
    }

    if (moduleString in modules) {
      return modules[moduleString];
    }

    throw new Error(`unsupported module: ${moduleString}`);
  };

  // run function to get exports defined
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  tmpFn(exports, require);

  // run default-export
  if (!exports.default) {
    console.warn('no default export.');
    return;
  }

  cleanupFn = await exports.default(map);
}
