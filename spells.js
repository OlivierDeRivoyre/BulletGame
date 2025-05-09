const ravenTileSet = loadImg("RavenFantasyIcons32");
function getRavenSprite(i, j) {
    return new SimpleSprite(ravenTileSet, i * 32, j * 32, 32, 32);
}
const shikashiTileSet = loadImg("Shikashi");
function getShikashiTile(i, j) {
    return new SimpleSprite(shikashiTileSet, i * 32, j * 32, 32, 32);
}
const emptySprite = getShikashiTile(10, 1);
class Sounds {
    constructor() {
        function loadSound(name) {
            return new Audio("sound/" + name + ".wav");
        }
        this.lazer = loadSound("lazer");
        this.shotgun2b = loadSound("shotgun-2b");
    }
}
const sounds = new Sounds();

class FriendlyProjectile {
    constructor() {
        this.color = '#80F';
        this.isFriendly = true;
    }
    onHit(mob) {
        return false;
    }
    paint(x, y) {
        ctx.fillStyle = this.color;
        ctx.fillRect(x, y, 6, 6);
    }
}
class ProjectileAnim {
    constructor(projectile, from, to, range, speed) {
        this.projectile = projectile;
        this.x = from.x;
        this.y = from.y;
        const hypo = Math.sqrt(square(to.x - this.x) + square(to.y - this.y));
        if (hypo < 0.001) {
            this.vx = speed;
            this.vy = 0;
        } else {
            this.vx = speed * (to.x - this.x) / hypo;
            this.vy = speed * (to.y - this.y) / hypo;
        }
        this.tick = 0;
        this.maxTick = 1 + range / speed;
    }
    update(world) {
        this.tick++;
        this.x += this.vx;
        this.y += this.vy;
        return this.tick < this.maxTick;
    }
    paint(camera) {
        this.projectile.paint(camera.toCanvasX(this.x), camera.toCanvasY(this.y));
    }
}
class CircleAreaProjectile {
    constructor() {
        this.color = '#85d';
        this.isFriendly = true;
        this.radius = 64 * 1.5;
    }
    onHit(mob) {
        return true;
    }
    paint(x, y) {
        ctx.beginPath();
        ctx.arc(x, y, this.radius, 2 * Math.PI, 0);
        ctx.fillStyle = this.color;
        ctx.fill();
    }
}
class DurationAnim {
    constructor(projectile, tickCount, coord) {
        this.projectile = projectile;
        this.maxTick = tickCount;
        this.x = coord.x;
        this.y = coord.y;
        this.tick = 0;
    }
    update(world) {
        this.tick++;
        return this.tick < this.maxTick;
    }
    paint(camera) {
        this.projectile.paint(camera.toCanvasX(this.x), camera.toCanvasY(this.y));
    }
}
class NoSpell {
    constructor() {
        this.sprite = emptySprite;
    }
    tryTrigger(player, mouseCoord, world) {
    }
}
class BasicAttack {
    constructor() {
        this.projectile = new FriendlyProjectile();
        this.attackPeriod = 10;
        this.lastAttackTick = -9999;
        this.sprite = getRavenSprite(0, 93);
    }
    tryTrigger(player, mouseCoord, world) {
        if (world.tick < this.lastAttackTick + this.attackPeriod) {
            return;
        }
        this.lastAttackTick = world.tick;
        world.friendlyProjectiles.push(new ProjectileAnim(this.projectile, player.getCenterCoord(), mouseCoord, 32 * 5, 15));
        sounds.lazer.play();
    }
}
class ShotgunAttack {
    constructor() {
        this.projectile = new FriendlyProjectile();
        this.projectile.color = '#44f';
        this.attackPeriod = 30 * 5;
        this.lastAttackTick = -9999;
        this.sprite = getRavenSprite(2, 62);
    }
    tryTrigger(player, mouseCoord, world) {
        if (world.tick < this.lastAttackTick + this.attackPeriod) {
            return;
        }
        this.lastAttackTick = world.tick;
        const from = player.getCenterCoord();
        const baseAngus = Math.atan2(mouseCoord.y - from.y, mouseCoord.x - from.x);
        for (let i = 1; i <= 5; i++) {
            const angus = baseAngus + (i - 3) * 0.20;
            const target = {
                x: from.x + 256 * Math.cos(angus),
                y: from.y + 256 * Math.sin(angus),
            };
            world.friendlyProjectiles.push(new ProjectileAnim(this.projectile, from, target, 32 * 3, 10));
        }
        sounds.shotgun2b.play();
    }
}
class ZoneSpell {
    static maxRangeCoord(from, to, maxRange) {
        const d = Math.sqrt(square(to.x - from.x) + square(to.y - from.y));
        if(d < maxRange){
            return {x: to.x, y : to.y};
        }
        const ratio = maxRange / d;
        return {
            x: from.x + (to.x - from.x) * ratio,
            y: from.y + (to.y - from.y) * ratio,
        }
    }
    constructor(projectile) {
        this.projectile = projectile;
        this.sprite = getRavenSprite(4, 48);  
        this.attackPeriod = 60;
        this.lastAttackTick = -9999;
        this.range = 64 * 5;
        this.radius = 64 * 5;
        this.duration = 30 * 5;      
    }
    tryTrigger(player, mouseCoord, world) {
        if (world.tick < this.lastAttackTick + this.attackPeriod) {
            return;
        }
        this.lastAttackTick = world.tick;
        
        const center = ZoneSpell.maxRangeCoord(player.getCenterCoord(), mouseCoord, this.range);
        world.friendlyProjectiles.push(new DurationAnim(this.projectile, this.duration, center));        
    }
}

class AllSpells {
    constructor() {
        this.noSpell = new NoSpell();
        this.basicAttack = new BasicAttack();
        this.shotgun = new ShotgunAttack();
        this.curseGround = new ZoneSpell(new CircleAreaProjectile());
        this.shotgun2 = new ShotgunAttack();
        this.shotgun3 = new ShotgunAttack();
        this.shotgun4 = new ShotgunAttack();
        this.shotgun5 = new ShotgunAttack();
    }
}
const allSpells = new AllSpells();