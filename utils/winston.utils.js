/*
* ========================================================================================
* Copyright (C) ICU Medical, Inc.
* All rights reserved
* ========================================================================================
* Notice: All Rights Reserved.
* This material contains the trade secrets and confidential information of ICU Medical,
Inc.,
* which embody substantial creative effort, ideas and expressions. No part of this
* material may be reproduced or transmitted in any form or by any means, electronic,
* mechanical, optical or otherwise, including photocopying and recording, or in
* connection with any information storage or retrieval system, without written permission
* from:
*
* ICU Medical, Inc.
* 13520 Evening Creek Dr., Suite 200
* San Diego, CA 92128
* www.icumed.com
* ========================================================================================
* File Name: winston.utils.js
*
* DESCRIPTION
* This code contains Enterprise portal error,server,global logs creation functions/methods
*
* ========================================================================================
*/
var appRoot = require('app-root-path');
const winston = require('winston');

const { combine, timestamp, label, printf } = winston.format;

/* var logDirectory = path.join(__dirname, 'logs');
// ensure log directory exists
fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory) */
const myFormat = printf(({ level, message, label, timestamp }) => {
    return `${timestamp} [${label}] [${level}]: ${message}`;
  });

var options = {
  globalLogs: {
    level: 'info',	
    //name: 'file.info',
    filename: `${appRoot}/logs/global.log`,
    handleExceptions: true,
    json: true,
    maxsize: 5242880, // 5MB
    maxFiles: 100,
    colorize: true,
  },
  redirectionLogs: {
    level: 'info',	
    //name: 'file.info',
    filename: `${appRoot}/logs/api-redirection.log`,
    handleExceptions: true,
    json: true,
    maxsize: 5242880, // 5MB
    maxFiles: 100,
    colorize: true,
  },
  
  errorFile: {
    level: 'error',
    //name: 'file.error',
    filename: `${appRoot}/logs/error.log`,
    handleExceptions: true,
    json: true,
    maxsize: 5242880, // 5MB
    maxFiles: 100,
    colorize: true,
  },
  console: {
    level: 'debug',
    handleExceptions: true,
    json: false,
    colorize: true,
  },
};


winston.loggers.add('IcuMedPortal', {
    format: combine(
      label({ label: 'IcuMed-Portal' }),
      timestamp(),
      myFormat
    ),
    transports: [
        new winston.transports.File(options.errorFile),
        new winston.transports.File(options.globalLogs)
    ],
    exitOnError: false
});


winston.loggers.add('PortalRedirection', {
    format: combine(
      label({ label: 'PORTAL-REDIRECTION' }),
      timestamp(),
      myFormat
    ),
    transports: [
        new winston.transports.File(options.errorFile),
        new winston.transports.File(options.redirectionLogs)
    ],
    exitOnError: false
});


var PortalLogs = winston.loggers.get('IcuMedPortal');
var PortalRedirectionLogs = winston.loggers.get('PortalRedirection');

// instantiate a new Winston Logger with the settings defined above
var logger = winston.createLogger({

  format: combine(
    label({ label: '[IcuMed - Portal]' }),
    timestamp(),
    myFormat
  ),
  transports: [
   // new winston.transports.Console(options.console),
    new winston.transports.File(options.errorFile),
    new winston.transports.File(options.globalLogs)
  ],
  exitOnError: false, // do not exit on handled exceptions
});

// create a stream object with a 'write' function that will be used by `morgan`
logger.stream = {
  write: function(message, encoding) {
    // use the 'info' log level so the output will be picked up by both transports (file and console)
    logger.info(message);
  },
};

module.exports = {
  PortalLogs : PortalLogs,
  PortalRedirectionLogs : PortalRedirectionLogs,
  Logger : logger
};