import { Container } from "./namespace";

export const validateLocationProps = <T extends Partial<Container.MapsContainerProps>> (locationData: T): string => {
    const { locations, zoomLevel, autoZoom, apiToken, mapProvider } = locationData;
    const errorMessage: string[] = [];
    if (!autoZoom && (zoomLevel && zoomLevel < 2)) {
        errorMessage.push("Zoom Level should be greater than one");
    }
    if (mapProvider === "mapBox" && !apiToken) {
        errorMessage.push(`A Mapbox token is reaquired`);
    }
    if (locations && locations.length) {
        locations.forEach((location, index) => {
            if (location.dataSourceType && location.dataSourceType !== "static") {
                if (!(location.latitudeAttribute && location.longitudeAttribute)) {
                    errorMessage.push(`The Latitude attribute and longitude attribute are required for data source
                    ${locations[index].dataSourceType} at location ${index + 1}`);
                }
            } else {
                if (!(location.staticLatitude && location.staticLongitude)) {
                    errorMessage.push(`Invalid static locations. Latitude and longitude are required at location ${index + 1}`);
                }
            }
            if (location.dataSourceType === "microflow") {
                if (!location.dataSourceMicroflow) {
                    errorMessage.push(`A Microflow is required for Data source Microflow at location ${index + 1}`);
                }
            }
        });
    }

    return errorMessage.join(", ");
};

export const validLocations = (location: Container.Location[]): boolean => {
    return location.every(loca => {
        const { latitude: lat, longitude: lng } = loca;

        return typeof lat === "number" && typeof lng === "number"
        && lat <= 90 && lat >= -90
        && lng <= 180 && lng >= -180
        && !(lat === 0 && lng === 0);
    });
};
