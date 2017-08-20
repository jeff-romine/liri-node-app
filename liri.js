var urlencode = require('urlencode');
var twitterKeys = require('./keys').twitterKeys;
var spotifyKeys = require('./spotify-keys').spotifyKeys;
var Twitter = require('twitter');
var extend = require('util')._extend;
var request = require('request');
var Spotify = require('node-spotify-api');
var omdbKey = '40e9cece';
var fs = require('fs');
var csvParse = require('csv-parse');

if (process.argv.length > 2) {
  processCommand(process.argv[2],process.argv.slice(3));
}

function processCommand(command,args) {
  switch (command) {
  case 'my-tweets':
    myTweets();
    break;
  case 'spotify-this-song':
    spotifyThisSong.apply(this, args);
    break;
  case 'movie-this':
    movieThis.apply(this, args);
    break;
  case 'do-what-it-says':
    doWhatItSays.apply(this, args);
    break;
  }
}

function myTweets() {
  requestBearerToken(
    (accessToken) => {
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

function spotifyThisSong(title) {
  console.log(JSON.stringify(spotifyKeys,null,2));
  var spotify = new Spotify(
    spotifyKeys);

  if (!title) {
    console.log("No title specified");
    return null;
  }
  return spotify
    .search({ type: 'track', query: title })
    .then(function(response) {
      console.log(JSON.stringify(response,null,2));})
    .catch(function(err) {
      console.log(JSON.stringify(err,null,2));});
}

function getTweets(accessToken, callback) {
  var twitterClient = new Twitter(extend(twitterKeys,{bearer_token: accessToken}));
  var params = {screen_name: 'jrominetest'};
  twitterClient.get('statuses/user_timeline', params, callback);
}

function requestBearerToken(callback) {
  var authTokenUrl = 'https://api.twitter.com/oauth2/token';
  var credentials    =
        urlencode(twitterKeys.consumer_key) +
        ':' +
        urlencode(twitterKeys.consumer_secret);
  var encodedCredentials = base64Encode(credentials);

  request({
    url: authTokenUrl,
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

function movieThis(movieTitle) {
  var movieUrl =  "http://www.omdbapi.com/?apikey="
        + omdbKey
        + "&t="
        + urlencode(movieTitle);

  console.log("movieUrl: " + movieUrl);

  request({
    url: movieUrl,
    method: 'GET'
  }, function (err,res,body) {
    if (err) {
      console.log("err: " + JSON.stringify(err, null, 2));
      return;
    }
    console.log("body: " + JSON.stringify(JSON.parse(body), null, 2));
  });
}

function doWhatItSays(commandFileParam) {
  var commandFilePath = commandFileParam || './random.txt';
  var commandFileContents = fs.readFileSync(commandFilePath);
  console.log("contents: " + commandFileContents);
  csvParse(commandFileContents,(err,commandLines) =>
           {
             console.log(JSON.stringify(commandLines,null,2));
             console.log("cl: " + commandLines);
             commandLines.forEach(
               (commandLine) => {
                 console.log('commandLine: ' + commandLine);
                 processCommand(commandLine[0],commandLine.slice(1));

               });
           });

}
