var express = require('express');
const PORT = process.env.PORT || 3000;

const server = express()
    .use(express.static(__dirname))
    .listen(PORT, () => console.log(`Listening on ${PORT}`));

const io = require('socket.io')(server);
const request = require('request');
const cheerio = require('cheerio');

let users = [];
const PUBLIC_BETA_KEY = 'dc6zaTOxFJmzC'; // giphy key public beta
// parametres de base pour appeler 
var params = {
    api_key: PUBLIC_BETA_KEY
};

function update_quote() {

    let URL_SCRAPE = 'https://www.brainyquote.com/quotes_of_the_day.html';

    return new Promise(function (resolve, reject) {

        // On effectuera la requête GET ici
        request(URL_SCRAPE, function (error, response, html) {

            if (response.statusCode === 200) {

                console.log('requete OK');
                // console.log(html);
                resolve(html);

            } else {

                reject(error);

            }
        });

    }).then(function (html) { // Si la promesse est respectée...

        // On stockera les données dans le fichier quote.json ici
        var $ = cheerio.load(html);

        let src = $('body > div.container.bqTopLevel > div.row.bq_left > div.col-sm-8.col-md-8 > div.m_panel > div:nth-child(3) > a > img').attr('src');
        let alt = $('body > div.container.bqTopLevel > div.row.bq_left > div.col-sm-8.col-md-8 > div.m_panel > div:nth-child(3) > a > img').attr('alt');

        let quote = {};
        quote['url'] = src;
        quote['text'] = alt;

        console.log('URL ' + quote.url);
        console.log('TEXT ' + quote.text);

        return quote;

    }).catch(function (error) { // Si la promesse n'est pas respectée...

        // On affichera un message d'erreur ici
        console.log('Une erreur est survenue ', error.message);

    });

}

function isInjectionCode(data) {

    let interdit = [
        'script',
        'prompt',
        'alert'
    ];

    if (!data) return false;

    let dataMin = data.toLowerCase();

    let test = false;

    for (var index = 0; index < interdit.length; index++) {

        var element = interdit[index];

        if (dataMin.indexOf(element) > -1) {
            index = interdit.length - 1;
            test = true;
        }

    }

    return test;

}

// connexion d'un utilisateur
io.on('connection', function (socket) {

    console.log('Un utilisateur est arrivé sur la page !');
    io.sockets.emit('allUsers', users);

    socket.on('newmsg', function (data) {

        newUser(data.username);

        if (isInjectionCode(data.message)) {

            data.message = "Interdit de hacker ici !";
            data.username = "Bot";
            socket.emit('displaymsg', data);

        } else if (data.message.indexOf('/quote') > -1) {

            console.log('demande /quote');
            data.username = 'Bot';

            update_quote().then(quote => {

                if (quote && quote['text']) {
                    data.message = "<strong>" + quote['text'] + "</strong>";
                } else {
                    data.message = "Je ne connais pas de citation :(";
                }

                socket.emit('displaymsg', data);

            }).catch(() => {
                data.message = "Je ne connais pas de citation :(";
                socket.emit('displaymsg', data);
            });

        } else if (data.message.indexOf('/gif') > -1) {

            data.username = 'Robot';
            splitted = data.message.split(' ');

            console.log(data.message);

            params['q'] = splitted.slice(1).toString();
            const URL_SEARCH_GIF = 'http://api.giphy.com/v1/stickers/search';
            params['limit'] = 10;

            request({
                uri: URL_SEARCH_GIF,
                qs: params
            }, function (error, response, body) {

                if (!error && response.statusCode == 200) {

                    // console.log(body);
                    //console.log(body);
                    var o = JSON.parse(body);
                    let gifs = o.data;
                    //if (Array.isArray(gifs)) console.log('%s gifs', gifs.length);

                    let gifId = gifs[Math.floor(Math.random() * 10)].id;

                    data.message = '<img src="https://media.giphy.com/media/' + gifId + '/giphy.gif" />';
                    io.sockets.emit('displaymsg', data);

                }

            });

        } else if (data.message.indexOf('/giphy') > -1) {


            const URL_RANDOM_GIF = 'http://api.giphy.com/v1/stickers/random';

            data.username = 'Robot';

            request({
                uri: URL_RANDOM_GIF,
                qs: params
            }, function (error, response, body) {

                if (response.statusCode == 200) {

                    //console.log(body);
                    var o = JSON.parse(body);
                    let gif = o.data;
                    console.log('URL : ' + gif.url);
                    console.log('ID : ' + gif.id);
                    data.message = '<img src="https://media.giphy.com/media/' + gif.id + '/giphy.gif" />';
                    io.sockets.emit('displaymsg', data);

                } else {

                    console.log('erreur pendant l\'appel API', error);
                    data.message = 'Une erreur est survenur pendant la récupération du GIF';
                    socket.emit('displaymsg', data);

                }

            });

        } else {
            io.sockets.emit('displaymsg', data);
        }

    });

    function newUser(user) {

        if (users.indexOf(user) == -1) {
            socket.username = user;
            users.push(user);
            io.sockets.emit('newUser', user);
        }

    }

    socket.on('disconnect', () => {

        users = users.filter(el => {
            return el != socket.username;
        })
        io.sockets.emit('allUsers', users);
        console.log('Client disconnected');

    });

});