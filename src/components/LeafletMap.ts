import { Component, createElement } from "react";
import { LatLngLiteral, Map, icon, marker, tileLayer } from "leaflet";
import * as classNames from "classnames";

import { LeafletMapsContainerProps } from "./LeafletMapsContainer";
import { DefaultLocations, Location } from "./Utils/ContainerUtils";
import { Alert } from "./Alert";
import { Dimensions, getDimensions, parseStyle } from "./Utils/Styles";

type ComponentProps = {
    allLocations?: Location[];
    className?: string;
    alertMessage?: string;
} & LeafletMapsContainerProps;

export type LeafletMapProps = ComponentProps & Dimensions & DefaultLocations;

export interface LeafletMapState {
    center: LatLngLiteral;
    url?: string;
}

export type mapProviders = "Open street" | "Map box";

export class LeafletMap extends Component<LeafletMapProps, LeafletMapState> {
    private leafletNode?: HTMLDivElement;
    private defaultCenterLocation: LatLngLiteral = { lat: 51.9107963, lng: 4.4789878 };
    private map?: Map;

    readonly state: LeafletMapState = {
        center: { lat: 0, lng: 0 },
        url: ""
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
            createElement(Alert, {
                bootstrapStyle: "danger",
                className: "widget-leaflet-maps-alert",
                message: this.props.alertMessage
            }),
            createElement("div", {
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
        if (props.allLocations && props.allLocations.length && !props.alertMessage) {
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
                    },
                    url: location.url
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
            if (this.state.url) {
                marker(this.state.center)
                    .setIcon(icon({
                        iconUrl: this.state.url,
                        iconSize: [ 38, 95 ],
                        iconAnchor: [ 22, 94 ]
                    }))
                    .bindPopup("Nice Popup")
                    .addTo(this.map);
            } else {
                marker(this.state.center)
                    .bindPopup("Nice Pop")
                    .addTo(this.map);
            }
        }
    }
}
