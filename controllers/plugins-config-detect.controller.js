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
* File Name: plugins-config-detect.controller.js
*
* DESCRIPTION
* This code contains get detected plugin config files from db
*
* ========================================================================================
*/
// const models = require('../database');
        
const db = require("../database");
const PluginConfig = db.plugins_configs;
var minLength=0
var oneLength=1



async function getDetectedPluginConfigFiles() {
   
    let acceptedPluginConfigFiles = [],
      rejectedPluginsConfigFiles = [],
      pluginConfigFiles = {}
    try {
      return PluginConfig.findAll({
        raw: true
      }).then(plugins => {
        if (plugins && plugins.length > minLength) {
          let totalCount = plugins.length,
            acceptedCount = minLength,
            rejectedCount = minLength
          for (let i = 0; i < plugins.length; i++) {
            let plugingData = plugins[i]
            if (plugingData && plugingData.name && plugingData.serverPort && plugingData.baseUrl && plugingData.prependUrl) {
              acceptedCount = acceptedCount + oneLength
              acceptedPluginConfigFiles.push(plugingData)
            } else {
              rejectedCount = rejectedCount + oneLength
              rejectedPluginsConfigFiles.push(plugingData)
            }
            if (totalCount == acceptedCount + rejectedCount) {
              pluginConfigFiles.acceptedPluginConfigFiles = acceptedPluginConfigFiles
              pluginConfigFiles.rejectedPluginsConfigFiles = rejectedPluginsConfigFiles
              // resolve(pluginConfigFiles)
              return {success: true, response: pluginConfigFiles}
            }
          }
        } else {
          pluginConfigFiles.acceptedPluginConfigFiles = acceptedPluginConfigFiles
          pluginConfigFiles.rejectedPluginsConfigFiles = rejectedPluginsConfigFiles
          // resolve(pluginConfigFiles)
          return {success: true, response: pluginConfigFiles}
        }
      }).catch(err => {
        // reject(err)
        return {success: false, response: err}
      })
    } catch (error) {
      // reject(error)
      return {success: false, response: error}
    }
  }



module.exports = {
    getDetectedPluginConfigFiles : getDetectedPluginConfigFiles
}