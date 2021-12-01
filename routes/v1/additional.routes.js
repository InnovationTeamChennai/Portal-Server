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
* File Name: additional.routes.js
*
* DESCRIPTION
* This code contains Enterprise Portal redirection API routes
*
* ========================================================================================
*/

const express = require('express')
const router = express.Router();

var rehost = require('../../controllers/rehost.server.controller');

router.route('/*')
    .get(rehost.redirectionApi)
    .post(rehost.redirectionApi)
    .put(rehost.redirectionApi)
    .delete(rehost.redirectionApi);
    // .get(rehost.redirectApi);

module.exports = router;