
import { Rectangle } from "../../core/rectangle";
import { types } from "../../savegame/serialization";
import { enumGameModeTypes, GameMode } from "../game_mode";
import { BaseHUDPart } from "../hud/base_hud_part";
import { HUDMassSelector } from "../hud/parts/mass_selector";
import { HUDPuzzleBackToMenu } from "../hud/parts/puzzle_back_to_menu";
import { HUDPuzzleDLCLogo } from "../hud/parts/puzzle_dlc_logo";
import { MetaBuilding } from "../meta_building";

export class PuzzleGameMode extends GameMode {
    static getType() {
        return enumGameModeTypes.puzzle;
    }

    static getSchema(): object {
        return {
            zoneHeight: types.uint,
            zoneWidth: types.uint,
        };
    }

    public additionalHudParts = {
        puzzleBackToMenu: HUDPuzzleBackToMenu,
        puzzleDlcLogo: HUDPuzzleDLCLogo,
        massSelector: HUDMassSelector,
    } as Record<string, Class<BaseHUDPart>>;

    zoneWidth: number;
    zoneHeight: number;

    constructor(root) {
        super(root);

        const data = this.getSaveData();
        this.zoneWidth = data.zoneWidth || 8;
        this.zoneHeight = data.zoneHeight || 6;
    }

    isBuildingExcluded(building: typeof MetaBuilding) {
        return this.hiddenBuildings.indexOf(building) >= 0;
    }

    getSaveData() {
        const save = this.root.savegame.getCurrentDump();
        if (!save) {
            return {};
        }
        // @ts-ignore @Bagel03
        return save.gameMode.data;
    }

    getCameraBounds() {
        return Rectangle.centered(this.zoneWidth + 20, this.zoneHeight + 20);
    }

    getBuildableZones() {
        return [Rectangle.centered(this.zoneWidth, this.zoneHeight)];
    }

    hasHub() {
        return false;
    }

    hasResources() {
        return false;
    }

    getMinimumZoom() {
        return 1;
    }

    getMaximumZoom() {
        return 4;
    }

    getIsSaveable() {
        return false;
    }

    getHasFreeCopyPaste() {
        return true;
    }

    throughputDoesNotMatter() {
        return true;
    }

    getSupportsWires() {
        return false;
    }

    getFixedTickrate() {
        return 300;
    }

    getIsDeterministic() {
        return true;
    }

    getIsFreeplayAvailable(): boolean {
        return true;
    }
}
