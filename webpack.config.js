// tslint:disable max-line-length
const webpack = require("webpack");
const path = require("path");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const ExtractTextPlugin = require("extract-text-webpack-plugin");
const widgetName = require("./package").widgetName;
const name = widgetName.toLowerCase();

const widgetConfig = {
    entry: {
        LeafletMaps: `./src/components/${widgetName}Container.ts`
    },
    output: {
        path: path.resolve(__dirname, "dist/tmp"),
        filename: `src/com/mendix/widget/custom/${name}/${widgetName}.js`,
        libraryTarget: "umd"
    },
    resolve: {
        extensions: [ ".ts", ".js" ],
        alias: {
            "tests": path.resolve(__dirname, "./tests")
        }
    },
    devtool: "source-map",
    mode: "development",
    module: {
        rules: [ {
                test: /\.ts$/,
                use: "ts-loader"
            },
            {
                test: /\.css$/,
                loader: ExtractTextPlugin.extract({
                    fallback: "style-loader",
                    use: "css-loader"
                })
            },
            {
                test: /\.scss$/,
                loader: ExtractTextPlugin.extract({
                    fallback: "style-loader",
                    use: "css-loader!sass-loader"
                })
            },
            {
                test: /\.(jpe?g|png|gif|svg)$/i,
                loader: [
                    "url-loader"
                ]
            }
        ]
    },
    externals: [ "react", "react-dom" ],
    plugins: [
        new CopyWebpackPlugin([ {
            from: "src/**/*.js"
        }, {
            from: "src/**/*.xml"
        } ], {
            copyUnmodified: true
        }),
        new ExtractTextPlugin({
            filename: `./src/com/mendix/widget/custom/${name}/ui/${widgetName}.css`
        }),
        new webpack.LoaderOptionsPlugin({
            debug: true
        })
    ]
};

const previewConfig = {
    entry: {
        LeafletMaps: `./src/${widgetName}.webmodeler.ts`
    },
    output: {
        path: path.resolve(__dirname, "dist/tmp"),
        filename: `src/${widgetName}.webmodeler.js`,
        libraryTarget: "commonjs"
    },
    resolve: {
        extensions: [ ".ts", ".js" ]
    },
    devtool: "inline-source-map",
    mode: "development",
    module: {
        rules: [ {
                test: /\.ts$/,
                loader: "ts-loader",
                options: {
                    compilerOptions: {
                        "module": "CommonJS",
                    }
                }
            },
            {
                test: /\.css$/,
                use: "raw-loader"
            },
            {
                test: /\.scss$/,
                use: [ {
                        loader: "raw-loader"
                    },
                    {
                        loader: "sass-loader"
                    }
                ]
            }
        ]
    },
    externals: [ "react", "react-dom" ]
};

module.exports = [ widgetConfig, previewConfig ];
