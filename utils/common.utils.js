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
* File Name: common.utils.js
*
* DESCRIPTION
* This code contains Enterprise Manager hierarchy nodes creation, updation, deletion and adding of plugin instances
* under hierarchy tree
*
* ========================================================================================
*/
var jsonxml = require('jsontoxml');
var path = require('path');
var o2x = require('object-to-xml');
const fs = require('fs');
const glob = require('glob');
var moment = require('moment');
var crypto = require('crypto');
var AppConfig = require('../config/app-config')
const _ = require('lodash');
const uuidv1 = require('uuid/v1');
const requestIp = require('request-ip');

var dpapi = require('../lib/win-dpapi');

var STATUS = require('./status-codes-messages.utils')

let zeroLength=0
let oneLength=1;

/*********************************************************
 ******** create schema of plugin config info   ******
**********************************************************/

async function schemaOfPluginConfigInfo(pluginInfo, previousDataOfPluginInfo) {
    if (previousDataOfPluginInfo) {
        pluginInfo.Uid = previousDataOfPluginInfo.Uid
    }
    let schema = {
        Uid: pluginInfo.Guid ? pluginInfo.Guid : pluginInfo.Uid ? pluginInfo.Uid : uuidv1(),
        Name: pluginInfo.name ? pluginInfo.name : '',
        UniqueName: pluginInfo.uniqueName ? pluginInfo.uniqueName : '',
        Version: pluginInfo.version ? _.toString(pluginInfo.version) : '',
        Description: pluginInfo.description ? pluginInfo.description : '',
        UiPort: pluginInfo.uiPort ? _.toString(pluginInfo.uiPort) : '',
        BaseUrl: pluginInfo.baseUrl ? pluginInfo.baseUrl : '',
        Type: pluginInfo.type ? pluginInfo.type : '',
        Instances: pluginInfo.instances ? _.toString(pluginInfo.instances) : '',
        ServerPort: pluginInfo.serverPort ? _.toString(pluginInfo.serverPort) : '',
        PrependUrl: pluginInfo.prependUrl ? pluginInfo.prependUrl : '',
        IconUrl: pluginInfo.iconUrl ? pluginInfo.iconUrl : '',
        UiUrls: pluginInfo.uiUrls ? JSON.stringify(pluginInfo.uiUrls) : '',
        ServerUrls: pluginInfo.serverUrls ? JSON.stringify(pluginInfo.serverUrls) : '',
        IsRegistered: pluginInfo.IsRegistered ? pluginInfo.IsRegistered : false,
        ServicesEnabled: pluginInfo.ServicesEnabled ? pluginInfo.ServicesEnabled : false,
        IsLicenced: pluginInfo.IsLicenced ? pluginInfo.IsLicenced : false,
        IsActive: pluginInfo.IsActive ? pluginInfo.IsActive : true,
        CreatedDate: pluginInfo.CreatedDate,
        LastModifiedDate: pluginInfo.LastModifiedDate
    }

    return schema;
}

/*********************************************************
 ******** create schema of node creation  ******
**********************************************************/
async function schemaOfNodeCreation(nodeObj, req) {
    let schema = {
        NodeName: nodeObj.nodeName ? nodeObj.nodeName : null,
        NodeShortName: nodeObj.nodeShortName ? nodeObj.nodeShortName : nodeObj.nodeName,
        ParentID: nodeObj.parentId ? nodeObj.parentId : null,
        NodeType: nodeObj.nodeType ? nodeObj.nodeType : null,
        TypeOf: nodeObj.typeOf == zeroLength ? zeroLength : nodeObj.typeOf != zeroLength ? nodeObj.typeOf : null,
        PluginID: nodeObj.pluginId ? nodeObj.pluginId : null,
        NodeInfo: nodeObj.nodeInfo ? nodeObj.nodeInfo : null,
        PluginInfoId: nodeObj.pluginInfoId ? nodeObj.pluginInfoId : null,
        IsActive: nodeObj.isActive ? nodeObj.isActive : null,
        CreatedBy: nodeObj.nodeUid ? null : 'test',
        ModifiedBy: req.session ? req.session.user ? req.session.user : 'test' : 'test'
    }
    if (nodeObj.uid) {
        schema.Uid = nodeObj.uid
    }
    return await schema;
}

