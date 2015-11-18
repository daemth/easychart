module.exports = {
  entry: './src/main.js',
  output: {
    filename: './dist/easychart.js'
  },
  module: {
    loaders: [
      { test: /\.css$/, loader: "style-loader!css-loader" }
    ]
  }
};