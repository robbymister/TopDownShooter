function randint(n){ return Math.round(Math.random()*n); }
function rand(n){ return Math.random()*n; }

class Stage {
	constructor(canvas){
		this.canvas = canvas;
		this.context = this.canvas.getContext('2d');
		this.levelWidth = 6000;
		this.levelHeight = 6000;
		this.tabPressed = false;
		this.state = 'game';
		this.restart = false;

		this.actors=[]; // all actors on this stage (monsters, player, boxes, ...)
		this.obstacles=[];

		// the logical width and height of the stage
		this.width=canvas.width;
		this.height=canvas.height;
		this.mousePos = {x: 0, y: 0, pressed: false};
		this.adjustedMouse = {x: (this.levelWidth / 2), y: (this.levelHeight / 2)};
		// Add the player to the center of the stage
		var velocity = new Pair(0,0);
		var radius = 30;
		var colour= 'rgba(0,0,0,1)';
		var position = new Pair(Math.floor(this.width/2), Math.floor(this.height/2));

		// Create a single instance of each handler
		this.playerShotHandler = new PlayerShotHandler(this);
		this.player=new Player(this, position, velocity, colour, radius);
		this.addPlayer(this.player);
		this.obstacleHandler = new ObstacleHandler(this);
		this.enemyShotHandler = new EnemyShotHandler(this);
		this.enemyHandler = new EnemyHandler(this);

		this.handlers = [{
        	color: colour,
        	handler: this.player,
			name: 'player'
    	},{
			color: 'rgba(0,0,0,0.5)',
			handler: this.obstacleHandler,
			name: 'obstacle'
		},{
			color: 'rgba(158,0,0,0.5)',
			handler: this.enemyHandler,
			name: 'enemy'
		}, {
			color: 'rgba(0,0,0,0.8)',
			handler: this.playerShotHandler,
			name: 'playerShot'
		}, {
			color: 'rgba(158,0,0,0.75)',
			handler: this.enemyShotHandler,
			name: 'enemyShot'
		}];
	
		// Add in some enemies and obstacles close to the player
		var total=25;
		while(total>0){
			var x=Math.floor((Math.random()*this.width * 3)); 
			var y=Math.floor((Math.random()*this.height * 3)); 
			this.enemyHandler.createEnemies(x, y);
			total--;
		}
		var total = 100;
		while(total>0){
			var x=Math.floor((Math.random()*this.width * 5)); 
			var y=Math.floor((Math.random()*this.height * 5)); 
			var width = randint(100);
			this.obstacleHandler.createObstacle(x, y, width);
			total--;
		}
	}

	// Adjusts mouse pos relative to canvas
	changeMousePos(x, y) {
		var rect = this.canvas.getBoundingClientRect();
		this.mousePos.x = x - rect.left;
		this.mousePos.y = y - rect.top;
	}

	// Gets mouse location on the canvas
	adjustMouseLocation(halfWidth, halfHeight) {
		var newX = this.adjustedMouse.x + (this.player.position.x - this.adjustedMouse.x) * 0.05;
    	if (newX < this.player.position.x + 1 && newX > this.player.position.x - 1) {
        	newX = this.player.position.x;
    	}
		var newY = this.adjustedMouse.y + (this.player.position.y - this.adjustedMouse.y) * 0.05;
    	if (newY < this.player.position.y + 1 && newY > this.player.position.y - 1) {
        	newY = this.player.position.y;
    	}
    	if (newX < halfWidth) {
        	newX = halfWidth;
    	} else if (newX > this.levelWidth - halfWidth) {
       	 	newX = this.levelWidth - halfWidth;
    	}
    	if (newY < halfHeight) {
        	newY = halfHeight;
    	} else if (this.y > this.levelHeight - this.canvas.height * 0.5) {
        	newY = this.levelHeight - halfHeight;
    	}
		this.adjustedMouse = {x: newX, y: newY};
	}

	addPlayer(player){
		this.addActor(player);
		this.player=player;
	}

	removePlayer(){
		this.removeActor(this.player);
		this.player=null;
	}

	addActor(actor){
		this.actors.push(actor);
	}

	removeActor(actor){
		var index=this.actors.indexOf(actor);
		if(index!=-1){
			this.actors.splice(index,1);
		}
	}

