import { Component, createElement } from "react";

import { LeafletMap } from "./LeafletMap";
import { Container } from "./Utils/ContainerUtils";
import { fetchData, fetchMarkerObjectUrl, parseStaticLocations, validLocation, validateLocationProps } from "./Utils/Data";
import LeafletMapsContainerProps = Container.LeafletMapsContainerProps;
import Location = Container.Location;

import "leaflet/dist/leaflet.css";
// Re-uses images from ~leaflet package
// Use workaround for marker icon, that is not standard compatible with webpack
// https://github.com/ghybs/leaflet-defaulticon-compatibility#readme
import "leaflet-defaulticon-compatibility";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.webpack.css";
import "./ui/LeafletMaps.css";

export interface LeafletMapsContainerState {
    alertMessage?: string;
    locations: Location[];
    markerImageUrl: string;
    isFetchingData?: boolean;
}

export default class LeafletMapsContainer extends Component<LeafletMapsContainerProps, LeafletMapsContainerState> {
    private subscriptionHandles: number[] = [];
    private locationsArray: Location[] = [];
    private errorMessage = "";
    readonly state: LeafletMapsContainerState = {
        alertMessage: "",
        locations: [],
        markerImageUrl: "",
        isFetchingData: false
    };

    render() {
        return createElement(LeafletMap, {
            allLocations: this.state.locations,
            className: this.props.class,
            alertMessage: this.state.alertMessage,
            onClickAction: this.executeAction,
            fetchingData: this.state.isFetchingData,
            ...this.props as LeafletMapsContainerProps
        });
    }

    componentWillReceiveProps(nextProps: LeafletMapsContainerProps) {
        this.resetSubscriptions(nextProps.mxObject);
        const validationMessage = validateLocationProps(nextProps);
        if (nextProps && nextProps.mxObject) {
            if (validationMessage) {
                this.setState({ alertMessage: validationMessage });
            } else {
                this.fetchData(nextProps.mxObject);
            }
        } else {
            this.setState({ locations: [], alertMessage: "", isFetchingData: false });
        }
    }

    componentWillUnmount() {
        this.subscriptionHandles.forEach(window.mx.data.unsubscribe);
    }

    private resetSubscriptions(contextObject?: mendix.lib.MxObject) {
        this.subscriptionHandles.forEach(window.mx.data.unsubscribe);
        this.subscriptionHandles = [];
        if (contextObject) {
            this.subscriptionHandles.push(window.mx.data.subscribe({
                guid: contextObject.getGuid(),
                callback: () => this.fetchData(contextObject)
            }));
            if (this.props.locations && this.props.locations.length) {
                this.props.locations.forEach(location => {
                    this.subscriptionHandles.push(window.mx.data.subscribe({
                        entity: location.locationsEntity as string,
                        callback: () => this.fetchData(contextObject)
                    }));
                });
                this.props.locations.forEach(location =>
                    [
                        location.latitudeAttribute,
                        location.longitudeAttribute,
                        location.staticMarkerIcon
                    ]
                .forEach(
                    (attr): number => this.subscriptionHandles.push(window.mx.data.subscribe({
                        attr,
                        callback: () => this.fetchData(contextObject),
                        guid: contextObject.getGuid()
                    }))
                ));
            }
        }
    }

    private fetchData = (contextObject?: mendix.lib.MxObject) => {
        this.locationsArray = [];
        this.errorMessage = "";
        if (this.props.locations && this.props.locations.length) {
            const guid = contextObject ? contextObject.getGuid() : "";
            this.setState({ isFetchingData: true });
            this.props.locations.forEach(location => {
                if (location.dataSourceType === "static") {
                    this.locationsArray.push(parseStaticLocations(location));
                    this.setState({
                        locations: this.locationsArray,
                        isFetchingData: false
                    });
                } else if (location.dataSourceType === "context" && contextObject) {
                    this.setLocationsFromMxObjects([ contextObject ], location);
                } else {
                    fetchData({
                        guid,
                        type: location.dataSourceType,
                        entity: location.locationsEntity,
                        constraint: location.entityConstraint,
                        microflow: location.dataSourceMicroflow
                    })
                    .then(mxObjects => this.setLocationsFromMxObjects(mxObjects, location))
                    .catch(reason => this.setState({ alertMessage: `Failed because of ${reason}`, locations: [], isFetchingData: false }));
                }
            });
        }
    }

    private setLocationsFromMxObjects = (mxObjects: mendix.lib.MxObject[], locationAttr: Container.DataSourceLocationProps) =>
        Promise.all(mxObjects.map(mxObject =>
            fetchMarkerObjectUrl({ type: locationAttr.markerImage, markerIcon: locationAttr.staticMarkerIcon }, mxObject)
                .then(markerUrl => {
                    return {
                        latitude: Number(mxObject.get(locationAttr.latitudeAttribute as string)),
                        longitude: Number(mxObject.get(locationAttr.longitudeAttribute as string)),
                        mxObject,
                        url: markerUrl
                    };
                })))
                .then(results => {
                    results.forEach(location => {
                        if (validLocation(location)) {
                            this.locationsArray.push(location);
                        } else {
                            this.errorMessage = "Invalid coordinates were passed";
                        }
                    });
                    this.setState({
                        locations: this.locationsArray,
                        isFetchingData: false,
                        alertMessage: this.errorMessage
                    });
                })
                .catch(reason => this.setState({ alertMessage: `Failed due to, ${reason}`, locations: [], isFetchingData: false }))

    private executeAction = (markerLocation: Location) => {
        const object = markerLocation.mxObject;

        this.props.locations.forEach(locations => {
            if (object) {
                const { mxform } = this.props;
                const { onClickEvent, onClickMicroflow, onClickNanoflow, openPageAs, page } = locations;
                const context = new mendix.lib.MxContext();
                context.setContext(object.getEntity(), object.getGuid());

                if (onClickEvent === "callMicroflow" && onClickMicroflow) {
                    mx.ui.action(onClickMicroflow, {
                        context,
                        origin: mxform,
                        error: error => this.setState({ alertMessage: `Error while executing on click microflow ${onClickMicroflow} : ${error.message}` })
                    });
                } else if (onClickEvent === "callNanoflow" && onClickNanoflow.nanoflow) {
                    window.mx.data.callNanoflow({
                        nanoflow: onClickNanoflow,
                        origin: mxform,
                        context,
                        error: error => this.setState({ alertMessage: `Error while executing on click nanoflow: ${error.message}` })
                    });
                } else if (onClickEvent === "showPage" && page) {
                    window.mx.ui.openForm(page, {
                        location: openPageAs,
                        context,
                        error: error => this.setState({ alertMessage: `Error while opening page ${page}: ${error.message}` })
                    });
                } else if (onClickEvent !== "doNothing") {
                    this.setState({ alertMessage: `No Action was passed ${onClickEvent}` });
                }
            }
        });
    }
}
