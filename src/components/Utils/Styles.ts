import { CSSProperties } from "react";
import { MapUtils } from "./namespace";
import Dimensions = MapUtils.Dimensions;

export namespace Style {

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
