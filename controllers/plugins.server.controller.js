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
* File Name: plugins.server.controller.js
*
* DESCRIPTION
* This code contains to fetch,add,update,detect of all LifeShield Enterprise Manager Plugins and plugins
* related API functions
*
* ========================================================================================
*/
const fs = require('fs')
const models = require('../database');
const SequelizeOperator = require('sequelize').Op;
var STATUS = require('../utils/status-codes-messages.utils');
var commonUtils = require('../utils/common.utils');
const fetch = require('node-fetch')
var AppConfig = require('../config/app-config')
const _ = require('lodash');
var ISASctrl = require('./isas.server.controller')
var env = process.env.NODE_ENV || 'development';
var config = require('../config/db.config')[env];
var logger = require('../utils/winston.utils').PortalLogs
var { getDetectedPluginConfigFiles } = require('./plugins-config-detect.controller');
const { plugin } = require('../utils/check.utils');

const _this = this
const AllRegisteredApplications = []
const AllFailedRegisteredApplications = []
var AllDetectedPluginsHashTable = {}
var minLength = 0;
var maxLength = 1;



/*********************************************************
 ******** CHECK AND STORE CONFIG DETAILS OF PLUGINS ******
**********************************************************/
async function checkAndStoreConfigInfoOfPlugins(pluginInfo) {
  try {
    logger.info(STATUS.EC_LOGS.HEADING.PLUGIN_CONFIG_IN_DB + STATUS.EC_LOGS.MSG.CHECK_PLGN_CONFIG_IN_DB + pluginInfo.name)
    let isPluginConfigInfo = await ISASctrl.checkPluginConfigDetailsInDB(pluginInfo)
    logger.info(STATUS.EC_LOGS.HEADING.PLUGIN_CONFIG_IN_DB + STATUS.EC_LOGS.MSG.CHECK_PLGN_CONFIG_RESP_FROM_DB + JSON.stringify(isPluginConfigInfo))
    let responseOfPluginConfigInfo
    isPluginConfigInfo && isPluginConfigInfo.success === true ? isPluginConfigInfo.response.length == minLength ? responseOfPluginConfigInfo = await savePluginConfigDetails(pluginInfo)
      : responseOfPluginConfigInfo = await updatePluginConfigDetails(isPluginConfigInfo.response[0], pluginInfo) : { succes: false, response: '' }
    return responseOfPluginConfigInfo;

  } catch (error) {
    logger.error(STATUS.EC_LOGS.HEADING.PLUGIN_CONFIG_IN_DB + STATUS.EC_LOGS.MSG.UPDATE_PLGN_CONFIG_IN_DB_FAILED + previousDataOfPluginInfo.name + ':', error)
    return { success: false, response: error }
  }
}



/*********** UPDATE PLUGIN CONFIG DETAILS **************/
async function updatePluginConfigDetails(previousDataOfPluginInfo, currentPluginInfo) {
  logger.info(STATUS.EC_LOGS.HEADING.PLUGIN_CONFIG_IN_DB + STATUS.EC_LOGS.MSG.UPDATE_PLGN_CONFIG_IN_DB + previousDataOfPluginInfo.name)
  let pluginDetailsSchema = await commonUtils.schemaOfPluginConfigInfo(currentPluginInfo, previousDataOfPluginInfo)
  try {
    return models.plugins.update(pluginDetailsSchema, {
      where: {
        Uid: previousDataOfPluginInfo.Uid
      }
    }).then(resp => {
      logger.info(STATUS.EC_LOGS.HEADING.PLUGIN_CONFIG_IN_DB + STATUS.EC_LOGS.MSG.UPDATE_PLGN_CONFIG_IN_DB_SUCCESS + previousDataOfPluginInfo.name)
      return models.plugins.findOne({
        raw: true,
        where: {
          [SequelizeOperator.or]: [
            {
              Uid: previousDataOfPluginInfo.Uid
            },
            {
              UniqueName: previousDataOfPluginInfo.UniqueName
            }
          ]
        }
      }).then(plugins => {
        return { success: true, response: plugins }
      }).catch(err => {
        return { success: false, response: err }
      })

    }).catch(err => {
      logger.error(STATUS.EC_LOGS.HEADING.PLUGIN_CONFIG_IN_DB + STATUS.EC_LOGS.MSG.UPDATE_PLGN_CONFIG_IN_DB_FAILED + previousDataOfPluginInfo.name + ':', err)

      return { success: false, response: err }
    })
  } catch (error) {
    logger.error(STATUS.EC_LOGS.HEADING.PLUGIN_CONFIG_IN_DB + STATUS.EC_LOGS.MSG.UPDATE_PLGN_CONFIG_IN_DB_FAILED + previousDataOfPluginInfo.name + ':', error)

    return { success: false, response: error }
  }
}


/*****************************************************
 ********** SAVE PLUGIN CONFIG DETAILS IN DB *********
******************************************************/
async function savePluginConfigDetails(pluginInfo) {

  logger.info(STATUS.EC_LOGS.HEADING.PLUGIN_CONFIG_IN_DB + STATUS.EC_LOGS.MSG.SAVE_NEW_PLGN_CONFIG_IN_DB + pluginInfo.name)
  let pluginDetailsSchema = await commonUtils.schemaOfPluginConfigInfo(pluginInfo)
  try {

    return models.plugins.create(pluginDetailsSchema).then(resp => {
      logger.info(STATUS.EC_LOGS.HEADING.PLUGIN_CONFIG_IN_DB + STATUS.EC_LOGS.MSG.SAVE_NEW_PLGN_CONFIG_IN_DB_SUCCESS + pluginInfo.name)
      return { success: true, response: resp }
    }).catch(err => {
      logger.error(STATUS.EC_LOGS.HEADING.PLUGIN_CONFIG_IN_DB + STATUS.EC_LOGS.MSG.SAVE_NEW_PLGN_CONFIG_IN_DB_FAILED + pluginInfo.name + ':' + +JSON.stringify(err))
      return { success: false, response: err }
    })
  } catch (error) {
    logger.error(STATUS.EC_LOGS.HEADING.PLUGIN_CONFIG_IN_DB + STATUS.EC_LOGS.MSG.SAVE_NEW_PLGN_CONFIG_IN_DB_FAILED + pluginInfo.name + ':' + +JSON.stringify(error))
    return { success: false, response: error }
  }
}




/*******************************************************
 ********* DO INITIAL STEPS WITH SECURITY APP **********
********************************************************/
async function doInitialStepsWithSecurityPlugin(allDetectedPluginsConfigInfo) {
  try {
    logger.info(STATUS.EC_LOGS.HEADING.INITIAL_STEPS_WITH_SECURITY_PLGN + STATUS.EC_LOGS.MSG.INITIAL_STEPS_WITH_SECURITY_PLGN)
    let detetctedPlugins = allDetectedPluginsConfigInfo ? allDetectedPluginsConfigInfo : await detectAllAvailablePlugins()
    let acceptedCount = 0, rejectedCount = 0
    for (let i = 0; i < detetctedPlugins.length; i++) {
      let plugin = detetctedPlugins[i]
      let doneOfInitialStepsOfPlugin = await doIndividualPluginServicesRestart(plugin)
      if (doneOfInitialStepsOfPlugin.success === true) {
        acceptedCount = acceptedCount + maxLength
      } else {
        rejectedCount = rejectedCount + maxLength
      }
      if ((acceptedCount + rejectedCount) == detetctedPlugins.length) {
        return { success: true, response: { acceptedPluginsCount: acceptedCount, rejectedPluginsCount: rejectedCount, totalPluginsCount: detetctedPlugins.length } }
      }
    }
  } catch (error) {
    logger.error(error)
    return { success: false, response: error }
  }
}



