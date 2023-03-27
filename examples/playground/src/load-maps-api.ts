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

export type MapsApiOptions = {
  key: string;
  libraries?: string | string[];
  v?: string;
};

let mapsApiLoaded: Promise<void> | null = null;

export async function loadMapsApi(apiOptions: MapsApiOptions): Promise<void> {
  if (mapsApiLoaded !== null) {
    return mapsApiLoaded;
  }

  if (Array.isArray(apiOptions.libraries)) {
    apiOptions.libraries = apiOptions.libraries.join(',');
  }

  const apiUrl = new URL('https://maps.googleapis.com/maps/api/js');
  for (const [key, value] of Object.entries(apiOptions)) {
    if (value === undefined) {
      continue;
    }

    apiUrl.searchParams.set(key, value as string);
  }
  apiUrl.searchParams.set('callback', '__maps_callback__');

  mapsApiLoaded = new Promise(resolve => {
    window.__maps_callback__ = () => {
      delete window.__maps_callback__;
      resolve();
    };

    const script = document.createElement('script');
    script.src = apiUrl.toString();
    document.body.appendChild(script);
  });

  return mapsApiLoaded;
}

declare global {
  interface Window {
    __maps_callback__?: () => void;
  }
}
