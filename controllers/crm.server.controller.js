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
* File Name: crm.server.controller.js
*
* DESCRIPTION
* This code contains Customer hierarchy nodes creation, updation, deletion and post hierarchy and send hierarchy
*
* ========================================================================================
*/
//db connection usig sequelize
const db = require("../database");
const Customer = db.customers;
const Nodes = db.nodes;
const Product = db.products;
var fs = require('fs');
const crypto = require('crypto');
var rfs = require('rotating-file-stream');
var path = require('path')
const Op = require("sequelize").Op;
var logger = require('../utils/winston.utils').PortalLogs
const { base64encode, base64decode } = require('nodejs-base64');
const { Certificate } = require('@fidm/x509')
var jwt = require('jsonwebtoken');
var secretKey = "Aweqa2r3dadf434d1!3131w@232%";
var commonUtils = require('../utils/common.utils');
var ISASctrl = require('./isas.server.controller');
var licenseManagerAppKey = "LicenseManagerApplication";
var fetch = require('node-fetch');
const { response, request } = require("express");
var STATUS = require('../utils/status-codes-messages.utils');
const { Logger } = require("../utils/winston.utils");
var { getDetectedPluginConfigFiles } = require('./plugins-config-detect.controller')

/* Declare Validators */
var customerValidate = require('../validators/customer.validator');

var AppConfig = require('../config/app-config');
var certificateDirectory = path.join(__dirname, '../Certificate')
fs.existsSync(certificateDirectory) || fs.mkdirSync(certificateDirectory)


async function certificateValidate(req, res, next) {


  logger.info(STATUS.EC_LOGS.MSG.IN_CERTIFICATE_VALIDATE_API_MSG);
  req.body.formData = req.body.formData.substr(req.body.formData.indexOf(',') + 1);


  let cert = JSON.stringify(req.body);

  let decodeCertificate = base64decode(JSON.parse(cert).formData);

  const certificateData = Certificate.fromPEM(decodeCertificate);

  if (certificateData.isCA == false || certificateData.validTo == null) {

    logger.error(STATUS.EC_LOGS.MSG.IN_CERTIFICATE_VALIDATE_API_MSG, '', STATUS.API_SCHEMA_ERROR_CODES.ERROR_FAILED_CERTIFICATE_VALIDATION);

    res.status(STATUS.COMMON_MSGS.HTTP_ERR_CODE).send({ status: STATUS.COMMON_MSGS.HTTP_ERR_CODE, message: STATUS.API_SCHEMA_ERROR_CODES.ERROR_CERTIFICATE_NOT_VALID })
  } else {
    let CertificateData = {
      validTo: certificateData.validTo,
      isCA: certificateData.isCA,
      CertificateName: certificateData.issuer.attributes[0].value,
      CertificatePath: decodeCertificate
    }

    logger.info(STATUS.EC_LOGS.MSG.CERTIFICATE_VALIDATED_SUCCESSFULLY_MSG);
    res.status(STATUS.SUCCESS[2]).send({ status: STATUS.COMMON_MSGS.HTTP_ERR_CODE, message: STATUS.EC_LOGS.MSG.CERTIFICATE_VALIDATED_SUCCESSFULLY_MSG, Data: CertificateData });
  }
};


// STATUS.SUCCESS[2]     STATUS.SUCCESS[2]


