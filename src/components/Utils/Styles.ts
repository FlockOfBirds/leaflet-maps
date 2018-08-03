import { CSSProperties } from "react";

export namespace Style {
    export interface Dimensions {
        autoZoom?: boolean;
        zoomLevel: number;
        widthUnit: widthUnitType;
        width: number;
        height: number;
        heightUnit: heightUnitType;
    }

    export type heightUnitType = "percentageOfWidth" | "percentageOfParent" | "pixels";
    export type widthUnitType = "percentage" | "pixels";

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

    export const getDimensions = <T extends Dimensions>(props: T): CSSProperties => {
        const style: CSSProperties = {
            width: props.widthUnit === "percentage" ? `${props.width}%` : `${props.width}px`
        };
        if (props.heightUnit === "percentageOfWidth") {
            style.paddingBottom = props.widthUnit === "percentage"
                ? `${props.height}%`
                : `${props.width / 2}px`;
        } else if (props.heightUnit === "pixels") {
            style.height = `${props.height}px`;
        } else if (props.heightUnit === "percentageOfParent") {
            style.height = `${props.height}%`;
        }

        return style;
    };
}

export namespace MapUtils {
    export interface CustomTypeUrls {
        readonly openStreetMap: string;
        readonly mapbox: string;
    }

    export interface MapAttributions {
        readonly openStreetMapAttr: string;
        readonly mapboxAttr: string;
    }

    export const customUrls: CustomTypeUrls = {
        openStreetMap: `//{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`,
        mapbox: `//api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=`
    };

    export const mapAttr: MapAttributions = {
        openStreetMapAttr: `&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors`,
        mapboxAttr: `Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>`
    };
}
