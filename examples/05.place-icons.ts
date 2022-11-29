// Marker-API Example Playground
//
// Edit the code and hit CMD + Enter to execute it.
//
// Key bindings:
//
// <Cmd> + <Return>   compile typescript and execute
// <Cmd> + <S>        save the code to the URL
//

import {Marker} from './lib/marker';
import {PlaceIcons} from './lib/icons';

export default (map: google.maps.Map) => {
  Marker.registerIconProvider(PlaceIcons());

  const m1 = new Marker();
  m1.position = {lat: 53.555, lng: 10.001};
  m1.scale = ({map}) => Math.max(1, Math.pow(1.45, map.zoom) / 64);
  m1.map = map;
  m1.icon = 'theater';
  m1.color = 'white';
  m1.borderColor = 'grey';

  // the returned function will run before the running code is updated.
  // This gives you an opportunity to clean up everything that has been added
  // (don't worry aboutthe markers, they will be automatically removed from
  // the map)
};
