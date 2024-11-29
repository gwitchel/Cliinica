const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin'); // Add this line
const webpack = require('webpack'); // Import webpack

module.exports = {
    mode: 'development',
    entry: './src/index.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'bundle.js',
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: './src/index.html',  // Ensure this points to your HTML file
            filename: 'index.html',
        }),
        new webpack.ProvidePlugin({
            process: 'process/browser',
            Buffer: ['buffer', 'Buffer']
        })
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
                // CSS Rule
                test: /\.css$/,                // Match .css files
                use: ['style-loader', 'css-loader']  // Use style-loader and css-loader for CSS files
            }
        ],
    },
    resolve: {
        extensions: ['.js', '.jsx'],
        fallback: {
            "fs": require.resolve("browserify-fs"),
            "stream": require.resolve("stream-browserify"),
            "util": require.resolve("util/"),
            "buffer": require.resolve("buffer/"),
            "path": require.resolve("path-browserify"),
            "process": require.resolve("process/browser"),
            "os": require.resolve("os-browserify/browser")
        }
    },
    devServer: {
        contentBase: path.join(__dirname, 'dist'),
        compress: true,
        port: 3000,
    },
};
