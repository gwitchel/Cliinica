const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');

module.exports = (env, argv) => ({
    mode: argv.mode || 'development', // Use the mode from CLI arguments
    entry: './src/index.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'bundle.js',
        clean: true,
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: './src/index.html', // Points to your React HTML template
            filename: 'index.html',
        }),
        new webpack.ProvidePlugin({
            process: 'process/browser',
            Buffer: ['buffer', 'Buffer'],
        }),
    ],
    module: {
        rules: [
            {
                test: /\.(js|jsx)$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env', '@babel/preset-react'],
                    },
                },
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader'],
            },
        ],
    },
    resolve: {
        extensions: ['.js', '.jsx'],
        fallback: {
            fs: require.resolve('browserify-fs'),
            stream: require.resolve('stream-browserify'),
            util: require.resolve('util/'),
            buffer: require.resolve('buffer/'),
            path: require.resolve('path-browserify'),
            process: require.resolve('process/browser'),
            os: require.resolve('os-browserify/browser'),
        },
    },
    devServer: {
        static: path.join(__dirname, 'dist'),
        compress: true,
        port: 3000,
    },
    devtool: argv.mode === 'production' ? false : 'source-map', // Enable source maps for dev
});
