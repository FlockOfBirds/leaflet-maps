import { Component, createElement } from "react";
import * as classNames from "classnames";

import { Alert } from "./Alert";
import googleApiWrapper from "./GoogleApi";
import { Container, MapUtils } from "./Utils/namespace";
import { Shared } from "./Utils/sharedConfigs";
import MapProps = Container.MapProps;
import Location = Container.Location;
import SharedProps = MapUtils.SharedProps;

export type GoogleMapsProps = {
    scriptsLoaded?: boolean,
    onClickMarker?: (event: Event | google.maps.MouseEvent) => void
} & SharedProps & MapProps;

export interface GoogleMapState {
    center: google.maps.LatLngLiteral;
    alertMessage?: string;
}

class GoogleMap extends Component<GoogleMapsProps, GoogleMapState> {

    private map!: google.maps.Map;

    private defaultCenterLocation: google.maps.LatLngLiteral = { lat: 51.9107963, lng: 4.4789878 };
    private markers: google.maps.Marker[] = [];
    private bounds!: google.maps.LatLngBounds;

    private googleMapsNode?: HTMLDivElement;
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
                zoomControl: this.props.optionZoomControl,
                scrollwheel: this.props.optionScroll,
                draggable: this.props.optionDrag,
                streetViewControl: this.props.optionStreetView,
                mapTypeControl: this.props.mapTypeControl,
                fullscreenControl: this.props.fullScreenControl,
                rotateControl: this.props.rotateControl,
                styles: this.getMapsStyles(),
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
                        lng: Number(defaultCenterLongitude)
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
                this.bounds.extend({
                    lat: Number(location.latitude),
                    lng: Number(location.longitude)
                });
                const marker = new google.maps.Marker({
                    position: {
                        lat: Number(location.latitude),
                        lng: Number(location.longitude)
                    },
                    icon: location.url ? location.url : undefined
                });
                marker.addListener("click", (event: any) => {
                    if (this.props.onClickMarker) {
                        this.props.onClickMarker(event);
                    }
                });
                this.markers.push(marker);
            });
            this.setMapOnMarkers(this.map);
            this.setBounds(this.bounds);
        }
    }

    private setBounds = (mapBounds?: google.maps.LatLngBounds) => {
        setTimeout(() => {
            if (mapBounds && this.map) {
                try {
                    this.map.fitBounds(mapBounds);
                    if (!this.props.autoZoom) {
                        this.map.setZoom(this.props.zoomLevel);
                    }
                } catch (error) {
                    this.setState({ alertMessage: `Failed due to ${error.message}` });
                }
            }
        }, 0);
    }

    private setMapOnMarkers = (map?: google.maps.Map) => {
        if (this.markers && this.markers.length && map) {
            this.markers.forEach(marker => marker.setMap(map));
        }
    }

    private getMapsStyles(): google.maps.MapTypeStyle[] {
        if (this.props.mapStyles && this.props.mapStyles.trim()) {
            try {
                return JSON.parse(this.props.mapStyles);
            } catch (error) {
                this.setState({ alertMessage: `invalid Maps styles, ${error}` });
            }
        }

        return [ {
            featureType: "poi",
            elementType: "labels",
            stylers: [ { visibility: "off" } ]
        } ];
    }

}

export default googleApiWrapper(`https://maps.googleapis.com/maps/api/js?key=`)(GoogleMap);
