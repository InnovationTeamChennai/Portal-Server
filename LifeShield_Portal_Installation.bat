::
:: =============================================================================================================================================================
::                                Copyright (C) ICU Medical, Inc.
::                                      All rights reserved
:: =============================================================================================================================================================
:: Notice:  All Rights Reserved.
:: This material contains the trade secrets and confidential information of ICU Medical, Inc., which
:: embody substantial creative effort, ideas and expressions. No part of this material may be
:: reproduced or transmitted in any form or by any means, electronic, mechanical, optical or
:: otherwise, including photocopying and recording, or in connection with any information storage
:: or retrieval system, without written permission from:
:: 
:: ICU Medical, Inc.
:: 13520 Evening Creek Dr., Suite 200
:: San Diego, CA 92128
:: www.icumed.com
::
:: =============================================================================================================================================================
:: The below batch scripts is used to create the LifeShield Enterprise Portal Database and Login
:: =============================================================================================================================================================
:: KARTHIK MUTHUKUMARAN  15-DEC-2020   
:: This scripts is to create the Portal Database with new login and new user with  db_owner permission based SQL Server Database Admin username and password
:: =============================================================================================================================================================
::
::


@echo off
cls

                                                                                    
echo ------------------------------------------------------------------------------------------
echo  ***************** SQL Server Database Server and Admin Details  Starts ******************
echo ------------------------------------------------------------------------------------------

setlocal enabledelayedexpansion

:Servername
color 03
set /p "servername=Enter Database Servername :"
if "%servername%"=="" (
echo "Server Name cannot be blank"
Goto :Servername
 )
GOTO :PortNo
:PortNo
set /p "port=Enter Database Port No    :" 
if "%port%"=="" (
echo " Port No cannot be blank"
Goto :PortNo
 )
Goto :PortNoLength1
:PortNoLength1
if not "!port:~5!" == "" ( Goto OnErrorMaxSize )
Goto :PortNoValidation



:PortNoValidation
SET /A Evaluated=%port%	
if %Evaluated% EQU %port% (    
    IF %port% GTR 0 ( GOTO :PortNoLength )    
) ELSE ( GOTO :OnErrorMaxSize )


:PortNoLength
set MYSTRING=%port%
(echo "%MYSTRING%" & echo.) | findstr /O . | more +1 | (set /P RESULT= & call exit /B %%RESULT%%)
set /A STRLENGTH=%ERRORLEVEL%-5
IF %STRLENGTH% LEQ 5( GOTO :PortMaxSize )
GOTO :OnErrorMaxSize



:PortMaxSize
set MYSTRING=%port%
IF  %MYSTRING% GEQ 65535( GOTO :OnErrorMaxSize )
GOTO :DBUserName 


:DBUserName
set /p "dbusername=Enter Database UserName   :"
if "%dbusername%"=="" (
echo "DataBase UserName cannot be blank"
Goto :DBUserName
 )
GOTO :DBPassword 


:DBPassword
powershell -Command $pword = read-host "Enter Database Password   " -AsSecureString ; ^
    $BSTR=[System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($pword) ; ^
        [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR) > .tmp.txt 
set /p dbpassword=<.tmp.txt & del .tmp.txt
Goto :DBScript

:DBScript 
if "%dbpassword%"==""  (
echo "DataBase Password cannot be blank"
Goto :DBPassword
)
Goto :DBScriptValidation


:DBScriptValidation
set  spath=%CD%\build_database\database_validation_script
set  lpath=%CD%\build_database\Logs
set tcp=%servername%,%port%

echo  ------------------------------------------------------------------------------------------
echo  *********************** DataBase Credentials Validating Starts ***************************
echo  ------------------------------------------------------------------------------------------

set hr=%time:~0,2%
if "%hr:~0,1%" equ " " set hr=0%hr:~1,1%
set logfilepath= %lpath%\output_%date:~-4,4%%date:~-10,2%%date:~-7,2%_%hr%%time:~3,2%%time:~6,2%.log
set cmd='dir %spath%\Enterprise_Database_Validation_Script.sql /b/s'
FOR /f %%G IN (%cmd%) DO (
echo ******PROCESSING %%G FILE******
SQLCMD -S%tcp% -U "!dbusername!" -P "!dbpassword!"  -b -i%%G >> %logfilepath%
IF !ERRORLEVEL! NEQ 0 GOTO :OnError
)
GOTO :EnterpriseECHO 
)
:EnterpriseECHO 
echo  ------------------------------------------------------------------------------------------
echo  *********************** DataBase Credentials Validated Succesfully ***********************
echo  ------------------------------------------------------------------------------------------
 
echo  ------------------------------------------------------------------------------------------
echo  **************** SQL Server Database Server and Admin Details  Ends **********************
echo  ------------------------------------------------------------------------------------------
 
