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
* File Name: 02_LifeShield_Portal_Script.sql
*
* DESCRIPTION
* This code contains the table creation for enterprise portal.
*
* ========================================================================================
*/

USE [$(DataBaseName)]
GO

IF EXISTS (SELECT * FROM [$(DataBaseName)].INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = N'tbl_portal_version') BEGIN 
	drop table tbl_portal_version
END

IF EXISTS (SELECT * FROM [$(DataBaseName)].INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = N'tbl_portal_customers') BEGIN 
	drop table tbl_portal_customers
END

IF EXISTS (SELECT * FROM [$(DataBaseName)].INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = N'tbl_portal_nodes') BEGIN 
	drop table tbl_portal_nodes
END

IF EXISTS (SELECT * FROM [$(DataBaseName)].INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = N'tbl_portal_plugins') BEGIN 
	drop table tbl_portal_plugins
END

IF EXISTS (SELECT * FROM [$(DataBaseName)].INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = N'tbl_portal_products') BEGIN 
	drop table tbl_portal_products
END

IF EXISTS (SELECT * FROM [$(DataBaseName)].INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = N'tbl_portal_registration') BEGIN 
	drop table tbl_portal_registration
END

IF EXISTS (SELECT * FROM [$(DataBaseName)].INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = N'tbl_portal_sessionlogs') BEGIN 
	drop table tbl_portal_sessionlogs
END

IF EXISTS (SELECT * FROM [$(DataBaseName)].INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = N'tbl_portal_sessions') BEGIN 
	drop table tbl_portal_sessions
END

IF EXISTS (SELECT * FROM [$(DataBaseName)].INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = N'tbl_portal_applications') BEGIN 
	drop table tbl_portal_applications
END

	
CREATE TABLE [dbo].[tbl_portal_version](
		[Uid] [uniqueidentifier] NOT NULL,
		[AppName] [varchar](255) NULL,
		[Version] [varchar](255) NULL,
	PRIMARY KEY CLUSTERED 
	(
		[Uid] ASC
	)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
	) ON [PRIMARY]
GO

ALTER TABLE [dbo].[tbl_portal_version] ADD  DEFAULT (newid()) FOR [Uid]
	GO
	INSERT INTO [dbo].[tbl_portal_version]
			([Uid]
			,[AppName]
			,[Version])
		VALUES
			(NEWID(),
			'LifeShield'+  char(153) +' ICU Medical Portal',
			'$(BuildVersion)')
	GO

	SELECT * FROM [dbo].[tbl_portal_version]
	GO

