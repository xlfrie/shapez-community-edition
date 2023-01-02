import { createLogger } from "../core/logging";

const Ajv = require("ajv");
const ajv = new Ajv({
    allErrors: false,
    uniqueItems: false,
    unicode: false,
    nullable: false,
});

const validators = {};

const logger = createLogger("savegame_interface");

export class BaseSavegameInterface {
    /** Returns the interfaces version */
    getVersion(): number {
        throw new Error("Implement get version");
    }

    /** Returns the uncached json schema */
    getSchemaUncached(): object {
        throw new Error("Implement get schema");
    }

    getValidator() {
        const version = this.getVersion();
        if (validators[version]) {
            return validators[version];
        }
        logger.log("Compiling schema for savegame version", version);
        const schema = this.getSchemaUncached();
        try {
            validators[version] = ajv.compile(schema);
        } catch (ex) {
            logger.error("SCHEMA FOR", this.getVersion(), "IS INVALID!");
            logger.error(ex);
            throw new Error("Invalid schema for version " + version);
        }
        return validators[version];
    }

    /** Constructs an new interface for the given savegame */
    constructor(public data: any) { }

    /** Validates the data */
    validate(): boolean {
        const validator = this.getValidator();

        if (!validator(this.data)) {
            logger.error(
                "Savegame failed validation! ErrorText:",
                ajv.errorsText(validator.errors),
                "RawErrors:",
                validator.errors
            );
            return false;
        }

        return true;
    }

    ///// INTERFACE (Override when the schema changes) /////

    /** Returns the time of last update */
    readLastUpdate(): number {
        return this.data.lastUpdate;
    }

    /** Returns the ingame time in seconds */
    readIngameTimeSeconds(): number {
        return this.data.dump.time.timeSeconds;
    }
}