/*********** REGISTER APPLICATION WITH SECURITY PLUGIN ***********/
async function registerApplicationWithSecurityPlugin(appInfo) {
  try {
    logger.info(STATUS.EC_LOGS.HEADING.REGISTRATION_WITH_SECURITY_PLGN + STATUS.EC_LOGS.MSG.APP_REGISTARTION_WITH_SECURITY_PLUGIN + appInfo.name)
    let registrationAppName = appInfo.name, registrationAppVersion = _.toString(appInfo.version);
    let registraionAppAdminName = appInfo.adminName ? appInfo.adminName : null;
    let registrationAppAdminEmail = appInfo.adminEmail ? appInfo.adminEmail : null;
    let registrationAppPrivileges = appInfo.privileges ? appInfo.privileges : [];
    let respOfIsRegisteredApp = await ISASctrl.isRegisteredAppWithSecurityPlugin(registrationAppName, registrationAppVersion, registraionAppAdminName, registrationAppAdminEmail, registrationAppPrivileges)
    if (respOfIsRegisteredApp && respOfIsRegisteredApp.success === true) {
      if (respOfIsRegisteredApp && respOfIsRegisteredApp.response.RegistrationResponse.ErrorCode == 0) {
        logger.info(STATUS.EC_LOGS.HEADING.REGISTRATION_WITH_SECURITY_PLGN + STATUS.EC_LOGS.MSG.APP_REGISTARTION_WITH_SECURITY_PLUGIN_SUCCESS)
        let registerSaveResp = await checkAndsaveRegistrationResponseInDB(registrationAppName, registrationAppVersion, respOfIsRegisteredApp.response.RegistrationResponse)
        return registerSaveResp;
      } else {
        logger.error(STATUS.EC_LOGS.HEADING.REGISTRATION_WITH_SECURITY_PLGN + STATUS.EC_LOGS.MSG.APP_REGISTARTION_WITH_SECURITY_PLUGIN_FAILED + appInfo.name + JSON.stringify(respOfIsRegisteredApp))

        return respOfIsRegisteredApp
      }
    } else {
      logger.error(STATUS.EC_LOGS.HEADING.REGISTRATION_WITH_SECURITY_PLGN + STATUS.EC_LOGS.MSG.APP_REGISTARTION_WITH_SECURITY_PLUGIN_FAILED + appInfo.name + JSON.stringify(respOfIsRegisteredApp))

      return respOfIsRegisteredApp
    }
  } catch (error) {
    logger.error(error)
    return { success: false, response: error }
  }
}



/************* SAVE REGISTARTION RESPONSE IN DB ****************/
async function checkAndsaveRegistrationResponseInDB(registrationAppName, registrationAppVersion, registrationResponse) {
  try {
    let isNewRegisteredApp = await checkDBisNewRegisteredApplication(registrationResponse)
    logger.info('IN CHECK AND SAVE REGISTRATION RESPONSE')
    if ((isNewRegisteredApp && isNewRegisteredApp.success === true) && (isNewRegisteredApp && isNewRegisteredApp.response == null)) {
      let saveResponse = await saveResponseOfRegistration(registrationAppName, registrationAppVersion, registrationResponse)
      return saveResponse
    } else if ((isNewRegisteredApp && isNewRegisteredApp.success === true) && (isNewRegisteredApp && isNewRegisteredApp.response != null)) {
      return { success: true, response: isNewRegisteredApp.response }
    } else {
      return { success: false, response: isNewRegisteredApp.response }
    }
  } catch (error) {
    logger.error(error)
    return { success: false, response: error }
  }
}



/************ CHECK IS NEW REGISTERED APPLICATION **************/
async function checkDBisNewRegisteredApplication(registrationResponse) {

  logger.info(STATUS.EC_LOGS.HEADING.SAVE_REGISTER_APP_IN_DB + STATUS.EC_LOGS.MSG.CHECK_IS_NEW_REGISTRED_APP)

  try {
    let appGuid = registrationResponse.Application_GUID ? registrationResponse.Application_GUID : registrationResponse.Uid ? registrationResponse.Uid : ''
    return await models.registeredApplications.findOne({
      raw: true,
      where: {
        // ApplicationId : registrationResponse.Application_Id
        ApplicationGuid: appGuid
      }
    }).then(response => {

      if (response) {
        logger.info(STATUS.EC_LOGS.HEADING.SAVE_REGISTER_APP_IN_DB + STATUS.EC_LOGS.MSG.REGISTERED_APP_FOUND)

        return { success: true, response: response }
      } else {
        logger.info(STATUS.EC_LOGS.HEADING.SAVE_REGISTER_APP_IN_DB + STATUS.EC_LOGS.MSG.REGISTERED_APP_NTFOUND)
        return { success: true, response: null }
      }

    }).catch(err => {
      logger.error('Error while checking register application response to DB', err)
      return { success: false, response: err }
    })

  } catch {
    logger.error(STATUS.EC_LOGS.HEADING.SAVE_REGISTER_APP_IN_DB + STATUS.EC_LOGS.MSG.CHECK_IS_NEW_REGISTRED_APP_FAILED + JSON.stringify(error))

    return { success: false, response: STATUS.ERROR.DB_FETCH[1] }
  }
}


/*********** STORE REGISTERED APPLICATION ***************/
async function saveResponseOfRegistration(registrationAppName, registrationAppVersion, registrationResponse) {
  logger.info(STATUS.EC_LOGS.HEADING.SAVE_REGISTER_APP_IN_DB + STATUS.EC_LOGS.MSG.SAVE_REGISTERED_APP)
  let obj = {
    ApplicationId: registrationResponse.Application_Id,
    ApplicationName: registrationAppName,
    ApplicationVersion: registrationAppVersion,
    ApplicationSecret: registrationResponse.Application_Secret,
    ApplicationGuid: registrationResponse.Application_GUID,
    CreatedDate: new Date(Date.now())
  }



  try {
    return await models.registeredApplications.create(obj).then(response => {
      logger.info(STATUS.EC_LOGS.HEADING.SAVE_REGISTER_APP_IN_DB + STATUS.EC_LOGS.MSG.SAVE_REGISTERED_APP_SUCCESS)
      return { success: true, response: response.dataValues }
    }).catch(err => {
      logger.error(STATUS.EC_LOGS.HEADING.SAVE_REGISTER_APP_IN_DB + STATUS.EC_LOGS.MSG.SAVE_REGISTERED_APP_FAILED + JSON.stringify(err))
      return { success: false, response: err }
    })
  } catch (error) {
    logger.error(STATUS.EC_LOGS.HEADING.SAVE_REGISTER_APP_IN_DB + STATUS.EC_LOGS.MSG.SAVE_REGISTERED_APP_FAILED + JSON.stringify(error))

    return { success: false, response: error }
  }
}



