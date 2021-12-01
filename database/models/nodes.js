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
* File Name: node.js
*
* DESCRIPTION
* This code contains database model schema of Enterprise Portal Customer nodes table
*
*
* ========================================================================================
*/
module.exports = (sequelize, Sequelize) => {
    const Nodes = sequelize.define("tbl_portal_nodes", {
      Uid: {
              type: Sequelize.STRING,
              primaryKey: true
      },
      NodeID: {
        type: Sequelize.INTEGER
      },
      NodeName: {
        type: Sequelize.STRING
      },
      NodeShortName: {
        type: Sequelize.STRING
      },
      ParentID: {
        type: Sequelize.INTEGER
      },
      RootID: {
        type: Sequelize.STRING
      },
      NodeType: {
        type: Sequelize.STRING
      },
      TypeOf: {
        type: Sequelize.STRING
      },
      NodeInfo: {
        type: Sequelize.STRING(4000)
      },
      CreatedDate: {
        type: Sequelize.DATE
      },
      LastModifiedDate: {
        type: Sequelize.DATE
      },
      TypeName:{
        type:Sequelize.STRING
      },
      IconUrl:{
        type: Sequelize.TEXT      }
      },
      {
        freezeTableName: true,
          timestamps: false
      });
  
    return Nodes;
  };