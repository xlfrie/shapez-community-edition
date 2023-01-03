import { createLogger } from "../../core/logging";
import { SavegameInterface_V1003 } from "./1003";


import schema from "./1004.json";
const logger = createLogger("savegame_interface/1004");

export class SavegameInterface_V1004 extends SavegameInterface_V1003 {
    getVersion() {
        return 1004;
    }

    getSchemaUncached() {
        return schema;
    }

    static migrate1003to1004(data: import("../savegame_typedefs.js").SavegameData) {
        logger.log("Migrating 1003 to 1004");
        const dump = data.dump;
        if (!dump) {
            return true;
        }

        // The hub simply has an empty label
        const waypointData = dump.waypoints.waypoints;
        for (let i = 0; i < waypointData.length; ++i) {
            const waypoint = waypointData[i];
            if (!waypoint.deletable) {
                waypoint.label = null;
            }
            delete waypoint.deletable;
        }
    }
}
