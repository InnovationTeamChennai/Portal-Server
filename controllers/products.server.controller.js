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
* File Name: product.server.controller.js
*
* DESCRIPTION
* This code contains Enterprise portal  product creation, updation, deletion and get product list.
*
* ========================================================================================
*/
const db = require("../database");
const Product = db.products;
//const Nodes = db.nodes;

var commonUtils = require('../utils/common.utils');
var ISASctrl = require('./isas.server.controller');

var STATUS = require('../utils/status-codes-messages.utils');
const AppConfig = require('../config/app-config');
var env = process.env.NODE_ENV || 'development';

var fs = require('fs');
var rfs = require('rotating-file-stream');
var path = require('path')
const Op = require("sequelize").Op;
const licenseManagerAppUrl = '/application';
const licenseManagerFeatureUrl = '/feature';
var logger = require('../utils/winston.utils').PortalLogs;
const fetch = require('node-fetch');

var STATUS = require('../utils/status-codes-messages.utils');
var { getDetectedPluginConfigFiles } = require('./plugins-config-detect.controller')
var productValidate = require('../validators/product.validator');

/*********************************************************
 ******** ADDING THE PRODUCT IN THE PRODUCT TABLE  ******
**********************************************************/
async function addProduct(req, res) {
  if (Object.keys(req.body).length > 0) {
    if (req.body.ProductUid != '' && req.body.ProductName != '' && req.body.Version != '') {
      const result = productValidate.AddProductRequest.validate(req.body);
      if (result != '') {
        let errorMessage = result.toString();
        res.status(STATUS.COMMON_MSGS.HTTP_ERR_CODE).send({ status: 500, Message: errorMessage });
      } else {

        logger.info(STATUS.EC_LOGS.MSG.ADD_PRODUCT_API_MSG);
        Product.findOne({ where: { [Op.or]: [{ ProductUid: req.body.ProductUid.trim() }] } }).then(function (Result) {
          if (Result != null) {
            logger.error(STATUS.EC_LOGS.MSG.ADD_PRODUCT_API_MSG, '', STATUS.API_SCHEMA_ERROR_CODES.ERROR_PRODUCT_SAME_PART_NO_EXISTS)
            res.status(500).send({ status: 500, message: STATUS.API_SCHEMA_ERROR_CODES.ERROR_PRODUCT_SAME_PART_NO_EXISTS });


          } else {
            logger.info(STATUS.EC_LOGS.MSG.ADD_PRODUCT_API_MSG, '', STATUS.EC_LOGS.MSG.VALIDATING_PRODUCT_PARTNO_VERSION_MSG)
            Product.findAll({ where: { [Op.and]: [{ ProductName: req.body.ProductName.trim() }, { Version: req.body.Version.trim() }] } })
              .then(function (ProductDataAgain) {
                if (ProductDataAgain.length > 0) {
                  //Pushing data to license manager
                  // pushDataToLicenseManager(req);

                  prodData = JSON.parse(JSON.stringify(ProductDataAgain));

                  logger.error(STATUS.EC_LOGS.MSG.ADD_PRODUCT_API_MSG, '', STATUS.API_SCHEMA_ERROR_CODES.ERROR_PRODUCT_SAME_PART_NO_VERSION_EXISTS)
                  res.status(500).send({ status: 500, message: STATUS.API_SCHEMA_ERROR_CODES.ERROR_PRODUCT_SAME_PART_NO_VERSION_EXISTS });

                } else {
                  prodData = JSON.parse(JSON.stringify(ProductDataAgain));
                  Product.create(
                    {
                      ProductUid: req.body.ProductUid, ProductName: req.body.ProductName, Version: req.body.Version, Description: req.body.Description, FeatureList: JSON.stringify(req.body.featureList),
                      DateCreated: new Date() + "", DateUpdated: new Date() + ""

                    }).then((result, err) => {
                      if (result) {
                        logger.info(STATUS.EC_LOGS.MSG.ADD_PRODUCT_API_MSG, '', STATUS.EC_LOGS.MSG.PRODUCT_SAVED_SUCCESSFULLY_MSG);
                        pushDataToLicenseManager(req, "Add");

                        res.status(200).send({ status: 200, message: STATUS.EC_LOGS.MSG.PRODUCT_SAVED_SUCCESSFULLY_MSG });
                      }
                      else {
                        logger.error(STATUS.EC_LOGS.MSG.ADD_PRODUCT_API_MSG, "", STATUS.API_SCHEMA_ERROR_CODES.ERROR_FAILED_TO_SAVE_PRODUCT);

                        res.status(500).send({ status: 500, message: STATUS.ERROR.INTERNAL_SW[1] });
                      }
                    })
                    .catch(err => {
                      res.status(500).send({ error: STATUS.COMMON_MSGS.EC_DB_ACCESS_FAIL_STATUS_CODE });
                    });
                }
              })
          }
        })
      }
    } else {
      res.status(500).send({ status: 500, Message: STATUS.API_SCHEMA_ERROR.HRCHY_UPDT_NODE_API_REQURD_PARAMS_NTFOUND[1] });
    }
  } else {
    res.send({ status: 500, Message: STATUS.API_SCHEMA_ERROR.HRCHY_CREATE_NODE_API_BODY_NTFOUND[1] });
  }
}

