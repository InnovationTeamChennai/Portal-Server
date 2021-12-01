#!/usr/bin/env node
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
* File Name: www.js
*
* DESCRIPTION
* This code contains validation of  Enterprise Portal and Initialization of Enterprise Portal Server
* ========================================================================================
*/
/**
 * Module dependencies.
 */

const chalk = require('chalk');
var app;
var debug = require('debug')('portal-server:server');
const models = require('../database');

var http = require('http');
var pluginsCtrl;
var isasCtrl;
var AppConfig;
var CommonCtrl;

var commonUtils = require('../utils/common.utils')


var { EC_LOGS } = require('../utils/status-codes-messages.utils')
const _ = require('lodash');
var appRoot = require('app-root-path');
const dotenv = require('dotenv').config();
const fs = require('fs');

var https = require('https'); 
const publicIp = require('public-ip');
const DefaultPort='4005';
var logger = require('../utils/winston.utils').PortalLogs
var server;
const constants = require('constants');


/**
 * Get port from environment and store in Express.
 */

var port = normalizePort(process.env.PORT || DefaultPort);
//app.set('port', port);

logger.info(EC_LOGS.HEADING.INITIALIZATION + EC_LOGS.MSG.EC_INITIALIZED);
checkSecureConnection();


/********* CHECK SECURE CONNECTION *************/
async function checkSecureConnection() {
  if (process.env.SECURE_CONNECTION == 'true') {
	  
	let decryptionOfPassphrase = await startDecryptPassphrasePswd();
	
	if(decryptionOfPassphrase.success === true){
		if ((_.get(process.env, "PATH_TO_CERTIFICATE_FILE") != "") && (_.get(process.env, "PATH_TO_KEY_FILE") != "")) {
			let pathToCertificate = `${appRoot}`+process.env.PATH_TO_CERTIFICATE_FILE + _.get(process.env, "CERT_FILE_NAME", 'icumedicalportal.crt'); //default names are added if not found
			let pathToKeyflile = `${appRoot}`+process.env.PATH_TO_KEY_FILE + _.get(process.env, "KEY_FILE_NAME", 'icumedicalportal.pem'); //default names are added if not found
			let passphraseForPrivateKey = decryptionOfPassphrase.response;
			if ((fs.existsSync(pathToCertificate)) && (fs.existsSync(pathToKeyflile))) {
				try {
				  let certificate = fs.readFileSync(pathToCertificate);
				  let keyflile = fs.readFileSync(pathToKeyflile);
				  let serverCertificateParameter = { key: keyflile, cert: certificate, passphrase: passphraseForPrivateKey, secureOptions: constants.SSL_OP_NO_TLSv1 | constants.SSL_OP_NO_TLSv1_1,
						ciphers: [
						"ECDHE-RSA-AES128-GCM-SHA256",
						"ECDHE-RSA-AES256-GCM-SHA384",
						"ECDHE-RSA-AES128-SHA256",
						"ECDHE-RSA-AES256-SHA384",
						"ECDHE-RSA-AES256-SHA",
						"ECDHE-RSA-AES128-SHA",
						"AES256-GCM-SHA384",
						"AES256-CCM8",
						"AES256-CCM",
						"AES128-GCM-SHA256"].join(':')
					};
				  connectAndSynWithDb(serverCertificateParameter);
		
				} catch (error) {
          console.log(chalk.red(EC_LOGS.HEADING.SOMETHING_WENT_WRONG_IN_CREATE, error));
          logger.error(EC_LOGS.HEADING.SOMETHING_WENT_WRONG_IN_CREATE,error);
				}
			} else {
				console.log(chalk.red(EC_LOGS.HEADING.CERTIFICATE_NOT_FOUND));
			  }
			} else {
			  console.log(chalk.red(EC_LOGS.HEADING.CERTIFICATE_PATH_FOUND_EMPTY));

			}
		}
		
		else{
		  logger.error(EC_LOGS.HEADING.PASSPH_ENCRYPT_ERR+JSON.stringify(decryptionOfPassphrase.response));
		  console.log(chalk.red(EC_LOGS.HEADING.ENC_DEC_FAILED,decryptionOfPassphrase.response))
		}
  }
  else {
	  
	connectAndSynWithDb();

  }
  
}


