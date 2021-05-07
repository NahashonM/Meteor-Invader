/* Constants */
const player_elevation = 100
const EnemyBoxPadding  = 10

/* Sprites */
const rock             = new Image();   rock.src = "/img/rock.svg";
const rock2            = new Image();  rock2.src = "/img/rock2.svg";
const rocket           = new Image(); rocket.src = "/img/c_rocket.svg";


/* Callback ID's */
let enemySpawnerId     = undefined
let enemyVIncreaseId   = undefined
let frameUpdateId      = undefined

/* Intervals */
let enemyVIncreaseInterval  = 10000     // interval between increasing enemy velocity
let enemySpawnInterval      = 1500      // interval between spawning next enemy

/* Delta Time */
let lastUpdate         = undefined
let timeDelta          = undefined

/* States */
let inGame             = false
let player             = undefined      // player object
let playerRect         = undefined      // player bounding collision box
let canvas             = undefined;     // reference to canvas DOM element
let ctx                = undefined;     // canvas drawing contex

/* Arrays */
let enemies     = []                    // enemies array
let projectiles = []                    // projectiles array 
let particles   = []                    // particles array

/* Velocities */
let enemy_velocity      = 6            // speed the rocks move in direction of player
let projectile_velocity = 30            // speed shootables move in direction of click

/* score */
let score            = 0

/* Classes: Player, Enemy, Projectile, Particle */


//
// Player Class
//
//  @param x, y  = x and y positions of the player
//  @param size  = radius of the player
//  @param img   = sprite to use for the player
//
class Player {

    constructor(x, y, size, img) {
        this.x = x - img.width / (size * 2)
        this.y = y - img.height / (size * 2)
        this.size = size 
        this.img = img
        this.angle = 0

        this.lastShootTime = 0

        addEventListener('mousemove', this.onMouseMove)
        addEventListener('mousedown', this.onMouseDown)
    }

    onMouseMove = (evt) => {
        let px = evt.clientX - (innerWidth / 2)
        let py = evt.clientY -(innerHeight - player_elevation)
        this.angle  = Math.atan2(py, px) + Math.PI / 2
    }

    onMouseDown = (evt) => {
        let px = evt.clientX - (innerWidth / 2)
        let py = evt.clientY -(innerHeight - player_elevation)
        this.angle  = Math.atan2(py, px) + Math.PI / 2

        // cool down before firing again
        let currentTime = new Date().getTime()
        if((currentTime - this.lastShootTime) > 350) {

            this.lastShootTime = currentTime

            // shoot
            let vx = Math.sin(this.angle);
            let vy = -Math.cos(this.angle);

            projectiles.push(
                                new Projectile(
                                    innerWidth / 2, 
                                    innerHeight - player_elevation,
                                    vx, vy, 5)
                            )
        }
    }




    getBoundingRect() {
        return {
            tl_x : (innerWidth/2) - (this.img.width / this.size) / 2,
            tl_y : innerHeight - player_elevation - (this.img.height / this.size) / 2,
            br_x : (innerWidth/2) + (this.img.width / this.size) / 2,
            br_y : (innerHeight - player_elevation * 1.27) + (this.img.height / this.size) / 2,
        }
    }


    draw() {
        
        ctx.save()

        ctx.translate(innerWidth/2, innerHeight - player_elevation)
        ctx.rotate( this.angle)

        let x = -(this.img.width / this.size) / 2
        let y = -(this.img.height / this.size) / 2

        ctx.drawImage( 
            this.img, 
            x, y, 
            this.img.width  / this.size, 
            this.img.height / this.size );

        ctx.restore()
    }


    destroy = () => {
        removeEventListener("mousemove", this.onMouseMove); 
        removeEventListener("mousedown", this.onMouseDown); 
    }
}
//
// End of Player Class ***************************************
//



//
// Enemy Class
//
//  @param x, y  = x and y positions of the enemy
//  @param size  = radius of the enemy
//  @param img   = sprite to use for the enemy
//
class Enemy {
    constructor(x, y, size, img) {
        this.x = x - img.width / (size * 2)
        this.y = y - img.height / (size * 2)
        this.size = size 
        this.img = img

        this.outOfBounds = false
    }


    testCollision(min_x, min_y, max_x, max_y ) {

        let x1 = this.x + EnemyBoxPadding
        let y1 = this.y + EnemyBoxPadding
        let x2 = this.x + (this.img.width  / this.size)  - EnemyBoxPadding
        let y2 = this.y + (this.img.height  / this.size) - EnemyBoxPadding

        if( ( min_x >= x1 && min_x <= x2 &&
              min_y >= y1 && min_y <= y2 )    ||

            ( max_x >= x1 && max_x <= x2 &&
              max_y >= y1 && max_y <= y2 )
        ){
            return true
        }else {
            return false
        }
    }


    draw() {
        let x = this.img.width  / this.size
        let y = this.img.height  / this.size

        // draw
        ctx.drawImage( this.img, this.x , this.y, x, y );

        // update 
        let px = (innerWidth / 2) - this.x
        let py = (innerHeight - player_elevation - 20) - this.y

        let angle = Math.atan2(py, px)
        this.x += Math.cos(angle) * timeDelta * enemy_velocity 
        this.y += Math.sin(angle) * timeDelta * enemy_velocity 
    }


}

//
// End of Enemy Class ***************************************
//



//
// Projectile Class
//
//  @param x, y     = x and y positions of the projectile
//  @param v_x, v_y = x and y velocity ratio of the projectile
//  @param size     = radius of the projectile
//  @param velocity = velocity of the projectile towards (v_x/y multiplier)
//
class Projectile{
    constructor( x, y, v_x, v_y, size = 10 ) {
        this.x = x
        this.y = y
        this.vx = v_x
        this.vy = v_y
        this.size = size

        this.outOfBounds = false
    }

    draw() {

        // draw
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size, 0, Math.PI*2)
        ctx.fillStyle = '#f0f'
        ctx.fill()

        // update
        this.x += this.vx * projectile_velocity * timeDelta
        this.y += this.vy * projectile_velocity * timeDelta

        // out of bound check
        if( (this.x + this.size) < 0 ||
            (this.x - this.size) > innerWidth ||
            (this.y - this.size) < 0 ||
            (this.y + this.size) > innerHeight 
          )
          this.outOfBounds = true
        
        return this.outOfBounds
    }

}
//
// End of Projectile Class ***************************************
//



//
// Particle Class  [TODO------]
//
class Particles {
    constructor() {
        
    }
}
