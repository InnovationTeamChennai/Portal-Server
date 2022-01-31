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
* File Name: isas.server.controller.js
*
* DESCRIPTION
* This code contains calling of external API's via axios, fetching Authorize,Notify,Licensure plugins info and
* to fetch the new configurations of all LifeShield Enterprise Manager Plugins
*
* ========================================================================================
*/
const fetch = require('node-fetch');
const models = require('../database');
const axios = require("axios");
const RegisteredApplications = models.registeredApplications;
const SequelizeOperator = require('sequelize').Op;
var commonUtils = require('../utils/common.utils');
var AppConfig = require('../config/app-config')
var { getDetectedPluginConfigFiles } = require('./plugins-config-detect.controller')
var env = process.env.NODE_ENV || 'development';
var config = require('../config/db.config')[env];
var STATUS = require('../utils/status-codes-messages.utils');
const _ = require('lodash');
const _this = this;
var logger = require('../utils/winston.utils').PortalLogs

/****************************************
 ********** CHECKING SECURITY APP *******
*****************************************/
async function checkSecurityPluginAvailability(listOfAllPlugins){
  logger.info(STATUS.EC_LOGS.HEADING.SECURITY_PLUGIN_AVAILABILITY)
  let securityPlugin = false
  _.forEach(listOfAllPlugins, (plugin) =>{
    if((plugin.uniqueName && (plugin.uniqueName).toLowerCase() === (AppConfig.securityApp).toLowerCase()) && (plugin.type && (plugin.type).toLowerCase() === 'default')){
      securityPlugin = plugin
    }
  }); 
  return securityPlugin; 
}
/***********************************************
 ********** GET SECURITY PLUGIN FROM DB *******
************************************************/
async function getSecurityPluginFromDb() {
  try {
    return models.Plugins.findOne({
      raw: true,
      where: {
        UniqueName: AppConfig.securityApp
      }
    }).then(securityPlugin => {
      if (securityPlugin.UiUrls || securityPlugin.ServerUrls) {
        securityPlugin.UiUrls = securityPlugin.UiUrls ? JSON.parse(securityPlugin.UiUrls) : {}
        securityPlugin.ServerUrls = securityPlugin.ServerUrls ? JSON.parse(securityPlugin.ServerUrls) : {}
      }
      return { success: true, response: securityPlugin }
    }).catch(err => {
      return { success: false, response: STATUS.COMMON_MSGS.SECURITY_PLGN_NOT_FOUND }
    })
  } catch (error) {
    return { success: false, response: STATUS.COMMON_MSGS.SECURITY_PLGN_NOT_FOUND }
  }
}

/************************************************
 ********GET PLUGIN CONFIGURATION DETAILS *******
*************************************************/
async function getPluginsConfigurationDetails(plugin){
  logger.info(STATUS.EC_LOGS.HEADING.PLGN_CONFIG_REQ + STATUS.EC_LOGS.MSG.GET_PLUGIN_CONFIG_INFO + plugin.name)
  let getPluginConfigDetailsApi = await commonUtils.createApiToGetPluginConfigDetails(plugin.baseUrl, plugin.serverPort,plugin.prependUrl)
  logger.info(STATUS.EC_LOGS.HEADING.PLGN_CONFIG_REQ + STATUS.EC_LOGS.MSG.CREATE_API_TO_POST_EC_INFO+ plugin.name +" Plugin :" + getPluginConfigDetailsApi)
  let apiSchema = await commonUtils.createApiSchemaForSecurityPlugin(getPluginConfigDetailsApi,'POST',{configInfoRequest:{baseUrl:AppConfig.baseUrl,port:(AppConfig.serverPort).toString(), applicationName:AppConfig.name,applicationVersion:AppConfig.version}})
  let responseFromSecurityPluginAPI = fetchSecurityPluginApi(apiSchema)
  return responseFromSecurityPluginAPI.then(response =>{
    logger.info(STATUS.EC_LOGS.HEADING.PLGN_CONFIG_REQ + STATUS.EC_LOGS.MSG.GET_PLUGIN_CONFIG_INFO_SUCCESS + plugin.name)
    return {success : true, response: response}
  }).catch(error =>{
    logger.error(STATUS.EC_LOGS.HEADING.PLGN_CONFIG_REQ + STATUS.EC_LOGS.MSG.GET_PLUGIN_CONFIG_INFO_FAILED + plugin.name + ':' +JSON.stringify(error))
    return {success : false, response: error}
  })
}




