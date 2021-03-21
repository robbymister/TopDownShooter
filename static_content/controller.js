var stage=null;
var view = null;
var interval=null;
var credentials={ "username": "", "password":"" };
var keyboard = { up: false, down: false, left: false, right: false };
var mouse = { x: 0, y: 0, pressed: false };
var userStats = {"kills": 0, "damageDone": 0, "damageTaken": 0};
var currProfile = {"email": "", "DOB": "", "gender": ""};

function setupGame(){
	stage=new Stage(document.getElementById('stage'));

	// https://javascript.info/keyboard-events
	document.addEventListener('keydown', moveByKey);
        document.addEventListener('keyup', stopByKey);
        document.addEventListener('mousedown', clickedMouse);
        document.addEventListener('mouseup', releasedMouse);
        document.addEventListener('mousemove', moveMouse);
}

function startGame(){
        interval=setInterval(function(){ stage.step(); stage.draw(); },16.67); 
}
function pauseGame(){
	clearInterval(interval);
	interval=null;
}
function clickedMouse(){
        stage.mousePos.pressed = true;
        if (stage.restart) {
                pauseGame();
                setupGame();
                startGame();
        }
}
function moveMouse(event){
        stage.changeMousePos(event.clientX, event.clientY);
}
function releasedMouse(){
        stage.mousePos.pressed = false;
}
function moveByKey(event){
	var key = event.key;
	var moveMap = { 
		'a': new Pair(-5,0),
		's': new Pair(0,5),
		'd': new Pair(5,0),
		'w': new Pair(0,-5)
	};
	if(key in moveMap){
		stage.player.velocity=moveMap[key];
	}  else if (event.keyCode == 9) {
                stage.tabPressed = true;
        }
}
function stopByKey(event){
	var key = event.key;
        var currVelocity = stage.player.velocity;
	var moveMap = { 
		'a': new Pair(0,currVelocity.y),
		's': new Pair(currVelocity.x,0),
		'd': new Pair(0,currVelocity.y),
		'w': new Pair(currVelocity.x,0)
	};
	if(key in moveMap){
		stage.player.velocity=moveMap[key];
	} else if (event.keyCode == 9) {
                stage.tabPressed = false;
        }
}

function login(){
	credentials =  { 
		"username": $("#username").val(), 
		"password": $("#password").val() 
	};

        $.ajax({
                method: "POST",
                url: "/api/auth/login",
                data: JSON.stringify({}),
		headers: { "Authorization": "Basic " + btoa(credentials.username + ":" + credentials.password) },
                processData:false,
                contentType: "application/json; charset=utf-8",
                dataType:"json"
        }).done(function(data, text_status, jqXHR){
                console.log(jqXHR.status+" "+text_status+JSON.stringify(data));

        	$("#ui_login").hide();
        	$("#ui_play").show();
                $("#ui_navbar").show();

		setupGame();
		startGame();
                getStats();

        }).fail(function(err){
                console.log("fail "+err.status+" "+JSON.stringify(err.responseJSON));
        });
}

function showRegister(){
        $("#ui_login").hide();
        $("#ui_register").show();    
}

function register(){
        password = $("#registerPass").val();
        username = $("#registerUser").val();
        email = $("#registerEmail").val();
        gender = $("#registerGenders").val();
        dateOfBirth = $("#registerDOB").val();

        if (password != $("#confirmPass").val()) {
                alert("The passwords do not match.");
                return;
        }

        if (!!password || !!username || !!dateOfBirth || !! email || !!gender) {
                alert("Not all fields are filled for the registration");
                return;
        }

        userInfo = {
                "username": username, 
	        "password": password, 
                "email": email,
                "gender": gender,
                "dateOfBirth": dateOfBirth 
        }

        $.ajax({
                method: "POST",
                url: "/api/users/"+username,
                headers: {"username": username, "password": password},
                data: JSON.stringify(userInfo),
                contentType: "application/json; charset=utf-8",
                processData: true,
                dataType:"json"
        }).done(function(data, text_status, jqXHR){
                console.log(jqXHR.status+" "+text_status+JSON.stringify(data));
        }).fail(function(err){
                console.log("fail "+err.status+" "+JSON.stringify(err.responseJSON));
        });
}

function backToLogin(){
        $("#ui_register").hide();
        $("#ui_login").show();
        $("#ui_play").hide();
        $("#ui_instructions").hide();
        $("#ui_navbar").hide();
        $("#ui_stats").hide();
        $("#ui_profile").hide();
        $("#username").val("");
        $("#password").val("");
        $("#registerUser").val("");
        $("#registerPass").val("");
        $("#confirmPass").val("");
        $("#registerGenders").val("");
        $("#registerDOB").val("");
        $("#registerEmail").val("");
        credentials = {};
        pauseGame();
}

function swapPlay(){
        $("#ui_register").hide();
        $("#ui_login").hide();
        $("#ui_play").show();
        $("#ui_instructions").hide();
        $("#ui_stats").hide();
        $("#ui_profile").hide();
        startGame();
}

function swapInstructions(){
        $("#ui_register").hide();
        $("#ui_login").hide();
        $("#ui_play").hide();
        $("#ui_instructions").show();
        $("#ui_stats").hide();
        $("#ui_profile").hide();
        pauseGame();
}

function swapStats(){
        $("#ui_register").hide();
        $("#ui_login").hide();
        $("#ui_play").hide();
        $("#ui_instructions").hide();
        $("#ui_stats").show();
        $("#ui_profile").hide();

        pauseGame();
        getStats();
        updateStats();

        var kills = document.getElementById("statsKills");
        kills.innerHTML = userStats.kills;

        var damage = document.getElementById("statsDamage");
        damage.innerHTML = userStats.damageDone;

        var damageTaken = document.getElementById("statsTaken");
        damageTaken.innerHTML = userStats.damageTaken;
}

