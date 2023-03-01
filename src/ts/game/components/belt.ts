import { enumDirection, Vector } from "../../core/vector";
import { BeltPath } from "../belt_path";
import { Component } from "../component";
import type { ItemAcceptorSlot } from "./item_acceptor";
import { ItemEjectorSlot } from "./item_ejector";

export const curvedBeltLength = /* Math.PI / 4 */ 0.78;

export const FAKE_BELT_ACCEPTOR_SLOT: ItemAcceptorSlot = {
    pos: new Vector(0, 0),
    direction: enumDirection.bottom,
};

// @ts-ignore @Bagel03
export const FAKE_BELT_EJECTOR_SLOT_BY_DIRECTION: Record<enumDirection, ItemEjectorSlot> = {
    [enumDirection.top]: {
        pos: new Vector(0, 0),
        direction: enumDirection.top,
        item: null,
        progress: 0,
    },

    [enumDirection.right]: {
        pos: new Vector(0, 0),
        direction: enumDirection.right,
        item: null,
        progress: 0,
    },

    [enumDirection.left]: {
        pos: new Vector(0, 0),
        direction: enumDirection.left,
        item: null,
        progress: 0,
    },
};

export class BeltComponent extends Component {
    static getId() {
        return "Belt";
    }

    public direction: enumDirection;

    /** The path this belt is contained in, not serialized */
    public assignedPath: BeltPath = null;

    /** @param param0.direction The direction of the belt */
    constructor({ direction = enumDirection.top }: { direction?: enumDirection }) {
        super();
        this.direction = direction;
    }

    clear() {
        if (this.assignedPath) {
            this.assignedPath.clearAllItems();
        }
    }

    /** Returns the effective length of this belt in tile space */
    getEffectiveLengthTiles(): number {
        return this.direction === enumDirection.top ? 1.0 : curvedBeltLength;
    }

    /** Returns fake acceptor slot used for matching */
    getFakeAcceptorSlot(): ItemAcceptorSlot {
        return FAKE_BELT_ACCEPTOR_SLOT;
    }

    /** Returns fake acceptor slot used for matching */
    getFakeEjectorSlot(): ItemEjectorSlot {
        assert(
            FAKE_BELT_EJECTOR_SLOT_BY_DIRECTION[this.direction],
            "Invalid belt direction: ",
            this.direction
        );
        return FAKE_BELT_EJECTOR_SLOT_BY_DIRECTION[this.direction];
    }

    /**
     * Converts from belt space (0 = start of belt ... 1 = end of belt) to the local
     * belt coordinates (-0.5|-0.5 to 0.5|0.5)
     */
    transformBeltToLocalSpace(progress: number): Vector {
        assert(progress >= 0.0, "Invalid progress ( < 0): " + progress);
        switch (this.direction) {
            case enumDirection.top:
                assert(progress <= 1.02, "Invalid progress: " + progress);
                return new Vector(0, 0.5 - progress);

            case enumDirection.right: {
                assert(progress <= curvedBeltLength + 0.02, "Invalid progress 2: " + progress);
                const arcProgress = (progress / curvedBeltLength) * 0.5 * Math.PI;
                return new Vector(0.5 - 0.5 * Math.cos(arcProgress), 0.5 - 0.5 * Math.sin(arcProgress));
            }
            case enumDirection.left: {
                assert(progress <= curvedBeltLength + 0.02, "Invalid progress 3: " + progress);
                const arcProgress = (progress / curvedBeltLength) * 0.5 * Math.PI;
                return new Vector(-0.5 + 0.5 * Math.cos(arcProgress), 0.5 - 0.5 * Math.sin(arcProgress));
            }
            default:
                assertAlways(false, "Invalid belt direction: " + this.direction);
                return new Vector(0, 0);
        }
    }
}
