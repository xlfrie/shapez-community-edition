import { types } from "../../savegame/serialization";
import { BaseItem } from "../base_item";
import { Component } from "../component";
import { typeItemSingleton } from "../item_resolver";
import { ColorItem } from "../items/color_item";
import { ShapeItem } from "../items/shape_item";

export const MODS_ADDITIONAL_STORAGE_ITEM_RESOLVER: {
    [x: string]: (item: BaseItem) => Boolean;
} = {};
export class StorageComponent extends Component {
    static getId() {
        return "Storage";
    }

    static getSchema() {
        return {
            storedCount: types.uint,
            storedItem: types.nullable(typeItemSingleton),
        };
    }

    public maximumStorage: number;

    /** Currently stored item */
    public storedItem: BaseItem = null;

    /** How many of this item we have stored */
    public storedCount = 0;

    /** We compute an opacity to make sure it doesn't flicker */
    public overlayOpacity = 0;

    /** @param param0.maximumStorage How much this storage can hold */

    constructor({ maximumStorage = 1e20 }: { maximumStorage?: number }) {
        super();

        this.maximumStorage = maximumStorage;
    }

    /** Returns whether this storage can accept the item */
    canAcceptItem(item: BaseItem) {
        if (this.storedCount >= this.maximumStorage) {
            return false;
        }
        if (!this.storedItem || this.storedCount === 0) {
            return true;
        }

        const itemType = item.getItemType();

        if (itemType !== this.storedItem.getItemType()) {
            // Check type matches
            return false;
        }

        if (MODS_ADDITIONAL_STORAGE_ITEM_RESOLVER[itemType]) {
            return MODS_ADDITIONAL_STORAGE_ITEM_RESOLVER[itemType].apply(this, [item]);
        }

        if (itemType === "color") {
            return (this.storedItem as ColorItem).color === (item as ColorItem).color;
        }

        if (itemType === "shape") {
            return (
                (this.storedItem as ShapeItem).definition.getHash() ===
                (item as ShapeItem).definition.getHash()
            );
        }
        return false;
    }

    /** Returns whether the storage is full */
    getIsFull(): boolean {
        return this.storedCount >= this.maximumStorage;
    }

    takeItem(item: BaseItem) {
        this.storedItem = item;
        this.storedCount++;
    }
}