/*********************************************************
 ******** UPDATE OR EDIT THE PRODUCT IN PRODUCT TABLE******
**********************************************************/
async function editProduct(req, res) {
  if (Object.keys(req.body).length > 0) {

    const result = productValidate.EditProductRequest.validate(req.body);
    if (result != '') {
      let errorMessage = result.toString();
      res.status(STATUS.COMMON_MSGS.HTTP_ERR_CODE).send({ status: 500, Message: errorMessage });
    } else {
      if (req.body.ProductUid != '' && req.body.ProductName != '' && req.body.Version != '') {

        logger.info(STATUS.EC_LOGS.MSG.EDIT_PRODUCT_API_MSG);
        var UpdateProduct = true;
        Product.findAll({ where: { [Op.or]: [{ ProductUid: req.body.ProductUid.trim() }] } })
          .then(function (ProductsData) {
            data = JSON.parse(JSON.stringify(ProductsData));
            for (let k = 0; k < data.length; k++) {
              if (data[k].Id == req.body.Id) {

              } else {
                logger.error(STATUS.EC_LOGS.MSG.EDIT_PRODUCT_API_MSG, '', STATUS.EC_LOGS.MSG.PRODUCT_ALREADY_EXISTS_MSG)
                UpdateProduct = false;
              }
            }
            if (UpdateProduct == true) {
              var UpdateProdData = true;
              Product.findAll({ where: { [Op.and]: [{ ProductName: req.body.ProductName.trim() }, { Version: req.body.Version.trim() }] } })
                .then(function (ProductDataAgain) {
                  ProdData = JSON.parse(JSON.stringify(ProductDataAgain));
                  for (let m = 0; m < ProdData.length; m++) {
                    if (ProdData[m].Id == req.body.Id) {
                      logger.info(STATUS.EC_LOGS.MSG.EDIT_PRODUCT_API_MSG, '', STATUS.EC_LOGS.MSG.PRODUCT_VALIDATED_SUCCESSFULLY_MSG,)

                    } else {
                      logger.error(STATUS.EC_LOGS.MSG.EDIT_PRODUCT_API_MSG, '', STATUS.API_SCHEMA_ERROR_CODES.ERROR_PRODUCT_SAME_PART_NO_VERSION_EXISTS);
                      UpdateProdData = false;
                    }
                  }
                  if (UpdateProdData == true) {

                    var featureList = JSON.stringify(req.body.featureList)

                    Product.update(
                      {
                        ProductUid: req.body.ProductUid, ProductName: req.body.ProductName, Version: req.body.Version, Description: req.body.Description, FeatureList: featureList,
                        DateCreated: new Date() + "", DateUpdated: new Date() + ""

                      },
                      {
                        where: {
                          Id: req.body.Id
                        }
                      }).then((result) => {
                        logger.info(STATUS.EC_LOGS.MSG.PRODUCT_UPDATED_SCUCCESSFULLY_MSG);

                        //Pushing data to license manager
                        pushDataToLicenseManager(req, "Edit");

                        res.status(200).send({ status: 200, message: STATUS.EC_LOGS.MSG.PRODUCT_UPDATED_SCUCCESSFULLY_MSG });
                      }).catch(err => {
                        logger.error(STATUS.EC_LOGS.MSG.EDIT_PRODUCT_API_MSG, '', STATUS.API_SCHEMA_ERROR_CODES.ERROR_FAILED_TO_SAVE_PRODUCT);

                        res.status(500).send({ error: err });
                      });


                  } else {
                    res.status(500).send({ status: 500, message: STATUS.API_SCHEMA_ERROR_CODES.ERROR_PRODUCT_SAME_PART_NO_VERSION_EXISTS });
                  }
                })


            } else {
              res.status(500).send({ status: 500, message: STATUS.API_SCHEMA_ERROR_CODES.ERROR_PRODUCT_SAME_PART_NO_EXISTS });

            }
          });
        // }
      } else {
        res.status(500).send({ status: 500, Message: STATUS.API_SCHEMA_ERROR.HRCHY_UPDT_NODE_API_REQURD_PARAMS_NTFOUND[1] });
      }
    }
  } else {
    res.send({ status: 500, Message: STATUS.API_SCHEMA_ERROR.HRCHY_CREATE_NODE_API_BODY_NTFOUND[1] });
  }
}
/*********************************************************
 ******** DELETE PRODUCT FROM PRODUCT TABLE ******
**********************************************************/