/****** Object:  Table [dbo].[tbl_portal_customers]    Script Date: 11/18/2020 12:36:58 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[tbl_portal_customers](
	[CustomerID] [nvarchar](255) NULL,
	[NodeID] [int] IDENTITY(1,1) NOT NULL,
	[NodeName] [nvarchar](255) NULL,
	[EmailID] [nvarchar](255) NULL,
	[Telephone] [nvarchar](255) NULL,
	[DomainName] [nvarchar](255) NULL,
	[BillingId] [nvarchar](255) NULL,
	[CertificatePath] [nvarchar](255) NULL,
	[CertificateValidity] [nvarchar](255) NULL,
	[isCA] [nvarchar](255) NULL,
	[CertificateName] [nvarchar](255) NULL,
	[CreatedAt] [datetimeoffset](7) NULL,
	[LastUpdated] [datetimeoffset](7) NULL,
	[LastCommunicated] [nvarchar](255) NULL,
PRIMARY KEY CLUSTERED 
(
	[NodeID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO

	/****** Object:  Table [dbo].[tbl_portal_nodes]    Script Date: 11/18/2020 12:36:58 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[tbl_portal_nodes](
	[Uid] [nvarchar](255) NOT NULL,
	[NodeID] [int] NULL,
	[NodeName] [nvarchar](255) NULL,
	[NodeShortName] [nvarchar](255) NULL,
	[ParentID] [int] NULL,
	[RootID] [nvarchar](255) NULL,
	[NodeType] [nvarchar](255) NULL,
	[TypeOf] [nvarchar](255) NULL,
	[NodeInfo] [nvarchar](4000) NULL,
	[CreatedDate] [datetimeoffset](7) NULL,
	[LastModifiedDate] [datetimeoffset](7) NULL,
	[TypeName] [nvarchar](255) NULL,
	[IconUrl] [nvarchar](max) NULL,
PRIMARY KEY CLUSTERED 
(
	[Uid] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO

	
/****** Object:  Table [dbo].[tbl_portal_plugins]    Script Date: 11/18/2020 12:36:58 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[tbl_portal_plugins](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[Uid] [nvarchar](255) NOT NULL,
	[Name] [nvarchar](255) NOT NULL,
	[UniqueName] [nvarchar](255) NOT NULL,
	[Version] [nvarchar](255) NOT NULL,
	[Description] [nvarchar](255) NULL,
	[UiPort] [nvarchar](255) NOT NULL,
	[BaseUrl] [nvarchar](255) NOT NULL,
	[Type] [nvarchar](255) NOT NULL,
	[Instances] [nvarchar](255) NULL,
	[ServerPort] [nvarchar](255) NOT NULL,
	[PrependUrl] [nvarchar](255) NOT NULL,
	[IconUrl] [nvarchar](max) NULL,
	[UiUrls] [nvarchar](max) NULL,
	[ServerUrls] [nvarchar](max) NULL,
	[IsRegistered] [bit] NOT NULL,
	[ServicesEnabled] [bit] NOT NULL,
	[IsLicenced] [bit] NULL,
	[IsActive] [bit] NOT NULL,
	[CreatedDate] [datetimeoffset](7) NULL,
	[LastModifiedDate] [datetimeoffset](7) NULL,
PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO

/****** Object:  Table [dbo].[tbl_portal_products]    Script Date: 11/18/2020 12:36:58 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[tbl_portal_products](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[ProductUid] [nvarchar](255) NULL,
	[ProductName] [nvarchar](255) NULL,
	[Version] [nvarchar](255) NULL,
	[Description] [nvarchar](255) NULL,
	[FeatureList] [nvarchar](max) NULL,
	[DateCreated] [nvarchar](255) NULL,
	[DateUpdated] [nvarchar](255) NULL,
PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO

/****** Object:  Table [dbo].[tbl_portal_registration]    Script Date: 11/18/2020 12:36:58 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[tbl_portal_registration](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[ApplicationId] [nvarchar](max) NOT NULL,
	[ApplicationName] [nvarchar](max) NOT NULL,
	[ApplicationVersion] [nvarchar](255) NOT NULL,
	[ApplicationGuid] [nvarchar](255) NOT NULL,
	[ApplicationSecret] [nvarchar](max) NOT NULL,
	[CreatedDate] [datetimeoffset](7) NULL,
	[LastModifiedDate] [datetimeoffset](7) NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO



/****** Object:  Table [dbo].[tbl_portal_sessionlogs]    Script Date: 11/18/2020 12:36:58 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[tbl_portal_sessionlogs](
	[sid] [nvarchar](255) NOT NULL,
	[userName] [nvarchar](255) NOT NULL,
	[expires] [datetimeoffset](7) NOT NULL,
	[createdAt] [datetimeoffset](7) NOT NULL,
	[updatedAt] [datetimeoffset](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[sid] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO

/****** Object:  Table [dbo].[tbl_portal_sessions]    Script Date: 11/18/2020 12:36:58 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[tbl_portal_sessions](
	[sid] [nvarchar](255) NOT NULL,
	[userName] [nvarchar](255) NULL,
	[accessToken] [nvarchar](max) NULL,
	[refreshToken] [nvarchar](max) NULL,
	[privileges] [nvarchar](max) NULL,
	[tokenTimeOutInterval] [nvarchar](max) NULL,
	[tokenRefreshedAt] [datetimeoffset](7) NULL,
	[expires] [datetimeoffset](7) NULL,
	[data] [nvarchar](max) NULL,
	[pluginPrivileges] [nvarchar](max) NULL,
	[createdAt] [datetimeoffset](7) NOT NULL,
	[updatedAt] [datetimeoffset](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[sid] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO





/****** Object:  Table [dbo].[tbl_portal_applications]    Script Date: 9/8/2020 12:29:10 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[tbl_portal_applications](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[name] [nvarchar](255) NOT NULL,
	[serverPort] [int] NOT NULL,
	[prependUrl] [nvarchar](255) NOT NULL,
	[baseUrl] [nvarchar](255) NOT NULL,
	[iconUrl] [nvarchar](max) NULL,
	[createdAt] [datetimeoffset](7) NOT NULL,
	[updatedAt] [datetimeoffset](7) NOT NULL,
	[uniqueName] [nvarchar](255) NULL,
	[type] [nvarchar](255) NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO


INSERT [dbo].[tbl_portal_applications] ([name], [serverPort], [prependUrl], [baseUrl], [iconUrl], [createdAt], [updatedAt], [uniqueName], [type]) VALUES (N'Lifeshield Authorize', 8441, N'/api/v1', N'http://localhost', NULL, CAST(getdate()AS DateTimeOffset) , CAST(getdate()AS DateTimeOffset), N'LIFESHIELD_AUTHORIZE', N'default')
INSERT [dbo].[tbl_portal_applications] ([name], [serverPort], [prependUrl], [baseUrl], [iconUrl], [createdAt], [updatedAt], [uniqueName], [type]) VALUES (N'LifeShield Licensure', 8442, N'/lifeshield_licensure/api', N'http://localhost', NULL, CAST(getdate()AS DateTimeOffset), CAST(getdate()AS DateTimeOffset), N'LIFESHIELD_LICENSURE', NULL)
INSERT [dbo].[tbl_portal_applications] ([name], [serverPort], [prependUrl], [baseUrl], [iconUrl], [createdAt], [updatedAt], [uniqueName], [type]) VALUES (N'LifeShield Notify', 8443, N'/lifeshield_notify/api', N'http://localhost', NULL, CAST(getdate()AS DateTimeOffset), CAST(getdate()AS DateTimeOffset), N'LIFESHIELD_NOTIFY', NULL)

GO