	// Take one step in the animation of the game.  Do this by asking each of the actors to take a single step. 
	// NOTE: Careful if an actor died, this may break!
	step(){
		if (this.state == 'gameOver' && this.mousePos.pressed == true) {
			this.restart = true;
		}
		if (this.player.health <= 0 || this.enemyHandler.list.length == 0) {
			this.GameOverScreen();
		}
		if (this.state == 'game') {
			var halfWidth = this.context.canvas.width / 2;
			var halfHeight = this.context.canvas.height / 2;
			this.adjustMouseLocation(halfWidth, halfHeight);

			this.handlers.forEach(el => el.handler.step());
		} else {
			return;
		}
	}

	draw(){
		if (this.state != 'gameOver'){
			var context = this.canvas.getContext('2d');
			var obj, i, j;
			var offsetX = this.canvas.width * 0.5 - this.adjustedMouse.x;
			var offsetY = this.canvas.height * 0.5 - this.adjustedMouse.y;
			context.clearRect(0, 0, this.canvas.width, this.canvas.height);
			context.drawImage(this.canvas, offsetX, offsetY);
			for (i = 0; i < this.handlers.length; i++) {
				context.fillStyle = this.handlers[i].color;
				if (this.handlers[i].name != "enemy") { 
					obj = this.handlers[i].handler;
					obj.draw(context);
					continue;
				} else {
					for (j = this.handlers[i].handler.list.length - 1; j >= 0; j--) {
						obj = this.handlers[i].handler.list[j];
						obj.draw();
					}
				}
			}
			context.fillStyle = '#444444';
			context.fillRect(0, this.canvas.height - 25, this.canvas.width, 25);
			context.textAlign = 'left';
			context.font = 'bold 11px/1 Arial';
			context.fillStyle = '#AAAAAA';
			context.fillText('Health', 5, this.canvas.height - 10);
			context.fillText('Kills', 100, this.canvas.height - 10);
			context.font = 'bold 15px/1 Arial';
			context.fillStyle = '#DDDDDD';
			context.fillText(Math.round(this.player.health) + '/' + this.player.maxHealth, 43, this.canvas.height - 10);
			context.fillText(this.player.kills, 127, this.canvas.height - 10);
		}
	}

	// return the first actor at coordinates (x,y) return null if there is no such actor
	getActor(x, y){
		for(var i=0;i<this.actors.length;i++){
			if(this.actors[i].x==x && this.actors[i].y==y){
				return this.actors[i];
			}
		}
		return null;
	}

	getObstacle(x, y) {
		for(var i=0;i<this.obstacles.length;i++){
			if(this.obstacles[i].x==x && this.obstacles[i].y==y){
				return this.obstacles[i];
			}
		}
		return null;
	}

	isCollided(x, y) {
		if(this.getActor(x,y)!=null && this.getObstacle(x,y)!=null){
			return true;
		}
		return false;
	}

	GameOverScreen() {
		this.state = 'gameOver';
    	this.mousePos.pressed = false;
		console.log("over");
    	this.context.fillStyle = 'rgba(255,255,255,0.8)';
    	this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    	var hW = this.canvas.width * 0.5;
    	var hH = this.canvas.height * 0.5;
    	var dark = 'rgba(0,0,0,0.9)';
    	var medium = 'rgba(0,0,0,0.5)';
    	var light = 'rgba(0,0,0,0.3)';

		this.context.font = 'normal 21px/1 "Segoe UI",Arial,sans-serif';
		this.context.fillStyle = dark;
		this.context.textAlign = 'center';
		this.context.textBaseline = 'middle';
		var text = "Game Over";
		this.context.fillText(text, hW, hH - 20);
		text = "Click to play again";
		this.context.fillText(text, hW, hH + 20);
	}

	getRandomColor() {
		var letters = '0123456789ABCDEF';
		var color = '#';
		for (var i = 0; i < 6; i++) {
			color += letters[Math.floor(Math.random() * 16)];
		}
		return color;
	}
} // End Class Stage

class Pair {
	constructor(x,y){
		this.x=x; this.y=y;
	}

	toString(){
		return "("+this.x+","+this.y+")";
	}

	normalize(){
		var magnitude=Math.sqrt(this.x*this.x+this.y*this.y);
		this.x=this.x/magnitude;
		this.y=this.y/magnitude;
	}
}

