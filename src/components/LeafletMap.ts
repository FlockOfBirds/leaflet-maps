import { Component, createElement } from "react";
import { LatLngLiteral, Map, icon, marker, tileLayer } from "leaflet";
import * as classNames from "classnames";

import { Container } from "./Utils/ContainerUtils";
import { Style } from "./Utils/Styles";
import { Alert } from "./Alert";
import LeafletMapsContainerProps = Container.LeafletMapsContainerProps;
import Location = Container.Location;
import Dimensions = Style.Dimensions;
import getDimensions = Style.getDimensions;
import parseStyle = Style.parseStyle;

type ComponentProps = {
    allLocations?: Location[];
    className?: string;
    alertMessage?: string;
} & LeafletMapsContainerProps;

export type LeafletMapProps = ComponentProps & Dimensions;

export interface LeafletMapState {
    center: LatLngLiteral;
    url?: string;
}

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
        const { allLocations, alertMessage, defaultCenterLatitude, defaultCenterLongitude } = props;
        if (!alertMessage && defaultCenterLatitude && defaultCenterLongitude) {
            this.setState({
                center: {
                    lat: Number(defaultCenterLatitude),
                    lng: Number(defaultCenterLongitude)
                }
            });
        } else if (!alertMessage && allLocations && allLocations.length) {
            this.setState({
                center: {
                    lat: Number(allLocations[0].latitude),
                    lng: Number(allLocations[0].longitude)
                }
            });
        } else {
            this.setState({ center: this.defaultCenterLocation });
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
        const { allLocations } = this.props;
        if (allLocations && allLocations.length) {
            allLocations.forEach(location => {
                if (this.map && this.state.url) {
                    marker([ Number(location.latitude), Number(location.longitude) ])
                    .setIcon(icon({
                        iconUrl: this.state.url,
                        iconSize: [ 38, 95 ],
                        iconAnchor: [ 22, 94 ]
                    }))
                    .bindPopup("Nice Popup")
                    .addTo(this.map);
                } else if (this.map) {
                    marker([ Number(location.latitude), Number(location.longitude) ])
                        .bindPopup("Nice Pop")
                        .addTo(this.map);
                }
            });
            // TODO fix if there are no locations
        } else if (this.state.center && this.map) {
            marker(this.state.center)
                .bindPopup("Nice Pop")
                .addTo(this.map);
        }
    }
}
