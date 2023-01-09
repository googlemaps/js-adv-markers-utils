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
import {MaterialIcons} from './lib/icons';

export default (map: google.maps.Map) => {
  Marker.registerIconProvider(MaterialIcons());

  const m1 = new Marker();
  m1.position = {lat: 53.555, lng: 10.001};
  m1.scale = ({map}) => Math.max(1, Math.pow(1.45, map.zoom) / 64);
  m1.map = map;
  m1.icon = 'restaurant';
  m1.color = '#DB4437';

  type M2Data = {color: string};
  const m2 = new Marker<M2Data>({
    map,
    position: {lat: 53.55, lng: 10},
    scale: 2
  });

  m2.color = s => (s.data ? s.data.color : '#0F9D58');

  const colors = ['#4285F4', '#DB4437', '#F4B400', '#0F9D58'];
  let colorIdx = 0;

  const intervalId = setInterval(() => {
    m2.setData({color: colors[colorIdx]});
    colorIdx = (colorIdx + 1) % colors.length;
  }, 1000);

  // the returned function will run before the running code is updated.
  // This gives you an opportunity to clean up everything that has been added
  // (don't worry about removing the markers, they will be automatically removed
  // from the map)
  return () => {
    clearInterval(intervalId);
  };
};
