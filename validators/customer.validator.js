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
* File Name: customer.validator.js
*
* DESCRIPTION
* This code contains validation for Add/Edit Customer and get token.
*
* ========================================================================================
*/

/* Declare required npm packages */

var schema = require('validate');
var STATUS= require('../utils/status-codes-messages.utils');
let customerIdFormat=/^[0-9a-fA-F]{8}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{12}/
let domainNameFormat=/^[a-zA-Z0-9]+([\-\.]{1}-?[a-zA-Z0-9]+)*\.[a-zA-Z0-9]{1,}$/
let nodeNameFormat= /^[_A-z0-9]*((-|\s)*[ ]*[_A-z0-9])*$/
let mailIdFormat= /^[a-zA-Z0-9+_.-]+@[a-zA-Z0-9-]+.[a-zA-Z-]+$/

/* Add Customer  Authentication Schema */
const addCustomerRequest = new schema({

    formData: {
        CustomerID: {
            match: customerIdFormat,
            required: true,
            message: {
                match:  STATUS.COMMON_MSGS.CUSTOMER_SCHEMA_NOT_MATCH,
                required: STATUS.COMMON_MSGS.CUSTOMER_ID_REQUIRE
            }
        },
        DomainName: {
            required: true,
            match: domainNameFormat,
            message: {
                match: STATUS.COMMON_MSGS.DOMAIN_SCHEMA_NOT_MATCH,
                required: STATUS.COMMON_MSGS.DOMAIN_NAME_REQUIRED
            }
        },
        NodeName: {
            type: String,
            required: true,
            match: nodeNameFormat,
            message: {
                match: STATUS.COMMON_MSGS.NODE_NAME_SCHEMA_NOT_MATCH,
                type: STATUS.COMMON_MSGS.NODE_NAME_TYPE_NOT_CORRECT,
                required: STATUS.COMMON_MSGS.NODE_NAME_REQUIRE
            }
        },
        EmailID: {
            match: mailIdFormat,
            required: true,
            message: {
                match: STATUS.COMMON_MSGS.EMAIL_SCHEMA_NOT_MATCH,
                required: STATUS.COMMON_MSGS.EMAIL_IS_REQUIRED
            }

        },
        BillingId: {
            required: false,

        },
        CertificatePath: {
            required: false,

        },
        isCA: {
            required: false,

        },
        CertificateValidity: {
            required: false,

        }, CertificateName: {
            required: false,

        },
        Telephone: {
            number: {
                required: true,
                message: {
                    required: STATUS.COMMON_MSGS.TELEPHONE_IS_REQUIRED
                },
    
            },
            internationalNumber: {
                required: true,
                message: {
                    required: STATUS.COMMON_MSGS.INTERNATIONAL_NO_REQUIRED
                },
    
            },   nationalNumber: {
                required: true,
                message: {
                    required: STATUS.COMMON_MSGS.NATIONAL_NO_REQUIRED
                },
    
            },   e164Number: {
                required: true,
                message: {
                    required: STATUS.COMMON_MSGS.E164_REQUIRED
                },
    
            },   countryCode: {
                required: true,
                message: {
                    required: STATUS.COMMON_MSGS.COUNTRY_CODE_REQUIRED
                },
    
            },   dialCode: {
                required: true,
                message: {
                    required: STATUS.COMMON_MSGS.DIALCODE_REQUIRED
                },
    
            },

        }
    }
}
);

/*  GetToken  Schema */
/* Add Customer  Authentication Schema */
const getTokenRequest = new schema({
    CustomerId: {
        // type:UUIDV1,    
        match: customerIdFormat,
        required: true,
        message: {
            match: STATUS.COMMON_MSGS.CUSTOMER_SCHEMA_NOT_MATCH,
            required:  STATUS.COMMON_MSGS.CUSTOMER_ID_REQUIRE
        }
    },

}

);


module.exports = {
    AddCustomerRequest: addCustomerRequest,
    GetTokenRequest: getTokenRequest,
};