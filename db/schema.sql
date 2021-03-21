--- load with 
--- psql "dbname='webdb' user='webdbuser' password='password' host='localhost'" -f schema.sql
DROP TABLE ftduser;
CREATE TABLE ftduser (
	username VARCHAR(20) PRIMARY KEY,
	password BYTEA NOT NULL,
	email varchar(50),
	dateOfBirth varchar(50),
	gender varchar(50),
	kills integer,
	totalDamage integer,
	damageTaken integer
);
--- Could have also stored as 128 character hex encoded values
--- select char_length(encode(sha512('abc'), 'hex')); --- returns 128
INSERT INTO ftduser VALUES('user1', sha512('password1'), 'a', 'a', 'Male', 0, 0, 0);
INSERT INTO ftduser VALUES('user2', sha512('password2'), 'a', 'a', 'Male', 0, 0, 0);
