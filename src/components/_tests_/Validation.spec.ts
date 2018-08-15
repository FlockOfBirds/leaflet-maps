import { random } from "faker";

import { Container } from "../Utils/namespace";
import locationDataProps = Container.DataSourceLocationProps;
import { validLocation, validateLocationProps } from "../Utils/Validations";

describe("utils/Data", () => {

    describe("#validateLocationProps", () => {
        const contextLocation: Partial<locationDataProps> = {
            dataSourceType: "context",
            latitudeAttribute: "latitude"
        };

        const staticLocation: Partial<locationDataProps> = {
            dataSourceType: "static",
            staticLatitude: "lat"
        };

        const microflowLocation: Partial<locationDataProps> = {
            dataSourceType: "microflow",
            latitudeAttribute: "latitude",
            longitudeAttribute: "longitude"
        };

        it("returns no alert message if autoZoom is enabled", () => {
            const validationMessage = validateLocationProps({ autoZoom: true });

            expect(validationMessage).toBe("");
        });

        it("returns alert message if autozoom is not enabled and zomm is less than 2", () => {
            const validationMessage = validateLocationProps({ autoZoom: false, zoomLevel: 1 });

            expect(validationMessage).toBe("Zoom Level should be greater than one");
        });

        it("returns no alert if there is a map token for mapProvider mapbox", () => {
            const mapToken = random.uuid();
            const validationMessage = validateLocationProps({ mapProvider: "mapBox", mapBoxAccessToken: mapToken });

            expect(validationMessage).toBe("");
        });

        it("returns alert if there is no map token for mapProvider mapbox", () => {
            const validationMessage = validateLocationProps({ mapProvider: "mapBox", mapBoxAccessToken: "" });

            expect(validationMessage).toBe("A Mapbox token is reaquired");
        });

        it("returns no alert if there are no locations", () => {
            const validationMessage = validateLocationProps({ locations: [] });

            expect(validationMessage).toBe("");
        });

        it("returns alert if data source type is context and there is no latitude or longitude", () => {
            const validationMessage = validateLocationProps({
                locations: [ contextLocation as locationDataProps ]
            });

            expect(validationMessage).toBe(`The Latitude attribute and longitude attribute are required for data source
                    context at location 1`);
        });

        it("returns alert if data source type is static and there is no latitude or longitude", () => {
            const validationMessage = validateLocationProps({
                locations: [ staticLocation as locationDataProps ]
            });

            expect(validationMessage).toBe("Invalid static locations. Latitude and longitude are required at location 1");
        });

        it("returns alert if data source type is microflow and there is no microflow", () => {
            const validationMessage = validateLocationProps({
                locations: [ microflowLocation as locationDataProps ]
            });

            expect(validationMessage).toBe("A Microflow is required for Data source Microflow at location 1");
        });
    });

    describe("#ValidLocation", () => {
        it("returns false if location is not valid", () => {
            const location = { latitude: 0, longitude: 0 };
            const checkValidLocation = validLocation(location);

            expect(checkValidLocation).toEqual(false);
        });
    });
});
