import { Component } from "../component";
import { WireNetwork } from "../systems/wire";

export class WireTunnelComponent extends Component {
    static getId() {
        return "WireTunnel";
    }

    /** Linked network, only if its not multiple directions */
    public linkedNetworks: Array<WireNetwork> = [];

    constructor() {
        super();
    }
}
