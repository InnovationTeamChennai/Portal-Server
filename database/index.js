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
* File Name: index.js
*
* DESCRIPTION
* This code contains creation of database connection, database model schema creation and synchronization
*
* ========================================================================================
*/
require('dotenv').config();
const chalk = require('chalk');
const Sequelize = require("sequelize");
var session = require('express-session');
var SequelizeStore = require('connect-session-sequelize')(session.Store);
var sequelize, mySessionStore;
let db = {};
var app_env = process.env.NODE_ENV || 'development';
var config = require('../config/db.config')[app_env];
var { encryptWithDpapi, decryptWithDpapi, isBaseEncrypted } = require('../utils/common.utils');
var logger = require('../utils/winston.utils').PortalLogs;
var STATUS = require('../utils/status-codes-messages.utils');


//function to decrypt the database credentials
async function startDecryptDbPswdAndConnectToDB() {
	try {
		if (await isBaseEncrypted(config.password)) {
			let decryptedPswd = await decryptWithDpapi(config.password);

			if (decryptedPswd.success === true) {
				config.password = decryptedPswd.response;
				console.log(chalk.green(STATUS.EC_LOGS.HEADING.PASS_DECRYPTED_SUCCESS))
				logger.info(STATUS.EC_LOGS.HEADING.PASS_DECRYPTED_SUCCESS);
				let connectDbResp = await connectMyDb(config)
				return connectDbResp;
			} else {
				logger.error(STATUS.EC_LOGS.HEADING.PASS_DECRYPTED_FAIL + JSON.stringify(decryptedPswd.response))
				console.log(chalk.red(STATUS.EC_LOGS.HEADING.PASS_DECRYPTED_FAIL, decryptedPswd.response))
				return decryptedPswd;
			}
		} else {
			let encryptedPswd = await encryptWithDpapi(config.password)

			if (encryptedPswd.success === true) {

				app_env && app_env.toLowerCase() == 'development' ? process.env.DEV_DB_PASSWORD = encryptedPswd.response : process.env.PROD_DB_PASSWORD = encryptedPswd.response;
				logger.info(STATUS.EC_LOGS.HEADING.PASS_ENCRYPT_SUCCESS);
				let connectDbResp = await connectMyDb(config)
				return connectDbResp;
			} else {
				logger.error(STATUS.EC_LOGS.HEADING.PASS_ENCRYPT_FAIL + JSON.stringify(encryptedPswd.response))
				console.log(chalk.red(STATUS.EC_LOGS.HEADING.PASS_DECRYPTED_FAIL, encryptedPswd.response))
				return encryptedPswd;
			}
		}
	} catch (err) {
		logger.error(err);
		return { success: false, response: err }
	}
}

/*********************************************************
 **************** CONNECTING THE DB   *******************
**********************************************************/

async function connectMyDb(config) {
	try {
		sequelize = new Sequelize(config.database, config.username, config.password, config.options);

		db.customers = require("./models/customer.js")(sequelize, Sequelize);


		db.nodes = require("./models/nodes.js")(sequelize, Sequelize);
		db.plugins = require("./models/plugins.js")(sequelize, Sequelize);
		db.registeredApplications = require("./models/registeredApplications.js")(sequelize, Sequelize);
		db.sessionLogs = require("./models/sessionLogs.js")(sequelize, Sequelize);
		db.sessions = require("./models/sessions.js")(sequelize, Sequelize);
		db.products = require("./models/products.js")(sequelize, Sequelize);
		db.installation = require("./models/installation.js")(sequelize, Sequelize);
		db.plugins_configs = require("./models/plugins_configs.js")(sequelize, Sequelize);



		/*********** BEGIN OF SESSION TABLE AND SYNCING LOGIC ***********/


		function extendDefaultFields(defaults, session) {
			return {
				data: defaults.data,
				tokenTimeOutInterval: session.tokenTimeOutInterval,
				expires: session.expires,
				userName: session.userName,
				accessToken: session.accessToken,
				refreshToken: session.refreshToken,
				privileges: session.privileges,
				tokenRefreshedAt: new Date(Date.now()),

			};
		}

		mySessionStore = new SequelizeStore({
			db: sequelize,
			table: 'tbl_portal_sessions',
			disableTouch: false,
			extendDefaultFields: extendDefaultFields,
			checkExpirationInterval: 60000, // The interval at which to cleanup expired sessions in milliseconds.
			// expiration: session.expires // The maximum age (in milliseconds) of a valid session.
		})

		db.sequelize = sequelize;
		db.Sequelize = Sequelize;
		db.mySessionStore = mySessionStore;

		//db.mySessionStore = mySessionStore;

		//********** Portal DB TABLES SYNC ************// To Verify connection was successful
		return await sequelize.sync().then(() => {
			console.log(chalk.green(STATUS.EC_LOGS.HEADING.DB_CONN_SYNC_SUCCESS))
			return { success: true, response: true }
		}).catch(error => {

			logger.error(error);
			return { success: false, response: error }
		})

	}

	catch (err) {
		logger.error(err);
		return { success: false, response: err }
	}
}



db.startDecryptDbPswd = startDecryptDbPswdAndConnectToDB;
module.exports = db;