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
* File Name: initiateScript.js
*
* DESCRIPTION
* This code contains Enterprise Portal Server initiate Script file to add the required input 
* details to ".env" file to start the server
*
* ========================================================================================
*/
var readlineSync = require('readline-sync');
const chalk = require('chalk');
const dotenv = require('dotenv').config();
const fs = require('fs');
let serverEnvironments = ['production']
let IpOrDomainOptions = ['Host Name', 'IP Address']
let envEditOptions = ['Fresh Configuration', 'Modify Database Details', "Change TLS Certificate Details", "Modify Plugin Services Details", "Add New Plugin Service Details"]
var dpapi = require('./lib/win-dpapi');
const pm2 = require('pm2');
const Sequelize = require('sequelize');
let convert = require('xml-js');
const { stringify } = require('querystring');
var moment = require('moment');
var INITIATESCRIPT = require('./utils/initiateScriptMessage_statusCodes.utils');
let zerolength= 0;
let oneLength= 1;
let negativeOneLength=-1;





var privateIpAddress, publicIpAddress;
var environment, localhost, devIpAddress, port, secureConnection, publicIp=false, dbUsername, dbServerName, dbPassword, dbPort,
 dbName,dbServerInstance, hostName, certificateName, keyName, passPhraseKey, installationType;