async function CustomerDetails(req, res, next) {
  if (req.body.formData) {
    if (req.body.formData.CustomerID) {
      if (req.body.formData.CustomerID != '' && req.body.formData.DomainName != '' && req.body.formData.NodeName != '' && req.body.formData.EmailID != '' && req.body.formData.Telephone != '') {

        const result = customerValidate.AddCustomerRequest.validate(req.body);
        if (result != '') {
          let errorMessage = result.toString();
          res.status(STATUS.COMMON_MSGS.HTTP_ERR_CODE).send({ status: STATUS.COMMON_MSGS.HTTP_ERR_CODE, Message: errorMessage });
        } else {


          logger.info(STATUS.EC_LOGS.MSG.ADD_CUSTOMER_API_MSG);


          var fileCertificatePath;

          if (req.body.formData.CertificatePath) {

            var accessCertificateStrean = rfs.createStream(req.body.formData.CustomerID + '.cer', {
              path: certificateDirectory,
              maxFiles: 30,
            })



            fs.writeFile(accessCertificateStrean.filename, req.body.formData.CertificatePath, (err) => {
              if (err) {

                logger.error(STATUS.EC_LOGS.MSG.ADD_CUSTOMER_API_MSG, '', STATUS.API_SCHEMA_ERROR_CODES.ERROR_IN_CERTIFICATE_FILE, '' + err);

                res.status(STATUS.COMMON_MSGS.HTTP_ERR_CODE).send({ status: STATUS.COMMON_MSGS.HTTP_ERR_CODE, message: STATUS.EC_LOGS.MSG.ADD_CUSTOMER_API_MSG + '' + STATUS.API_SCHEMA_ERROR_CODES.ERROR_IN_CERTIFICATE_FILE });
              }

              fileCertificatePath = accessCertificateStrean.filename;
            })
          } else {
            fileCertificatePath = '';
          }



          Customer.findOne({ where: { [Op.or]: [{ CustomerID: req.body.formData.CustomerID.trim() }, { NodeName: req.body.formData.NodeName.trim() }, { DomainName: req.body.formData.DomainName.trim() }] } }).then(function (Result) {

            if (Result != null) {
              res.status(STATUS.COMMON_MSGS.HTTP_ERR_CODE).send({ status: STATUS.COMMON_MSGS.HTTP_ERR_CODE, Message: STATUS.API_SCHEMA_ERROR_CODES.ERROR_CUSTOMER_SAME_DETAILS_EXISTS });

            } else {

              Customer.create(
                {
                  CustomerID: req.body.formData.CustomerID, NodeName: req.body.formData.NodeName, DomainName: req.body.formData.DomainName, EmailID: req.body.formData.EmailID, BillingId: req.body.formData.BillingId, Telephone: JSON.stringify(req.body.formData.Telephone),
                  CertificatePath: fileCertificatePath, CertificateValidity: req.body.formData.CertificateValidity, isCA: req.body.formData.isCA, CertificateName: req.body.formData.CertificateName, CreatedAt: new Date(Date.now()),


                }).then((result, err) => {
                  if (result) {

                    logger.info(STATUS.EC_LOGS.MSG.CUSTOMER_DETAILE_SAVE_SUCCESSFULLY_MSG);

                    res.status(STATUS.SUCCESS[2]).send({ status: STATUS.SUCCESS[2], message: STATUS.EC_LOGS.MSG.CUSTOMER_DETAILE_SAVE_SUCCESSFULLY_MSG });
                  }
                  else {

                    logger.error(STATUS.API_SCHEMA_ERROR_CODES.ERROR_FAILED_TO_STORE_CUSTOMER + err);

                    res.status(STATUS.COMMON_MSGS.HTTP_ERR_CODE).send({ status: STATUS.COMMON_MSGS.HTTP_ERR_CODE, message: STATUS.API_SCHEMA_ERROR_CODES.ERROR_FAILED_TO_STORE_CUSTOMER + STATUS.ERROR.INTERNAL_SW[1] });
                  }
                })
                .catch(err => {

                  res.status(STATUS.COMMON_MSGS.HTTP_ERR_CODE).send({ error: err });
                });
            }
          })
        }
      }
      else {

        res.status(STATUS.COMMON_MSGS.HTTP_ERR_CODE).send({ status: STATUS.COMMON_MSGS.HTTP_ERR_CODE, Message: STATUS.API_SCHEMA_ERROR.HRCHY_UPDT_NODE_API_REQURD_PARAMS_NTFOUND[1] });
      }

    } else {
      res.status(STATUS.COMMON_MSGS.HTTP_ERR_CODE).send({ status: STATUS.COMMON_MSGS.HTTP_ERR_CODE, Message: STATUS.EC_LOGS.MSG.ADD_CUSTOMER_API_MSG + STATUS.API_SCHEMA_ERROR_CODES.ERROR_CUSTID_NOT_FOUND });
    }
  } else {
    res.send({ status: STATUS.COMMON_MSGS.HTTP_ERR_CODE, Message: STATUS.API_SCHEMA_ERROR.HRCHY_CREATE_NODE_API_BODY_NTFOUND[1] });
  }
}

