import { Component, ComponentType, createElement } from "react";
import { GoogleMapsProps } from "./GoogleMap";

export interface GoogleApiWrapperState {
    scriptsLoaded?: boolean;
    alertMessage?: string;
}

const googleApiWrapper = (script?: string) => <P extends GoogleMapsProps>(wrappedComponent: ComponentType<P>) => {
    class GoogleApiWrapperComponent extends Component<P, GoogleApiWrapperState> {
        readonly state: GoogleApiWrapperState = { scriptsLoaded: false, alertMessage: "" };

        render() {
            const props = {
                ...this.state,
                ...this.props as GoogleMapsProps
            };

            return createElement(wrappedComponent, { ...props as any });
        }

        componentDidMount() {
            if (!this.state.scriptsLoaded) {
                this.loadScript(script);
            }
        }

        private loadScript = (googleScript?: string) => {
            if (googleScript) {
                document.body.appendChild(Object.assign(
                    document.createElement("script"), {
                        type: "text/javascript",
                        src: googleScript + this.props.googleMapsToken,
                        onload: () => this.setState({ scriptsLoaded: true }),
                        onerror: () => this.setState({ alertMessage: "Could not load. Please check your internet connection" })
                    }));
            }
        }

    }

    return GoogleApiWrapperComponent;
};

export default googleApiWrapper;