/************* REGISTER APPLICATION PRIVILIGES **************/
// async function registerApplicationPriviliges(registrationAppInfo) {
//   let registrationAppName = registrationAppInfo.name, registrationAppVersion = _.toString(registrationAppInfo.version), registrationAppPrivileges = registrationAppInfo.privileges ? registrationAppInfo.privileges : []
//   let registraionAppAdminName = registrationAppInfo.adminName ? registrationAppInfo.adminName : null;
//   let registrationAppAdminEmail = registrationAppInfo.adminEmail ? registrationAppInfo.adminEmail : null;
//   let respOfIsRegisteredApp = await ISASctrl.isRegisteredAppWithSecurityPlugin(registrationAppName, registrationAppVersion, registraionAppAdminName, registrationAppAdminEmail, registrationAppPrivileges)
//   if (respOfIsRegisteredApp && (respOfIsRegisteredApp.success === true) && (respOfIsRegisteredApp.response.RegistrationResponse.ErrorCode == 0)) {
//     let respOfRegisterPrivileges = await goToRegisterPrivileges(respOfIsRegisteredApp.response.RegistrationResponse, registrationAppPrivileges)
//     if (respOfRegisterPrivileges && respOfRegisterPrivileges.succes === true) {
//       return { success: true, response: respOfRegisterPrivileges.response }
//     } else {
//       return respOfRegisterPrivileges
//     }
//   } else {
//     return respOfIsRegisteredApp
//   }
// }


// /************* REGISTER APPLICATION PRIVILIGES (interlink function of register privileges method) **************/
// async function goToRegisterPrivileges(appRegistrationInfo, registrationAppPrivileges) {

//   logger.info('IN REGIISTER PRIVILEGES ');
//   let securityPlugin = await ISASctrl.getSecurityPluginConfigInfo()
//   if (securityPlugin != false) {
//     let privilegesRegistrationApiRequestBody = await commonUtils.createPrivilegeRegistrationApiBody(registrationAppPrivileges)
//     if (privilegesRegistrationApiRequestBody && (privilegesRegistrationApiRequestBody.success === true)) {
//       privilegesRegistrationApiRequestBody = privilegesRegistrationApiRequestBody.response
//       let privilegesRegistartionApi = await commonUtils.createPrivilegesRegisterationApi(securityPlugin)
//       let hashedBase64 = await commonUtils.createHmacHash(appRegistrationInfo.Application_Id, appRegistrationInfo.Application_Secret)
//       let privilegesRegistrationApiSchema = await commonUtils.createApiSchemaForSecurityPlugin(privilegesRegistartionApi, 'POST', privilegesRegistrationApiRequestBody, hashedBase64)
//       return ISASctrl.fetchSecurityPluginApi(privilegesRegistrationApiSchema).then(privilegesResp => {

//         if (privilegesResp && privilegesResp.PrivilegeRegistrationResponse && privilegesResp.PrivilegeRegistrationResponse.ErrorCode === 0) {
//           return { success: true, response: privilegesResp.PrivilegeRegistrationResponse }
//         } else {
//           return { success: false, response: privilegesResp.PrivilegeRegistrationResponse }
//         }
//       }).catch(error => {
//         return { success: false, response: error }
//       })
//     } else {
//       return privilegesRegistrationApiRequestBody
//     }
//   } else {
//     return { success: false, response: 'Failed to register privileges' }
//   }
// }




/************************************************
********* DETECT ALL AVAILABLE PLUGINS *********
*************************************************/
async function detectAllAvailablePlugins() {
  return new Promise(async (resolve, reject) => {
    let listOfavailablePlugins = []
    let availablePluginsResponse = await getDetectedPluginConfigFiles()
    if (availablePluginsResponse.success === true) {
      let availablePlugins = availablePluginsResponse.response
      let pluginsLogInfo = {
        acceptedPlugins: [],
        rejectedPlugins: []
      }
      _.forEach(availablePlugins.acceptedPluginConfigFiles, plugin => {
        pluginsLogInfo.acceptedPlugins.push(plugin.name)
      })
      _.forEach(availablePlugins.rejectedPluginsConfigFiles, plugin => {
        pluginsLogInfo.rejectedPlugins.push(plugin.name)
      })
      logger.info(STATUS.EC_LOGS.HEADING.DETECT_AVALBL_PLUGINS + JSON.stringify(pluginsLogInfo))
      availablePlugins = availablePlugins.acceptedPluginConfigFiles || []
      if (availablePlugins && availablePlugins.length > minLength) {
        logger.info(STATUS.EC_LOGS.HEADING.DETECT_AVALBL_PLUGINS + STATUS.EC_LOGS.MSG.CHECK_PLUGINS_STATUS_CONFIG)
        let allPlugins = await checkPluginStatusAndReturnAllPluginsInfo(availablePlugins, 0)
        listOfavailablePlugins = allPlugins
        AllDetectedPluginsConfigInfo = allPlugins
        logger.info(STATUS.EC_LOGS.HEADING.DETECT_AVALBL_PLUGINS + STATUS.EC_LOGS.MSG.DETECT_AVAILABLE_PLUGINS_CONFIG_INFO + listOfavailablePlugins)
        resolve(listOfavailablePlugins)
      }
    } else {
      logger.error(STATUS.EC_LOGS.HEADING.DETECT_AVALBL_PLUGINS + STATUS.EC_LOGS.MSG.DETECT_AVAILABLE_PLUGINS_CONFIG_INFO + JSON.stringify(availablePluginsResponse.response))
      resolve(listOfavailablePlugins)
    }

  })
}


/*************************************************************************************
 ********* CHECK DETECTED PLUGINS STATUS AND GET CONFIG INFO FROM THE PLUGINS ********
**************************************************************************************/
async function checkPluginStatusAndReturnAllPluginsInfo(availablePlugins, index) {
  try {
    logger.info('in checkPluginStatusAndReturnAllPluginsInfo');
    let allPluginsConfigInfo = [];
    let plugin = availablePlugins[index]
    let pluginStatus = await ISASctrl.getPluginsConfigurationDetails(plugin)
    if (pluginStatus.success === true) {
      allPluginsConfigInfo.push(pluginStatus.response)
      if (index < availablePlugins.length - maxLength) {
        index = index + maxLength
        let allPlugins = await checkPluginStatusAndReturnAllPluginsInfo(availablePlugins, index)
        allPlugins.forEach((singlePlugin) => {
          allPluginsConfigInfo.push(singlePlugin)
        })
      }
    } else {
      if ((pluginStatus.success === false) && ((plugin.name).toLowerCase() != (AppConfig.securityApp).toLowerCase())) {
        await removePluginDataFromHashTableAndDisableInDB(plugin)
      }
      if ((index < availablePlugins.length - maxLength)) {
        index = index + maxLength
        let allPlugins = await checkPluginStatusAndReturnAllPluginsInfo(availablePlugins, index)
        allPlugins.forEach((singlePlugin) => {
          allPluginsConfigInfo.push(singlePlugin)
        })
      }
    }

    logger.info('Successfully Return allPluginsConfigInfo');
    return allPluginsConfigInfo
  } catch (error) {
    logger.error(error)
    return { success: false, response: error }
  }
}


/****************** REMOVE EXISTING DATA FORM HAS TABLE AND DISABLE THE SERVICES IF PLUGIN IS UNAVAILABLE ***************/
async function removePluginDataFromHashTableAndDisableInDB(plugin) {

  logger.info(STATUS.EC_LOGS.MSG.REMOVE_FROM_HASH_DISABLE_IN_DB + plugin.name)
  let respOfRemoveFromHashTable = await removePluginInfoFromHashTable(plugin)
  if (respOfRemoveFromHashTable) {
    logger.info(STATUS.EC_LOGS.HEADING.DISABLE_PLGN_SRVCES + STATUS.EC_LOGS.MSG.DISABLE_PLGN_SERVCS_IN_DB + plugin.name)

    await disablePluginServicesByUniqueName(plugin)
    return true

  }

}

