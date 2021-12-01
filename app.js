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
* File Name: app.js
*
* DESCRIPTION
* This code contains Enterprise portal Server root file
*
*
* ========================================================================================
*/
var express = require('express');
var createError = require('http-errors');
var session = require('express-session');
var AppConfig = require('./config/app-config');
const bodyparser = require("body-parser");
var logger = require('morgan');
var winston = require('./utils/winston.utils');
var cors = require('cors');
const dotenv = require('dotenv').config();
var indexRouter = require('./routes/v1/index');
var net = require('net');
const validate = require('./validators/validate');
var app = express();
var xmlParser = require('express-xml-bodyparser');
var db = require("./database/index")
var UiApiFallback = require('connect-history-api-fallback');
const { ppid } = require('process');
var STATUS = require('./utils/status-codes-messages.utils');
process.env.UV_THREADPOOL_SIZE = 128
app.use(logger('dev'));
app.use(logger('combined', { stream: winston.Logger.stream }))
const helmet = require("helmet");



app.use(session({
  secret: AppConfig.sessionSecret,
  store: db.mySessionStore,
  resave: false,//Forces the session to be saved back to the session store, even if the session was never modified during the request, default value is true
  saveUninitialized: false, //Forces a session that is “uninitialized” to be saved to the store. A session is uninitialized when it is new but not modified
  rolling: true, //Force a session identifier cookie to be set on every response. The expiration is reset to the original maxAge, resetting the expiration countdown
  cookie: { maxAge: AppConfig.sessionMaxAge, expires: AppConfig.sessionMaxAge, secure: true}
}))


app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(xmlParser({
  trim: false,
  explicitArray: false
}));

app.use(
  helmet.frameguard({
    action: "sameorigin",
  })
);

app.use(helmet.noSniff());

app.use(
  helmet.hsts({
    maxAge: 63072000,
    includeSubDomains: true
  })
);

app.use((req, res, next) => {
  res.setHeader("X-XSS-Protection", "1; mode=block");
  next();
});

app.use(function (req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST,PUT,DELET');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type,sessionid,email,multipart/form-data,application/x-www-form-urlencoded');
  res.setHeader('Access-Control-Allow-Credentials', true);
  next();
});
app.use(function (req, res, next) {
  res.locals.url = req.protocol + '://' + req.headers.host + req.url;
  next();
})

app.use('/api/v1', [validate.checkIsServicesEnabled, validate.checkSessionExpiry], indexRouter);

app.use(UiApiFallback({
  rewrites: [
    {
      from: /^\/api\/.*$/,
      to: function (context) {
        return context.parsedUrl.path
      }
    }
  ]
}));
app.use(express.static('UI/portal-ui'));




// catch 404 and forward to error handler
app.use(function (req, res, next) {

  res.status(404).send({ status: 400, Message: STATUS.ERROR.EC_API_FAIL[1] })
});


db.sessions.destroy({ where: {} }).then(function () { });


// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  console.log(STATUS.EC_LOGS.HEADING.IN_ERROR_HANDLER);
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  if (err.status) {
    res.status(err.status || STATUS.COMMON_MSGS.HTTP_ERR_CODE).send({ errCode: STATUS.COMMON_MSGS.EC_INTERNAL_SERVER_DOWN_STATUS_CODE, message: STATUS.COMMON_MSGS.EC_INTERNAL_SERVER_DWN_MSG } || res);
  } else {
    res.status(STATUS.SUCCESS[2]).send({ errCode: STATUS.COMMON_MSGS.EC_INTERNAL_SERVER_DOWN_STATUS_CODE, message: STATUS.COMMON_MSGS.EC_INTERNAL_SERVER_DWN_MSG } || res);

  }

});


process.on(STATUS.EC_LOGS.HEADING.UNCAUGHT_HEAD, (err) => {
  console.error(STATUS.COMMON_MSGS.UNCAUGHT_ERR, err);
  process.exit(1) //mandatory (as per the Node docs)
})

module.exports = app;
