const path = require('path');
const oryx = require('@spryker/oryx');
const webpack = require('webpack');
const autoprefixer = require('autoprefixer');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');

function getConfiguration(settings) {
    let mode = 'development';
    let devtool = 'inline-source-map';
    let postCssPlugins = [];

    if (settings.options.isProduction) {
        mode = 'production';
        devtool = false;

        postCssPlugins = [
            autoprefixer({
                browsers: ['last 4 versions']
            })
        ];
    }

    let config = {
        context: settings.paths.rootDir,
        mode,
        devtool,
        stats: settings.options.isVerbose ? 'verbose' : 'errors-only',
        watch: settings.options.isWatching,
        watchOptions: {
            aggregateTimeout: 300,
            poll: 500,
            ignored: /(node_modules)/
        },

        entry: oryx.find(settings.entry),

        output: {
            path: settings.paths.publicDir,
            filename: './js/[name].js'
        },

        resolve: {
            modules: oryx.find(settings.resolveModules, []).concat([
                'node_modules/@spryker/oryx-for-zed/node_modules',
                'node_modules',
                settings.paths.sourcePath,
                settings.paths.bundlesPath
            ]),
            extensions: ['.js', '.css', '.scss'],
            alias: {
                ZedGui: `${settings.paths.guiFolder}/assets/Zed/js/modules/commons`,
                ZedGuiEditorConfiguration: `${settings.paths.guiFolder}/assets/Zed/js/modules/editor`,
                ZedGuiModules: `${settings.paths.guiFolder}/assets/Zed/js/modules`
            }
        },

        resolveLoader: {
            modules: [
                'node_modules/@spryker/oryx-for-zed/node_modules',
                'node_modules'
            ]
        },

        module: {
            rules: [
                {
                    test: /(jquery-migrate)/,
                    use: 'imports-loader?define=>false'
                },
                {
                    test: /\.s?css/i,
                    use: [
                        MiniCssExtractPlugin.loader,
                        {
                            loader: 'css-loader',
                            options: {
                                importLoaders: 1
                            }
                        },
                        {
                            loader: 'postcss-loader',
                            options: {
                                ident: 'postcss',
                                plugins: postCssPlugins
                            }
                        },
                        {
                            loader: 'resolve-url-loader'
                        },
                        {
                            loader: 'sass-loader',
                            options: {
                                sourceMap: true
                            }
                        }
                    ]
                },
                {
                    test: /\.(ttf|woff2?|eot|svg|otf)\??(\d*\w*=?\.?)+$/i,
                    use: [{
                        loader: 'file-loader',
                        options: {
                            name: '/fonts/[name].[ext]',
                            publicPath: settings.paths.publicPath
                        }
                    }]
                },
                {
                    test: /\.(jpe?g|png|gif|svg)\??(\d*\w*=?\.?)+$/i,
                    use: [{
                        loader: 'file-loader',
                        options: {
                            name: '/img/[name].[ext]',
                            publicPath: settings.paths.publicPath
                        }
                    }]
                }
            ]
        },

        optimization: {
            runtimeChunk: {
                name: 'spryker-zed-gui-commons'
            },
            concatenateModules: false,
            splitChunks: {
                cacheGroups: {
                    default: false,
                    vendors: false,
                    commons: {
                        name: 'spryker-zed-gui-commons'
                    }
                }
            }
        },

        plugins: [
            new webpack.DefinePlugin({
                DEV: !settings.options.isProduction,
                WATCH: settings.options.isWatching,
                'require.specified': 'require.resolve'
            }),

            new webpack.ProvidePlugin({
                // jquery global
                $: 'jquery',
                jQuery: 'jquery',

                // legacy provider
                SprykerAjax: `${settings.paths.guiFolder}/assets/Zed/js/modules/legacy/SprykerAjax`,
                SprykerAjaxCallbacks: `${settings.paths.guiFolder}/assets/Zed/js/modules/legacy/SprykerAjaxCallbacks`,
                SprykerAlert: `${settings.paths.guiFolder}/assets/Zed/js/modules/legacy/SprykerAlert`
            }),

            new MiniCssExtractPlugin({
                filename: `./css/[name].css`,
            })
        ]
    };

    if (settings.options.isProduction) {
        config.optimization = {
            ...config.optimization,

            minimizer: [
                new UglifyJsPlugin({
                    cache: true,
                    parallel: true,
                    sourceMap: false,
                    uglifyOptions: {
                        ecma: 5,
                        output: {
                            comments: false,
                            beautify: false
                        }
                    }
                }),

                new OptimizeCSSAssetsPlugin({
                    cssProcessorOptions: {
                        discardComments: {
                            removeAll: true
                        }
                    }
                })
            ]
        };
    }

    return config;
}

module.exports = getConfiguration;
