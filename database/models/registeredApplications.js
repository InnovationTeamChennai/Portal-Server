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
* File Name: registeredApplications.js
*
* DESCRIPTION
* This code contains database model schema of Enterprise Portal registered applications table
*
*
* ========================================================================================
*/
module.exports = (sequelize, Sequelize) => {
    const RegisteredApplications = sequelize.define("tbl_portal_registration", {
      ApplicationId: {
        type: Sequelize.TEXT,
        allowNull: false,
        validate : {
            notEmpty : true
        }            
    },
    ApplicationName: {
        type: Sequelize.TEXT,
        allowNull: false,
        validate : {
            notEmpty : true
        }  
    },
    ApplicationVersion: {
        type: Sequelize.STRING,
        allowNull: false,
        validate : {
            notEmpty : true
        }  
    },
    ApplicationGuid: {
      type: Sequelize.STRING,
      allowNull: false,
      validate : {
          notEmpty : true
      }  
    },
    ApplicationSecret: {
        type: Sequelize.TEXT,
        allowNull: false,
        validate : {
            notEmpty : true
        }  
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
  
    return RegisteredApplications;
  };