class Obstacle {
	constructor(stage, position, colour, width, height) {
		this.stage = stage;
		this.position=position;
		this.colour = colour;
		this.height = height;
		this.width = width;
		this.collision = true;
	}

	draw(context){
		context.beginPath();
		context.rect(this.position.x, this.position.y, this.width, this.height);
		context.fillStyle = this.colour;
		context.fill();
	}
}

class Ball {
	constructor(stage, position, velocity, colour, radius){
		this.stage = stage;
		this.position=position;
		this.intPosition(); // this.x, this.y are int version of this.position

		this.velocity=velocity;
		this.colour = colour;
		this.radius = radius;
	}
	
	headTo(position){
		this.velocity.x=(position.x-this.position.x);
		this.velocity.y=(position.y-this.position.y);
		this.velocity.normalize();
	}

	toString(){
		return this.position.toString() + " " + this.velocity.toString();
	}

	step(){
		this.position.x=this.position.x+this.velocity.x;
		this.position.y=this.position.y+this.velocity.y;
			
		// bounce off the walls
		if(this.position.x<0){
			this.position.x=0;
			this.velocity.x=Math.abs(this.velocity.x);
		}
		if(this.position.x>this.stage.width){
			this.position.x=this.stage.width;
			this.velocity.x=-Math.abs(this.velocity.x);
		}
		if(this.position.y<0){
			this.position.y=0;
			this.velocity.y=Math.abs(this.velocity.y);
		}
		if(this.position.y>this.stage.height){
			this.position.y=this.stage.height;
			this.velocity.y=-Math.abs(this.velocity.y);
		}
		this.intPosition();
	}
	intPosition(){
		this.x = Math.round(this.position.x);
		this.y = Math.round(this.position.y);
	}
	draw(context){
		context.fillStyle = this.colour;
   		// context.fillRect(this.x, this.y, this.radius,this.radius);
		context.beginPath(); 
		context.arc(this.x, this.y, this.radius, 0, 2 * Math.PI, false); 
		context.fill();   
	}
}

class Player extends Ball {
	constructor(stage, position, velocity, colour, radius){
		super(stage, position, velocity, colour, radius);
		this.stage = stage;
		this.position=position;
		this.intPosition(); // this.x, this.y are int version of this.position
		this.context = this.stage.canvas.getContext('2d');

		this.canTakeDamage = true;
		this.health = 100;
  		this.dead = false;
		this.angle = 0;
		this.velocity=velocity;
		this.colour = colour;
		this.radius = radius;
		this.maxHealth = 100; 
    	this.damage = 1;
		this.reload = 0;

		this.accel = 0.3;
		this.speed = 2.0;
		this.reloadRate = 12.0;
		this.shotSpeed = 5.0;
		this.startDamage = 1.0;
		this.turretRadius = this.radius * 0.6;
		this.list = [this];

		// INFO FOR USER STATS
		this.kills = 0;
		this.damageTaken = 0;
		this.damageDone = 0;
	}

	draw(){
		// torso
		var offsetX = this.stage.canvas.width * 0.5 - this.stage.adjustedMouse.x;
		var offsetY = this.stage.height * 0.5 - this.stage.adjustedMouse.y;

		var x = this.position.x + offsetX;
		var y = this.position.y + offsetY;

		var healthColour;
		if (this.health <= 35) healthColour = 'red';
		else if (this.health <= 75) healthColour = 'orange';
		else healthColour = 'lime';

		this.context.beginPath();
		this.context.rect(x - 25, y + 30, this.health / 2, 5);
		this.context.fillStyle = healthColour;
		this.context.fill();

		this.context.beginPath();
		this.context.rect(x - 25, y + 30, 50, 5);
		this.context.strokeStyle = this.colour;
		this.context.stroke();

		this.context.fillStyle = this.colour;
		this.context.beginPath();
		this.context.rect(x - this.radius/2, y - this.radius/2, this.radius, this.radius);
		this.context.fillStyle = this.colour;
		this.context.fill();
	}

