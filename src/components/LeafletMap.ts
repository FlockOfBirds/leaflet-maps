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
    onClickAction?: (location: Location) => void;
} & LeafletMapsContainerProps;

export type LeafletMapProps = ComponentProps & Dimensions;

export interface LeafletMapState {
    center: LatLngLiteral;
    alertMessage?: string;
    locations?: Location[];
    isLoading?: boolean;
}

export class LeafletMap extends Component<LeafletMapProps, LeafletMapState> {
    private leafletNode?: HTMLDivElement;
    private defaultCenterLocation: LatLngLiteral = { lat: 51.9107963, lng: 4.4789878 };
    private map?: Map;

    private markerGroup = new FeatureGroup();

    readonly state: LeafletMapState = {
        center: { lat: 0, lng: 0 },
        alertMessage: "",
        locations: [],
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
            this.setDefaultCenter(newProps);
        }
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
            });
        }
    }

    componentDidUpdate(prevProps: LeafletMapProps, prevState: LeafletMapState) {
        if (this.state.locations !== prevState.locations || this.props.allLocations !== prevProps.allLocations) {
            this.renderLeafletMap();
        }
    }

    componentWillUnmount() {
        if (this.map) {
            this.map.remove();
        }
    }

    private renderLeafletMap = () => {
        if (this.map) {
            if (this.state.center) {
                this.map.panTo(this.state.center);
            }
            this.map.addLayer(this.setTileLayer());
            this.renderMarkers();
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

    private renderMarkers = () => {
        const { locations } = this.state;
        if (this.markerGroup) {
            this.markerGroup.clearLayers();
            if (locations && locations.length) {
                locations.forEach(location =>
                    this.createMarker(location)
                        .then(marker =>
                            this.markerGroup.addLayer(
                                marker.on("click", event =>
                                    this.markerOnClick(event))
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

    private setDefaultCenter = (props: LeafletMapProps) => {
        const { allLocations, defaultCenterLatitude, defaultCenterLongitude } = props;
        if (!(allLocations && allLocations.length)) {
            this.setState({
                center: this.defaultCenterLocation,
                locations: allLocations
            });
        } else if (defaultCenterLatitude && defaultCenterLongitude) {
            this.setState({
                locations: [ {
                    latitude: Number(defaultCenterLatitude),
                    longitude: Number(props.defaultCenterLongitude)
                } ]
            });
        } else if (props.allLocations && props.allLocations.length) {
            this.setState({ locations: props.allLocations });
        }
    }

    private createMarker = (location: Location): Promise<Marker> =>
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