/*********************************************************
 ******** CREATE API TO GET PLUGIN CONFIG DETAIL  ******
**********************************************************/
async function createApiToGetPluginConfigDetails(baseUrl, serverPort, prependUrl) {
    return baseUrl + ':' + serverPort + prependUrl + AppConfig.PortalUrls.getPluginConfigDetailsAPI
}

/*********************************************************
 ******** CREATE REGISTRATION API ***********************
**********************************************************/
async function createRegisterationApi(securityPluginInfo) {
    let registerationApi
    if (securityPluginInfo && securityPluginInfo.ServerPort && securityPluginInfo.BaseUrl && securityPluginInfo.ServerUrls) {
        let securityPluginBaseUrl = securityPluginInfo.BaseUrl,
            securityPluginPort = securityPluginInfo.ServerPort,
            securityPluginServerUrls = securityPluginInfo.ServerUrls
        if (securityPluginServerUrls.applicationRegistration) {
            registerationApi = securityPluginBaseUrl + ':' + securityPluginPort + '/' + securityPluginServerUrls.applicationRegistration
        } else {
            registerationApi = false
        }
        return registerationApi
    } else {
        return false
    }
}

/*********************************************************
 ******** CREATE PRIVILEGES REGISTRATION API  ******
**********************************************************/
async function createPrivilegesRegisterationApi(securityPluginInfo) {
    let privilegesRegisterationApi
    if (securityPluginInfo && securityPluginInfo.ServerPort && securityPluginInfo.BaseUrl && securityPluginInfo.ServerUrls) {
        let securityPluginBaseUrl = securityPluginInfo.BaseUrl,
            securityPluginPort = securityPluginInfo.ServerPort,
            securityPluginServerUrls = securityPluginInfo.ServerUrls

        privilegesRegisterationApi = securityPluginBaseUrl + ':' + securityPluginPort + '/' + securityPluginServerUrls.privilegeRegistration
        return privilegesRegisterationApi
    } else {
        return privilegesRegisterationApi = false
    }
}

/*********************************************************
 ********  CREATE API FOR AUTHENTICATION   ******
**********************************************************/
async function createAuthenticationApi(securityPluginInfo) {
    
    let authenticationApi
    if (securityPluginInfo && securityPluginInfo.ServerPort && securityPluginInfo.BaseUrl && securityPluginInfo.ServerUrls) {
        let securityPluginBaseUrl = securityPluginInfo.BaseUrl,
            securityPluginPort = securityPluginInfo.ServerPort,
            securityPluginServerUrls = securityPluginInfo.ServerUrls

        authenticationApi = securityPluginBaseUrl + ':' + securityPluginPort + '/' + securityPluginServerUrls.userAuthentication
        return authenticationApi
    } else {
        return authenticationApi = false
    }
}

/************************************************************
 ********  CRAETE API TO GET ROLES AND PRIVILEGS FOR USER****
*************************************************************/
async function createApiToGetRolesAndPrivilegesForUser(securityPluginInfo) {
    let getRolesAndPrivilegesApi
    if (securityPluginInfo && securityPluginInfo.ServerPort && securityPluginInfo.BaseUrl && securityPluginInfo.ServerUrls) {
        let securityPluginBaseUrl = securityPluginInfo.BaseUrl,
            securityPluginPort = securityPluginInfo.ServerPort,
            securityPluginServerUrls = securityPluginInfo.ServerUrls

        getRolesAndPrivilegesApi = securityPluginBaseUrl + ':' + securityPluginPort + '/' + securityPluginServerUrls.introspect
        return getRolesAndPrivilegesApi
    } else {
        return getRolesAndPrivilegesApi = false
    }
}

