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
                // TODO Fix script added multiple times.
                const scriptElement = document.createElement("script");
                scriptElement.async = true;
                scriptElement.defer = true;
                scriptElement.type = "text/javascript";
                scriptElement.id = "googleScript";
                scriptElement.src = googleScript + this.props.apiToken + `&libraries=places`;
                scriptElement.onerror = (err) => reject(`Failed due to ${err.message}`);
                scriptElement.onload = () => {
                    if (typeof google === "object" && typeof google.maps === "object") {
                        resolve();
                    }
                };
                document.body.appendChild(scriptElement);
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
