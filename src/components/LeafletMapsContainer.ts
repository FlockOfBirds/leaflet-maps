import { Component, createElement } from "react";

import { LeafletMap } from "./LeafletMap";
import { Container } from "./Utils/namespace";
import { fetchData, fetchMarkerObjectUrl, parseStaticLocations } from "./Utils/Data";
import { validLocation, validateLocationProps } from "./Utils/Validations";
import LeafletMapsContainerProps = Container.LeafletMapsContainerProps;
import MapProps = Container.MapProps;
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
    private errorMessage: string[] = [];
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
            style: this.props.style,
            ...this.props as MapProps
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
        if (this.props.locations && this.props.locations.length) {
            if (contextObject) {
                this.subscriptionHandles.push(window.mx.data.subscribe({
                    guid: contextObject.getGuid(),
                    callback: () => this.fetchData(contextObject)
                }));
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
        this.errorMessage = [];
        const guid = contextObject ? contextObject.getGuid() : "";
        this.setState({ isFetchingData: true });
        this.props.locations.forEach(location => {
            if (location.dataSourceType === "static") {
                const staticLocation = parseStaticLocations(location);
                this.validateLocation(staticLocation);
                this.setState({
                    locations: this.locationsArray,
                    alertMessage: this.errorMessage.join(", "),
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
                .catch(reason =>
                    this.setState({
                        alertMessage: `Failed because of ${reason}`,
                        locations: [],
                        isFetchingData: false
                    }));
            }
        });
    }

    private validateLocation(location: Location) {
        if (!validLocation(location)) {
            this.errorMessage.push(`Invalid Locations were passed`);
        } else {
            this.locationsArray.push(location);
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
                .then(locations => {
                    locations.forEach(location => {
                        this.validateLocation(location);
                    });
                    this.setState({
                        locations: this.locationsArray,
                        isFetchingData: false,
                        alertMessage: this.errorMessage.join(", ")
                    });
                })
                .catch(reason =>
                    this.setState({
                        alertMessage: `Failed due to, ${reason}`,
                        locations: [],
                        isFetchingData: false
                    }))

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