async function removePluginInfoFromHashTable(plugin) {
  for (let key in AllDetectedPluginsHashTable) {
    if (AllDetectedPluginsHashTable[key] && ((AllDetectedPluginsHashTable[key].name).toLowerCase() == (plugin.name).toLowerCase())) {
      logger.info(STATUS.EC_LOGS.HEADING.REMOVE_FROM_HASH + STATUS.EC_LOGS.MSG.DISABLE_PLGN_SERVCS_IN_HASH + plugin.name)
      AllDetectedPluginsHashTable[key].servicesEnabled = false
    }
  }
  return true
}


/********************************* CHECK LICENCE FOR PLUGINS ****************************************/
async function checkLicenceForPlugin(pluginConfigInfo) {
  try {
    return { success: true, response: true }
  } catch (error) {
    logger.error(error)
    return { success: false, response: error }
  }
}





/*******************************************
 ****** DETECT ALL REGISTERED PLUGINS ******
********************************************/
async function dectectListOfPlugins(req, res, next) {
  try {
    // let clientIpAddress = await commonUtils.getClientIpAddress(req)
    let sessionId = req.headers.accesstoken ? req.headers.accesstoken : ''
    let listOfPlugins = await getListOfPluginsInDB()

    if (listOfPlugins.success === true) {
      let plugins = listOfPlugins.response
      if (plugins && plugins.length > minLength) {
        let userInfo = await getSessionInfo(sessionId)
        if (userInfo.response.pluginPrivileges != null) {
          let filteredPlugins = await filterPluginsBasedOnUserAccess(userInfo.response.pluginPrivileges, plugins)
          let createdResp = await commonUtils.createResponse(STATUS.SUCCESS, filteredPlugins)
          commonUtils.sendResponse(req, res, createdResp, next)
        } else {
          let userPluginPrivileges = await getpluginPrivilegeFromSecurityPlugin(listOfPlugins.response, 0, { AccessToken: userInfo.response.accessToken })
          let filteredPlugins = await filterPluginsBasedOnUserAccess(userPluginPrivileges, plugins)
          let getPluginsPrivileges = await savePluginsPlivilegesToUserSession(userPluginPrivileges, sessionId)
          let createdResp = await commonUtils.createResponse(STATUS.SUCCESS, filteredPlugins)
          commonUtils.sendResponse(req, res, createdResp, next)
        }
      } else {
        let createdResp = await commonUtils.createResponse(STATUS.SUCCESS, plugins)
        commonUtils.sendResponse(req, res, createdResp, next)
      }
    } else {
      logger.error(STATUS.API_SCHEMA_ERROR_CODES.ERROR_DETECTING_PLUGINS + JSON.stringify(listOfPlugins.response))
      let createdResp = await commonUtils.createResponse(STATUS.ERROR.DETECTING_PLUGINS, '', STATUS.ERROR.DB_FETCH[maxLength])
      commonUtils.sendResponse(req, res, createdResp, next)
    }
  } catch (error) {
    logger.error(error)
    return { success: false, response: error }
  }

}



async function savePluginsPlivilegesToUserSession(userPluginPrivileges, sessionId) {
  try {
    let pluginsPrivileges = JSON.stringify(userPluginPrivileges)
    models.sessions.update({
      pluginPrivileges: pluginsPrivileges
    },
      {
        where: {
          sid: sessionId
        }
      }).then(resp => {
        return { success: true, response: resp }
      }).catch(err => {
        return { success: false, response: err }
      })
  } catch (error) {
    return { success: false, response: error }
  }
}


async function getpluginPrivilegeFromSecurityPlugin(plugins, index, userTokenInfo) {

  let AllPluginsPrivileges = {}
  let plugin = plugins[index]
  logger.info('in getpluginPrivilegeFromSecurityPlugin')
  let registeredPluginInfo = await checkDBisNewRegisteredApplication(plugin)
  if ((registeredPluginInfo.success === true) && (registeredPluginInfo.response != null)) {
    let securityPlugin = await ISASctrl.getSecurityPluginConfigInfo()
    let userPrivileges = await ISASctrl.getRolesAndPrivilegesForUser(securityPlugin, registeredPluginInfo.response.ApplicationId, registeredPluginInfo.response.ApplicationSecret, userTokenInfo)
    if (userPrivileges.success === true) {
      let customPrivileges = []
      let privileges = userPrivileges.response.IntrospectResponse.MappedPrivileges
      if (privileges.length > minLength) {
        privileges.forEach(value => {
          customPrivileges.push(value.Privilege)
        })
      }
      AllPluginsPrivileges[plugin.UniqueName] = customPrivileges
      logger.info("Plugin name", plugin.UniqueName);
    } else {
      AllPluginsPrivileges[plugin.UniqueName] = []
    }

  }
  if (index < plugins.length - maxLength) {
    index = index + maxLength
    let pluginPrivileges = await getpluginPrivilegeFromSecurityPlugin(plugins, index, userTokenInfo);
    for (let key in pluginPrivileges) {
      AllPluginsPrivileges[key] = pluginPrivileges[key]
    }
  }
  return AllPluginsPrivileges
}






async function filterPluginsBasedOnUserAccess(userPluginPrivileges, plugins) {
  let requiredPrivilegeFoundPlugins = []
  let finalUserAccessPlugins = []
  for (let key in userPluginPrivileges) {
    if (userPluginPrivileges[key] && userPluginPrivileges[key].length > minLength) {
      let found = userPluginPrivileges[key].filter(privilege => (privilege.Key).toLowerCase() == (process.env.PRIVILEGE_CHECK_KEY).toLowerCase())
      if (found && found.length >minLength ) {
        requiredPrivilegeFoundPlugins.push(key)
      }
    }
  }

  if (requiredPrivilegeFoundPlugins && requiredPrivilegeFoundPlugins.length > minLength) {
    plugins.forEach(plugin => {
      requiredPrivilegeFoundPlugins.forEach(filteredPlugin => {
        if ((filteredPlugin).toLowerCase() == (plugin.UniqueName).toLowerCase()) {
          finalUserAccessPlugins.push(plugin)
        }
      })
    })
  }

  return finalUserAccessPlugins
}



async function getSessionInfo(sessionId) {
  try {
    return models.sessions.findOne({
      raw: true,
      where: {
        sid: sessionId
      }
    }).then(sessionData => {
      if (sessionData) {
        sessionData.pluginPrivileges = JSON.parse(sessionData.pluginPrivileges)
        return { success: true, response: sessionData }
      } else {
        logger.error(STATUS.API_SCHEMA_ERROR_CODES.GET_USER_SESSION + sessionId + " : " + JSON.stringify(sessionData))
        return { success: false, response: { errCode: STATUS.COMMON_MSGS.EC_SESSION_EXPIRED_STATUS_CODE, message: STATUS.COMMON_MSGS.EC_SESSION_EXPIRED_STATUS_MSG } }
      }
    }).catch(err => {
      logger.error(STATUS.API_SCHEMA_ERROR_CODES.GET_USER_SESSION + STATUS.COMMON_MSGS.EC_INTERNAL_SERVER_DOWN_STATUS_CODE + JSON.stringify(err))
      return { success: false, response: { errCode: STATUS.COMMON_MSGS.EC_INTERNAL_SERVER_DOWN_STATUS_CODE, message: STATUS.COMMON_MSGS.EC_INTERNAL_SERVER_DWN_MSG } }
    })
  } catch (error) {
    logger.error(STATUS.API_SCHEMA_ERROR_CODES.GET_USER_SESSION + STATUS.COMMON_MSGS.EC_INTERNAL_SERVER_DOWN_STATUS_CODE + JSON.stringify(error))
    return { success: false, response: { errCode: STATUS.COMMON_MSGS.EC_INTERNAL_SERVER_DOWN_STATUS_CODE, message: STATUS.COMMON_MSGS.EC_INTERNAL_SERVER_DWN_MSG } }
  }
}




