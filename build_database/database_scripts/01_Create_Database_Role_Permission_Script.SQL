		/**
		** ================================================================================================
		**                                Copyright (C) ICU Medical, Inc.
		**                                      All rights reserved
		** ================================================================================================
		** Notice:  All Rights Reserved.
		** This material contains the trade secrets and confidential information of ICU Medical, Inc., which
		** embody substantial creative effort, ideas and expressions. No part of this material may be
		** reproduced or transmitted in any form or by any means, electronic, mechanical, optical or
		** otherwise, including photocopying and recording, or in connection with any information storage
		** or retrieval system, without written permission from:
		** 
		** ICU Medical, Inc.
		** 13520 Evening Creek Dr., Suite 200
		** San Diego, CA 92128
		** www.icumed.com
		**
		** ================================================================================================
		** The below scripts is create the LifeShield Enterprise Manager Database and cre
		** ================================================================================================
		** 15-DEC-2020   WARNING PLEASE READ:	All statements must be separated by "go" with no spaces before or after
		   This scripts is to create the new login and new user with  db_owner permission in the Enterprise database. 
		   If the objects is not exists it will create the database, Login and User
		**/

		SET NOCOUNT ON 
		SET Quoted_Identifier on
		
		USE [MASTER]	-- To create the database 
		GO
		IF PATINDEX('%[!@#$%^&*"()+=<>,?/]%','$(DataBaseNameQuote)')>0
		RAISERROR('Invalid Characters in Database Name, %s',16,1,'$(DataBaseNameQuote)')
		ELSE
		BEGIN
		IF PATINDEX('%[!@#$%^&*"()+=<>,?/]%','$(DBUserName)')>0
		RAISERROR('Invalid Characters in User Name, %s',16,1,'$(DBUserName)')
		ELSE
		BEGIN		
		IF NOT EXISTS (SELECT 1 FROM sys.databases WHERE name = N'$(DataBaseNameQuote)')
		CREATE DATABASE [$(DataBaseName)]
		ELSE
		PRINT ' DataBaseName Already Exists [$(DataBaseNameQuote)]'
		END
		END
		GO

		
		USE [$(DataBaseName)]-- To create the user name and pwd 
		GO
		IF (SUSER_ID('$(UserName)') IS NULL) 
		BEGIN 
			CREATE LOGIN [$(UserName)] WITH PASSWORD= '$(UserPwd)', CHECK_EXPIRATION = OFF, CHECK_POLICY = OFF, DEFAULT_DATABASE= master, DEFAULT_LANGUAGE=[us_english]
			PRINT 'Login Created Successfully Name [$(DBUserName)]'
		END;
		ELSE
		BEGIN
			PRINT 'Login  Name   [$(DBUserName)] Already Exists'
		END
		Go

	

		USE [$(DataBaseName)]-- To create the user in the database 
		GO
		IF NOT EXISTS(SELECT 1 FROM SYS.SYSUSERS WHERE NAME=N'$(DBUserName)')
		BEGIN
		CREATE USER [$(UserName)] FOR LOGIN [$(UserName)]	
		PRINT ' UserName [$(DBUserName)] Created Successfully in the [$(DataBaseName)] '
		END
		ELSE
		BEGIN
		PRINT 'User Name [$(DBUserName)] Already Exists'
		END
		GO
		
				
		USE [$(DataBaseName)]-- To create the role in the database
		GO
		IF (IS_ROLEMEMBER (N'lifeshield_admin') is null)
		BEGIN
		CREATE ROLE [LifeShield_Admin] AUTHORIZATION [dbo] 
		PRINT '  [LifeShield_Admin]  Role Created Successfully in [$(DataBaseName)] '
		END
		ELSE
		BEGIN
		PRINT '  [LifeShield_Admin]   Role Already Exists in [$(DataBaseName)] '
		END
		USE [$(DataBaseName)]-- To mapping the  user to the database db_owner permission
		GO
		IF NOT EXISTS (
		SELECT 1 role_principal_name
		FROM sys.database_role_members rm 
		JOIN sys.database_principals r 	ON rm.role_principal_id = r.principal_id
		JOIN sys.database_principals m 	ON rm.member_principal_id = m.principal_id
			where lower( m.name ) = lower(N'$(DBUserName)')
			and r.name ='db_owner' )
		Begin 
		EXECUTE sp_AddRoleMember N'db_owner', [LifeShield_Admin];
		PRINT '   DB_OWNER Role Created Successfully for  [LifeShield_Admin]   in [$(DataBaseName)]'
		END
		ELSE
		BEGIN
		PRINT '   DB_OWNER Role Already Exists for  [LifeShield_Admin]   in [$(DataBaseName)]'
		END
		GO
		
		USE [$(DataBaseName)]-- To mapping the user to the database cutomized role
		GO
		IF NOT EXISTS ( SELECT 1  AS member_principal_name
		FROM sys.database_role_members rm 
		JOIN sys.database_principals m 
		ON rm.member_principal_id = m.principal_id
		where lower( m.name ) = lower(N'$(DBUserName)'))
		Begin
		EXECUTE sp_AddRoleMember  [LifeShield_Admin],  [$(UserName)] ;
		PRINT '  [LifeShield_Admin]  Role  Member Added Successfully for the [$(DBUserName)]  in  [$(DataBaseName)] '
		END
		ELSE
		BEGIN
		PRINT '  [LifeShield_Admin]  Role  Member Already Exists for the [$(DBUserName)]  in  [$(DataBaseName)] '
		END
		GO