async function deleteProduct(req, res) {
  logger.info(STATUS.EC_LOGS.MSG.DELETE_PRODUCT_API_MSG)
  Product.destroy({
    where: {
      Id: req.body.Id //this will be your id that you want to delete
    }
  }).then(function (rowDeleted) { // rowDeleted will return number of rows deleted
    if (rowDeleted === 1) {
      logger.info(STATUS.EC_LOGS.MSG.DELETE_PRODUCT_API_MSG, '', STATUS.EC_LOGS.MSG.PRODUCT_DELETED_SUCCESSFULLY_MGS);
      res.status(200).send({ status: 200, message: STATUS.EC_LOGS.MSG.PRODUCT_DELETED_SUCCESSFULLY_MGS });
    }
  }, function (err) {
    logger.error(STATUS.EC_LOGS.MSG.DELETE_PRODUCT_API_MSG, '', STATUS.ERROR.INTERNAL_SW[1]);
    res.status(500).send({ status: 500, message: STATUS.ERROR.INTERNAL_SW[1] });
  });
}
/*********************************************************
 ******** GET FULL PRODUCT LIST   ************************
**********************************************************/
async function getProductList(req, res) {

  logger.info(STATUS.EC_LOGS.MSG.IN_GET_PRODUCT_LIST_MSG);
  let data = [];
  var dataToPush = [];
  var promises = [];
  Product.findAll()
    .then(function (products) {

      data = JSON.parse(JSON.stringify(products));
      for (let j = 0; j < data.length; j++) {
        data[j].FeatureList = JSON.parse(data[j].FeatureList);
      }
      logger.info(STATUS.EC_LOGS.MSG.PRODUCT_LIST_SENT_SUCCESSFULLY_MSG);
      res.status(200).send(data);

    });

}

async function normalizeData(productEntry) {

  let newEntry = {};
  newEntry.ProductName = productEntry.ProductName;
  newEntry.ProductUid = productEntry.ProductUid;
  newEntry.Status = productEntry.Status;
  newEntry.Description = productEntry.Description;
  newEntry.Version = productEntry.Version;

  return newEntry;

}

/*********************************************************
 ******** SEND PRODUCT DATA TO LICENSE MANAGER**********
**********************************************************/
async function pushDataToLicenseManager(req, type) {
  logger.info(STATUS.EC_LOGS.MSG.PUST_DATA_TO_LICENSE_MANAGER_API_MSG);
  let product = req.body;
  let featureList = req.body.featureList;

  let checkIfLicenseManagerisAvailable = await checkIfLicenseManagerisActive();

  if (checkIfLicenseManagerisAvailable.success === true && checkIfLicenseManagerisAvailable.configDetails) {

    let pluginDetail = checkIfLicenseManagerisAvailable.configDetails;

    let licenseMangerUrl = pluginDetail.baseUrl;
    let licenseManagerPort = pluginDetail.serverPort;
    let licensMangerprependUrl = pluginDetail.prependUrl;

    let productUrl = licenseMangerUrl + ":" + licenseManagerPort + licensMangerprependUrl + licenseManagerAppUrl;
    let featureUrl = licenseMangerUrl + ":" + licenseManagerPort + licensMangerprependUrl + licenseManagerFeatureUrl;
    let productbody = {};
    let products = [];
    let productforLicenseManager = await generateProductforLicenseManager(product);

    products.push(productforLicenseManager);

    productbody.item = [];
    // productbody.item.applications = [];
    productbody.item = products;

  
    let featureBody = {};
    featureBody.item = [];
    // featureBody.item.features = [];

    let featuresToAdd = [];
    for (j = 0; j < featureList.length; j++) {
      let ft = await generateFeatureforLicenseManager(featureList[j], req.body);
      JSON.stringify(ft);
      featuresToAdd.push(ft);
    }

    featureBody.item = featuresToAdd;

  
    if (type === "Add") {
      fetch(productUrl, {
        method: 'post',
        body: JSON.stringify(productbody),
        headers: { 'Content-Type': 'application/json', 'accesstoken': req.headers.accesstoken },
      })
        .then(res => {
          res.json();
          logger.info(STATUS.EC_LOGS.MSG.PUST_DATA_TO_LICENSE_MANAGER_API_MSG, '', STATUS.EC_LOGS.MSG.PRODUCT_LIST_SENT_SUCCESSFULLY_MSG)
        })
        .then(json => {
          fetch(featureUrl, {
            method: 'post',
            body: JSON.stringify(featureBody),
            headers: { 'Content-Type': 'application/json', 'accesstoken': req.headers.accesstoken },
          })
            .then(res => {
              res.json();
              logger.info(STATUS.EC_LOGS.MSG.PUST_DATA_TO_LICENSE_MANAGER_API_MSG, '', STATUS.EC_LOGS.MSG.FEATURE_LIST_SENT_SUCCESSFULLY_MSG);
            })
            .then(json => {

            });


        });
    }

    else if (type === "Edit") {
      fetch(productUrl, {
        method: 'put',
        body: JSON.stringify(productbody),
        headers: { 'Content-Type': 'application/json', 'accesstoken': req.headers.accesstoken },
      })
        .then(res => {
          res.json();
        })
        .then(json => {
          fetch(featureUrl, {
            method: 'post',
            body: JSON.stringify(featureBody),
            headers: { 'Content-Type': 'application/json', 'accesstoken': req.headers.accesstoken },
          })
            .then(res => {
              res.json();
            })
            .then(json => {
          });


        });

    }

  }
}

