import { mount, shallow } from "enzyme";
import { createElement } from "react";
import { LeafletMap, LeafletMapProps } from "../LeafletMap";
import { Alert } from "../Alert";

describe("Leaflet maps", () => {
    const defaultProps: LeafletMapProps = {
        autoZoom: true,
        defaultCenterLatitude: "",
        defaultCenterLongitude: "",
        height: 75,
        heightUnit: "pixels",
        optionDrag: true,
        optionScroll: true,
        optionZoomControl: true,
        zoomLevel: 10,
        width: 50,
        widthUnit: "pixels"
    };

    const renderLeafletMap = (props: LeafletMapProps) => shallow(createElement(LeafletMap, props));
    const fullRenderLeafletMap = (props: LeafletMapProps) => mount(createElement(LeafletMap, props));

    it("renders structure correctly", () => {
        const leafletMap = renderLeafletMap(defaultProps);

        expect(leafletMap).toBeElement(
            createElement("div", {},
                createElement(Alert, { className: "widget-leaflet-maps-alert leaflet-control" }),
                createElement("div", { className: "widget-leaflet-maps-wrapper", style: {} },
                    createElement("div", { className: "widget-leaflet-maps" })
                )
            )
        );
    });

    it("with default center Latitude and Longitude sets default center location based on them", () => {
        const leafletMap = fullRenderLeafletMap(defaultProps);
        leafletMap.setProps({
            defaultCenterLatitude: "39.90419989999999",
            defaultCenterLongitude: "116.40739630000007"
        });

        expect(leafletMap.state("center")).toEqual({ lat: 39.90419989999999, lng: 116.40739630000007 });
    });

    it("without default center Latitude and Longitude sets default center location based on the default configured location", () => {
        const leafletMap = fullRenderLeafletMap(defaultProps);
        leafletMap.setProps({
            fetchingData: false
        });

        expect(leafletMap.state("center")).toEqual({ lat: 51.9107963, lng: 4.4789878 });
    });

    it("creates markers when locations are provided", () => {
        const leafletMap = fullRenderLeafletMap(defaultProps);
        leafletMap.setProps({
            fetchingData: false
        });

        expect(leafletMap.state("center")).toEqual({ lat: 51.9107963, lng: 4.4789878 });
    });

    it("un mounts from the dom when unmounted", () => {
        const leafletMap = renderLeafletMap(defaultProps);
        const leafletInstance = leafletMap.instance() as any;
        const componentWillUnmount = spyOn(leafletInstance, "componentWillUnmount").and.callThrough();

        leafletInstance.map = document.createElement("div");
        leafletMap.unmount();

        expect(componentWillUnmount).toHaveBeenCalled();
    });

    it("creates markers from given locations", () => {
        const customProps = {
            ...defaultProps,
            allLocations: [ { latitude: 40.759011, longitude: -73.9844722, mxObject: undefined, url: "http://dummy.url" } ],
            fetchingData: false
        };
        const leafletMap = fullRenderLeafletMap(customProps);
        const leafletMapInstance = leafletMap.instance() as any;
        const createMarkerSpy = spyOn(leafletMapInstance, "renderMarkers").and.callThrough();
        leafletMapInstance.componentWillReceiveProps(customProps);

        expect(createMarkerSpy).toHaveBeenCalledWith(customProps.allLocations);
    });

});
