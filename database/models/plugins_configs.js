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
* File Name: plugin-configs.js
*
* DESCRIPTION
* This code contains database model schema of Enterprise Portal plugin configs table(form where the Enterprise Portal
* can detect all of its plugins)
*
* ========================================================================================
*/
module.exports = (sequelize, Sequelize) => {
    const plugins_configs = sequelize.define('tbl_portal_applications', {

        name: {
            type: Sequelize.STRING,
            allowNull: false
        },
        serverPort: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        prependUrl: {
            type: Sequelize.STRING,
            allowNull: false
        },
        baseUrl: {
            type: Sequelize.STRING,
            allowNull: false
        },
        iconUrl: {
            type: Sequelize.TEXT,
            allowNull: true
        },
         uniqueName: {
            type: Sequelize.STRING,
            allowNull: false
        },
        type: {
            type: Sequelize.STRING,
            allowNull: false
        }
    },
    {
        freezeTableName: true,
    });

    return plugins_configs;
}