	step(){
		var obj, i, vX, vY;
		vX = this.velocity.x;
		vY = this.velocity.y;
		if (vX != 0 && vY != 0) {
			vX *= 0.7071;
			vY *= 0.7071
		} else if (vX == 0 && vY == 0) {
			this.velocity.x *= 0.7;
			this.velocity.y *= 0.7
		}
		this.velocity.x += vX;
		this.velocity.y += vY;
		var dist = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y);
		if (dist > this.speed) {
			dist = this.speed / dist;
			this.velocity.x *= dist;
			this.velocity.y *= dist
		}
		this.position.x += this.velocity.x;
		this.position.y += this.velocity.y;
		if (this.position.x < this.radius) {
			this.position.x = this.radius
		} else if (this.position.x > this.stage.levelWidth - this.radius) {
			this.position.x = this.stage.levelWidth - this.radius
		}
		if (this.position.y < 20 + this.radius) {
			this.position.y = 20 + this.radius
		} else if (this.position.y > this.stage.levelHeight - this.radius) {
			this.position.y = this.stage.levelHeight - this.radius
		}
		this.reload--;
		if (this.stage.mousePos.pressed && this.reload <= 0) {
			vX = this.stage.mousePos.x + this.stage.adjustedMouse.x - this.stage.canvas.width * 0.5 - this.position.x;
			vY = this.stage.mousePos.y + this.stage.adjustedMouse.y - this.stage.canvas.height * 0.5 - this.position.y;
			dist = Math.sqrt(vX * vX + vY * vY);
			vX /= dist;
			vY /= dist;
			this.stage.playerShotHandler.createBullet(this.position.x, this.position.y,
			 	vX * this.shotSpeed + Math.random() * 0.6 - 0.3, vY * this.shotSpeed + Math.random() * 0.6 - 0.3);
			this.reload = this.reloadRate;
		}
	}
}

class PlayerShotHandler {
	constructor(stage) {
		this.radius = 3;
    	this.list = [];
   		this.pool = [];
		this.speed = 2.0;
		this.stage = stage;
	}

	step() {
		var shot, i;
		for (i = this.list.length - 1; i >= 0; i--) {
			shot = this.list[i];
			shot.x += shot.vX;
			shot.y += shot.vY;
			shot.radius -= 0.045;
			if (shot.radius <= 1) {
				this.pool.push(shot);
				this.list.splice(i, 1);
				continue
			}
		}
	}

	draw(context) {
		var shot, i;
		for (i = this.list.length - 1; i >= 0; i--) {
			var shot = this.list[i];
			var offsetX = this.stage.canvas.width * 0.5 - this.stage.adjustedMouse.x;
			var offsetY = this.stage.height * 0.5 - this.stage.adjustedMouse.y;
			var x = shot.x + offsetX;
			var y = shot.y + offsetY;
			if (x > -shot.radius && x < this.stage.canvas.width + shot.radius && y > -shot.radius && y < this.stage.canvas.height + shot.radius) {
				context.beginPath();
				context.arc(x, y, shot.radius, 0, 6.2832);
				context.fill();
				context.closePath();
			}
		}
	}

	createBullet(x, y, vX, vY) {
		var shot = this.pool.length > 0 ? this.pool.pop() : new Object();
		shot.x = x;
		shot.y = y;
		shot.vX = vX;
		shot.vY = vY;
		shot.radius = this.radius;
		this.list.push(shot);
	}

	bulletHit(i) {
		this.pool.push(this.list[i]);
    	this.list.splice(i, 1);
	}
}

class EnemyHandler {
	constructor(stage) {
    	this.spawnMax = 30;
    	this.list = [];
    	this.pool = [];
		this.stage = stage;
		this.levelWidth = stage.levelWidth;
    	this.levelHeight = stage.levelHeight;
		this.playerShotHandler = this.stage.playerShotHandler;
		this.enemyShotHandler = this.stage.enemyShotHandler;
		this.currID = 0;
	}

	step() {
		for (var i = this.list.length - 1; i >= 0; i--) {
			this.list[i].step();
		}
	}

	createEnemies(x, y) {
		if (this.list.length >= this.spawnMax) {
        	return
    	}
    	var enemy = this.pool.length > 0 ? this.pool.pop() : new Enemy(this.stage, 
			x, y, 0, 0, 0, 5, 10, 10, 20, 3, 7, this.currID);
    	this.list.push(enemy);
		this.currID++;
	}

	hitEnemies(i, dmg) {
		var foundEnemy = this.list.find(el => el.enemyID === i);
		var index = this.list.findIndex(el => el == foundEnemy);
		foundEnemy.hp -= dmg;
		this.stage.player.damageDone += dmg;
    	if (foundEnemy.hp <= 0) {
        	this.stage.player.kills++;
        	this.pool.push(foundEnemy);
        	this.list.splice(index, 1);
    	}
	}
}

