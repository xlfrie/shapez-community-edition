/* eslint-disable no-unused-vars */
import { Signal } from "../core/signal";
import { RandomNumberGenerator } from "../core/rng";
import { createLogger } from "../core/logging";

// Type hints
/* typehints:start */
import type { GameTime } from "./time/game_time";
import type { EntityManager } from "./entity_manager";
import type { GameSystemManager } from "./game_system_manager";
import type { AchievementProxy } from "./achievement_proxy";
import type { GameHUD } from "./hud/hud";
import type { MapView } from "./map_view";
import type { Camera } from "./camera";
import type { InGameState } from "../states/ingame";
import type { AutomaticSave } from "./automatic_save";
import type { Application } from "../application";
import type { SoundProxy } from "./sound_proxy";
import type { Savegame } from "../savegame/savegame";
import type { GameLogic } from "./logic";
import type { ShapeDefinitionManager } from "./shape_definition_manager";
import type { HubGoals } from "./hub_goals";
import type { BufferMaintainer } from "../core/buffer_maintainer";
import type { ProductionAnalytics } from "./production_analytics";
import type { Entity } from "./entity";
import type { ShapeDefinition } from "./shape_definition";
import type { BaseItem } from "./base_item";
import type { DynamicTickrate } from "./dynamic_tickrate";
import type { KeyActionMapper } from "./key_action_mapper";
import type { Vector } from "../core/vector";
import type { GameMode } from "./game_mode";
import { enumHubGoalRewards } from "./tutorial_goals";
/* typehints:end */

const logger = createLogger("game/root");

export const layers: Array<Layer> = ["regular", "wires"];

/**
 * The game root is basically the whole game state at a given point,
 * combining all important classes. We don't have globals, but this
 * class is passed to almost all game classes.
 */
export class GameRoot {
    public savegame: Savegame = null;

    public gameState: InGameState = null;

    public keyMapper: KeyActionMapper = null;

    //// Store game dimensions
    public gameWidth = 500;
    public gameHeight = 500;

    //// Stores whether the current session is a fresh game (true), or was continued (false)

    public gameIsFresh: boolean = true;

    //// Stores whether the logic is already initialized

    public logicInitialized: boolean = false;

    //// Stores whether the game is already initialized, that is, all systems etc have been created

    public gameInitialized: boolean = false;

    /** Whether a bulk operation is running */
    public bulkOperationRunning = false;

    /** Whether a immutable operation is running */
    public immutableOperationRunning = false;

    ////////// Other properties ///////

    public camera: Camera = null;

    public canvas: HTMLCanvasElement = null;

    public context: CanvasRenderingContext2D = null;

    public map: MapView = null;

    public logic: GameLogic = null;

    public entityMgr: EntityManager = null;

    public hud: GameHUD = null;

    public systemMgr: GameSystemManager = null;

    public time: GameTime = null;

    public hubGoals: HubGoals = null;

    public buffers: BufferMaintainer = null;

    public automaticSave: AutomaticSave = null;

    public soundProxy: SoundProxy = null;

    public achievementProxy: AchievementProxy = null;

    public shapeDefinitionMgr: ShapeDefinitionManager = null;

    public productionAnalytics: ProductionAnalytics = null;

    public dynamicTickrate: DynamicTickrate = null;

    public currentLayer: Layer = "regular";

    public gameMode: GameMode = null;

    public signals = {
        // Entities
        entityManuallyPlaced: new Signal<[Entity]>(),
        entityAdded: new Signal<[Entity]>(),
        entityChanged: new Signal<[Entity]>(),
        entityGotNewComponent: new Signal<[Entity]>(),
        entityComponentRemoved: new Signal<[Entity]>(),
        entityQueuedForDestroy: new Signal<[Entity]>(),
        entityDestroyed: new Signal<[Entity]>(),

        // Global
        resized: new Signal<[number, number]>(),
        readyToRender: new Signal<[]>(),
        aboutToDestruct: new Signal(),

        // Game Hooks
        gameSaved: new Signal<[]>(),
        gameRestored: new Signal<[]>(),

        gameFrameStarted: new Signal<[]>(),

        storyGoalCompleted: new Signal<[number, enumHubGoalRewards]>(),
        upgradePurchased: new Signal<[string]>(),

        // Called right after game is initialized
        postLoadHook: new Signal<[]>(),

        shapeDelivered: new Signal<[ShapeDefinition]>(),
        itemProduced: new Signal<[BaseItem]>(),

        bulkOperationFinished: new Signal<[]>(),
        immutableOperationFinished: new Signal<[]>(),

        editModeChanged: new Signal<[Layer]>(),

        // Called to check if an entity can be placed, second parameter is an additional offset.
        // Use to introduce additional placement checks
        prePlacementCheck: new Signal<[Entity, Vector]>(),

        // Called before actually placing an entity, use to perform additional logic
        // for freeing space before actually placing.
        freeEntityAreaBeforeBuild: new Signal<[Entity]>(),

        // Called with an achievement key and necessary args to validate it can be unlocked.
        achievementCheck: new Signal<[string, any]>(),
        bulkAchievementCheck: new Signal<(string | any)[]>(),

        // Puzzle mode
        puzzleComplete: new Signal<[]>(),
    };

    //// RNG's

    public rngs: {
        [idx: string]: {
            [idx: string]: RandomNumberGenerator
        };
    } = {};

    //// Work queue
    public queue = {
        requireRedraw: false,
    };
    /** Constructs a new game root */

    constructor(public app: Application) { }

    /** Destructs the game root */
    destruct() {
        logger.log("destructing root");
        this.signals.aboutToDestruct.dispatch();

        this.reset();
    }

    /** Resets the whole root and removes all properties */
    reset() {
        if (this.signals) {
            // Destruct all signals
            // @ts-ignore @Bagel0 wtf
            for (let i = 0; i < this.signals.length; ++i) {
                this.signals[i].removeAll();
            }
        }

        if (this.hud) {
            this.hud.cleanup();
        }
        if (this.camera) {
            this.camera.cleanup();
        }

        // Finally free all properties
        for (let prop in this) {
            if (this.hasOwnProperty(prop)) {
                delete this[prop];
            }
        }
    }
}
