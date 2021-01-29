var path = require('path'),
    webpack = require('webpack'),
    MiniCssExtractPlugin = require('mini-css-extract-plugin'),
    FileManagerPlugin = require('filemanager-webpack-plugin')

const overpassTest = /overpass-.*\.(woff2?|ttf|eot|otf)(\?.*$|$)/

module.exports = {
  context: __dirname,
  devtool: 'source-map',
  entry: {
    'main': ['@babel/polyfill', './src/index.js']
  },
  output: {
    filename: 'index.js',
    path: __dirname + '/dist',
    library: 'TemplateEditor',
    libraryTarget: 'umd',
  },
  module: {
    rules: [
      {
        // Transpile React JSX to ES5
        test: [/\.jsx$/, /\.js$/],
        exclude: /node_modules|\.scss/,
        loader: 'babel-loader?cacheDirectory',
        options: {
          presets: ['@babel/preset-env', '@babel/preset-react'],
          plugins: ['@babel/plugin-proposal-class-properties']
        }
      },
      {
        test: [/\.s?css$/],
        exclude: /node_modules/,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: {
              sourceMap: true,
            },
          },
          {
            loader: 'postcss-loader?sourceMap',
            options: {
              plugins: function () {
                return [
                  require('autoprefixer')
                ]
              },
            },
          },
          {
            loader: 'resolve-url-loader',
            options: {
              sourceMap: true
            }
          },
          {
            loader: 'sass-loader?sourceMap',
          },
        ],
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
    new MiniCssExtractPlugin({
      filename: 'styles.css',
      allChunks: true
    }),
    new webpack.optimize.LimitChunkCountPlugin({
      maxChunks: 1
    }),
    new FileManagerPlugin({
      events: {
        onEnd: {
          copy: [{ source: './src/index.d.ts', destination: './dist/index.d.ts' }],
        }
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
