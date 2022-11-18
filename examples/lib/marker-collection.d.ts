import type { Attributes } from './marker';
export declare class MarkerCollection<TUserData extends object = Record<any, any>> {
    constructor(data: TUserData[], attributes: Attributes<TUserData>);
    static fromArray<TUserData extends object = Record<any, any>>(data: TUserData[], attributes: Attributes<TUserData>): MarkerCollection;
}
