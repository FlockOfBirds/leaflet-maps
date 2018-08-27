import { Container, Data } from "./namespace";
import { UrlHelper } from "./UrlHelper";

type MxObject = mendix.lib.MxObject;

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
            resolve(getStaticMarkerUrl(markerIcon));
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

export const parseStaticLocations = (staticlocations: Container.DataSourceLocationProps[]): Container.Location[] => {
    return staticlocations.map(staticLocs => ({
        latitude: staticLocs.staticLatitude.trim() !== "" ? Number(staticLocs.staticLatitude) : undefined,
        longitude: staticLocs.staticLongitude.trim() !== "" ? Number(staticLocs.staticLongitude) : undefined,
        url: getStaticMarkerUrl(staticLocs.staticMarkerIcon)
    }));
};

export const getStaticMarkerUrl = (staticMarkerIcon: string): string =>
    staticMarkerIcon
        ? UrlHelper.getStaticResourceUrl(staticMarkerIcon)
        : "";