/*********************************************************
 ******** CREATE API SCHEMA OF SECURITY PLUGIN   ******
**********************************************************/

async function createApiSchemaForSecurityPlugin(reqApi, reqMethod, requestBody, hashedBase64, reqHeaders) {
    let headers = hashedBase64 ? { "Content-Type": 'application/json', "Authorization": "Basic " + hashedBase64 } : { "Content-Type": 'application/json' }
    if (reqHeaders) {
        headers["accesstoken"] = "abcd1234"
    }
    let apiSchema
    let reqMethodtype ="put"
    let reqMethodtype1= "post"
    if (((reqMethod).toLowerCase() == reqMethodtype) || (reqMethod).toLowerCase() == reqMethodtype1) {
        requestBody = JSON.stringify(requestBody)
        apiSchema = {
            requestApi: reqApi,
            requestMethod: reqMethod,
            requestHeaders: headers,
            requestBody: requestBody
        }
    } else {
        apiSchema = {
            requestApi: reqApi,
            requestMethod: reqMethod,
            requestHeaders: headers
        }
    }

    return apiSchema
}

/*********************************************************
 ******** CREATE REQ BODY OF GET NEW TOKEN **************
**********************************************************/
async function createReqBodyOfGetNewToken(refreshToken) {
    let reqBody = {
        newtokenrequest: {
            refreshtoken: refreshToken
        }
    }
    return reqBody;
}
/*********************************************************
 ******** CRAETE API SCHEMA TO GET NEW TOKEN  ************
**********************************************************/
async function createApiSchemaToGetNewToken(securityPluginInfo) {
    if (securityPluginInfo && securityPluginInfo.ServerPort && securityPluginInfo.BaseUrl && securityPluginInfo.ServerUrls) {
        let getNewTokenApi;
        let securityPluginBaseUrl = securityPluginInfo.BaseUrl,
            securityPluginPort = securityPluginInfo.ServerPort,
            securityPluginServerUrls = securityPluginInfo.ServerUrls
        if (securityPluginServerUrls.getNewToken) {
            getNewTokenApi = securityPluginBaseUrl + ':' + securityPluginPort + '/' + securityPluginServerUrls.getNewToken
            return { success: true, response: getNewTokenApi }
        } else {
            return { success: false, response: "'getNewToken'" + STATUS.COMMON_MSGS.REQUIRED_FIELDS_NTFOUND_IN_SECURITY_PLGN_INFO }
        }
    } else {
        return { success: false, response: STATUS.COMMON_MSGS.REQUIRED_FIELDS_NTFOUND_IN_SECURITY_PLGN_INFO }
    }
}
/*********************************************************
 ******** CREATE APP CONFIG INFO SCHEMA   ******
**********************************************************/
async function createAppConfigInfoSchema(appConfig) {
    let appConfigInfo = {
        Name: appConfig.name,
        Description: appConfig.description,
        UniqueName: appConfig.uniqueName,
        Version: appConfig.version,
        UiPort: 4200,
        BaseUrl: appConfig.baseUrl,
        ServerPort: appConfig.serverPort,
        SecurityApp: appConfig.securityApp,
        Type: 'Default',
        Privileges: appConfig.privileges,
        IsRegistered: false,
        ServicesEnabled: appConfig.isServicesEnabled,
        AppEnv : appConfig.appEnv    
    }
    return appConfigInfo
}


/*********************************************************
 ******** CREATE RESPONSE FOR EACH AND EVERY API ******
**********************************************************/
function createResponse(status, respData, errorData) {
    let response = {
        responseCode: status[zeroLength],
        statusCode: status[2]
    }

    if (status[zeroLength] != zeroLength) {
        response.statusMessage = status[oneLength]
    }

    if (respData) {
        response.data = respData
    }

    if (errorData) {
        response.errorMessage = errorData
    }

    return response;
}

