import { Component, createElement } from "react";
import * as leaf from "leaflet";

import "leaflet/dist/leaflet.css";

export interface LeafletMapsContainerProps {
    mxObject?: mendix.lib.MxObject;
}

export interface LeafletMapsContainerState {
    alertMessage?: string;
}

export default class LeafletMapsContainer extends Component<LeafletMapsContainerProps, LeafletMapsContainerState> {
    private leafletNode?: HTMLDivElement;

    readonly state: LeafletMapsContainerState = {
        alertMessage: ""
    };

    render() {
        return createElement("div", { ref: this.getLeafletRef, style: { width: "800px", height: "500px" } });
    }

    componentDidMount() {
        if (this.leafletNode) {
            this.setupLeafletMap();
        }
    }

    private getLeafletRef = (node?: HTMLDivElement) => {
        if (node) {
            this.leafletNode = node;
        }
    }

    private setupLeafletMap() {
        if (this.leafletNode) {
            leaf.map(this.leafletNode).setView([ 51.505, -0.09 ], 13);
        }
    }
}
