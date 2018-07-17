import { Component, createElement } from "react";
import { LeafletMap, mapProviders } from "./LeafletMap";

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
}

type DataSource = "static" | "XPath" | "microflow";

export interface LeafletMapsContainerState {
    alertMessage?: string;
}

export default class LeafletMapsContainer extends Component<LeafletMapsContainerProps, LeafletMapsContainerState> {
    readonly state: LeafletMapsContainerState = {
        alertMessage: ""
    };

    constructor(props: LeafletMapsContainerProps) {
        super(props);
    }

    render() {
        return createElement(LeafletMap, {
            urlTemplate: this.props.urlTemplate,
            mapProvider: this.props.mapProvider,
            defaultCenterLatitude: this.props.defaultCenterLatitude,
            defaultCenterLongitude: this.props.defaultCenterLongitude,
            zoomLevel: this.props.zoomLevel
        });
    }

    componentWillReceiveProps(nextProps: LeafletMapsContainerProps) {
        if (nextProps) {
            //
        }
    }
}