/*********************************************************
 ******** SEND THE RESPONSE FOR EVERY API   ******
**********************************************************/
function sendResponse(req, res, message, next) {
    if (req.headers['content-type'] && req.headers['content-type'].toLowerCase().indexOf("xml") != -1) {
        res.set('Content-Type', 'text/xml');
        res.status(message.statusCode).send(o2x({
            '?xml version="1.0" encoding="utf-8"?': null,
            message
        }));
    } else {
        res.status(message.statusCode).send(message)
    }

}

/***************************************
 ******** CREATE HMAC HASH ID**********
****************************************/

async function createHmacHash(ApplicationId, ApplicationSecret) {

    let UtcDateTime = moment.utc().format();
    let hmac = await crypto.createHmac('sha256', ApplicationSecret).update(UtcDateTime.toString()).digest('hex');
    let jsonObj = ApplicationId + ":" + UtcDateTime.toString() + ":" + hmac;
    let hashedBase64 = Buffer.from(jsonObj).toString('base64')
 
    return hashedBase64
}



/*********************************************************
 ******** CREATE REGISTER APPLICATION BODY ***********
**********************************************************/

async function createRegisterApplicationBody(appName, appVersion, adminName, adminEmail, appPrivileges) {
    let requestBody = {
        ApplicationRegistration: {
            ApplicationName: appName,
            ApplicationVersion: appVersion,
            AdminName: adminName,
            AdminEmail: adminEmail,
            PrivilegeDetails: {
                Privilege: []
            }
        }
    }
    let returnObj
    if (_.isArray(appPrivileges)) {
        let privilegeArr = []
        let count = zeroLength
        _.forEach(appPrivileges, (privilege) => {
            let privilegeSchema = {
                name: privilege.name,
                key: privilege.key
            }

            count = count + oneLength
            privilegeArr.push(privilegeSchema)
            
            if (count == appPrivileges.length) {
                if (privilegeArr < appPrivileges.length) {
                    returnObj = { success: false, response: STATUS.COMMON_MSGS.PRIVILEGES_SCHEMA_NOT_MATCH }
                } else {
                    requestBody.ApplicationRegistration.PrivilegeDetails.Privilege = privilegeArr
                    returnObj = { success: true, response: requestBody }
                }
            }   
        })
    } else if (_.isPlainObject(appPrivileges)) {
        let privilegeArr = []
        privilegeArr.push(appPrivileges)
        requestBody.ApplicationRegistration.PrivilegeDetails.Privilege = privilegeArr
        returnObj = { success: true, response: requestBody }
    } else {
        returnObj = { success: false, response: STATUS.COMMON_MSGS.PRIVILEGES_SHOULD_BE_IN_ARRAY }
    }
    return returnObj
}

/*********************************************************
 ******** ADDING THE PRODUCT IN THE PRODUCT TABLE  ******
**********************************************************/
async function createPrivilegeRegistrationApiBody(appPrivileges) {
    let privilegeArr = []
    let configFilePrivileges = appPrivileges
    let returnObj
    if (_.isArray(configFilePrivileges)) {
        let count = zeroLength
        let requestBody2 = {
            privilegeregistration: {
                privilege: []
            }
        }
        _.forEach(configFilePrivileges, (configPrivilege) => {
            let privilegeSchema = {
                name: configPrivilege.name,
                description: configPrivilege.description,
                key: configPrivilege.key
            }

            count = count + oneLength
            privilegeArr.push(privilegeSchema)
            if (count == configFilePrivileges.length) {
                if (privilegeArr < configFilePrivileges.length) {
                    returnObj = { success: false, response: STATUS.COMMON_MSGS.PRIVILEGES_SCHEMA_WITH_DESC_NOT_MATCH }
                } else {
                    requestBody2.privilegeregistration.privilege = privilegeArr
                    returnObj = { success: true, response: requestBody2 }
                }
            }
        })
    } else {
        returnObj = { success: false, response: STATUS.COMMON_MSGS.PRIVILEGES_SHOULD_BE_IN_ARRAY }
    }
    return returnObj
}