class EnemyShotHandler {
	constructor(stage) {
		this.list = [];
		this.pool = [];
		this.stage = stage;
    	this.playerHandler = this.stage.player;
    	this.speed = 0.9;
	}

	step() {
		var player = this.playerHandler;
		var shot, i, j, k, closest, dist, dist2;
		for (i = this.list.length - 1; i >= 0; i--) {
			shot = this.list[i];
			shot.x += shot.vX;
			shot.y += shot.vY;
			shot.delay--;
			if (shot.delay <= 0) {
				dist2 = (player.position.x - shot.x) * (player.position.x - shot.x) + (player.position.y - shot.y) * (player.position.y - shot.y);
				if (dist2 < 144) {
					dist = 8
				} else if (dist2 < 576) {
					dist = 16
				} else if (dist2 < 2304) {
					dist = 32
				} else if (dist2 < 9216) {
					dist = 64
				} else if (dist2 < 36864) {
					dist = 128
				} else if (dist2 < 147456) {
					dist = 256
				} else if (dist2 < 589824) {
					dist = 512
				} else if (dist2 < 2359296) {
					dist = 1024
				} else if (dist2 < 9437184) {
					dist = 2048
				} else {
					dist = 5096
				}
				dist = 0.5 * (dist2 / dist + dist);
				dist = 0.5 * (dist2 / dist + dist) - 10 - shot.radius;
				if (dist <= 0) {
					player.health -= shot.damage;
					player.damageTaken += shot.damage;
					if (player.health < 0) {
						player.health = 0
					}
					shot.radius = 0
				}
				shot.delay = dist / (2 + this.speed)
			}
			shot.radius -= 0.03;
			if (shot.radius <= 1) {
				this.pool.push(shot);
				this.list.splice(i, 1);
				continue
			}
		}
	}

	draw(context) {
		var shot, i;
		for (i = this.list.length - 1; i >= 0; i--) {
			var shot = this.list[i];
			var offsetX = this.stage.canvas.width * 0.5 - this.stage.adjustedMouse.x;
			var offsetY = this.stage.height * 0.5 - this.stage.adjustedMouse.y;
			var x = shot.x + offsetX;
			var y = shot.y + offsetY;
			if (x > -shot.radius && x < this.stage.canvas.width + shot.radius && y > -shot.radius && y < this.stage.canvas.height + shot.radius) {
				context.beginPath();
				context.arc(x, y, shot.radius, 0, 6.2832);
				context.fill();
				context.closePath();
			}
		}
	}

	createEnemyShot(x, y, vX, vY, radius, damage) {
		var shot = this.pool.length > 0 ? this.pool.pop() : new Object();
		shot.x = x;
		shot.y = y;
		shot.vX = vX;
		shot.vY = vY;
		shot.delay = 0;
		shot.radius = radius;
		shot.damage = damage;
		this.list.push(shot)
	}
}

class ObstacleHandler {
	constructor(stage) {
		this.stage = stage;
		this.list = [];
		this.pool = [];
    	this.playerHandler = this.stage.player;
    	this.playerShotHandler = this.stage.playerShotHandler;
	}

