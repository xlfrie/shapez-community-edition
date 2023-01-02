/* typehints:start */
import type { GameRoot } from "./root";
/* typehints:end */

import { Rectangle } from "../core/rectangle";
import { gGameModeRegistry } from "../core/global_registries";
import { types, BasicSerializableObject } from "../savegame/serialization";
import { MetaBuilding } from "./meta_building";
import { MetaItemProducerBuilding } from "./buildings/item_producer";
import { BaseHUDPart } from "./hud/base_hud_part";
import { LevelDefinition } from "./modes/regular";

/**
 @enum
*/
export const enumGameModeIds = {
    puzzleEdit: "puzzleEditMode",
    puzzlePlay: "puzzlePlayMode",
    regular: "regularMode",
} as const;
export type enumGameModeIds = keyof typeof enumGameModeIds;

/**
 @enum
*/
export const enumGameModeTypes = {
    default: "defaultModeType",
    puzzle: "puzzleModeType",
} as const;
export type enumGameModeTypes = keyof typeof enumGameModeTypes;

export class GameMode extends BasicSerializableObject {
    static getId(): string {
        abstract;
        return "unknownMode";
    }

    static getType(): string {
        abstract;
        return "unknownType";
    }
    /** @param [id=Regular] */
    static create(
        root: GameRoot,
        id: string = enumGameModeIds.regular,
        payload: object | undefined = undefined
    ) {
        return new (gGameModeRegistry.findById(id))(root, payload);
    }

    public additionalHudParts: Record<string, typeof BaseHUDPart> = {};

    public hiddenBuildings: typeof MetaBuilding[] = [MetaItemProducerBuilding];

    constructor(public root: GameRoot) {
        super();
    }

    serialize(): object {
        return {
            $: this.getId(),
            data: super.serialize(),
        };
    }

    deserialize({ data }: any) {
        super.deserialize(data, this.root);
    }

    getId(): string {
        // @ts-ignore

        return this.constructor.getId();
    }

    getType(): string {
        // @ts-ignore

        return this.constructor.getType();
    }

    /** @param building - Class name of building */
    isBuildingExcluded(building: typeof MetaBuilding): boolean {
        return this.hiddenBuildings.indexOf(building) >= 0;
    }

    getBuildableZones(): undefined | Rectangle[] {
        return;
    }

    getCameraBounds(): Rectangle | undefined {
        return;
    }

    hasHub(): boolean {
        return true;
    }

    hasResources(): boolean {
        return true;
    }

    hasAchievements(): boolean {
        return false;
    }

    getMinimumZoom(): number {
        return 0.06;
    }

    getMaximumZoom(): number {
        return 3.5;
    }

    getUpgrades(): Record<string, Array<any>> {
        return {
            belt: [],
            miner: [],
            processors: [],
            painting: [],
        };
    }

    throughputDoesNotMatter() {
        return false;
    }

    /** @abstract */
    adjustZone(w: number = 0, h: number = 0) {
        abstract;
        return;
    }

    getLevelDefinitions(): LevelDefinition[] {
        return [];
    }

    getIsFreeplayAvailable(): boolean {
        return false;
    }

    getIsSaveable(): boolean {
        return true;
    }

    getHasFreeCopyPaste(): boolean {
        return false;
    }

    getSupportsWires(): boolean {
        return true;
    }

    getIsEditor(): boolean {
        return false;
    }

    getIsDeterministic(): boolean {
        return false;
    }

    getFixedTickrate(): number | undefined {
        return;
    }

    getBlueprintShapeKey(): string {
        return "CbCbCbRb:CwCwCwCw";
    }
}
