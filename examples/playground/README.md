# Marker API Playground

This directory is the testing ground and development-environment for
the marker API.

## Get Started

1. Change into the playground-folder and install dependencies:

        cd examples/playground
        npm install

2. [Create an API-key][gmp_create_apikey] for the Google Maps API.
3. create a file `.env` with the API key in the following format:

       GOOGLE_MAPS_API_KEY="<INSERT API KEY HERE>"

4. start the development server:

       npm start

5. open http://localhost:5173 in your browser

[gmp_create_apikey]: https://developers.google.com/maps/documentation/embed/get-api-key#create-api-keys

## Overview

The playground is a side-by-side view of a google map with a monaco editor (the
editor-component of VSCode) where typescript code using the new
marker-API can be written and executed to get a feel for the api and test
different usage-scenarios in a fast way. The contents of the editor can be
serialized into the URL for sharing.

Compiling the typescript happens in a worker via the typescript-support
already built into the monaco-editor. For execution, a wrapper emulates the
common.js environment to allow importing a predefined set of modules. Other
modules can only be imported using async imports from urls.

## Code Organization

- `/`: contains `index.html`, `examples.html` and configuration-files
- `/src`: the typescript source-root. The application entrypoint is in `main.ts`
- `/src/code-samples`: contains the source-files for all examples. The
  typescript files here should all follow the conventions for examples below.

## Writing examples

- examples have to be written as typescript files in the `./src/code-samples`-directory
- each example should demonstrate a single aspect of the library in a
  concise way - try to remove 'noise', that is code for unrelated aspects,
  as much as possible, embrace duplication
- the first line of the example has to contain a comment in the form:
  `// title: This describes what it does` - this comment will be the text
  shown in the example-index
- the example must import components from the marker-library using regular
  imports (e.g. `import {Marker} from '@ubilabs/google-maps-marker';`).
- there has to be a default export, which will be called with the
  map-instance as parameter when the script is run
- When any changes are done in the browser environment (event-listeners,
  timeouts, intervals, ...), the exported function has to return a cleanup
  function removing all those. This doesn't apply for created markers and
  marker-collections, those are automatically removed from the map when a
  new version of the script is executed.

## scripts, npm-tasks and deployment

The published version of this is hosted on google cloud storage and available
here: https://storage.ubidev.net/marker-api-playground

Be aware that people outside ubilabs have access to the deployed version
and while we can actively develop and publish new versions, the deployed
version should always be manually checked after a deployment.

The following supporting scripts and tasks are available:

- `npm start`: starts the vite dev-server (this will also run the `build:dts`
  and `build:examples` tasks)
- `npm run build`: runs all `build:*` tasks followed by `vite build` to
  generate the full application in `./dist`
- `npm run preview`: runs the full build and starts the vite preview server
  to review everything as if it were in production
- `npm run deploy`: deploys the application to google cloud storage bucket
  `gs://storage.ubidev.net/marker-api-playground`
