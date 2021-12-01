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
const _ = require('lodash')
var AppConfig = require('../config/app-config');

var commonUtils = require('./common.utils');
var STATUS = require('./status-codes-messages.utils');

let userNameKeyword='userName';
let passwordKeyword= 'password'
let serviceEnableKeyword= 'serviceEnable'
let uidKeyword= 'uid'
let uniqueNameKeyword= 'uniqueName'
let stringKeyword= 'string'
let booleanKeyword= 'boolean'
let numberKeyword= 'number'
let nodenameKeyword='nodeName'
let nodeShortNameKeyword=  'nodeShortName'
let nodeTypekeyword= 'nodeType'
let typeofKeyword = 'typeOf'
let pluginIdKeyword ='pluginId'
let parentIdKeyword = 'parentId'
let nodeInfoKeyword ='nodeInfo'
let isActiveKeyword= 'isActive'
let nullKeyword = 'Null'
let nameKeyword= 'name'
let idKeyword= 'id'
let typeKeyword ='type'
let facilityKeyword= 'facilities'
let zeroLength= 0;
let oneLength= 1;
module.exports = {

    authentication: {
        checkRequiredFields: async function (req, res, next) {
            if (_.isEmpty(req.body)) {
                return await commonUtils.apiSchmeaValidationResp(res, STATUS.API_SCHEMA_ERROR.AUTH_API_BODY_NTFOUND)
            } else if (!(_.isObject(req.body))) {
                return await commonUtils.apiSchmeaValidationResp(res, STATUS.API_SCHEMA_ERROR.AUTH_API_ACCPT_OBJ_FORMT)

            } else if (!(_.has(req.body.userDetails, userNameKeyword)) || (req.body.userDetails.userName === "" || req.body.userDetails.userName === undefined)) {
                return await commonUtils.apiSchmeaValidationResp(res, STATUS.API_SCHEMA_ERROR.AUTH_API_USRNAME_NTFOUND)

            } else if (!(_.has(req.body.userDetails, passwordKeyword)) || (req.body.userDetails.password === "" || req.body.userDetails.password === undefined)) {
                return await commonUtils.apiSchmeaValidationResp(res, STATUS.API_SCHEMA_ERROR.AUTH_API_PASSWORD_NTFOUND)

            }
            next()
        }
    },



    plugin: {
        checkPluginNameInHeaders: async function (req, res, next) {
            if (!(req.headers.name)) {
                return await commonUtils.apiSchmeaValidationResp(res, STATUS.API_SCHEMA_ERROR.PLGN_NAME_NTFOUND_IN_HEADERS)
            }
            next()
        },

        checkPluginUidInParams: async (req, res, next) => {
            if (!req.params.uid) {
                return await commonUtils.apiSchmeaValidationResp(res, STATUS.API_SCHEMA_ERROR.RESATRT_INDVL_PLGN_SERVICES)
            }
            next()
        },

        checkPluginServicesEnableDisableBody: async function (req, res, next) {
            if (_.isEmpty(req.body)) {
                return await commonUtils.apiSchmeaValidationResp(res, STATUS.API_SCHEMA_ERROR.ENABLE_DISSABLE_PLGN_SERVICES_API_BDY_NTFOUND)
            } else if (_.size(req.body) != 3) {
                return await commonUtils.apiSchmeaValidationResp(res, STATUS.API_SCHEMA_ERROR.ENABLE_DISSABLE_PLGN_SERVICES_API_WRONG_BODY)

            } else if (!(_.has(req.body, uidKeyword)) || !(_.has(req.body, serviceEnableKeyword)) || !(_.has(req.body, uniqueNameKeyword))) {
                return await commonUtils.apiSchmeaValidationResp(res, STATUS.API_SCHEMA_ERROR.ENABLE_DISSABLE_PLGN_SERVICES_API_REQURD_PARAMS_NTFOUND)

            } else if (_.has(req.body, uidKeyword) || _.has(req.body,serviceEnableKeyword) || _.has(req.body, uniqueNameKeyword)) {
                if ((req.body.uid === undefined) || (req.body.uid === null) || (req.body.uid === "") || ((typeof req.body.uid).toLowerCase() !== stringKeyword)) {
                    return await commonUtils.apiSchmeaValidationResp(res, STATUS.API_SCHEMA_ERROR.ENABLE_DISSABLE_PLGN_SERVICES_API_UID_NTFOUND)

                }
                if ((req.body.serviceEnable === undefined) || (req.body.serviceEnable === null) || ((typeof req.body.serviceEnable).toLowerCase() !== booleanKeyword)) {
                    return await commonUtils.apiSchmeaValidationResp(res, STATUS.API_SCHEMA_ERROR.ENABLE_DISSABLE_PLGN_SERVICES_API_SERVENBL_NTFOUND)

                }
                if ((req.body.uniqueName === undefined) || (req.body.uniqueName === null) || (req.body.uniqueName === "") || ((typeof req.body.uniqueName).toLowerCase() !== stringKeyword) || ((req.body.uniqueName).toLowerCase() === (AppConfig.securityApp).toLowerCase())) {
                    return await commonUtils.apiSchmeaValidationResp(res, STATUS.API_SCHEMA_ERROR.ENABLE_DISSABLE_PLGN_SERVICES_API_UNQNAME_NTFOUND)

                }
            }

            next()
        }
    },


    hierarchy: {
        checkBodyOfDeleteHierarchyNode: async function (req, res, next) {

            if (!(req.params.uid)) {
                return await commonUtils.apiSchmeaValidationResp(res, STATUS.API_SCHEMA_ERROR.HRCHY_DELETE_NODE_API_UID_NTFOUND)

            }
            next()
        },

        checkBodyOfHierarchyNodeCreation: async function (req, res, next) {
            if (_.isEmpty(req.body)) {
                return await commonUtils.apiSchmeaValidationResp(res, STATUS.API_SCHEMA_ERROR.HRCHY_CREATE_NODE_API_BODY_NTFOUND)

            } else if (!(_.isEmpty(req.body))) {
                let missingField = []
                _.forEach(req.body, function (value, key) {

                    if ((_.camelCase(key) === nodenameKeyword) || (_.camelCase(key) === nodeShortNameKeyword) || (_.camelCase(key) === nodeTypekeyword) ||
                        (_.camelCase(key) === typeofKeyword) || (_.camelCase(key) === pluginIdKeyword) || (_.camelCase(key) === parentIdKeyword)
                        || (_.camelCase(key) === nodeInfoKeyword) || (_.camelCase(key) === isActiveKeyword)) {
                        missingField.push(_.camelCase(key))
                    }
                });

                if (missingField.length === 8) {
                    if (req.body.typeOf.length > 20) {
                        return await commonUtils.apiSchmeaValidationResp(res, STATUS.API_SCHEMA_ERROR.HRCHY_CREATE_NODE_API_WRONG_TYPE_INFO)

                    } else if ((req.body.typeOf.length <= 2) && ((typeof req.body.typeOf).toLowerCase() != numberKeyword)) {
                        return await commonUtils.apiSchmeaValidationResp(res, STATUS.API_SCHEMA_ERROR.HRCHY_CREATE_NODE_API_WRONG_FORMAT)

                    }
                    next()
                } else if (missingField.length < 8) {
                    return await commonUtils.apiSchmeaValidationResp(res, STATUS.API_SCHEMA_ERROR.HRCHY_CREATE_NODE_API_REQURD_FIELDS_MISSING)

                }
            }

        },

        checkHierarchyNodeUpdate: async function (req, res, next) {
            if (_.isEmpty(req.body)) {
                return await commonUtils.apiSchmeaValidationResp(res, STATUS.API_SCHEMA_ERROR.HRCHY_UPDT_NODE_API_BODY_NTFOUND)

            } else if (_.size(req.body) > 6) {
                return await commonUtils.apiSchmeaValidationResp(res, STATUS.API_SCHEMA_ERROR.HRCHY_UPDT_NODE_API_WRONG_PARAMS)

            } else if (!(_.has(req.body, uidKeyword)) || !(_.has(req.body,nodeTypekeyword)) || !(_.has(req.body,nodenameKeyword)) || !(_.has(req.body, nodeInfoKeyword)) || !(_.has(req.body, typeofKeyword))) {
                return await commonUtils.apiSchmeaValidationResp(res, STATUS.API_SCHEMA_ERROR.HRCHY_UPDT_NODE_API_REQURD_PARAMS_NTFOUND)

            } else if ((req.body.uid === undefined) || (req.body.uid === null) || (req.body.uid === "")) {
                return await commonUtils.apiSchmeaValidationResp(res, STATUS.API_SCHEMA_ERROR.HRCHY_UPDT_NODE_API_UID_NTFOUND)

            } else
                if ((req.body.nodeType === undefined) || (req.body.nodeType === null) || (req.body.nodeType === "")) {
                    return res.status(STATUS.COMMON_MSGS.HTTP_ERR_CODE).send({
                        message: STATUS.API_SCHEMA_ERROR.HRCHY_UPDT_NODE_API_NODETYPE_NTFOUND[oneLength]
                    })
                } else
                    if ((req.body.nodeName === undefined) || (req.body.nodeName === null) || (req.body.nodeName === "")) {
                        return await commonUtils.apiSchmeaValidationResp(res, STATUS.API_SCHEMA_ERROR.HRCHY_UPDT_NODE_API_NODETYPE_NTFOUND)

                    } else
                        if ((req.body.nodeInfo === undefined) || (req.body.nodeInfo === null) || (req.body.nodeInfo === "") || (req.body.nodeInfo === 'null') || (req.body.nodeInfo === nullKeyword) || (req.body.nodeInfo === nullKeyword)) {
                            return await commonUtils.apiSchmeaValidationResp(res, STATUS.API_SCHEMA_ERROR.HRCHY_UPDT_NODE_API_NODENAME_NTFOUND)

                        } else
                            if ((req.body.typeOf === undefined) || (req.body.typeOf === null) || (req.body.typeOf === "")) {
                                return await commonUtils.apiSchmeaValidationResp(res, STATUS.API_SCHEMA_ERROR.HRCHY_UPDT_NODE_API_NODEINFO_NTFOUND)

                            } else if (req.body.typeOf.length > 20) {
                                return await commonUtils.apiSchmeaValidationResp(res, STATUS.API_SCHEMA_ERROR.HRCHY_UPDT_NODE_API_TYPEOF_NTFOUND)

                            } else if ((req.body.typeOf.length <= 2) && ((typeof req.body.typeOf).toLowerCase() != numberKeyword)) {
                                return await commonUtils.apiSchmeaValidationResp(res, STATUS.API_SCHEMA_ERROR.HRCHY_UPDT_NODE_API_WRONG_TYPEOF)

                            }


            next()
        },

        checkBodyOfAddElement: async function (req, res, next) {
            if (_.isEmpty(req.body)) {
                return await commonUtils.apiSchmeaValidationResp(res, STATUS.API_SCHEMA_ERROR.HRCHY_ADD_ELEMENT_API_BODY_NTFOUND)
            } else if (_.size(req.body) > 3) {
                return await commonUtils.apiSchmeaValidationResp(res, STATUS.API_SCHEMA_ERROR.HRCHY_ADD_ELEMENT_API_BODY_SIZE)
            } else if (!(_.has(req.body, nameKeyword)) && !(_.has(req.body, idKeyword))) {
                return await commonUtils.apiSchmeaValidationResp(res, STATUS.API_SCHEMA_ERROR.HRCHY_ADD_ELEMENT_API_REQUIRED_FIELDS_MISSING)
            } else if (!(_.has(req.body, nameKeyword)) || (req.body.name === "" || req.body.name === undefined)) {
                return await commonUtils.apiSchmeaValidationResp(res, STATUS.API_SCHEMA_ERROR.HRCHY_ADD_ELEMENT_API_NAME_NTFOUND)
            } else if (!(_.has(req.body, idKeyword))) {
                return await commonUtils.apiSchmeaValidationResp(res, STATUS.API_SCHEMA_ERROR.HRCHY_ADD_ELEMENT_API_ID_NTFOUND)
            } else if (!(_.isArray(req.body.id))) {
                return await commonUtils.apiSchmeaValidationResp(res, STATUS.API_SCHEMA_ERROR.HRCHY_ADD_ELEMENT_API_WRONG_FRMT_ID)
            } else if (req.body.id.length < oneLength) {
                return await commonUtils.apiSchmeaValidationResp(res, STATUS.API_SCHEMA_ERROR.HRCHY_ADD_ELEMENT_API_EMPTY_ID)
            } else if (!(_.has(req.body, nameKeyword)) && !(_.has(req.body, idKeyword))) {
                return res.status(STATUS.COMMON_MSGS.HTTP_ERR_CODE).send({
                    message: STATUS.COMMON_MSGS.NAME_ID_IS_MISSING
                })
            }
            next()
        },

        checkIdInParamsOfGetElement: async function (req, res, next) {
            if (!req.params.uid) {
                return await commonUtils.apiSchmeaValidationResp(res, STATUS.API_SCHEMA_ERROR.HRCHY_GET_ELEMENT_API_UID_NTFOUND)
            }
            next()
        },

        checkBodyOfRemoveElement: async function (req, res, next) {
            if (_.isEmpty(req.body)) {
                return await commonUtils.apiSchmeaValidationResp(res, STATUS.API_SCHEMA_ERROR.HRCHY_REMOVE_ELEMENT_API_BODY_NTFOUND)

            } else if (!(_.has(req.body, idKeyword))) {
                return await commonUtils.apiSchmeaValidationResp(res, STATUS.API_SCHEMA_ERROR.HRCHY_REMOVE_ELEMENT_API_ID_NTFOUND)

            } else if (!(_.isArray(req.body.id)) || _.isEmpty(req.body.id)) {
                return await commonUtils.apiSchmeaValidationResp(res, STATUS.API_SCHEMA_ERROR.HRCHY_REMOVE_ELEMENT_API_EMPTY_ARRY)

            }
            next()
        }


    },

    facility: {
        checkRequiredFieldsInBody: function (req, res, next) {
            if (_.isEmpty(req.body)) {
                return res.status(STATUS.COMMON_MSGS.HTTP_ERR_CODE).send({
                    message: STATUS.COMMON_MSGS.REQ_BODY_NTFOUND
                })
            } else if (!(_.isEmpty(req.body))) {
                let missingField = []
                _.forEach(req.body, function (value, key) {

                    if ((_.lowerCase(key) == idKeyword) || (_.lowerCase(key) == typeKeyword) || (_.lowerCase(key) == facilityKeyword)) {
                        missingField.push(_.camelCase(key))
                    }
                });

                if (missingField.length == 3) {
                    next()
                } else if (missingField.length < 4) {
                    return res.status(STATUS.COMMON_MSGS.HTTP_ERR_CODE).send({
                        message: STATUS.COMMON_MSGS.REQUIRED_FIELD_MISSING
                    })
                }
            }

        }
    },



    // need to add this middleware with status code //TODO
    application: {
        registration: async (req, res, next) => {
            if (_.isEmpty(req.body)) {
                return await commonUtils.apiSchmeaValidationResp(req, res, STATUS.API_SCHEMA_ERROR.APPLICATION_REGISTARTION_API_BODY_NTFOUND, next)
            } else if (!(_.isObjectLike(req.body))) {
                return await commonUtils.apiSchmeaValidationResp(req, res, STATUS.API_SCHEMA_ERROR.APPLICATION_REGISTARTION_API_WRONG_BODY, next)
            } else if (!(req.body.appName) || !(req.body.appVersion) || !(req.body.privileges) || !(_.isArray(req.body.privileges)) || (_.isArray(req.body.privileges) && req.body.privileges.length == zeroLength)) {
                return await commonUtils.apiSchmeaValidationResp(req, res, STATUS.API_SCHEMA_ERROR.APPLICATION_REGISTARTION_API_REQUIRD_FIELDS_NTFOUND, next)
            }
            next()
        }
    }


}