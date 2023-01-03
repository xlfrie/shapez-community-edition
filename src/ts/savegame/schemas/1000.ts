import { BaseSavegameInterface } from "../savegame_interface";

import schema from "./1000.json";
export class SavegameInterface_V1000 extends BaseSavegameInterface {
    getVersion() {
        return 1000;
    }

    getSchemaUncached() {
        return schema;
    }
}
