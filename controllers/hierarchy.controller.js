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
* File Name: hierarchy.server.controller.js
*
* DESCRIPTION
* This code contains Enterprise Manager hierarchy nodes creation, updation, deletion and adding of plugin instances
* under hierarchy tree
*
* ========================================================================================
*/
const models = require('../database');
const dotenv = require('dotenv').config();
var STATUS = require('../utils/status-codes-messages.utils')
var commonUtils = require('../utils/common.utils')
const Installation = models.installation;

var AppConfig = require('../config/app-config')

var GetPortalAppRegistartionInfo = require('./isas.controller').getPortalAppIdAndAppSecret

var PluginRoutes = require('./plugins.controller');

var logger = require('../utils/winston.utils').PortalLogs
async function getHierarchyTree(req, res, next) {
    logger.info(STATUS.EC_LOGS.MSG.IN_GET_HIERARCHY_TREE_MSG);
    let getTreeData = await getHierarchyTreeData(req);
    if (getTreeData.success === true) {
        let createdResp = commonUtils.createResponse(STATUS.SUCCESS, getTreeData.response);
        commonUtils.sendResponse(req, res, createdResp, next);
    } else {
        let createdResp = commonUtils.createResponse(STATUS.ERROR.GET_HIERARCHY_TREE, '', STATUS.ERROR.DB_FETCH[1]);
        commonUtils.sendResponse(req, res, createdResp, next);
    }
}

async function getHierarchyTreeData(req) {
    var singleInstance = await getSingleInstancePlugin();
    fakeRoot = await createFakeRoot();
  
    try {
        return models.customers.findAll()
            .then(async function (customers) {

                let customersOb = JSON.parse(JSON.stringify(customers));
                let customerList = await getCustomerList(customersOb);
                fakeRoot.children = customerList;


                let hierarchyTree = [];
                hierarchyTree.push(fakeRoot);

                if (req && req.query && req.query.plugins === 'true') {
                    let hierarchyTreeResponse = {}
                    hierarchyTreeResponse.hierarchyTree = hierarchyTree;
                    hierarchyTreeResponse.singleInstancePlugins = singleInstance.response.singleInstancePlugins;
    
                    hierarchyTreeResponse = JSON.parse(JSON.stringify(hierarchyTreeResponse));
        
                return {success:true, response:hierarchyTreeResponse}
                }else{ 
                    let hierarchyTreeResponse = {}
                    hierarchyTreeResponse.hierarchyTree = hierarchyTree;
    
                    hierarchyTreeResponse = JSON.parse(JSON.stringify(hierarchyTreeResponse));
            return {success:true, response:hierarchyTreeResponse}}

            }).catch(err => {
                return { success: false, response:  STATUS.ERROR.DB_FETCH[1] }
            });
    } catch{       
        return { success: false, response: STATUS.ERROR.GET_HIERARCHY_TREE}
    }
}

async function createFakeRoot() {

  return( Installation.findAll()
        .then(async function (AppData) {
            data = JSON.parse(JSON.stringify(AppData));
            logger.info(STATUS.EC_LOGS.MSG.IN_CREATE_FAKE_ROOT_MSG);
            if (data.length > 0) {

                fakeRoot = {};
                fakeRoot.Uid = data[0].Uid;
                fakeRoot.ParentID = null;
                fakeRoot.NodeName = "Enterprises";
                fakeRoot.NodeID = 1;
                fakeRoot.NodeType = 'enterprise-hierarchy';
                fakeRoot.PluginID = null;
                fakeRoot.children= '';

                return fakeRoot;

            }

        }));


}
async function getSingleInstancePlugin() {
    let PluginDetails = await PluginRoutes.getListOfPluginsInDB()
    PluginDetails = PluginDetails.success === true ? PluginDetails.response : []
    let singleInstancePlugins = []
    for (let i = 0; i < PluginDetails.length; i++) {
        let plugin = PluginDetails[i];
        if (plugin && (plugin.Instances == 1) && (plugin.ServicesEnabled === true) && (plugin.IsActive === true) && (plugin.UniqueName != AppConfig.securityApp)) {
            
            let singleInstancePlugin = {
                name: plugin.Name,
                Uid: plugin.Uid,
                rootNodeId: 1
            }

            singleInstancePlugins.push(singleInstancePlugin)
        }
    }
    let ecAppInfo = await GetPortalAppRegistartionInfo()
    if (ecAppInfo.success === true) {
        let singleInstancePlugin = {
            name: ecAppInfo.response.ApplicationName,
            Uid: ecAppInfo.response.ApplicationGuid,
            rootNodeId: 1
        }
        singleInstancePlugins.push(singleInstancePlugin)
    }
    let hierarchyTreeResponse = {

        singleInstancePlugins: singleInstancePlugins
    }

    return { success: true, response: hierarchyTreeResponse }
}




async function getCustomerList(customers) {

    logger.info(STATUS.EC_LOGS.MSG.IN_GET_CUSTOMER_LIST);
    customerList = [];
    for (let j = 0; j < customers.length; j++) {
        customerList.push(await generateCustomer(customers[j]));
    }

    return customerList;
}

async function generateCustomer(customer) {
    changedCustomer = {};
    changedCustomer.ParentID = 1;
    changedCustomer.Uid = customer.CustomerID;
    changedCustomer.NodeName = customer.NodeName;
    changedCustomer.NodeID = customer.NodeID + 1
    changedCustomer.NodeType = 'enterprise-hierarchy';
    changedCustomer.PluginID = null;
    changedCustomer.children = [];
    return changedCustomer;
}

module.exports = {
    getHierarchyTree: getHierarchyTree
}