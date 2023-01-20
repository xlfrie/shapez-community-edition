import type { SavegameData } from "../savegame_typedefs.js";
import { createLogger } from "../../core/logging";
import { SavegameInterface_V1002 } from "./1002";

import schema from "./1003.json";
const logger = createLogger("savegame_interface/1003");

export class SavegameInterface_V1003 extends SavegameInterface_V1002 {
    getVersion() {
        return 1003;
    }

    getSchemaUncached() {
        return schema;
    }

    static migrate1002to1003(data: SavegameData) {
        logger.log("Migrating 1002 to 1003");
        const dump = data.dump;
        if (!dump) {
            return true;
        }

        dump.pinnedShapes = { shapes: [] };
    }
}
