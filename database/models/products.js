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
* File Name: product.js
*
* DESCRIPTION
* This code contains database model schema of Enterprise Portal Product details table
*
* ========================================================================================
*/
module.exports = (sequelize, Sequelize) => {
	const Products = sequelize.define("tbl_portal_products", {
	  Id: {
              type: Sequelize.INTEGER,
              autoIncrement: true,
			  primaryKey: true
	  },
	  ProductUid: {
		type: Sequelize.STRING
	  },
	  ProductName: {
		type: Sequelize.STRING
	  },
	  Version: {
		type: Sequelize.STRING
	  },
	 Description: {
		type: Sequelize.STRING

     },
	 FeatureList:{
		type: Sequelize.STRING('MAX')
	 },
	 DateCreated:{
		type:Sequelize.STRING
	 },
	 DateUpdated:{
		type:Sequelize.STRING
	 }	
  
	},
	{
		freezeTableName: true,
		  timestamps: false
	});
  
	return Products;
};