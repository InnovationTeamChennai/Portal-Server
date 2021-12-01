
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
* File Name: users.server.controller.js
*
* DESCRIPTION
* This code contains Authentication,Logout,Session creation,session logs,Validation of session ID and validation of
* Authorize HMACH token functions/methods
*
*
* ========================================================================================
*/
var STATUS = require('../utils/status-codes-messages.utils');
var commonUtils = require('../utils/common.utils')
const AppConfig = require('../config/app-config');
var env = process.env.NODE_ENV || 'development';
// var config = require(__dirname + '/../config/db.config.js')[env];
var config = require('../config/db.config')[env];
const exec = require('child_process').exec;
// var pm2 = require('pm2');
var devConfig = require('../config/db.config')['development'];
var pluginsRoute = require('./plugins.server.controller');
var commonUtils = require('../utils/common.utils');
var ISASctrl = require('./isas.server.controller')
const _ = require('lodash');
const models = require('../database');
var logger = require('../utils/winston.utils').PortalLogs;
var crmControl = require('./crm.server.controller');
var CommonCtrl = require('./common.server.controller');
const chalk = require('chalk');

/***************************************
************AUTHENTICATION *************
****************************************/
async function login(req, res, next) {
    logger.info(STATUS.EC_LOGS.MSG.IN_LOGIN_MSG);

    if (AppConfig.isISASEnabled === true) {
        let userName = req.body.userDetails.userName, password = req.body.userDetails.password, authenticationType = req.body.authType
        let respOfecAppIdSecret = await ISASctrl.getPortalAppIdAndAppSecret()
        if (respOfecAppIdSecret && (respOfecAppIdSecret.success === true)) {
            let ecAppResp = respOfecAppIdSecret.response
            let securityPlugin = await ISASctrl.getSecurityPluginConfigInfo();
            let getAuthenticationType = await getAuthenticationTypeFormSecurityPlugin(securityPlugin, ecAppResp)
            if (getAuthenticationType.success === true) {
                let requestBody = await getAuthReqBodyBasedOnAuthType(getAuthenticationType.response, userName, password)
                let authenticationApi = await commonUtils.createAuthenticationApi(securityPlugin);
                let hashedBase64 = await commonUtils.createHmacHash(ecAppResp.ApplicationId, ecAppResp.ApplicationSecret)
                let apiSchema = await commonUtils.createApiSchemaForSecurityPlugin(authenticationApi, 'POST', requestBody, hashedBase64);

                apiSchema.requestHeaders['x-forwarded-for'] = req.connection.remoteAddress
                ISASctrl.fetchSecurityPluginApi(apiSchema).then(async successRes => {
                    if (successRes.AuthenticationResponse.ErrorCode == 0) {
                        let rolesAndPrivileges = await ISASctrl.getRolesAndPrivilegesForUser(securityPlugin, ecAppResp.ApplicationId, ecAppResp.ApplicationSecret, successRes.AuthenticationResponse)
                        if (rolesAndPrivileges.success === true) {
                            let finalResponse = await _.assign({}, successRes.AuthenticationResponse, rolesAndPrivileges.response.IntrospectResponse);
                            let sessionObj = await commonUtils.createUserSession(req, finalResponse)
                            let sessionLog = await createSessionLog(sessionObj)
                            let createdResp = commonUtils.createResponse(STATUS.SUCCESS, sessionObj)
                            commonUtils.sendResponse(req, res, createdResp, next)
                        } else {
                            logger.error(STATUS.API_SCHEMA_ERROR_CODES.ERROR_EC_USERLOGIN + STATUS.COMMON_MSGS.PRIVILEGES_FETCH_FAILED + JSON.stringify(rolesAndPrivileges))
                            let createdResp = commonUtils.createResponse(STATUS.ERROR.AUTEHNTICATION_FAILED, '', STATUS.ERROR.INTERNAL_SW[1])
                            commonUtils.sendResponse(req, res, createdResp, next)
                        }
                    } else {
                        logger.error(STATUS.API_SCHEMA_ERROR_CODES.ERROR_EC_USERLOGIN + JSON.stringify(successRes))
                        let createdResp = commonUtils.createResponse(STATUS.ERROR.AUTEHNTICATION_FAILED, '', successRes.AuthenticationResponse)
                        commonUtils.sendResponse(req, res, createdResp, next)
                    }
                }).catch(async error => {
                    logger.error(STATUS.API_SCHEMA_ERROR_CODES.ERROR_EC_USERLOGIN + STATUS.COMMON_MSGS.COMMON_API_FETCH_FAILED + JSON.stringify(error))

                    if (error.AuthenticationResponse && error.AuthenticationResponse.ErrorCode != 0) {
                        let createdResp = await commonUtils.createResponse(STATUS.ERROR.AUTEHNTICATION_FAILED, '', error.AuthenticationResponse)
                        commonUtils.sendResponse(req, res, createdResp, next)
                    } else {
                        let createdResp = await commonUtils.createResponse(STATUS.ERROR.AUTEHNTICATION_FAILED, '', STATUS.ERROR.INTERNAL_SW[1])
                        commonUtils.sendResponse(req, res, createdResp, next)
                    }
                })
            } else {
                logger.error(STATUS.API_SCHEMA_ERROR_CODES.ERROR_EC_USERLOGIN + STATUS.COMMON_MSGS.GET_AUTH_TYPE_FAILED + JSON.stringify(getAuthenticationType.response))
                let createdResp = commonUtils.createResponse(STATUS.ERROR.AUTEHNTICATION_FAILED, '', STATUS.ERROR.INTERNAL_SW[1])
                commonUtils.sendResponse(req, res, createdResp, next)
            }
        } else {
            logger.error(STATUS.API_SCHEMA_ERROR_CODES.ERROR_EC_USERLOGIN + STATUS.EC_LOGS.MSG.GET_APP_ID_SECRET_FAILED + JSON.stringify(respOfecAppIdSecret.response))

            let createdResp = await commonUtils.createResponse(STATUS.ERROR.AUTEHNTICATION_FAILED, '', STATUS.ERROR.INTERNAL_SW[1])
            commonUtils.sendResponse(req, res, createdResp, next)
        }
    } else {
        logger.error(STATUS.API_SCHEMA_ERROR_CODES.ERROR_EC_USERLOGIN + STATUS.ERROR.EC_SERVICES_DISABLED[1] + JSON.stringify(AppConfig.isISASEnabled))
        let createdResp = await commonUtils.createResponse(STATUS.ERROR.AUTEHNTICATION_FAILED, '', STATUS.ERROR.EC_SERVICES_DISABLED[1])
        commonUtils.sendResponse(req, res, createdResp, next)
    }
}