async function startEnvScript(){

    console.log(chalk.blueBright("************* "+process.env.APP_NAME+" **************"));

    installationType = readlineSync.keyInSelect(envEditOptions, chalk.yellow(INITIATESCRIPT.COMMANMESSAGE.SELECT_INSTALLATION_TYPE),{limitMessage:chalk.red(INITIATESCRIPT.COMMANMESSAGE.INVALID_TYPE), cancel: INITIATESCRIPT.COMMANMESSAGE.EXIT});
    if(installationType == negativeOneLength){
        console.log(chalk.green(INITIATESCRIPT.COMMANMESSAGE.BYE))
	
    }else if(envEditOptions[installationType] === envEditOptions[zerolength]){
        console.log(chalk.green(envEditOptions[installationType]));
		
         //****** Select NODE_ENV *********//
        process.env.NODE_ENV = serverEnvironments[zerolength];
		
		let version= await readAppVersion();
		if(version==null){
			console.log(chalk.bold.red(INITIATESCRIPT.ERRORCODE.NOT_ABLE_TO_READ_PORTAL_PROP))
			process.exit(oneLength);
		}
		process.env.PROD_APP_VERSION = version;


        //****** Select Secure connection for HTTPS or HTTPS *********//
        IpOrDomain = readlineSync.question(chalk.yellow(INITIATESCRIPT.COMMANMESSAGE.ENTER_HOSTNAME_IP), {
            limit: (input)=> {
                if (input >= zerolength && input <= oneLength && input != "") {
                    return true;
                }
                else {
                    return false;
                }
            }, limitMessage: chalk.red(INITIATESCRIPT.COMMANMESSAGE.INVALID_TYPE)
        });
        console.log(chalk.green(IpOrDomainOptions[IpOrDomain]))
        if (IpOrDomain == zerolength) {
            hostName = readlineSync.question(chalk.yellow(INITIATESCRIPT.COMMANMESSAGE.ENTER_HOST_NAME));
            console.log(chalk.green(hostName))
        } else if (IpOrDomain == oneLength) {
            devIpAddress = readlineSync.question(chalk.yellow(INITIATESCRIPT.COMMANMESSAGE.ENTER_IP), {
                limit: function (input) {
                    return require('net').isIP(input); // Valid IP Address
                },
                limitMessage: chalk.red(INITIATESCRIPT.ERRORCODE.INVALID_IP)
            });
            console.log(chalk.green(devIpAddress))
        }


        //****** Select Server port(PORT) *********//
        port = readlineSync.question(chalk.yellow(INITIATESCRIPT.COMMANMESSAGE.PORT_RUN_THE_SERVER), {
            limit: function(input) {
                if(input>zerolength && input<=65535 && input!=""){
                    return true;
                }else{
                    return false;
                }
            }, limitMessage: chalk.red(INITIATESCRIPT.ERRORCODE.INVALID_INPUT)
        });
        console.log(chalk.green(port))


        //****** Certificate Details *********//
        await saveCertificateDetails();
        
        //****** Database Details *********//   
        await saveDbCredentials();
        
        let serverReq = 'https://';
        process.env.NODE_ENV = serverEnvironments[0]
        process.env.PORT = port
        process.env.UI_PORT = port        
        serverEnvironments[zerolength] === serverEnvironments[zerolength]? IpOrDomain == zerolength? process.env.PROD_APP_URL = serverReq+hostName : process.env.PROD_APP_URL = serverReq+devIpAddress : process.env.PROD_APP_URL = '';

        
        process.env.SECURE_CONNECTION = true;

        let respOfServicesInfo = await askPluginServicesDetails(true);
        if(!respOfServicesInfo){
            console.log(chalk.red(INITIATESCRIPT.ERRORCODE.FAILED_TO_SAVE_SERVICE_DETAIL))
        }
        askPermissionTostartServerWithPm2();
    }else if(envEditOptions[installationType] === envEditOptions[oneLength]){
        console.log(chalk.green(envEditOptions[installationType]));
        await saveDbCredentials();
		
		
		
        askPermissionTostartServerWithPm2();
    }else if(envEditOptions[installationType] === envEditOptions[2]){
        console.log(chalk.green(envEditOptions[installationType]));
        await saveCertificateDetails();
		
        askPermissionTostartServerWithPm2();
    } 
	else if(envEditOptions[installationType] === envEditOptions[3]){
		
		
			try{
			//get the information from the env file about db information.
				dbUsername = process.env.PROD_DB_USERNAME;
				
				//get the decrypted data assuming it is already encrypted if not throw error
				
				if (await isBaseEncrypted(process.env.PROD_DB_PASSWORD))
				{		
					let encryptedString = process.env.PROD_DB_PASSWORD;
					let encryptedData = Buffer.from(encryptedString,INITIATESCRIPT.COMMANMESSAGE.BASE64);
					let decryptedData = dpapi.unprotectData(encryptedData, null,INITIATESCRIPT.COMMANMESSAGE.LOCALMACHINE);
					decryptedData = decryptedData.toString(INITIATESCRIPT.COMMANMESSAGE.UTF);
					dbPassword = decryptedData
				//return {success:true, response: decryptedData}
				}
				
				else{
					dbPassword = process.env.PROD_DB_PASSWORD;
				}
				
				
				//dbPassword = decryptedData;
				
				dbServerName = process.env.PROD_DB_SERVER
				dbServerInstance =  process.env.PROD_DB_INSTANCE
				dbName = process.env.PROD_DB_DATABASE
				dbPort = process.env.PROD_DB_PORT
				dbServerName = process.env.PROD_DB_HOST
				
				console.log(chalk.green(envEditOptions[installationType]));
				await askPluginServicesDetails(false);  
				//askPermissionTostartServerWithPm2();
			
			}
		
			catch(err){
				console.log(err)
			}
		
	}
	
	 else if(envEditOptions[installationType] === envEditOptions[4]){
		 
		try{
			//get the information from the env file about db information.
				dbUsername = process.env.PROD_DB_USERNAME;
				
				//get the decrypted data assuming it is already encrypted if not throw error
				
				if (await isBaseEncrypted(process.env.PROD_DB_PASSWORD))
				{		
					let encryptedString = process.env.PROD_DB_PASSWORD;
					let encryptedData = Buffer.from(encryptedString,INITIATESCRIPT.COMMANMESSAGE.BASE64);
					let decryptedData = dpapi.unprotectData(encryptedData, null,INITIATESCRIPT.COMMANMESSAGE.LOCALMACHINE);
					decryptedData = decryptedData.toString(INITIATESCRIPT.COMMANMESSAGE.UTF);
					dbPassword = decryptedData
				//return {success:true, response: decryptedData}
				}
				
				else{
					dbPassword = process.env.PROD_DB_PASSWORD;
				}
				
				
				//dbPassword = decryptedData;
				
				dbServerName = process.env.PROD_DB_SERVER
				dbServerInstance =  process.env.PROD_DB_INSTANCE
				dbName = process.env.PROD_DB_DATABASE
				dbPort = process.env.PROD_DB_PORT
				dbServerName = process.env.PROD_DB_HOST
		 
			console.log(chalk.green(envEditOptions[installationType]));
		
			let resp = await addNewPluginDeatils();
		
			if(resp === true){
				askPermissionTostartServerWithPm2();
			}
			
	    }
			 
		catch(err){

				console.log(err)
		}	 
	}
}

async function isBaseEncrypted(configPswd){
    if(configPswd){
      var base64Rejex =new RegExp(/^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}==)?$/);  
      var base64Data=configPswd;
      var isBase64Valid = base64Rejex.test(base64Data);
      return isBase64Valid
    }else{
      return false
    }
    
}


