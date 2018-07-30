import { Component, createElement } from "react";
import {
    FeatureGroup,
    // LatLng,
    LatLngBounds,
    LatLngLiteral,
    Map,
    Marker,
    icon,
    // marker,
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
} & LeafletMapsContainerProps;

export type LeafletMapProps = ComponentProps & Dimensions;

export interface LeafletMapState {
    center: LatLngLiteral;
    locations?: Location[];
    alertMessage?: string;
    zoomValue?: number;
    isLoading?: boolean;
}

export class LeafletMap extends Component<LeafletMapProps, LeafletMapState> {
    private leafletNode?: HTMLDivElement;
    private defaultCenterLocation: LatLngLiteral = { lat: 51.9107963, lng: 4.4789878 };

    private customMapTypeUrl = `//{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`;
    private mapAttribution = `&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors`;
    private map?: Map;

    private markerGroup = new FeatureGroup();
    private markers: Marker[] = [];
    private bounds!: LatLngBounds;

    readonly state: LeafletMapState = {
        center: { lat: 0, lng: 0 },
        locations: this.props.allLocations,
        alertMessage: "",
        zoomValue: this.props.zoomLevel,
        isLoading: true
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
                message: this.props.alertMessage || this.state.alertMessage
            }),
            createElement("div", {
                className: "widget-leaflet-maps",
                ref: (leafletNode?: HTMLDivElement) => this.leafletNode = leafletNode
            }
        ));
    }

    componentWillReceiveProps(newProps: LeafletMapProps) {
        if (newProps) {
            this.setState({ locations: newProps.allLocations });
            this.setDefaultCenter(newProps);
        }
    }

    componentDidMount() {
        if (this.leafletNode) {
            this.map = new Map(this.leafletNode);
            this.setLayer(this.customMapTypeUrl, this.mapAttribution);
        }
    }

    componentDidUpdate(prevProps: LeafletMapProps, prevState: LeafletMapState) {
        if (prevState !== this.state && prevProps !== this.props) {
            this.renderLeafletMap(this.state.center, Number(this.state.zoomValue));
        }
    }

    componentWillUnmount() {
        if (this.map) {
            this.map.remove();
        }
    }

    private setDefaultCenter = (props: LeafletMapProps) => {
        const { defaultCenterLatitude, defaultCenterLongitude, allLocations } = props;
        if (defaultCenterLatitude && defaultCenterLongitude) {
            this.setState({
                center: {
                    lat: Number(defaultCenterLatitude),
                    lng: Number(defaultCenterLongitude)
                }
            });
        } else if (allLocations && allLocations.length === 1) {
            this.setState({
                center: {
                    lat: allLocations[0].latitude as number,
                    lng: allLocations[0].longitude as number
                }
            });
        } else if (allLocations && allLocations.length === 0) {
            this.setState({ center: this.defaultCenterLocation });
        }
    }
    private renderLeafletMap = (coordinates: LatLngLiteral, zoomValue: number) => {
        if (this.map) {
            this.map.setView(coordinates, zoomValue);
            this.createMarker();
        }
    }

    private setLayer = (urlTemplate: string, mapAttribution?: string) => {
        if (this.map) {
            this.map.addLayer(tileLayer(urlTemplate, { attribution: mapAttribution }));
        }
    }

    private updateBounds = (markerGroup: FeatureGroup) => {
        if (this.map) {
            this.bounds = new LatLngBounds({ lat: 0, lng: 0 }, { lat: 0, lng: 0 });
            this.map.fitBounds(markerGroup.getBounds());
            this.setZoom(this.props);
            this.setState({
                center: {
                    lat: this.bounds.getCenter().lat,
                    lng: this.bounds.getCenter().lng,
                    zoom: this.map.getZoom()
                }
            });
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

    private createMarker = () => {
        const { locations } = this.state;
        if (this.map && this.markerGroup) {
            if (locations && locations.length) {
                this.markers.forEach(marker => this.markerGroup.removeLayer(marker));
                this.markers = [];
                locations.forEach((location) => {
                    const { latitude, longitude, url } = location;
                    if (this.validLocation(location)) {
                        if (url) {
                            this.markers.push(new Marker([
                                Number(latitude),
                                Number(longitude)
                            ])
                                .setIcon(icon({
                                    iconUrl: url,
                                    iconSize: [ 38, 95 ],
                                    iconAnchor: [ 22, 94 ]
                                })));
                        } else {
                            this.markers.push(new Marker([
                                Number(location.latitude),
                                Number(location.longitude)
                            ]));
                        }
                    } else {
                        this.setState({ alertMessage: "Invalid Location Coordinates" });
                    }
                });
                this.markers.forEach(marker => this.markerGroup.addLayer(marker));
                this.map.addLayer(this.markerGroup);
                this.updateBounds(this.markerGroup);
            } else {
                this.map.removeLayer(this.markerGroup);
            }
        }
    }

    private validLocation(location: Location): boolean {
        const { latitude: lat, longitude: lng } = location;

        return typeof lat === "number" && typeof lng === "number"
            && lat <= 90 && lat >= -90
            && lng <= 180 && lng >= -180
            && !(lat === 0 && lng === 0);
    }
}
