import { Component, createElement } from "react";
import * as classNames from "classnames";

import { Alert } from "./Alert";
import { Container, MapUtils } from "./Utils/namespace";
import { Shared } from "./Utils/sharedConfigs";
import MapProps = Container.MapProps;
import Location = Container.Location;
import SharedProps = MapUtils.SharedProps;

type GoogleMapsProps = SharedProps & MapProps;

export interface GoogleMapState {
    isLoaded: boolean;
    center: google.maps.LatLngLiteral;
    alertMessage?: string;
}

export class GoogleMap extends Component<GoogleMapsProps, GoogleMapState> {

    private map!: google.maps.Map;

    private defaultCenterLocation: google.maps.LatLngLiteral = { lat: 51.9107963, lng: 4.4789878 };
    private markers: google.maps.Marker[] = [];
    private bounds?: google.maps.LatLngBounds;

    private leafletNode?: HTMLDivElement;
    URL = `https://maps.googleapis.com/maps/api/js?key=${this.props.googleMapsToken}`;
    readonly state: GoogleMapState = { isLoaded: false, center: this.defaultCenterLocation };

    render() {
        return createElement("div", {},
            createElement(Alert, {
                bootstrapStyle: "danger",
                className: "widget-google-maps-alert"
            }, this.props.alertMessage || this.state.alertMessage),
            createElement("div",
                {
                    className: classNames("widget-google-maps-wrapper", this.props.className),
                    style: { ...this.props.style , ...Shared.getDimensions(this.props) }
                },
                createElement("div", {
                    className: "widget-google-maps",
                    ref: (leafletNode?: HTMLDivElement) => this.leafletNode = leafletNode
                })
            )
        );
    }

    componentWillReceiveProps(newProps: GoogleMapsProps) {
        this.setDefaultCenter(newProps);
    }

    componentDidMount() {
        this.loadGoogleScript();
    }

    componentDidUpdate() {
        if (this.map && !this.props.fetchingData) {
            this.map.setCenter(this.state.center);
        }
    }

    componentWillUnmount() {
        // TODO remove event listeners if any
    }

    private loadGoogleScript = () => {
        if (!document.querySelectorAll(`[src="${this.URL}"]`).length) {
            document.body.appendChild(Object.assign(
                document.createElement("script"), {
                    type: "text/javascript",
                    src: this.URL,
                    onload: () => this.initMap(),
                    onerror: () => this.setState({ alertMessage: "Could not load. Please check your internet connection" })
                }));
        }
    }

    private initMap = () => {
        if (this.leafletNode) {
            this.map = new google.maps.Map(this.leafletNode, {
                zoom: this.props.zoomLevel
            });
        }
    }

    private setDefaultCenter = (props: GoogleMapsProps) => {
        const { defaultCenterLatitude, defaultCenterLongitude, fetchingData } = props;
        if (this.map) {
            if (defaultCenterLatitude && defaultCenterLongitude) {
                this.setState({
                    center: {
                        lat: Number(defaultCenterLatitude),
                        lng: Number(props.defaultCenterLongitude)
                    }
                });
            } else if (!fetchingData) {
                this.addMarkers(props.allLocations);
            }
        }
    }

    private addMarkers = (mapLocations?: Location[]) => {
        this.markers = [];
        if (mapLocations && mapLocations.length) {
            this.bounds = new google.maps.LatLngBounds();
            mapLocations.forEach(location => {
                const marker = new google.maps.Marker({
                    position: { lat: Number(location.latitude), lng: Number(location.longitude) },
                    icon: location.url ? location.url : undefined
                });
                if (this.bounds) {
                    this.bounds.extend({ lat : Number(location.latitude), lng: Number(location.longitude) });
                }
                this.markers.push(marker);
            });
            this.map.fitBounds(this.bounds);
            this.setMapOnMarkers(this.map);
        }
    }

    private setMapOnMarkers = (map?: google.maps.Map) => {
        if (this.markers && this.markers.length && map) {
            this.markers.forEach(marker => marker.setMap(map));
        }
    }
}
