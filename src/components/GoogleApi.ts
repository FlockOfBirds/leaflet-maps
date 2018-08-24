import { Component, ComponentType, createElement } from "react";
import { GoogleMapsProps } from "./GoogleMap";

export interface GoogleApiWrapperState {
    scriptsLoaded?: boolean;
    alertMessage?: string;
}

const googleApiWrapper = (script: string) => <P extends GoogleMapsProps>(wrappedComponent: ComponentType<P>) => {
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
            this.scriptLoaded(script);
        }

        private loadScript = (googleScript: string): Promise<HTMLElement> =>
            new Promise((resolve, reject) => {
                const scriptElement = document.createElement("script");
                scriptElement.async = true;
                scriptElement.type = "text/javascript";
                scriptElement.src = googleScript + this.props.apiToken;
                scriptElement.onerror = (err) => reject(`Failed due to ${err.message}`);
                scriptElement.onload = () => resolve();
                const scriptExists = document.querySelectorAll(`[src="${googleScript + this.props.apiToken}"]`).length;
                if (!scriptExists) {
                    document.body.appendChild(scriptElement);
                } else {
                    this.setState({ scriptsLoaded: true });
                }
            })

        private scriptLoaded = (googleScript: string) => {
            this.loadScript(googleScript)
                .then(() => this.setState({ scriptsLoaded: true }))
                .catch(error => this.setState({ alertMessage: `Failed due to ${error.message}` }));
        }

    }

    return GoogleApiWrapperComponent;
};

export default googleApiWrapper;