/*********************************************************
 ******** CREATE LDAP AUTHENTCATION API REQ BODY  ******
**********************************************************/
async function createLDAPauthenticationApiReqBody(userName, password, authenticationType) {
    let requestBody = {
        authenticationRequest: {
            authenticationType: authenticationType,
            authenticationMethod: 'Password',
            siteid : "1",       
            authenticationParameters: {
                username: userName,
                password: password

            }
        }
    }
    return requestBody;
}

/*********************************************************
 ******** CREATE STANDALONE USER AUTHENTICATION API ******
**********************************************************/
async function createStandaloneUserAuthenticationApiReqBody(userName, password, authenticationType) {
    let requestBody = {
        authenticationRequest: {
            authenticationType: authenticationType,
            authenticationMethod: 'Password',
            siteid : "1",
            authenticationParameters: {
                username: userName,
                password: password
            }
        }
    }
    return requestBody;
}

/********************************************************************
 ******** CREATE REQ.BODY TO GET ROLES ANF PRIVILEGES FOR USER  ******
**********************************************************************/
async function createReqBodyToGetRolesAndPrivilegesForUser(userAccessToken, siteId) {
    let requestBody = {
        introspectrequest: {
            accesstoken: userAccessToken,
            siteid: siteId
        }
    }
    return requestBody;
}


/***********************************
 ******** CREATE USER SESSION ******
************************************/

async function createUserSession(req, response){
    let userPrivileges = await assignUserPrivileges(response.MappedPrivileges)
    try{
        let currentExpiryTime = new Date(response.AccessToken_ExpiryTime) - new Date(Date.now())
        let sessionId  = req.session.id, sessionExpiry  = new Date(Date.now() + parseInt(currentExpiryTime))
        let sessionObj = {
            sessionId : sessionId,
            userName : response.UserDetails.Username,
            mappedPrivileges : userPrivileges,
            expires : sessionExpiry,
        }
        req.session.userName = response.UserDetails.Username
        req.session.accessToken = response.AccessToken
        req.session.refreshToken = response.RefreshToken
        req.session.privileges = JSON.stringify(userPrivileges)
        req.session.expires = sessionExpiry
        req.session.tokenRefreshedAt = new Date(Date.now()),
        // req.session.accessTokenExpiryTime = response.AccessToken_ExpiryTime,
        // req.session.data = currentExpiryTime
        req.session.tokenTimeOutInterval = currentExpiryTime
        req.session.cookie.expires = sessionExpiry
        return await sessionObj
        
    }catch(error){
        let currentExpiryTime = new Date(response.AccessToken_ExpiryTime) - new Date(Date.now())

        let sessionId  = req.session.id, sessionExpiry  = new Date(Date.now() + parseInt(currentExpiryTime))
        let sessionObj = {
            sessionId : sessionId,
            userName : response.userName,
            mappedPrivileges : JSON.stringify(userPrivileges),
            // authenticationType : response.authenticationType,
            expires : sessionExpiry,
            // tokenRefreshedAt : new Date(Date.now()),
            // tokenTimeOutInterval : currentExpiryTime
            // data : currentExpiryTime
        }
        return sessionObj
    }
}



/*********************************************************
 ******** CREATE DEFAULT USER REQ BODY ******
**********************************************************/
async function createDefaultUserReqBody(rootNodeInfo) {
    let nodenameKeyword="Enterprises";
    let nodetypeKeyword = 'enterprise-hierarchy'
    let requestBody = {
        defaultUserRequest: {
            nodeinfo: {
                uid: rootNodeInfo.Uid,
                nodeid: oneLength,
                nodename: nodenameKeyword,
                nodetype: nodetypeKeyword,
                adminemail:AppConfig.AdminEmail,
                adminmobile:AppConfig.AdminMobileNo

            }
        }
    }
    return requestBody;
}

/*********************************************************
 ******** CREATE DEFAULT USER API SCHEMA   ******
**********************************************************/

