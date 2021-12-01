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
* File Name: crm.routes.js
*
* DESCRIPTION
* This code contains Enterprise Portal Customer API routes
*
* ========================================================================================
*/
const express = require('express')
const router = express.Router();
const utils = require('../../utils/check.utils')

const validate = require('../../validators/validate');

var crm = require('../../controllers/crm.server.controller');


router.route('/postHierarchy')
    .post([validate.validateUniqueId],crm.postHierarchy);

router.route('/getToken')
      .post(crm.getToken);
      
router.route('/UpdateCustomer')
    .post([validate.checkAdminPrivileges],crm.UpdateCustomer);


router.route('/CustomerDetails')
    .post([validate.checkAdminPrivileges],crm.CustomerDetails);

router.route('/getCustomerGUID')
    .get([validate.checkAdminPrivileges],crm.getCustomerGUID);

router.route('/getCustomerList')
    .get([validate.checkUserPrivileges],crm.getCustomerList);

router.route('/certificateValidate')
    .post(crm.certificateValidate);
router.route('/getFileData/:CustomerId')
    .get(crm.getFileData);

router.route('/getLicensedProducts')
    .get(crm.getLicensedProducts);    

router.route('/validateCustomer')
    .post(crm.validateCustomer);

module.exports = router;