/************************************************
 ***** FETCH SECURITY PLUGIN CONFIG DETAILS *****
*************************************************/
async function getSecurityPluginConfigInfo(){
  // let securityPlugin = await getSecurityPlugin()
  let securityPlugin = {
    name : AppConfig.securityApp,
    uniqueName : AppConfig.securityApp
  }
  let pluginInfo
  securityPlugin != false ? pluginInfo = await checkPluginConfigDetailsInDB(securityPlugin) : pluginInfo = false
  pluginInfo != false ? pluginInfo.success === true ? pluginInfo = pluginInfo.response[0] : pluginInfo = false : pluginInfo = false
  return pluginInfo;
}

/****** DETECT SECURITY PLUGIN AND ITS CONFIG DETAILS ************/
async function detectSecurityPluginAndConfigDetails() {
  let isSecurityPluginAvailable = await checkSecurityPluginAvailability()
  if (isSecurityPluginAvailable != false) {
    let securityPluginConfigInfo = await getPluginsConfigurationDetails(isSecurityPluginAvailable)
    securityPluginConfigInfo && securityPluginConfigInfo.success === true ? securityPluginConfigInfo = securityPluginConfigInfo : securityPluginConfigInfo = securityPluginConfigInfo
    return securityPluginConfigInfo
  } else {
    // closeMyECServer()
    return { success: false, response:  STATUS.COMMON_MSGS.SECURITY_PLGN_NOT_FOUND }
  }
}

/******** CHECK IS REGISTERED APPLICATION WITH SECURITY PLUGIN OR NOT ************/
async function isRegisteredAppWithSecurityPlugin(registrationAppName, registrationAppVersion, registrationAppAdminName, registrationAppAdminEmail, regitsrationAppPrivileges,req) {

  let securityPlugin = await getSecurityPluginConfigInfo()
  logger.info(STATUS.EC_LOGS.HEADING.REGISTRATION_WITH_SECURITY_PLGN + STATUS.EC_LOGS.MSG.GET_SECURITY_PLGN_FROM_DB)

  if (securityPlugin) {
    let registartionApi = await commonUtils.createRegisterationApi(securityPlugin)
    if (registartionApi != false) {
      let registrationApiRequestBody = await commonUtils.createRegisterApplicationBody(registrationAppName, registrationAppVersion, registrationAppAdminName, registrationAppAdminEmail, regitsrationAppPrivileges)

      if (registrationApiRequestBody && registrationApiRequestBody.success === true) {
        let registrationApiSchema = await commonUtils.createApiSchemaForSecurityPlugin(registartionApi, 'POST', registrationApiRequestBody.response)
		
		if(req){
          let clientIpAddress = await commonUtils.getClientIpAddress(req)
          registrationApiSchema.requestHeaders['x-forwarded-for'] = clientIpAddress
        }
		
        return fetchSecurityPluginApi(registrationApiSchema).then(async responseFromSecurityPlugin => {
          if (responseFromSecurityPlugin && responseFromSecurityPlugin.RegistrationResponse.ErrorCode != 0) {
            return { success: false, response: responseFromSecurityPlugin }
          } else {
            return { success: true, response: responseFromSecurityPlugin }
          }

        }).catch(error => {
          return { success: false, response: error }
        })
      } else {
        return { success: false, response: registrationApiRequestBody }
      }
    }
  } else {
    // let securityPluginInfo = await detectSecurityPluginAndConfigDetails()
    // securityPluginInfo && securityPluginInfo.success === true ? checkIsRegisteredAppWithSecurityPlugin(securityPlugin, registrationAppName, registrationAppVersion) : { success: false, response: STATUS.COMMON_MSGS.FAILED_TO_REGISTER + ', ' + STATUS.COMMON_MSGS.SECURITY_PLGN_NOT_FOUND }
  }
}