async function createDefaultUserApiSchema(securityPluginInfo) {
    let createDefaultUserApi
    if (securityPluginInfo && securityPluginInfo.ServerPort && securityPluginInfo.BaseUrl && securityPluginInfo.ServerUrls) {
        let securityPluginBaseUrl = securityPluginInfo.BaseUrl,
            securityPluginPort = securityPluginInfo.ServerPort,
            securityPluginServerUrls = securityPluginInfo.ServerUrls

        createDefaultUserApi = securityPluginBaseUrl + ':' + securityPluginPort + '/' + securityPluginServerUrls.createDefaultUser
        return createDefaultUserApi
    } else {
        return createDefaultUserApi = false
    }
}

/*********************************************************
 ******** CREATE REQ BODY OF VALIDATE APPLICATION   ******
**********************************************************/
async function createReqBodyOfValidateApplication(accessToken) {
    let reqBody = {
        Validateapplicationrequest: {
            Applicationtoken: accessToken
        }
    }
    return reqBody;
}
/*********************************************************
 ******** CREATE VALIDATE APPLICATION API   ******
**********************************************************/
async function createValidateApplicationApi(securityPluginInfo) {
    let getValidateApplicationApi
    if (securityPluginInfo && securityPluginInfo.ServerPort && securityPluginInfo.BaseUrl && securityPluginInfo.ServerUrls) {
        let securityPluginBaseUrl = securityPluginInfo.BaseUrl,
            securityPluginPort = securityPluginInfo.ServerPort,
            securityPluginServerUrls = securityPluginInfo.ServerUrls
        if (securityPluginServerUrls.validateApplication) {
            getValidateApplicationApi = securityPluginBaseUrl + ':' + securityPluginPort + '/' + securityPluginServerUrls.validateApplication
        } else {
            getValidateApplicationApi = false
        }
        return getValidateApplicationApi
    } else {
        return false
    }
}

/*********************************************************
 ******** API SCHEMA VALIDATION RESP  ******
**********************************************************/

async function apiSchmeaValidationResp(res, status) {
    return res.status(status[2]).send({
        message: status[oneLength]
    })
}


/*********************************************************
 ******** ASSIGN USER PRIVILEGES  ******
**********************************************************/

async function assignUserPrivileges(userPrivileges) {
    let finalUserPrivileges = {}
    let appPrivilegeKey = JSON.parse(process.env.APP_PRIVILEGES_KEYS)
    userPrivileges.map(appPrivilege => {
        for (let key in appPrivilegeKey) {
            if ((appPrivilege.Privilege.Key).toLowerCase() == (appPrivilegeKey[key]).toLowerCase()) {
                finalUserPrivileges[key] = appPrivilegeKey[key]
            }
        }
    })
    return finalUserPrivileges
}

/*********************************************************
 ******** GET SECURITY PLUGIN AUTH TYPE API  ******
**********************************************************/
async function getSecurityPluginAuthTypeApi(securityPluginInfo){
    let getAuthenticationTypeApi
    if(securityPluginInfo && securityPluginInfo.ServerPort && securityPluginInfo.BaseUrl && securityPluginInfo.ServerUrls){
        let securityPluginBaseUrl = securityPluginInfo.BaseUrl,
            securityPluginPort = securityPluginInfo.ServerPort, 
            securityPluginServerUrls = securityPluginInfo.ServerUrls
        if(securityPluginServerUrls.getSecurityModel){
            getAuthenticationTypeApi = securityPluginBaseUrl +':'+ securityPluginPort +'/' + securityPluginServerUrls.getSecurityModel
        }else{
            getAuthenticationTypeApi = false
        }        
        return getAuthenticationTypeApi
    }else{
        return false
    }
}
/*************************************
 ******** GET CLIENT IP ADDRESS******
**************************************/
async function getClientIpAddress (req){
    const clientIp = requestIp.getClientIp(req); 
      let fullIPAddress=clientIp.split(':');
      let ipAddress= (fullIPAddress[fullIPAddress.length-1]==='1')?'127.0.0.0':fullIPAddress[fullIPAddress.length-1];   
      return ipAddress;
}