async function saveDbCredentials() {
    //****** Database Details *********//   
    console.log(chalk.bold.yellow(INITIATESCRIPT.COMMANMESSAGE.ENTER_DB_CRED));
    dbServerName = readlineSync.question(chalk.gray.underline(INITIATESCRIPT.COMMANMESSAGE.SERVER_NAME) + ' : ', {
        limit: (input)=>{
            if(input.length == ''){
                return false
            }else{
                return true
            }
        },limitMessage: chalk.red(INITIATESCRIPT.COMMANMESSAGE.INVALID_TYPE)
    });
    dbServerInstance = readlineSync.question(chalk.gray.underline(INITIATESCRIPT.COMMANMESSAGE.SERVER_INSTANCE) + ' : ');
    dbName = readlineSync.question(chalk.gray.underline(INITIATESCRIPT.COMMANMESSAGE.DB_NAME) + ' : ', {
        limit: (input)=>{
            if(input.length == ''){
                return false
            }else{
                return true
            }
        },limitMessage: chalk.red(INITIATESCRIPT.COMMANMESSAGE.INVALID_TYPE)
    });
    dbPort = readlineSync.questionInt(chalk.gray.underline(INITIATESCRIPT.COMMANMESSAGE.SERVER_PORT) + ' : ', {
        limit: function(input) {
            if(input>zerolength && input<=65535 && input!=""){
                return true;
            }else{
                return false;
            }
        },limitMessage: chalk.red(INITIATESCRIPT.COMMANMESSAGE.INVALID_TYPE)
    });

    dbUsername = readlineSync.question(chalk.gray.underline(INITIATESCRIPT.COMMANMESSAGE.USERNAME) + ' : ', {
        limit: (input)=>{
            if(input.length == ''){
                return false
            }else{
                return true
            }
        },limitMessage: chalk.red(INITIATESCRIPT.COMMANMESSAGE.INVALID_TYPE)
    });    
    dbPassword = readlineSync.question(chalk.gray.underline(INITIATESCRIPT.COMMANMESSAGE.PASSWORD) + ' : ', {
        limit:(input)=>{
            if(input.length == ''){
                return false
            }else{
                return true
            }
        },
        limitMessage: chalk.red(INITIATESCRIPT.COMMANMESSAGE.INVALID_TYPE),
        hideEchoBack: true,
        mask: '*'
    });

    let testResp = await testDbConnection(dbServerName,dbServerInstance, dbName, dbPort, dbUsername, dbPassword);
    if(testResp){

        //****** Encryption of DB password *********// 
        let encryptPassword = Buffer.from(dbPassword, INITIATESCRIPT.COMMANMESSAGE.UTF);
        encryptPassword = dpapi.protectData(encryptPassword, null, INITIATESCRIPT.COMMANMESSAGE.LOCALMACHINE);
        let encryptedPassword = encryptPassword.toString(INITIATESCRIPT.COMMANMESSAGE.BASE64);

        process.env.PROD_DB_USERNAME = dbUsername
        process.env.PROD_DB_PASSWORD = encryptedPassword
        process.env.PROD_DB_SERVER = dbServerName
        process.env.PROD_DB_INSTANCE = dbServerInstance
        process.env.PROD_DB_DATABASE = dbName
        process.env.PROD_DB_PORT = dbPort
		process.env.PROD_DB_HOST = dbServerName
        console.log(chalk.bold.yellow(INITIATESCRIPT.COMMANMESSAGE.DIVIDER));
        return true
    }else{
        console.log(chalk.bold.red(INITIATESCRIPT.ERRORCODE.DB_DETAILS_INCOORECT));
        return await saveDbCredentials();
    }

}


