export interface ListenerMock {
  remove(): void;
}

export class MVCObjectMock {
  listeners: {[name: string]: any[]} = {};
  addListener(eventName: string, handler: (event: any) => void): ListenerMock {
    let list = this.listeners[eventName];
    if (!list) list = this.listeners[eventName] = [];

    list.push(handler);

    return {
      remove: () => {
        list.splice(list.indexOf(handler));
      }
    };
  }
}

export class GoogleMapMock extends MVCObjectMock {
  center = {lat: 0, lng: 0};
  bounds = {};
  zoom = 1;
  heading = 0;
  tilt = 0;

  getCenter(): google.maps.LatLngLiteral {
    return this.center;
  }
  getBounds() {
    return this.bounds;
  }
  getZoom() {
    return this.zoom;
  }
  getHeading() {
    return this.heading;
  }
  getTilt() {
    return this.tilt;
  }
}

export class AdvancedMarkerViewMock extends MVCObjectMock {}
export class PinViewMock {}

export const maps = {
  Map: GoogleMapMock,
  marker: {
    AdvancedMarkerView: AdvancedMarkerViewMock,
    PinView: PinViewMock
  },
  event: {
    addDomListener() {}
  }
};

/* eslint
     @typescript-eslint/no-explicit-any: "off",
     @typescript-eslint/no-unsafe-member-access: "off",
     @typescript-eslint/no-unsafe-call: "off",
     @typescript-eslint/ban-ts-comment: "off",
     @typescript-eslint/no-empty-function: "off"
   ----
   disabled to make writing tests simpler.
*/
