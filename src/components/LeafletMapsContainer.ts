import { Component, createElement } from "react";
import merge from "deepmerge";

import { LeafletMap, mapProviders } from "./LeafletMap";
import {
    DataSourceLocationProps,
    DefaultLocations,
    Location,
    Nanoflow,
    getStaticMarkerUrl,
    parseStaticLocations
} from "./Utils/ContainerUtils";
import { Dimensions } from "./Utils/Styles";

import "leaflet/dist/leaflet.css";
// Re-uses images from ~leaflet package
// Use workarount for marker icon, that is not standard compatible with webpack
// https://github.com/ghybs/leaflet-defaulticon-compatibility#readme
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.webpack.css";
import "leaflet-defaulticon-compatibility";
import "./ui/LeafletMaps.css";

export interface WrapperProps {
    "class"?: string;
    friendlyId: string;
    mxform: mxui.lib.form._FormBase;
    mxObject?: mendix.lib.MxObject;
    style?: string;
}

type DataSource = "static" | "XPath" | "microflow" | "nanoflow";

export interface LeafletMapsContainerProps extends WrapperProps, Dimensions, DefaultLocations {
    urlTemplate: string;
    mapProvider?: mapProviders;
    dataSourceType: DataSource;
    attribution?: string;
    locations: DataSourceLocationProps[];
}

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
        this.subscriptionHandles.forEach(mx.data.unsubscribe);
    }

    private fetchData = (contextObject?: mendix.lib.MxObject) => {
        this.props.locations.map(locations => {
            if (this.props.dataSourceType === "static") {
                this.setState({ locations: parseStaticLocations(this.props) });
            } else if (this.props.dataSourceType === "microflow" && locations.locationsEntity) {
                this.fetchLocationsByMicroflow(locations.dataSourceMicroflow as string, contextObject);
            } else if (this.props.dataSourceType === "XPath") {
                const guid = contextObject ? contextObject.getGuid() : "";
                this.fetchLocationsByXpath(guid, locations.entityConstraint, locations.locationsEntity);
            } else if (this.props.dataSourceType === "nanoflow") {
                this.fetchLocationsByNanoflow(contextObject, locations.dataSourceNanoflow);
            }
        });
    }

    private fetchLocationsByMicroflow = (microflow: string, contextObject?: mendix.lib.MxObject) => {
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

    private fetchLocationsByXpath = (contextGuid: string, entityConstraint?: string, locationsEntity?: string) => {
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

    private fetchLocationsByNanoflow = <T extends Nanoflow>(mxObject?: mendix.lib.MxObject, dataSourceNanoflow?: T) => {
        const context = new mendix.lib.MxContext();
        if (mxObject && dataSourceNanoflow && dataSourceNanoflow.nanoflow) {
            mx.data.callNanoflow({
                callback: this.setLocationsFromMxObjects,
                nanoflow: dataSourceNanoflow,
                origin: this.props.mxform,
                context,
                error: error =>
                    this.setState({
                        alertMessage: `An error occured while retrieving locations: ${error.message} in ` + dataSourceNanoflow
                    })
            });
        }
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
