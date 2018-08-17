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

import { Container } from "./Utils/namespace";
import { Style } from "./Utils/Styles";
import { Alert } from "./Alert";
import MapProps = Container.MapProps;
import Location = Container.Location;
import getDimensions = Style.getDimensions;
import parseStyle = Style.parseStyle;
import customUrls = Style.customUrls;
import mapAttr = Style.mapAttr;

export type LeafletMapProps = {
    allLocations?: Location[];
    className?: string;
    alertMessage?: string;
    fetchingData?: boolean;
    style?: string;
    onClickAction?: (location: Location) => void;
    onClickMarker?: (event: LeafletEvent) => void;
} & MapProps;

export interface LeafletMapState {
    center: LatLngLiteral;
    alertMessage?: string;
}

export class LeafletMap extends Component<LeafletMapProps, LeafletMapState> {
    private leafletNode?: HTMLDivElement;
    private defaultCenterLocation: LatLngLiteral = { lat: 51.9107963, lng: 4.4789878 };
    private map?: Map;

    private markerGroup = new FeatureGroup();

    readonly state: LeafletMapState = {
        center: this.defaultCenterLocation
    };

    render() {
        return createElement("div", {},
            createElement(Alert, {
                bootstrapStyle: "danger",
                className: "widget-leaflet-maps-alert leaflet-control"
            }, this.props.alertMessage || this.state.alertMessage),
            createElement("div",
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
                // Work around for page scroll down to botom on first click on map in Chrome and IE
                // https://github.com/Leaflet/Leaflet/issues/5392
                keyboard: false,
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
        const urlTemplate = this.props.mapProvider === "mapBox"
            ? customUrls.mapbox + this.props.mapBoxAccessToken : customUrls.openStreetMap;
        const mapAttribution = this.props.mapProvider === "mapBox" ? mapAttr.mapboxAttr : mapAttr.openStreetMapAttr;

        return tileLayer(urlTemplate, {
            attribution: mapAttribution,
            id: this.props.mapProvider === "mapBox" ? "mapbox.streets" : undefined
        });
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
        this.markerGroup.clearLayers();
        if (locations && locations.length) {
            locations.forEach(location =>
                this.createMarker(location)
                    .then(marker =>
                        this.markerGroup.addLayer(marker
                            .on("click", event => this.props.onClickMarker ? this.props.onClickMarker(event) : undefined)
                        ))
                    .then(layer =>
                        this.map
                            ? this.map.addLayer(layer)
                            : undefined)
                    .catch(reason =>
                        this.setState({ alertMessage: `${reason}` })));
            this.setBounds();
        } else if (this.map) {
            this.map.removeLayer(this.markerGroup);
        }
    }

    private setBounds = () => {
        setTimeout(() => {
            if (this.map) {
                try {
                    this.map.fitBounds(this.markerGroup.getBounds(), { animate: false }).invalidateSize();
                } catch (error) {
                    this.setState({ alertMessage: `Failed due to ${error.message}` });
                }
                if (!this.props.autoZoom) {
                    this.map.setZoom(this.props.zoomLevel, { animate: false });
                }
            }
        }, 0);
    }

    private createMarker = <T extends Location>(location: T): Promise<Marker> =>
        new Promise((resolve, reject) => {
            const { latitude, longitude, url } = location;
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
            } else if (!url) {
                resolve(new Marker([
                    Number(latitude),
                    Number(longitude)
                ]));
            } else {
                reject("Failed to create Marker");
            }
        })
}
