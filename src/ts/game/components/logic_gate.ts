import { Component } from "../component";

/**
 @enum
*/
export const enumLogicGateType = {
    and: "and",
    not: "not",
    xor: "xor",
    or: "or",
    transistor: "transistor",

    analyzer: "analyzer",
    rotater: "rotater",
    unstacker: "unstacker",
    cutter: "cutter",
    compare: "compare",
    stacker: "stacker",
    painter: "painter",
} as const;
export type enumLogicGateType = keyof typeof enumLogicGateType;

export class LogicGateComponent extends Component {
    static getId() {
        return "LogicGate";
    }

    public type: enumLogicGateType;

    constructor({ type = enumLogicGateType.and }: { type?: enumLogicGateType }) {
        super();

        this.type = type;
    }
}
