import { gItemRegistry } from "../core/global_registries";
import { types } from "../savegame/serialization";
import { BooleanItem, BOOL_FALSE_SINGLETON, BOOL_TRUE_SINGLETON } from "./items/boolean_item";
import { ColorItem, COLOR_ITEM_SINGLETONS } from "./items/color_item";
import { ShapeItem } from "./items/shape_item";
import type { GameRoot } from "./root";

export const MODS_ADDITIONAL_ITEMS = {};

/** Resolves items so we share instances */
export function itemResolverSingleton(
    root: GameRoot,
    data: {
        $: string;
        data: any;
    }
) {
    const itemType = data.$;
    const itemData = data.data;

    if (MODS_ADDITIONAL_ITEMS[itemType]) {
        return MODS_ADDITIONAL_ITEMS[itemType](itemData, root);
    }

    switch (itemType) {
        case BooleanItem.getId(): {
            return itemData ? BOOL_TRUE_SINGLETON : BOOL_FALSE_SINGLETON;
        }
        case ShapeItem.getId(): {
            return root.shapeDefinitionMgr.getShapeItemFromShortKey(itemData);
        }
        case ColorItem.getId(): {
            return COLOR_ITEM_SINGLETONS[itemData];
        }

        default: {
            assertAlways(false, "Unknown item type: " + itemType);
        }
    }
}

export const typeItemSingleton = types.obj(gItemRegistry, itemResolverSingleton);
