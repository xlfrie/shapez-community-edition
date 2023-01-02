import { types } from "../../savegame/serialization";
import { BaseItem } from "../base_item";
import { Component } from "../component";
import { Entity } from "../entity";
import { typeItemSingleton } from "../item_resolver";

const chainBufferSize = 6;

export class MinerComponent extends Component {
    static getId() {
        return "Miner";
    }

    static getSchema() {
        // cachedMinedItem is not serialized.
        return {
            lastMiningTime: types.ufloat,
            itemChainBuffer: types.array(typeItemSingleton),
        };
    }
    public lastMiningTime = 0;
    public chainable: boolean;

    public cachedMinedItem: BaseItem = null;

    public itemChainBuffer: BaseItem[];

    /**
     * Which miner this miner ejects to, in case its a chainable one.
     * If the value is false, it means there is no entity, and we don't have to re-check
     */
    public cachedChainedMiner: Entity | null | false = null;

    constructor({ chainable = false }) {
        super();

        this.chainable = chainable

        this.clear();
    }

    clear() {
        /**
         * Stores items from other miners which were chained to this
         * miner.
         */
        this.itemChainBuffer = [];
    }

    tryAcceptChainedItem(item: BaseItem) {
        if (this.itemChainBuffer.length > chainBufferSize) {
            // Well, this one is full
            return false;
        }

        this.itemChainBuffer.push(item);
        return true;
    }
}
