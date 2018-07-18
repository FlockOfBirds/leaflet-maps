import { Component, createElement } from "react";
import { LeafletMap, mapProviders } from "./LeafletMap";
import merge from "deepmerge";

import { DataSourceLocationProps, Location, parseStaticLocations } from "./Utils/ContainerUtils";
import { Alert } from "./Alert";
import "leaflet/dist/leaflet.css";
import "./ui/LeafletMaps.css";

export interface WrapperProps {
    "class"?: string;
    friendlyId: string;
    mxObject?: mendix.lib.MxObject;
    style?: string;
}

export interface LeafletMapsContainerProps extends WrapperProps {
    urlTemplate: string;
    defaultCenterLatitude?: string;
    defaultCenterLongitude?: string;
    zoomLevel: string;
    mapProvider: mapProviders;
    dataSourceType: DataSource;
    defaultMakerIcon: string;
    locations: DataSourceLocationProps[];
}

type DataSource = "static" | "XPath" | "microflow";

export interface LeafletMapsContainerState {
    alertMessage?: string;
    locations: Location[];
}

export default class LeafletMapsContainer extends Component<LeafletMapsContainerProps, LeafletMapsContainerState> {
    private subscriptionHandles: number[] = [];
    readonly state: LeafletMapsContainerState = {
        alertMessage: "",
        locations: []
    };

    constructor(props: LeafletMapsContainerProps) {
        super(props);
    }

    render() {
        if (this.state.alertMessage) {
            return createElement(Alert, {
                bootstrapStyle: "danger",
                className: "widget-leaflet-maps-alert",
                message: this.state.alertMessage
            });
        } else {
        return createElement(LeafletMap, {
            urlTemplate: this.props.urlTemplate,
            mapProvider: this.props.mapProvider,
            locations: this.state.locations,
            defaultCenterLatitude: this.props.defaultCenterLatitude,
            defaultCenterLongitude: this.props.defaultCenterLongitude,
            zoomLevel: this.props.zoomLevel
        });
    }
    }

    componentWillReceiveProps(nextProps: LeafletMapsContainerProps) {
        if (nextProps) {
            this.resetSubscriptions(nextProps.mxObject);
            this.fetchData(nextProps.mxObject);
        }
    }

    componentWillUnmount() {
        this.unsubscribe();
    }

    private getLocations(props: LeafletMapsContainerProps): any[] {
        return merge.all(props.locations.map(locationAttr =>
            [
                locationAttr.latitudeAttribute,
                locationAttr.longitudeAttribute
            ]
        ));
    }

    private resetSubscriptions(contextObject?: mendix.lib.MxObject) {
        this.unsubscribe();
        if (contextObject) {
            this.subscriptionHandles.push(mx.data.subscribe({
                callback: () => this.fetchData(contextObject),
                guid: contextObject.getGuid()
            }));

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

    private unsubscribe() {
        this.subscriptionHandles.map(mx.data.unsubscribe);
    }

    private fetchData(contextObject?: mendix.lib.MxObject) {
        this.props.locations.map(locations => {
            if (this.props.dataSourceType === "static") {
                this.setState({ locations: parseStaticLocations(this.props) });
            } else if (this.props.dataSourceType === "microflow" && locations.locationsEntity) {
                this.fetchLocationsByMicroflow(locations.dataSourceMicroflow as string, contextObject);
            } else if (this.props.dataSourceType === "XPath") {
                const guid = contextObject ? contextObject.getGuid() : "";
                this.fetchLocationsByXpath(guid, locations.entityConstraint, locations.locationsEntity);
            }
        });
    }

    private fetchLocationsByMicroflow(microflow: string, contextObject?: mendix.lib.MxObject) {
        if (microflow) {
            mx.ui.action(microflow, {
                callback: (mxObjects: mendix.lib.MxObject[]) => this.setLocationsFromMxObjects(mxObjects),
                error: error => this.setState({
                    alertMessage: `An error occurred while retrieving locations: ${error.message} in ` + microflow,
                    locations: []
                }),
                params: {
                    applyto: "selection",
                    guids: contextObject ? [ contextObject.getGuid() ] : []
                }
            });
        }
    }

    private fetchLocationsByXpath(contextGuid: string, entityConstraint?: string, locationsEntity?: string) {
        const requiresContext = entityConstraint && entityConstraint.indexOf("[%CurrentObject%]") > -1;
        if (!contextGuid && requiresContext) {
            this.setState({ locations: [] });

            return;
        }

        const constraint = entityConstraint ? entityConstraint.replace(/\[%CurrentObject%\]/g, contextGuid) : "";
        const xpath = `//${locationsEntity}${constraint}`;

        mx.data.get({
            callback: mxObjects => this.setLocationsFromMxObjects(mxObjects),
            error: error =>
                this.setState({
                    alertMessage: `An error occurred while retrieving locations: ${error} constraint ` + xpath,
                    locations: []
                }),
            xpath
        });
    }

    private setLocationsFromMxObjects(mxObjects: mendix.lib.MxObject[]) {
        this.props.locations.map(locationAttr => {
            const locations = mxObjects.map(mxObject => {
                const lat = mxObject.get(locationAttr.latitudeAttribute as string);
                const lng = mxObject.get(locationAttr.longitudeAttribute as string);

                return {
                    latitude: lat ? Number(lat) : undefined,
                    longitude: lng ? Number(lng) : undefined
                };
            });

            this.setState({ locations });
        });
    }
}
