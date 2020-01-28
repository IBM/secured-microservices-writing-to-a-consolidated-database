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


let express = require('express');
let router = express.Router();
let MongoClient = require('mongodb').MongoClient;
const logger = require('../log.js')('contestRouter');
const dekFunctions = require('../utils/dekFunctions.js')();
const ev = require('../env.js')().getEnv();
const aes256 = require('aes256');

/* GET contestant entry form page. */
router.get('/', function(req, res, next) {
  res.render('contest');
});

/* POST submit contestant entry form, encrypt PII, and insert into MongoDB */
router.post('/', function(req, res, next) {
  let myObj = {
    name: req.body.name,
    dob: req.body.DOB,
    gender: req.body.gender,
    phone: req.body.phone,
    email: req.body.email
  };

  if (ev.dek == null) {
    res.render('contest', {errorMsg: 'DEK does not exist, can not encrypt form data. Contact Admin.'});
  } else {
    MongoClient.connect(ev.mongoDBUrl, {useNewUrlParser: true}, function (err, db) {
      if (err) {
        res.render('contest', {errorMsg: err, origFormData: myObj});
      }
      let dbo = db.db('admin');

      console.log('myObj: ' + JSON.stringify(myObj));

      dekFunctions.unwrapDEK((statusCode, result) => {
        if (statusCode != null) {
          logger.error(result);
          res.render('contest', {errorMsg: result, origFormData: myObj});
        } else {
          let parsedObj = JSON.parse(result);

          logger.info('unwrapped base64 sym key: ' + parsedObj.plaintext);

          let symKey = parsedObj.plaintext;

          let encDob = aes256.encrypt(symKey, myObj.dob);
          let encGender = aes256.encrypt(symKey, myObj.gender);
          let encPhone = aes256.encrypt(symKey, myObj.phone);
          let encEmail = aes256.encrypt(symKey, myObj.email);
          let encName = aes256.encrypt(symKey, myObj.name);

          let myEncryptedObj = {
            name: myObj.name,
            dob: encDob,
            gender: encGender,
            phone: encPhone,
            email: encEmail,
            encName: encName
          };

          logger.info('encrypted obj: ' + JSON.stringify(myEncryptedObj));

          dbo.collection('testCollection').insertOne(myEncryptedObj, function (err, result) {
            if (err) {
              logger.error(err);
              res.render('contest', {errorMsg: err, origFormData: myObj});
            } else {
              logger.info('insertOne Result: ' + result);
              db.close();
              res.render('thank-you');
            }
          });
        }
      });
    });
  }
});

module.exports = router;
