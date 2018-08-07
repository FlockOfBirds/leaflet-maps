import singleLocationPage from "./pages/singleLocation.page";
import xpathPage from "./pages/xpath.page";

describe("Leaflet maps", () => {
    const alertValue = "Invalid Coordinates were passed";

    it("should show single location", () => {
        singleLocationPage.open();
        singleLocationPage.markers.waitForVisible();

        const markerList: WebdriverIO.Element[] = singleLocationPage.markers.value;
        expect(markerList.length).toBe(1);
    });

    it("with wrong coodinates should show an alert message", () => {
        singleLocationPage.open();
        singleLocationPage.latitude.waitForExist();
        singleLocationPage.longitude.waitForExist();

        singleLocationPage.latitude.click();
        singleLocationPage.latitude.setValue("2");
        singleLocationPage.longitude.click();
        singleLocationPage.longitude.setValue("200");
        singleLocationPage.longitudeLabel.click();

        singleLocationPage.alert.waitForExist();
        const alert = singleLocationPage.alert.getText();

        expect (alert).toBe(alertValue);
    });

    it("when xpath selected should show locations", () => {
        xpathPage.open();
        xpathPage.getGrid(1).waitForVisible();
        xpathPage.getGridRow(0).waitForVisible();
        xpathPage.getGridRow(0).click();
        xpathPage.markers.waitForVisible();

        browser.waitUntil(() => {
            const markerList: WebdriverIO.Element[] = xpathPage.markers.value;

            return markerList.length > 1;
        }, 5000, "expected more than 1 marker to be populated");
    });
});
