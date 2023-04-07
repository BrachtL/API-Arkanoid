

const express = require("express");
const mysql = require('mysql2/promise');
const app = express();

app.listen(3000);
console.log("successful loaded :D");

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

//middleware (ponte entre requests)
app.use(express.json()); //possibilita executar json

//check if server is online
app.route("/").get((requirement, response) => {
  response.send("The server is online");
});

// Create a MySQL database connection pool
const pool = mysql.createPool({
  host: 'sql10.freemysqlhosting.net',
  user: 'sql10609385',
  password: 'ujdYd3HVuZ',
  database: 'sql10609385',
  connectionLimit: 10,
  idleTimeout: 270000 // set the idle timeout to 3 minutes
});

var connectionCount = 0; //debug
var lastLog = 0; //debug

//debug
/*
setInterval(() => {
  if(connectionCount > 0 && lastLog != connectionCount || connectionCount > 0) {
    console.log(connectionCount);
    lastLog = connectionCount;
  }
}, 5);
*/
            
//High Score

//GET

//get the scoreboard with n positions
//returns a array of json objects, each one with user_id, date and score
//always check the response length, because could be less than n in database
async function getScoreboard(n) {
  try {
    const connection = await pool.getConnection();
    connectionCount++; //debug
    
    const [results, fields] = await connection.query(`SELECT user_id, date, score FROM scoreboard ORDER BY score DESC LIMIT ${n}`);

    connection.release();
    connectionCount-- //debug
    
    console.log(`getScoreboard(${n}) return: `, results);
    return results;
  } 
  catch(error) {
    console.log("Error querying the database:", error);
    throw new Error("Internal server error");
  }
}

