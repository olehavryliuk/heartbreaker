//global game variables
var gameLoopInterval = 50;
//var heartBaseLiveTime = 1000;
var minHeartScale = 0.5;
var maxHeartScale = 1.5;
var heartScaleFactor = 0.015;
var heartCreationInterval = 1000;
var heartColor = "red";
var halfHeartWidth = 32;
var halfHeartHeight = 32;
var maxHeartsPerLevel = 30;
var sideMargin = 30;
var gameState = "beforeStart";
var level = 3;
var maxLevel = 10;
var levelTimePeriod = 20000;
var unbrokenHeartCount = 0;
var maxUnbrokenHearts = 5;
var inLevelDifficultyIncreaser = 1.002;
var interLevelDifficultyCoef = 0.5;

window.addEventListener('load', eventWindowLoaded, false);

function eventWindowLoaded()
{
   heartBreakerApp();
}

function heartBreakerApp(){
	var gameCanvas = document.getElementById("gameCanvas");
	var context = gameCanvas.getContext("2d");
	if (!gameCanvas || ! context)
		return;
	
	var canvasWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
	var canvasHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
	gameCanvas.width = canvasWidth;
	gameCanvas.heigh = canvasHeight;
	//alert(canvasWidth + " " + canvasHeight);

//game variables	
	var mouseX;
	var mouseY;
	var estimatedCreationTime = 0;
	var levelTimeLeft = levelTimePeriod;
	var levelDifficulty = 1.0;
	var hearts = [];
	var heartSheet = new Image();
	heartSheet.addEventListener('load', eventSheetLoaded , false);
	heartSheet.src = "images/heart.png";
	
	//Gradient text output setup
	var gradientColorStops = new Array(
		{color:"#FF0000", stopPercent:0},
		{color:"#FFFF00", stopPercent:.125},
		{color:"#00FF00", stopPercent:.375},
		{color:"#0000FF", stopPercent:.625},
		{color:"#FF00FF", stopPercent:.875},
		{color:"#FF0000", stopPercent:1});

	function eventSheetLoaded()
	{
		setUpGame();
	//	alert("sheetLoaded");
	}

	function Heart(x, y, scale, scaleIncreasing)
	{
		this.x = x;
		this.y = y;
		this.scale = scale;
		this.scaleIncreasing = scaleIncreasing;
	}
	Heart.prototype.isIn = function (x, y)
	{
		//Simple rect implementation
		if (this.x < x && this.y < y && this.x + 2 * halfHeartWidth > x && this.y + 2 * halfHeartHeight > y)
		{
			return true;
		}
		return false;
	};
	
	function setUpGame()
	{
		gameState = "beforeStart";
		level = 1;
		gameCanvas.addEventListener("click", onMouseClick, false);	
		gameLoop();
	}
	
	function startGame()
	{
		gameState = "started";
		estimatedCreationTime = 0;
		unbrokenHeartCount = 0;
		levelDifficulty = level * interLevelDifficultyCoef;
		levelTimeLeft = levelTimePeriod;
		hearts = [];
	}
	
	function drawScreen()
	{
		context.setTransform(1, 0, 0, 1, 0, 0);
		context.fillStyle = '#eeffee';
		context.fillRect(0, 0, canvasWidth, canvasHeight);
		
	//Starting draw loop here
		if (gameState === "started")
		{
			for (var i = 0; i < hearts.length; i++)
			{
				context.setTransform(1, 0, 0, 1, 0, 0);
				context.translate(hearts[i].x + halfHeartWidth, hearts[i].y + halfHeartHeight);
				context.scale(hearts[i].scale, hearts[i].scale);
				context.drawImage(heartSheet, -halfHeartWidth, -halfHeartHeight);
			}
		}
		else //Showing animated text
		{
			var message;
			if (gameState === "beforeStart")
			{
				message = "CLICK TO START";
			}
			else if (gameState === "beforeNextLevel")
			{
				message = "NEXT LEVEL";
			}
			else if (gameState === "over")
			{
				message = "YOU LOST";
			}
			else if (gameState === "victory")
			{
				message = "YOU WON";
			}
			
			context.font =  "40px impact";
			context.textAlign = "center";
			context.textBaseline = "middle";
			var x = (canvasWidth/2);
			var y = (canvasHeight/2);
			var gradient = context.createLinearGradient(canvasWidth/2, 0, canvasWidth/2, canvasHeight);
			for (var i=0; i < gradientColorStops.length; i++)
			{
				var tempColorStop = gradientColorStops[i];
				var tempColor = tempColorStop.color;
				var tempStopPercent = tempColorStop.stopPercent;
				gradient.addColorStop(tempStopPercent,tempColor);
				tempStopPercent += .03;
				if (tempStopPercent > 1)
				{
					tempStopPercent = 0;
				}
				tempColorStop.stopPercent = tempStopPercent;;
				gradientColorStops[i] = tempColorStop;			
			}
			context.fillStyle = gradient;
			context.fillText (message, x, y);
		}
	}
	
	function gameLoop()
	{	
		//hearth time scaling
		if (gameState === "started")
		{
			for (var i = hearts.length - 1; i >= 0; i--)
			{
				var scale = hearts[i].scale;
				if (hearts[i].scaleIncreasing)
				{
					scale += heartScaleFactor;
					hearts[i].scale = scale;
					if (scale > maxHeartScale)
					{
						hearts[i].scale = maxHeartScale;
						hearts[i].scaleIncreasing = false;
					}
				}
				else
				{
					scale -= heartScaleFactor;
					hearts[i].scale = scale;
					if (scale < minHeartScale)
					{
						hearts.splice(i, 1);
						incrementUnbrokenHearts();
					}
				}
			}
			
		//new heart creation
			if (estimatedCreationTime <= 0)
			{
				var xCenter = Math.floor(Math.random() * (canvasWidth - 2 * sideMargin) + sideMargin);
				var yCenter = Math.floor(Math.random() * (canvasHeight - 2 * sideMargin) + sideMargin);
				
				hearts.push(new Heart(xCenter - halfHeartWidth, yCenter - halfHeartWidth, minHeartScale, true));
				estimatedCreationTime = heartCreationInterval;
			}
			else
			{
				estimatedCreationTime = estimatedCreationTime - gameLoopInterval * levelDifficulty;
				levelDifficulty *= inLevelDifficultyIncreaser;
			}
		}

		//check for level time
		levelTimeLeft -= gameLoopInterval;
		if (levelTimeLeft <= 0 && gameState != "over")
		{
			level++;
			levelTimeLeft = levelTimePeriod;
			if (level > maxLevel)
			{
				gameState = "victory";
			}
			else
			{
				gameState = "beforeNextLevel";
			}
		} 
		
		window.setTimeout(gameLoop, gameLoopInterval);
		drawScreen();
	}
	
	function onMouseClick(event)
	{
		mouseX = event.clientX - gameCanvas.offsetLeft;
		mouseY = event.clientY - gameCanvas.offsetTop;
		if (gameState === "beforeStart" || gameState === "beforeNextLevel")
		{
			//startGame();
			window.setTimeout(startGame, 1000);
		}
		else if (gameState === "started")
		{
			checkPointForEntry(mouseX, mouseY);	
		}
	}
	
	function checkPointForEntry(x, y)
	{
		for (var i = 0; i < hearts.length; i++)
		{
			if (hearts[i].isIn(x, y))
			{
				hearts.splice(i, 1);
				return;
			}
		}
	}	 
}

function incrementUnbrokenHearts()
{
	unbrokenHeartCount++;
	if (unbrokenHeartCount >= maxUnbrokenHearts)
	{
		gameState = "over";
	}
}