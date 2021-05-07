
/* UI refs */
let score_value = undefined

addEventListener('load', () => {
    canvas = document.getElementById('canvas')
    ctx    = canvas.getContext('2d')

    score_value = document.getElementById('score_value')

    document.getElementById('restart').addEventListener('click', () => { Restart() })
    
    addEventListener('resize', () => { ResizeCanvas() })

    UpdateScore()
    ResizeCanvas()
})





//
// Adjust canvas width and height to fit browser window
//
function ResizeCanvas() {
    canvas.width = innerWidth
    canvas.height = innerHeight
}

//
// Restart Game
//
function Restart() {
    if(!inGame) {
        Start()
    }

}

//
// update ui score text
//
function UpdateScore(value = 0) {
    score_value.innerHTML = value
}

//
// Random integer between and inclusive of min and max
//
function IRandom(min, max) { return Math.floor(Math.random()*(max+1 -min)+min) }

//
// Random real number between and inclusive of min and max
//
function FRandom(min, max) { return Math.random()*(max+1 -min)+min }


var prev = 0
//
// Spawns Enemies at intervals specified by 'enemySpawnInterval'
//
function IncreaseEnemyVelocity() {
    enemy_velocity++;
    if((enemy_velocity % 5) == 0 && prev !== enemy_velocity) {
        
        prev = enemy_velocity
        
        if(enemySpawnInterval > 400) {
            enemySpawnInterval -= 50;
            
            clearInterval(enemySpawnerId)
            enemySpawnerId = setInterval(SpawnEnemy, enemySpawnInterval)
        }
    }

}


//
// Spawns Enemies at intervals specified by 'enemySpawnInterval'
//
function SpawnEnemy() {

    //console.log("v: " + enemy_velocity + " spc: " + enemySpawnCount)

    // if((enemy_velocity % 5) === 0)
    //     enemySpawnCount++

    //for(let i = 0; i < enemySpawnCount; i++) {
        let img = undefined
        let rx  = undefined
        let ry  = undefined
        let size = IRandom(4, 8)

        // randomly choose rock type
        if(IRandom(0, 10) > 5)  img = rock
        else                    img = rock2

        // randomly choose rock position
        if( IRandom(0, 100) > 50) {
            rx = IRandom(0, innerWidth)
            ry = 0
        }else {
            if( IRandom(0, 100) > 50)
                rx = 0
            else
                rx = innerWidth

            ry = Math.random() * innerHeight / 1.2
        }

        enemies.push(new Enemy(rx,ry, size, img))
    //}
}



//
// Updates each frame
//
function UpdateFrame() {

    let currentTime = new Date().getTime()

    timeDelta  = (currentTime - lastUpdate) / 100;
    lastUpdate = currentTime

    // console.log(currentTime.toString() + "- " + lastUpdate + " = " + timeDelta)

    ctx.fillStyle = 'rgba(0,0,0,0.1)'
    ctx.fillRect(0,0, canvas.width, canvas.height)

    projectiles.forEach( (projectile, index) => {

        if(projectile.draw()) {             // Delete out of window Projectile
            setTimeout((index) => {
                projectiles.splice(index, 1)
            }, 0, index)
        }
    
    })

    enemies.forEach( (enemy, eIndex) => {
        enemy.draw()

        // check if enemy has collided with projectile
        projectiles.forEach( (projectile,pIndex) => {
            if( enemy.testCollision(
                    projectile.x - projectile.size,
                    projectile.y - projectile.size,
                    projectile.x + projectile.size,
                    projectile.y + projectile.size
                )) {
                    setTimeout((e, p) => {
                        enemies.splice(e, 1)
                        projectiles.splice(p, 1)
                    }, 0, eIndex, pIndex)

                    // update score
                    UpdateScore(++score)
                }
        })

        // check collision with player

        if(
            enemy.testCollision ( 
                playerRect.tl_x, playerRect.tl_y,
                 playerRect.br_x, playerRect.br_y ) )
        {
            // draw player one last time
            inGame = false
        }

    });
    
    player.draw()

    if(inGame)
        frameUpdateId = requestAnimationFrame(UpdateFrame)
    else 
        setTimeout(() => End());
}



//
// Starts the Game
// 
function Start() {

    enemyVIncreaseInterval = 10000
    enemySpawnInterval = 1500 
    enemy_velocity = 6
    lastUpdate     = 0
    score          = 0
    
    inGame          = true
    player          = new Player(innerWidth / 2, innerHeight, 5, rocket)
    
    playerRect = player.getBoundingRect()
    
    UpdateScore(score)

    frameUpdateId    = requestAnimationFrame(UpdateFrame);                      // start frames   
    enemySpawnerId   = setInterval( SpawnEnemy , enemySpawnInterval);           // start enemy spawning
    enemyVIncreaseId = setInterval( IncreaseEnemyVelocity , enemyVIncreaseInterval);  // start increasing enemy speed
}



//
// Ends the Game
// 
function End() {
    
    inGame = false

    clearInterval(enemySpawnerId);       // cancel enemy spawning
    clearInterval(enemyVIncreaseId);     // cancel enemy speed increase
    cancelAnimationFrame(frameUpdateId); // cancel frame
    
    enemies.splice(0, enemies.length)
    particles.splice(0, particles.length)
    projectiles.splice(0, projectiles.length)

    player.destroy()
    player = undefined
    
    //Start()
}