const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const webpack = require("webpack");

const dist = path.resolve(__dirname, "dist");

const isProduction = process.env.NODE_ENV === "production";
const publicPath = isProduction
  ? "https://oso-web-demo.s3.us-west-2.amazonaws.com/bundle-[hash]/"
  : "/";
const outputPath = isProduction ? path.join(dist, "bundle-[hash]") : dist;

module.exports = {
  mode: isProduction ? "production" : "development",
  entry: "./src/index.js",
  output: {
    path: outputPath,
    publicPath,
    filename: "bundle.js",
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
    fallback: { util: require.resolve("util"), path: false },
  },
};
