import { Component, createElement } from "react";
import { LeafletEvent } from "leaflet";

import { LeafletMap } from "./LeafletMap";
import { Container } from "./Utils/namespace";
import { fetchData, fetchMarkerObjectUrl, parseStaticLocations } from "./Utils/Data";
import { validateLocationProps } from "./Utils/Validations";
import MapsContainerProps = Container.MapsContainerProps;
import MapProps = Container.MapProps;
import Location = Container.Location;
import DataSourceLocationProps = Container.DataSourceLocationProps;

import "leaflet/dist/leaflet.css";
// Re-uses images from ~leaflet package
// Use workaround for marker icon, that is not standard compatible with webpack
// https://github.com/ghybs/leaflet-defaulticon-compatibility#readme
import "leaflet-defaulticon-compatibility";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.webpack.css";
import "./ui/LeafletMaps.css";
import { wrappedGoogleMap } from "./GoogleMap";

export interface LeafletMapsContainerState {
    alertMessage?: string;
    locations: Location[];
    isFetchingData?: boolean;
}

export default class MapsContainer extends Component<MapsContainerProps, LeafletMapsContainerState> {
    private subscriptionHandles: number[] = [];
    readonly state: LeafletMapsContainerState = {
        alertMessage: "",
        locations: [],
        isFetchingData: false
    };

    render() {
        if (this.props.mapProvider === "googleMaps") {
            return createElement(wrappedGoogleMap, {
                allLocations: this.state.locations,
                fetchingData: this.state.isFetchingData,
                className: this.props.class,
                alertMessage: this.state.alertMessage,
                style: this.parseStyle(this.props.style),
                ...this.props as MapProps
            });
        } else {
            return createElement(LeafletMap, {
                allLocations: this.state.locations,
                className: this.props.class,
                alertMessage: this.state.alertMessage,
                onClickMarker: this.onClickMarker,
                fetchingData: this.state.isFetchingData,
                style: this.parseStyle(this.props.style),
                ...this.props as MapProps
            });
        }
    }

    componentWillReceiveProps(nextProps: MapsContainerProps) {
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
        this.unsubscribeAll();
    }

    private resetSubscriptions(contextObject?: mendix.lib.MxObject) {
        this.unsubscribeAll();
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
                    );
                });
            }
        }
    }

    private unsubscribeAll() {
        this.subscriptionHandles.forEach(window.mx.data.unsubscribe);
        this.subscriptionHandles = [];
    }

    private fetchData = (contextObject?: mendix.lib.MxObject) => {
        this.setState({ isFetchingData: true });
        Promise.all(this.props.locations.map(locationAttr =>
            this.retrieveData(locationAttr, contextObject)
        ))
        .then(locations => {
            locations.forEach(locs => {
                this.setState({
                    locations: locs,
                    isFetchingData: false
                });
            });
        })
        .catch(reason => {
            this.setState({
                alertMessage: `Failed due to ${reason}`,
                isFetchingData: false
            });
        });
    }

    private retrieveData = (locationOptions: DataSourceLocationProps, contextObject?: mendix.lib.MxObject): Promise<Location[]> =>
        new Promise((resolve, reject) => {
            if (contextObject) {
                const guid = contextObject.getGuid();
                if (locationOptions.dataSourceType === "static") {
                    const staticLocation = parseStaticLocations([ locationOptions ]);
                    resolve(staticLocation);
                } else if (locationOptions.dataSourceType === "context") {
                    this.setLocationsFromMxObjects([ contextObject ], locationOptions)
                        .then(locations => resolve(locations));
                } else {
                    fetchData({
                        guid,
                        type: locationOptions.dataSourceType,
                        entity: locationOptions.locationsEntity,
                        constraint: locationOptions.entityConstraint,
                        microflow: locationOptions.dataSourceMicroflow
                    })
                    .then(mxObjects => this.setLocationsFromMxObjects(mxObjects, locationOptions))
                    .then(locations => resolve(locations));
                }
            } else {
                reject("Context Object required");
            }
        })

    private setLocationsFromMxObjects = (mxObjects: mendix.lib.MxObject[], locationAttr: DataSourceLocationProps) =>
        Promise.all(mxObjects.map(mxObject =>
            fetchMarkerObjectUrl({ type: locationAttr.markerImage, markerIcon: locationAttr.staticMarkerIcon }, mxObject)
                .then(markerUrl => {
                    return {
                        latitude: Number(mxObject.get(locationAttr.latitudeAttribute as string)),
                        longitude: Number(mxObject.get(locationAttr.longitudeAttribute as string)),
                        mxObject,
                        url: markerUrl
                    };
                })
            ))

    private onClickMarker = (event: LeafletEvent) => {
        const { locations } = this.state;
        if (locations && locations.length) {
            this.executeAction(locations[ locations.findIndex(targetLoc => targetLoc.latitude === event.target.getLatLng().lat) ]);
        }
    }

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

    private parseStyle = (style = ""): {[key: string]: string} => { // Doesn't support a few stuff.
        try {
            return style.split(";").reduce<{[key: string]: string}>((styleObject, line) => {
                const pair = line.split(":");
                if (pair.length === 2) {
                    const name = pair[0].trim().replace(/(-.)/g, match => match[1].toUpperCase());
                    styleObject[name] = pair[1].trim();
                }

                return styleObject;
            }, {});
        } catch (error) {
            // tslint:disable-next-line no-console
            window.console.log("Failed to parse style", style, error);
        }

        return {};
    }
}
