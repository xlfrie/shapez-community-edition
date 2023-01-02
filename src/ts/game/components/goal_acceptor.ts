import { globalConfig } from "../../core/config";
import { BaseItem } from "../base_item";
import { Component } from "../component";
import { typeItemSingleton } from "../item_resolver";

export class GoalAcceptorComponent extends Component {
    public currentDeliveredItems: number;
    public lastDelivery: { item: BaseItem; time: number; };
    public displayPercentage: number;
    static getId() {
        return "GoalAcceptor";
    }

    static getSchema() {
        return {
            item: typeItemSingleton,
        };
    }

    //// ths item to produce

    public item: BaseItem | undefined = item;

    constructor({ item = null, rate = null }) {
        super();

        this.clear();
    }

    clear() {
        /** The last item we delivered * */
        this.lastDelivery = null;

        // The amount of items we delivered so far
        this.currentDeliveredItems = 0;

        // Used for animations
        this.displayPercentage = 0;
    }

    /** Clears items but doesn't instantly reset the progress bar */
    clearItems() {
        this.lastDelivery = null;
        this.currentDeliveredItems = 0;
    }

    getRequiredSecondsPerItem() {
        return (
            globalConfig.goalAcceptorsPerProducer /
            (globalConfig.puzzleModeSpeed * globalConfig.beltSpeedItemsPerSecond)
        );
    }

    /** Copy the current state to another component */
    copyAdditionalStateTo(otherComponent: GoalAcceptorComponent) {
        otherComponent.item = this.item;
    }
}
