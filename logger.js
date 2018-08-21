const moment = require('moment');
const winston = require("winston");

const level = process.env.LOG_LEVEL || 'debug';

const currentMoment = moment().format('YYYY-MM-DDTHH:mm:ss.SSSZZ');

const customFormat = {
	console: winston.format.printf( info => {
			return `[${info.label}] ${info.level}: ${info.message} (${currentMoment})`;
		}),
}

const logger = winston.createLogger({
	transports: [
		new winston.transports.Console({
			level: level,
			format: winston.format.combine(
				winston.format.label({ label: "LOGGER" }),			
				// order is important, colorize should be first, 
				// then should be the customized format
				winston.format.colorize({all: true}),
				customFormat.console
			),
		})
	],
	exitOnError: false, // do not exit on handled exceptions
});

module.exports = logger;