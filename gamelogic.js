//Author Oleh Havryliuk 06.2015

function heartBreaker()
{
//game constants
    var backgroundColor = "#cceeff",
        soundBreakPath = "sounds/break2",
        maxSounds = 5,
        soundVolume = 0.5,
        gameLoopInterval = 50,
        minHeartScale = 1.0,
        maxHeartScale = 2.5,
        heartScaleFactor = 0.015,
        heartCreationInterval = 1000,
        heartColor = "red",
        halfHeartWidth = 32,
        halfHeartHeight = 32,
        maxHeartsPerLevel = 30,
        sideMargin = 50,
        gameState = "beforeStart",
        startLevel = 2,
        maxLevel = 7,
        levelTimePeriod = 20000,
        unbrokenHeartCount = 0,
        maxUnbrokenHearts = 5,
        inLevelDifficultyIncreaser = 1.002,
        interLevelDifficultyCoef = 0.5;

//broken heart constants
    var brokenHeartScaleCoef = 0.02,
        brokenHeartRotationCoef = 0.1,
        brokenHeartDistanceCoef = 3.0,
        brokenHeartAlphaeCoef = 0.03;
        
//Gradient text output setup
    var gradientColorStops = [
        {color: "#FF0000", stopPercent: 0},
        {color: "#FFFF00", stopPercent: 0.125},
        {color: "#00FF00", stopPercent: 0.375},
        {color: "#0000FF", stopPercent: 0.625},
        {color: "#FF00FF", stopPercent: 0.875},
        {color: "#FF0000", stopPercent: 1}
    ];

//Canvas check      
    var gameCanvas = document.getElementById("gameCanvas"),
        context = gameCanvas.getContext("2d");
    
    if (!gameCanvas || !context)
    {
        console.log('Error: document.getElementById("gameCanvas") or gameCanvas.getContext("2d") FAILED');
        return;
    }
    
    var canvasWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth,
        canvasHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
    
    gameCanvas.heigh = canvasHeight;
    gameCanvas.width = canvasWidth;

//game variables    
    var mouseX,
        mouseY,
        proceedInput = true,
        estimatedCreationTime = 0,
        level = startLevel,
        levelTimeLeft = levelTimePeriod,
        levelDifficulty = 1.0;

    var hearts = [],
        brokenHearts = [],
        heartSheet = new Image();
    
    heartSheet.addEventListener("load", itemLoaded , false);
    heartSheet.src = "images/heartSheet.png";
    
//Sounds stuff
    var itemsToLoad = maxSounds + 1,
        loadCount = 0,
        soundPool = [],
        tempAudio,
        source,
        sourceType,
        sourceSrc;

    tempAudio = document.createElement("audio");
    document.body.appendChild(tempAudio);
    source = document.createElement("source");
        
    if (tempAudio.canPlayType("audio/ogg"))
    {
        source.type = sourceType = "audio/ogg";
        source.src = sourceSrc = soundBreakPath + ".ogg";
    }
    else
    {
        source.type = sourceType = "audio/mpeg";
        source.src = sourceSrc = soundBreakPath + ".mp3";
    }
    
    tempAudio.appendChild(source);
    tempAudio.addEventListener("canplaythrough", itemLoaded, false);
    tempAudio.wasPlayed = false;
    soundPool.push(tempAudio);
        
    for (var i = 1; i < maxSounds; i++)
    {
        tempAudio = document.createElement("audio");
        document.body.appendChild(tempAudio);
        source = document.createElement("source");
        source.type = sourceType;
        source.src = sourceSrc;
        tempAudio.appendChild(source);      
        tempAudio.addEventListener("canplaythrough", itemLoaded, false);
        tempAudio.wasPlayed = false;
        soundPool.push(tempAudio);
    }
    
    function itemLoaded()
    {
        loadCount++;

        if (loadCount >= itemsToLoad)
        {
            heartSheet.removeEventListener("load", itemLoaded , false);
            
            for (var i = 0; i < maxSounds; i++)
            {
                soundPool[i].removeEventListener("canplaythrough", itemLoaded, false);
            }
            setUpGame();
        }
    }

/** @constructor */
    function Heart(x, y, scale, scaleIncreasing)
    {
        this.x = x;
        this.y = y;
        this.scale = scale;
        this.scaleIncreasing = scaleIncreasing;
    }
    
    Heart.prototype.isIn = function (x, y)
    {   
    //Rect minus two triangles
        var scale = this.scale + 0.1,
            sx = this.x + (1.0 - scale) * halfHeartWidth,
            sy = this.y + (1.0 - scale) * halfHeartHeight;
        
        if (sx < x && sy + 4 * scale < y && sx + 2 * halfHeartWidth * scale > x && 
            y < halfHeartHeight * (x - sx) / halfHeartWidth + sy + halfHeartHeight * scale &&
            y < halfHeartHeight * (x - sx - 2 * halfHeartWidth * scale) / (-halfHeartWidth) + sy + halfHeartHeight * scale)
        {
            return true;
        }

        return false;       
    };
    
    function setUpGame()
    {
        playSound(soundBreakPath, 0);
        gameState = "beforeStart";
        gameCanvas.addEventListener("click", onMouseClick, false);  
        gameLoop();
    }
    
    function startGame()
    {
        hearts = [];
        brokenHearts = [];
        estimatedCreationTime = 0;
        unbrokenHeartCount = 0;
        levelDifficulty = level * interLevelDifficultyCoef;
        levelTimeLeft = levelTimePeriod;
        proceedInput = true;
        gameState = "started";
    }
    
    function drawScreen()
    {
        context.setTransform(1, 0, 0, 1, 0, 0);
        context.fillStyle = backgroundColor;
        context.fillRect(0, 0, canvasWidth, canvasHeight);
        
    //Starting draw loop here
        var i,
            length,
            brokenHeart,
            message;
    
        if (gameState === "started")
        {
        //display hearts
            length = hearts.length;
            
            for (i = 0; i < length; i++)
            {
                context.setTransform(1, 0, 0, 1, 0, 0);
                context.translate(hearts[i].x + halfHeartWidth, hearts[i].y + halfHeartHeight);
                context.scale(hearts[i].scale, hearts[i].scale);
                context.drawImage(heartSheet,
                                  0,
                                  0,
                                  halfHeartWidth * 2,
                                  halfHeartHeight * 2,
                                  -halfHeartWidth,
                                  -halfHeartHeight,
                                  halfHeartWidth * 2,
                                  halfHeartHeight * 2);
            }
            
        //display broken hearts
            length = brokenHearts.length;
        
            for (i = 0; i < length; i++)
            {
                brokenHeart = brokenHearts[i];
            //first heart half
                context.setTransform(1, 0, 0, 1, 0, 0);
                context.translate(brokenHeart.x + halfHeartWidth / 2 - brokenHeart.distance, brokenHeart.y + halfHeartHeight);
                context.scale(brokenHeart.scale, brokenHeart.scale);
                context.rotate(-brokenHeart.rotation);
                context.globalAlpha = brokenHeart.alpha;
                context.drawImage(heartSheet,
                                  halfHeartWidth * 2,
                                  0,
                                  halfHeartWidth,
                                  halfHeartHeight * 2,
                                  -halfHeartWidth / 2,
                                  -halfHeartHeight,
                                  halfHeartWidth,
                                  halfHeartHeight * 2);
            //second heart half
                context.setTransform(1, 0, 0, 1, 0, 0);
                context.translate(brokenHeart.x + halfHeartWidth * 3 / 2 + brokenHeart.distance, brokenHeart.y + halfHeartHeight);
                context.scale(brokenHeart.scale, brokenHeart.scale);
                context.rotate(brokenHeart.rotation);
                context.drawImage(heartSheet,
                                  halfHeartWidth * 3,
                                  0,
                                  halfHeartWidth,
                                  halfHeartHeight * 2,
                                  -halfHeartWidth / 2,
                                  -halfHeartHeight,
                                  halfHeartWidth,
                                  halfHeartHeight * 2);
            }
            context.globalAlpha = 1.0;
        }
        else //Showing animated text
        {
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
            
            var x = (canvasWidth/2),
                y = (canvasHeight/2),
                gradient = context.createLinearGradient(canvasWidth/2, 0, canvasWidth/2, canvasHeight);
            
            length = gradientColorStops.length;
            
            for (i = 0; i < length; i++)
            {
                var tempColorStop = gradientColorStops[i],
                    tempColor = tempColorStop.color,
                    tempStopPercent = tempColorStop.stopPercent;
                
                gradient.addColorStop(tempStopPercent,tempColor);
                tempStopPercent += 0.03;
                if (tempStopPercent > 1)
                {
                    tempStopPercent = 0;
                }
                tempColorStop.stopPercent = tempStopPercent;
                gradientColorStops[i] = tempColorStop;          
            }
            context.fillStyle = gradient;
            context.fillText (message, x, y);
        }
    }
    
    function gameLoop()
    {
        var i,
            scale;
        
    //hearth time scaling
        if (gameState === "started")
        {
            for (i = hearts.length - 1; i >= 0; i--)
            {
                scale = hearts[i].scale;
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
        
        //recalculate broken heart position
            for (i = brokenHearts.length - 1; i >= 0; i--)
            {
                brokenHearts[i].scale -= brokenHeartScaleCoef;
                brokenHearts[i].rotation += brokenHeartRotationCoef;
                brokenHearts[i].distance += brokenHeartDistanceCoef;
                brokenHearts[i].alpha -= brokenHeartAlphaeCoef;
                if (brokenHearts[i].alpha <= 0)
                {
                    brokenHearts.splice(i, 1);
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
        }
        
        window.setTimeout(gameLoop, gameLoopInterval);
        drawScreen();
    }
    
    function onMouseClick(event)
    {
        if (!proceedInput)
        {
            return;
        }
        
        mouseX = event.clientX - gameCanvas.offsetLeft;
        mouseY = event.clientY - gameCanvas.offsetTop;
        if (gameState === "beforeStart" || gameState === "beforeNextLevel")
        {
            window.setTimeout(startGame, 1000);
            proceedInput = false;
        }
        else if (gameState === "over" || gameState === "victory")
        {
            level = startLevel;
            window.setTimeout(startGame, 3000);
            proceedInput = false;           
        }
        else if (gameState === "started")
        {
            checkPointForEntry(mouseX, mouseY); 
        }
    }
    
    function checkPointForEntry(x, y)
    {
        var i,
            heart;
        
        for (i = hearts.length - 1; i >= 0; i--)
        {
            heart =  hearts[i];
            
            if (heart.isIn(x, y))
            {
                heart.alpha = 1.0;
                heart.rotation = 0.0;
                heart.distance = 0.0;
                brokenHearts.push(heart);
                hearts.splice(i, 1);
                playSound(soundBreakPath, soundVolume);
                return true;
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
    
    function playSound(sound, volume)
    {
        var soundFound = false,
            soundIndex = 0,
            tempSound;
        
        if (soundPool.length> 0)
        {
            while (!soundFound && soundIndex < soundPool.length)
            {
                tempSound = soundPool[soundIndex];
                if (tempSound.ended || !tempSound.wasPlayed)
                {
                    soundFound = true;
                    tempSound.wasPlayed = true;
                }
                else
                {
                    soundIndex++;
                }
            }
        }
        if (soundFound)
        {
            tempSound.volume = volume;
            tempSound.play();
        }
    }
}

window.addEventListener("load", heartBreaker, false);