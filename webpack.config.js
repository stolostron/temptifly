var path = require('path'),
    webpack = require('webpack'),
    ExtractTextPlugin = require('extract-text-webpack-plugin'),
    FileManagerPlugin = require('filemanager-webpack-plugin')

const overpassTest = /overpass-.*\.(woff2?|ttf|eot|otf)(\?.*$|$)/

module.exports = {
  context: __dirname,
  devtool: 'source-map',
  entry: './src/index.js',
  output: {
    filename: 'index.js',
    path: __dirname + '/dist',
    library: 'TemplateEditor',
    libraryTarget: 'umd',
  },
  module: {
    rules: [
      {
        test: [/\.jsx$/, /\.js$/],
        exclude: /node_modules|\.scss/,
        loader: 'babel-loader?cacheDirectory',
      },
      {
        test: [/\.s?css$/],
        exclude: /node_modules/,
        loader: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: [
            {
              loader: 'css-loader?sourceMap'
            },
            {
              loader: 'postcss-loader?sourceMap',
              options: {
                plugins: function () {
                  return [
                    require('autoprefixer')
                  ]
                },
              }
            },
            {
              loader: 'resolve-url-loader',
              options: {
                sourceMap: true
              }
            },
            {
              loader: 'sass-loader?sourceMap',
            }
          ]
        })
      },
      {
        test: /\.s?css$/,
        include: path.resolve(__dirname, './node_modules/@patternfly'),
        loader: 'null-loader'
      },
      {
        test: /\.(png|jpg|jpeg|gif|svg|woff2?|ttf|eot|otf)(\?.*$|$)/,
        exclude: [overpassTest, path.resolve(__dirname, './graphics')],
        loader: 'null-loader',
      },
      {
        test: [/\.hbs$/],
        loader: 'handlebars-loader',
        query: {
          precompileOptions: {
            knownHelpersOnly: false
          }
        }
      },
      {
        // Resolve to an empty module for overpass fonts included in SASS files.
        // This way file-loader won't parse them. Make sure this is BELOW the
        // file-loader rule.
        test: overpassTest,
        loader: 'null-loader'
      }
    ],
    noParse: [
      // don't parse minified bundles (vendor libs) for faster builds
      /\.min\.js$/
    ]
  },

  plugins: [
    new ExtractTextPlugin({
      filename: 'styles.css',
      allChunks: true
    }),
    new webpack.optimize.LimitChunkCountPlugin({
      maxChunks: 1
    }),
    new FileManagerPlugin({
      onEnd: {
        copy: [
          { source: 'src/index.d.ts', destination: 'dist' }
        ]
      }
    })

  ],

  resolve: {
    alias: {
      'react': path.resolve(__dirname, './node_modules/react'),
      'react-dom': path.resolve(__dirname, './node_modules/react-dom'),
      '@patternfly/react-core': path.resolve(__dirname, './node_modules/@patternfly/react-core'),
    }
  },
  externals: {
    // Don't bundle react or react-dom or patternfly
    react: {
      commonjs: 'react',
      commonjs2: 'react'
    },
    'react-dom': {
      commonjs: 'react-dom',
      commonjs2: 'react-dom'
    },
    '@patternfly/react-core': {
      commonjs: '@patternfly/react-core',
      commonjs2: '@patternfly/react-core',
    }

  }
}
