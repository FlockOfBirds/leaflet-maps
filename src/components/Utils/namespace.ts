export namespace Container {

    export type MarKerImages = "systemImage" | "staticImage";
    export type DataSource = "static" | "XPath" | "microflow" | "context";
    export type OnClickOptions = "doNothing" | "showPage" | "callMicroflow" | "callNanoflow";
    export type PageLocation = "content" | "popup" | "modal";
    export type mapProviders = "openStreet" | "mapBox" | "hereMaps" | "googleMaps";

    export interface WrapperProps {
        "class"?: string;
        friendlyId: string;
        mxform: mxui.lib.form._FormBase;
        mxObject?: mendix.lib.MxObject;
        style?: string;
    }

    export interface MapsContainerProps extends WrapperProps, MapProps {
        locations: DataSourceLocationProps[];
    }

    export interface DataSourceLocationProps extends DatabaseLocationProps, StaticLocationProps, MarkerIconProps, MarkerEvents {
        dataSourceType: DataSource;
        locationsEntity?: string;
        entityConstraint?: string;
        dataSourceMicroflow?: string;
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
        staticMarkerIcon: string;
    }

    export interface MarkerEvents {
        onClickMicroflow: string;
        onClickNanoflow: Data.Nanoflow;
        onClickEvent: OnClickOptions;
        openPageAs: PageLocation;
        page: string;
    }

    export interface MapControlOptions {
        optionDrag?: boolean;
        optionScroll?: boolean;
        optionZoomControl?: boolean;
        attributionControl?: boolean;
        optionStreetView?: boolean;
    }

    export interface MapProps extends MapControlOptions, DefaultLocations, MapUtils.Dimensions {
        mapProvider?: mapProviders;
        apiToken?: string;
        hereMapsAppId?: string;
    }
}

export namespace Data {

    export interface FetchDataOptions {
        type?: Container.DataSource;
        entity?: string;
        guid?: string;
        mxform?: mxui.lib.form._FormBase;
        constraint?: string;
        microflow?: string;
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
}

export namespace MapUtils {

    export interface SharedProps {
        allLocations?: Container.Location[];
        className?: string;
        alertMessage?: string;
        fetchingData?: boolean;
        style?: object;
    }

    export type heightUnitType = "percentageOfWidth" | "percentageOfParent" | "pixels";
    export type widthUnitType = "percentage" | "pixels";

    export interface Dimensions {
        autoZoom?: boolean;
        zoomLevel: number;
        widthUnit: widthUnitType;
        width: number;
        height: number;
        heightUnit: heightUnitType;
    }

    export interface CustomTypeUrls {
        readonly openStreetMap: string;
        readonly mapbox: string;
        readonly hereMaps: string;
    }

    export interface MapAttributions {
        readonly openStreetMapAttr: string;
        readonly mapboxAttr: string;
        readonly hereMapsAttr: string;
    }

    export const customUrls: CustomTypeUrls = {
        openStreetMap: `http://{s}.tile.osm.org/{z}/{x}/{y}.png`,
        mapbox: `https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=`,
        hereMaps: `https://2.base.maps.cit.api.here.com/maptile/2.1/maptile/newest/normal.day/{z}/{x}/{y}/256/png8?`
    };

    export const mapAttr: MapAttributions = {
        openStreetMapAttr: `&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors`,
        mapboxAttr: `Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors,
            <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>`,
        hereMapsAttr: `Map &copy; 1987-2014 <a href="http://developer.here.com">HERE</a>`
    };
}