/*********************************************************
 ********PASSWORD  DECRYPTION  WITH DP API ******
**********************************************************/
async function decryptWithDpapi(encryptedString){
	
	
    if((encryptedString != '') || (encryptedString != undefined) || (encryptedString != null)){
        try{
            let encryptedData = Buffer.from(encryptedString,'base64');
            let decryptedData = dpapi.unprotectData(encryptedData, null,'LocalMachine');
            decryptedData = decryptedData.toString('utf-8');
            return {success:true, response: decryptedData}
        }catch(err){
	        return {success:false, response:STATUS.COMMON_MSGS.FAILED_TO_DECRYPT}
        }

    }else{
        return {success:false, response: STATUS.COMMON_MSGS.EMPTY_INPUT_FOUND}
    }
}


/*********************************************************
 ******** PASWORD ENCRYPTION   WITH DP API ******
**********************************************************/
async function encryptWithDpapi(password){
    if((password != '') || (password != undefined) || (password != null)){
        try{
            let encryptPassword = Buffer.from(password,'utf-8');
            encryptPassword = dpapi.protectData(encryptPassword, null, "LocalMachine");
            encryptPassword = encryptPassword.toString('base64');
            return {success:true, response: encryptPassword}
        }catch(err){
            return {success:false, response:STATUS.COMMON_MSGS.FAILED_TO_DECRYPT}
        }

    }else{
        return {success:false, response: STATUS.COMMON_MSGS.EMPTY_INPUT_FOUND}
    }

}

/*********************************************
 ******** CHECKING BASE 64 IS ENCRYPTED ******
**********************************************/
async function isBaseEncrypted(configPswd){
    if(configPswd){
      var base64Rejex =new RegExp(/^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}==)?$/);  
      var base64Data=configPswd;
      var isBase64Valid = base64Rejex.test(base64Data);
      return isBase64Valid
    }else{
      return false
    }
    
}


module.exports = {
    schemaOfPluginConfigInfo: schemaOfPluginConfigInfo,
    schemaOfNodeCreation: schemaOfNodeCreation,
    createRegisterationApi: createRegisterationApi,
    createPrivilegesRegisterationApi: createPrivilegesRegisterationApi,
    createApiToGetPluginConfigDetails: createApiToGetPluginConfigDetails,
    createPrivilegeRegistrationApiBody: createPrivilegeRegistrationApiBody,
    createApiSchemaForSecurityPlugin: createApiSchemaForSecurityPlugin,
    createLDAPauthenticationApiReqBody: createLDAPauthenticationApiReqBody,
    createStandaloneUserAuthenticationApiReqBody: createStandaloneUserAuthenticationApiReqBody,
    createAuthenticationApi: createAuthenticationApi,
    createApiToGetRolesAndPrivilegesForUser: createApiToGetRolesAndPrivilegesForUser,
    createReqBodyToGetRolesAndPrivilegesForUser: createReqBodyToGetRolesAndPrivilegesForUser,
    createUserSession: createUserSession,
    createAppConfigInfoSchema: createAppConfigInfoSchema,
    createReqBodyOfGetNewToken: createReqBodyOfGetNewToken,
    createApiSchemaToGetNewToken: createApiSchemaToGetNewToken,
    createReqBodyOfValidateApplication: createReqBodyOfValidateApplication,
    createValidateApplicationApi: createValidateApplicationApi,
    apiSchmeaValidationResp: apiSchmeaValidationResp,
    sendResponse: sendResponse,
    createResponse: createResponse,
    createHmacHash: createHmacHash,
    createRegisterApplicationBody: createRegisterApplicationBody,
    createDefaultUserReqBody: createDefaultUserReqBody,
    createDefaultUserApiSchema: createDefaultUserApiSchema,
    getSecurityPluginAuthTypeApi:getSecurityPluginAuthTypeApi,
    getClientIpAddress:getClientIpAddress,
	decryptWithDpapi : decryptWithDpapi,
    encryptWithDpapi : encryptWithDpapi,
    isBaseEncrypted : isBaseEncrypted

}