import { UrlHelper } from "./UrlHelper";
import { Style } from "./Styles";
import Dimensions = Style.Dimensions;
import { fetchMarkerObjectUrl } from "./Data";

export namespace Container {

    export interface WrapperProps {
        "class"?: string;
        friendlyId: string;
        mxform: mxui.lib.form._FormBase;
        mxObject?: mendix.lib.MxObject;
        style?: string;
    }

    export interface LeafletMapsContainerProps extends WrapperProps, Dimensions, DefaultLocations {
        mapProvider?: mapProviders;
        dataSourceType: DataSource;
        attribution?: string;
        locations: DataSourceLocationProps[];
    }

    export interface DataSourceLocationProps extends DatabaseLocationProps, StaticLocationProps, MarkerIconProps, MarkerEvents {
        locationsEntity?: string;
        entityConstraint?: string;
        dataSourceMicroflow?: string;
        dataSourceNanoflow: Data.Nanoflow;
    }

    export interface DatabaseLocationProps {
        latitudeAttribute: string;
        longitudeAttribute: string;
    }

    export interface StaticLocationProps {
        staticLatitude: string;
        staticLongitude: string;
    }

    export interface Location {
        latitude?: number;
        longitude?: number;
        mxObject?: mendix.lib.MxObject;
        url?: string;
    }

    export interface DefaultLocations {
        defaultCenterLatitude?: string;
        defaultCenterLongitude?: string;
    }

    export interface MarkerIconProps {
        markerImage: MarKerImages;
        staticMarkerIcon: any;
    }

    export interface MarkerEvents {
        onClickMicroflow: string;
        onClickNanoflow: Data.Nanoflow;
        onClickEvent: OnClickOptions;
        openPageAs: PageLocation;
        page: string;
    }

    export type MarKerImages = "systemImage" | "staticImage";
    export type DataSource = "static" | "XPath" | "microflow" | "nanoflow" | "context";
    export type OnClickOptions = "doNothing" | "showPage" | "callMicroflow" | "callNanoflow";
    export type PageLocation = "content" | "popup" | "modal";
    export type mapProviders = "Open street" | "Map box";

    export const getStaticMarkerUrl = (staticMarkerIcon: string): string => {
        if (staticMarkerIcon) {
            return UrlHelper.getStaticResourceUrl(staticMarkerIcon);
        } else {
            return "";
        }
    };

    export const parseStaticLocations = (props: LeafletMapsContainerProps) => {
        const staticlocations = props.locations.map(locations => {
            const latitude = locations.staticLatitude.trim() !== "" ? Number(locations.staticLatitude) : undefined;
            const longitude = locations.staticLongitude.trim() !== "" ? Number(locations.staticLongitude) : undefined;

            return fetchMarkerObjectUrl({
                type: locations.markerImage,
                markerIcon: locations.staticMarkerIcon
            })
                .then((markerUrl: string) => {
                    return {
                        latitude: latitude ? Number(latitude) : undefined,
                        longitude: longitude ? Number(longitude) : undefined,
                        url: markerUrl
                    };
                })
                .catch(reason => reason);
        });

        return Promise.all(staticlocations);
    };
}

export namespace Data {

    export interface FetchDataOptions {
        type?: Container.DataSource;
        entity?: string;
        guid?: string;
        mxform?: mxui.lib.form._FormBase;
        constraint?: string;
        microflow?: string;
        nanoflow: Nanoflow;
    }

    export interface FetchByXPathOptions {
        guid: string;
        entity: string;
        constraint: string;
    }
    export interface Nanoflow {
        nanoflow: object[];
        paramsSpec: { Progress: string };
    }

    export interface FetchMarkerIcons {
        type: Container.MarKerImages;
        markerIcon: string;
    }

    export interface FetchLocationAttributes extends FetchMarkerIcons {
        latitude: string;
        longitude: string;
    }
}
