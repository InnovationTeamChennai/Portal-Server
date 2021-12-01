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
* File Name: customer.js
*
* DESCRIPTION
* This code contains database model schema of Enterprise Portal Customer details table
*
*
* ========================================================================================
*/
module.exports = (sequelize, Sequelize) => {
	const Customer = sequelize.define("tbl_portal_customers", {
	  CustomerID: {
			  type: Sequelize.STRING
	  },
	  NodeID:{
		  type: Sequelize.INTEGER,
		  autoIncrement: true,
		  primaryKey:true
	  },
	  NodeName: {
		  type: Sequelize.STRING
		},
		EmailID: {
		  type: Sequelize.STRING
		},
		Telephone: {
		  type: Sequelize.STRING
		},
		DomainName: {
		  type: Sequelize.STRING
		},
		BillingId:{
			type: Sequelize.STRING
		},
		CertificatePath:{
			type: Sequelize.STRING
		},
		CertificateValidity:{
			type:Sequelize.STRING
		},
		isCA:{
			type:Sequelize.STRING
		},
		CertificateName:{
			type:Sequelize.STRING
		},
		CreatedAt:{
			type: Sequelize.DATE
		},
		 LastUpdated:{
			type: Sequelize.DATE
		 }, 
		 LastCommunicated:{
			type: Sequelize.STRING
		 }
		
  
			  },
	  {
		  
        freezeTableName: true,
		  timestamps: false
	  });
  
	return Customer;
  };