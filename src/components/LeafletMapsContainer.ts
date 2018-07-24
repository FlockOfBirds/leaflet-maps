import { Component, createElement } from "react";
import merge from "deepmerge";

import { LeafletMap } from "./LeafletMap";
import { Container } from "./Utils/ContainerUtils";
import { fetchData } from "./Utils/Data";
import LeafletMapsContainerProps = Container.LeafletMapsContainerProps;
import parseStaticLocations = Container.parseStaticLocations;
import Location = Container.Location;
import getStaticMarkerUrl = Container.getStaticMarkerUrl;

import "leaflet/dist/leaflet.css";
// Re-uses images from ~leaflet package
// Use workarount for marker icon, that is not standard compatible with webpack
// https://github.com/ghybs/leaflet-defaulticon-compatibility#readme
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.webpack.css";
import "leaflet-defaulticon-compatibility";
import "./ui/LeafletMaps.css";

export interface LeafletMapsContainerState {
    alertMessage?: string;
    locations: Location[];
    markerImageUrl: string;
}

export default class LeafletMapsContainer extends Component<LeafletMapsContainerProps, LeafletMapsContainerState> {
    private subscriptionHandles: number[] = [];
    readonly state: LeafletMapsContainerState = {
        alertMessage: "",
        locations: [],
        markerImageUrl: ""
    };

    render() {
        // TODO should render alert and map
        return createElement(LeafletMap, {
            allLocations: this.state.locations,
            className: this.props.class,
            alertMessage: this.state.alertMessage,
            ...this.props as LeafletMapsContainerProps
        });
    }

    componentWillReceiveProps(nextProps: LeafletMapsContainerProps) {
        if (nextProps && nextProps.mxObject) {
            this.resetSubscriptions(nextProps.mxObject);
            this.fetchData(nextProps.mxObject);
            this.getMarkerObjectUrl(nextProps.mxObject);
        }
    }

    componentWillUnmount() {
        this.unsubscribeAll();
    }

    // TODO fix any, funny...
    // we only need the first one, or should we support it???. show error when there is more than only when type is note static.
    private getLocations = (props: LeafletMapsContainerProps): any[] => {
        return merge.all(props.locations.map(locationAttr => [
            locationAttr.latitudeAttribute,
            locationAttr.longitudeAttribute,
            locationAttr.staticMarkerIcon
        ]));
    }

    private resetSubscriptions(contextObject?: mendix.lib.MxObject) {
        this.unsubscribeAll();
        if (contextObject) {
            this.subscriptionHandles.push(mx.data.subscribe({
                callback: () => this.fetchData(contextObject),
                guid: contextObject.getGuid()
            }));
            // HEUH???? Time, what opject what attribute(s) data type, optional......
            // TODO only subscribe to the attribtues when they are comming from Data source context
            if (this.props.locations && this.props.locations.length) {
                this.getLocations(this.props).forEach(
                    (attr: string): number => this.subscriptionHandles.push(mx.data.subscribe({
                        attr,
                        callback: () => this.fetchData(contextObject),
                        guid: contextObject.getGuid()
                    }))
                );
            }
        }
    }

    private unsubscribeAll() {
        this.subscriptionHandles.map(mx.data.unsubscribe);
        this.subscriptionHandles = [];
    }

    private fetchData = (contextObject?: mendix.lib.MxObject) => {
        const guid = contextObject ? contextObject.getGuid() : "";
        const { dataSourceType } = this.props;
        this.props.locations.map(locations => {
            if (this.props.dataSourceType === "static") {
                this.setState({ locations: parseStaticLocations(this.props) });
            } else {
                fetchData({
                    guid,
                    type: dataSourceType,
                    entity: locations.locationsEntity,
                    constraint: locations.entityConstraint,
                    microflow: locations.dataSourceMicroflow,
                    nanoflow: locations.dataSourceNanoflow
                })
                .then(this.setLocationsFromMxObjects)
                .catch(reason => {
                    this.setState({
                        alertMessage: `Failed because of ${reason}`,
                        locations: []
                    });
                });
            }
        });
    }
    private setLocationsFromMxObjects = (mxObjects: mendix.lib.MxObject[]) => {
        this.props.locations.map(locationAttr => {
            const locations = mxObjects.map(mxObject => {
                const lat = mxObject.get(locationAttr.latitudeAttribute as string);
                const lng = mxObject.get(locationAttr.longitudeAttribute as string);

                return {
                    latitude: lat ? Number(lat) : undefined,
                    longitude: lng ? Number(lng) : undefined,
                    url: this.state.markerImageUrl ? this.state.markerImageUrl : ""
                };
            });
            // TODO subscribve to loaction attributes....

            this.setState({ locations });
        });
    }

    private getMarkerObjectUrl = (mxObject: mendix.lib.MxObject) => {
        this.props.locations.map(location => {
            if (location && location.markerImage === "staticImage" && location.staticMarkerIcon) {
                const url = getStaticMarkerUrl(location.staticMarkerIcon);
                this.setState({ markerImageUrl: url });
            } else if (location && location.markerImage === "systemImage") {
                const url = mx.data.getDocumentUrl(mxObject.getGuid(), mxObject.get("changedDate") as number);
                mx.data.getImageUrl(url,
                    objectUrl => {
                        this.setState({ markerImageUrl: objectUrl });
                    },
                    error => this.setState({
                        alertMessage: `Error while retrieving the image url: ${error.message}`
                    })
                );
            } else if (location && location.markerImage === "defaultMarkerIcon") {
                this.setState({ markerImageUrl: "" });
            }
        });
    }
}
