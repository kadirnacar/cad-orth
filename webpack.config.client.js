const path = require('path');
const webpack = require('webpack');
var autoprefixer = require('autoprefixer');
var HtmlWebpackPlugin = require("html-webpack-plugin");
var WriteFilePlugin = require('write-file-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');

const vendorsExtractPlugin = new MiniCssExtractPlugin({
    filename: 'style.css',
    allChunks: true
});

module.exports = (env) => {
    const isDevBuild = !(env && env.prod);
    const isBundle = env && env.bundle;
    const isHot = env && env.hot;

    const config = {
        devServer: {
            host: 'localhost',
            port: 4000,
            hot: true,
            inline: true,
            contentBase: path.resolve(__dirname, 'dist'),
            historyApiFallback: true,
            publicPath: "/",
            watchContentBase: true,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
                "Access-Control-Allow-Headers": "X-Requested-With, content-type, Authorization"
              }
        },
        devtool: isDevBuild ? 'source-map' : 'hidden-source-map',
        mode: isDevBuild ? 'development' : 'production',
        // stats: {
        //     modules: false
        // },
        resolve: {
            extensions: ['.js', '.jsx', '.ts', '.tsx']
        },
        entry: {
            'index': ['./src/boot-client.tsx']
        },
        module: {
            rules: [{
                    test: /\.tsx?$/,
                    include: [/src/, /dbmodels/],
                    use: [{
                        loader: 'awesome-typescript-loader',
                        options: {
                            silent: true,
                            configFileName: './tsconfig.json',
                            useBabel: true,
                            babelOptions: {
                                babelrc: false,
                                presets: [
                                    ["env", {
                                        "targets": {
                                            "node": "current"
                                        }
                                    }]
                                ]
                            },
                        },
                    }]
                },
                {
                    test: /\.css$/,

                    use: [{
                            loader: MiniCssExtractPlugin.loader,
                            options: {
                                sourceMap: isDevBuild,
                                minimize: !isDevBuild
                            }
                        },
                        {
                            loader: 'css-loader',
                            options: {
                                sourceMap: isDevBuild,
                                minimize: !isDevBuild
                            }
                        },
                        {
                            loader: 'postcss-loader',
                            options: {
                                plugins: () => [autoprefixer]
                            }
                        }
                    ]
                },
                {
                    test: /\.scss$/,
                    use: [{
                            loader: MiniCssExtractPlugin.loader,
                            options: {
                                sourceMap: isDevBuild,
                                minimize: !isDevBuild
                            }
                        }, {
                            loader: 'css-loader',
                            options: {
                                sourceMap: isDevBuild,
                                minimize: !isDevBuild
                            }
                        },
                        {
                            loader: 'postcss-loader',
                            options: {
                                plugins: () => [autoprefixer]
                            }
                        },
                        "sass-loader"
                    ]
                },
                {
                    test: /\.(png|jpg|jpeg|gif|bmp)$/,
                    use: 'file-loader?limit=100000&name=img/[name].[ext]'
                },
                {
                    test: /\.woff?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
                    use: "file-loader?limit=100000&name=fonts/[name].[ext]&mimetype=application/font-woff"
                },
                {
                    test: /\.woff2?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
                    use: "file-loader?limit=100000&name=fonts/[name].[ext]&mimetype=application/font-woff"
                },
                {
                    test: /\.eot?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
                    use: "file-loader?limit=100000&name=fonts/[name].[ext]&mimetype=application/vnd.ms-fontobject"
                },
                {
                    test: /\.[ot]tf?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
                    use: "file-loader?limit=100000&name=fonts/[name].[ext]&mimetype=application/octet-stream"
                },
                {
                    test: /\.svg?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
                    use: "file-loader?limit=100000&name=fonts/[name].[ext]&mimetype=image/svg+xml"
                },
                { test: /\.(glsl|frag|vert)$/, use: 'raw-loader' },
                { test: /\.(glsl|frag|vert)$/, use: 'glslify-loader' }
            ]
        },
        output: {
            path: path.resolve(__dirname, isHot ? "" : "dist"),
            publicPath: "/",
            filename: 'js/[name].js',
            hotUpdateChunkFilename: isHot ? "" : "dist/" + 'hot/hot-update.js',
            hotUpdateMainFilename: isHot ? "" : "dist/" + 'hot/hot-update.json'
        },
        optimization: {
            splitChunks: {
                cacheGroups: {
                    commons: {
                        chunks: "initial",
                        minChunks: 2,
                        maxInitialRequests: 5, // The default limit is too small to showcase the effect
                        minSize: 0 // This is example is too small to create commons chunks
                    },
                    vendor: {
                        test: (module) => {
                            if (module.resource && (/^.*\.(css|scss|sass)$/).test(module.resource)) {
                                return false;
                            }
                            return module.context && module.context.indexOf("node_modules") !== -1;
                        },
                        chunks: "initial",
                        name: "vendor",
                        priority: 10,
                        enforce: true
                    }
                }
            },
            // minimizer: [
            //     isDevBuild ? null : new UglifyJSPlugin({
            //         uglifyOptions: {
            //             beautify: false,
            //             compress: true,
            //             comments: false,
            //             mangle: false,
            //             toplevel: false,
            //             keep_classnames: true, // <-- doesn't exist, I guess. It's in harmony branch
            //             keep_fnames: true //
            //         }
            //     })
            // ]
        },
        plugins: [
                new MonacoWebpackPlugin(),
                vendorsExtractPlugin,
                new WriteFilePlugin(),
                // new webpack.NoEmitOnErrorsPlugin(),
                // new CleanWebpackPlugin(['*'], {
                //     root: path.resolve(".", "dist"),
                //     exclude: ['main.js'],
                //     verbose: true,
                //     dry: false
                // }),
                new HtmlWebpackPlugin({
                    filename: path.resolve(".", 'dist/index.html'),
                    template: path.resolve(".", 'index.html'),
                    inject: true,
                    cache: false
                }),
                // new MiniCssExtractPlugin({
                //     filename: "[name]-[hash].css",
                //     chunkFilename: '[name]-[hash].css'
                // }),
                new webpack.optimize.OccurrenceOrderPlugin(),
                new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
                new webpack.DefinePlugin({
                    'process.env.NODE_ENV': isDevBuild ? '"development"' : '"production"'
                })
            ]
            .concat(isHot ? [new webpack.HotModuleReplacementPlugin()] : [])
            .concat(isDevBuild ? [
                new webpack.LoaderOptionsPlugin({
                    debug: true,
                    options: {
                        debug: true,
                        cache: true
                    }
                })
            ] : [
                new webpack.LoaderOptionsPlugin({
                    debug: false,
                    options: {
                        debug: false,
                        cache: true
                    }
                })
            ])
    };

    return config;
};