/********** GET AUTHENTICATION TYPE FROM ISAS *****************/
async function getAuthenticationTypeFormSecurityPlugin(securityPlugin, ecAppResp) {
    logger.info(STATUS.EC_LOGS.MSG.IN_GET_AUTH_SECURITY_PLGN_MSG);
    let getAuthTypeApi = await commonUtils.getSecurityPluginAuthTypeApi(securityPlugin)
    let hashedBase64 = await commonUtils.createHmacHash(ecAppResp.ApplicationId, ecAppResp.ApplicationSecret)
    let apiSchema = await commonUtils.createApiSchemaForSecurityPlugin(getAuthTypeApi, 'GET', null, hashedBase64, null)
    // apiSchema.requestHeaders['x-forwarded-for'] = clientIpAddress
    // apiSchema.requestHeaders['x-forwarded-for'] = req.connection.remoteAddress

    return ISASctrl.fetchSecurityPluginApi(apiSchema).then(async successRes => {
        if (successRes && successRes.SecurityModelDetailsResponse.ErrorCode == 0) {
            return { success: true, response: successRes }
        } else {
            return { success: false, response: successRes }
        }
    }).catch(error => {
        return { success: false, response: error }
    })
}



/********** GET AUTHENTICATION REQUEST BASED ON ISAS AUTH TYPE *****************/
async function getAuthReqBodyBasedOnAuthType(getAuthTypeResp, userName, password) {
    let authenticationType = getAuthTypeResp.SecurityModelDetailsResponse.SecurityModel
    let requestBody
    if ((authenticationType).toLowerCase() == (config.IsasStandaloneUserAuthentication).toLowerCase()) {
        requestBody = await commonUtils.createStandaloneUserAuthenticationApiReqBody(userName, password, authenticationType)
    } else if ((authenticationType).toLowerCase() === (config.IsasLdapAuthentication).toLowerCase()) {
        requestBody = await commonUtils.createLDAPauthenticationApiReqBody(userName, password, authenticationType)
    }
    return requestBody
}