/***********************************************
 ********** CHECKING LICENSE MANAGER APP *******
************************************************/
async function CheckLicenseManagerPluginAvailability(listOfAllPlugins){
  logger.info(STATUS.EC_LOGS.HEADING.LICENSEMNGR_AVAILABILITY )
  let licenseManagerPlugin = false
  _.forEach(listOfAllPlugins, (plugin) =>{
    if((plugin.uniqueName && (plugin.uniqueName).toLowerCase() === (AppConfig.licenseManagerApp).toLowerCase()) && (plugin.type && (plugin.type).toLowerCase() === 'default')){
      licenseManagerPlugin = plugin
    }
  }); 
  return licenseManagerPlugin;
}



/****************************************************
 ********** CHECKING NOTIFICATION MANAGER APP *******
*****************************************************/
async function CheckNotificationManagerPluginAvailability(listOfAllPlugins){

  logger.info(STATUS.EC_LOGS.HEADING.NOTIFICATIONMNGR_AVAILABILITY)
  let notificationManagerPlugin = false
 
    _.forEach(listOfAllPlugins, (plugin) =>{
      if((plugin.uniqueName && (plugin.uniqueName).toLowerCase() === (AppConfig.notificationManagerApp).toLowerCase())){
        notificationManagerPlugin = plugin
      }
    }); 
  
  return notificationManagerPlugin;
}



/************* CHECK IS PLUGIN CONFIG DEATILS IN DB ****************/
async function checkPluginConfigDetailsInDB(pluginInfo) {
  if (pluginInfo) {
    try {
      return models.plugins.findAll({
        raw: true,
        where: {
          [SequelizeOperator.or]: [
            {
              UniqueName: pluginInfo.uniqueName
            }
          
          ]
        }
      }).then(plugins => {
        if (plugins && plugins.length > 0) {
          _.forEach(plugins, (plugin) => {
            if (plugin.UiUrls || plugin.ServerUrls) {
              plugin.UiUrls = plugin.UiUrls ? JSON.parse(plugin.UiUrls) : {}
              plugin.ServerUrls = plugin.ServerUrls ? JSON.parse(plugin.ServerUrls) : {}
            }
          })
        }
        return { success: true, response: plugins }
      }).catch(resErr => {
        return { success: false, response: resErr }
      })
    } catch (error) {
      return { success: false, response: error }
    }
  } else {
    return { success: false, response: STATUS.COMMON_MSGS.REQUIRED_FIELDS_NTFOUND }
  }

}


async function fetchSecurityPluginApi(apiSchema) {
  let requestApi = apiSchema.requestApi
  let requestMethod = apiSchema.requestMethod
  let requestHeaders = apiSchema.requestHeaders
  let requestBody = apiSchema.requestBody
  let secondParameter = {}
  if (requestBody) {
    secondParameter.method = requestMethod
    secondParameter.headers = requestHeaders
    secondParameter.body = requestBody
  } else {
    secondParameter.method = requestMethod
    secondParameter.headers = requestHeaders
  }

  return new Promise(async (resolve, reject) => {
    if (requestApi && requestMethod && requestHeaders) {
      fetch(requestApi, secondParameter).then(resp => {
        return resp.json()
      }).then((jsonData) => {
        resolve(jsonData)
      }).catch((err) => {
        // handle error for example
        reject(err)
      });
    } else {
      reject(STATUS.COMMON_MSGS.COMMON_API_FETCH_REJECT_MSG)
    }
  })

}



