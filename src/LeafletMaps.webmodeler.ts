import { Component, createElement } from "react";
import LeafletMapsContainer, { LeafletMapsContainerProps } from "./components/LeafletMapsContainer";

// tslint:disable-next-line:class-name
export default class preview extends Component<LeafletMapsContainerProps> {
    render() {
        return createElement(LeafletMapsContainer);
    }
}
