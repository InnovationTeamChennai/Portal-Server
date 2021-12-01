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
* File Name: plugins.js
*
* DESCRIPTION
* This code contains database model schema of Enterprise Portal plugin details table
*
* ========================================================================================
*/
module.exports = (sequelize, Sequelize) => {
    const Plugins = sequelize.define("tbl_portal_plugins", {
      Id: {
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
    },
    Uid: {
        type: Sequelize.STRING,
        allowNull : false
    },
    Name: {
        type: Sequelize.STRING,
        allowNull: false
    },
    UniqueName: {
        type: Sequelize.STRING,
        allowNull: false
    },
    Version: {
        type: Sequelize.STRING,
        allowNull: false
    },
    Description: {
        type: Sequelize.STRING
    },
    UiPort: {
        type: Sequelize.STRING,
        allowNull: false
    },
    BaseUrl: {
        type: Sequelize.STRING,
        allowNull: false
    },
    Type: {
        type: Sequelize.STRING,
        allowNull: false
    },
    Instances: {
        type: Sequelize.STRING
    },
    ServerPort: {
        type: Sequelize.STRING,
        allowNull: false
    },
    PrependUrl: {
        type: Sequelize.STRING,
        allowNull: false
    },
    IconUrl : {
        type: Sequelize.TEXT,
        allowNull: true
    },
    UiUrls: {
        type: Sequelize.TEXT
    },
    ServerUrls: {
        type: Sequelize.TEXT
    },
    IsRegistered: {
        type: Sequelize.BOOLEAN,
        allowNull: false
    },
    ServicesEnabled: {
        type: Sequelize.BOOLEAN,
        allowNull: false
    },
    IsLicenced: {
        type: Sequelize.BOOLEAN,
        allowNull: true
    },
    IsActive: {
        type: Sequelize.BOOLEAN,
        allowNull: false
    },
    CreatedDate: {
        type: Sequelize.DATE
    },
    LastModifiedDate: {
        type: Sequelize.DATE
    }
    },
    {
        freezeTableName: true,
          timestamps: false
    });
  
    return Plugins;
  };