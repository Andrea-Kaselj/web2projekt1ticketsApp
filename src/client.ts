import express from 'express'
import fs from 'fs';
import path from 'path'
import https from 'https';
import dotenv from 'dotenv';

dotenv.config()
const externalUrl = process.env.RENDER_EXTERNAL_URL; 
const port = externalUrl && process.env.PORT ? parseInt(process.env.PORT) : 4092;

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


if (externalUrl) { const hostname = '0.0.0.0'; //ne 127.0.0.1 
  app.listen(port, hostname, () => { 
    console.log(`Server locally running at http://${hostname}:${port}/ and from outside on ${externalUrl}`); 
  }); 
} else {
  https.createServer({
    key: fs.readFileSync('server.key'),
    cert: fs.readFileSync('server.cert')
  }, app)
  .listen(port, function () {
    console.log(`App running at https://localhost:${port}/`);
  });
}
