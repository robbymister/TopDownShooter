// https://www.freecodecamp.org/news/express-explained-with-examples-installation-routing-middleware-and-more/
// https://medium.com/@viral_shah/express-middlewares-demystified-f0c2c37ea6a1
// https://www.sohamkamani.com/blog/2018/05/30/understanding-how-expressjs-works/

var port = 8000; 
var express = require('express');
var app = express();

const { Pool } = require('pg')
const pool = new Pool({
    user: 'webdbuser',
    host: 'localhost',
    database: 'webdb',
    password: 'password',
    port: 5432
});

const bodyParser = require('body-parser'); // we used this middleware to parse POST bodies

function isObject(o){ return typeof o === 'object' && o !== null; }
function isNaturalNumber(value) { return /^\d+$/.test(value); }

// app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
// app.use(bodyParser.raw()); // support raw bodies

// Non authenticated route. Can visit this without credentials
app.post('/api/test', function (req, res) {
	res.status(200); 
	res.json({"message":"got here"}); 
});

/** 
 * This is middleware to restrict access to subroutes of /api/auth/ 
 * To get past this middleware, all requests should be sent with appropriate
 * credentials. Now this is not secure, but this is a first step.
 *
 * Authorization: Basic YXJub2xkOnNwaWRlcm1hbg==
 * Authorization: Basic " + btoa("arnold:spiderman"); in javascript
**/
app.use('/api/auth', function (req, res,next) {
	if (!req.headers.authorization) {
		return res.status(403).json({ error: 'No credentials sent!' });
  	}
	try {
		// var credentialsString = Buffer.from(req.headers.authorization.split(" ")[1], 'base64').toString();
		var m = /^Basic\s+(.*)$/.exec(req.headers.authorization);
		var user_pass = Buffer.from(m[1], 'base64').toString()
		m = /^(.*):(.*)$/.exec(user_pass); // probably should do better than this

		var username = m[1];
		var password = m[2];

		let sql = 'SELECT * FROM ftduser WHERE username=$1 and password=sha512($2)';
        	pool.query(sql, [username, password], (err, pgRes) => {
  			if (err){
                		res.status(403).json({ error: 'Not authorized'});
			} else if(pgRes.rowCount == 1){
				next(); 
			} else {
                		res.status(403).json({ error: 'Not authorized'});
        		}
		});
	} catch(err) {
               	res.status(403).json({ error: 'Not authorized'});
	}
});

// All routes below /api/auth require credentials 
app.post('/api/auth/login', function (req, res) {
	res.status(200); 
	res.json({"message":"authentication success"}); 
});

app.post('/api/auth/test', function (req, res) {
	res.status(200); 
	res.json({"message":"got to /api/auth/test"}); 
});

app.post('/api/users/:username/', function (req, res) {
	try {
		username = req.body.username;
		password = req.body.password;
		email = req.body.email;
		gender = req.body.gender;
		dateOfBirth = req.body.dateOfBirth;

		let sql = 'INSERT INTO ftduser VALUES($1, sha512($2), $3, $4, $5, 0, 0, 0)';
		pool.query(sql, [username, password, email, dateOfBirth, gender], (err, pgRes) => {
			if (err) {
				res.status(403).json({ error: "Error with database"});
			} else {
				res.status(200);
				res.json({"message":"update successful"}); 
			}
		});
	} catch(err) {
		res.status(403).json({ error: "Error with database"});
	}
});

app.put('/api/users/:username/', function (req, res) {
	if (!req.headers.username) {
		return res.status(403).json({ error: 'Missing username!' });
  	}
	try {
		username = req.headers.username;
		kills = req.body.kills;
		damageDone = req.body.damageDone;
		damageTaken = req.body.damageTaken;

		let sql = 'UPDATE ftduser SET kills=$1, totalDamage=$2, damageTaken=$3 WHERE username=$4;';
		pool.query(sql, [kills, damageDone, damageTaken, username], (err, pgRes) => {
			if (err) {
				res.status(403).json({ error: "Error with database"});
			} else {
				res.status(200);
				res.json({"message":"update successful"}); 
			}
		});
	} catch(err) {
		res.status(403).json({ error: "Error with database"});
	}
});

app.put('/api/auth/user/:username/', function (req, res) {
	if (!req.body.newUsername || !req.body.newPassword) {
		return res.status(403).json({ error: 'Missing updated username or password!' });
  	}
	try {
		res.status(200); 
		res.json({"message": "update successful"});

		username = req.body.username;
		newPassword = req.body.newPassword;
		newUsername = req.body.newUsername;
		newEmail = req.body.newEmail;
		newGender = req.body.newGender;
		newDOB = req.body.newDOB;

		let sql = 'UPDATE ftduser SET password=$1, username=$2, email=$3, dateOfBirth=$4, gender=$5 WHERE username=$6';
		pool.query(sql, [newPassword, newUsername, newEmail, newDOB, newGender, username], (err, pgRes) => {
			if (err) {
				res.status(403).json({ error: "Error with database"});
			}
		});
	} catch(err) {
		res.status(403).json({ error: "Error with database"});
	}
});

app.get('/api/users/:username/', function (req, res) {
	try {
		username = req.headers.username;

		let sql = 'SELECT kills, totalDamage, damageTaken FROM ftduser WHERE username=$1';
		pool.query(sql, [username], (err, pgRes) => {
			if (err) {
				res.status(403).json({ error: "Error with database"});
			} else {
				res.status(200);
				res.json({"message":"update successful", "data": pgRes.rows}); 
			}
		});
	} catch(err) {
		res.status(403).json({ error: "Error with database"});
	}
});

app.get('/api/auth/users/:username/', function (req, res) {
	try {
		var m = /^Basic\s+(.*)$/.exec(req.headers.authorization);
		var user_pass = Buffer.from(m[1], 'base64').toString()
		m = /^(.*):(.*)$/.exec(user_pass); // probably should do better than this

		var username = m[1];

		let sql = 'SELECT email, gender, dateOfBirth FROM ftduser WHERE username=$1';
		pool.query(sql, [username], (err, pgRes) => {
			if (err) {
				res.status(403).json({ error: "Error with database"});
			} else {
				res.status(200);
				res.json({"message":"update successful", "data": pgRes.rows}); 
			}
		});
	} catch(err) {
		res.status(403).json({ error: "Error with database"});
	}
});

app.use('/',express.static('static_content')); 

app.listen(port, function () {
  	console.log('Example app listening on port '+port);
});

