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
* File Name: common.server.controller.js
*
* DESCRIPTION
* This file contains all the common bussiness logic functions/methods
*
* ========================================================================================
*/
const models = require('../database');
var IsasCtrl = require('./isas.server.controller');
var commonUtils = require('../utils/common.utils');
const _ = require('lodash');
var env = process.env.NODE_ENV || 'development';
var config = require('../config/db.config')[env];
const fs = require('fs');
var appRoot = require('app-root-path');
var STATUS = require('../utils/status-codes-messages.utils');
var logger = require('../utils/winston.utils').PortalLogs
/***************** UPDATE SESSION EXPIRY TIME ******************/
async function updateSessionExpiry(sessionData){

  sessionId = sessionData.sid
  try{
      let sesionExpiry  = new Date(Date.now() + parseInt(sessionData.tokenTimeOutInterval)) 
      return models.sessions.update({
          expires : sesionExpiry
      },{
          where : {
              sid : sessionId
          }
      }).then(async resp=>{ 
        let newSessionData = await getUserSessionById(sessionId);
        if(newSessionData.success){
          return {success:true, resopnse : newSessionData.response}
        }else{
          return {success:false, resopnse : newSessionData.response}
        }          
      }).catch(error=>{
        logger.error(STATUS.API_SCHEMA_ERROR_CODES.UPDT_SESSION_EXPIRY + STATUS.COMMON_MSGS.EC_INTERNAL_SERVER_DOWN_STATUS_CODE + '/' + STATUS.ERROR.DB_FETCH[1] + JSON.stringify(error))    
        return {success:false, resopnse : {errCode : STATUS.COMMON_MSGS.EC_INTERNAL_SERVER_DOWN_STATUS_CODE ,message: STATUS.COMMON_MSGS.EC_INTERNAL_SERVER_DWN_MSG}}      }) 
  }catch(error){
    logger.error(STATUS.API_SCHEMA_ERROR_CODES.UPDT_SESSION_EXPIRY + STATUS.COMMON_MSGS.EC_INTERNAL_SERVER_DOWN_STATUS_CODE + '/' + STATUS.ERROR.DB_FETCH[1] + JSON.stringify(error))    
      return {success:false, resopnse : {errCode : STATUS.COMMON_MSGS.EC_INTERNAL_SERVER_DOWN_STATUS_CODE ,message: STATUS.COMMON_MSGS.EC_INTERNAL_SERVER_DWN_MSG}}
  }
}


/***************** GET USER SESSION INFO BY ID ***********************/
async function getUserSessionById(sessionId) {

    try {
      return models.sessions.findOne({
        raw:true,
        where: {
          sid : sessionId
        }
      }).then(sessionData=>{
      if (sessionData) {
        sessionData.pluginPrivileges = JSON.parse(sessionData.pluginPrivileges)
        return {success: true, response: sessionData}
      } else {
        
        logger.error(STATUS.API_SCHEMA_ERROR_CODES.GET_USER_SESSION + STATUS.COMMON_MSGS.EC_INTERNAL_SERVER_DOWN_STATUS_CODE + JSON.stringify(sessionData))    
        return {success: false, response: {errCode : STATUS.COMMON_MSGS.EC_SESSION_EXPIRED_STATUS_CODE ,message: STATUS.COMMON_MSGS.EC_SESSION_EXPIRED_STATUS_MSG}}
      }
    }).catch(err=>{
      logger.error(STATUS.API_SCHEMA_ERROR_CODES.GET_USER_SESSION + STATUS.COMMON_MSGS.EC_INTERNAL_SERVER_DOWN_STATUS_CODE + JSON.stringify(err))    
      return {success: false, response: {errCode : STATUS.COMMON_MSGS.EC_INTERNAL_SERVER_DOWN_STATUS_CODE ,message: STATUS.COMMON_MSGS.EC_INTERNAL_SERVER_DWN_MSG}}
    })
  } catch (error) {
    logger.error(STATUS.API_SCHEMA_ERROR_CODES.GET_USER_SESSION + STATUS.COMMON_MSGS.EC_INTERNAL_SERVER_DOWN_STATUS_CODE + JSON.stringify(error))    
    return {success: false, response: {errCode : STATUS.COMMON_MSGS.EC_INTERNAL_SERVER_DOWN_STATUS_CODE ,message: STATUS.COMMON_MSGS.EC_INTERNAL_SERVER_DWN_MSG}}
  }
}



/***************** GET EXPIRED USER SESSION LOG WITH SESSION ID ********************/
async function getExpiredUserSessionLog(sessionId) {

  try {
    return models.sessionLogs.findOne({
      raw: true,
      where: {
        sid: sessionId
      }
    }).then(userlog => {
      return { success: true, response: userlog}
    }).catch(err => {
      return { success: false, response: err}
    })
  } catch (error) {
    return { success: false, response: error}
  }
}



/***************** CHECK USER PRIVILEGES ******************/
async function checkUserPrivilegeAccess(sessionId, privilege){
  
  let userSessionInfo = await getUserSessionById(sessionId);
  if(userSessionInfo.success === true){
    userSessionInfo = userSessionInfo.response
    if(userSessionInfo.privileges){
      let userPrivileges = JSON.parse(userSessionInfo.privileges)
      let appPrivilegesKeys = privilege
      let foundPrivilege = false
      for(let key in userPrivileges){
        if(userPrivileges[key] == appPrivilegesKeys){
          foundPrivilege = true
        }
      }
      if(foundPrivilege){
        return {success: true, response: true}
      }else{
        return {success: false, response: userSessionInfo.userName + STATUS.COMMON_MSGS.USER_PRIVILEG_NO_PERMISION_MSG}
      }

    }else{
      return {success: false, response: userSessionInfo.userName + STATUS.COMMON_MSGS.USER_PRIVILEG_NO_PERMISION_MSG}
    }
  }else{
    return {success:false, response:userSessionInfo.response}
  } 
}








