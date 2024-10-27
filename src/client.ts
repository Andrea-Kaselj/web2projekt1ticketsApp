import express from 'express'
import fs from 'fs';
import path from 'path'
import https from 'https';
import dotenv from 'dotenv';

dotenv.config()
const app = express();
app.set("views", path.join(__dirname, "views"));
app.set('view engine', 'pug');

app.get('/', function (req, res) {    
    res.render('index');
});

app.get("/auth_config.json", (req, res) => {
  res.json({
    "domain": "dev-v31xu68hojo03ml1.eu.auth0.com",
    "clientId": 'Nj4holpMln8iwVEV7MVWSZj8Rq8qQlsk', //process.env.SPA_CLIENT_ID,
    "audience" : 'https://Web2Project1TicketsAPI/',
    "cacheLocation": 'session' 
  });
});

app.get('/ticket/:uuid', function (req, res) {    
  res.render('index');
});

const port = 4092;
https.createServer({
  key: fs.readFileSync('server.key'),
  cert: fs.readFileSync('server.cert')
}, app)
.listen(port, function () {
  console.log(`SPA running at https://localhost:${port}/`);
});

