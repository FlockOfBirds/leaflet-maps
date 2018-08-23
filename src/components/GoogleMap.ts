import { Component, createElement } from "react";
import * as classNames from "classnames";

import { Alert } from "./Alert";
import googleApiWrapper from "./GoogleApi";
import { Container, MapUtils } from "./Utils/namespace";
import { Shared } from "./Utils/sharedConfigs";
import MapProps = Container.MapProps;
import Location = Container.Location;
import SharedProps = MapUtils.SharedProps;

export type GoogleMapsProps = { scriptsLoaded?: boolean } & SharedProps & MapProps;

export interface GoogleMapState {
    center: google.maps.LatLngLiteral;
    alertMessage?: string;
}

class GoogleMap extends Component<GoogleMapsProps, GoogleMapState> {

    private map!: google.maps.Map;

    private defaultCenterLocation: google.maps.LatLngLiteral = { lat: 51.9107963, lng: 4.4789878 };
    private markers: google.maps.Marker[] = [];
    private bounds?: google.maps.LatLngBounds;

    private googleMapsNode?: HTMLDivElement;
    URL = `https://maps.googleapis.com/maps/api/js?key=${this.props.googleMapsToken}`;
    readonly state: GoogleMapState = { center: this.defaultCenterLocation };

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
                    ref: (leafletNode?: HTMLDivElement) => this.googleMapsNode = leafletNode
                })
            )
        );
    }

    componentWillReceiveProps(nextProps: GoogleMapsProps) {
        if (nextProps.scriptsLoaded) {
            this.initMap(nextProps);
        }
    }

    componentDidMount() {
        if (this.props.scriptsLoaded) {
            this.initMap(this.props);
        }
    }

    componentDidUpdate() {
        if (this.map && !this.props.fetchingData) {
            this.map.setCenter(this.state.center);
        }
    }

    componentWillUnmount() {
        // TODO remove event listeners if any
    }

    private initMap = (props: GoogleMapsProps) => {
        if (this.googleMapsNode) {
            this.map = new google.maps.Map(this.googleMapsNode, {
                zoom: this.props.zoomLevel,
                minZoom: 2,
                maxZoom: 20
            });
        }
        this.setDefaultCenter(props);
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
            setTimeout(() => this.setBounds(this.bounds), 0);
            this.setMapOnMarkers(this.map);
        }
    }

    private setBounds = (mapBounds?: google.maps.LatLngBounds) => {
        if (this.map && mapBounds) {
            try {
                this.map.fitBounds(mapBounds);
            } catch (error) {
                this.setState({ alertMessage: `Failed due to ${error.message}` });
            }
        }
    }

    private setMapOnMarkers = (map?: google.maps.Map) => {
        if (this.markers && this.markers.length && map) {
            this.markers.forEach(marker => marker.setMap(map));
        }
    }
}

export const wrappedGoogleMap = googleApiWrapper(`https://maps.googleapis.com/maps/api/js?key=`)(GoogleMap);
export default wrappedGoogleMap ;