/********************************************
 **** FETCH LICENSE PLUGIN CONFIG DETAILS ****
*********************************************/
async function getLicensePluginConfigInfo() {
  let licensePlugin = {
    name: AppConfig.licenseManagerApp,
    uniqueName: AppConfig.licenseManagerApp
  }
  let pluginInfo
  licensePlugin != false ? pluginInfo = await checkPluginConfigDetailsInDB(licensePlugin) : pluginInfo = false
  pluginInfo != false ? pluginInfo.success === true ? pluginInfo = pluginInfo.response[0] : pluginInfo = false : pluginInfo = false
  return pluginInfo;
}


/********************************************
 **** FETCH LICENSE PLUGIN CONFIG DETAILS ****
*********************************************/
async function getNotificationPluginConfigInfo() {
  let notificationPlugin = {
    name: AppConfig.notificationManagerApp,
    uniqueName: AppConfig.notificationManagerApp
  }
  let pluginInfo
  notificationPlugin != false ? pluginInfo = await checkPluginConfigDetailsInDB(notificationPlugin) : pluginInfo = false
  pluginInfo != false ? pluginInfo.success === true ? pluginInfo = pluginInfo.response[0] : pluginInfo = false : pluginInfo = false
  return pluginInfo;
}





/************************************************
 ****** CREATE DEFAULT USER FOR EC IN ISAS ******
*************************************************/
async function createDefaultUserForPortal(rootNodeInfo) {
  let defaultUserReqBody = await commonUtils.createDefaultUserReqBody(rootNodeInfo)
  logger.info(STATUS.EC_LOGS.HEADING.CREATE_DEFAULT_USER_FOR_EC + STATUS.EC_LOGS.MSG.CREATE_DEFAULT_USER_REQ_BODY + JSON.stringify(defaultUserReqBody))

  let securityPluginInfo = await getSecurityPluginConfigInfo()
  if (securityPluginInfo) {
    let defaultUserApi = await commonUtils.createDefaultUserApiSchema(securityPluginInfo)
    if (defaultUserApi !== false) {
      let ecAppIdAndAppSecret = await getPortalAppIdAndAppSecret()
      if (ecAppIdAndAppSecret && ecAppIdAndAppSecret.success === true) {
        let hmacId = await commonUtils.createHmacHash(ecAppIdAndAppSecret.response.ApplicationId, ecAppIdAndAppSecret.response.ApplicationSecret)
        let apiSchema = await commonUtils.createApiSchemaForSecurityPlugin(defaultUserApi, 'POST', defaultUserReqBody, hmacId, null)
        let responseFromSecurityPluginAPI = fetchSecurityPluginApi(apiSchema)
        return responseFromSecurityPluginAPI.then(response => {
          if (response && response.RegistrationResponse.ErrorCode === 0) {
            return { success: true, response: response }
          } else {
            return { success: false, response: response }
          }
        }).catch(error => {
          return { success: false, response: error }
        })
      } else {
        return { success: false, response: ecAppIdAndAppSecret.response }
      }
    } else {
      return { success: false, response: STATUS.COMMON_MSGS.DEFAULT_USER_API_NOT_FOUND }
    }
  } else {
    logger.error(STATUS.EC_LOGS.HEADING.CREATE_DEFAULT_USER_FOR_EC + STATUS.EC_LOGS.MSG.GET_SECURITY_PLGN_FROM_DB + JSON.stringify(securityPluginInfo))
  
    return { success: false, response: STATUS.COMMON_MSGS.SECURITY_PLGN_NOT_FOUND }
  }
}

/************************************************
 ****** GET EC POrtal APP ID AND APP SECRET ID *********
*************************************************/
async function getPortalAppIdAndAppSecret() {
  try {
    return RegisteredApplications.findOne({
      raw: true,
      where: {
        ApplicationName: AppConfig.name
      },
    }).then(resp => {
      if (resp) {
        return { success: true, response: resp }
      } else {
        return { success: false, response: resp }
      }
    }).catch(error => {
      return { success: false, response: error }
    })
  } catch (error) {

    return { success: false, response: error }
  }
}



