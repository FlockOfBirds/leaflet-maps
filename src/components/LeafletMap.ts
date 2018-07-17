import { Component, createElement } from "react";
import { LatLngLiteral, Map, marker, popup, tileLayer } from "leaflet";

import { Location } from "./Utils/ContainerUtils";
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
    // locations?: Location[];
}

export type mapProviders = "Open street" | "Map box";

export class LeafletMap extends Component<LeafletMapProps, LeafletMapState> {

    private leafletNode?: HTMLDivElement;
    private defaultCenterLocation: LatLngLiteral = { lat: 51.9107963, lng: 4.4789878 };

    private map?: Map;
    state: LeafletMapState = {
        center: { lat: 0, lng: 0 }
        // locations: this.props.locations
    };

    constructor(props: LeafletMapProps) {
        super(props);

        this.renderLeafletMap = this.renderLeafletMap.bind(this);
        this.setDefaultCenter = this.setDefaultCenter.bind(this);
    }

    render() {
        return createElement("div", {
            ref: (leafletNode?: HTMLDivElement) => this.leafletNode = leafletNode,
            style: { width: "800px", height: "500px" } }
        );
    }

    componentWillReceiveProps(newProps: LeafletMapProps) {
        if (newProps) {
            this.setDefaultCenter(newProps);
        }
    }

    componentDidMount() {
        if (this.leafletNode) {
            this.map = new Map(this.leafletNode);
        }
    }

    componentDidUpdate(prevProps: LeafletMapProps, prevState: LeafletMapState) {
        if (prevState !== this.state && prevProps !== this.props) {
            this.renderLeafletMap(this.state.center, Number(this.props.zoomLevel));
        }
    }

    componentWillUnmount() {
        if (this.map) {
            this.map.remove();
        }
    }

    private setDefaultCenter(props: LeafletMapProps) {
        if (props.locations && props.locations.length !== 0) {
            this.getLocation(props);
        } else if (props.defaultCenterLatitude && props.defaultCenterLongitude) {
            this.setState({
                center: {
                    lat: Number(props.defaultCenterLatitude),
                    lng: Number(props.defaultCenterLongitude)
                }
            });
        } else {
            this.setState({ center: this.defaultCenterLocation });
        }
    }

    private getLocation(props: LeafletMapProps) {
        if (props.locations) {
            props.locations.map(location => {
                this.setState({
                    center: {
                        lat: Number(location.latitude),
                        lng: Number(location.longitude)
                    }
                });
            });
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
                .setContent(content)
            );
        }
    }

    private createMarker = () => {
        if (this.map) {
            createElement(Marker, {}, marker(this.state.center).addTo(this.map));
        }
    }
}
