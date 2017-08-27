const urlencode = require('urlencode');
const twitterKeys = require('./keys').twitterKeys;
const spotifyKeys = require('./spotify-keys').spotifyKeys;
const Twitter = require('twitter');
const extend = require('util')._extend;
const request = require('request');
const Spotify = require('node-spotify-api');
const omdbKey = '40e9cece';
const fs = require('fs');
const csvParse = require('csv-parse');
const moustache = require('mustache');
const Entities = require('html-entities').XmlEntities;
const entities = new Entities();

if (process.argv.length > 2) {
    processCommand(process.argv[2], process.argv.slice(3));
}

function processCommand(command, args) {
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

function printTweets(tweets) {
    tweets.forEach((tweet) => printFromTemplate(tweetTemplate, tweet));
}

const sep = "----------------------------------------";
function printSep() {
    console.log(sep);
}
function printFromTemplate(template, context) {
    var text = entities.decode(moustache.render(template, context));
    console.log(text);
    printSep();
}

var tweetTemplateLines = [
    "created: {{created_at}}",
    "text:    {{text}}"
];

var tweetTemplate = tweetTemplateLines.join('\n');

function myTweets() {
    requestBearerToken(
        (accessToken) => {
            getTweets(accessToken,
                (err, tweets, response) => {
                    if (err) {
                        console.log(JSON.stringify(err, null, 2));
                    }
                    else {
                        printTweets(tweets);
                    };
                });
        });
}

var songTemplateLines = [
  "name:         {{name}}",
  "artists:      {{artists}}",
  "preview link: {{previewUrl}}"
];

var songTemplate = songTemplateLines.join("\n");

function spotifyThisSong(title) {

    title = title || 'The Sign';
    var spotify = new Spotify(
        spotifyKeys);

    if (!title) {
        console.log("Error: No title specified");
    }
    spotify
        .search({type: 'track', query: title})
        .then(function (response) {
            song = response;

            var item = response.tracks.items[0];

          var song = {
                name: item.name,
                artists: item.artists.map((artist) => artist.name).join(","),
                previewUrl: item.preview_url
            };
          console.log(sep);
          printFromTemplate(songTemplate,song);
        })
        .catch(function (err) {
            console.log(JSON.stringify(err, null, 2));
        });
}

function getTweets(accessToken, callback) {
    var twitterClient = new Twitter(extend(twitterKeys, {bearer_token: accessToken}));
    var params = {screen_name: 'jrominetest'};
    twitterClient.get('statuses/user_timeline', params, callback);
}

function requestBearerToken(callback) {
    var authTokenUrl = 'https://api.twitter.com/oauth2/token';
    var credentials =
        urlencode(twitterKeys.consumer_key) +
        ':' +
        urlencode(twitterKeys.consumer_secret);
    var encodedCredentials = base64Encode(credentials);

    request({
        url: authTokenUrl,
        method: 'POST',
        headers: {
            "Authorization": "Basic " + encodedCredentials,
            "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8"
        },
        body: "grant_type=client_credentials"
    }, function (err, res, body) {
        if (err) {
            console.log("err: " + JSON.stringify(err, null, 2));
            return;
        }
        var accessToken = JSON.parse(body).access_token;
        callback(accessToken);
    });
}

function base64Encode(s) {
    return new Buffer(s).toString('base64');
}

var movieTemplateLines = [
  "Title:                  {{Title}}",
  "Year:                   {{Year}}",
  "IMDB Rating:            {{imdbRating}}",
  "Rotten Tomatoes Rating: {{rottenTomatoesRating}}",
  "Country:                {{Country}}",
  "Language:               {{Language}}",
  "Plot:                   {{Plot}}",
  "Actors:                 {{Actors}}"
];

var movieTemplate = movieTemplateLines.join("\n");

function movieThis(movieTitle) {

    movieTitle = movieTitle || 'Mr. Nobody';
    var movieUrl = "http://www.omdbapi.com/?apikey="
        + omdbKey
        + "&t="
        + urlencode(movieTitle);

    request({
        url: movieUrl,
        method: 'GET'
    }, function (err, res, body) {
      if (err) {
            console.log("err: " + JSON.stringify(err, null, 2));
        return;
      }
      var movie = JSON.parse(body);
      movie.rottenTomatoesRating = movie.Ratings.find((rating) => (rating.Source === 'Rotten Tomatoes')).Value;
      printSep();
      printFromTemplate(movieTemplate,movie);
    });
}

function doWhatItSays(commandFileParam) {
    var commandFilePath = commandFileParam || './random.txt';
    var commandFileContents = fs.readFileSync(commandFilePath);
    csvParse(commandFileContents, (err, commandLines) => {
        commandLines.forEach(
            (commandLine) => {
                processCommand(commandLine[0], commandLine.slice(1));
            });
    });
}
