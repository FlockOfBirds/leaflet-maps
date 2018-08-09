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
import { MapUtils, Style } from "./Utils/Styles";
import { Alert } from "./Alert";
import LeafletMapsContainerProps = Container.LeafletMapsContainerProps;
import Location = Container.Location;
import Dimensions = Style.Dimensions;
import getDimensions = Style.getDimensions;
import parseStyle = Style.parseStyle;
import customUrls = MapUtils.customUrls;
import mapAttr = MapUtils.mapAttr;

type ComponentProps = {
    allLocations?: Location[];
    className?: string;
    alertMessage?: string;
    fetchingData?: boolean;
    onClickAction?: (location: Location) => void;
} & LeafletMapsContainerProps;

export type LeafletMapProps = ComponentProps & Dimensions;

export interface LeafletMapState {
    center: LatLngLiteral;
    alertMessage?: string;
    locations?: Location[];
}

export class LeafletMap extends Component<LeafletMapProps, LeafletMapState> {
    private leafletNode?: HTMLDivElement;
    private defaultCenterLocation: LatLngLiteral = { lat: 51.9107963, lng: 4.4789878 };
    private map?: Map;

    private markerGroup = new FeatureGroup();

    readonly state: LeafletMapState = {
        center: this.defaultCenterLocation,
        alertMessage: "",
        locations: []
    };

    render() {
        return createElement("div", {},
            createElement(Alert, {
                bootstrapStyle: "danger",
                className: "widget-leaflet-maps-alert leaflet-control",
                message: this.state.alertMessage || this.props.alertMessage
            }), createElement("div",
                {
                    className: classNames("widget-leaflet-maps-wrapper", this.props.className),
                    style: { ...getDimensions(this.props), ...parseStyle(this.props.style) }
                },
                createElement("div", {
                    className: "widget-leaflet-maps",
                    ref: (leafletNode?: HTMLDivElement) => this.leafletNode = leafletNode
                }
                )));
    }

    componentWillReceiveProps(newProps: LeafletMapProps) {
        this.setDefaultCenter(newProps);
    }

    componentDidMount() {
        if (this.leafletNode) {
            this.map = new Map(this.leafletNode, {
                scrollWheelZoom: this.props.optionScroll,
                zoomControl: this.props.optionZoomControl,
                attributionControl: this.props.attributionControl,
                zoom: this.props.zoomLevel,
                minZoom: 2,
                dragging: this.props.optionDrag
            }).addLayer(this.setTileLayer());
        }
    }

    componentDidUpdate() {
        if (this.map && !this.props.fetchingData) {
            this.map.panTo(this.state.center);
        }
    }

    componentWillUnmount() {
        if (this.map) {
            this.map.remove();
        }
    }

    private setTileLayer = () => {
        if (this.props.mapProvider === "openStreet") {
            return tileLayer(customUrls.openStreetMap, {
                attribution: mapAttr.openStreetMapAttr
            });
        } else if (this.props.mapProvider === "mapBox") {
            return tileLayer(customUrls.mapbox + this.props.mapBoxAccessToken, {
                attribution: mapAttr.mapboxAttr,
                id: "mapbox.streets"
            });
        } else {
            return tileLayer(customUrls.openStreetMap);
        }
    }

    private setDefaultCenter = (props: LeafletMapProps) => {
        const { defaultCenterLatitude, defaultCenterLongitude } = props;
        if (defaultCenterLatitude && defaultCenterLongitude) {
            this.setState({
                center: {
                    lat: Number(defaultCenterLatitude),
                    lng: Number(props.defaultCenterLongitude)
                }
            });
        } else if (!props.fetchingData) {
            this.renderMarkers(props.allLocations);
        }
    }

    private renderMarkers = <T extends Location>(locations?: T[]) => {
        if (this.markerGroup) {
            this.markerGroup.clearLayers();
            if (locations && locations.length) {
                locations.forEach(location =>
                    this.createMarker(location)
                        .then(marker =>
                            this.markerGroup.addLayer(marker
                                .on("click", event => this.markerOnClick(event))
                            ))
                        .then(layer =>
                            this.map
                                ? this.map.addLayer(layer)
                                : undefined)
                        .catch(reason =>
                            this.setState({ alertMessage: `${reason}` }))
                );
                setTimeout(() => (this.map ? this.map.fitBounds(this.markerGroup.getBounds()).invalidateSize() : undefined), 0);
            } else if (this.map) {
                this.map.removeLayer(this.markerGroup);
            }
        }
    }

    private createMarker = <T extends Location>(location: T): Promise<Marker> =>
        new Promise((resolve, reject) => {
            const { latitude, longitude, url } = location;
            if (this.validLocation(location)) {
                if (url) {
                    resolve(
                        new Marker([
                            Number(latitude),
                            Number(longitude)
                        ]).setIcon(icon({
                            iconUrl: url,
                            iconSize: [ 38, 95 ],
                            iconAnchor: [ 22, 94 ],
                            className: "marker"
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

    private markerOnClick = (event: LeafletEvent) => {
        const { onClickAction, allLocations } = this.props;
        if (onClickAction && allLocations) {
            onClickAction(allLocations[allLocations.findIndex(targetLoc => targetLoc.latitude === event.target.getLatLng().lat)]);
        }
    }
}