async function saveCertificateDetails(){
    console.log(chalk.bold.yellow(INITIATESCRIPT.COMMANMESSAGE.ENTER_CERT_DETAILS));
    console.log(chalk.white.bold.bgYellow(INITIATESCRIPT.COMMANMESSAGE.KEEP_CERT_KEY_FILE));
    certificateName = readlineSync.question(chalk.gray.underline(INITIATESCRIPT.COMMANMESSAGE.CERTIFICATE_NAME) + ' : ', {limit: /^[a-zA-Z0-9!@#\$%\^\&*\)\(+=._-]+(.cert|.CERT|.crt|.CRT|.pem|.PEM)$/i,limitMessage: 'Sorry, $<lastInput> is not Certificate File, Accepts only ".crt" or ".cert" or ".pem" file.'});
    keyName = readlineSync.question(chalk.gray.underline(INITIATESCRIPT.COMMANMESSAGE.KEY_NAME) + ' : ', {limit: /^[a-zA-Z0-9!@#\$%\^\&*\)\(+=._-]+(.key|.KEY|.pem|.PEM)$/i,limitMessage: 'Sorry, $<lastInput> is not Key File, Accepts only ".pem" or ".key" file.'});
    let isPasswordAvailable = readlineSync.keyInYNStrict(chalk.yellow(INITIATESCRIPT.COMMANMESSAGE.KEY_FILE_SECURE_WITH_PASS));
    if(isPasswordAvailable){
        passPhraseKey = readlineSync.question(chalk.gray.underline(INITIATESCRIPT.COMMANMESSAGE.KEY_FILE_PASS) + ' : ', {
            hideEchoBack: true,
            mask : '*'
        });
    }
    
    process.env.CERT_FILE_NAME = certificateName
    process.env.KEY_FILE_NAME = keyName
    process.env.SECURE_CONNECTION = true;
    if(isPasswordAvailable){
        //****** Encryption Key file password *********// 
        let encryptKeyfilePassword = Buffer.from(passPhraseKey,INITIATESCRIPT.COMMANMESSAGE.UTF);
        encryptKeyfilePassword = dpapi.protectData(encryptKeyfilePassword, null, INITIATESCRIPT.COMMANMESSAGE.LOCALMACHINE);
        encryptKeyfilePassword = encryptKeyfilePassword.toString(INITIATESCRIPT.COMMANMESSAGE.BASE64);
        process.env.PASSPHRASE_FOR_PRIVATE_KEY = encryptKeyfilePassword
    }else{
        process.env.PASSPHRASE_FOR_PRIVATE_KEY = ''
    }
    console.log(chalk.bold.yellow(INITIATESCRIPT.COMMANMESSAGE.DIVIDER));
    return true
}

async function saveUpdatedInfoInEnv(){
    let envConfig = dotenv.parsed;
    let fileContent='';
    for (let key in envConfig) {
         envConfig[key] = process.env[key];
        fileContent=fileContent+key +"="+envConfig[key] +"\n";
    }
    const data = fs.writeFileSync('.env', fileContent);
    console.log(chalk.green(INITIATESCRIPT.COMMANMESSAGE.SUCCESSFULLY_UPDATED_ENV))

    return true;
}

async function askPermissionTostartServerWithPm2(){
    isServerRunningWithPm2(async(value)=>{
        if((value && value.success == true) && (value && value.found == true)){
            let reStartServerWithNewChanges = readlineSync.keyInYNStrict(chalk.yellow(INITIATESCRIPT.COMMANMESSAGE.WANT_RESTART_SERVER+process.env.PM2_APP_NAME+INITIATESCRIPT.COMMANMESSAGE.WITH_NEW_CHANGES));
            if(reStartServerWithNewChanges){
                await saveUpdatedInfoInEnv();
                restartServerWithpm2(process.env.PM2_APP_NAME)
            }else{
                console.log(chalk.green(INITIATESCRIPT.COMMANMESSAGE.DISCARD_MODIFICATION))
            }
        }else if((value && value.success == false)){

        }else{
            await saveUpdatedInfoInEnv();
     
        }
    })
}

async function isServerRunningWithPm2(callback){
    let found = false
    pm2.connect(async function(err) {
            if (err) {
                console.log(chalk.red(INITIATESCRIPT.ERRORCODE.FAILED_TO_CONNECT_PM2));
                pm2.disconnect()
                callback({success:false, found:found}) 
            }
            pm2.list((err, applist)=>{

                if(applist && applist.length>zerolength){
                    for(var i=zerolength; i<applist.length; i++){
                        if(applist[i].name == process.env.PM2_APP_NAME){
                            found = true
                        }
        
                        if(applist.length-1 == i && found == false){
                            found = false
                        }
                    }
        
                }
                pm2.disconnect()
                callback({success:true, found:found}) 
            })
    })

}

/* async function startServerWithPm2(pm2AppName) {
    pm2.connect(async function(err) {
        if (err) {
            console.log(chalk.red("Failed to connect to pm2"));
            callback({success:false, found:found}) 
        }
        pm2.start({
            script: './bin/www',
            name: pm2AppName,
            instances: 2,
            execMode: 'cluster',
            autorestart: true,
            watch: false,
            node_args: "--max-old-space-size=4096",
            max_memory_restart: "1G",
        }, (err, apps) => {
            console.log(chalk.green(process.env.APP_NAME + " server started successfully with the name '"+pm2AppName+"' in pm2"))
            pm2.disconnect()
            if (err) { 
                console.log(chalk.red("Failed to start server, please use manual command to start server 'pm2 start "+pm2AppName+"'"))
            }
        })
    })

} */

async function restartServerWithpm2(pm2AppName){
    pm2.connect(async function(err) {
        if (err) {
            console.log(chalk.red(INITIATESCRIPT.ERRORCODE.FAILED_TO_CONNECT_PM2));
            pm2.disconnect();
            callback({success:false, found:found}) 
        }
        pm2.restart(pm2AppName, (error, sucss)=>{
            if(error){
                console.log(chalk.red(INITIATESCRIPT.ERRORCODE.FAILED_TO_RESTART_SERVER+pm2AppName+"'"))
            }else{
                console.log(chalk.green(process.env.APP_NAME+INITIATESCRIPT.COMMANMESSAGE.SERVER_RESATRTED_SUCCESSFULLY))
            }
            pm2.disconnect();
        })
    })

}

async function stopServerWithpm2(pm2AppName){
    pm2.connect(async function(err) {
        if (err) {
            console.log(chalk.red(INITIATESCRIPT.ERRORCODE.FAILED_TO_CONNECT_PM2));
            pm2.disconnect();
            callback({success:false, found:found}) 
        }
        pm2.delete(pm2AppName, (error, sucss)=>{
            if(error){
                console.log(chalk.red(INITIATESCRIPT.ERRORCODE.FAILED_TO_STOP_SERVER+pm2AppName+"'"))
            }else{
                console.log(chalk.green(process.env.APP_NAME+INITIATESCRIPT.COMMANMESSAGE.SERVER_STOPPED_SUCCESSFULLY+pm2AppName+INITIATESCRIPT.COMMANMESSAGE.IN_PM2))
            }
            pm2.disconnect();
        })
    })

}


isServerRunningWithPm2(async(value)=>{
    if((value && value.success == true) && (value && value.found == true)){
        console.log(chalk.green(process.env.APP_NAME+INITIATESCRIPT.COMMANMESSAGE.ALREADY_RUNNING_WITH_NAME+process.env.PM2_APP_NAME+INITIATESCRIPT.COMMANMESSAGE.IN_PM2));
        let permissionOptions = [INITIATESCRIPT.COMMANMESSAGE.CONTNUE_TO_DO_MODIFICATION, INITIATESCRIPT.COMMANMESSAGE.RESTART_SERVER, INITIATESCRIPT.COMMANMESSAGE.STOP_SERVER]
        let askPermissionToContinue = readlineSync.keyInSelect(permissionOptions, chalk.yellow(INITIATESCRIPT.COMMANMESSAGE.DO_YOU_WANT),{limitMessage:chalk.red(INITIATESCRIPT.COMMANMESSAGE.INVALID_TYPE), cancel: INITIATESCRIPT.COMMANMESSAGE.EXIT});
        if(askPermissionToContinue == negativeOneLength){

        }else if(permissionOptions[askPermissionToContinue] == permissionOptions[zerolength]){
            startEnvScript();
        }else if(permissionOptions[askPermissionToContinue] == permissionOptions[1]){
            restartServerWithpm2(process.env.PM2_APP_NAME);
        }else if(permissionOptions[askPermissionToContinue] == permissionOptions[2]){
            stopServerWithpm2(process.env.PM2_APP_NAME)
        }
    }else{
        startEnvScript();
    }
})


async function testDbConnection(dbServerName,dbServerInstance, dbName, dbPort, dbUsername, dbPassword){
    let options=  {
        host: dbServerName,
        dialect: 'mssql',
        port : dbPort,
        logging: false,
        dialectOptions:{
            options: {
                instanceName: dbServerInstance != '' ? dbServerInstance : '',
                encrypt: true,
            }
        }
       
    }
    try {
        let sequelize = new Sequelize(dbName, dbUsername, dbPassword, options);
        await sequelize.authenticate();
        let closed = await sequelize.close()
        return true
      } catch (error) {
		console.log(error)  
        return false
      }
}


async function askPluginServicesDetails(isFreshInstallation){
	
	let plugins = await getPluginsInfoFromDb();
	
    console.log(chalk.bold.yellow(INITIATESCRIPT.COMMANMESSAGE.PROVIDE+process.env.APP_NAME+INITIATESCRIPT.COMMANMESSAGE.PLUGIN_SERVICE_DETAIL));
    console.log(chalk.bold.yellow(INITIATESCRIPT.COMMANMESSAGE.INCORRECT_DETAILS_FAIL_SERVER+process.env.APP_NAME+' server'));
	
	
	if(plugins != false){
        if(plugins.length != zerolength) {
            let pluginNames = []
            plugins.forEach(plugin => {
                console.log(chalk.green(plugin.name+INITIATESCRIPT.COMMANMESSAGE.POINTED_BASE_URL+plugin.baseUrl+INITIATESCRIPT.COMMANMESSAGE.PORT_NUMBER+plugin.serverPort))
                pluginNames.push(plugin.name)
            });
            // pluginNames.splice(pluginNames.length-1, 0, "Modify All");
            let respModifyPluginDetails = readlineSync.keyInYNStrict(chalk.yellow(INITIATESCRIPT.COMMANMESSAGE.MODIFY_DB_DETAILS));
            if(respModifyPluginDetails && isFreshInstallation){
                let pluginsCount = pluginNames.length;
                while (pluginsCount--) {
                    let count = pluginNames.length-1 - pluginsCount
                    // let selectedPluginName = pluginNames[count]
                    let selectedPlugin = plugins.filter(plugin=> plugin.name === pluginNames[count]) 
                    let resp = await askPlugindetails(selectedPlugin[zerolength]);
                    if(resp == false){
                        break;
                    }
                }
            }else if(respModifyPluginDetails){
                let selectPlugin = readlineSync.keyInSelect(pluginNames, chalk.yellow(INITIATESCRIPT.COMMANMESSAGE.SELECT_PLUGIN_TO_MODIFY),{limitMessage:chalk.red(INITIATESCRIPT.COMMANMESSAGE.INVALID_TYPE), cancel: INITIATESCRIPT.COMMANMESSAGE.EXIT});
                let selectedPlugin = plugins.filter(plugin=> plugin.name === pluginNames[selectPlugin])            
                if(selectPlugin == negativeOneLength){
                    console.log(chalk.green("Bye.."))
                }else{
                    let resp = await askPlugindetails(selectedPlugin[zerolength]);
                    return resp;
                }
            }else{
             
                return true
            }     

        }else{
            console.log(chalk.red(INITIATESCRIPT.ERRORCODE.RUN_DB_INSTALLATION_SCRIPT_CORRECTLY))
            return true
        }
    }else{
        console.log(chalk.red(INITIATESCRIPT.ERRORCODE.FAILED_CONNECT_TO_DB))
        return true
    }  
	
	return true;
}


async function askPlugindetails(plugin){
    let pluginHostName, pluginIpAddress, pluginPort
    let authorizeIpOrDomain = readlineSync.question(chalk.yellow(INITIATESCRIPT.COMMANMESSAGE.ENTER+plugin.name+INITIATESCRIPT.COMMANMESSAGE.ENTER_IP_HOSTNAME), {
        limit: (input)=> {
            if (input >= zerolength && input <= oneLength && input != "") {
                return true;
            }
            else {
                return false;
            }
        }, limitMessage: chalk.red(INITIATESCRIPT.COMMANMESSAGE.INVALID_TYPE)
    });
    // console.log(chalk.green(IpOrDomainOptions[IpOrDomain]))
    if (authorizeIpOrDomain == zerolength) {
        pluginHostName = readlineSync.question(chalk.yellow(INITIATESCRIPT.COMMANMESSAGE.ENTER+plugin.name+INITIATESCRIPT.COMMANMESSAGE.HOSTNAME),{
            limit: (input)=> {
                if (input != "") {
                    return true;
                }
                else {
                    return false;
                }
            }, limitMessage: chalk.red(INITIATESCRIPT.COMMANMESSAGE.INVALID_TYPE)
        });
        console.log(chalk.green(pluginHostName))
    } else if (authorizeIpOrDomain == oneLength) {
        pluginIpAddress = readlineSync.question(chalk.yellow(INITIATESCRIPT.COMMANMESSAGE.ENTER+plugin.name+INITIATESCRIPT.COMMANMESSAGE.IP_ADDRESS), {
            limit: function (input) {
                return require('net').isIP(input); // Valid IP Address
            },
            limitMessage: chalk.red(INITIATESCRIPT.ERRORCODE.INVALID_IP_ADD)
        });
        console.log(chalk.green(pluginIpAddress))
    }
    pluginPort = readlineSync.question(chalk.yellow(INITIATESCRIPT.COMMANMESSAGE.ENTER+plugin.name+' port? '), {
        limit: function(input) {
            if(input>zerolength && input<=65535 && input!=""){
                return true;
            }else{
                return false;
            }
        }, limitMessage: chalk.red(INITIATESCRIPT.ERRORCODE.INVALID_INPUT__ENTER_CORRECT)
    });
    console.log(chalk.green(pluginPort))

    let pluginHostOrIp = pluginHostName? 'https://'+pluginHostName : 'https://'+pluginIpAddress;
    let updtResp = await updateServicesInfoInPluginTable(pluginHostOrIp, pluginPort, plugin.id);
	
	console.log(updtResp);
    return updtResp;
}


//add plugin info in the table
async function addNewPluginDeatils(){
    let plugins = await getPluginsInfoFromDb();
    
    console.log(chalk.bold.yellow(INITIATESCRIPT.COMMANMESSAGE.PROVIDE+process.env.APP_NAME+INITIATESCRIPT.COMMANMESSAGE.PLUGIN_SERVICE_DETAIL));
    console.log(chalk.bold.yellow(INITIATESCRIPT.ERRORCODE.INCORRECT_DETAILS_MAY_FAIL+process.env.APP_NAME+' server'));
    if(plugins != false){
        if(plugins.length != zerolength) {
            let pluginNames = []
            plugins.forEach(plugin => {
                console.log(chalk.green(plugin.name+INITIATESCRIPT.COMMANMESSAGE.POINTED_BASE_URL+plugin.baseUrl+INITIATESCRIPT.COMMANMESSAGE.PORT_NUMBER+plugin.serverPort))
                pluginNames.push(plugin.name)
            });

            let respModifyPluginDetails = readlineSync.keyInYNStrict(chalk.yellow(INITIATESCRIPT.COMMANMESSAGE.ADD_NEW_PLUGIN));
            if(respModifyPluginDetails){
                let resp = await askPlugindetailsToAddInDb()
                return resp;
            }else{
                return true
            }     

        }else{
            console.log(chalk.red(INITIATESCRIPT.ERRORCODE.NO_PLUGIN_FOUND_IN_TABLE))
            return true
        }
    }else{
        console.log(chalk.red(INITIATESCRIPT.ERRORCODE.FAILED_CONNECT_TO_DB))
        return true
    }  
}


async function askPlugindetailsToAddInDb(){
    let pluginName, pluginHostName, pluginIpAddress, pluginPort, pluginPrependUrl, pluginUniqueName
    pluginName = readlineSync.question(chalk.yellow(INITIATESCRIPT.COMMANMESSAGE.ENTER_NEW_PLUGIN_NAME),{
        limit: (input)=> {
            if (input != "") {
                return true;
            }
            else {
                return false;
            }
        }, limitMessage: chalk.red(INITIATESCRIPT.COMMANMESSAGE.INVALID_TYPE)
    });
    console.log(chalk.green(pluginName))
    let authorizeIpOrDomain = readlineSync.question(chalk.yellow(INITIATESCRIPT.COMMANMESSAGE.ENTER+pluginName+INITIATESCRIPT.COMMANMESSAGE.ENTER_IP_HOSTNAME), {
        limit: (input)=> {
            if (input >= zerolength && input <= oneLength && input != "") {
                return true;
            }
            else {
                return false;
            }
        }, limitMessage: chalk.red(INITIATESCRIPT.COMMANMESSAGE.INVALID_TYPE)
    });
    // console.log(chalk.green(IpOrDomainOptions[IpOrDomain]))
    if (authorizeIpOrDomain == zerolength) {
        pluginHostName = readlineSync.question(chalk.yellow(INITIATESCRIPT.COMMANMESSAGE.ENTER+pluginName+INITIATESCRIPT.COMMANMESSAGE.HOSTNAME+': '),{
            limit: (input)=> {
                if (input != "") {
                    return true;
                }
                else {
                    return false;
                }
            }, limitMessage: chalk.red(INITIATESCRIPT.COMMANMESSAGE.INVALID_TYPE)
        });
        console.log(chalk.green(pluginHostName))
    } else if (authorizeIpOrDomain == oneLength) {
        pluginIpAddress = readlineSync.question(chalk.yellow(INITIATESCRIPT.COMMANMESSAGE.ENTER+pluginName+INITIATESCRIPT.COMMANMESSAGE.IP_ADDRESS), {
            limit: function (input) {
                return require('net').isIP(input); // Valid IP Address
            },
            limitMessage: chalk.red(INITIATESCRIPT.ERRORCODE.INVALID_IP)
        });
        console.log(chalk.green(pluginIpAddress))
    }
    pluginPort = readlineSync.question(chalk.yellow(INITIATESCRIPT.COMMANMESSAGE.ENTER+pluginName+' port? '), {
        limit: function(input) {
            if(input>zerolength && input<=65535 && input!=""){
                return true;
            }else{
                return false;
            }
        }, limitMessage: chalk.red(INITIATESCRIPT.ERRORCODE.INVALID_INPUT_ENTER_VALID_RANGE)
    });
    console.log(chalk.green(pluginPort))
    pluginPrependUrl = readlineSync.question(chalk.yellow(INITIATESCRIPT.COMMANMESSAGE.ENTER+pluginName+INITIATESCRIPT.COMMANMESSAGE.PREPEND_URL_EG),{
        limit: (input)=> {
            if (input != "") {
                return true;
            }
            else {
                return false;
            }
        }, limitMessage: chalk.red(INITIATESCRIPT.COMMANMESSAGE.INVALID_TYPE)
    });
    console.log(chalk.green(pluginPrependUrl))
	
	/*pluginUniqueName = readlineSync.question(chalk.yellow('Enter '+pluginName+' Unique Name: (Optional Leave blank if not known)'),{
            limit: (input)=> {
                if (input != "") {
                    return true;
                }
                else {
                    return false;
                }
            }, limitMessage: chalk.red("Invalid Input")
    });*/
	
	pluginUniqueName = readlineSync.question(chalk.yellow(INITIATESCRIPT.COMMANMESSAGE.ENTER+pluginName+INITIATESCRIPT.COMMANMESSAGE.OPTIONAL_UNIQUE_NAME) + ' : ');
    console.log(chalk.green(pluginUniqueName))

    let pluginHostOrIp = pluginHostName? 'https://'+pluginHostName : 'https://'+pluginIpAddress;
    console.log(chalk.green(pluginHostOrIp +':'+pluginPort+pluginPrependUrl + INITIATESCRIPT.COMMANMESSAGE.IS_THE_URL_FOR+pluginName + ' plugin'))
    let respModifyPluginDetails = readlineSync.keyInYNStrict(chalk.yellow(pluginHostOrIp+pluginPrependUrl + INITIATESCRIPT.COMMANMESSAGE.IS_THE_URL_FOR+pluginName +INITIATESCRIPT.COMMANMESSAGE.TO_CONTINUE_CANCEL));
    if(respModifyPluginDetails){
        let addedResp = await addServicesInfoInPortalTable(pluginName, pluginHostOrIp, parseInt(pluginPort), pluginPrependUrl,pluginUniqueName);
        if(addedResp === true){
            console.log(chalk.green(pluginName + INITIATESCRIPT.COMMANMESSAGE.PLUGIN_DETAILS_ADDED_SUCCESSFULLY))
        }else{
            console.log(chalk.red(pluginName + INITIATESCRIPT.ERRORCODE.PLUGIN_DETAIL_FAILED))
        }        
        return addedResp
    }else{
        return false
    }
}



async function getPluginsInfoFromDb(){
	
    let options=  {
        host: dbServerName,
        dialect: 'mssql',
        port : dbPort,
        logging: false,
        dialectOptions:{
            options: {
                instanceName: dbServerInstance != '' ? dbServerInstance : '',
                encrypt: true,
            }
        }
       
    }
    try {
        // let sequelize = new Sequelize('Enterprise_0.1', 'sa', 'Icumed$12', options);
        let sequelize = new Sequelize(dbName, dbUsername, dbPassword, options);
        let [results, metadata] = await sequelize.query(`SELECT * FROM tbl_portal_applications`)
        //console.log('results:',results);
        sequelize.close();
        return results;
    } catch (error) {
        return false
    }
}


async function updateServicesInfoInPluginTable(pluginHostName, pluginPort, pluginId){
    let options=  {
        host: dbServerName,
        dialect: 'mssql',
        port : dbPort,
        logging: false,
        dialectOptions:{
            options: {
                instanceName: dbServerInstance != '' ? dbServerInstance : '',
                encrypt: true,
            }
        }
       
    }
    try {
		
        let sequelize = new Sequelize(dbName, dbUsername, dbPassword, options);		
		let [results, metadata] = await sequelize.query(`UPDATE tbl_portal_applications SET serverPort = ${pluginPort}, baseUrl='${pluginHostName}' WHERE id = (${pluginId})`);		
        sequelize.close();
        return true;
      } catch (error) {
		console.log(error);  
        return false;
    }
}

async function addServicesInfoInPortalTable(pluginName, pluginHostOrIp, pluginPort, pluginPrependUrl,pluginUniqueName){
	
    let options=  {
        host: dbServerName,
        dialect: 'mssql',
        port : dbPort,
        logging: false,
        dialectOptions:{
            options: {
                instanceName: dbServerInstance != '' ? dbServerInstance : '',
                encrypt: true,
            }
        }
       
    }

    try {
        let sequelize = new Sequelize(dbName, dbUsername, dbPassword, options);
        let [results, metadata] = await sequelize.query(`INSERT INTO tbl_portal_applications (name, serverPort, prependUrl, baseUrl,createdAt, updatedAt,uniqueName) VALUES (N'${pluginName}', ${pluginPort}, N'${pluginPrependUrl}', N'${pluginHostOrIp}','${moment().format()}','${moment().format()}',N'${pluginUniqueName}' )`)
        sequelize.close()
        return true
      } catch (error) {
        return false
    }
}

async function readAppVersion(){
    try{
        let fileContent= fs.readFileSync( "portal.properties", 'utf8');
        let version= convert.xml2json(fileContent,{compact: true, spaces: 4});
        return JSON.parse(version).Properties.Version._text;
    }
    catch(error){
        return null;
    }  
}


