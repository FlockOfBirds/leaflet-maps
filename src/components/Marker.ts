import { StatelessComponent, createElement } from "react";

export interface MarkerProps {
    lat?: number;
    lng?: number;
}

// tslint:disable-next-line:variable-name
export const Marker: StatelessComponent<MarkerProps> = () => {
    return createElement("div", { classname: "widget-leaflet-maps-marker" });
};

Marker.displayName = "Marker";
