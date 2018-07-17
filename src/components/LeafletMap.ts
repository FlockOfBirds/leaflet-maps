import { Component, createElement } from "react";
import { LatLngLiteral, Map, marker, popup, tileLayer } from "leaflet";

import { Marker } from "./Marker";

export interface LeafletMapProps {
    attribution?: string;
    urlTemplate: string;
    defaultCenterLatitude?: string;
    defaultCenterLongitude?: string;
    zoomLevel: string;
    locations?: Location[];
    mapProvider: mapProviders;
}

export interface LeafletMapState {
    alertMessage?: string;
    center: LatLngLiteral;
    locations?: Location[];
}

export interface Location {
    latitude?: string;
    longitude?: string;
}

export type mapProviders = "Open street" | "Map box";

export class LeafletMap extends Component<LeafletMapProps, LeafletMapState> {

    private leafletNode?: HTMLDivElement;
    // private defaultCenterLocation: LatLngLiteral = { lat: 51.9107963, lng: 4.4789878 };

    private map?: Map;
    readonly state: LeafletMapState = {
        center: {
            lat: Number(this.props.defaultCenterLatitude),
            lng: Number(this.props.defaultCenterLongitude)
        },
        locations: this.props.locations
    };

    constructor(props: LeafletMapProps) {
        super(props);

        this.renderLeafletMap = this.renderLeafletMap.bind(this);
    }

    render() {
        return createElement("div", {
            ref: (leafletNode?: HTMLDivElement) => this.leafletNode = leafletNode,
            style: { width: "800px", height: "500px" } }
        );
    }

    componentWillReceiveProps(newProps: LeafletMapProps) {
        if (newProps) {
            this.renderLeafletMap(this.state.center, Number(newProps.zoomLevel));
        }
    }

    componentDidMount() {
        if (this.leafletNode) {
            this.map = new Map(this.leafletNode);
        }
    }

    private renderLeafletMap(coordinates: LatLngLiteral, zoomValue: number) {
        const { urlTemplate, attribution } = this.props;
        if (this.map) {
            this.map.setView(coordinates, Number(zoomValue));
            this.setLayer(urlTemplate, attribution);
            this.createMarker();
            this.addPopUp(coordinates, "Nice Popup");
        }
    }

    private setLayer = (urlTemplate: string, mapAttribution?: string) => {
        if (this.map) {
            this.map.addLayer(tileLayer(urlTemplate, { attribution: mapAttribution }));
        }
    }

    private addPopUp = (coordinates: LatLngLiteral, content: string) => {
        if (this.map) {
            this.map.openPopup(
                popup()
                .setLatLng(coordinates)
                .setPopupContent(content)
            );
        }
    }

    private createMarker = () => {
        if (this.map) {
            createElement(Marker, {}, marker(this.state.center).addTo(this.map));
        }
    }
}
