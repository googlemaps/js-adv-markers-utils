# Simplified Markers for Google Maps API

The `@googlemaps/marker` class aims at being a simple and powerful abstraction
over the handling of advanced markers in the Google Maps API. The design goals
are

- it should provide a very simple API that can be used after only a few
  minutes into the documentation
- it should make basic use cases effortless
- it should allow for lots of flexibility and extensibility to support the more
  complex use-cases
- it shouldn’t provide multiple different ways to get to the same result

One key design choice made here is to use dynamic properties instead of
individual getter/setter methods. So instead of `marker.setMap(map);`
we’ll use the `marker.map = map;` syntax. This applies to all attributes of the
marker.

## Installation

> **Important**
>
> As of writing this, the module hasn't been published to npm, so installing
> isn't as simple as it's going to be. See the next section for more
> information.

If you're using a bundler (like webpack, rollup, vite, etc.) for your project,
you can install the package using npm:

```
npm install --save @googlemaps/marker
```

And use it in your project:

```javascript
import {Marker} from '@googlemaps/marker';

async function main() {
  const {Map} = await google.maps.importLibrary('maps');
  await google.maps.importLibrary('marker');

  const map = new Map(domElement, mapOptions);

  // create the first marker and add it to the map.
  const marker = new Marker({
    position: {lat: 53.5, lng: 10.05},
    map
  });
}
main();
```

The package is also distributed in esm and umd formats that can be loaded
via a script-tag either from a CDN or any other webserver.

```html
<!-- umd module, available as google.maps.plugins.marker in your code -->
<script src="https://unpkg.com/@googlemaps/marker/dist/index.umd.js"></script>
<script>
  const {Marker} = google.maps.plugins.marker;
</script>

<!-- alternative: native esm -->
<script type="module">
  import {Marker} from 'https://unpkg.com/@googlemaps/marker/dist/index.module.js';
</script>
```

See the examples in [./examples/html](./examples/html) for full examples on
how to use the library without a bundler.

## Installation (for now)

Since it's not yet published to npm, the next best thing to install it with npm
is to use the tarball [available here][npm-pack-url]:

    npm install https://storage.ubidev.net/marker-api-playground/lib/googlemaps-marker.tgz

The examples in [`./examples/html`](./examples/html) contain the URLs for the
esm and umd versions you can use for now.

[npm-pack-url]: https://storage.ubidev.net/marker-api-playground/lib/googlemaps-marker.tgz

## "Try before buy"

If you just want to get a feel for the library and try it out, head over to our
interactive playground where you can see some examples in action and experiment
with the new markers in a live-coding environment:

[Marker API Playground](https://storage.ubidev.net/marker-api-playground/index.html)

## Core Concepts

### Options and Attributes

Marker attributes are all the different values that make up the marker's
appearance. Attributes are generally optional and can be accessed as
object-properties of the marker (e.g. `marker.position` or `marker.color`) or
passed to the constructor or the `setAttributes`-function as an object
(e.g. `new Marker({color: ‘red’})`).

Other values that can be specified to the Marker-constructor are called
options, right now this is only the map option, but this might change in
the future.

Attribute values can be specified either as static values, or as a function
that will return the final value (dynamic attributes). This function has access
to viewport-parameters of the map (center, zoom, heading, tilt and bounds),
metadata about the marker and arbitrary user-provided data.

```typescript
// static attributes
marker.color = 'lightblue';
marker.position = {lng: 34, lat: 23};

// dynamic attributes
marker.scale = ({map}) => Math.max(1, Math.pow(1.45, map.zoom) / 64);
marker.color = ({data}) => (data.someValue > 10 ? 'red' : 'blue');
```

The following attributes and options are implemented, all of them can both
be passed to the constructor or set on the marker-object at any time:

#### Options

- **`map`**: The map instance the marker is added to.

#### Basic Marker Attributes

These attributes are directly forwarded to the AdvancedMarkerView instance
and work for all markers. See the [official documentation][gmp-adv-marker]
for details.

- **`position`**: the position of the marker, can be specified as
  `google.maps.LatLng`, `google.maps.LatLngLiteral` or GeoJSON
  style `[lng, lat]`
- **`draggable`**: flag to make the marker draggable, enables the `dragstart`,
  `drag` and `dragend` events.
- **`zIndex`**: the z-ordering of the marker
- **`title`**: the title of the marker
- **`collisionBehaviour`**: the collision behaviour of the marker
  ([see Google Maps docs][gmp-collisions])

[gmp-adv-marker]: https://developers.google.com/maps/documentation/javascript/reference/advanced-markers#AdvancedMarkerViewOptions
[gmp-collisions]: https://developers.google.com/maps/documentation/javascript/manage-marker-label-collisions

#### PinView Style Attributes

These attributes are forwarded to the `PinView` instance or passed into the
html via css-variables. See [the official documentation][gmp-pinview] for details.

[gmp-pinview]: https://developers.google.com/maps/documentation/javascript/reference/advanced-markers#PinViewOptions

- **`scale`**: scaling for the marker
- **`backgroundColor`**, **`borderColor`** and **`glyphColor`**:
  individual colors used for the pin itself and its content
  ([see here][gmp-customization]).
- **`color`**: this is a shorthand to allow easier handling of colors,
  setting this will automatically set the three color-values based on
  the value provided. Accepts any valid css color-value.
- **`glyph`**: the symbol or letter/number to be shown inside the
  marker pin, can be a `string`, a `DOMElement` or a `URL` object pointing
  to an image file.
  ([see here][gmp-glyph])
- **`icon`**: a simplified way to use the glyph-property when using icon-fonts.

[gmp-customization]: https://developers.google.com/maps/documentation/javascript/advanced-markers/basic-customization
[gmp-glyph]: https://developers.google.com/maps/documentation/javascript/advanced-markers/graphic-markers#use_a_graphic_file_as_the_glyph

#### HTML Marker Attributes

The remaing two attributes are used to replace the default map-pin marker with
arbitrary html-elements.

- **`content`**: a dom-element that will be used instead of the default PinView
  element. The dom-element can be styled in css, the values of the different
  pinView-attributes are available in the css variables (so you could write
  `color: var(--marker-color)`).
- **`classList`**: a single classname or an array of classnames that will be
  written to the content-element.

### Dynamic Attributes

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

Marker Collections provide a way to create markers for small to medium sized
datasets with a minimal amount of code. A Marker Collection uses a very similar
interface to single markers, that is it also uses static and dynamic attributes
and user-supplied data. A collection is created with a single call and the
markers are added to the map all at once.

```javascript
const data = await loadData();

const markers = new MarkerCollection(data, {
  position: ({data}) => data?.position,
  icon: ({data}) => data?.category
});

markers.map = map;
```

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

Marker collections also work well with data that is updated regularly.
Here for example, we continually update a marker-collection with data loaded
from a server:

```javascript
const markers = new MarkerCollection({
  key: data => data.id,
  position: ({data}) => data?.position,
  icon: ({data}) => data?.category
});

markers.map = map;

// assuming apiStream is an async generator that yields updated data
// at a certain interval
for await (let data of apiStream) {
  markers.setData(data);
}
```

This also allows users to implement filtering by updating the data-array for
the collection with a reduced set of records and simple configurable
data-visualizations by updating the dynamic attributes.

By using the special `key` property, the marker-collection knows which markers
belong to which record in the data, allowing it to efficiently update markers
even with larger datasets.
