var path = require('path');
var webpack = require('webpack');

module.exports = {
	entry: './src/react/index.js',
	output: {
		path: path.resolve(__dirname, 'public/dist'),
		filename: 'bundle.js'
	},
	module: {
		rules: [
			{
				test: /\.js$/,
				loader: 'babel-loader',
				query: {
					presets: ['env','react']
				}
			},
			{
				// For all .css files except from node_modules
				test: /\.css$/,
				exclude: /node_modules/,
				use: [
					'style-loader',
					{ loader: 'css-loader', options: { modules: true } }
				]
			},
			{
				// For all .css files in node_modules
				test: /\.css$/,
				include: /node_modules/,
				use: ['style-loader', 'css-loader']
			}
		]
	},
	stats: {
		colors: true
	},
	devtool: 'source-map'
};
