var fs = require('fs');
var urlencode = require('urlencode');
var twitterKeys = require('./keys').twitterKeys;
var Twitter = require('twitter');
var extend = require('util')._extend;
var request = require('request');

var command = process.argv[2];

if (command) {
  switch (command) {
  case 'my-tweets':
    myTweets();
    break;
  }
}

function myTweets() {
  requestBearerToken((accessToken) => {
    getTweets(accessToken,
              (err, tweets, response) => {
                if (err) {
                  console.log(JSON.stringify(error,null,2));
                }
                else {
                  console.log(JSON.stringify(tweets,null,2));
                };
              });
  });
}

function requestBearerToken(callback) {
  var credentials    =
        urlencode(twitterKeys.consumer_key) +
        ':' +
        urlencode(twitterKeys.consumer_secret);
  var encodedCredentials = base64Encode(credentials);

  request({
    url: 'https://api.twitter.com/oauth2/token',
    method: 'POST',
    headers: {
      "Authorization":"Basic " + encodedCredentials,
      "Content-Type":"application/x-www-form-urlencoded;charset=UTF-8"
    },
    body: "grant_type=client_credentials"
  }, function (err,res,body) {
    if (err) {
      console.log("err: " + JSON.stringify(err,null,2));
      return;
    }
    var accessToken = JSON.parse(body).access_token;
    callback(accessToken);
  });
}

function base64Encode(s) {
  return new Buffer(s).toString('base64');
}

function getTweets(accessToken, callback) {
  var twitterClient = new Twitter(extend(twitterKeys,{bearer_token: accessToken}));
  var params = {screen_name: 'jrominetest'};
  twitterClient.get('statuses/user_timeline', params, callback);
}
