var path = require('path'),
    webpack = require('webpack'),
    ExtractTextPlugin = require('extract-text-webpack-plugin'),
    UglifyJSPlugin = require('uglifyjs-webpack-plugin'),
    AssetsPlugin = require('assets-webpack-plugin'),
    FileManagerPlugin = require('filemanager-webpack-plugin'),
    WebpackMd5Hash = require('webpack-md5-hash'),
    config = require('./config'),
    CompressionPlugin = require('compression-webpack-plugin'),
    MonacoWebpackPlugin = require('monaco-editor-webpack-plugin')


process.env.BABEL_ENV = 'client'

const overpassTest = /overpass-.*\.(woff2?|ttf|eot|otf)(\?.*$|$)/


module.exports = {
  context: __dirname,
//  stats: { children: false },
  entry: {
    main: ['babel-polyfill', './src/index.js']
  },

  output: {
    filename: '[name].js', 
    path: __dirname + '/dist',
  },

//  externals: Object.assign(PRODUCTION ? prodExternals : {}, {
//    // replace require-server with empty function on client
//    './require-server': 'var function(){}'
//  }),

  module: {
    rules: [
//      {
//        test: [/\.yml$/, /\.yaml$/],
//        include: path.resolve('data'),
//        loader: 'yaml'
//      },
      {
        // Transpile React JSX to ES5
        test: [/\.jsx$/, /\.js$/],
        exclude: /node_modules|\.scss/,
        loader: 'babel-loader?cacheDirectory',
      },
      {
        test: [/\.s?css$/],
        exclude: [path.resolve(__dirname, './node_modules/monaco-editor'), /node_modules\/(?!(@patternfly)\/).*/],
        loader: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: [
            {
              loader: 'css-loader?sourceMap',
              options: {
                minimize: true
              }
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
              options: {
                data: '$font-path: "'+ config.get('contextPath') + '/fonts";'
              }
            }
          ]
        })
      },
      {
        test: /\.woff2?$/,
        loader: 'file-loader?name=fonts/[name].[ext]'
      },
      {
        test: /\.css$/,
        include: path.resolve(__dirname, './node_modules/monaco-editor'),
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.properties$/,
        loader: 'properties-loader'
      },
      {
        test: /\.svg$/,
        include: path.resolve(__dirname, './graphics'),
        use: ['svg-sprite-loader']
      },
      {
        test: /\.yaml$/,
        loader: 'js-yaml-loader'
      },
      {
        test: /\.(png|jpg|jpeg|gif|svg|woff2?|ttf|eot|otf)(\?.*$|$)/,
        exclude: [overpassTest, path.resolve(__dirname, './graphics')],
        loader: 'file-loader',
        options: {
          name: 'assets/[name].[ext]'
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
      filename: 'css/[name].css',
      allChunks: true
    }),
    new UglifyJSPlugin({
      sourceMap: true
    }),
    new webpack.LoaderOptionsPlugin({
      options: {
        eslint: {
          configFile: './.eslintrc.json',
          quiet: true
        }
      }
    }),
    new webpack.LoaderOptionsPlugin({
      options: {
        context: __dirname
      }
    }),
//    new CompressionPlugin({
//      asset: '[path].gz[query]',
//      algorithm: 'gzip',
//      test: /\.js$|\.css$/,
//      minRatio: 1,
//    }),
//    new MonacoWebpackPlugin({
//      languages: ['yaml']
//    }),
    new AssetsPlugin({
      path: path.join(__dirname, 'dist'),
      fullPath: false,
      prettyPrint: true,
      update: true
    }),
    new WebpackMd5Hash(),
    new FileManagerPlugin({
      onEnd: {
        copy: [
          { source: 'graphics/*.svg', destination: 'dist/graphics'},
        ]
      }
    })
  ]
}
