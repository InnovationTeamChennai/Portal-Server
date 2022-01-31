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
* File Name: rehost.server.controller.js
*
* DESCRIPTION
* This code contains to redirectio of API calls via Enterprise Manager to Enterprise Manager Plugin API's communocation
*
*
* ========================================================================================
*/
var _ = require('lodash');
var STATUS = require('../utils/status-codes-messages.utils');
var commonUtils = require('../utils/common.utils')
var AllDetectedPluginsHashTable = require('./plugins.server.controller');
var ISASctrl = require('./isas.server.controller');
var redictionLogs = require('../utils/winston.utils').PortalRedirectionLogs
var globalLogger = require('../utils/winston.utils').PortalLogs




/************************************************************
 ****** REDIRECTION OF PLUGIN COMMUNICATION VIA EM API ******
 *************************************************************/
async function redirectionApi(req, res, next){
  let requestedUrl = req.url
  let requestedMethod = req.method
  let requestedBody = req.body
  let requestedHeaders = req.headers
  let clientIpAddress = await commonUtils.getClientIpAddress(req)
  let redirectionPluginInfo = await getRedirectionUrlPluginInfo(requestedUrl)
  if((redirectionPluginInfo && redirectionPluginInfo.servicesEnabled === true && redirectionPluginInfo.IsLicenced === true)){
    globalLogger.info("RequestedUrl :"+requestedUrl+"\t" + "RedirectionInfo :"+JSON.stringify(redirectionPluginInfo))
    redictionLogs.info("RequestedUrl :"+requestedUrl+"\t" + "RedirectionInfo :"+JSON.stringify(redirectionPluginInfo))
    let finalRedirectionApi = redirectionPluginInfo.redirectionUrl
    let redirectionApiSChema = await commonUtils.createApiSchemaForSecurityPlugin(finalRedirectionApi,requestedMethod,requestedBody,'',null)
    redirectionApiSChema.requestHeaders = requestedHeaders
    redirectionApiSChema.requestHeaders['x-forwarded-for'] = clientIpAddress
    ISASctrl.fetchSecurityPluginApi(redirectionApiSChema).then(async response =>{
    // ISASctrl.rehostApi(redirectionApiSChema).then(async response =>{
      res.send(response)
    }).catch(async error =>{
      // if(error.response && error.response.data.respStatusCode){
      if(error.response && error.response.status){
        // res.status(error.respStatusCode).send(error)
        res.status(error.response.status).send(error)
      }else{
        res.status(500).send(error)
      }
    })
  }else{
    globalLogger.error("RequestedUrl :"+requestedUrl+"\t" + "RedirectionInfo : No matched url found")
    redictionLogs.error("RequestedUrl :"+requestedUrl+"\t" + "RedirectionInfo :  No matched url found")
    let createdResp = await commonUtils.createResponse(STATUS.ERROR.PLUGIN_API_REHOST)
    commonUtils.sendResponse(req, res, createdResp, next)
  }
}


/*************************************************
 ******** GET REDIRECTION PLUGIN INFO URL ********
 *************************************************/
async function getRedirectionUrlPluginInfo(requestedUrl){
  let detectedPluginsHashTable = AllDetectedPluginsHashTable.detectedPluginsHashtable
  let plugin, splitOfReqUrl = requestedUrl.split('/')
  let redirectionPluginInfo = detectedPluginsHashTable[(splitOfReqUrl[1]).toLowerCase()]
  plugin = redirectionPluginInfo
  if(redirectionPluginInfo && redirectionPluginInfo.prependUrl && redirectionPluginInfo.prependUrl.includes(splitOfReqUrl[1])){
    let redirectionSuffixUrl = requestedUrl
    plugin.redirectionUrl = redirectionPluginInfo.url + redirectionSuffixUrl
  }else if(redirectionPluginInfo && redirectionPluginInfo.prependUrl && !(redirectionPluginInfo.prependUrl.includes(splitOfReqUrl[1]))){
    let redirectionSuffixUrl = requestedUrl.replace('/'+splitOfReqUrl[1],'')
    plugin.redirectionUrl = redirectionPluginInfo.url + redirectionSuffixUrl
  }else{
    plugin = ''
  }
  return plugin
}




module.exports = {
  redirectionApi : redirectionApi
}