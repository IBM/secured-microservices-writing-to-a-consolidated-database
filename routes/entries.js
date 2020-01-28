// Copyright 2018 IBM Corp. All Rights Reserved.

// Licensed under the Apache License, Version 2.0 (the "License"); you
// may not use this file except in compliance with the License.  You
// may obtain a copy of the License at

// http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
// implied.  See the License for the specific language governing
// permissions and limitations under the License.


var express = require('express');
var router = express.Router();
var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectID;
const dekFunctions = require('../utils/dekFunctions.js')();
const ev = require('../env.js')().getEnv();
const aes256 = require('aes256');
const logger = require('../log.js')('entries');
//if no db specified, it goes to admin by default

/* GET contest entries page. */
router.get('/', function(req, res, next) {
  let entryId = null;
  if (req.query.id) {
    entryId = new ObjectId(req.query.id);
    logger.info(entryId);
  }
  MongoClient.connect(ev.mongoDBUrl, {useNewUrlParser: true}, function (err, db) {
    if (err) throw err;
    var dbo = db.db("admin");
    if (entryId != null) {
      dbo.collection("testCollection").findOne({'_id': entryId}, function (err, result) {
        if (err) throw err;
        db.close();

        let myObj = result;
        logger.info(result);

        // decrypt the PII
        dekFunctions.unwrapDEK((statusCode, result) => {
          if (statusCode != null) {
            logger.error(result);
            res.status(500).json({errorMsg: result,myObj});
          } else {
            let parsedObj = JSON.parse(result);

            logger.info('unwrapped base64 sym key: ' + parsedObj.plaintext);

            let symKey = parsedObj.plaintext;

            let clearName = null;
            let decDob = null;
            let decGender = null;
            let decPhone = null;
            let decEmail = null;
            let decName = null;
            logger.info(myObj);
            if(myObj !== null) {
              clearName =  myObj.name;
              decDob = aes256.decrypt(symKey, myObj.dob);
              decGender = aes256.decrypt(symKey, myObj.gender);
              decPhone = aes256.decrypt(symKey, myObj.phone);
              decEmail = aes256.decrypt(symKey, myObj.email);
              decName = aes256.decrypt(symKey, myObj.encName);
            }

            let myDecryptedObj = {
              name: clearName,
              dob: decDob,
              gender: decGender,
              phone: decPhone,
              email: decEmail,
              decName: decName
            };

            logger.info('decrypted obj: ' + JSON.stringify(myDecryptedObj));

            //return res.json(result);
            return res.json(myDecryptedObj);
          }
        });
      });
    } else {
      dbo.collection("testCollection").find().toArray(function (err, result) {
        if (err) throw err;
        db.close();
        console.log(result);
        return res.render('entries', {tableData: result});
      });
    }
  });
});


router.post('/', function(req, res, next) {
  MongoClient.connect(ev.mongoDBUrl, {useNewUrlParser: true}, function(err, db) {
    if (err) throw err;
    var dbo = db.db("admin");
    dbo.collection("testCollection").drop(function(err, delOK) {
      if (err) throw err;
      if (delOK) console.log("Collection deleted");
      dbo.createCollection("testCollection", function(err, res1) {
        if (err) throw err;
        console.log("Collection created!");
        db.close();
        res.render('entries');
      });
    });
  });
});


module.exports = router;



