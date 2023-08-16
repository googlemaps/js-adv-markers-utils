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

// title: PlaceResult using the PlaceMarker class

import {PlaceMarker} from '@googlemaps/adv-markers-utils/places';

export default (map: google.maps.Map) => {
  const markers = res.map(
    result =>
      new PlaceMarker({
        map,
        place: result
      })
  );

  return () => markers.forEach(m => (m.map = null));
};

const res: google.maps.places.PlaceResult[] = [
  {
    geometry: {
      location: new google.maps.LatLng({lat: 53.55447, lng: 10.0013})
    },
    icon_background_color: '#FF9E67',
    icon_mask_base_uri:
      'https://maps.gstatic.com/mapfiles/place_api/icons/v2/bar_pinlet'
  },
  {
    geometry: {
      location: new google.maps.LatLng({lat: 53.558, lng: 10.006})
    },
    icon_background_color: '#FF9E67',
    icon_mask_base_uri:
      'https://maps.gstatic.com/mapfiles/place_api/icons/v2/cafe_pinlet'
  },

  {
    geometry: {
      location: new google.maps.LatLng({lat: 53.553, lng: 10.006})
    },
    icon_background_color: '#FF9E67',
    icon_mask_base_uri:
      'https://maps.gstatic.com/mapfiles/place_api/icons/v2/restaurant_pinlet'
  },

  {
    geometry: {
      location: new google.maps.LatLng({lat: 53.57, lng: 9.99})
    },
    icon_background_color: '#4B96F3',
    icon_mask_base_uri:
      'https://maps.gstatic.com/mapfiles/place_api/icons/v2/shopping_pinlet'
  },

  {
    geometry: {
      location: new google.maps.LatLng({lat: 53.5664, lng: 9.99})
    },
    icon_background_color: '#4B96F3',
    icon_mask_base_uri:
      'https://maps.gstatic.com/mapfiles/place_api/icons/v2/convenience_pinlet'
  },

  {
    geometry: {
      location: new google.maps.LatLng({lat: 53.5664, lng: 9.984})
    },
    icon_background_color: '#4B96F3',
    icon_mask_base_uri:
      'https://maps.gstatic.com/mapfiles/place_api/icons/v2/shoppingcart_pinlet'
  },

  {
    geometry: {
      location: new google.maps.LatLng({lat: 53.57, lng: 9.984})
    },
    icon_background_color: '#4B96F3',
    icon_mask_base_uri:
      'https://maps.gstatic.com/mapfiles/place_api/icons/v2/pharmacy_pinlet'
  },

  {
    geometry: {
      location: new google.maps.LatLng({lat: 53.578, lng: 9.99})
    },
    icon_background_color: '#909CE1',
    icon_mask_base_uri:
      'https://maps.gstatic.com/mapfiles/place_api/icons/v2/atm_pinlet'
  },

  {
    geometry: {
      location: new google.maps.LatLng({lat: 53.581, lng: 9.99})
    },
    icon_background_color: '#909CE1',
    icon_mask_base_uri:
      'https://maps.gstatic.com/mapfiles/place_api/icons/v2/bank-intl_pinlet'
  },

  {
    geometry: {
      location: new google.maps.LatLng({lat: 53.579, lng: 9.98832})
    },
    icon_background_color: '#909CE1',
    icon_mask_base_uri:
      'https://maps.gstatic.com/mapfiles/place_api/icons/v2/gas_pinlet'
  },

  {
    geometry: {
      location: new google.maps.LatLng({lat: 53.58, lng: 9.995})
    },
    icon_background_color: '#909CE1',
    icon_mask_base_uri:
      'https://maps.gstatic.com/mapfiles/place_api/icons/v2/hotel_pinlet'
  },
  {
    geometry: {
      location: new google.maps.LatLng({lat: 53.58, lng: 9.9999})
    },
    icon_background_color: '#909CE1',
    icon_mask_base_uri:
      'https://maps.gstatic.com/mapfiles/place_api/icons/v2/postoffice_pinlet'
  },

  // Place category: Entertainment

  {
    geometry: {
      location: new google.maps.LatLng({lat: 53.56, lng: 9.989})
    },
    icon_background_color: '#13B5C7',
    icon_mask_base_uri:
      'https://maps.gstatic.com/mapfiles/place_api/icons/v2/dolphin_pinlet'
  },
  {
    geometry: {
      location: new google.maps.LatLng({lat: 53.56, lng: 9.995})
    },
    icon_background_color: '#13B5C7',
    icon_mask_base_uri:
      'https://maps.gstatic.com/mapfiles/place_api/icons/v2/golf_pinlet'
  },

  {
    geometry: {
      location: new google.maps.LatLng({lat: 53.565, lng: 9.995})
    },
    icon_background_color: '#13B5C7',
    icon_mask_base_uri:
      'https://maps.gstatic.com/mapfiles/place_api/icons/v2/historic_pinlet'
  },

  {
    geometry: {
      location: new google.maps.LatLng({lat: 53.558, lng: 9.98})
    },
    icon_background_color: '#13B5C7',
    icon_mask_base_uri:
      'https://maps.gstatic.com/mapfiles/place_api/icons/v2/movie_pinlet'
  },
  {
    geometry: {
      location: new google.maps.LatLng({lat: 53.5567, lng: 9.992})
    },
    icon_background_color: '#13B5C7',
    icon_mask_base_uri:
      'https://maps.gstatic.com/mapfiles/place_api/icons/v2/museum_pinlet'
  },

  {
    geometry: {
      location: new google.maps.LatLng({lat: 53.5568, lng: 9.989})
    },
    icon_background_color: '#13B5C7',
    icon_mask_base_uri:
      'https://maps.gstatic.com/mapfiles/place_api/icons/v2/theater_pinlet'
  },

  // Place category: Transportation
  {
    geometry: {
      location: new google.maps.LatLng({lat: 53.55, lng: 9.99})
    },
    icon_background_color: '#10BDFF',
    icon_mask_base_uri:
      'https://maps.gstatic.com/mapfiles/place_api/icons/v2/airport_pinlet'
  },

  {
    geometry: {
      location: new google.maps.LatLng({lat: 53.552, lng: 9.99})
    },
    icon_background_color: '#10BDFF',
    icon_mask_base_uri:
      'https://maps.gstatic.com/mapfiles/place_api/icons/v2/bus_share_taxi_pinlet'
  },

  {
    geometry: {
      location: new google.maps.LatLng({lat: 53.548, lng: 9.997})
    },
    icon_background_color: '#10BDFF',
    icon_mask_base_uri:
      'https://maps.gstatic.com/mapfiles/place_api/icons/v2/train_rail_1_pinlet'
  },

  // Place category: Municipal/generic/religious

  {
    geometry: {
      location: new google.maps.LatLng({lat: 53.588, lng: 10.01})
    },
    icon_background_color: '#7B9EB0',
    icon_mask_base_uri:
      'https://maps.gstatic.com/mapfiles/place_api/icons/v2/cemetery_pinlet'
  },

  {
    geometry: {
      location: new google.maps.LatLng({lat: 53.585, lng: 10.01})
    },
    icon_background_color: '#7B9EB0',
    icon_mask_base_uri:
      'https://maps.gstatic.com/mapfiles/place_api/icons/v2/civic-bldg_pinlet'
  },

  {
    geometry: {
      location: new google.maps.LatLng({lat: 53.57, lng: 10.01})
    },
    icon_background_color: '#7B9EB0',
    icon_mask_base_uri:
      'https://maps.gstatic.com/mapfiles/place_api/icons/v2/library_pinlet'
  },

  {
    geometry: {
      location: new google.maps.LatLng({lat: 53.57, lng: 10.02})
    },
    icon_background_color: '#7B9EB0',
    icon_mask_base_uri:
      'https://maps.gstatic.com/mapfiles/place_api/icons/v2/monument_pinlet'
  },

  {
    geometry: {
      location: new google.maps.LatLng({lat: 53.575, lng: 10.03})
    },
    icon_background_color: '#7B9EB0',
    icon_mask_base_uri:
      'https://maps.gstatic.com/mapfiles/place_api/icons/v2/parking_pinlet'
  },

  {
    geometry: {
      location: new google.maps.LatLng({lat: 53.57, lng: 10.03})
    },
    icon_background_color: '#7B9EB0',
    icon_mask_base_uri:
      'https://maps.gstatic.com/mapfiles/place_api/icons/v2/school_pinlet'
  },

  {
    geometry: {
      location: new google.maps.LatLng({lat: 53.58, lng: 10.023})
    },
    icon_background_color: '#7B9EB0',
    icon_mask_base_uri:
      'https://maps.gstatic.com/mapfiles/place_api/icons/v2/worship_buddhist_pinlet'
  },

  {
    geometry: {
      location: new google.maps.LatLng({lat: 53.575, lng: 10.023})
    },
    icon_background_color: '#7B9EB0',
    icon_mask_base_uri:
      'https://maps.gstatic.com/mapfiles/place_api/icons/v2/worship_christian_pinlet'
  },
  {
    geometry: {
      location: new google.maps.LatLng({lat: 53.575, lng: 10.02})
    },
    icon_background_color: '#7B9EB0',
    icon_mask_base_uri:
      'https://maps.gstatic.com/mapfiles/place_api/icons/v2/worship_hindu_pinlet'
  },

  {
    geometry: {
      location: new google.maps.LatLng({lat: 53.575, lng: 10.012})
    },
    icon_background_color: '#7B9EB0',
    icon_mask_base_uri:
      'https://maps.gstatic.com/mapfiles/place_api/icons/v2/worship_islam_pinlet'
  },

  {
    geometry: {
      location: new google.maps.LatLng({lat: 53.58, lng: 10.012})
    },
    icon_background_color: '#7B9EB0',
    icon_mask_base_uri:
      'https://maps.gstatic.com/mapfiles/place_api/icons/v2/worship_jain_pinlet'
  },

  {
    geometry: {
      location: new google.maps.LatLng({lat: 53.578, lng: 10.012})
    },
    icon_background_color: '#7B9EB0',
    icon_mask_base_uri:
      'https://maps.gstatic.com/mapfiles/place_api/icons/v2/worship_jewish_pinlet'
  },

  {
    geometry: {
      location: new google.maps.LatLng({lat: 53.578, lng: 10.015})
    },
    icon_background_color: '#7B9EB0',
    icon_mask_base_uri:
      'https://maps.gstatic.com/mapfiles/place_api/icons/v2/worship_sikh_pinlet'
  },

  {
    geometry: {
      location: new google.maps.LatLng({lat: 53.582, lng: 10.015})
    },
    icon_background_color: '#7B9EB0',
    icon_mask_base_uri:
      'https://maps.gstatic.com/mapfiles/place_api/icons/v2/generic_pinlet'
  },

  // Place category: Outdoor

  {
    geometry: {
      location: new google.maps.LatLng({lat: 53.56, lng: 10.015})
    },
    icon_background_color: '#4DB546',
    icon_mask_base_uri:
      'https://maps.gstatic.com/mapfiles/place_api/icons/v2/boating_pinlet'
  },

  {
    geometry: {
      location: new google.maps.LatLng({lat: 53.556, lng: 10.015})
    },
    icon_background_color: '#4DB546',
    icon_mask_base_uri:
      'https://maps.gstatic.com/mapfiles/place_api/icons/v2/camping_pinlet'
  },

  {
    geometry: {
      location: new google.maps.LatLng({lat: 53.55, lng: 10.018})
    },
    icon_background_color: '#4DB546',
    icon_mask_base_uri:
      'https://maps.gstatic.com/mapfiles/place_api/icons/v2/tree_pinlet'
  },

  {
    geometry: {
      location: new google.maps.LatLng({lat: 53.55, lng: 10.013})
    },
    icon_background_color: '#4DB546',
    icon_mask_base_uri:
      'https://maps.gstatic.com/mapfiles/place_api/icons/v2/stadium_pinlet'
  },

  {
    geometry: {
      location: new google.maps.LatLng({lat: 53.56, lng: 10.0197})
    },
    icon_background_color: '#4DB546',
    icon_mask_base_uri:
      'https://maps.gstatic.com/mapfiles/place_api/icons/v2/paw_pinlet'
  },

  // Place category: Emergency

  {
    geometry: {
      location: new google.maps.LatLng({lat: 53.573, lng: 9.995})
    },
    icon_background_color: '#F88181',
    icon_mask_base_uri:
      'https://maps.gstatic.com/mapfiles/place_api/icons/v2/hospital-H_pinlet'
  },

  {
    geometry: {
      location: new google.maps.LatLng({lat: 53.573, lng: 9.99})
    },
    icon_background_color: '#F88181',
    icon_mask_base_uri:
      'https://maps.gstatic.com/mapfiles/place_api/icons/v2/police_pinlet'
  }
];
