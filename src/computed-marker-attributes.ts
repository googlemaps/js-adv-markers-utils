import {toLatLng} from './position-formats';
import {AttributeKey, attributeKeys} from './marker-attributes';

import type {Marker} from './marker';
import type {StaticAttributes} from './marker-attributes';

/**
 * ComputedMarkerAttributes resolves all attributes based on dynamic and static
 * values and makes them behave as if there were only static attributes.
 */
export class ComputedMarkerAttributes<T = unknown>
  implements Partial<StaticAttributes>
{
  private readonly marker_: Marker<T>;
  private callbackDepth_: number = 0;

  // Attributes are declaration-only, the implementataion uses dynamic
  // getters/setters created in the static initializer

  // note: internally, the position-attribute uses the google.maps.LatLng
  //   type instead of the generic Position type.
  declare readonly position?: google.maps.LatLng;
  declare readonly draggable?: StaticAttributes['draggable'];
  declare readonly collisionBehavior?: StaticAttributes['collisionBehavior'];
  declare readonly title?: StaticAttributes['title'];
  declare readonly zIndex?: StaticAttributes['zIndex'];

  declare readonly glyph?: StaticAttributes['glyph'];
  declare readonly scale?: StaticAttributes['scale'];
  declare readonly color?: StaticAttributes['color'];
  declare readonly backgroundColor?: StaticAttributes['backgroundColor'];
  declare readonly borderColor?: StaticAttributes['borderColor'];
  declare readonly glyphColor?: StaticAttributes['glyphColor'];
  declare readonly icon?: StaticAttributes['icon'];

  constructor(marker: Marker<T>) {
    this.marker_ = marker;
  }

  /**
   * Resolves the specified attribute into a static value, calling a dynamic
   * attribute function.
   *
   * @param key
   */
  private getComputedAttributeValue<TKey extends AttributeKey>(
    key: TKey
  ): StaticAttributes[TKey] | undefined {
    const value = this.marker_[key];
    if (typeof value !== 'function') {
      return this.marker_[key] as StaticAttributes[TKey];
    }

    this.callbackDepth_++;
    if (this.callbackDepth_ > 10) {
      throw new Error(
        'maximum recursion depth reached. ' +
          'This is probably caused by a cyclic dependency in dynamic attributes.'
      );
    }

    const {map, data, marker} = this.marker_.getDynamicAttributeState();
    const res = value({data, map, marker, attr: this});
    this.callbackDepth_--;

    return res as StaticAttributes[TKey];
  }

  /**
   * The static initializer sets up the implementation for the properties of the
   * ComputedMarkerAttributes class.
   */
  static {
    Object.defineProperty(this.prototype, 'position', {
      get(this: ComputedMarkerAttributes) {
        const userValue = this.getComputedAttributeValue('position');

        if (userValue) return toLatLng(userValue);
      }
    });

    for (const key of attributeKeys) {
      // position is treated separately, so it is skipped here
      if (key === 'position') continue;

      Object.defineProperty(this.prototype, key, {
        get(this: ComputedMarkerAttributes) {
          return this.getComputedAttributeValue(key);
        }
      });
    }
  }
}
