import { Component, createElement } from "react";
import { LatLngLiteral, Map, marker, tileLayer } from "leaflet";
import * as classNames from "classnames";

import { LeafletMapsContainerProps } from "./LeafletMapsContainer";
import { DefaultLocations, Location } from "./Utils/ContainerUtils";
import { Marker } from "./Marker";
import { Alert } from "./Alert";
import { Dimensions, getDimensions, parseStyle } from "./Utils/Styles";

type ComponentProps = { allLocations?: Location[], className?: string } & LeafletMapsContainerProps;
export type LeafletMapProps = ComponentProps & Dimensions & DefaultLocations;

export interface LeafletMapState {
    alertMessage?: string;
    center: LatLngLiteral;
}

export type mapProviders = "Open street" | "Map box";

export class LeafletMap extends Component<LeafletMapProps, LeafletMapState> {

    private leafletNode?: HTMLDivElement;
    private defaultCenterLocation: LatLngLiteral = { lat: 51.9107963, lng: 4.4789878 };

    private map?: Map;
    state: LeafletMapState = {
        center: { lat: 0, lng: 0 }
    };

    constructor(props: LeafletMapProps) {
        super(props);

        this.renderLeafletMap = this.renderLeafletMap.bind(this);
        this.setDefaultCenter = this.setDefaultCenter.bind(this);
    }

    render() {
        return createElement("div",
            {
                className: classNames("widget-leaflet-maps-wrapper", this.props.className),
                style: { ...getDimensions(this.props), ...parseStyle(this.props.style) }
            },
            createElement(Alert,
            {
                bootstrapStyle: "danger",
                className: "widget-leaflet-maps-alert",
                message: this.state.alertMessage
            }),
            createElement("div",
            {
                className: "widget-leaflet-maps",
                ref: (leafletNode?: HTMLDivElement) => this.leafletNode = leafletNode
            }
        ));
    }

    componentWillReceiveProps(newProps: LeafletMapProps) {
        if (newProps) {
            this.setDefaultCenter(newProps);
        }
    }

    componentDidMount() {
        if (this.leafletNode) {
            this.map = new Map(this.leafletNode).fitWorld();
        }
    }

    componentDidUpdate(prevProps: LeafletMapProps, prevState: LeafletMapState) {
        if (prevState !== this.state && prevProps !== this.props) {
            this.renderLeafletMap(this.state.center, this.props.zoomLevel);
        }
    }

    componentWillUnmount() {
        if (this.map) {
            this.map.remove();
        }
    }

    private setDefaultCenter(props: LeafletMapProps) {
        if (props.allLocations && props.allLocations.length) {
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

    private getLocation = (props: LeafletMapProps) => {
        if (props.allLocations) {
            props.allLocations.map(location => {
                this.setState({
                    center: {
                        lat: Number(location.latitude),
                        lng: Number(location.longitude)
                    }
                });
            });
        }
    }

    private renderLeafletMap = (coordinates: LatLngLiteral, zoomValue: number) => {
        const { urlTemplate, attribution } = this.props;
        if (this.map) {
            this.map.setView(coordinates, Number(zoomValue));
            this.setLayer(urlTemplate, attribution);
            this.createMarker();
        }
    }

    private setLayer = (urlTemplate: string, mapAttribution?: string) => {
        if (this.map) {
            this.map.addLayer(tileLayer(urlTemplate, { attribution: mapAttribution }));
        }
    }

    private createMarker = () => {
        if (this.map) {
            createElement(Marker, {}, marker(this.state.center).bindPopup("Nice Popup").addTo(this.map));
        }
    }
}
