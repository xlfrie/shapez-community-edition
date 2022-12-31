import { Component } from "../component";

export class WireTunnelComponent extends Component {
    static getId() {
        return "WireTunnel";
    }

    /** Linked network, only if its not multiple directions */
    public linkedNetworks: Array<import("../systems/wire").WireNetwork> = [];

    constructor() {
        super();
    }
}
