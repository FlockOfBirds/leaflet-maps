import { Component, createElement } from "react";
import { LeafletMap } from "./components/LeafletMap";
import { Container } from "./components/Utils/ContainerUtils";
import LeafletMapsContainerProps = Container.LeafletMapsContainerProps;

// tslint:disable-next-line:class-name
export class preview extends Component<LeafletMapsContainerProps> {
    render() {
        return createElement(LeafletMap, {
            allLocations: [ preview.createSampleLocations() ],
            ...this.props as LeafletMapsContainerProps
        });
    }

    static createSampleLocations(): {latitude: number, longitude: number, url: string } {
        return {
            latitude: 40.7590110000,
            longitude: -73.9844722000,
            url: ""
        };
    }
}

export function getPreviewCss() {
    return (
        require("leaflet/dist/leaflet.css") +
        require("leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.webpack.css") +
        require("leaflet-defaulticon-compatibility") +
        require("./components/ui/LeafletMaps.css")
    );
}
