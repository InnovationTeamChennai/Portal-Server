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
* File Name: db.config.js
*
* DESCRIPTION
* This code contains Enterprise Portal database configurations based on Node environment(PROD/DEV) 
*
* ========================================================================================
*/
const dotenv = require('dotenv').config();  

module.exports = {
    development: {
        username : process.env.DEV_DB_USERNAME,
        password : process.env.DEV_DB_PASSWORD,
        database : process.env.DEV_DB_DATABASE,
        url: process.env.DEV_APP_URL,
        port: process.env.PORT,
        description : process.env.DESCRIPTION,
        APP_NAME: process.env.APP_NAME,
        uniqueAppName : process.env.UNIQUE_APP_NAME,
        APP_VERSION: process.env.DEV_APP_VERSION,
        uiConfigFilePath : process.env.DEV_UI_CONFIG_FILE_PATH,
        IsasLdapAuthentication : process.env.ISAS_LDAP_AUTH_TYPE,
        IsasStandaloneUserAuthentication : process.env.ISAS_STANDALONE_USER_AUTH_TYPE,
        options:  {
            host: process.env.DEV_DB_HOST,
            dialect: process.env.DEV_DB,
            logging: false,
            pool: {
                max: parseInt(process.env.poolMax),
                min: parseInt(process.env.poolMin),
                idle: process.env.poolIdle
            },
            dialectOptions:{
                options: {
                    instanceName: process.env.DEV_DB_INSTANCE != '' ? process.env.DEV_DB_INSTANCE : '',
                    encrypt: true,
                    enableArithAbort: true,
                }
            }
           
        }
    },
    production: {
        username: process.env.PROD_DB_USERNAME,
        password: process.env.PROD_DB_PASSWORD,
        database: process.env.PROD_DB_DATABASE,
        url : process.env.PROD_APP_URL,
        port: process.env.PORT,
        description : process.env.DESCRIPTION,
        APP_NAME: process.env.APP_NAME,
        uniqueAppName : process.env.UNIQUE_APP_NAME,
        APP_VERSION: process.env.PROD_APP_VERSION,
        uiConfigFilePath : process.env.PROD_UI_CONFIG_FILE_PATH,
        IsasLdapAuthentication : process.env.ISAS_LDAP_AUTH_TYPE,
        IsasStandaloneUserAuthentication : process.env.ISAS_STANDALONE_USER_AUTH_TYPE,
        options:  {
            host: process.env.PROD_DB_HOST,
            dialect: process.env.PROD_DB,
            logging: false,
            pool: {
                max: parseInt(process.env.poolMax),
                min: parseInt(process.env.poolMin),
                idle: process.env.poolIdle
            },
            dialectOptions:{
                options: {
                    instanceName: process.env.PROD_DB_INSTANCE !='' ? process.env.PROD_DB_INSTANCE : '',
                    encrypt: true,
                    enableArithAbort: true,
                }
              }
        }      

    }
};