async function getListOfPluginsInDB() {
  try {
    return models.plugins.findAll({
      raw: true,
      where: {
        IsActive: true
      }
    }).then(registeredPlugins => {
      if (registeredPlugins && registeredPlugins.length > 0) {
        _.forEach(registeredPlugins, (plugin) => {
          if (plugin.UiUrls || plugin.ServerUrls) {
            plugin.UiUrls = plugin.UiUrls ? JSON.parse(plugin.UiUrls) : {}
            plugin.ServerUrls = plugin.ServerUrls ? JSON.parse(plugin.ServerUrls) : {}
          }
        })
      }
      return { success: true, response: registeredPlugins }
    }).catch(err => {
      return { success: false, response: err }
    })
  } catch (error) {
    return { success: false, response: error }
  }
}




/*********************************** ENABLE OR DISABLE THE PLUGIN SERVICES (Update in DB in plugin_details table) *****************************************/
async function enableAndDisablePluginServices(req, res, next) {
  let pluginInfo = req.body

  logger.info("IN enableAndDisablePluginServices")
  try {
    models.plugins.update({
      ServicesEnabled: pluginInfo.serviceEnable
    }, {
      where: {
        [SequelizeOperator.and]: [
          {
            UniqueName: pluginInfo.uniqueName
          },
          {
            Uid: pluginInfo.uid
          }
        ]
      }
    }).then(async response => {

      if (!(_.includes(response, 0))) {
        let allPlugins = await getListOfPluginsInDB()
        if (allPlugins.success === true) {
          if (AllDetectedPluginsHashTable[(pluginInfo.uniqueName).toLowerCase()]) {
            AllDetectedPluginsHashTable[(pluginInfo.uniqueName).toLowerCase()].servicesEnabled = pluginInfo.serviceEnable //updating detectedPlugins Hash table
          }
          let appConfigInfo = await commonUtils.createAppConfigInfoSchema(AppConfig)
          allPlugins.response.unshift(appConfigInfo)
          let createdResp = commonUtils.createResponse(STATUS.SUCCESS, allPlugins.response)
          commonUtils.sendResponse(req, res, createdResp, next)
        } else {
          let createdResp = commonUtils.createResponse(STATUS.ERROR.UPDATE_ENABLE_DISABLE_PLUGIN_SERVICES, '', STATUS.ERROR.DB_FETCH[1])
          commonUtils.sendResponse(req, res, createdResp, next)
        }
      } else {
        logger.error(STATUS.API_SCHEMA_ERROR_CODES.ERROR_EC_ENBL_DISBL_PLUGIN_SERVCS + JSON.stringify(response))
        let createdResp = await commonUtils.createResponse(STATUS.ERROR.UPDATE_ENABLE_DISABLE_PLUGIN_SERVICES_UID_NTFOUND)
        commonUtils.sendResponse(req, res, createdResp, next)
      }

    }).catch(async err => {
      logger.error(STATUS.API_SCHEMA_ERROR_CODES.ERROR_EC_ENBL_DISBL_PLUGIN_SERVCS + JSON.stringify(err))
      let createdResp = await commonUtils.createResponse(STATUS.ERROR.UPDATE_ENABLE_DISABLE_PLUGIN_SERVICES, '', STATUS.ERROR.DB_FETCH[1])
      commonUtils.sendResponse(req, res, createdResp, next)
    })
  } catch (error) {
    logger.error(STATUS.API_SCHEMA_ERROR_CODES.ERROR_EC_ENBL_DISBL_PLUGIN_SERVCS + JSON.stringify(error))
    let createdResp = await commonUtils.createResponse(STATUS.ERROR.UPDATE_ENABLE_DISABLE_PLUGIN_SERVICES, '', STATUS.ERROR.INTERNAL_SW[1])
    commonUtils.sendResponse(req, res, createdResp, next)
  }
}


/*******************************************
 *********** GET PLUGIN BY UID *************
********************************************/
async function getRegisteredpluginById(req, res, next) {
  let pluginUniqueName = req.headers.uniquename;
  let plugin = await ISASctrl.checkPluginConfigDetailsInDB({ uniqueName: pluginUniqueName })
  if (plugin.success === true) {
    if ((plugin.response != null) && plugin.response[0].ServicesEnabled) {
      let pluginResp = plugin.response[0]
      if (pluginResp.ServicesEnabled) {
        let pluginInfo = {
          name: pluginResp.Name,
          baseUrl: pluginResp.BaseUrl,
          serverPort: parseInt(pluginResp.ServerPort),
          uiport: parseInt(pluginResp.UiPort),
          serverUrls: pluginResp.ServerUrls
        }
        let createdResp = await commonUtils.createResponse(STATUS.SUCCESS, pluginInfo)
        commonUtils.sendResponse(req, res, createdResp, next)
      } else {
        logger.error(STATUS.API_SCHEMA_ERROR_CODES.ERROR_EC_GET_REGISTERED_PLUGIN_BY_UNIQUENAME + JSON.stringify(plugin.response))
        let createdResp = await commonUtils.createResponse(STATUS.ERROR.PLUGIN_FOUND_AS_NOT_LICENSED)
        commonUtils.sendResponse(req, res, createdResp, next)
      }

    } else {
      logger.error(STATUS.API_SCHEMA_ERROR_CODES.ERROR_EC_GET_REGISTERED_PLUGIN_BY_UNIQUENAME + JSON.stringify(plugin.response))
      let createdResp = await commonUtils.createResponse(STATUS.ERROR.REGISTERED_PLUGIN_BY_UNIQUENAME_NOT_FOUND)
      commonUtils.sendResponse(req, res, createdResp, next)
    }
  } else {
    logger.error(STATUS.API_SCHEMA_ERROR_CODES.ERROR_EC_GET_REGISTERED_PLUGIN_BY_UNIQUENAME + JSON.stringify(plugin.response))
    let createdResp = await commonUtils.createResponse(STATUS.ERROR.REGISTERED_PLUGIN_BY_UNIQUENAME, '', STATUS.ERROR.DB_FETCH[1])
    commonUtils.sendResponse(req, res, createdResp, next)
  }
}

async function getPluginFromDbByID(pluginUid) {
  try {
    return await models.plugins.findOne({
      raw: true,
      where: {
        Uid: pluginUid
      }
    }).then(plugin => {
      if (plugin) {
        return { success: true, response: plugin }
      } else {
        return { success: false, response: STATUS.COMMON_MSGS.PLGN_NOT_FOUND }
      }

    }).catch(err => {
      return { success: false, response: err }
    })

  } catch (error) {
    return { success: false, response: error }
  }
}

