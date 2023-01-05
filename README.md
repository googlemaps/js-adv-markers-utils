# Marker API Playground

This repository is the intial testing ground and development-environment for
the new marker API.

## Get Started

1.  Install dependencies:

    npm install

2.  create the `.env` file. The API Key to use
    [can be found here][gcloud_console_maps_credentials].

        GOOGLE_MAPS_API_KEY="<INSERT API KEY HERE>"
        PRODUCTION_BASEURL="/marker-api-playground/"

3.  start the 'playground' environment:

    npm start

4.  open http://localhost:5173 in your browser

[gcloud_console_maps_credentials]: https://console.cloud.google.com/apis/credentials/key/cace4819-4b19-489c-bd49-d91300d72dab?project=ubilabs-dev

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

- `/`: contains `index.html` and configuration-files
- `/scripts`: this is the place for utility scripts, mostly written in [zx][]
- `/src`: the typescript source-root. At this level, the
  playground-application entrypoint is located
- `/src/lib`: contains everything that will eventually become
  the markers-library
- `/src/editor`: contains all the source-files for editor-specific
  functionality (monaco setup etc.)
- `/examples`: contains the examples-index-page and source-files for all
  examples. The typescript files here should all follow the conventions for
  examples below. For the examples index-page, these files are packaged
  into examples.json by the `build:examples` npm task (see
  `/scripts/update-examples.mjs`)
- `/examples/lib`: contains the typescript declaration-files used by the
  editor and referenced by the examples. Those files are generated by
  `npm run build:dts` from the library files in `src/lib`
- `/types` is for additional typescript declarations

[zx]: https://github.com/google/zx

## Writing examples

- examples have to be written as typescript files in the `./examples`-directory
- each example should demonstrate a single aspect of the library in a
  concise way - try to remove 'noise', that is code for unrelated aspects,
  as much as possible, embrace duplication
- the first line of the example has to contain a comment in the form:
  `// title: This describes what it does` - this comment will be the text
  shown in the example-index
- the example must import the marker-library via the `*.d.ts` files
  available in `./examples/lib/` (e.g. `import {Marker} from './lib/marker';`).
- there has to be a default export, which will be called with the
  map-instance as parameter when the script is run
- When any changes are done in the browser environment (event-listeners,
  timeouts, intervals, ...), the exported function has to return a cleanup
  function removing all those. This doesn't apply for created markers, those
  are automatically removed from the map when a new version of the script is
  executed.

## scripts, npm-tasks and deployment

The published version of this is hosted on google cloud storage and available
here: https://storage.ubidev.net/marker-api-playground

Be aware that people outside ubilabs have access to the deployed version
and while we can actively develop and publish new versions, the deployed
version should always be manually checked after a deployment.

The following supporting scripts and tasks are available:

- `npm start`: starts the vite dev-server (this will also run the `build:dts`
  and `build:examples` tasks)
- `npm run build:dts`: compiles all typescript-files in `./src/lib`
  into corresponding declaration files in `./examples/lib`
- `npm run build:examples`: runs the `script/update-examples.mjs` script to
  update the examples index in `./examples/examples.json`. The index is
  loaded in `examples.html` to render the list of examples
- `npm run build`: runs all `build:*` tasks followed by `vite build` to
  generate the full application in `./dist`
- `npm run preview`: runs the full build and starts the vite preview server
  to review everything as if it were in production
- `npm run deploy`: deploys the application to google cloud storage bucket
  `gs://storage.ubidev.net/marker-api-playground`

### deployment process

We're deploying from our local repository, so first of all, make sure that
a) you are in the main branch, b) it is up to date and c) you don't have any
uncomitted changes:

    git pull
    git status

Next, create a new version and push it to github. Which kind of version to
create depends on the type of changes since the last deployment.

    npm version major
    # or: npm version minor / npm version patch

This will update the package.json and create a new commit as well as a
version-tag. To push the new commit and release-tag to github:

    git push ; git push --tags

Now, run a preview build and verify it's working as intended:

    npm run preview

Deploy to production:

    npm run deploy

Finally, document the API changes in the [Marker-API Documentation][marker-doc].
You can see all commits since the last release using:

    git log $(git describe --tags --abbrev=0)..HEAD --oneline

[marker-doc]: https://docs.google.com/document/d/1L1RUW2kRSkSn02qthbimJZtjsCfdTtzXys3thCxv5O4/edit#heading=h.h498zgrs94df

# Marker API Design Decisions

## Concepts

### Attributes

Marker attributes are all the different values that make
up the marker's appearance and are generally passed on to the google maps
implementation. They are either passed to the constructor or can be set as
properties on the marker-object. Any change to a marker-attribute will
be immediately written to the marker.

- **all markers:** position, collisionBehaviour, draggable, ...
- **pinview markers:** background, borderColor, glyph, ...
- **html markers:** element, classes
- **additional attributes:** where it makes sense, we will introduce more
  attributes that control a combination of aspects in the maps-api (e.g. the
  color attribute which control all other color-attributes) or additional
  features not present in the maps api (e.g. marker shapes).

### Static and Dynamic Attributes

Every attribute can be specified either as a direct value
(e.g. `marker.color = 'green'`) or as a function, that receives a state-object and
can use that to compute the final values (`marker.color = ({map}) => map.zoom > 12 ? 'green' : 'blue'`). For dynamic attributes the
computed values is updated with every change to the state. The state
contains information about the map (all camera parameters and current map
bounds), the marker (interaction state, map visibility, ...), other attributes
and user-specified data.

### Adding new Attributes

To add a new attribute

1. add the attribute name to `attributeKeys`
2. add the name and type to the StaticAttributes type definition
3. add declarations for the attribute to the Marker class and the
   ComputedMarkerAttributes class
4. implement the attribute logic within the `update()` function

## API

### constructor

The constructor accepts a single optional argument
