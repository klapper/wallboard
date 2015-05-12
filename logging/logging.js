var winston = require('winston');
var settings = require('../config/settings.js').settings;

exports.logger = new (winston.Logger)({
    transports: [
        new (winston.transports.Console)(),
        new (winston.transports.File)({
            filename: settings.log_file,
            handleExceptions: true,
            json: false,
            maxsize:1000000,
            maxFiles:5,
            level: settings.log_level})
            
    ],
    exitOnError: true
});