/******************* GET ROLES AND PRIVILEGES OF USER ********************/
async function getRolesAndPrivilegesForUser(securityPlugin, ApplicationId, ApplicationSecret, userTokenInfo) {



  let userAccessToken = userTokenInfo.AccessToken
  let siteId = "1"
  let getRolesAndPrivilegesOfUserApi = await commonUtils.createApiToGetRolesAndPrivilegesForUser(securityPlugin);
  let reqBodyToGetRolesAndPrivilegesForUser = await commonUtils.createReqBodyToGetRolesAndPrivilegesForUser(userAccessToken, siteId)
  let hashedBase64 = await commonUtils.createHmacHash(ApplicationId, ApplicationSecret)
  let apiSchema = await commonUtils.createApiSchemaForSecurityPlugin(getRolesAndPrivilegesOfUserApi, 'POST', reqBodyToGetRolesAndPrivilegesForUser, hashedBase64)



  return fetchSecurityPluginApi(apiSchema).then(succesResp => {
      return { success: true, response: succesResp }
  })
}


/***************************************************************
 ******* DO API CALL TO EXPTERNAL PLUGINS VIA REHOST API ********
****************************************************************/
async function rehostApi(apiSchema){
  let requestApi = apiSchema.requestApi
  let requestMethod = apiSchema.requestMethod
  let requestHeaders = apiSchema.requestHeaders
  let requestBody = apiSchema.requestBody
  return new Promise(async (resolve, reject)=>{
    if(requestApi && requestMethod && requestHeaders){
      axios({method:requestMethod,url:requestApi,headers:requestHeaders,data:requestBody}).then(resp=>{
        resolve(resp.data)
      }).catch(error=>{
        if (_.get(error, "isAxiosError", false)){
          /*  */if(error.response){
            error.response.data.respStatusCode = error.response.status
          }
          // let errorResp = error.response ?error.response.data : error
          reject(error)
        }        
      })
    }else{
      reject(STATUS.COMMON_MSGS.COMMON_API_FETCH_REJECT_MSG)
    }
  })
}











/************ CLOSE PORTAL SERVER ***************/
async function closeMyECServer() {
  
logger.info(STATUS.EC_LOGS.HEADING.CLOSE_SERVER + "Closing PORTAL server")
logger.error(STATUS.EC_LOGS.HEADING.CLOSE_SERVER + "Closing PORTAL server")
  process.exit(1)
}

module.exports = {
  getSecurityPluginFromDb: getSecurityPluginFromDb,
  // getSecurityPlugin: getSecurityPlugin,
  rehostApi:rehostApi,
  fetchSecurityPluginApi: fetchSecurityPluginApi,
  checkSecurityPluginAvailability: checkSecurityPluginAvailability,
  getPluginsConfigurationDetails: getPluginsConfigurationDetails,
  isRegisteredAppWithSecurityPlugin: isRegisteredAppWithSecurityPlugin,
  closeMyECServer: closeMyECServer,
  detectSecurityPluginAndConfigDetails: detectSecurityPluginAndConfigDetails,
  checkPluginConfigDetailsInDB: checkPluginConfigDetailsInDB,
  getSecurityPluginConfigInfo: getSecurityPluginConfigInfo,
  createDefaultUserForPortal: createDefaultUserForPortal,
  getPortalAppIdAndAppSecret: getPortalAppIdAndAppSecret,
  getLicensePluginConfigInfo: getLicensePluginConfigInfo,
  getNotificationPluginConfigInfo: getNotificationPluginConfigInfo,
  getRolesAndPrivilegesForUser:getRolesAndPrivilegesForUser,
  CheckLicenseManagerPluginAvailability:CheckLicenseManagerPluginAvailability,
  CheckNotificationManagerPluginAvailability:CheckNotificationManagerPluginAvailability
}