app.route("/scoreboard").get(async (req, res) => {
  if (req.body.tempSignature != "42arkanoidisfun42") {
    res.status(401).send("Invalid access");
  } else {
    var quantity = req.body.quantity;
    try {
      var dbData = await getScoreboard(quantity);
      //console.log("gap"); //debug
      /* //debug and test purposes
      var dbData = {
        user: ["lbracht@gmail.com", "lol@gmail.com"],
        date: ["2023-03-30", "2023-03-25"],
        score: [500, 498],
      };
      */
      //array of json objects
      console.log("finish GET scoreboard");
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

//get the score for a determined position
//return a json object
async function getScore(position) { 
  try {
    const connection = await pool.getConnection();
    connectionCount++; //debug
    
    var [scoreN, fields] = await connection.query(`SELECT score FROM scoreboard ORDER BY score DESC LIMIT 1 OFFSET ${position-1}`);
    
    connection.release();
    connectionCount-- //debug
    
    console.log(`getScore(${position}) return: `, scoreN[0]);
    return scoreN[0];
  
  }
  catch(error) {
    console.log("Error querying the database:", error);
    throw new Error("Internal server error");
  }
    
}

//get user's previous high score, date and its position, 0 means that they dont exists in db
//returns a json object with score, date and position when this high score exists or 0 when it does not exist
async function getUserHighScore(userId) {
  try {
    const connection = await pool.getConnection();
    connectionCount++; //debug
        
    var [resultsHighScoreAndDate, fields] = await connection.query(`SELECT score, date FROM scoreboard WHERE user_id = '${userId}'`);
    var [resultUserPosition, fields] = await connection.query(`SELECT COUNT(*) + 1 AS position FROM scoreboard WHERE score > (SELECT score FROM scoreboard WHERE user_id = '${userId}') ORDER BY score DESC`);
    
    var userPreviousHighScoreIndexAndDateObject = 0;
    if(resultsHighScoreAndDate.length > 0) {
      userPreviousHighScoreIndexAndDateObject = {
        score: resultsHighScoreAndDate[0].score,
        date: resultsHighScoreAndDate[0].date,
        position: resultUserPosition[0].position
      }
    }
    
    connection.release();
    connectionCount-- //debug
    
    console.log(`getUserHighScore(${userId}) return: `, userPreviousHighScoreIndexAndDateObject);
    return userPreviousHighScoreIndexAndDateObject;
  }
  catch(error) {
    console.log("Error querying the database:", error);
    throw new Error("Internal server error");
  }
}

async function setUserHighScore(data) {
  try {
    const connection = await pool.getConnection();
    connectionCount++; //debug
    
    //delete before set
    //this query consider user_id as primary key, if I let an user to register more than one score in scoreboad,
      //I will have to change it
    await connection.query(`DELETE FROM scoreboard WHERE user_id = '${data.userId}'`);
  
    //I am adding 3 minutes because the time in the machine server is 3 minutes late
    var [results, fields] = await connection.query(`INSERT INTO scoreboard (user_id, score, date) VALUES ('${data.userId}', '${data.score}',  DATE_ADD(NOW(), INTERVAL 3 MINUTE))`);
  
    var newHighScore = await getUserHighScore(data.userId);
    console.log(`setUserHighScore(${data}) return: `, newHighScore);
    return newHighScore;
   }
    catch(error) {
    console.log("Error querying the database:", error);
    throw new Error("Internal server error");
  }
}

app.route("/highscore").post(async (req, res) => {
  if (req.body.tempSignature != "42arkanoidisfun42") {
    res.status(401).send("Invalid access");
  } else {
    var scoreReceived = req.body;
    var lastScoreScoreboard = await getScore(10);
    
    try {
      
      var dbUserHighScore = await getUserHighScore(scoreReceived.userId);
      //console.log(dbUserHighScore);
          
      if(dbUserHighScore == 0) {
        var newHighScore = await setUserHighScore(scoreReceived);
                
        //case 1: user set up his first score, in the scoreboard
        if(newHighScore.score > lastScoreScoreboard.score) {
          var responseJSON = {
            message: "firstScoreInScoreboard",
            newPosition: newHighScore.position
          }
          
          console.log("finish POST score");
          res.json(responseJSON);     
        } 
        
        //case 2: user set up his first score, out of the scoreboard
        else {
          var responseJSON = {
            message: "firstScoreOutOfScoreboard",
            newPosition: newHighScore.position
          }
          
          console.log("finish POST score");
          res.json(responseJSON);     
        }
         
      } 
      
      else if(scoreReceived.score > dbUserHighScore.score) {
        
        //case 3: user beat its personal record, but did not enter to the scoreboard
        if(scoreReceived.score <= lastScoreScoreboard.score) {
        var newHighScore = await setUserHighScore(scoreReceived);
        
        var responseJSON = {
          message: "personalHighScore",
          dbScore: dbUserHighScore.score,
          dbDate: dbUserHighScore.date,
          dbPosition: dbUserHighScore.position,
          newPosition: newHighScore.position
        }
        
        console.log("finish POST score");
        res.json(responseJSON);
        }
        
        //case 4: user beat its personal record, and entered to the scoreboard    
        else if(scoreReceived.score > lastScoreScoreboard.score) {
          //console.log("estive aqui");
          var newHighScore = await setUserHighScore(scoreReceived);

          var responseJSON = {
            message: "socoreboardHighScore",
            dbScore: dbUserHighScore.score,
            dbDate: dbUserHighScore.date,
            dbPosition: dbUserHighScore.position,
            newPosition: newHighScore.position
          }

          console.log("finish POST score");
          res.json(responseJSON);
          }
      
      
      }
      
      //case 5: this user has a better score in the db
      else {
        var responseJSON = {
          message: "notHighScore",
          dbScore: dbUserHighScore.score,
          dbDate: dbUserHighScore.date,
          dbPosition: dbUserHighScore.position,
          //todo: query para saber qual a posição mais próxima do score feito
        }
        
        console.log("finish POST score");
        res.json(responseJSON);
      }

    }
    catch (error) {
      console.log('Error retrieving high scores:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
});
    
    
  






