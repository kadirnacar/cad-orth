const path = require('path');
const webpack = require('webpack');
const merge = require('webpack-merge');
const clientConfig = require('./webpack.config.client');

module.exports = (env) => {
    console.log(env);
    if (env.client)
        return clientConfig(env);
};