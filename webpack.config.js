const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin')

module.exports = {
  devtool: 'inline-source-map',
  entry: './src/index.ts',
  mode: 'development',
  devServer: {
    open: true,
    static: "/",
    // contentBase: path.join(__dirname, 'dist'),
    compress: true,
    port: 4200
  },
  module: {
    rules: [{
        test: /.ts$/,
        exclude: /node_modules/,
        use: 'ts-loader',

      },
      {
        test: /.css?$/,
        loader: 'html-loader'
      }, 
      {
        test: /\.scss$/,
        use: [
            MiniCssExtractPlugin.loader,
            {
              loader: 'css-loader'
            },
            {
              loader: 'sass-loader',
              options: {
                sourceMap: true,
                // options...
              }
            }
          ]
      }
    ]
  },
  resolve: {
    extensions: ['.ts', '.js', '.html', '.css']
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
  },
  plugins: [
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: './src/index.html',
    }),
    new MiniCssExtractPlugin({
      filename: 'css/mystyles.css'
    })
  ]
};