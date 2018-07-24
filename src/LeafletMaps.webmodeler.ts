import { Component, createElement } from "react";
import LeafletMapsContainer from "./components/LeafletMapsContainer";
import { Container } from "./components/Utils/ContainerUtils";
import LeafletMapsContainerProps = Container.LeafletMapsContainerProps;

// tslint:disable-next-line:class-name
export default class preview extends Component<LeafletMapsContainerProps> {
    render() {
        return createElement(LeafletMapsContainer);
    }
}