/********** CREATE SESSION LOGS *****************/
async function createSessionLog(sessionObj) {
    logger.info(STATUS.EC_LOGS.MSG.CREATE_SESSION_MSG);

    try {
        let sessionObj1 = {
            sid: sessionObj.sessionId,
            userName: sessionObj.userName,
            expires: sessionObj.expires,
            // data : JSON.stringify(sessionObj)
        }

        return models.sessionLogs.create(sessionObj1).then(sessResp => {
            return true
        }).catch(error => {
            return false
        })
    } catch (err) {
        logger.error(STATUS.EC_LOGS.MSG.ERROR_CREATE_SESSION_MSG);
        return false
    }

}



/******************* ALTERNATE AUTHENTICATION METHOD WITHOUT SECURITY PLUGIN ********************/
async function authentication(req, res, next) {
    let createdResp = commonUtils.createResponse(STATUS.SUCCESS, req.body)
    commonUtils.sendResponse(req, res, createdResp, next)
}



/********************* USER LOGOUT ************************/
async function logout(req, res, next) {
    logger.info(STATUS.EC_LOGS.MSG.IN_LOGOUT_MSG);
    if (req.headers.accesstoken) {
        let accessToken = req.headers.accesstoken
        try {
            models.mySessionStore.destroy(accessToken, async (err, sessionData) => {
                if (sessionData || (accessToken && sessionData == null)) {
                    if ((accessToken && sessionData == null)) {
                        let expiredUserLog = await CommonCtrl.getExpiredUserSessionLog(req.headers.accesstoken)
                        if (expiredUserLog.success === true) {
                            let createdResp = commonUtils.createResponse(STATUS.SUCCESS, " session expired")
                            commonUtils.sendResponse(req, res, createdResp, next)
                        }
                    } else {
                        let createdResp = commonUtils.createResponse(STATUS.SUCCESS, " logout Successfully")
                        commonUtils.sendResponse(req, res, createdResp, next)
                    }
                } else {
                    let createdResp = await commonUtils.createResponse(STATUS.ERROR.LOGOUT_FAILED_WITH_INVALID_TKN)
                    commonUtils.sendResponse(req, res, createdResp, next)
                }
            })
        } catch (error) {
            let createdResp = await commonUtils.createResponse(STATUS.ERROR.LOGOUT_FAILED_WITH_INVALID_TKN)
            commonUtils.sendResponse(req, res, createdResp, next)
        }
    } else {
        let createdResp = await commonUtils.createResponse(STATUS.ERROR.LOGOUT_FAILED, '', STATUS.ERROR.DB_FETCH[1])
        commonUtils.sendResponse(req, res, createdResp, next)
    }

}







/******************* Check Valid User ********************/


// async function checkValidUser(req,res,next){

//     if(req.headers.accesstoken){
//         let accessToken = req.headers.accesstoken
//         try{
//             models.mySessionStore.get(accessToken,(err,sessionData)=>{                   

//                 if(sessionData){
//                     let createdResp = commonUtils.createResponse(STATUS.SUCCESS, sessionData) 
//                     commonUtils.sendResponse(req, res, createdResp, next)
//                 }

//                 else if(accessToken.length > 40){
//                     let applicationValidation = crmControl.verifyToken(accessToken);
//                     applicationValidation
//                     .then(function(validation){


//                         let createdResp = commonUtils.createResponse(STATUS.SUCCESS, {valid:validation.response});
//                         commonUtils.sendResponse(req, res, createdResp, next);
//                     })                    
//                     .catch(function(err){
//                         let createdResp = commonUtils.createResponse(STATUS.ERROR.VALIDATE_USER, '',err); 
//                         commonUtils.sendResponse(req, res, createdResp, next);
//                     })
//                 }

//                 else{
//                     let createdResp = commonUtils.createResponse(STATUS.ERROR.VALIDATE_USER_WITH_INVALID_TKN) 
//                     commonUtils.sendResponse(req, res, createdResp, next)
//                 }
//             })
//         }catch(error){
//             let createdResp = commonUtils.createResponse(STATUS.ERROR.VALIDATE_USER_WITH_INVALID_TKN) 
//             commonUtils.sendResponse(req, res, createdResp, next)
//         }
//     }
// }

