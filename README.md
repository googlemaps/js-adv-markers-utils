# Simplified Markers for Google Maps API

## Installation

As of writing this, the module hasn't been published to npm, so there's some
extra hoops to jump through to install it.

When you're using a bundler and want to use an npm-module, you can install
it from the tarball [published here][npm-pack-url]:

    npm install https://storage.ubidev.net/marker-api-playground/lib/ubilabs-google-maps-marker.tgz

And use it in your project:

```javascript
import {Marker} from '@ubilabs/google-maps-marker';

async function main() {
  const {Map} = await google.maps.importLibrary('maps');
  await google.maps.importLibrary('marker');

  const map = new Map(domElement, mapOptions);
  const marker = new Marker({
    position: {lat: 53.5, lng: 10.05},
    map
  });
}
main();
```

The module can also be used via [ESM](./examples/html/esm.html)
or [UMD](./examples/html/umd.html) without any bundlers, check
out the examples in [`./examples/html`](./examples/html) for
simple examples of that.

[npm-pack-url]: https://storage.ubidev.net/marker-api-playground/lib/ubilabs-google-maps-marker.tgz

## Core Concepts

The Marker class was build to be as simple as possible, while also providing
enough flexibility for more advanced use-cases.

### Attributes

Marker attributes are all the different values that make
up the marker's appearance and are generally passed on to the google maps
AdvancedMarkerView implementation.

Attributes can be passed to the constructor as an object or can be set as
properties on the marker-object. Any change to an attribute will
be forwarded to the Google Maps advanced marker immediately.

The following attributes are implemented right now:

- **`position`**: the position of the marker, can be specified as
  `google.maps.LatLng`, `google.maps.LatLngLiteral` or GeoJSON
  style `[lng, lat]`
- **`scale`**: scaling for the marker
- **`collisionBehaviour`**: the collision behaviour of the marker
  ([see Google Maps docs](https://developers.google.com/maps/documentation/javascript/manage-marker-label-collisions))
- **`draggable`**: flag to make the marker draggable, enables the `dragstart`, `drag` and `dragend` events.
- **`zIndex`**: the z-ordering of the marker
- **`title`**: the title of the marker
- **Colors: `backgroundColor`, `borderColor`, `glyphColor`**:
  individual colors used for the pin itself and its content
  ([see here](https://developers.google.com/maps/documentation/javascript/advanced-markers/basic-customization)).
- **`color`**: this is a shorthand to allow easier handling of colors,
  setting this will automatically set the three color-values based on
  the value provided. Accepts any valid css color-value.
- **`glyph`**: the symbol or letter/number to be shown inside the
  marker pin, can be a `string`, a `DOMElement` or a `URL` object pointing
  to an image file.
  ([see here](https://developers.google.com/maps/documentation/javascript/advanced-markers/graphic-markers#use_a_graphic_file_as_the_glyph))
- **`icon`**: a simplified way to use the glyph-property when using icon-fonts.

### Static and Dynamic Attributes

Every attribute can be specified either as a static value
(e.g. `marker.color = 'green'`) or as a function that computes the final values
based on values from a state-object, for example

```javascript
// static attribute value
marker.scale = 1.2;

// dynamic attribute value
marker.color = ({map}) => (map.zoom > 12 ? 'green' : 'blue');
```

Dynamic attributes are updated with every change to
the state. This state contains information about the map (all camera
parameters and current map bounds), the marker (interaction state),
the current value of all other attributes and user-specified
data. The parameter for a dynamic attribute function contains following properties:

- `map`: this contains information about the current map viewport
  (center, zoom, heading, tilt, bounds).
- `marker`: state-information about the marker (hovered)
- `attr`: the computed values for all other attributes
- `data`: user-data

### User Data

All markers can be further customized using arbitrary data, which is especially
useful when creating custom marker classes or when using marker-collections.
Every dynamic attribute can use the user-data specified via
`marker.setData(myData)` to change the marker styling.

### MarkerCollection

The marker-library also makes it incredibly easy to dynamically render multiple
markers from a dataset by using marker-collections. The dataset could be any
array of records, and dynamic attributes are used to extract the relevant values
from it.

Here is a quick example for how this looks with an array like it might be loaded
from a plain csv-file:

```javascript
import {MarkerCollection} from '@ubilabs/google-maps-marker';

const fieldIndex = {id: 0, latitude: 1, longitude: 2 /* ... */};
const data = [
  [1, 53.555, 10.014]
  // ...
];

const collection = new MarkerCollection(data, {
  position: ({data}) =>
    data && {
      lat: data[fieldIndex.latitude],
      lng: data[fieldIndex.longitude]
    }
});
collection.map = map;
```

This example will create a marker with the specified attributes (the second
parameter of the `MarkerCollection` constructor) for every entry in the data-array.

Using dynamic attributes, you can realize even simple data-visualizations by
having the colors, icons or scaling of the markers react to the values of
certain properties in the data-array.

Marker collections also work well with data that is updated regularly.
Here for example, we continually update a marker-collection with data loaded
from a server:

```javascript
const markers = new MarkerCollection({
  key: data => data.id.toString(),
  position: ({data}) => data?.position
});

// simulate updating data every 500ms
const intervalId = setInterval(async () => {
  markers.setData(await loadData());
}, 1000 / 2);
```

By using the special `key` property, the marker-collection knows which markers
belong to which record in the data, allowing it to efficiently update markers
even with larger datasets.

## API Documentation

TBD

# Contributing

TBD
