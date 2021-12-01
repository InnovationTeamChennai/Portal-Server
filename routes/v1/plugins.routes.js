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
* File Name: plugins.routes.js
*
* DESCRIPTION
* This code contains Enterprise Portal plugins info fetch,detect,restart services API routes
*
* ========================================================================================
*/
const express = require('express');
const router = express.Router();
var plugins = require('../../controllers/plugins.server.controller');
const utils = require('../../utils/check.utils')
const validate = require('../../validators/validate') ;

router.route('/detect')
    .get([validate.checkPluginUserPrivileges],plugins.dectectListOfPlugins);


router.route('/services/activate')
    .put([validate.checkPluginUserPrivileges, utils.plugin.checkPluginServicesEnableDisableBody],plugins.enableAndDisablePluginServices);


router.route('/services/restart/all')    
    .get([validate.checkPluginUserPrivileges],plugins.restartAllPluginServices);

router.route('/services/restart/:uid?')
    .get([validate.checkPluginUserPrivileges, utils.plugin.checkPluginUidInParams],plugins.restartinvidualPluginServices);


router.route('/licensemanager/fetch')
    .get(plugins.getLicenseManagerInfo);
    
router.route('/notificationmanager/url')
.get(plugins.getNotificationManagerUrl);

router.route('/') 
    .get(plugins.getRegisteredpluginById);

router.route('/getLSAInfo') 
    .get(plugins.getLSAPluginInfo);


module.exports = router;