/********************************************
 ******** RESTART ALL PLUGIN SERVICES *******
*********************************************/
async function restartAllPluginServices(req, res, next) {
  try {
    let doneWithInitialSteps = await doInitialStepsWithSecurityPlugin()
    if (doneWithInitialSteps.success != true) {
      logger.error(STATUS.API_SCHEMA_ERROR_CODES.ERROR_EC_RESTART_ALL_PLUGIN_SERVCS + JSON.stringify(doneWithInitialSteps.response))
      let createdResp = await commonUtils.createResponse(STATUS.ERROR.RESTARTING_ALL_PLUGIN_SERVICES)
      commonUtils.sendResponse(req, res, createdResp, next)
    } else {
      let listOfPlugins = await getListOfPluginsInDB()
      if (listOfPlugins.success === true) {
        let sessionId = req.headers.accesstoken ? req.headers.accesstoken : ''
        let userInfo = await getSessionInfo(sessionId)
        let filteredPlugins = await filterPluginsBasedOnUserAccess(userInfo.response.pluginPrivileges, listOfPlugins.response)
        let createdResp = await commonUtils.createResponse(STATUS.SUCCESS, filteredPlugins)
        commonUtils.sendResponse(req, res, createdResp, next)
      } else {
        logger.error(STATUS.API_SCHEMA_ERROR_CODES.ERROR_EC_RESTART_ALL_PLUGIN_SERVCS + JSON.stringify(listOfPlugins.response))
        let createdResp = await commonUtils.createResponse(STATUS.ERROR.RESTARTING_ALL_PLUGIN_SERVICES, '', STATUS.ERROR.INTERNAL_SW[1])
        commonUtils.sendResponse(req, res, createdResp, next)
      }
      /* let createdResp = await commonUtils.createResponse(STATUS.SUCCESS, listOfPlugins.response)
      commonUtils.sendResponse(req, res, createdResp, next) */
    }
  } catch (error) {
    logger.error(STATUS.API_SCHEMA_ERROR_CODES.ERROR_EC_RESTART_ALL_PLUGIN_SERVCS + JSON.stringify(error))
    let createdResp = await commonUtils.createResponse(STATUS.ERROR.RESTARTING_ALL_PLUGIN_SERVICES, '', STATUS.ERROR.INTERNAL_SW[1])
    commonUtils.sendResponse(req, res, createdResp, next)
  }
}




/*************************************************
 ***** RESTART INDIVIDUAL PLUGIN SERVICES ********
**************************************************/
async function restartinvidualPluginServices(req, res, next) {
  let pluginUid = req.params.uid
  let plugin = await getPluginFromDbByID(pluginUid);
  if (plugin.success === true) {
    let availablePluginsResponse = await getDetectedPluginConfigFiles()
    if (availablePluginsResponse.success === true) {
      let availablePlugins = availablePluginsResponse.response
      availablePlugins = availablePlugins.acceptedPluginConfigFiles || []
      if (availablePlugins && availablePlugins.length > 0) {
        let detectedPlugin = {
          name: plugin.response.Name,
          baseUrl: plugin.response.BaseUrl,
          serverPort: plugin.response.ServerPort,
          prependUrl: plugin.response.PrependUrl
        }
        let pluginConfigDetails = await ISASctrl.getPluginsConfigurationDetails(detectedPlugin)
        if (pluginConfigDetails.success === true) {
          let doneWithRestartingPluginServices = await doIndividualPluginServicesRestart(pluginConfigDetails.response);
          if (doneWithRestartingPluginServices.success === true) {
            let createdResp = await commonUtils.createResponse(STATUS.SUCCESS, doneWithRestartingPluginServices.response)
            commonUtils.sendResponse(req, res, createdResp, next)
          } else {
            logger.error(STATUS.API_SCHEMA_ERROR_CODES.ERROR_EC_RESTART_INDV_PLUGIN_SERVCS + JSON.stringify(doneWithRestartingPluginServices.response))
            let createdResp = await commonUtils.createResponse(STATUS.ERROR.RESTART_INDIVIDUAL_PLUGIN_SERVICES)
            commonUtils.sendResponse(req, res, createdResp, next)
          }
        } else {
          logger.error(STATUS.API_SCHEMA_ERROR_CODES.ERROR_EC_RESTART_INDV_PLUGIN_SERVCS + JSON.stringify(pluginConfigDetails.response))
          let createdResp = await commonUtils.createResponse(STATUS.ERROR.RESTART_INDIVIDUAL_PLUGIN_SERVICES)
          commonUtils.sendResponse(req, res, createdResp, next)
        }
      } else {
        logger.error(STATUS.API_SCHEMA_ERROR_CODES.ERROR_EC_RESTART_INDV_PLUGIN_SERVCS + JSON.stringify(availablePlugins))
        let createdResp = await commonUtils.createResponse(STATUS.ERROR.NO_PLGN_FOUND_RESTART_INDIVIDUAL_PLUGIN_SERVICES)
        commonUtils.sendResponse(req, res, createdResp, next)
      }
    } else {
      logger.error(STATUS.API_SCHEMA_ERROR_CODES.ERROR_EC_RESTART_INDV_PLUGIN_SERVCS + JSON.stringify(availablePluginsResponse.response))
      let createdResp = await commonUtils.createResponse(STATUS.ERROR.NO_PLGN_FOUND_RESTART_INDIVIDUAL_PLUGIN_SERVICES)
      commonUtils.sendResponse(req, res, createdResp, next)
    }
  } else {
    logger.error(STATUS.API_SCHEMA_ERROR_CODES.ERROR_EC_RESTART_INDV_PLUGIN_SERVCS + JSON.stringify(plugin.response))
    let createdResp = await commonUtils.createResponse(STATUS.ERROR.RESTART_INDIVIDUAL_PLUGIN_SERVICES, '', STATUS.ERROR.DB_FETCH[1])
    commonUtils.sendResponse(req, res, createdResp, next)
  }
}



/****************************************************
 **** DO INDIVIDUAL PLUGIN SERVICES RESTART *********
*****************************************************/
async function doIndividualPluginServicesRestart(plugin) {
  logger.info(STATUS.EC_LOGS.HEADING.RESTART_INDIVIDUAL_PLGN_SERVICES + STATUS.EC_LOGS.MSG.RESTART_INDVIDUAL_PLUGIN_SERVICES + plugin.name)
  // if((plugin.uniqueName && (plugin.uniqueName).toLowerCase() != (AppConfig.securityApp).toLowerCase())){
  if (((plugin.uniqueName && (plugin.uniqueName).toLowerCase() != (AppConfig.licenseManagerApp).toLowerCase())) && (plugin.uniqueName && (plugin.uniqueName).toLowerCase() != (AppConfig.securityApp).toLowerCase())) {
    let licenseCheck = await checkLicenceForPlugin(plugin)
    // configDetails.response.IsLicenced = licenceCheck.success === true ? true : false;
    plugin.IsLicenced = licenseCheck.success === true ? true : false;
    plugin.ServicesEnabled = licenseCheck.success === true ? true : false
  } else {
    plugin.IsLicenced = true
    plugin.ServicesEnabled = true
  }
  let registration = await registerApplicationWithSecurityPlugin(plugin)
  if (registration && registration.success === true) {
    plugin.IsRegistered = true
    plugin.Guid = registration.response.ApplicationGuid
    let storeConfigDetailsInDb = await checkAndStoreConfigInfoOfPlugins(plugin)


    if (storeConfigDetailsInDb && storeConfigDetailsInDb.success === true) {
      let pluginRedirectionUrl = plugin.baseUrl + ':' + plugin.serverPort
      let pluginHashTable = {}
      pluginHashTable.name = plugin.name
      pluginHashTable.url = pluginRedirectionUrl
      pluginHashTable.prependUrl = plugin.prependUrl
      pluginHashTable.servicesEnabled = storeConfigDetailsInDb.response.ServicesEnabled
      pluginHashTable.IsLicenced = storeConfigDetailsInDb.response.IsLicenced
      AllDetectedPluginsHashTable[(plugin.uniqueName).toLowerCase()] = {}
      AllDetectedPluginsHashTable[(plugin.uniqueName).toLowerCase()] = pluginHashTable
      return { success: true, response: storeConfigDetailsInDb.response, plugin: plugin }
    } else { return { success: false, response: storeConfigDetailsInDb.response, plugin: plugin } }
  } else { return { success: false, response: registration.response, plugin: plugin } }

}