function getStats() {
        username = credentials.username;

        $.ajax({
                method: "GET",
                url: "/api/users/"+username,
                headers: {"username": username},
                data: JSON.stringify({"username": username}),
                contentType: "application/json; charset=utf-8",
                processData: true,
                dataType:"json"
        }).done(function(data, text_status, jqXHR){
                console.log(jqXHR.status+" "+text_status);
                var rows = data.data;
                userStats.kills = rows[0].kills;
                userStats.damageDone = rows[0].totaldamage;
                userStats.damageTaken = rows[0].damagetaken;
        }).fail(function(err){
                console.log("fail "+err.status+" "+JSON.stringify(err.responseJSON));
        });
}

function swapProfile(){
        $("#ui_register").hide();
        $("#ui_login").hide();
        $("#ui_play").hide();
        $("#ui_instructions").hide();
        $("#ui_stats").hide();
        $("#ui_profile").show();

        pauseGame();

        $("#profileUser").val(credentials.username);
        $("#profilePass").val(credentials.password);
        $("#profileDOB").val(currProfile.DOB);
        $("#profileEmail").val(currProfile.email);
        $("#profileGenders").val(currProfile.gender);
}

function updateProfile(){
        newPassword = $("#profilePass").val();
        newUsername = $("#profileUser").val();
        newDOB = $("#profileDOB").val();
        newEmail = $("#profileEmail").val();
        newGender = $("#profileGenders").val();
        username = credentials.username;

        if (!!newPassword || !!newUsername || !!newDOB || !! newEmail || !!newGender) {
                alert("Some credentials are missing for the update");
                return;
        }

        var newUserInfo = {
                "username": username, 
                "newUsername": newUsername, 
                "newPassword": newPassword,
                "newEmail": newEmail,
                "newDOB": newDOB,
                "newGender": newGender
        }

        $.ajax({
                method: "PUT",
                url: "/api/auth/user/"+username,
                headers: { "Authorization": "Basic " + btoa(credentials.username + ":" + credentials.password) },
                data: JSON.stringify(newUserInfo),
                contentType: "application/json; charset=utf-8",
                processData: true,
                dataType:"json"
        }).done(function(data, text_status, jqXHR){
                console.log(jqXHR.status+" "+text_status+JSON.stringify(data));
                credentials =  { 
                        "username": newUsername, 
                        "password": newPassword 
                };
        }).fail(function(err){
                console.log("fail "+err.status+" "+JSON.stringify(err.responseJSON));
        });
}

function updateStats() {
        username = credentials.username;
        userStats.kills += stage.player.kills;
        userStats.damageTaken += stage.player.damageTaken;
        userStats.damageDone += stage.player.damageDone;

        $.ajax({
                method: "PUT",
                url: "/api/users/"+username,
                headers: { "username": username},
                data: JSON.stringify(userStats),
                contentType: "application/json; charset=utf-8",
                processData: true,
                dataType:"json"
        }).done(function(data, text_status, jqXHR){
                console.log(jqXHR.status+" "+text_status+JSON.stringify(data));
        }).fail(function(err){
                console.log("fail "+err.status+" "+JSON.stringify(err.responseJSON));
        });
}

function getProfile(){
        username = credentials.username;

        $.ajax({
                method: "GET",
                url: "/api/auth/users/"+username,
                headers: {"Authorization": "Basic " + btoa(credentials.username + ":" + credentials.password)},
                data: JSON.stringify({"username": username}),
                contentType: "application/json; charset=utf-8",
                processData: true,
                dataType:"json"
        }).done(function(data, text_status, jqXHR){
                console.log(jqXHR.status+" "+text_status);
                var rows = data.data;
                currProfile.DOB = rows[0].dateofbirth;
                currProfile.email = rows[0].email;
                currProfile.gender = rows[0].gender;
        }).fail(function(err){
                console.log("fail "+err.status+" "+JSON.stringify(err.responseJSON));
        });
}

// Using the /api/auth/test route, must send authorization header
function test(){
        $.ajax({
                method: "GET",
                url: "/api/auth/test",
                data: {},
		headers: { "Authorization": "Basic " + btoa(credentials.username + ":" + credentials.password) },
                dataType:"json"
        }).done(function(data, text_status, jqXHR){
                console.log(jqXHR.status+" "+text_status+JSON.stringify(data));
        }).fail(function(err){
                console.log("fail "+err.status+" "+JSON.stringify(err.responseJSON));
        });
}

$(function(){
        // Setup all events here and display the appropriate UI
        $("#loginSubmit").on('click',function(){ login(); getProfile(); });
        $("#registerSubmit").on('click',function(){ showRegister(); });
        $("#confirmRegister").on('click',function(){ register(); });
        $("#navPlay").on('click',function(){ swapPlay(); });
        $("#navLogout").on('click',function(){ updateStats(); backToLogin(); });
        $("#navInstructions").on('click',function(){ swapInstructions(); });
        $("#navStats").on('click',function(){ swapStats(); });
        $("#navProfile").on('click',function(){ swapProfile(); });
        $("#updateProfile").on('click',function(){ updateProfile(); });
        $("#ui_instructions").hide();
        $("#ui_login").show();
        $("#ui_play").hide();
        $("#ui_stats").hide();
        $("#ui_profile").hide();
        $("#ui_navbar").hide();
        $("#ui_register").hide();
        $("#backToLogin").on('click',function(){ backToLogin(); });
});

