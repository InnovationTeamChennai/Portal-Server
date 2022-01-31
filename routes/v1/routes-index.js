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
* File Name: index.js
*
* DESCRIPTION
* This code contains Enterprise Poratl all base API routes
*
* ========================================================================================
*/
const express = require('express');
const router = express.Router();
var authenticationRoutes = require('./authentication.routes');
var pluginRoutes = require('./plugins.routes');


var pluginApiRoutes = require('./additional.routes');

var crmroutes = require('./crm.routes');
var productroutes = require('./products.routes');

var hierarchyRoutes = require('./hierarchy.routes');

var applicationRoutes = require('./application.routes');


router.use('/plugin', pluginApiRoutes);

router.use('/user', authenticationRoutes);

router.use('/plugins', pluginRoutes);

router.use('/customers',crmroutes);


router.use('/products',productroutes);

router.use('/hierarchy',hierarchyRoutes);



module.exports = router;