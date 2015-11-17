module.exports = {
  entry: './src/main.js',
  output: {
    filename: './dist/easyChart.js'
  },
  module: {
    loaders: [
      { test: /\.css$/, loader: "style-loader!css-loader" }
    ]
  }
};