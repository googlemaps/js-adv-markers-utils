export type MapsApiOptions = {
  key: string;
  libraries?: string;
  v?: string;
};

let mapsApiLoaded: Promise<void> | null = null;

export async function loadMapsApi(apiOptions: MapsApiOptions): Promise<void> {
  if (mapsApiLoaded !== null) {
    return mapsApiLoaded;
  }

  const apiUrl = new URL('https://maps.googleapis.com/maps/api/js');
  for (const [key, value] of Object.entries(apiOptions)) {
    if (value === undefined) {
      continue;
    }

    apiUrl.searchParams.set(key, value);
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