async function disablePluginServicesByUniqueName(plugin) {
  try {

    return models.plugins.update({
      ServicesEnabled: false,
    }, {
      where: {
        // name : plugin.name
        [SequelizeOperator.or]: [
          {
            name: plugin.name
          },
          {
            PrependUrl: plugin.prependUrl
          }
        ]
      }
    }).then(resp => {
      logger.info(STATUS.EC_LOGS.HEADING.DISABLE_PLGN_SRVCES + STATUS.EC_LOGS.MSG.DISABLE_PLGN_SERVCS_IN_DB_SUCCESS + plugin.name)
      return { success: true, response: resp }
    }).catch(error => {
      logger.error(STATUS.EC_LOGS.HEADING.DISABLE_PLGN_SRVCES + STATUS.EC_LOGS.MSG.DISABLE_PLGN_SERVCS_IN_DB_FAILED + JSON.stringify(error))
      return { success: false, response: error }
    })
  } catch (err) {
    logger.error(STATUS.EC_LOGS.HEADING.DISABLE_PLGN_SRVCES + STATUS.EC_LOGS.MSG.DISABLE_PLGN_SERVCS_IN_DB_FAILED + JSON.stringify(err))
    return { success: false, response: err }
  }
}





/***********************************************************************************************************************************************************************
 ******************************************************** END OF NEW CHANGES *******************************************************************************************
************************************************************************************************************************************************************************/



/*******************************************
 ***** GET LICENSE MANAGER PLUGIN INFO *****
********************************************/
async function getLicenseManagerInfo(req, res, next) {
  let licenseManagerPluginInfo = await ISASctrl.getLicensePluginConfigInfo();
  if (licenseManagerPluginInfo) {
    let createdResp = await commonUtils.createResponse(STATUS.SUCCESS, licenseManagerPluginInfo)
    commonUtils.sendResponse(req, res, createdResp, next)
  } else {
    let createdResp = await commonUtils.createResponse(STATUS.ERROR.GET_LICENSEMANAGER_INFO, '', STATUS.ERROR.DB_FETCH[1])
    commonUtils.sendResponse(req, res, createdResp, next)
  }
}


/*******************************************
 ***** GET NOTIFICATION MANAGER URL*** *****
********************************************/
async function getNotificationManagerUrl(req, res, next) {
  let notificationManagerPluginInfo = await ISASctrl.getNotificationPluginConfigInfo();
  if (notificationManagerPluginInfo && notificationManagerPluginInfo.BaseUrl && notificationManagerPluginInfo.UiPort) {
    let obj = {
      notificationViewerUiUrl: notificationManagerPluginInfo.BaseUrl + ':' + notificationManagerPluginInfo.UiPort
    }
    let createdResp = await commonUtils.createResponse(STATUS.SUCCESS, obj)
    commonUtils.sendResponse(req, res, createdResp, next)
  } else {
    let createdResp = await commonUtils.createResponse(STATUS.ERROR.GET_NOTIFICATION_VIEWER_URL, STATUS.ERROR.DB_FETCH[1])
    commonUtils.sendResponse(req, res, createdResp, next)
  }
}

/*****************************************
 **** CHECK REQUIRED PLUGINS FOR EC ******
******************************************/
async function checkRequiredPluginsForPortal(allDetectedPluginsInfo) {

  // logger.info(STATUS.EC_LOGS.HEADING.REQUIRED_PLUGINS_FOR_EC + "Checking required plugins for EC")
  let listOfAllPlugins = [], requiredPlugins = []
  if (allDetectedPluginsInfo && allDetectedPluginsInfo.length > 0) {
    listOfAllPlugins = allDetectedPluginsInfo
  } else if (AllDetectedPluginsConfigInfo && AllDetectedPluginsConfigInfo.length > 0) {
    listOfAllPlugins = AllDetectedPluginsConfigInfo
  }
  logger.info(STATUS.EC_LOGS.HEADING.REQUIRED_PLUGINS_FOR_EC + STATUS.EC_LOGS.HEADING.SECURITY_PLUGIN_AVAILABILITY + STATUS.EC_LOGS.MSG.CHECK_SECURITY_PLUGIN_AVAILABILE)
  let checkForSecurityPlugin = await ISASctrl.checkSecurityPluginAvailability(listOfAllPlugins)
  if (checkForSecurityPlugin) {
    logger.info(STATUS.EC_LOGS.HEADING.REQUIRED_PLUGINS_FOR_EC + STATUS.EC_LOGS.HEADING.SECURITY_PLUGIN_AVAILABILITY + STATUS.EC_LOGS.MSG.SECURITY_PLUGIN_FOUND)
    checkForSecurityPlugin.IsLicenced = true

    let storeSecurityPlugin = await checkAndStoreConfigInfoOfPlugins(checkForSecurityPlugin)

    if (storeSecurityPlugin.success === true) {
      logger.info(STATUS.EC_LOGS.HEADING.REQUIRED_PLUGINS_FOR_EC + STATUS.EC_LOGS.HEADING.REGISTRATION_WITH_SECURITY_PLGN + STATUS.EC_LOGS.MSG.REGISTER_EC_APP_WITH_SECURITY_PLGN)
      let respOfRegisterApp = await registerApplicationWithSecurityPlugin(AppConfig)
      if (respOfRegisterApp && respOfRegisterApp.success === true) {
        logger.info(STATUS.EC_LOGS.HEADING.REQUIRED_PLUGINS_FOR_EC + STATUS.EC_LOGS.HEADING.REGISTRATION_WITH_SECURITY_PLGN + STATUS.EC_LOGS.MSG.REGISTER_SAVE_EC_APP_WITH_SECURITY_PLGN_SUCCESS)
        requiredPlugins.push(checkForSecurityPlugin)
        let checkForLicenseManager = await ISASctrl.CheckLicenseManagerPluginAvailability(listOfAllPlugins)
        if (checkForLicenseManager) {
          logger.info(STATUS.EC_LOGS.HEADING.REQUIRED_PLUGINS_FOR_EC + STATUS.EC_LOGS.HEADING.LICENSEMNGR_AVAILABILITY + STATUS.EC_LOGS.MSG.LM_PLGN_FOUND)
          checkForLicenseManager.IsLicenced = true
          let storeLicenseManagerPlugin = await checkAndStoreConfigInfoOfPlugins(checkForLicenseManager)
          if (storeLicenseManagerPlugin.success === true) {
            requiredPlugins.push(checkForLicenseManager)
            let notificationManagerPlugin = await ISASctrl.CheckNotificationManagerPluginAvailability(listOfAllPlugins)
            if (notificationManagerPlugin) {
              logger.info(STATUS.EC_LOGS.HEADING.REQUIRED_PLUGINS_FOR_EC + STATUS.EC_LOGS.HEADING.NOTIFICATIONMNGR_AVAILABILITY)
              notificationManagerPlugin.IsLicenced = true
              let storeNotificationManagerPlugin = await checkAndStoreConfigInfoOfPlugins(notificationManagerPlugin)
              if (storeNotificationManagerPlugin.success === true) {
                requiredPlugins.push(notificationManagerPlugin)
                return { success: true, response: requiredPlugins }
              } else {
                return { success: false, response: storeLicenseManagerPlugin.response }
              }
            } else {
              logger.info(STATUS.EC_LOGS.HEADING.REQUIRED_PLUGINS_FOR_EC + STATUS.EC_LOGS.HEADING.NOTIFICATIONMNGR_AVAILABILITY)
              return { success: false, response: STATUS.EC_LOGS.HEADING.REQUIRED_PLUGINS_FOR_EC + STATUS.EC_LOGS.HEADING.NOTIFICATIONMNGR_AVAILABILITY }
            }


          } else {
            return { success: false, response: storeLicenseManagerPlugin.response }
          }
        } else {
          logger.info(STATUS.EC_LOGS.HEADING.REQUIRED_PLUGINS_FOR_EC + STATUS.EC_LOGS.HEADING.LICENSEMNGR_AVAILABILITY + STATUS.EC_LOGS.MSG.LM_PLGN_NTFOUND)
          return { success: false, response: STATUS.EC_LOGS.HEADING.REQUIRED_PLUGINS_FOR_EC + STATUS.EC_LOGS.HEADING.LICENSEMNGR_AVAILABILITY + STATUS.EC_LOGS.MSG.LM_PLGN_NTFOUND }
        }
      } else {
        logger.error(STATUS.EC_LOGS.HEADING.REQUIRED_PLUGINS_FOR_EC + STATUS.EC_LOGS.HEADING.REGISTRATION_WITH_SECURITY_PLGN + STATUS.EC_LOGS.MSG.REGISTER_SAVE_EC_APP_WITH_SECURITY_PLGN_FAILED)
        return { success: false, response: false }
      }
    } else {
      return { success: false, response: storeSecurityPlugin.response }
    }
  } else {
    return { success: false, response: STATUS.EC_LOGS.MSG.SECURITY_PLUGIN_NTFOUND }
  }
}