async function checkValidUser(req, res, next) {
    logger.info(STATUS.EC_LOGS.MSG.IN_CHECK_VALIDATOR_MSG +req.body)
    let accessToken = req.headers.accesstoken


    if (accessToken.length > 40) {
        let applicationValidation = await crmControl.verifyToken(accessToken);
        if (applicationValidation.success === true) {
            let createdResp = commonUtils.createResponse(STATUS.SUCCESS, { valid: applicationValidation.response });
            commonUtils.sendResponse(req, res, createdResp, next);
        } else {
            let clientIpAddress = await commonUtils.getClientIpAddress(req) //small function to add in commonUtils getClientIpAddress
            let applicationValidateWithIsas = await validateApplicationWithIsasToken(accessToken, clientIpAddress)
            if (applicationValidateWithIsas.success === true) {
                let createdResp = await commonUtils.createResponse(STATUS.SUCCESS, { valid: true })
                commonUtils.sendResponse(req, res, createdResp, next)
            } else {
                logger.error(STATUS.API_SCHEMA_ERROR_CODES.ERROR_EC_USER_VALIDATE + JSON.stringify(applicationValidateWithIsas.response))
                let createdResp = await commonUtils.createResponse(STATUS.ERROR.VALIDATE_USER, '', applicationValidateWithIsas.response)
                commonUtils.sendResponse(req, res, createdResp, next)
            }
        }
    } else {
        let userSessionInfo = await CommonCtrl.getUserSessionById(accessToken);
        if (userSessionInfo.success) {
            let sessionInfo = userSessionInfo.response
            let updateSession = await CommonCtrl.updateSessionExpiry(userSessionInfo.response);
            let userSessionObj = {
                sessionId: sessionInfo.sid,
                userName: sessionInfo.userName,
                accessToken: sessionInfo.accessToken,
                refreshToken: sessionInfo.refreshToken
            }

            if (req.headers.pluginuniquename) {
                let pluginUniqueName = req.headers.pluginuniquename
                userSessionObj.privileges = sessionInfo.pluginPrivileges[pluginUniqueName]
            }
            let createdResp = await commonUtils.createResponse(STATUS.SUCCESS, userSessionObj)
            commonUtils.sendResponse(req, res, createdResp, next)
        } else {
            logger.error(STATUS.API_SCHEMA_ERROR_CODES.ERROR_EC_USER_VALIDATE + JSON.stringify(userSessionInfo.response))
            let createdResp = await commonUtils.createResponse(STATUS.ERROR.VALIDATE_USER_WITH_INVALID_TKN)
            commonUtils.sendResponse(req, res, createdResp, next)
        }
    }

}

/******************* VALIDATE APPLICATION WITH ISAS HMAC TOKEN ********************/
async function  validateApplicationWithIsasToken(accessToken, clientIpAddress) {
    logger.info(STATUS.EC_LOGS.MSG.IN_VALIDATE_APP_WITH_ISAS_MSG);
    let securityPlugin = await ISASctrl.getSecurityPluginConfigInfo()
    let reqBodyOfValidateApplication = await commonUtils.createReqBodyOfValidateApplication(accessToken);  //this exist I have checked
    let validateApplicationApi = await commonUtils.createValidateApplicationApi(securityPlugin);
    let portalAppIdAndAppSecret = await ISASctrl.getPortalAppIdAndAppSecret();
    if (portalAppIdAndAppSecret && portalAppIdAndAppSecret.success === true) {
        let hashedBase64 = await commonUtils.createHmacHash(portalAppIdAndAppSecret.response.ApplicationId, portalAppIdAndAppSecret.response.ApplicationSecret)
        let apiSchema = await commonUtils.createApiSchemaForSecurityPlugin(validateApplicationApi, 'POST', reqBodyOfValidateApplication, hashedBase64, null)
        apiSchema.requestHeaders['x-forwarded-for'] = clientIpAddress
        return ISASctrl.fetchSecurityPluginApi(apiSchema).then(async successRes => {
            if (successRes && successRes.TokenValidityResponse && successRes.TokenValidityResponse.ErrorCode == 0 && successRes.TokenValidityResponse.IsValidApplication === true) {
                return { success: true, response: successRes.TokenValidityResponse.IsValidApplication }
            } else {
                return { success: false, response: STATUS.COMMON_MSGS.TKN_INVALID }
            }
        }).catch(error => {
            if (error && error.TokenValidityResponse && error.TokenValidityResponse.ErrorCode != 0) {
                return { success: false, response: error.TokenValidityResponse.IsValidApplication }
            } else {
                return { success: false, response: STATUS.ERROR.INTERNAL_SW[1] }
            }

        })
    } else {
        return { success: false, response: STATUS.ERROR.INTERNAL_SW[1] }
    }
}

