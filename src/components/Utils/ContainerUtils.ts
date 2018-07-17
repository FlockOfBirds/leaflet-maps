import { LeafletMapsContainerProps } from "../LeafletMapsContainer";

export interface Location {
    latitude?: number;
    longitude?: number;
}

export interface StaticLocation {
    latitude: string;
    longitude: string;
}

export const parseStaticLocations = (props: LeafletMapsContainerProps): Location[] => {
    return props.staticLocations.map(location => ({
        latitude: location.latitude.trim() !== "" ? Number(location.latitude) : undefined,
        longitude: location.longitude.trim() !== "" ? Number(location.longitude) : undefined
    }));
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
