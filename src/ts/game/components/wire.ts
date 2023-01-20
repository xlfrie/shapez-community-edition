import type { WireNetwork } from "../systems/wire";
import { Component } from "../component";

/**
 @enum
*/
export const enumWireType = {
    forward: "forward",
    turn: "turn",
    split: "split",
    cross: "cross",
} as const;
export type enumWireType = keyof typeof enumWireType;

/**
 @enum
*/
export const enumWireVariant = {
    first: "first",
    second: "second",
} as const;
export type enumWireVariant = keyof typeof enumWireVariant;

export class WireComponent extends Component {
    static getId() {
        return "Wire";
    }

    public type: enumWireType;

    /** The variant of the wire, different variants do not connect */
    public variant: enumWireVariant;

    public linkedNetwork: WireNetwork = null;

    constructor({
        type = enumWireType.forward,
        variant = enumWireVariant.first,
    }: {
        type: enumWireType;
        variant: enumWireVariant;
    }) {
        super();

        this.type = type;
        this.variant = variant;
    }
}