async function connectAndSynWithDb(serverCertificateParameter){
  let dbConnectionResp = await models.startDecryptDbPswd();  
  if(dbConnectionResp.success === true){
	  
    createMyServer(serverCertificateParameter);
  }else{
    closeMyServer();
  }
}


/****** BEGING OF CREATE EC SERVER ******/
async function createMyServer(serverCertificateParameter) {

  logger.info(EC_LOGS.HEADING.SERVER_START);
  
   app = require('../app');
   pluginsCtrl = require('../controllers/plugins.server.controller');
   isasCtrl = require('../controllers/isas.server.controller');
   AppConfig = require('../config/app-config');
   CommonCtrl = require('../controllers/common.server.controller');
  try {
    logger.info(EC_LOGS.HEADING.INITIALIZATION + EC_LOGS.MSG.DB_SYNC_SUCCESS)


    console.log(EC_LOGS.HEADING.START_EC_SERVER)
	
	if(serverCertificateParameter){
		server = https.createServer(serverCertificateParameter, app)
	}else{
		server = http.createServer(app)
	}
	
	
    server.listen(port, async () => {
      console.log(EC_LOGS.HEADING.LISTENING_PORT, port);
      logger.info(EC_LOGS.HEADING.INITIALIZATION + EC_LOGS.MSG.SERVER_STARTED_AT_PORT + port)


      if(process.env.NODE_ENV.toLowerCase() == 'development'){
        //let afterSaveEnv = await saveUpdatedInfoInEnv()
        CommonCtrl.replaceUiConfigFile()          
      }

      logger.info(EC_LOGS.HEADING.INITIALIZATION + EC_LOGS.HEADING.CHECK_ROOT_NODE_AVALBLTY + EC_LOGS.MSG.CHECK_ROOT_NODE_AVAILABLE)
      
      debug(EC_LOGS.HEADING.LISTENING_PORT + server.address().port);

      let allDetectedPluginsInfo = await pluginsCtrl.detectAllAvailablePlugins()
      if (allDetectedPluginsInfo && allDetectedPluginsInfo.length > 0) {
        let requiredPluginsForPortal = await pluginsCtrl.checkRequiredPluginsForPortal(allDetectedPluginsInfo)
        if (requiredPluginsForPortal.success === true) {

          let doneWithInitialSteps = await pluginsCtrl.doInitialStepsWithSecurityPlugin(allDetectedPluginsInfo);
        
          logger.info(EC_LOGS.HEADING.DONE_INITIAL_STEPS);

          if (doneWithInitialSteps.success === true) {
            logger.info(EC_LOGS.HEADING.INITIALIZATION + EC_LOGS.HEADING.INITIAL_STEPS_WITH_SECURITY_PLGN + EC_LOGS.MSG.INITIAL_STEPS_WITH_SECURITY_PLGN_SUCCESS + JSON.stringify(doneWithInitialSteps.response))
            logger.info(EC_LOGS.HEADING.INITIALIZATION + EC_LOGS.HEADING.CREATE_DEFAULT_USER_FOR_EC + EC_LOGS.MSG.CREATE_DEFAULT_USER_FOR_EC)
			
			// after db sync models are available hence moving the definition here
			const Installation = models.installation;
			
            Installation.findAll()
              .then(async function (products) {
                data = JSON.parse(JSON.stringify(products));
                if (data.length > 0) {

                  let defaultUserForPortal = await isasCtrl.createDefaultUserForPortal(data[0]);
             
                  if((defaultUserForPortal.response && defaultUserForPortal.response.RegistrationResponse && defaultUserForPortal.response.RegistrationResponse.ErrorCode == 8015)|| (defaultUserForPortal.response && defaultUserForPortal.response.RegistrationResponse && defaultUserForPortal.response.RegistrationResponse.ErrorCode == 0 ||(defaultUserForPortal.response && defaultUserForPortal.response.respStatusCode && defaultUserForPortal.response.respStatusCode == 422))){
                    console.log(chalk.green("### ",EC_LOGS.HEADING.INITIALIZATION + EC_LOGS.HEADING.CREATE_DEFAULT_USER_FOR_EC + EC_LOGS.MSG.CREATE_DEFAULT_USER_FOR_EC_SUCCESS + JSON.stringify(defaultUserForPortal.response)))
                    logger.info(EC_LOGS.HEADING.INITIALIZATION + EC_LOGS.HEADING.CREATE_DEFAULT_USER_FOR_EC + EC_LOGS.MSG.CREATE_DEFAULT_USER_FOR_EC_SUCCESS + JSON.stringify(defaultUserForPortal.response))
                  console.log(chalk.green(EC_LOGS.HEADING.DEFAULT_USER_DONE));
                  logger.info(EC_LOGS.HEADING.DEFAULT_USER_DONE);
                  }else{
                    console.log(chalk.red("### ",EC_LOGS.HEADING.INITIALIZATION + EC_LOGS.HEADING.CREATE_DEFAULT_USER_FOR_EC + EC_LOGS.MSG.CREATE_DEFAULT_USER_FOR_EC_FAILED + JSON.stringify(defaultUserForPortal.response)))
                    logger.error(EC_LOGS.HEADING.INITIALIZATION + EC_LOGS.HEADING.CREATE_DEFAULT_USER_FOR_EC + EC_LOGS.MSG.CREATE_DEFAULT_USER_FOR_EC_FAILED + JSON.stringify(defaultUserForPortal.response))
                    closeMyServer()
                  }
               
                }

              });
          }
        } else {
          console.log(EC_LOGS.HEADING.INITIAL_STEPS_ERR)
          logger.error(EC_LOGS.HEADING.INITIAL_STEPS_ERR);
          closeMyServer();
        }

      } else {
        logger.error(EC_LOGS.HEADING.ERR_PLUGIN_INFO);
        closeMyServer();

      }
      

    })
	
	server.on('error', onError);
    server.on('listening', onListening);
	
	
  }

  catch (err) {

  }

}



