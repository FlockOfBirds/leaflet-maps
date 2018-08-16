# Leaflet Maps
![Banner](https://raw.githubusercontent.com/mendix/Leaflet/master/assets/app_store_banner.png)

Add different type of maps to your application, using [Leaflet.js](http://leafletjs.com/)

## Available map types
* Open street
* Map box

## Features
* Show locations on the Map based on Coordinates
* Data sources Context, Static, XPath and Micrflow
* Customise the display of the markers, For dynamic image markers, upload an image. If no marker is specified the default marker icon is used
* Support for Multiple data sources
* Support actions when a marker is clicked:
    * Open Page
    * Call Microflow
    * Call Nanoflow

## Limitations
* You need to be online inorder to the view the map.
* Addresses are not supported.

For Map types like Mapbox you need to have a token inorder to view the map. You can get the token from here
[MapBox](https://www.mapbox.com)

## Dependencies
* Mendix 7.16.0

## How it Works
* Locations are displayed based on coordinates. if there are multiple locations the Map will center to a position in which all markers are visible.
* If there is one location, the Map will center to that location.
* If no locations available, a default center location of the mendix offices is provided in case default center coordinates are not specified.
* If autozoom is enabled the Map will use bounds zoom otherwise it will use a custom zoom level specified.
* Min Zoom level is 2 and the Maximum is 20.

## Demo Project

[https://leafletmaps.mxapps.io/](https://leafletmaps.mxapps.io/)

![Running leaflet maps widget](/assets/map.png)

## Usage
![Modeler setup leaflet maps widget](/assets/usage.png)

![Locations](/assets/datasource.png)
### Data source: Static
- On the **Data source** tab, select **new** on the **locations** option
- Select **Static** under **Database/Microflow**
- On the **Static** tab add new static locations

### Data source: Xpath
- On the **Data source** tab, select **new** on the **locations** option
- Select **Database**, Add the **locations** entity
- Add the **Latitude** and **Longitude** attributes
- Add an **XPath Constraint** `Optional`

### Custom Markers
-  It is used to configure how the marker icon should be look.
- Select the **Markers** tab under **locations** option on the **Data source** tab
- For the **static image** option, upload a static image
- For Dynamic marker images, upload an image into the database to view the map during runtime.

## Issues, suggestions and feature requests
We are actively maintaining this widget, please report any issues or suggestion for improvement at  
[https://github.com/FlockOfBirds/leaflet-maps/issues](https://github.com/FlockOfBirds/leaflet-maps/issues).

## Development
See [here](/Development.md)