/************* REPLACE EC UI IP_ADDRESS CONFIG FILE ***************/
async function replaceUiConfigFile() {
  if (env) {
    let url = {
      "env": {
        "name": env,
        "baseURL": config.url +':'+ config.port+'/'
      }
    }

    try{
      if(fs.readFileSync(`${appRoot}${config.uiConfigFilePath}`,'utf8')){
        fs.writeFileSync(`${appRoot}${config.uiConfigFilePath}`,JSON.stringify(url),(error)=>{
          logger.info(STATUS.COMMON_MSGS.UICONFIG_UPDATED_SUCCESSFULLY+JSON.stringify(url))
        })
      }
    }catch(error){
      logger.error(STATUS.COMMON_MSGS.FAILED_TO_UPATED_UICONFIG+JSON.stringify(error))
    }
  }
}



/**************** UPDATE ISAS ACCESSTOKEN ********************/
async function updateIsasAccessToken(sessionId, userSessionInfo){
  

  let securityPlugin = await IsasCtrl.getSecurityPluginFromDb()
  if(securityPlugin.success){
    let reqBodyOfGetNewToken = await commonUtils.createReqBodyOfGetNewToken(userSessionInfo.refreshToken)
    let apiToGetNewToken = await commonUtils.createApiSchemaToGetNewToken(securityPlugin.response)
    if(apiToGetNewToken.success){
      let ecAppIdAndAppSecret = await IsasCtrl.getPortalAppIdAndAppSecret()
      if(ecAppIdAndAppSecret && ecAppIdAndAppSecret.success === true){
        let hmacSecretId = await commonUtils.createHmacHash(ecAppIdAndAppSecret.response.ApplicationId, ecAppIdAndAppSecret.response.ApplicationSecret)
        let getNewTokenApiSchema = await commonUtils.createApiSchemaForSecurityPlugin(apiToGetNewToken.response,'POST',reqBodyOfGetNewToken,hmacSecretId,null);
        let getNewTokenReq = await commonApiFetch(getNewTokenApiSchema)
        if(getNewTokenReq.success){
          let tokenResp = getNewTokenReq.response.TokenResponse
          if(tokenResp.ErrorCode == 0){
            let userTokenUpdate = await updateNewTokenInUserSession(sessionId, tokenResp.AccessToken, tokenResp.RefreshToken, tokenResp.AccessToken_ExpiryTime)
            
            return {success:userTokenUpdate.success, response:userTokenUpdate.response}
          }else{
            return { success: false, response: tokenResp.ErrorText}
          }
        }else{
          return { success: false, response: getNewTokenReq.response}
        }
      }else{
        return { success: false, response: ecAppIdAndAppSecret.response}
      }
    }else{
      return { success: false, response: apiToGetNewToken.response}
    }
  }else{
    logger.error(STATUS.API_SCHEMA_ERROR_CODES.UPDT_ISAS_ACCESSTOKEN )
    return {success:false, response: STATUS.COMMON_MSGS.FAILED_UPDATE_SECURITY_TOKEN}
  }
}


/************** COMMON API CALL TO FETCH FROM OTHER PLUGINS ***************/
async function commonApiFetch(apiReq){
  return IsasCtrl.fetchSecurityPluginApi(apiReq).then(apiResp =>{
    
    return { success: true, response: apiResp}
  }).catch(error=>{

    return { success: false, response: error}
  })
}


/************** UPDATE NEW ACCESSTOKEN IN USER SESSION *****************/
async function updateNewTokenInUserSession(sessionId, newAccessToken, newRefreshToken, newAccessTokenExpiryTime){
  try{
    let newCurrentExpiryTime = new Date(newAccessTokenExpiryTime) - new Date(Date.now())
    let newSesionExpiry  = new Date(Date.now() + parseInt(newCurrentExpiryTime)) 
    return models.sessions.update({
      accessToken : newAccessToken,
      refreshToken : newRefreshToken,
      expires : newSesionExpiry,
      tokenTimeOutInterval : newCurrentExpiryTime,
      tokenRefreshedAt : new Date(Date.now())
    },{
      where : {
        sid : sessionId
      }
    }).then(async resp=>{
      let getUserInfo = await getUserSessionById(sessionId);
      if(getUserInfo.success){
        return {success:true, response: getUserInfo.response}
      }else{
        return {success:false, response:getUserInfo.response }
      }
    }).catch(err=>{
      return {success:false, response:err}
    })
  }catch(error){
    return {success:false, response:error}

  }
}





module.exports = {
  updateSessionExpiry : updateSessionExpiry,
  getUserSessionById : getUserSessionById,
  getExpiredUserSessionLog : getExpiredUserSessionLog,
  checkUserPrivilegeAccess : checkUserPrivilegeAccess,
  updateIsasAccessToken : updateIsasAccessToken,
  replaceUiConfigFile: replaceUiConfigFile
}