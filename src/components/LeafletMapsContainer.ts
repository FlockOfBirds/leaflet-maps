import { Component, createElement } from "react";

import { LeafletMap } from "./LeafletMap";
import { Container } from "./Utils/ContainerUtils";
import { fetchData, fetchMarkerObjectUrl } from "./Utils/Data";
import LeafletMapsContainerProps = Container.LeafletMapsContainerProps;
import parseStaticLocations = Container.parseStaticLocations;
import Location = Container.Location;

import "leaflet/dist/leaflet.css";
// Re-uses images from ~leaflet package
// Use workarount for marker icon, that is not standard compatible with webpack
// https://github.com/ghybs/leaflet-defaulticon-compatibility#readme
import "leaflet-defaulticon-compatibility";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.webpack.css";
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
        return createElement(LeafletMap, {
            allLocations: this.state.locations,
            className: this.props.class,
            alertMessage: this.state.alertMessage,
            onClickAction: this.executeAction,
            ...this.props as LeafletMapsContainerProps
        });
    }

    componentWillReceiveProps(nextProps: LeafletMapsContainerProps) {
        if (nextProps && nextProps.mxObject) {
            this.resetSubscriptions(nextProps.mxObject);
            this.fetchData(nextProps.mxObject);
        } else {
            this.setState({
                locations: [],
                alertMessage: ""
            });
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
        const guid = contextObject ? contextObject.getGuid() : "";
        const { dataSourceType } = this.props;
        this.props.locations.map(locations => {
            if (this.props.dataSourceType === "static") {
                parseStaticLocations(this.props).then(results => this.setState({ locations: results }));
            } else if (this.props.dataSourceType === "context" && contextObject) {
                this.setLocationsFromMxObjects([ contextObject ]);
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

                return fetchMarkerObjectUrl({
                    type: locationAttr.markerImage,
                    markerIcon: locationAttr.staticMarkerIcon
                }, mxObject)
                    .then((markerUrl: string) => {
                        return {
                            latitude: lat ? Number(lat) : undefined,
                            longitude: lng ? Number(lng) : undefined,
                            mxObject,
                            url: markerUrl
                        };
                    })
                    .catch(reason => reason);
            });

            Promise.all(locations).then(results => {
                this.setState({ locations: results });
            });

        });
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
}
