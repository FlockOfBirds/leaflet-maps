import { LeafletMapsContainerProps } from "../LeafletMapsContainer";

export interface DataSourceLocationProps extends StaticLocationProps, DatabaseLocationProps {
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
}

export interface DefaultLocations {
    defaultCenterLatitude?: string;
    defaultCenterLongitude?: string;
}

export const parseStaticLocations = (props: LeafletMapsContainerProps): Location[] => {
    return props.locations.map(locations => ({
        latitude: locations.staticLatitude.trim() !== "" ? Number(locations.staticLatitude) : undefined,
        longitude: locations.staticLongitude.trim() !== "" ? Number(locations.staticLongitude) : undefined
    }));
};