/************************************************************
 ***** TO CEHCK WEATHER LICENSE MANAGER IS ACTIVE OR NOT ****
*************************************************************/

async function checkIfLicenseManagerisActive() {

  let availablePluginsresponse = await getDetectedPluginConfigFiles();
  if (availablePluginsresponse.success === true) {
    let availablePlugins = availablePluginsresponse.response
    availablePlugins = availablePlugins.acceptedPluginConfigFiles || [];

    if (availablePlugins && availablePlugins.length > 0) {


      /*db.plugins.findAll({
        where : {
  
        }
      }).then(function (plugin){
  
      })*/

      for (j = 0; j < availablePlugins.length; j++) {
        if (availablePlugins[j].uniqueName === AppConfig.licenseManagerApp) {
          let pluginStatus = doIndividualPluginServicesRestart(availablePlugins[j]);

          return pluginStatus;
        }
      }

      return { success: false, configDetails: null };

    }
  } else {
    return { success: false, configDetails: null };
  }
}

/*********************************************************
 ******** DO INDIVIDUAL PLUGIN SERVICE RESTART ******
**********************************************************/
async function doIndividualPluginServicesRestart(plugin) {
  logger.info(STATUS.EC_LOGS.HEADING.RESTART_INDIVIDUAL_PLGN_SERVICES + STATUS.EC_LOGS.MSG.RESTART_INDVIDUAL_PLUGIN_SERVICES + plugin.name);

  let configDetails = await ISASctrl.getPluginsConfigurationDetails(plugin)
  if (configDetails && configDetails.success === true) {

    return { success: true, configDetails: configDetails.response };

  }

  else {
    return { success: false, configDetails: null };
  }
}

/*********************************************************
 ******** GENERATE PRODUCT FOR LICENSE MANAGER **********
**********************************************************/

async function generateProductforLicenseManager(productAdded) {
  logger.info(STATUS.EC_LOGS.MSG.IN_GENERATE_PRODUCT_FOR_LM_MSG)
  let product = {};
  product.app_key = productAdded.ProductUid;
  product.app_name = productAdded.ProductName;
  product.from_ver = productAdded.Version;
  product.expires_on = "9999-12-31T00:00:00.000Z";
  return product;

}
/*********************************************************
 ******** GENERATE FEATURE FOR LICENSE MANAGER******
**********************************************************/
async function generateFeatureforLicenseManager(featureAdded, productAdded) {
  logger.info(STATUS.EC_LOGS.MSG.IN_GENERATE_FEATURE_FOR_LM_MSG)
  let feature = {};
  feature.app_key = productAdded.ProductUid;
  feature.feature_key = featureAdded.FeatureID;
  feature.feature_name = featureAdded.FeatureName;
  feature.from_ver = productAdded.Version;
  feature.expires_on = "9999-12-31T00:00:00.000Z";
  return feature;

}


module.exports = {
  addProduct: addProduct,
  editProduct: editProduct,
  deleteProduct: deleteProduct,
  getProductList: getProductList
}