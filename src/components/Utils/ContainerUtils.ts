import { LeafletMapsContainerProps } from "../LeafletMapsContainer";

export interface DataSourceLocationProps extends StaticLocationProps, DatabaseLocationProps {
    locationsEntity?: string;
    entityConstraint?: string;
    dataSourceMicroflow?: string;
}

export interface DatabaseLocationProps {
    latitudeAttribute?: string;
    longitudeAttribute?: string;
}

export interface StaticLocationProps {
    staticLatitude: string;
    staticLongitude: string;
}

export interface Location {
    latitude?: number;
    longitude?: number;
}

export const parseStaticLocations = (props: LeafletMapsContainerProps): Location[] => {
        return props.locations.map(locations => ({
            latitude: locations.staticLatitude.trim() !== "" ? Number(locations.staticLatitude) : undefined,
            longitude: locations.staticLongitude.trim() !== "" ? Number(locations.staticLongitude) : undefined
        }
    ));
};

export const parseStyle = (style = ""): {[key: string]: string} => { // Doesn't support a few stuff.
    try {
        return style.split(";").reduce<{[key: string]: string}>((styleObject, line) => {
            const pair = line.split(":");
            if (pair.length === 2) {
                const name = pair[0].trim().replace(/(-.)/g, match => match[1].toUpperCase());
                styleObject[name] = pair[1].trim();
            }

            return styleObject;
        }, {});
    } catch (error) {
        // tslint:disable-next-line no-console
        window.console.log("Failed to parse style", style, error);
    }

    return {};
};
