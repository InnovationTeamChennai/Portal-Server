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
* File Name: authentication.routes.js
*
* DESCRIPTION
* This code contains Authentication,Logout,Validation of session-ID's API routes
*
* ========================================================================================
*/

const express = require('express')
const router = express.Router();
const utils = require('../../utils/check.utils')

var user = require('../../controllers/users.server.controller');

const validate = require('../../validators/validate');



router.route('/login')
    .post([utils.authentication.checkRequiredFields], user.login);


router.route('/logout')
    .delete([validate.checkReqHeaders], user.logout);

router.route('/valid')
    .get([validate.checkReqHeaders], user.checkValidUser);


router.route('/app/info')
    .get(user.getAppConfigInfo);

router.route('/app/preinfo')
    .get(user.getAppPreInfo);



module.exports = router;