/********** GET LSA PLUGIN INFO *********************/
async function getLSAPluginInfo(req, res) {
  logger.info(STATUS.EC_LOGS.MSG.IN_GET_LAS_INFO_MSG);
  models.plugins.findOne({
    raw: true,
    where: {
      UniqueName: process.env.PRIMARY_LSA_APP_NAME
    }
  }).then(plugin => {
    if (plugin) {

      PluginData = JSON.parse(JSON.stringify(plugin));
      logger.info('PLUGIN DATA FROM DB', PluginData);
      PluginDataConfig = {
        name: PluginData.Name,
        baseUrl: PluginData.BaseUrl,
        serverPort: parseInt(PluginData.ServerPort),
        uiport: parseInt(PluginData.UiPort),
        serverUrls: JSON.parse(PluginData.ServerUrls)
      }
      logger.info(STATUS.EC_LOGS.MSG.PLUGIN_DATA_SENT_SUCCESS_MSG);
      res.send({ success: true, response: PluginDataConfig })
    } else {
      logger.info(STATUS.COMMON_MSGS.ERROR_SENDING_PLUGIN_DATA);
      res.send({ success: false, response: STATUS.COMMON_MSGS.PLGN_NOT_FOUND })
    }
  })
}


//Register API to retrieve the application id and secret

async function register(req, res, next) {
  let reqBody = req.body;
  let registrationAppName = reqBody.appName, registrationAppVersion = _.toString(reqBody.appVersion);
  let registraionAppAdminName = reqBody.adminName ? reqBody.adminName : null
  let registrationAppAdminEmail = reqBody.adminEmail ? reqBody.adminEmail : null
  let registrationAppPrivileges = reqBody.privileges ? reqBody.privileges : []
  let respOfIsRegisteredApp = await ISASctrl.isRegisteredAppWithSecurityPlugin(registrationAppName, registrationAppVersion, registraionAppAdminName, registrationAppAdminEmail, registrationAppPrivileges, req)
  if (respOfIsRegisteredApp && respOfIsRegisteredApp.success === true) {
    let createdResp = await commonUtils.createResponse(STATUS.SUCCESS, respOfIsRegisteredApp.response.RegistrationResponse)
    commonUtils.sendResponse(req, res, createdResp, next)
  } else {
    if (respOfIsRegisteredApp && respOfIsRegisteredApp.response && respOfIsRegisteredApp.response.RegistrationResponse.ErrorCode == 8001) {
      let createdResp = await commonUtils.createResponse(STATUS.ERROR.APPLICATION_REGISTER, null, respOfIsRegisteredApp.response.RegistrationResponse)
      commonUtils.sendResponse(req, res, createdResp, next)
      //logger.error(STATUS.EC_LOGS.HEADING.REGISTRATION_WITH_SECURITY_PLGN + STATUS.EC_LOGS.MSG.APP_REGISTARTION_WITH_SECURITY_PLUGIN_FAILED + reqBody.name +JSON.stringify(respOfIsRegisteredApp))
    } else {
      let createdResp = await commonUtils.createResponse(STATUS.ERROR.APPLICATION_REGISTER)
      commonUtils.sendResponse(req, res, createdResp, next)
      //logger.error(STATUS.EC_LOGS.HEADING.REGISTRATION_WITH_SECURITY_PLGN + STATUS.EC_LOGS.MSG.APP_REGISTARTION_WITH_SECURITY_PLUGIN_FAILED + reqBody.name +JSON.stringify(respOfIsRegisteredApp))
    }
  }
}





module.exports = {
  checkRequiredPluginsForPortal: checkRequiredPluginsForPortal,
  detectAllAvailablePlugins: detectAllAvailablePlugins,
  checkAndStoreConfigInfoOfPlugins: checkAndStoreConfigInfoOfPlugins,
  doInitialStepsWithSecurityPlugin: doInitialStepsWithSecurityPlugin,
  detectedPluginsHashtable: AllDetectedPluginsHashTable,
  enableAndDisablePluginServices: enableAndDisablePluginServices,
  getRegisteredpluginById: getRegisteredpluginById,
  dectectListOfPlugins: dectectListOfPlugins,
  restartAllPluginServices: restartAllPluginServices,
  restartinvidualPluginServices: restartinvidualPluginServices,
  getPluginFromDbByID: getPluginFromDbByID,
  getListOfPluginsInDB: getListOfPluginsInDB,
  checkDBisNewRegisteredApplication: checkDBisNewRegisteredApplication,
  getLicenseManagerInfo: getLicenseManagerInfo,
  getNotificationManagerUrl: getNotificationManagerUrl,
  getLSAPluginInfo: getLSAPluginInfo,
  register: register
  // checkIsPluginRegistered : checkIsPluginRegistered,   
  // allRegisteredPluginList : allRegisteredPluginList,
}
