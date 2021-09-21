const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const webpack = require("webpack");

const dist = path.resolve(__dirname, "dist");
const isS3Build = process.env.S3 !== undefined;
const isProduction = process.env.NODE_ENV === "production";
const publicPath = isS3Build ? process.env.CDN_URL + "/" : "/";

module.exports = {
  mode: isProduction ? "production" : "development",
  entry: "./src/entry.js",
  output: {
    path: dist,
    publicPath,
    filename: "[name]-[chunkhash].js",
  },
  experiments: {
    syncWebAssembly: true,
  },
  plugins: [
    new HtmlWebpackPlugin({ template: "index.html" }),
    new webpack.DefinePlugin({
      "process.env": JSON.stringify({}),
    }),
  ],
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader", "postcss-loader"],
      },
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: ["babel-loader"],
      },
    ],
  },
  resolve: {
    fallback: {
      util: require.resolve("util/"),
      path: false,
    },
  },
};