async function getFileData(req, res) {


  logger.info(STATUS.EC_LOGS.MSG.IN_GET_FILE_DATA_MSG);

  Customer.findAll({
    where: { CustomerID: req.params.CustomerId }
  }).then((result, err) => {
    if (result) {
      logger.info(STATUS.EC_LOGS.MSG.CUSTOMER_DETAILS_FOR_GEN_KEY_MSG);

      let PhoneNo = JSON.parse(result[0].dataValues.Telephone);
      let onlyNo = PhoneNo.number
      removeSpace = onlyNo.replace(/[&\/\\#,+()$~%.'":*?<>{}/ /-]/g, '');
      let FinalPhoneNo = PhoneNo.countryCode + ',' + parseInt(removeSpace);
      const private_key = fs.readFileSync('./keys/private-key.pem', 'utf-8');
      const data = result[0].dataValues.CustomerID + result[0].dataValues.NodeName + result[0].dataValues.EmailID + FinalPhoneNo;
      let sign = crypto.createSign('RSA-SHA256')
      sign.write(data);
      sign.end();
      const signature = sign.sign(private_key, 'base64');
      let fileData = {
        CustomerID: result[0].dataValues.CustomerID,
        NodeName: result[0].dataValues.NodeName,
        Email: result[0].dataValues.EmailID,
        Phone: FinalPhoneNo,
        Signature: signature
      }
      fs.writeFile('./key.json', JSON.stringify(fileData), (err) => {
        if (err) {
          logger.error(STATUS.API_SCHEMA_ERROR_CODES.ERROR_IN_GETTING_FILE + err);
        }

        logger.info(STATUS.EC_LOGS.MSG.FILE_GENERATED_SUCCESSFULLY_MSG);
        const file = path.resolve(__dirname, `.././key.json`);
        const file1 = JSON.parse(fs.readFileSync('key.json'));
        res.download(file)
      });

    }
    else {

      logger.error(STATUS.API_SCHEMA_ERROR_CODES.ERROR_IN_GETTING_FILE);
      res.status(STATUS.COMMON_MSGS.HTTP_ERR_CODE).send({ status: STATUS.COMMON_MSGS.HTTP_ERR_CODE, message: STATUS.EC_LOGS.MSG.IN_GET_FILE_DATA_MSG + STATUS.ERROR.INTERNAL_SW[1] });
    }
  }).catch(err => {


    logger.error(STATUS.API_SCHEMA_ERROR_CODES.ERROR_IN_GET_FILE_DATA);
    res.status(STATUS.COMMON_MSGS.HTTP_ERR_CODE).send({ status: false, message: STATUS.EC_LOGS.MSG.IN_GET_FILE_DATA_MSG + STATUS.API_SCHEMA_ERROR_CODES.ERROR_IN_GET_KEY_FILE_DATA_DB });
  });
}


async function UpdateCustomer(req, res) {
  if (req.body.formData) {

    logger.info(STATUS.EC_LOGS.MSG.IN_UPDATE_CUST_API_MSG)



    const result = customerValidate.AddCustomerRequest.validate(req.body);

    if (result != '') {
      let errorMessage = result.toString();

      res.status(STATUS.COMMON_MSGS.HTTP_ERR_CODE).send({ status: STATUS.COMMON_MSGS.HTTP_ERR_CODE, Message: errorMessage });
    } else {

      if (req.body.formData.CustomerID) {
        var UpdateCustomer = true;
        Customer.findAll({ where: { [Op.or]: [{ NodeName: req.body.formData.NodeName.trim() }, { DomainName: req.body.formData.DomainName.trim() }] } })
          .then(function (CustomerData) {
            var data = JSON.parse(JSON.stringify(CustomerData));
            for (let j = 0; j < data.length; j++) {
              if (data[j].CustomerID == req.body.formData.CustomerID) {


              } else {
                logger.info(STATUS.API_SCHEMA_ERROR_CODES.SAME_CUSTOMER_ALREADY_EXISTS);
                UpdateCustomer = false;
              }
            }
            if (UpdateCustomer == true) {

              if (req.body.formData.CertificatePath) {

                var filepath = certificateDirectory + '\\' + req.body.formData.CustomerID + '.cer';
                fs.writeFile(filepath, req.body.formData.CertificatePath, (err) => {
                  if (err) {
                    logger.error(STATUS.EC_LOGS.MSG.IN_UPDATE_CUST_API_MSG + "FAILED TO WRITE IN FILE  " + err);


                  }

                  logger.info(STATUS.EC_LOGS.MSG.IN_UPDATE_CUST_API_MSG + "SUCCESSFULLY WRITTEN TO THE FILE  ");

                });
              } else {
                logger.info(STATUS.EC_LOGS.MSG.IN_UPDATE_CUST_API_MSG + STATUS.EC_LOGS.MSG.NO_CHANGE_IN_CERT_FILE_MSG);
              }
              Customer.update(
                {
                  NodeName: req.body.formData.NodeName, DomainName: req.body.formData.DomainName, EmailID: req.body.formData.EmailID, BillingId: req.body.formData.BillingId, Telephone: JSON.stringify(req.body.formData.Telephone),
                  CertificatePath: filepath, CertificateValidity: req.body.formData.CertificateValidity, isCA: req.body.formData.isCA, CertificateName: req.body.formData.CertificateName,
                  LastUpdated: new Date(Date.now()),
                },
                {
                  where: {
                    CustomerID: req.body.formData.CustomerID
                  }
                }).then((result) => {

                  logger.info(STATUS.EC_LOGS.MSG.CUST_UPDATE_SUCCESSFULLY_MSG);

                  res.status(STATUS.SUCCESS[2]).send({ status: STATUS.SUCCESS[2], message: STATUS.EC_LOGS.MSG.CUST_UPDATE_SUCCESSFULLY_MSG });
                }).catch(err => {

                  logger.error(STATUS.API_SCHEMA_ERROR_CODES.FAILED_TO__UPDATE_CUSTOMER);

                  res.status(STATUS.COMMON_MSGS.HTTP_ERR_CODE).send({ error: err });
                });
            } else {
              res.status(STATUS.COMMON_MSGS.HTTP_ERR_CODE).send({ status: STATUS.COMMON_MSGS.HTTP_ERR_CODE, Message: STATUS.API_SCHEMA_ERROR_CODES.SAME_CUSTOMER_ALREADY_EXISTS });
            }
          })
      } else {

        res.status(STATUS.COMMON_MSGS.HTTP_ERR_CODE).send({ status: STATUS.COMMON_MSGS.HTTP_ERR_CODE, Message: STATUS.API_SCHEMA_ERROR_CODES.CUST_NOT_AVAILABLE });
      }
    }
  } else {
    res.send({ status: STATUS.COMMON_MSGS.HTTP_ERR_CODE, Message: STATUS.API_SCHEMA_ERROR.HRCHY_CREATE_NODE_API_BODY_NTFOUND[1] });
  }
}


async function postHierarchy(req, res, next) {
  var date = new Date(Date.now());
  var lastCommunicatedDate = date.toDateString();
  var updateTime = date.toLocaleTimeString('en-US', { hour12: true });

  logger.info(STATUS.EC_LOGS.MSG.IN_POST_HIERARCHY_MSG)
  let result = [];
  var promises = [];
  if (req.body.length > 0) {

    let treeData = req.body[0];
    if (req.body[0].Uid != "") {
      let customerId = req.body[0].Uid;

      if (req.headers.accesstoken) {

        try {
          var decoded = jwt.verify(req.headers.accesstoken, secretKey);



          if (decoded.Uid === customerId) {
            Customer.findOne({ where: { CustomerID: customerId } }).then(function (customers) {
              if (customers === null) {
                res.status(STATUS.COMMON_MSGS.HTTP_ERR_CODE).send({ error: STATUS.API_SCHEMA_ERROR_CODES.CUST_NOT_AVAILABLE });
              }

              else {
                Customer.update(
                  {
                    LastCommunicated: lastCommunicatedDate + ' Time ' + updateTime
                  },
                  {
                    where:
                      { CustomerId: customerId }
                  }).then((result) => {
                    logger.info(STATUS.EC_LOGS.MSG.LAST_COMMUNICATED_UPDATED_MSG);
                  }).catch(err => {
                    logger.error(STATUS.COMMON_MSGS.FAILED_TO_UPDATE_LASTCOMMUNICATED);
                  });

                result = flattenTree(JSON.parse(JSON.stringify(treeData)), result, customers.CustomerID);
                Nodes.findAll({ where: { RootID: customerId } }).then(function (nodes) {

                  var nodeEntries = JSON.parse(JSON.stringify(nodes));
                  var entriesTobeDeleted = findEntriesToDelete(result, nodeEntries);
                  var entriesToBeAdded = findEntriesToInsert(result, nodeEntries);
                  var entriesToBeUpdated = findEntriestoUpdate(result, nodeEntries);

                  entriesTobeDeleted.forEach((res) => {
                    promises.push(
                      Nodes.destroy({ where: { Uid: res.Uid } })
                        .then(function () {

                        })
                    );
                  })

                  entriesToBeAdded.forEach((res) => {
                    promises.push(
                      Nodes.create(res)
                        .then(function () {

                        })
                    )

                  });


                  entriesToBeUpdated.forEach((res) => {
                    let nodeValue = getNodeValues(res, customerId);
                    promises.push(
                      Nodes.update(nodeValue, {
                        where: {
                          Uid: res.Uid
                        }
                      })
                        .then(function () {

                        })
                    )

                  });

                })



                Promise.all(promises).then(() => {
                  res.send(result);
                })
                  .catch((err) => {
                    logger.error(err);
                  });

              }


            });
          } else {
            res.send(STATUS.API_SCHEMA_ERROR_CODES.HIERARCHY_DATA_NOT_CORRECT);
          }


        }

        catch {
          res.send({ error: STATUS.API_SCHEMA_ERROR_CODES.ERROR_TOKEN_EXPIRE });
        }

      } else {
        res.send({ errCode: STATUS.API_SCHEMA_ERROR_CODES.TKN_NOT_FOUND, message: STATUS.COMMON_MSGS.EC_TOKEN_NTFOUND_STATUS_MSG });
      }
    } else {
      res.send({ status: STATUS.COMMON_MSGS.HTTP_ERR_CODE, Message: STATUS.API_SCHEMA_ERROR.HRCHY_GET_ELEMENT_API_UID_NTFOUND[1] });
    }


  } else {
    res.send({ status: STATUS.COMMON_MSGS.HTTP_ERR_CODE, Message: STATUS.API_SCHEMA_ERROR.HRCHY_CREATE_NODE_API_BODY_NTFOUND[1] });

  }

}

function findEntriesToDelete(postedArray, databaseArray) {
  var arrayToBeDeleted = [];
  for (var el in databaseArray) {
    if (!doesExist(databaseArray[el], postedArray)) {
      arrayToBeDeleted.push(databaseArray[el]);
    }
  }

  return arrayToBeDeleted;
}

function findEntriesToInsert(postedArray, databaseArray) {
  var arrayToBeInserted = [];

  for (var el in postedArray) {
    if (!doesExist(postedArray[el], databaseArray)) {
      arrayToBeInserted.push(postedArray[el]);
    }
  }

  return arrayToBeInserted;

}

function findEntriestoUpdate(postedArray, databaseArray) {

  var arrayToBeUpdated = [];

  for (var el in postedArray) {
    if (doesExist(postedArray[el], databaseArray)) {
      arrayToBeUpdated.push(postedArray[el]);
    }
  }

  return arrayToBeUpdated;

}

function doesExist(element, arrayOfElements) {
  var doesExist = false;

  for (var el in arrayOfElements) {
    if (element.Uid === arrayOfElements[el].Uid) {
      doesExist = true;
      break;
    }
  }
  return doesExist;
}

async function getCustomerList(req, res) {
  logger.info(STATUS.EC_LOGS.MSG.IN_GET_CUSTOMER_LIST_MSG)


  let data = [];
  let singleCustomer = {};
  var promises = [];

  Customer.findAll()
    .then(function (customers) {

      for (let i = 0; i < customers.length; i++) {
        customers[i].dataValues.Telephone = JSON.parse(customers[i].dataValues.Telephone);
      }

      customers.forEach(customer => {

        promises.push(
          Nodes.findAll({ where: { RootID: customer.CustomerID } })
            .then(function (nodes) {

              singleCustomer = JSON.parse(JSON.stringify(customer));


              data.push(singleCustomer);

              if (nodes.length === 0) {
              }
              else {

                arrayOfNodes = JSON.parse(JSON.stringify(nodes));
                generateTree(singleCustomer, arrayOfNodes, getSubArray(arrayOfNodes, 1));
              }



            })
        );
      })


      Promise.all(promises).then(() =>

        res.send(data)

      );
    });
}

function getSubArray(parentArray, nodeID) {
  let subArray = [];
  for (const el in parentArray) {

    if (parentArray[el].ParentID === nodeID) {
      subArray.push(parentArray[el]);
    }
  }

  return subArray;
}

function generateTree(root, allNodes, childNodes) {

  root.children = [];
  for (value of childNodes) {

    root.children.push(value);
    generateTree(value, allNodes, getSubArray(allNodes, value.NodeID));

  }

  return root;

}

function flattenTree(root, result = [], rootID) {

  if (!root.children.length) {

    let nodeValue = getNodeValues(root, rootID);
    result.push(nodeValue);
  }

  else {
    for (const child of root.children) {
      flattenTree(child, result, rootID);
    }

    let nodeValue = getNodeValues(root, rootID);
    result.push(nodeValue);

  }

  return result;
}

function getNodeValues(root, rootID) {

  let returnNode = {};
  returnNode.Uid = root.Uid;
  returnNode.NodeID = root.NodeID;
  returnNode.NodeName = root.NodeName;
  returnNode.NodeShortName = root.NodeShortName;
  returnNode.ParentID = root.ParentID;
  returnNode.RootID = rootID;
  returnNode.NodeType = root.NodeType;
  returnNode.TypeOf = root.TypeOf;
  returnNode.NodeInfo = root.NodeInfo;
  returnNode.TypeName = root.TypeName;
  returnNode.IconUrl = root.IconUrl;
  returnNode.CreatedDate = root.createdAt;
  returnNode.LastModifiedDate = root.updatedAt;


  return returnNode;
}


async function getCustomerGUID(req, res) {

  const uuidv1 = require('uuid/v1');
  let GUID = uuidv1();
  res.send({ GUID });
}


async function getToken(req, res, next) {

  logger.info(STATUS.EC_LOGS.MSG.IN_GET_TOKEN_MSG)

  if (req.body.CustomerId) {
    const result = customerValidate.GetTokenRequest.validate(req.body);

    if (result != '') {
      let errorMessage = result.toString();
      res.status(STATUS.COMMON_MSGS.HTTP_ERR_CODE).send({ status: STATUS.COMMON_MSGS.HTTP_ERR_CODE, Message: errorMessage });
    } else {

      Customer.findOne({ where: { CustomerID: req.body.CustomerId } }).then(function (customers) {
        if (customers === null) {
          res.status(STATUS.COMMON_MSGS.HTTP_ERR_CODE).send({ "error": STATUS.API_SCHEMA_ERROR_CODES.CUST_NOT_AVAILABLE });
        }

        else {
          var token = jwt.sign({ Uid: req.body.CustomerId }, secretKey, { expiresIn: 60 * 5 });
          res.status(STATUS.SUCCESS[2]).send({ token });
        }

      })
    }
  } else {
    res.status(STATUS.COMMON_MSGS.HTTP_ERR_CODE).send({ Message: STATUS.API_SCHEMA_ERROR_CODES.ERROR_CUSTID_NOT_FOUND });
  }

}


async function getLicensedProducts(req, res, next) {
  logger.info(STATUS.EC_LOGS.MSG.IN_GET_LICENSED_PRODUCT_MSG);
  var date = new Date(Date.now());
  var lastCommunicatedDate = date.toDateString();
  var updateTime = date.toLocaleTimeString('en-US', { hour12: true });
  if (req.headers.accesstoken) {

    try {
      var decoded = jwt.verify(req.headers.accesstoken, secretKey);



      if (decoded.Uid) {

        let checkIfLicenseManagerisAvailable = await checkIfLicenseManagerisActive();

        let data = {};
        data.success = false;
        data.item = [];

        if (checkIfLicenseManagerisAvailable.success === true && checkIfLicenseManagerisAvailable.configDetails) {

          let pluginDetail = checkIfLicenseManagerisAvailable.configDetails;

          let licenseMangerUrl = pluginDetail.baseUrl;
          let licenseManagerPort = pluginDetail.serverPort;
          let licensMangerprependUrl = pluginDetail.prependUrl;

          let accessToken = await generateToken(licenseManagerAppKey);

          let allProducts = await getProductsFromDatabase();



          data.item.ent_key = decoded.Uid;

          let appUrl = licenseMangerUrl + ":" + licenseManagerPort + licensMangerprependUrl + "/entappfeaturemap/"
            + await getQueryString(decoded.Uid);

          let apiSchema = await createApiSchemaToGetFeatureList(appUrl, 'get', null, accessToken.message);

          let fetchResult = await fetchLicenseFeatures(apiSchema);



          if (fetchResult.response.item) {
            let featureList = fetchResult.response.item;



            let updatedFeatureList = [];

            for (let i = 0; i < featureList.length; i++) {
              if (await doesAppExist(featureList[i], allProducts)) {
                updatedFeatureList.push(featureList[i]);
              }
            }

            data.success = true;
            data.item = updatedFeatureList;

            Customer.update(
              {
                LastCommunicated: lastCommunicatedDate + ' Time ' + updateTime
              },
              {
                where:
                  { CustomerId: decoded.Uid }
              }).then((result) => {
                logger.info(STATUS.EC_LOGS.MSG.LAST_COMMUNICATED_UPDATED_MSG);
              }).catch(err => {
                logger.info(STATUS.COMMON_MSGS.FAILED_TO_UPDATE_LASTCOMMUNICATED);
              });
            res.send(data);

          } else {
            res.status(STATUS.COMMON_MSGS.HTTP_ERR_CODE).send({ status: STATUS.COMMON_MSGS.HTTP_ERR_CODE, error: fetchResult });

          }

        }

      }
    }

    catch (error) {
      logger.error(error);
      res.status(STATUS.COMMON_MSGS.HTTP_ERR_CODE).send({ status: STATUS.COMMON_MSGS.HTTP_ERR_CODE, error: STATUS.API_SCHEMA_ERROR_CODES.ERROR_TOKEN_EXPIRE });
    }
  } else {
    res.status(STATUS.COMMON_MSGS.HTTP_ERR_CODE).send({ status: STATUS.COMMON_MSGS.HTTP_ERR_CODE, errCode: STATUS.API_SCHEMA_ERROR_CODES.TKN_NOT_FOUND, "message": STATUS.COMMON_MSGS.EC_TOKEN_NTFOUND_STATUS_MSG });
  }

}

async function doesAppExist(feature, allProducts) {

  let doesExist = false;

  for (let j = 0; j < allProducts.length; j++) {
    if (allProducts[j].ProductUid === feature.app_key) {
      doesExist = true;
      break;
    }
  }
  return doesExist;

}


async function getProductsFromDatabase() {

  return Product.findAll()
    .then(function (products) {

      let data = JSON.parse(JSON.stringify(products));
      for (let j = 0; j < data.length; j++) {
        data[j].FeatureList = JSON.parse(data[j].FeatureList);
      }
      return data;



    });


}

async function getQueryString(enterpriseName) {

  return enterpriseName;

}

async function fetchLicenseFeatures(apiSchema) {
  return fetchApi(apiSchema).then(async responseFromLicensePlugin => {
    if (responseFromLicensePlugin) {
      return { success: true, response: responseFromLicensePlugin }
    } else {
      return { success: false, response: responseFromLicensePlugin }
    }

  }).catch(error => {
    return { success: false, response: error }
  })
}


async function checkIfLicenseManagerisActive() {

  let availablePluginsresponse = await getDetectedPluginConfigFiles();
  if (availablePluginsresponse.success === true) {
    let availablePlugins = availablePluginsresponse.response
    availablePlugins = availablePlugins.acceptedPluginConfigFiles || [];

    if (availablePlugins && availablePlugins.length > 0) {
      for (j = 0; j < availablePlugins.length; j++) {
        if (availablePlugins[j].uniqueName === AppConfig.licenseManagerApp) {
          let data = await getLicenseManagerData(availablePlugins[j]); // new function



          return { success: true, configDetails: data };

          // return pluginStatus;
        }
      }

      return { success: false, configDetails: null };

    }
  } else {
    return { success: false, configDetails: null };
  }

}


async function getLicenseManagerData(data) {
  let configDetails = {};
  configDetails.baseUrl = data.baseUrl;
  configDetails.serverPort = data.serverPort;
  configDetails.prependUrl = data.prependUrl;

  return configDetails;
}



async function createApiSchemaToGetFeatureList(reqApi, reqMethod, requestBody, reqHeaders) {

  let headers = { "Content-Type": 'application/json' };
  if (reqHeaders) {
    headers.accesstoken = reqHeaders;
  }
  let apiSchema;
  if (((reqMethod).toLowerCase() == "put") || (reqMethod).toLowerCase() == "post") {
    requestBody = JSON.stringify(requestBody)
    apiSchema = {
      requestApi: reqApi,
      requestMethod: reqMethod,
      requestHeaders: headers,
      requestBody: requestBody
    }
  } else {
    apiSchema = {
      requestApi: reqApi,
      requestMethod: reqMethod,
      requestHeaders: headers
    }
  }

  return apiSchema;

}


async function fetchApi(apiSchema) {
  let requestApi = apiSchema.requestApi
  let requestMethod = apiSchema.requestMethod
  let requestHeaders = apiSchema.requestHeaders
  let requestBody = apiSchema.requestBody
  let secondParameter = {}
  if (requestBody) {
    secondParameter.method = requestMethod
    secondParameter.headers = requestHeaders
    secondParameter.body = requestBody
  } else {
    secondParameter.method = requestMethod
    secondParameter.headers = requestHeaders
  }

  return new Promise(async (resolve, reject) => {
    if (requestApi && requestMethod && requestHeaders) {
      fetch(requestApi, secondParameter).then(resp => {
        return resp.json()
      }).then((jsonData) => {
        resolve(jsonData)
      }).catch((err) => {
        reject(err)
      });
    } else {
      reject(STATUS.COMMON_MSGS.COMMON_API_FETCH_REJECT_MSG);
    }
  })

}

async function generateToken(key) {
  logger.info(STATUS.EC_LOGS.MSG.IN_GENERATE_TOKEN_MSG)
  try {
    var token = jwt.sign({ key: key }, secretKey, { expiresIn: 60 * 5 });
    return { success: true, message: token };
  }
  catch {
    return { success: false, message: STATUS.API_SCHEMA_ERROR_CODES.ERROR_IN_GENERATING_TOKEN };
  }

}


async function verifyToken(token) {
  return new Promise(function (resolve, reject) {
    jwt.verify(token, secretKey, function (err, decode) {
      if (err) {
        logger.error(STATUS.API_SCHEMA_ERROR_CODES.ERROR_TOKEN_EXPIRE);
        reject({ success: false, response: STATUS.API_SCHEMA_ERROR_CODES.ERROR_TOKEN_EXPIRE })
        return;
      }
      logger.info(STATUS.EC_LOGS.MSG.TOKEN_SUCCESSFULLY_VERIFIED_MSG)
      resolve({ success: true, response: STATUS.EC_LOGS.MSG.TOKEN_SUCCESSFULLY_VERIFIED_MSG })
    })
  }).catch(err => {
    return ({ success: false, response: STATUS.API_SCHEMA_ERROR_CODES.ERROR_TOKEN_EXPIRE })
  })

}


async function validateCustomer(req, res, next) {
  logger.info(STATUS.EC_LOGS.MSG.IN_VALIDATE_CUST_MSG)
  var date = new Date(Date.now());
  var lastCommunicatedDate = date.toDateString();
  var updateTime = date.toLocaleTimeString('en-US', { hour12: true });

  Customer.findAll({
    where: { CustomerId: req.body.CustomerId }
  }).then(function (CustomerData, err) {
    var data = JSON.parse(JSON.stringify(CustomerData));
    if (data.length > 0) {

      Customer.update(
        {
          LastCommunicated: lastCommunicatedDate + ' Time ' + updateTime
        },
        {
          where:
            { CustomerId: req.body.CustomerId }
        }).then((result) => {
          logger.info(STATUS.EC_LOGS.MSG.LAST_COMMUNICATED_UPDATED_MSG);
        }).catch(err => {
          logger.info(STATUS.COMMON_MSGS.FAILED_TO_UPDATE_LASTCOMMUNICATED);
        });

      res.send({ success: true, response: STATUS.EC_LOGS.MSG.CUSTOMER_VALIDATE_SUCCESS_MSG })
    } else {
      res.send({ success: false, response: STATUS.API_SCHEMA_ERROR_CODES.CUST_NOT_AVAILABLE })
    }
  }).catch((err) => {

    res.send({ success: false, response: STATUS.ERROR.DB_FETCH[2] })

  })
}

module.exports = {
  UpdateCustomer: UpdateCustomer,
  getCustomerGUID: getCustomerGUID,
  postHierarchy: postHierarchy,
  getCustomerList: getCustomerList,
  CustomerDetails: CustomerDetails,
  certificateValidate: certificateValidate,
  getFileData: getFileData,
  getToken: getToken,
  getLicensedProducts: getLicensedProducts,
  generateToken: generateToken,
  verifyToken: verifyToken,
  validateCustomer: validateCustomer

}