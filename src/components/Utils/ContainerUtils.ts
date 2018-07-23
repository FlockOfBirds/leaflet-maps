import { LeafletMapsContainerProps } from "../LeafletMapsContainer";
import { UrlHelper } from "./UrlHelper";

export interface DataSourceLocationProps extends DatabaseLocationProps, StaticLocationProps, MarkerIconProps {
    locationsEntity?: string;
    entityConstraint?: string;
    dataSourceMicroflow?: string;
    dataSourceNanoflow?: Nanoflow;
}

export interface DatabaseLocationProps {
    latitudeAttribute?: string;
    longitudeAttribute?: string;
}

export interface StaticLocationProps {
    staticLatitude: string;
    staticLongitude: string;
}

export interface Nanoflow {
    nanoflow: object[];
    paramsSpec: { Progress: string };
}

export interface Location {
    latitude?: number;
    longitude?: number;
    url?: string;
}

export interface DefaultLocations {
    defaultCenterLatitude?: string;
    defaultCenterLongitude?: string;
}

export interface MarkerIconProps {
    markerImage?: MarherImages;
    staticMarkerIcon?: string;
}

export type MarherImages = "defaultMarkerIcon" | "systemImage" | "staticImage";

export const getStaticMarkerUrl = (staticMarkerIcon: string): string => {
    if (staticMarkerIcon) {
        return UrlHelper.getStaticResourceUrl(staticMarkerIcon);
    } else {
        return "";
    }
};

export const parseStaticLocations = (props: LeafletMapsContainerProps): Location[] => {
    return props.locations.map(locations => ({
        latitude: locations.staticLatitude.trim() !== "" ? Number(locations.staticLatitude) : undefined,
        longitude: locations.staticLongitude.trim() !== "" ? Number(locations.staticLongitude) : undefined
    }));
};
