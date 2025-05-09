const ravenTileSet = loadImg("RavenFantasyIcons32");
function getRavenSprite(i, j) {
    return new SimpleSprite(ravenTileSet, i * 32, j * 32, 32, 32);
}
const shikashiTileSet = loadImg("Shikashi");
function getShikashiTile(i, j) {
    return new SimpleSprite(shikashiTileSet, i * 32, j * 32, 32, 32);
}
const emptySprite = getShikashiTile(10,1);
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
class NoSpell {
    constructor() {
        this.sprite = emptySprite;
    }
    tryTrigger(player, mouseCoord, world) {
    }
}

class AllSpells {
    constructor() {
        this.noSpell = new NoSpell();
        this.basicAttack = new BasicAttack();
        this.shotgun = new ShotgunAttack();
        this.shotgun2 = new ShotgunAttack();
        this.shotgun3 = new ShotgunAttack();
        this.shotgun4 = new ShotgunAttack();
        this.shotgun5 = new ShotgunAttack();
    }
}
const allSpells = new AllSpells();