import type { GameState } from "../core/game_state";
import type { BaseHUDPart } from "../game/hud/base_hud_part";
import type { GameRoot } from "../game/root";
import type { InGameState } from "../states/ingame";

import { Signal } from "../core/signal";
import { SerializedGame } from "../savegame/savegame_typedefs";

// Single file to avoid circular deps

export const MOD_SIGNALS = {
    // Called when the application has booted and instances like the app settings etc are available
    appBooted: new Signal(),

    modifyLevelDefinitions: new Signal<[Array<object>]>(),
    modifyUpgrades: new Signal<[Object]>(),

    hudElementInitialized: new Signal<[BaseHUDPart]>(),
    hudElementFinalized: new Signal<[BaseHUDPart]>(),

    hudInitializer: new Signal<[GameRoot]>(),

    gameInitialized: new Signal<[GameRoot]>(),
    gameLoadingStageEntered: new Signal<[InGameState, string]>(),

    gameStarted: new Signal<[GameRoot]>(),

    stateEntered: new Signal<[GameState]>(),

    gameSerialized: new Signal() as TypedSignal<
        [GameRoot, SerializedGame]
    >,
    gameDeserialized: new Signal() as TypedSignal<
        [GameRoot, SerializedGame]
    >,
};