/********************* GET PORTAL CONFIG DETAILS ************************/
async function getAppConfigInfo(req,res, next){
    try{
        let EcInfo = await ISASctrl.getPortalAppIdAndAppSecret();
        if(EcInfo && EcInfo.success === true){
            AppConfig.version = EcInfo.response.ApplicationVersion
            AppConfig.dateOfVersionCreated = EcInfo.response.createdAt
            let appConfigInfo = await commonUtils.createAppConfigInfoSchema(AppConfig)
            let createdResp = await commonUtils.createResponse(STATUS.SUCCESS, appConfigInfo) 
            commonUtils.sendResponse(req, res, createdResp, next)
        }else{
            logger.error(STATUS.API_SCHEMA_ERROR_CODES.ERROR_EC_GET_EC_CONFG_INFO + JSON.stringify(EcInfo.response))
            let createdResp = await commonUtils.createResponse(STATUS.ERROR.APP_CONFIG_INFO,'',STATUS.ERROR.INTERNAL_SW[1]) 
            commonUtils.sendResponse(req, res, createdResp, next)
        }

    }catch(error){
        logger.error(STATUS.API_SCHEMA_ERROR_CODES.ERROR_EC_GET_EC_CONFG_INFO + JSON.stringify(error))
        let createdResp = await commonUtils.createResponse(STATUS.ERROR.APP_CONFIG_INFO,'',STATUS.ERROR.INTERNAL_SW[1]) 
        commonUtils.sendResponse(req, res, createdResp, next)
    }
}
async function getAppPreInfo(req,res, next){
    logger.info(STATUS.EC_LOGS.MSG.IN_GET_APP_PRE_INFO_MSG);

    try{
        let PortalInfo = await ISASctrl.getPortalAppIdAndAppSecret();
        if(PortalInfo && PortalInfo.success === true){

            let preinfo = {
                version : PortalInfo.response.ApplicationVersion,
                dateOfVersionCreated : PortalInfo.response.CreatedDate,
                listNumber : _.get(process.env, "APP_LIST_NUMBER", 17485)
            }
            let createdResp = await commonUtils.createResponse(STATUS.SUCCESS, preinfo) 
            commonUtils.sendResponse(req, res, createdResp, next)
        }else{
            logger.error(STATUS.API_SCHEMA_ERROR_CODES.ERROR_EC_GET_EC_CONFG_INFO + JSON.stringify(PortalInfo.response))
            let createdResp = await commonUtils.createResponse(STATUS.ERROR.APP_CONFIG_INFO,'',STATUS.ERROR.INTERNAL_SW[1]) 
            commonUtils.sendResponse(req, res, createdResp, next)
        }

    }catch(error){
        logger.error(STATUS.API_SCHEMA_ERROR_CODES.ERROR_EC_GET_EC_CONFG_INFO + JSON.stringify(error))
        let createdResp = await commonUtils.createResponse(STATUS.ERROR.APP_CONFIG_INFO,'',STATUS.ERROR.INTERNAL_SW[1]) 
        commonUtils.sendResponse(req, res, createdResp, next)
    }
}





module.exports = {
    login: login,
    logout: logout,
    authentication: authentication,
    getAuthReqBodyBasedOnAuthType: getAuthReqBodyBasedOnAuthType,
    checkValidUser: checkValidUser,
    validateApplicationWithIsasToken:validateApplicationWithIsasToken,
    getAppConfigInfo : getAppConfigInfo,
    getAppPreInfo:getAppPreInfo,
}