echo  ------------------------------------------------------------------------------------------
echo  ********** LifeShield Enterprise Portal New Database Server and Admin Details  Starts ***********
echo  ------------------------------------------------------------------------------------------
GOTO EnterpriseDBName

:EnterpriseDBName
:: The user's password has been stored in the variable %user_password%
set edbname=master
set /p "dbname=Enter LifeShield Enterprise Portal Database Name     :"
if "!dbname!"=="" (
echo "LifeShield Enterprise Portal Database Name  Cannot be blank"
Goto :EnterpriseDBName
 )
 Goto :EnterpriseDBUserName


:EnterpriseDBUserName
set /p "eusername=Enter LifeShield Database UserName :"
set  lsdbusernamewithquote=!eusername!
set  lsdbusernamewithoutquote=!eusername!
set  lsdbusernamewithoutquote=!lsdbusernamewithoutquote:'=''!
if !eusername!=="" (
echo "LifeShield Enterprise Portal Database UserName Cannot be blank"
Goto :EnterpriseDBUserName
 )
GOTO :EnterpriseDBPassword 

:EnterpriseDBPassword
powershell -Command $pword = read-host "Enter Enterprise Portal Database Password   " -AsSecureString ; ^
    $BSTR=[System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($pword) ; ^
        [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR) > .tmp.txt 
set /p epassword=<.tmp.txt ::& del .tmp.txt
Goto :EnterpriseDBValidation




:EnterpriseDBValidation
if "!epassword!"==""  (
echo "LifeShield Enterprise Portal Database Password Cannot be blank"
Goto :EnterpriseDBPassword
)
Goto :EnterpriseScripts


:EnterpriseScripts
set  dbnamewithoutquote=!dbname!
set  dbnamewithoutquote=!dbnamewithoutquote:'=''!
set  lsepasswordwithoutquote=!epassword!
set  lsepasswordwithoutquote=!lsepasswordwithoutquote:'=''!
echo  ------------------------------------------------------------------------------------------
echo  ********** LifeShield Enterprise Portal New Database Server and Admin Details  Ends *************
echo  ------------------------------------------------------------------------------------------
set  sdpath=%CD%\build_database\database_scripts
set  lpath=%CD%\build_database\logs
set tcp=%servername%,%port%

echo  ------------------------------------------------------------------------------------------
echo  *********************** ALL the Scripts Starts deploying  ********************************
echo  ------------------------------------------------------------------------------------------

set /p Version=<dbversion.txt

set hr=%time:~0,2%
if "%hr:~0,1%" equ " " set hr=0%hr:~1,1%
set logfilepath= %lpath%\output_%date:~-4,4%%date:~-10,2%%date:~-7,2%_%hr%%time:~3,2%%time:~6,2%.log
set cmd='dir %sdpath%\*.sql /b/s'
FOR /f %%G IN (%cmd%) DO (
echo ******PROCESSING %%G FILE****** >> %logfilepath%
SQLCMD -S%tcp%  -d %edbname% -U "!dbusername!" -P "!dbpassword!"   -v  DataBaseName="!dbname!" DataBaseNameQuote="!dbnamewithoutquote!" DBUserName="!lsdbusernamewithoutquote!" UserName="!lsdbusernamewithquote!" UserPwd="!lsepasswordwithoutquote!" BuildVersion="%Version%" -b -i%%G >> %logfilepath%
IF !ERRORLEVEL! NEQ 0 GOTO :OnError
)
GOTO :Success



:OnErrorPort
ECHO "Port Number Cannot be string " %port%
GOTO :PortNo

:OnErrorLength
ECHO "Port Number %port% Cannot be more than 5 number"
GOTO :PortNo


:OnErrorMaxSize
ECHO "Port Number %port% is invalid it could be between 0 - 65535"
GOTO :PortNo


:OnErrorPassword
ECHO "Password cannot be blank"
GOTO :DBPassword

 
:OnError
 
echo ERROR ERROR ERROR
echo One\more script(s) failed to execute, terminating bath.
type %logfilepath%
echo Check output.log file for more details
EXIT /b

:SuccessDB

echo  ------------------------------------------------------------------------------------------
echo  ******************  !!Database Creditinals Validated Succesfully!! ***********************
echo  ------------------------------------------------------------------------------------------
 
type %logfilepath%
 
echo -------------------------------------------------------------------------------------------
EXIT /b
 
:Success
 
echo  ------------------------------------------------------------------------------------------
echo  ****************** !!ALL the scripts deployed successfully!!  ****************************
echo  ------------------------------------------------------------------------------------------
 
type %logfilepath%

echo -------------------------------------------------------------------------------------------
EXIT /b