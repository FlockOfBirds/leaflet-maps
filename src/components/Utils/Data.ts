import { Container, Data } from "./ContainerUtils";

type MxObject = mendix.lib.MxObject;

export const validateLocationProps = <T extends Partial<Container.LeafletMapsContainerProps>> (locationData: T): string => {
    const { locations, zoomLevel, autoZoom, mapBoxAccessToken, mapProvider } = locationData;
    const errorMessage: string[] = [];
    if (!autoZoom && (zoomLevel && zoomLevel < 2)) {
        errorMessage.push("Zoom Level should be greater than one");
    }
    if (mapProvider === "mapBox" && !mapBoxAccessToken) {
        errorMessage.push(`A Mapbox token is reaquired`);
    }
    if (locations && locations.length) {
        locations.forEach((location, index) => {
            if (location.dataSourceType && location.dataSourceType !== "static") {
                if (!(location.latitudeAttribute && location.longitudeAttribute)) {
                    errorMessage.push(`The Latitude attribute and longitude attribute are required for data source
                    ${locations[index].dataSourceType} at location ${index + 1}`);
                }
            } else if (!(location.staticLatitude && location.staticLongitude)) {
                errorMessage.push(`Invalid static locations. Latitude and longitude are required at location ${index + 1}`);
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

export const validLocation = (location: Container.Location): boolean => {
    const { latitude: lat, longitude: lng } = location;

    return typeof lat === "number" && typeof lng === "number"
        && lat <= 90 && lat >= -90
        && lng <= 180 && lng >= -180
        && !(lat === 0 && lng === 0);
};

export const fetchData = (options: Data.FetchDataOptions): Promise<MxObject[]> =>
    new Promise<MxObject[]>((resolve, reject) => {
        const { guid, entity } = options;
        if (entity && guid) {
            if (options.type === "XPath") {
                fetchByXPath({
                    guid,
                    entity,
                    constraint: options.constraint || ""
                })
                .then(mxObjects => resolve(mxObjects))
                .catch(message => reject({ message }));
            } else if (options.type === "microflow" && options.microflow) {
                fetchByMicroflow(options.microflow, guid)
                    .then(mxObjects => resolve(mxObjects))
                    .catch(message => reject({ message }));
            }
        } else {
            reject("entity & guid are required");
        }
    });

const fetchByXPath = (options: Data.FetchByXPathOptions): Promise<MxObject[]> => new Promise<MxObject[]>((resolve, reject) => {
    const { guid, entity, constraint } = options;

    const entityPath = entity.split("/");
    const entityName = entityPath.length > 1 ? entityPath[entityPath.length - 1] : entity;
    const xpath = `//${entityName}${constraint.split("[%CurrentObject%]").join(guid)}`;

    window.mx.data.get({
        xpath,
        callback: resolve,
        error: error => reject(`An error occurred while retrieving data via XPath: ${xpath}: ${error.message}`)
    });
});

const fetchByMicroflow = (actionname: string, guid: string): Promise<MxObject[]> =>
    new Promise((resolve, reject) => {
        window.mx.ui.action(actionname, {
            params: {
                applyto: "selection",
                guids: [ guid ]
            },
            callback: (mxObjects: MxObject[]) => resolve(mxObjects),
            error: error => reject(`An error occurred while retrieving data via microflow: ${actionname}: ${error.message}`)
        });
    });

export const fetchMarkerObjectUrl = (options: Data.FetchMarkerIcons, mxObject?: mendix.lib.MxObject): Promise<string> =>
    new Promise((resolve, reject) => {
        const { type, markerIcon } = options;
        if (type === "staticImage") {
            resolve(Container.getStaticMarkerUrl(markerIcon));
        } else if (type === "systemImage" && mxObject) {
            const url = window.mx.data.getDocumentUrl(mxObject.getGuid(), mxObject.get("changedDate") as number);
            window.mx.data.getImageUrl(url,
                objectUrl => resolve(objectUrl),
                error => reject(`Error while retrieving the image url: ${error.message}`)
            );
        } else {
            resolve("");
        }
    });
