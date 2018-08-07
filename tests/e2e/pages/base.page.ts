import { Client, Element, RawResult } from "webdriverio";

export class BasePage {
    public get markers(): Client<RawResult<Element[]>> & RawResult<Element[]> {
        return browser.elements(".mx-name-leafletMaps1 > leaflet-pane.leaflet-marker-pane > img");
    }
}
