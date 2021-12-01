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
* File Name:initiateScriptMessage_statusCodes.utils.js
*
* DESCRIPTION
* This code contains the status code and message of initiate script
*
* ========================================================================================
*/

let INITIATE_SCRIPT_ERROR_CODES = {
    NOT_ABLE_TO_READ_PORTAL_PROP:"Not able to read Portal Properties file. Please check.",
    INVALID_IP:"Invalid Ip Address",
    INVALID_INPUT:"Invalid input, please enter a valid integer number",
    FAILED_TO_SAVE_SERVICE_DETAIL:"Failed to save the services details, Please try to update again with Fresh installtion option",
    DB_DETAILS_INCOORECT:'Dabatabase details are incorrect, Please enter correct details',
    FAILED_TO_CONNECT_PM2:"Failed to connect to pm2",
    FAILED_TO_RESTART_SERVER:"Failed to restart server, please use manual command to restart server 'pm2 restart ",
    FAILED_TO_STOP_SERVER:"Failed to stop server, please use manual command to stop server 'pm2 stop ",
    RUN_DB_INSTALLATION_SCRIPT_CORRECTLY:"No plugins found in the configs table, please run the databse installation scripts correctly",
    FAILED_CONNECT_TO_DB:"Failed to connect to database try with fresh installation option",
    INVALID_IP_ADD:"Invalid Ip Address",
    INVALID_INPUT__ENTER_CORRECT:"Invalid input, please enter a valid integer number",
    INCORRECT_DETAILS_MAY_FAIL:'Incorrect details may fail to start ',
    NO_PLUGIN_FOUND_IN_TABLE:"No plugins found in the configs table, please run the databse installation scripts correctly",
    FAILED_TO_CONNECT_TO_DB:"Failed to connect to database try with fresh installation option",
    INVALID_INPUT_ENTER_VALID_RANGE:"Invalid input, please enter a valid integer number",
    PLUGIN_DETAIL_FAILED:' plugin details failed to add'

}
let INITIATE_SCRIPT_MESSAGE={
    SELECT_INSTALLATION_TYPE:"Select Installation type ",
    INVALID_TYPE:"Invalid input",
    EXIT:"Exit",
    BYE:"Bye...",
    SERVER_START_IN:'Start server in ',
    ENTER_HOSTNAME_IP:'Do you want to Enter Hostname [0] or IP Address [1]? ',
    ENTER_HOST_NAME:'Enter Host Name?',
    ENTER_IP:'Enter IP Address(eg: 127.0.0.1): ',
    PORT_RUN_THE_SERVER:'Which port do you want to run server? ',
    LOCALMACHINE:"LocalMachine",
    BASE64:"base64",
    UTF:'utf-8',
    ENTER_DB_CRED:'/****** Enter Database credentials ********/',
    SERVER_NAME:'Server Name'    ,
    SERVER_INSTANCE:' Server Instance     ',
    DB_NAME:' Database Name   ',
    SERVER_PORT:' Server port   ',
    USERNAME:' User Name       ',
    PASSWORD:' Password        ',
    DIVIDER:'/***********************************************/',
    ENTER_CERT_DETAILS:'/****** Enter certificate details ********/',
    KEEP_CERT_KEY_FILE:"Keep Certificate File and Key File in the 'server-certificates' folder",
    CERTIFICATE_NAME:' Certificate Name             ',
    KEY_NAME:' Key Name                     ',
    KEY_FILE_SECURE_WITH_PASS:'Is Key file secured with password?',
    KEY_FILE_PASS:' Key file Password  ',
    SUCCESSFULLY_UPDATED_ENV:"************* Successfully updated '.env' file properties **************" ,
    WANT_RESTART_SERVER:'Are you want to restart server ',
    WITH_NEW_CHANGES:' with new changes?',
    DISCARD_MODIFICATION:"Discarded modifications",
    SERVER_RESATRTED_SUCCESSFULLY:" server restarted successfully with the name 'LifeShield_Enterprise_Manager' in pm2",
    SERVER_STOPPED_SUCCESSFULLY:" server stoped successfully with the name ",
    ALREADY_RUNNING_WITH_NAME:" already running with the name ",
    CONTNUE_TO_DO_MODIFICATION:'Continue to do modifications',
    RESTART_SERVER:'Restart server',
    STOP_SERVER:'Stop server',
    DO_YOU_WANT:'Do you want to ',
    PLUGIN_SERVICE_DETAIL:'  plugin services details ********/' ,
    PROVIDE:'/****** Provide ',
    INCORRECT_DETAILS_FAIL_SERVER:'Incorrect details may fail to start ',
    POINTED_BASE_URL:" was pointed to base url- ",
    PORT_NUMBER:" port number -",
    MODIFY_DB_DETAILS:'Do you want to modify any of the plugin details?',
    SELECT_PLUGIN_TO_MODIFY:'Select a plugin to modify ',
    ENTER_IP_HOSTNAME:" Hostname/IpAddress (Hostname [0] or IP Address [1])",
    ENTER:'Enter ',
    HOSTNAME:' Host Name',
    IP_ADDRESS:' IP Address(eg: 127.0.0.1): ',
    ADD_NEW_PLUGIN:'Do you want to add new plugin details?',
    ENTER_NEW_PLUGIN_NAME:'Enter New Plugin Name: ',
    PREPEND_URL_EG:'  prepend url (eg:-"https://localhost/api/v1/urlName" in this "/api/v1" is the prependUrl): ',
    OPTIONAL_UNIQUE_NAME:' Unique Name: (Optional Leave blank if not known)',
    TO_CONTINUE_CANCEL:'? (To continue[Y], To Cancel[N])',
    IS_THE_URL_FOR:' is the url for ',
    PLUGIN_DETAILS_ADDED_SUCCESSFULLY:' plugin details added successfully',
    POINTED_TO_BASEURL:" was pointed to base url- ",
    IN_PM2:" in pm2",
    
}

module.exports = {
    ERRORCODE:INITIATE_SCRIPT_ERROR_CODES,
    COMMANMESSAGE  : INITIATE_SCRIPT_MESSAGE ,
   
}