const webpack = require("webpack");
const path = require("path");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const ExtractTextPlugin = require("extract-text-webpack-plugin");
const widgetName = require("./package").widgetName;
const name = widgetName.toLowerCase();

const widgetConfig = {
    entry: {
        Maps: `./src/components/${widgetName}Container.ts`
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
    devtool: "eval",
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
                test: /\.(png|jpg|gif|svg|eot|ttf|woff|woff2)$/,
                loader: "url-loader"
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
            filename: `./src/com/mendix/widget/custom/${name}/ui/[name].css`
        }),
        new webpack.LoaderOptionsPlugin({
            debug: true
        })
    ]
};

const previewConfig = {
    entry: `./src/${widgetName}.webmodeler.ts`,
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
        rules:
        [
            { test: /\.ts$/, loader: "ts-loader" },
            { test: /\.css$/, use: "raw-loader" }
        ]
    },
    plugins: [
        new webpack.LoaderOptionsPlugin({ debug: true })
    ],
    externals: [ "react", "react-dom" ]
};

module.exports = [ widgetConfig, previewConfig ];
