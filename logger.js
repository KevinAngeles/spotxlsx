const moment = require('moment');
const winston = require("winston");
require("winston-daily-rotate-file");

const level = process.env.LOG_LEVEL || 'debug';

const currentMoment = moment().format('YYYY-MM-DDTHH:mm:ss.SSSZZ');

/**
 * Summary. JavaScript Object with functions that return different formats.
 *
 * Description. The Object 'getFormat' has the functions 'console' and 'json' that returns the respective formats
 * for the logs.
 *
 *
 * @param {Object}  info       Info.
 * 
 * @return {string} or {JSON}
 */
const getFormat = {
	console: info => {
		return `[${getLabelFromLevel(info.level, info.label)}] ${info.level}: ${info.message} (${currentMoment})`;
	},
	json: info => {
		return JSON.stringify({
			label: getLabelFromLevel(info.level, info.label),
			level: info.level,
			message: info.message,
			timestamp: currentMoment
		});
	}
}

/**
 * Summary. Function that returns a label.
 *
 * Description. The function returns a label based on the level. If the level starts with 'HTTP',
 * it means that it handles all the HTTP requests and HTTP errors. Otherwise, it returns the defaultLabel
 * passed in the parameter.
 *
 *
 * @param {string}  lvl                Level.
 * @param {string}  defaultLabel       Default label.
 * 
 * @return {Response}
 */
const getLabelFromLevel = (lvl, defaultLabel) => {
	if( ((typeof lvl === 'string') || (lvl instanceof String)) && (lvl.indexOf("HTTP", 0) !== -1) ) {
		return 'HTTP';
	}
	return defaultLabel;
};

const config = { 
	colors: {
		error: 'bold red',
		warn: 'bold yellow',
		HTTPerror: 'red',
		HTTPinfo: 'bold gray',
		info: 'bold green',
		verbose: 'bold cyan',
		debug: 'bold blue',
		silly: 'bold magenta'
	},
	format: {
		console: winston.format.printf( info => { return getFormat.console(info) } ),
		json: winston.format.printf( info => { return getFormat.json(info) } )
	},
	levels: {
		error: 0,
		warn: 1,
		HTTPerror: 2,
		HTTPinfo: 3,
		info: 4,
		verbose: 5,
		debug: 6,
		silly: 7
	}
};

// Select only 'error' and 'HTTPerror'
const errorAndHTTPerrorFilter = winston.format( info => { 
	return info.level === 'error' || info.level === 'HTTPerror' ? info : false
});

const logger = winston.createLogger({
	levels: config.levels,
	transports: [
		new winston.transports.Console({
			level: level,
			handleExceptions: true, // Unhandled exception will be shown in the console
			format: winston.format.combine(
				winston.format.label({ label: "LOGGER" }),
				// Order is important, colorize should be first, 
				// then should be the customized format
				winston.format.colorize({all: true}),
				config.format.console
			),
		}),
		new winston.transports.DailyRotateFile({
			name: 'Info logs',
			filename: 'infologs/application-%DATE%.log',
			datePattern: 'YYYY-MM-DD',
			zippedArchive: true,
			maxSize: '128m',
			maxFiles: '14d',
			json: true,
			colorize: false,
			level: 'info',
			format: winston.format.combine(
				winston.format.label({ label: "LOGGER" }),
				winston.format.timestamp(),
				config.format.json
			)
		}),
		new winston.transports.DailyRotateFile({
			name: 'Error logs',
			filename: 'errorlogs/application-%DATE%.log',
			handleExceptions: true, // Unhandled exceptions will be logged in this file
			datePattern: 'YYYY-MM-DD',
			zippedArchive: true,
			maxSize: '128m',
			maxFiles: '14d',
			json: true,
			colorize: false,
			level: 'HTTPerror',
			format: winston.format.combine(
				errorAndHTTPerrorFilter(),
				winston.format.label({ label: "LOGGER" }),
				winston.format.timestamp(),
				config.format.json
			)
		})
	],
	exitOnError: false, // Do not exit on handled exceptions
});

winston.addColors(config.colors);

logger.streamHTTPInfo = {
	write: (message, enconding) => {
		logger.HTTPinfo(message);
	}
}

logger.streamHTTPError = {
	write: (message, enconding) => {
		logger.HTTPerror(message);
	}
}

module.exports = logger;