async function startDecryptPassphrasePswd(){
  let passphraseForPrivateKey = _.get(process.env, "PASSPHRASE_FOR_PRIVATE_KEY", "");
  if(passphraseForPrivateKey){
    if(await commonUtils.isBaseEncrypted(passphraseForPrivateKey)){
      let decryptedPswd = await commonUtils.decryptWithDpapi(passphraseForPrivateKey);
      if(decryptedPswd.success === true){
        logger.info(EC_LOGS.HEADING.CERTIFICTAE_PASSPH_DECRY_SUCCESS);
        return {success:true, response: decryptedPswd.response}
      }else{
        return {success:false, response: decryptedPswd.response}
      }    
    }else{
      let encryptedPswd = await commonUtils.encryptWithDpapi(config.password)
      if(encryptedPswd.success === true){
        app_env && app_env.toLowerCase() == 'development' ? process.env.DEV_DB_PASSWORD = encryptedPswd.response : process.env.PROD_DB_PASSWORD = encryptedPswd.response;
        logger.info(EC_LOGS.HEADING.PASSPH_ENCRYPT_SUCCESS);
        return {success:true, response: passphraseForPrivateKey}
      }else{
        return {success:false, response: encryptedPswd.response}
      }
    }
  }else{
    logger.info(EC_LOGS.HEADING.PASSPH_ENCRYPT_EMPTY);
    return {success:true, response: passphraseForPrivateKey}
  }

}






async function saveUpdatedInfoInEnv(){  

  let envConfig = dotenv.parsed;
  
  let fileContent='';
  for (let key in envConfig) {
       envConfig[key] = process.env[key];
      fileContent=fileContent+key +"="+envConfig[key] +"\n";
  }
  // dotenv.parsed = fileContent
  const data = fs.writeFileSync('.env', fileContent);

  return true
}










/********** CLOSE THE SERVER CONNECTION ************/
async function closeMyServer(server) {
  isasCtrl.closeMyECServer();
}


/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;
  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + EC_LOGS.HEADING.REQUIRE_ELEVETED_PRIVILEGES);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + EC_LOGS.HEADING.ALREADY_IN_USE);
      process.exit(1);
      break;
    case 'UnhandledPromiseRejectionWarning':
      console.error(EC_LOGS.HEADING.SERVER_DOWN);
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  debug(EC_LOGS.HEADING.LISTENING_ON + bind);
}