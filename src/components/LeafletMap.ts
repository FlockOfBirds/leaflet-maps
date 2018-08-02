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

    readonly CUSTOMTYPEURLS = {
        openStreetMap: `//{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`,
        mapbox: `//api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=${this.props.mapBoxAccessToken}`
    };

    readonly MAPATTRIBUTIONS = {
        openStreetMapAttr: `&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors`,
        mapboxAttr: `Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>`
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
            this.setState({ locations: newProps.allLocations });
        }
    }

    componentDidMount() {
        if (this.leafletNode) {
            this.map = new Map(this.leafletNode, {
                scrollWheelZoom: this.props.optionScroll,
                zoomControl: this.props.optionZoomControl,
                attributionControl: this.props.attributionControl,
                minZoom: 2,
                maxZoom: 20,
                dragging: this.props.optionDrag
            });
            this.map.addLayer(this.setLayer());
        }
    }

    componentDidUpdate(prevProps: LeafletMapProps, prevState: LeafletMapState) {
        if (this.state.locations !== prevState.locations && this.props !== prevProps) {
            this.renderLeafletMap(this.state.center);
        }
    }

    componentWillUnmount() {
        if (this.map) {
            this.map.remove();
        }
    }

    private renderLeafletMap = (coordinates: LatLngLiteral) => {
        if (this.map) {
            this.map.panTo(coordinates);
            this.renderMarkers();
        }
    }

    private setLayer = () => {
        if (this.props.mapProvider === "openStreet") {
            return tileLayer(this.CUSTOMTYPEURLS.openStreetMap, {
                attribution: this.MAPATTRIBUTIONS.openStreetMapAttr
            });
        } else if (this.props.mapProvider === "mapBox") {
            return tileLayer(this.CUSTOMTYPEURLS.mapbox, {
                attribution: this.MAPATTRIBUTIONS.mapboxAttr,
                id: "mapbox.streets"
            });
        } else {
            return tileLayer(this.CUSTOMTYPEURLS.openStreetMap);
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
                        .then(map =>
                                map
                                ? map.fitBounds(this.markerGroup.getBounds()).setMaxZoom(15)
                                : undefined) // Custom zoom won't work for multiple locations
                        .catch(reason =>
                                this.setState({ alertMessage: `${reason}` }))
                );
            } else if (this.map) {
                this.map.removeLayer(this.markerGroup);
            }
        }
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
