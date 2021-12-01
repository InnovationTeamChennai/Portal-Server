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
* File Name: product.validator.js
*
* DESCRIPTION
* This code contains validation for Add/Edit product.
*
* ========================================================================================
*/

/* Declare required npm packages */

var schema = require('validate');
var STATUS = require('../utils/status-codes-messages.utils');

let productNameFormat=/^[_A-z0-9\u2122]*((-|\s)*[ ]*[_A-z0-9\u2122])*$/
let productUidFormat= /^[_A-z0-9]*((-|\s)*[ ]*[_A-z0-9])*$/
let featureIdFormat=/^[_A-z0-9]*((-|\s)*[ ]*[_A-z0-9])*$/
let featureNameFormat= /^[_A-z0-9\u2122]*((-|\s)*[ ]*[_A-z0-9\u2122])*$/

/* Admin Authentication Schema */
const addProductRequest = new schema({
    ProductName: {
        required: true,
        match: productNameFormat,
        message: {
            match: STATUS.COMMON_MSGS.PRODUCT_NAME_SCHEMA_NOT_CORRECT,
            required: STATUS.COMMON_MSGS.PRODUCT_NAME_REQUIRED
        }
    },
    ProductUid: {
        required: true,
        match:productUidFormat,
        message: {
            match: STATUS.COMMON_MSGS.PRODUCT_UID_SCHEMA_NOT_MATCH,
            required: STATUS.COMMON_MSGS.PRODUCT_UID_REQUIRED
        }
    },
    Version: {
        required: true,
        message: {
            required: STATUS.COMMON_MSGS.VERSION_REQUIRED
        }
    },
    Description: {
        required: true,
        message: {
            required: STATUS.COMMON_MSGS.DESRITPTION_REQUIRED
        }
    },
    featureList: [{
        FeatureID: {
            required: false,
            match:featureIdFormat,
            message:{
                match:STATUS.COMMON_MSGS.FEATURE_ID_SCHEMA_NOT_MATCH
            }
        }, 
        FeatureName: {
            required: false,
            match: featureNameFormat,
            message:{
                match:STATUS.COMMON_MSGS.FEATURE_NAME_SCHEMA_NOT_MATCH
            }
        },
        Description: {
            required: false
        }
    }]
}

);



const editProductRequest = new schema({

    ProductName: {
        required: true,
        match: productNameFormat,
        message: {
            match: STATUS.COMMON_MSGS.PRODUCT_NAME_SCHEMA_NOT_CORRECT,
            required: STATUS.COMMON_MSGS.PRODUCT_NAME_REQUIRED
        }
    },

    Id: {
        required: true,
        message: {
            required:STATUS.COMMON_MSGS.ID_REQUIRD
        }
    },

    ProductUid: {
        required: true,
        match: productUidFormat,
        message: {
            match: STATUS.COMMON_MSGS.PRODUCT_UID_SCHEMA_NOT_MATCH,
            required: STATUS.COMMON_MSGS.PRODUCT_UID_REQUIRED
        }
    },
    Version: {
        required: true,
        message: {
            required: STATUS.COMMON_MSGS.VERSION_REQUIRED
        }
    },
    Description: {
        required: true,
        message: {
            required: STATUS.COMMON_MSGS.DESRITPTION_REQUIRED
        }
    },
    featureList: [{
        FeatureID: {
            required: false,
            match:featureIdFormat,
            message:{
                match:STATUS.COMMON_MSGS.FEATURE_ID_SCHEMA_NOT_MATCH
            }
        }, 
        FeatureName: {
            required: false,
            match:featureNameFormat,
            message:{
                match:STATUS.COMMON_MSGS.FEATURE_NAME_SCHEMA_NOT_MATCH
            }
        },
        Description: {
            required: false
        }
    }]
}

);

/* Admin Logout Schema */



module.exports = {
    AddProductRequest: addProductRequest,
    EditProductRequest: editProductRequest

};