import { BaseGameSpeed } from "./base_game_speed";
import { globalConfig } from "../../core/config";

export class FastForwardGameSpeed extends BaseGameSpeed {
    static getId() {
        return "fast-forward";
    }

    getTimeMultiplier() {
        // @ts-ignore @BAgel03 I need better way of global config
        return globalConfig.fastForwardSpeed;
    }

    getMaxLogicStepsInQueue() {
        // @ts-ignore
        return 3 * globalConfig.fastForwardSpeed;
    }
}
