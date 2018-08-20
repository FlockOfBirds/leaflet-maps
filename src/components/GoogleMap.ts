import { CSSProperties, Component, createElement } from "react";
import * as classNames from "classnames";
// @ts-ignore
import { } from "@types/googlemaps";

import { Alert } from "./Alert";
import { Container, MapUtils } from "./Utils/namespace";
import MapProps = Container.MapProps;
import Dimensions = MapUtils.Dimensions;

export type GoogleMapsProps = {
    alertMessage?: string;
    style?: object;
    className?: string;
} & MapProps;

export interface GoogleMapState {
    isLoaded: boolean;
}

export class GoogleMap extends Component<GoogleMapsProps, GoogleMapState> {

    private map!: google.maps.Map;

    private defaultCenterLocation: google.maps.LatLngLiteral = { lat: 51.9107963, lng: 4.4789878 };

    private leafletNode?: HTMLDivElement;
    URL = `https://maps.googleapis.com/maps/api/js?key=${this.props.googleMapsToken}`;
    readonly state: GoogleMapState = { isLoaded: false };

    render() {
        return createElement("div", {},
            createElement(Alert, {
                bootstrapStyle: "danger",
                className: "widget-google-maps-alert"
            }, this.props.alertMessage),
            createElement("div",
                {
                    className: classNames("widget-google-maps-wrapper", this.props.className),
                    style: { ...this.props.style , ...this.getDimensions(this.props) }
                },
                createElement("div", {
                    className: "widget-google-maps",
                    ref: (leafletNode?: HTMLDivElement) => this.leafletNode = leafletNode
                })
            )
        );
    }

    componentDidMount() {
        if (!this.state.isLoaded) {
            this.loadGoogleScript();
        }
    }

    componentDidUpdate() {
        this.renderMarkers();
    }

    componentWillUnmount() {
        // TODO remove event listeners if any
    }

    private loadGoogleScript = () => {
        const script = document.createElement("script");
        script.src = this.URL;
        script.onload = () => {
            this.setState({ isLoaded: true });
            this.loadMap();
        };
        script.onerror = () => {
            mx.ui.error("Could not load Google Maps script. Please check your internet connection");
        };
        document.body.appendChild(script);
    }

    private loadMap = () => {
        const mapOptions: google.maps.MapOptions = {
            zoom: this.props.zoomLevel
        };

        this.map = new google.maps.Map(this.leafletNode as HTMLDivElement, mapOptions);

        if (this.map) {
            this.map.setCenter(this.defaultCenterLocation);
        }
    }

    private renderMarkers = () => {
        if (this.state.isLoaded) {
            const marker = new google.maps.Marker({
                position: this.defaultCenterLocation,
                map: this.map
            });

            return marker;
        }
    }

    private getDimensions = <T extends Dimensions>(props: T): CSSProperties => {
        const style: CSSProperties = {
            width: props.widthUnit === "percentage" ? `${props.width}%` : `${props.width}px`
        };
        if (props.heightUnit === "percentageOfWidth") {
            style.paddingBottom = props.widthUnit === "percentage"
                ? `${props.height}%`
                : `${props.width / 2}px`;
        } else if (props.heightUnit === "pixels") {
            style.height = `${props.height}px`;
        } else if (props.heightUnit === "percentageOfParent") {
            style.height = `${props.height}%`;
        }

        return style;
    }
}
