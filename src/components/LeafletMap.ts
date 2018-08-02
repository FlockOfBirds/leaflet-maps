import { Component, createElement } from "react";
import {
    FeatureGroup,
    LatLngLiteral,
    LeafletEvent,
    Map,
    Marker,
    icon,
    tileLayer
} from "leaflet";
import * as classNames from "classnames";

import { Container } from "./Utils/ContainerUtils";
import { Style } from "./Utils/Styles";
import { Alert } from "./Alert";
import LeafletMapsContainerProps = Container.LeafletMapsContainerProps;
import Location = Container.Location;
// import mapProvider = Container.mapProviders;
import Dimensions = Style.Dimensions;
import getDimensions = Style.getDimensions;
import parseStyle = Style.parseStyle;

type ComponentProps = {
    allLocations?: Location[];
    className?: string;
    alertMessage?: string;
    onClickAction?: (location: Location) => void;
} & LeafletMapsContainerProps;

export type LeafletMapProps = ComponentProps & Dimensions;

export interface LeafletMapState {
    center: LatLngLiteral;
    alertMessage?: string;
    isLoading?: boolean;
}

export class LeafletMap extends Component<LeafletMapProps, LeafletMapState> {
    private leafletNode?: HTMLDivElement;
    private defaultCenterLocation: LatLngLiteral = { lat: 51.9107963, lng: 4.4789878 };

    private customMapTypeUrl = `//{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`;
    private mapAttribution = `&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors`;
    private map?: Map;

    private markerGroup = new FeatureGroup();

    readonly state: LeafletMapState = {
        center: { lat: 0, lng: 0 },
        alertMessage: "",
        isLoading: true
    };

    render() {
        return createElement("div",
            {
                className: classNames("widget-leaflet-maps-wrapper", this.props.className),
                style: { ...getDimensions(this.props), ...parseStyle(this.props.style) }
            },
            createElement(Alert, {
                bootstrapStyle: "danger",
                className: "widget-leaflet-maps-alert leaflet-control",
                message: this.state.alertMessage || this.props.alertMessage
            }),
            createElement("div", {
                className: "widget-leaflet-maps",
                ref: (leafletNode?: HTMLDivElement) => this.leafletNode = leafletNode
            }
        ));
    }

    componentWillReceiveProps(newProps: LeafletMapProps) {
        if (newProps) {
            this.renderMarkers(newProps);
        }
    }

    componentDidMount() {
        if (this.leafletNode) {
            this.map = new Map(this.leafletNode);
            this.setLayer(this.customMapTypeUrl, this.map, this.mapAttribution);
        }
    }

    componentDidUpdate(prevProps: LeafletMapProps, prevState: LeafletMapState) {
        if (this.state !== prevState && this.props !== prevProps && this.map) {
            this.renderLeafletMap(this.state.center, this.map);
        }
    }

    componentWillUnmount() {
        if (this.map) {
            this.map.remove();
        }
    }

    private renderLeafletMap = (coordinates: LatLngLiteral, map: Map) =>
        map.panTo(coordinates).setMinZoom(2)

    private setLayer = (urlTemplate: string, map: Map, mapAttribution?: string) =>
        map.addLayer(tileLayer(urlTemplate, { attribution: mapAttribution }))

    private renderMarkers = (props: LeafletMapProps) => {
        const { allLocations } = props;
        if (this.markerGroup) {
            this.markerGroup.clearLayers();
            if (allLocations && allLocations.length) {
                allLocations.forEach(location =>
                    this.createMarker(location)
                        .then(marker =>
                            this.markerGroup.addLayer(
                                marker.on("click", event =>
                                    this.markerOnClick(event))
                                ))
                        .then(
                            layer =>
                                this.map
                                    ? this.map.addLayer(layer)
                                    : undefined)
                        .then(
                            map =>
                                map ? map.fitBounds(
                                        this.markerGroup.getBounds())
                                    : undefined) // Custom zoom won't work for multiple locations
                        .catch(
                            reason =>
                                !this.state.alertMessage
                                    ? this.setState({ alertMessage: `${reason}` })
                                    : this.setState({ alertMessage: "" }))
                );
            } else if (this.map) {
                this.map.removeLayer(this.markerGroup);
            }
        }
        this.setDefaultCenter(props);
    }

    private setDefaultCenter = (props: LeafletMapProps) => {
        const { allLocations, defaultCenterLatitude, defaultCenterLongitude } = props;
        this.setZoom(props);
        if (defaultCenterLatitude && defaultCenterLongitude) {
            this.setState({
                center: {
                    lat: Number(defaultCenterLatitude),
                    lng: Number(defaultCenterLongitude)
                }
            });
        } else if (allLocations && allLocations.length === 0) {
            this.setState({ center: this.defaultCenterLocation });
        }
    }

    private setZoom = (props: LeafletMapProps) => {
        const { zoomLevel, autoZoom } = props;
        if (this.map) {
            let zoom = this.map.getZoom();
            if (autoZoom) {
                if ((zoom && zoom < 2) || !zoom) {
                    zoom = 2;
                }
            } else {
                zoom = zoomLevel;
            }
            this.map.setZoom(zoom);
        }
    }

    private createMarker = (location: Location): Promise<Marker> =>
        new Promise((resolve, reject) => {
            const { latitude, longitude, url } = location;
            if (this.validLocation(location)) {
                this.setState({ alertMessage: "" });
                if (url) {
                    resolve(
                        new Marker([
                            Number(latitude),
                            Number(longitude)
                        ]).setIcon(icon({
                            iconUrl: url,
                            iconSize: [ 38, 95 ],
                            iconAnchor: [ 22, 94 ]
                        }))
                    );
                } else {
                    resolve(new Marker([
                        Number(latitude),
                        Number(longitude)
                    ]));
                }
            } else if (!this.validLocation(location)) {
                reject("Invalid Coordinates were passed");
            }
        })

    private validLocation(location: Location): boolean {
        const { latitude: lat, longitude: lng } = location;

        return typeof lat === "number" && typeof lng === "number"
            && lat <= 90 && lat >= -90
            && lng <= 180 && lng >= -180
            && !(lat === 0 && lng === 0);
    }

    private markerOnClick = (e: LeafletEvent) => {
        const { onClickAction, allLocations } = this.props;
        if (onClickAction && allLocations) {
            onClickAction(allLocations[allLocations.findIndex(targetLoc => targetLoc.latitude === e.target.getLatLng().lat)]);
        }
    }
}
