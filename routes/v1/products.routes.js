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
* File Name: product.routes.js
*
* DESCRIPTION
* This code contains Enterprise Poratl product  API routes
*
* ========================================================================================
*/
const express = require('express');
const router = express.Router();
var products = require('../../controllers/products.server.controller');
const utils = require('../../utils/check.utils') 
const validate = require('../../validators/validate');
    
router.route('/addProduct')
    .post([validate.checkAdminPrivileges],products.addProduct);


router.route('/editProduct')
    .post([validate.checkAdminPrivileges],products.editProduct);

router.route('/deleteProduct')
    .post([validate.checkAdminPrivileges],products.deleteProduct);

router.route('/getProductList')
    .get([validate.checkAdminPrivileges],products.getProductList);


module.exports = router;