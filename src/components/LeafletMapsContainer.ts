import { Component, createElement } from "react";
import { LeafletMap, mapProviders } from "./LeafletMap";

import { Location, StaticLocation, parseStaticLocations } from "./Utils/ContainerUtils";
import "leaflet/dist/leaflet.css";
import "./ui/LeafletMaps.css";

export interface WrapperProps {
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
    staticLocations: StaticLocation[];
}

type DataSource = "static" | "XPath" | "microflow";

export interface LeafletMapsContainerState {
    alertMessage?: string;
    locations: Location[];
}

export default class LeafletMapsContainer extends Component<LeafletMapsContainerProps, LeafletMapsContainerState> {
    readonly state: LeafletMapsContainerState = {
        alertMessage: "",
        locations: []
    };

    constructor(props: LeafletMapsContainerProps) {
        super(props);
    }

    render() {
        return createElement(LeafletMap, {
            urlTemplate: this.props.urlTemplate,
            mapProvider: this.props.mapProvider,
            locations: this.state.locations,
            defaultCenterLatitude: this.props.defaultCenterLatitude,
            defaultCenterLongitude: this.props.defaultCenterLongitude,
            zoomLevel: this.props.zoomLevel
        });
    }

    componentWillReceiveProps(nextProps: LeafletMapsContainerProps) {
        if (nextProps) {
            this.fetchData(nextProps.mxObject);
        }
    }

    componentWillUnmount() {
        //
    }

    private fetchData(contextObject?: mendix.lib.MxObject) {
        if (this.props.dataSourceType === "static") {
            // tslint:disable-next-line:no-console
            console.log(contextObject);
            this.setState({ locations: parseStaticLocations(this.props) });
        }
    }
}
