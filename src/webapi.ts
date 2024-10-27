import express from 'express'
import cors from 'cors'
import { auth } from 'express-oauth2-jwt-bearer'; //claimCheck, requireScope, ...
import axios from 'axios'
import fs from 'fs';
import https from 'https';
import qr from 'qr-image';

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended: true}));

const authServer = 'https://dev-v31xu68hojo03ml1.eu.auth0.com';

const checkJwt = auth({
  audience: 'https://Web2Project1TicketsAPI/',
  issuerBaseURL: `${authServer}`,
});
//app.use(checkJwt);

app.get('/ticketCount',  async function (req, res) { 
  try{
    const ticketCountResponse = await getTicketsCount() 
    const response = {count: ticketCountResponse}   
    res.json(response);               
  }
  catch(err) {
    console.log(err);
  } 
});

app.post('/generateTicket', checkJwt,  async function (req, res) { 
  //const accesstoken = req.auth!.token; //because of app.use(checkJwt)
  console.log(req.body)
  const body = req.body
  console.log(body)
  if(body.vatin == null) {
    res.statusMessage = "vatin missing";
    res.status(400).end();
    return;
  }
  if(body.firstName == null) {
    res.statusMessage = "firstName missing";
    res.status(400).end();
    return;
  }
  if(body.lastName == null) {
    res.statusMessage = "lastName missing";
    res.status(400).end();
    return;
  }

  if(await check3Tickets(body.vatin) == -1){
    res.statusMessage = "already reached maximum number of tickets for this vatin";
    res.status(400).end();
    return;
  }

  try{
    console.log('gen')
    const generateTicketResponse = await generateTicket(body.vatin, body.firstName, body.lastName) 
    const response = {uuid: generateTicketResponse}  
 
    // var qr_svg = qr.image('https://localhost:4092/ticket/' + generateTicketResponse, { type: 'svg' });
    // qr_svg.pipe(require('fs').createWriteStream(generateTicketResponse +'.svg'));
    
    var svg_string = qr.imageSync('https://localhost:4092?ticket=' + generateTicketResponse, { type: 'svg' }); 
    res.send("<img width=400 height=400 src = 'data:image/svg+xml;utf8," + svg_string + "'>");               
  }
  catch(err) {
    console.log(err);
  } 
});



app.get('/ticket/:uuid', checkJwt,  async function (req, res) { 
  const accesstoken = req.auth!.token; //because of app.use(checkJwt)
  
  const response = await getTicketInfo(req.params.uuid)
  res.json(response)
});

app.get('/userInfo', checkJwt, async function (req, res) { 
  const accesstoken = req.auth!.token; //because of app.use(checkJwt)
  
  try{
    const userInfoResponse = await axios.post(`${authServer}/userinfo`, {},  {
                                                    headers : {
                                                        Authorization : `Bearer ${accesstoken}`
                                                    }}); 
     const user = userInfoResponse.data;    
     res.json(JSON.stringify(user));               
  }
  catch(err) {
    console.log(err);
  } 
});


// const hostname = '127.0.0.1';
// const port = 4091; 
// app.listen(port, hostname, () => {
//   console.log(`Web API running at http://${hostname}:${port}/`);
// });


const externalUrl = process.env.RENDER_EXTERNAL_URL; 
const port = externalUrl && process.env.PORT ? parseInt(process.env.PORT) : 4091;

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

import { Pool } from 'pg' 
import dotenv from 'dotenv' 
dotenv.config() 

const pool = new Pool(
    { user: process.env.DB_USER, 
        host: process.env.DB_HOST, 
        database: 'web2_project1_tickets_database', 
        password: process.env.DB_PASSWORD, 
        port: 5432, 
        ssl : true 
    }
)

export async function getTicketsCount() { 
    const results = await pool.query('SELECT COUNT(uuid) as ticketscount from tickets');
    const count : number = results.rows[0]["ticketscount"]
    return count; 
}

export async function getTicketInfo(uuid: string) { 
  const results = await pool.query('SELECT * from tickets where uuid=$1', [uuid]);
  return results.rows[0]; 
}

export async function check3Tickets(vatin: string) { 
  const check3 = await pool.query('SELECT COUNT(uuid) as ticketscount from tickets where vatin=$1', [vatin]);
  const count : number = check3.rows[0]["ticketscount"]
  if(count>=3){
    return -1;
  }
  return 1;
}

export async function generateTicket(vatin: string, firstName: string, lastName: string) { 
  const result = await pool.query('INSERT into tickets(uuid, vatin, "firstName", "lastName", "dateGenerated") VALUES (gen_random_uuid(), $1, $2, $3, LOCALTIMESTAMP) returning tickets.uuid', [vatin, firstName, lastName]);
  const uuid : string = result.rows[0]["uuid"]
  return uuid; 
}

