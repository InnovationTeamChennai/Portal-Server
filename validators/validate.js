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
* File Name: validate.js
*
* DESCRIPTION
* This code contains Enterprise Portal API header validators, privilege checking and middleware validation functions/methods
*
*
* ========================================================================================
*/
const _ = require('lodash');
var moment = require('moment');
const models = require('../database');
var {validateApplicationWithIsasToken} = require('../controllers/users.server.controller')
var { updateSessionExpiry, getUserSessionById, updateIsasAccessToken, checkUserPrivilegeAccess } = require('../controllers/common.server.controller');
var AppConfig = require('../config/app-config')
var getClientIpAddress = require('../utils/common.utils').getClientIpAddress;
var STATUS = require('../utils/status-codes-messages.utils');

var logger = require('../utils/winston.utils').PortalLogs;
module.exports = {
    user: {
        checkAccesstoken: function (req, res, next) {
            if (!req.headers.accesstoken) {
                return res.status(401).send({
                    message: STATUS.COMMON_MSGS.ACCESS_TOKEN_EXPIRE
                })
            }
            next();
        },
        requiresLogin: function (req, res, next) {
            if (!req.headers.accesstoken) {
                return res.status(401).send({
                    message: STATUS.COMMON_MSGS.TOKEN_NOT_FOUND_IN_HEADER
                })
            }
            next();
        }
    },

    checkIsServicesEnabled: function (req, res, next) {
        if (!AppConfig.isServicesEnabled) {
            return res.status( STATUS.COMMON_MSGS.HTTP_ERR_CODE).send({
                message: STATUS.ERROR.EC_SERVICES_DISABLED[1]
            })
        }
        next();

    },


    checkReqHeaders: async function(req,res,next){
        // (req.path == '/application/register') ||
        if(req.path == '/user/login' || (req.path == '/user/app/preinfo') ||  (req.path.match(/^\/plugin\//) != null )){
            next()            
        }else if(req.headers && req.headers.accesstoken){
            next()
        }else{
            let clientIpAddress = await getClientIpAddress(req)
            logger.error(STATUS.COMMON_MSGS.EC_TOKEN_NTFOUND_STATUS_CODE + STATUS.COMMON_MSGS.EC_TOKEN_NTFOUND_STATUS_MSG + 'From IP:-' + clientIpAddress)
            return res.status(401).send({
                errCode : STATUS.COMMON_MSGS.EC_TOKEN_NTFOUND_STATUS_CODE,
                message: STATUS.COMMON_MSGS.EC_TOKEN_NTFOUND_STATUS_MSG
            })
        }    
    },


    checkAdminPrivileges: async function(req,res,next){
        let sessionId = req.headers.accesstoken
        let appPrivilegesKeys = JSON.parse(process.env.APP_PRIVILEGES_KEYS)
        let userAccess = await checkUserPrivilegeAccess(sessionId, appPrivilegesKeys.canAddAndEditCustomerAndProduct)
        if(userAccess.success){
            next()
        }else{
            return res.status(440).send(userAccess.response)
        }
    },
    

    checkPluginUserPrivileges: async function(req,res,next){
        let sessionId = req.headers.accesstoken
        let appPrivilegesKeys = JSON.parse(process.env.APP_PRIVILEGES_KEYS)
        let userAccess = await checkUserPrivilegeAccess(sessionId, appPrivilegesKeys.canViewProductAndPlugins)
        if(userAccess.success){

            next()
        }else{
            return res.status(440).send(userAccess.response)
        }
    },

    


    
    checkUserPrivileges: async function(req,res,next){
        let sessionId = req.headers.accesstoken
        let appPrivilegesKeys = JSON.parse(process.env.APP_PRIVILEGES_KEYS)
        let userAccess = await checkUserPrivilegeAccess(sessionId, appPrivilegesKeys.canViewCustomer)
        if(userAccess.success){
            next()
        }else{
            return res.status(440).send(userAccess.response)
        }
    },

    validateUniqueId: async function(req,res,next){
        const re = /^^[0-9a-fA-F]{8}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{12}/;
        var result= re.test(String(req.body[0].Uid));
        if(result == true){
            next();
        
        }else{
            return res.status(440).send({Message:STATUS.COMMON_MSGS.UUID_NOT_MATCH_WITH_SCHEMA});
        }
      
    },

    
    checkSessionExpiry: async function (req, res, next) {
        // || (req.path == '/application/register') 
        if ((req.path == '/user/login') || (req.path == '/user/logout') || (req.path == '/customers/postHierarchy')|| (req.path == '/user/app/preinfo')||(req.path == '/customers/getToken') ||(req.path == '/customers/validateCustomer') ||
        (req.path == '/customers/verifyToken')|| (req.path == '/user/valid') || (req.path == '/customers/getLicensedProducts') ||(req.path == '/plugins/getLSAInfo') || (req.path.match(/^\/plugin\//) != null)) {
        next()
        } else {

            let clientIpAddress = await getClientIpAddress(req)
            if (!req.headers.accesstoken) {
                logger.error(STATUS.COMMON_MSGS.EC_TOKEN_NTFOUND_STATUS_CODE + STATUS.COMMON_MSGS.EC_TOKEN_NTFOUND_STATUS_MSG )
                return res.status(401).send({
                    errCode : STATUS.COMMON_MSGS.EC_TOKEN_NTFOUND_STATUS_CODE,
                    message: STATUS.COMMON_MSGS.EC_TOKEN_NTFOUND_STATUS_MSG
                })
            } else if(((req.path == '/hierarchy/tree') || (req.path == '/plugins')) && req.headers.accesstoken.length > 40) {
                let applicationValidateWithIsas = await validateApplicationWithIsasToken(req.headers.accesstoken, clientIpAddress)
                if (applicationValidateWithIsas.success === true) {
                    next()
                } else {
                    logger.error(STATUS.COMMON_MSGS.EC_API_FAIL_STATUS_CODE + 'From IP:-' + clientIpAddress + ' : ' + JSON.stringify(applicationValidateWithIsas.response))
                    return res.status(401).send({errCode : STATUS.COMMON_MSGS.EC_API_FAIL_STATUS_CODE, message: applicationValidateWithIsas.response})
                }
            }else {

                let userSession = await getUserSessionById(req.headers.accesstoken);

                if (userSession.success === true) {
                    let tokenRefreshedAt = new Date(userSession.response.tokenRefreshedAt).getTime();
                    let IsasTokenExpiryTime = new Date(tokenRefreshedAt + parseInt(userSession.response.tokenTimeOutInterval));
                    let startTime = moment()
                    let end = moment(IsasTokenExpiryTime)
                    if (end.diff(startTime, 'seconds') < 70) {
                        // if(true){
                        let updateTokenResp = await updateIsasAccessToken(req.headers.accesstoken, userSession.response);
                        if (updateTokenResp.success) {
                            next()
                        } else {
                            // return res.status(500).send({ errCode: 'SESS_EXP', message: "Failed to update token" })
                            let updateSession = await updateSessionExpiry(userSession.response);
                            if(updateSession.success === true){                            
                                next()
                            }else{
                                logger.error(STATUS.COMMON_MSGS.EC_API_FAIL_STATUS_CODE +  JSON.stringify(updateSession.response))
                         
                                return res.status(440).send(updateSession.resopnse)
                            }
                        }
                    } else {
                        let updateSession = await updateSessionExpiry(userSession.response);
                        if (updateSession.success === true) {
                            next()
                        } else {
                            logger.error(STATUS.COMMON_MSGS.EC_API_FAIL_STATUS_CODE+ JSON.stringify(updateSession.response))
                         
                            return res.status(440).send(updateSession.resopnse)
                        }
                    }

                } else {
                    logger.error(STATUS.COMMON_MSGS.EC_API_FAIL_STATUS_CODE + JSON.stringify(userSession.response))
               
                    return res.status(440).send(userSession.response)
                }


            }
        }
    }











}