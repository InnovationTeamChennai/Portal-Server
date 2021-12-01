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
* File Name: app-config.js
*
* DESCRIPTION
* This code contains application configurations
* ========================================================================================
*/
const dotenv = require('dotenv').config();

var env = process.env.NODE_ENV || 'development';
var config = require('./db.config')[env];
var privilegesArray= [
    {
        name : "May Add and Edit Customer and Products",
        description : "Admin can view and modify",
        key : "Admin"
    },
    {
        name : "May View Plugins and Products",
        description : "User can view plugins",
        key : "Plugin_User"
    },
    {
        name : "May View Customer",
        description : "User can only view",
        key : "User"
    }
]

const appInfo = {
    name: config.APP_NAME,
    uniqueName : config.uniqueAppName,
    version : config.APP_VERSION,
    description : config.description,
    baseUrl : config.url,
    serverPort : config.port,   
    httpReq : process.env.SECURE_CONNECTION == 'true' ? 'https://' : 'http://',
    securityApp : process.env.PRIMARY_SECURITY_APP_NAME,
    appEnv : process.env.NODE_ENV,
    sessionSecret : 'ICUMedical_Portal',
    sessionMaxAge : 3000,
    isServicesEnabled : true,
    isISASEnabled : true,
    licenseManagerApp : process.env.PRIMARY_LICENSE_MANAGER_APP_NAME,
    notificationManagerApp : process.env.PRIMARY_NOTIFICATION_MANAGER_APP_NAME,
    AdminEmail: process.env.Admin_Email,
    AdminMobileNo: process.env.Admin_Mobile,
    PortalUrls : {
        getPluginConfigDetailsAPI : process.env.GET_PLUGIN_CONFIG_DETAILS_API
    },
    privileges : privilegesArray
}

module.exports = appInfo



