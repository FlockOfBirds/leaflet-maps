import { Component, createElement } from "react";
import { LeafletMap } from "./components/LeafletMap";
import { validateLocationProps } from "./components/Utils/Validations";
import { Container } from "./components/Utils/namespace";
import MapsContainerProps = Container.MapsContainerProps;
import MapProps = Container.MapProps;

type VisibilityMap<T> = {
    [P in keyof T]: any;
};

// tslint:disable-next-line:class-name
export class preview extends Component<MapsContainerProps, {}> {

    render() {
        const validationMessage = validateLocationProps(this.props);

        return createElement(LeafletMap, {
            allLocations: preview.createSampleLocations(),
            alertMessage: validationMessage,
            fetchingData: false,
            ...this.props as MapProps
        });
    }

    static createSampleLocations(): {latitude: number, longitude: number, url: string }[] {
        return [ {
            latitude: 40.7590110000,
            longitude: -73.9844722000,
            url: ""
        } ];
    }
}

export function getPreviewCss() {
    return (
        require("leaflet/dist/leaflet.css") +
        require("leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.webpack.css") +
        require("leaflet-defaulticon-compatibility") +
        require("./components/ui/Maps.css")
    );
}

export function getVisibleProperties(valueMap: MapsContainerProps, visibilityMap: VisibilityMap<MapsContainerProps>) {
    if (valueMap.locations && Array.isArray(valueMap.locations)) {
        valueMap.locations.forEach((location, index) => {
            if (location.dataSourceType) {
                if (!(location.dataSourceType === "microflow")) {
                    visibilityMap.locations[index].dataSourceMicroflow = false;
                }
                if (!(location.dataSourceType === "static")) {
                    visibilityMap.locations[index].staticLatitude = false;
                    visibilityMap.locations[index].staticLongitude = false;
                }
                if (!(location.dataSourceType === "XPath")) {
                    visibilityMap.locations[index].entityConstraint = false;
                }
                if (location.dataSourceType === "static") {
                    visibilityMap.locations[index].locationsEntity = false;
                    visibilityMap.locations[index].latitudeAttribute = false;
                    visibilityMap.locations[index].longitudeAttribute = false;
                }
            }
            visibilityMap.apiToken = valueMap.mapProvider === "mapBox";
            visibilityMap.locations[index].staticMarkerIcon = location.markerImage === "staticImage";
            visibilityMap.locations[index].onClickMicroflow = location.onClickEvent === "callMicroflow";
            visibilityMap.locations[index].onClickNanoflow = location.onClickEvent === "callNanoflow";
            visibilityMap.locations[index].page = location.onClickEvent === "showPage";

            visibilityMap.locations[index].PageLocation = location.onClickEvent === "showPage";
        });
    }

    return visibilityMap;
}
