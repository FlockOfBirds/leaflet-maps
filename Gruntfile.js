"use strict";
const webpack = require("webpack");
const webpackConfig = require("./webpack.config");
const merge = require("webpack-merge");
const widgetNames = Object.keys(webpackConfig[0].entry);

const webpackConfigRelease = webpackConfig.map(config => merge(config, {
    devtool: false,
    mode: "production",
    optimization: {
        minimize: true
    }
}));

module.exports = function(grunt) {
    const pkg = grunt.file.readJSON("package.json");
    const packageName = pkg.widgetName;
    grunt.initConfig({

        watch: {
            updateWidgetFiles: {
                files: [ "./src/**/*", "src/**/*" ],
                tasks: [ "webpack:develop", "file_append", "compress", "copy" ],
                options: {
                    debounceDelay: 250
                }
            }
        },

        compress: {
            dist: {
                options: {
                    archive: `./dist/${pkg.version}/${packageName}.mpk`,
                    mode: "zip"
                },
                files: [ {
                    expand: true,
                    date: new Date(),
                    store: false,
                    cwd: "./dist/tmp/src",
                    src: [ "**/*" ]
                } ]
            }
        },

        copy: {
            distDeployment: {
                files: [
                    {
                        dest: "./dist/MxTestProject/deployment/web/widgets",
                        cwd: "./dist/tmp/src/",
                        src: [ "**/*" ],
                        expand: true
                    }
                ]
            },
            mpk: {
                files: [
                    {
                        dest: "./dist/MxTestProject/widgets",
                        cwd: `./dist/${pkg.version}/`,
                        src: [ packageName + ".mpk" ],
                        expand: true
                    }
                ]
            }
        },

        file_append: {
            addSourceURL: {
                files: {
                    append: `\n\n//# sourceURL=${packageName}.webmodeler.js\n`,
                    input: `dist/tmp/src/${packageName.toLowerCase()}/${packageName}.webmodeler.js`
                }
                }
        },

        webpack: {
            develop: webpackConfig,
            release: webpackConfigRelease
        },

        clean: {
            build: [
                `./dist/${pkg.version}/${packageName}/*`,
                "./dist/tmp/**/*",
                "./dist/tsc/**/*",
                "./dist/testresults/**/*",
                `./dist/MxTestProject/deployment/web/widgets/${packageName}/*`,
                `./dist/MxTestProject/widgets/${packageName}.mpk`
            ]
        },

        checkDependencies: {
            this: {}
        }
    });

    grunt.loadNpmTasks("grunt-check-dependencies");
    grunt.loadNpmTasks("grunt-contrib-clean");
    grunt.loadNpmTasks("grunt-contrib-compress");
    grunt.loadNpmTasks("grunt-file-append");
    grunt.loadNpmTasks("grunt-contrib-copy");
    grunt.loadNpmTasks("grunt-contrib-watch");
    grunt.loadNpmTasks("grunt-webpack");

    grunt.registerTask("default", [ "clean build", "watch" ]);
    grunt.registerTask(
        "clean build",
        "Compiles all the assets and copies the files to the dist directory.",
        [ "checkDependencies", "clean:build", "webpack:develop", "file_append", "compress", "copy:mpk" ]
    );
    grunt.registerTask(
        "release",
        "Compiles all the assets and copies the files to the dist directory. Minified without source mapping",
        [ "checkDependencies", "clean:build", "webpack:release", "file_append", "compress", "copy:mpk" ]
    );
    grunt.registerTask("build", [ "clean build" ]);
};