	step() {
		var player = this.playerHandler;
		var i, j, wall, shot, dist, dist2, vX, vY;
		for (i = this.list.length - 1; i >= 0; i--) {
			wall = this.list[i];
			wall.delay--;
			if (wall.delay <= 0) {
				vX = player.position.x - wall.x;
				vY = player.position.y - wall.y;
				dist2 = vX * vX + vY * vY;
				if (dist2 < 144) {
					dist = 8
				} else if (dist2 < 576) {
					dist = 16
				} else if (dist2 < 2304) {
					dist = 32
				} else if (dist2 < 9216) {
					dist = 64
				} else if (dist2 < 36864) {
					dist = 128
				} else if (dist2 < 147456) {
					dist = 256
				} else if (dist2 < 589824) {
					dist = 512
				} else if (dist2 < 2359296) {
					dist = 1024
				} else {
					dist = 2048
				}
				dist = 0.5 * (dist2 / dist + dist);
				dist = 0.5 * (dist2 / dist + dist);
				if (dist - player.radius - wall.radius > 350) {
					wall.delay = Math.floor((dist - player.radius - wall.radius - 350) / player.speed)
				}
				if (dist - player.radius - wall.radius <= 0) {
					player.velocity.x = vX * 0.06;
					player.velocity.y = vY * 0.06
				}
				if (dist - player.radius - wall.radius <= 350) {
					for (j = this.playerShotHandler.list.length - 1; j >= 0; j--) {
						shot = this.playerShotHandler.list[j];
						dist2 = (shot.x - wall.x) * (shot.x - wall.x) + (shot.y - wall.y) * (shot.y - wall.y);
						if (dist2 < 144) {
							dist = 8
						} else if (dist2 < 576) {
							dist = 16
						} else if (dist2 < 2304) {
							dist = 32
						} else if (dist2 < 9216) {
							dist = 64
						} else if (dist2 < 36864) {
							dist = 128
						} else if (dist2 < 147456) {
							dist = 256
						} else if (dist2 < 589824) {
							dist = 512
						} else if (dist2 < 2359296) {
							dist = 1024
						} else {
							dist = 2048
						}
						dist = 0.5 * (dist2 / dist + dist);
						dist = 0.5 * (dist2 / dist + dist) - shot.radius - wall.radius;
						if (dist <= 0) {
							this.playerShotHandler.bulletHit(j);
							this.damageObstacle(i, player.damage);
						}
					}
				}
			}
		}
	}

	draw(context) {
		var obs, i;
		for (i = this.list.length - 1; i >= 0; i--) {
			var obs = this.list[i];
			var offsetX = this.stage.canvas.width * 0.5 - this.stage.adjustedMouse.x;
			var offsetY = this.stage.height * 0.5 - this.stage.adjustedMouse.y;
			var x = obs.x + offsetX;
			var y = obs.y + offsetY;
			context.fillStyle = obs.colour;
			if (x > -obs.radius && x < this.stage.canvas.width + obs.radius && y > -obs.radius && y < this.stage.canvas.height + obs.radius) {
				context.beginPath();
				context.arc(x, y, obs.radius, 0, 6.2832);
				context.fill();
				context.closePath();
			}
		}
	}

	clearObstacle(x, y, radius) {
		var i, wall, dist;
		for (i = this.list.length - 1; i >= 0; i--) {
			wall = this.list[i];
			dist = Math.sqrt((x - wall.x) * (x - wall.x) + (y - wall.y) * (y - wall.y));
			if (dist <= radius) {
				this.list.splice(i, 1);
			}
		}
	}

	damageObstacle(i, dmg) {
		this.list[i].hp -= dmg;
		if (this.list[i].hp <= 0) {
			var wall = this.list[i];
			this.pool.push(wall);
			this.list.splice(i, 1);
		}
	}

	createObstacle(x, y, radius) {
		var wall = this.pool.length > 0 ? this.pool.pop() : new Object();
		wall.x = x;
		wall.y = y;
		wall.delay = Math.round(Math.random() * 30);
		wall.radius = typeof radius === 'undefined' ? 9 : radius;
		wall.hp = 25;
		wall.colour = this.stage.getRandomColor();
		this.list.push(wall);
	}
}

class Enemy {
	constructor(stage, x, y, vX, vY, reload, delay, radius, hp, reloadRate, shotRadius, shotDamage, id) {
		this.stage = stage;
    	this.position = new Pair(x, y);
		this.velocity = new Pair(vX, vY);
    	this.reload = reload;
    	this.delay = delay;
    	this.radius = radius;
    	this.hp = hp;
    	this.reloadRate = reloadRate + Math.random() * 10;
    	this.shotRadius = shotRadius;
    	this.shotDamage = shotDamage;
		this.enemyShotHandler = this.stage.enemyShotHandler;
		this.playerShotHandler = this.stage.playerShotHandler;
		this.enemyID = id;
		this.speed = 0.9;
		this.shotSpeed = 3.0;
		this.context = this.stage.canvas.getContext('2d');
	}

