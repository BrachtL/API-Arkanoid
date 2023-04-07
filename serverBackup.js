/*

const http =  require("http")

const server = http.createServer( (req, res) => {
    res.end("Hello, World!")
})

const PORT = process.env.PORT || 3000

server.listen(PORT, console.log(`listening on PORT ${PORT}`))

*/

const express = require("express");
const mysql = require('mysql2/promise');
const app = express();

app.listen(3000);
console.log("successful loaded :D");

//middleware (ponte entre requests)
app.use(express.json()); //possibilita executar json

//check if server is online
app.route("/").get((requirement, response) => {
  response.send("The server is online");
});

/////////////////////////////////// -- ARKANOID -- ///////////////////////////////////

// Create a MySQL database connection pool
const arkanoidPool = mysql.createPool({
  host: 'sql10.freemysqlhosting.net',
  user: 'sql10609385',
  password: 'ujdYd3HVuZ',
  database: 'sql10609385',
  connectionLimit: 10,
  idleTimeout: 270000 // set the idle timeout to 3 minutes
});

//High Score

//GET
async function getScoreboard(n) {
  try {
    const connection = await arkanoidPool.getConnection();
    
    const [results, fields] = await connection.query(`SELECT user_id, date, score FROM scoreboard ORDER BY score DESC LIMIT ${n}`);

    connection.release();
    
    return results;
  } 
  catch(error) {
    console.log("Error querying the database:", error);
    throw new Error("Internal server error");
  }
}

app.route("/arkanoid/scoreboard").get(async (req, res) => {
  if (req.body.signature != "42arkanoidisfun42") {
    res.status(401).send("Invalid access");
  } else {
    var quantity = req.body.quantity;
    try {
      var dbData = await getScoreboard(quantity);
      /* //debug and test purposes
      var dbData = {
        user: ["lbracht@gmail.com", "lol@gmail.com"],
        date: ["2023-03-30", "2023-03-25"],
        score: [500, 498],
      };
      */
      res.json(dbData);
    }
    catch (error) {
      console.log('Error retrieving high scores:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
    /* //old code, delete after some debug
    //fazer um switch error1, error2, error3, else successful
    if (dbData == "DB_ERROR_X") {
      //res.status(000).send("Error X")
    } else {

    }
    */
  }
});

//POST
function checkAndSetUserHighScore(data) {
  //setUserHighScore(data);
  //return manipulatedDBdata
}

function setUserHighScore(data) {
  
}

app.route("/arkanoid/scoreboard").post((req, res) => {
  if (req.body.signature != "42arkanoidisfun42") {
    res.status(401).send("Invalid access");
  } else {
    var dataReq = req.body;
    var dataRes = checkAndSetUserHighScore(dataReq);
    //fazer um switch error1, error2, error3, else successful
    //if (dbMessage == "DB_ERROR_X") {
      //res.status(000).send("Error X");
  //} else {
    //nao vai ser mais assim, vai ser tudo json, inclusive no post e nos erros
    var message = "successful";
    res.send(message);
    //}
  }
});







/* CHAT GPT MODEL
(to analize)

// Define the route for getting high scores
app.get('/highScores/:n', async (req, res) => {
  // Get the number of high scores to retrieve from the URL parameter
  const n = req.params.n;

  try {
    // Get a connection from the pool
    const conn = await pool.getConnection();

    // Query the database to get the top N high scores
    const [results, fields] = await conn.query(`SELECT user_id, date, score FROM scoreboard ORDER BY score DESC LIMIT ${n}`);

    // Release the connection back to the pool
    conn.release();

    // Return the results as a JSON response
    res.json(results);
  } catch (err) {
    console.log('Error querying the database:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Start the server on port 3000
app.listen(3000, () => {
  console.log('Server started on port 3000');
});

// Function to handle unexpected errors
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  process.exit(1);
});

// Function to handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err);
  process.exit(1);
});

*/
