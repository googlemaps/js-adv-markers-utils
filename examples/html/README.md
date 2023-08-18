# Advanced Markers Utils – HTML Examples

This directory contains examples for the different ways to use
`@googlemaps/adv-markers-utils` in a plain html file without needing a
bundler or similar.

- **`esm.html`** shows how to load the library from a CDN
  ([unpkg.com](https://unpkg.com) in this example) as a native ES module.
- **`importmap.html`** is similar, but it uses [importmaps][mdn_importmap]
  to load the library.
- **`umd.html`** uses the UMD build of the library for older browsers.

To run these examples, you only need an HTTP-Server and [a Google Maps API Key][gmp_apikey].
If you have node.js installed, you can start a server by running the command

    npx http-server

in this directory and opening the URL shown in your browser (typically http://localhost:8080).
The site will then ask for the Google Maps API Key to use and show the map with the marker.

[mdn_importmap]: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script/type/importmap
[gmp_apikey]: https://developers.google.com/maps/documentation/javascript/get-api-key#create-api-keys
