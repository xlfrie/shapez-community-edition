import { GameRoot } from "./root";
import { ShapeDefinition } from "./shape_definition";
import { globalConfig } from "../core/config";
import { BaseItem } from "./base_item";
import { ShapeItem } from "./items/shape_item";
import { BasicSerializableObject } from "../savegame/serialization";

/**
 @enum 
*/
export const enumAnalyticsDataSource = {
    produced: "produced",
    stored: "stored",
    delivered: "delivered",
};

export class ProductionAnalytics extends BasicSerializableObject {
    static getId() {
        return "ProductionAnalytics";
    }
    public root = root;

    public history = {
        [enumAnalyticsDataSource.produced]: [],
        [enumAnalyticsDataSource.stored]: [],
        [enumAnalyticsDataSource.delivered]: [],
    };

    public lastAnalyticsSlice = 0;

    constructor(root) {
        super();

        for (let i = 0; i < globalConfig.statisticsGraphSlices; ++i) {
            this.startNewSlice();
        }

        this.root.signals.shapeDelivered.add(this.onShapeDelivered, this);
        this.root.signals.itemProduced.add(this.onItemProduced, this);
    }

    onShapeDelivered(definition: ShapeDefinition) {
        const key = definition.getHash();
        const entry = this.history[enumAnalyticsDataSource.delivered];
        entry[entry.length - 1][key] = (entry[entry.length - 1][key] || 0) + 1;
    }

    onItemProduced(item: BaseItem) {
        if (item.getItemType() === "shape") {
            const definition = (item as ShapeItem).definition;
            const key = definition.getHash();
            const entry = this.history[enumAnalyticsDataSource.produced];
            entry[entry.length - 1][key] = (entry[entry.length - 1][key] || 0) + 1;
        }
    }

    /** Starts a new time slice */
    startNewSlice() {
        for (const key in this.history) {
            if (key === enumAnalyticsDataSource.stored) {
                // Copy stored data
                this.history[key].push(Object.assign({}, this.root.hubGoals.storedShapes));
            } else {
                this.history[key].push({});
            }
            while (this.history[key].length > globalConfig.statisticsGraphSlices) {
                this.history[key].shift();
            }
        }
    }

    /** Returns the current rate of a given shape */
    getCurrentShapeRateRaw(dataSource: enumAnalyticsDataSource, definition: ShapeDefinition) {
        const slices = this.history[dataSource];
        return slices[slices.length - 2][definition.getHash()] || 0;
    }

    /** Returns the rate of a given shape, <historyOffset> frames ago */
    getPastShapeRate(
        dataSource: enumAnalyticsDataSource,
        definition: ShapeDefinition,
        historyOffset: number
    ) {
        assertAlways(
            historyOffset >= 0 && historyOffset < globalConfig.statisticsGraphSlices - 1,
            "Invalid slice offset: " + historyOffset
        );

        const slices = this.history[dataSource];
        return slices[slices.length - 2 - historyOffset][definition.getHash()] || 0;
    }

    /** Returns the rates of all shapes */
    getCurrentShapeRatesRaw(dataSource: enumAnalyticsDataSource) {
        const slices = this.history[dataSource];

        // First, copy current slice
        const baseValues = Object.assign({}, slices[slices.length - 2]);

        // Add past values
        for (let i = 0; i < 10; ++i) {
            const pastValues = slices[slices.length - i - 3];
            for (const key in pastValues) {
                baseValues[key] = baseValues[key] || 0;
            }
        }

        return baseValues;
    }

    update() {
        if (this.root.time.now() - this.lastAnalyticsSlice > globalConfig.analyticsSliceDurationSeconds) {
            this.lastAnalyticsSlice = this.root.time.now();
            this.startNewSlice();
        }
    }
}
