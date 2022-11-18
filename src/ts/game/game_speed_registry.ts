import { RegularGameSpeed } from "./time/regular_game_speed";
import { gGameSpeedRegistry } from "../core/global_registries";
export function initGameSpeedRegistry(): any {
    gGameSpeedRegistry.register(RegularGameSpeed);
    // Others are disabled for now
}