	step() {
		var i, j, wall, shot, dist, dist2, vX, vY;
		var player = this.stage.player;
		this.reload--;
		this.delay--;
		if (this.delay <= 0) {
			vX = player.position.x - this.position.x;
			vY = player.position.y - this.position.y;
			dist2 = vX * vX + vY * vY;
			if (dist2 < 144) {
				dist = 8
			} else if (dist2 < 576) {
				dist = 16
			} else if (dist2 < 2304) {
				dist = 32
			} else if (dist2 < 9216) {
				dist = 64
			} else if (dist2 < 36864) {
				dist = 128
			} else if (dist2 < 147456) {
				dist = 256
			} else if (dist2 < 589824) {
				dist = 512
			} else if (dist2 < 2359296) {
				dist = 1024
			} else {
				dist = 2048
			}
			dist = 0.5 * (dist2 / dist + dist);
			dist = 0.5 * (dist2 / dist + dist);
			if (dist - player.radius - this.radius > Math.max(200, 350)) {
				this.delay = Math.floor((dist - player.radius - this.radius - Math.max(200, 350)) / (2.0 + this.speed))
			}
			if (dist - player.radius - this.radius <= 0) {
				player.velocity.x = vX * 0.06;
				player.velocity.y = vY * 0.06
			}
			if (dist - player.radius - this.radius <= 200) {
				if (this.reload <= 0) {
					this.enemyShotHandler.createEnemyShot(this.position.x, this.position.y, vX / dist * this.shotSpeed + Math.random() * 4 - 2, vY / dist * this.shotSpeed + Math.random() * 4 - 2, this.shotRadius, this.shotDamage);
					this.reload = this.reloadRate;
				}
				vX = vX / dist * this.speed;
				vY = vY / dist * this.speed;
			} else {
				vX = 0;
				vY = 0;
			}
			if (dist - player.radius - this.radius <= 350) {
				for (j = this.playerShotHandler.list.length - 1; j >= 0; j--) {
					shot = this.playerShotHandler.list[j];
					dist2 = (shot.x - this.position.x) * (shot.x - this.position.x) + (shot.y - this.position.y) * (shot.y - this.position.y);
					if (dist2 < 144) {
						dist = 8
					} else if (dist2 < 576) {
						dist = 16
					} else if (dist2 < 2304) {
						dist = 32
					} else if (dist2 < 9216) {
						dist = 64
					} else if (dist2 < 36864) {
						dist = 128
					} else if (dist2 < 147456) {
						dist = 256
					} else if (dist2 < 589824) {
						dist = 512
					} else if (dist2 < 2359296) {
						dist = 1024
					} else {
						dist = 2048
					}
					dist = 0.5 * (dist2 / dist + dist);
					dist = 0.5 * (dist2 / dist + dist) - shot.radius - this.radius;
					if (dist <= 0) {
						this.playerShotHandler.bulletHit(j);
						this.stage.enemyHandler.hitEnemies(this.enemyID, player.damage);
					}
				}
			}
		} else {
			vX = 0;
			vY = 0
		}
		this.velocity.x = (this.velocity.x * 19 + vX) * 0.05;
		this.velocity.y = (this.velocity.y * 19 + vY) * 0.05;
		this.velocity.x += Math.random() * 0.2 - 0.1;
		this.velocity.y += Math.random() * 0.2 - 0.1;
		this.position.x += this.velocity.x;
		this.position.y += this.velocity.y;
		if (this.position.x < this.radius) {
			this.position.x = this.radius;
			this.velocity.x *= -1
		} else if (this.position.x > this.stage.levelWidth - this.radius) {
			this.position.x = this.stage.levelWidth - this.radius;
			this.velocity.x *= -1
		}
		if (this.position.y < 20 + this.radius) {
			this.position.y = 20 + this.radius;
			this.velocity.y *= -1
		} else if (this.position.y > this.stage.levelHeight - this.radius) {
			this.position.y = this.stage.levelHeight - this.radius;
			this.velocity.y *= -1
		}
	}

	draw() {
		var offsetX = this.stage.canvas.width * 0.5 - this.stage.adjustedMouse.x;
		var offsetY = this.stage.height * 0.5 - this.stage.adjustedMouse.y;
		var x = this.position.x + offsetX;
		var y = this.position.y + offsetY;
		if (x > -this.radius && x < this.stage.canvas.width + this.radius && y > -this.radius && y < this.stage.canvas.height + this.radius) {
			this.context.beginPath();
			this.context.arc(x, y, this.radius, 0, 6.2832);
			this.context.fill();
			this.context.closePath();
		}
	}
}