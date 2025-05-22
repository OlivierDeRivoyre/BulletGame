
class Player {
    constructor(id) {
        this.id = id;
        this.x = 32 * 5;
        this.y = 32 * 5;
        this.vx = 0;
        this.vy = 0;
        this.inputX = 0;
        this.inputY = 0;
        this.sprite = getDungeonTileSetHeroSprite(this.id * 5, this.id == 0 ? 14 : 10);
        this.lastHitTick = -999;
        this.lastHealTick = -999;
        this.maxLife = 100;
        this.life = this.maxLife;
        this.buffs = [];
        this.castingUntilTick = -999;
        this.lookLeft = false;
        this.worldLevel = null;
    }
    initLevel(worldLevel, x, y) {
        this.worldLevel = worldLevel;
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.inputX = 0;
        this.inputY = 0;
        this.lastHitTick = -999;
        this.lastHealTick = -999;
        this.life = this.maxLife;
        this.buffs = [];
        this.castingUntilTick = -999;
    }
    getCenterCoord() {
        return { x: this.x + this.sprite.tWidth, y: this.y + this.sprite.tHeight };
    }
    updateLocalPlayer(input, worldLevel) {
        let changed = false;
        if (this.life <= 0) {
            return false;
        }
        if (input.keysPressed.left) {
            if (this.inputX != -1) {
                this.inputX = -1;
                //   this.vx = 0;
                changed = true;
            }
        } else if (input.keysPressed.right) {
            if (this.inputX != 1) {
                this.inputX = 1;
                //  this.vx = 0;
                changed = true;
            }
        } else if (this.inputX != 0) {
            this.inputX = 0;
            // this.vx = 0;
            changed = true;
        }
        if (input.keysPressed.up) {
            if (this.inputY != -1) {
                this.inputY = -1;
                //    this.vy = 0;
                changed = true;
            }
        } else if (input.keysPressed.down) {
            if (this.inputY != 1) {
                this.inputY = 1;
                //  this.vy = 0;
                changed = true;
            }
        } else if (this.inputY != 0) {
            this.inputY = 0;
            //  this.vy = 0;
            changed = true;
        }
        return changed;
    }
    update() {
        for (let i = this.buffs.length - 1; i >= 0; i--) {
            if (tickNumber > this.buffs[i].endTick) {
                this.buffs.splice(i, 1);
            }
        }
        if (this.life <= 0) {
            return;
        }
        const isCasting = this.castingUntilTick > tickNumber;
        const maxSpeed = 4;
        function getNewSpeed(v, input) {
            if (isCasting) {
                return 0;
            }
            return Math.sign(input) * maxSpeed;
        }
        let targetVx = getNewSpeed(this.vx, this.inputX);
        let targetVy = getNewSpeed(this.vy, this.inputY);
        const norm = Math.sqrt(square(this.vx) + square(this.vy));
        if (norm > maxSpeed) {
            targetVx = targetVx * maxSpeed / norm;
            targetVy = targetVy * maxSpeed / norm;
        }
        const acc = 0.5;
        function accelerate(currentV, targetV) {
            const diff = targetV - currentV;
            if (Math.abs(diff) < acc) {
                return targetV
            }
            return currentV + Math.sign(diff) * acc;
        }
        this.vx = accelerate(this.vx, targetVx);
        this.vy = accelerate(this.vy, targetVy);

        this.x += this.vx;
        this.y += this.vy;
        if (Math.abs(this.vx) > 0.01) {
            this.lookLeft = this.vx < 0;
        }
    }

    paint(camera) {
        const canvasX = camera.toCanvasX(this.x);
        const canvasY = camera.toCanvasY(this.y);
        if (this.life <= 0) {
            this.sprite.paintRotate(canvasX, canvasY, Math.PI / 2);
            deadSprite.paint(canvasX, canvasY + 10);
            return;
        }
        if (this.lastHitTick + 5 >= tickNumber) {
            ctx.fillStyle = 'red';
            ctx.fillRect(canvasX, canvasY, this.sprite.tWidth * 2, this.sprite.tHeight * 2);
        }
        if (this.lastHealTick + 5 >= tickNumber) {
            ctx.fillStyle = 'green';
            ctx.fillRect(canvasX, canvasY, this.sprite.tWidth * 2, this.sprite.tHeight * 2);
        }
        for (let buff of this.buffs) {
            if (buff.paintFunc) {
                buff.paintFunc(this, camera);
            }
        }
        this.sprite.paint(canvasX, canvasY, (tickNumber % 16) < 8, this.lookLeft);
        this.paintLifebar(canvasX, canvasY)
    }
    paintLifebar(canvasX, canvasY) {
        let top = canvasY + this.sprite.tHeight * 2;
        ctx.fillStyle = "black";
        ctx.fillRect(canvasX, top + 2, this.sprite.tWidth * 2, 4);
        ctx.fillStyle = "green";
        ctx.fillRect(canvasX, top + 2, this.life * this.sprite.tWidth * 2 / this.maxLife, 4);
    }
    getMsg() {
        return {
            t: 'playerMove',
            id: this.id,
            x: this.x,
            y: this.y,
            vx: this.vx,
            vy: this.vy,
            ix: this.inputX,
            iy: this.inputY,
            ij: this.isJumping,
            life: this.life,
            maxLife: this.maxLife,
            buffs: this.buffs.map(b => b.getMsg())
        };
    }
    onMessage(msg) {
        if (msg.id != this.id) {
            throw new Error("bad idea")
        }
        this.x = msg.x;
        this.y = msg.y;
        this.vx = msg.vx;
        this.vy = msg.vy;
        this.inputX = msg.ix;
        this.inputY = msg.iy;
        this.isJumping = msg.ij;
        this.life = msg.life;
        this.maxLife = msg.maxLife;
    }
    onHit(damage, worldLevel, projectile) {
        this.lastHitTick = tickNumber;
        if (this.worldLevel.localPlayer != this) {
            return;
        }
        for (let i = 0; i < this.buffs.length; i++) {
            if (this.buffs[i].id == BuffId.shield) {
                this.buffs.splice(i, 1);
                sounds.bubble.play();
                return;
            }
        }
        this.life = Math.max(0, this.life - damage);
        this.worldLevel.updates.push(this.getMsg());
    }



    onHeal(heal, worldLevel, projectile) {
        this.lastHealTick = tickNumber;
        this.life = Math.min(this.maxLife, this.life + heal);
    }
    addBuff(buff) {
        buff.endTick = tickNumber + buff.duration * 30;
        for (let i = 0; i < this.buffs.length; i++) {
            if (this.buffs[i].id == buff.id) {
                this.buffs[i] = this.id;
                return;
            }
        }
        this.buffs.push(buff)
    }
}

class ActionBar {
    static MaxSpells = 5;
    constructor(player, worldLevel) {
        this.player = player;
        this.worldLevel = worldLevel;
        this.spells = new Array(ActionBar.MaxSpells);
        this.basicAttack = allSpells.basicAttack;
        this.spells[0] = allSpells.curseGround;
        this.spells[1] = allSpells.rootingProjectile;
        this.spells[2] = allSpells.healProjectile;
        this.spells[3] = allSpells.protectSpell;
        this.spells[4] = allSpells.shotgun;
        this.topX = 400;
        this.height = 60;
        this.width = 172;
        this.topY = CanvasHeight - this.height;
        this.shortcuts = ['Q', 'E', 'F', 'SPC', 'M2'];
        this.castingSpell = null;
        this.startCastingAtTick = -999;
        this.castingUntilTick = -999;
        this.maxMana = 100;
        this.mana = this.maxMana;
        this.regenMana = 5;
    }
    tryTrigger(spell) {
        if (spell.lastAttackTick && tickNumber < spell.lastAttackTick + spell.cooldown * 30) {
            return false;
        }
        if (this.mana < spell.mana) {
            return false;
        }
        if (spell.castingTime <= 0) {
            this.castSpell(spell);
            return true;
        }
        this.castingSpell = spell;
        this.player.castingUntilTick = tickNumber + Math.ceil(spell.castingTime * 30);
        this.castingUntilTick = this.player.castingUntilTick;
        this.startCastingAtTick = tickNumber;
        return true;
    }
    castSpell(spell) {
        spell.trigger(this.player, this.worldLevel.camera.toWorldCoord(input.mouse), this.worldLevel);
        spell.lastAttackTick = tickNumber;
        this.mana = Math.max(0, this.mana - spell.mana);
    }
    update(input) {
        if (this.player.life <= 0) {
            return;
        }
        if (input.keysPressed.s4 && this.worldLevel.exitCell && this.worldLevel.exitCell.isPlayerInside(this.player)) {
            input.keyPressed.s4 = false;
            const msg = this.worldLevel.exitCell.trigger(this.worldLevel);
            this.worldLevel.updates.push(msg);
            return;
        }
        if (tickNumber % 30 == 0) {
            this.mana = Math.min(this.maxMana, this.mana + this.regenMana);
        }
        if (this.castingSpell != null) {
            if (this.castingUntilTick <= tickNumber) {
                this.castSpell(this.castingSpell)
                this.castingSpell = null;
            }
            return;
        }

        let castedSpell = null;
        if (input.mouse2Clicked && this.tryTrigger(this.spells[4])) {
            castedSpell = this.spells[4];
        }
        else if (input.keysPressed.s1 && this.tryTrigger(this.spells[0])) {
            castedSpell = this.spells[0];
        }
        else if (input.keysPressed.s2 && this.tryTrigger(this.spells[1])) {
            castedSpell = this.spells[1];
        }
        else if (input.keysPressed.s3 && this.tryTrigger(this.spells[2])) {
            castedSpell = this.spells[2];
        }
        else if (input.keysPressed.s4 && this.tryTrigger(this.spells[3])) {
            castedSpell = this.spells[3];
        }
        else if (input.mouseClicked && this.tryTrigger(this.basicAttack)) {
            castedSpell = this.basicAttack;
        }
        if (castedSpell == null) {
            return [];
        }
        const target = this.worldLevel.camera.toWorldCoord(input.mouse);
        this.worldLevel.updates.push({
            t: 'playerCastSpell',
            spell: castedSpell.id,
            target: target,
            playerId: this.player.id,
            playerX: this.player.x,
            playerY: this.player.y,
        });
    }
    onMessage(m) {
        const player = this.worldLevel.players[m.playerId];
        const spell = allSpells[m.spell];
        spell.trigger(player, m.target, this.worldLevel);
    }
    paint() {
        if (this.castingSpell != null) {
            this.paintCastingBar(this.topX + 2, this.topY - 10, this.castingSpell);
        }
        ctx.fillStyle = '#222';
        ctx.fillRect(this.topX, this.topY, this.width, this.height);
        for (let i = 0; i < this.spells.length; i++) {
            this.paintSpell(i);
        }
        this.paintManaLifeBar(this.topX + 2, this.topY + 36, this.player.life / this.player.maxLife, 'green', 12);
        this.paintManaLifeBar(this.topX + 2, this.topY + 50, this.mana / this.maxMana, 'blue', 8);
    }
    paintCastingBar(topX, topY, spell) {
        ctx.fillStyle = "#0008";
        const width = this.width;
        ctx.fillRect(topX, topY, width, 4);
        const total = this.castingUntilTick - this.startCastingAtTick;
        const current = tickNumber - this.startCastingAtTick;
        ctx.fillStyle = "#b71";
        ctx.fillRect(topX, topY, current * width / total, 4);
    }
    paintSpell(i) {
        const spell = this.spells[i];
        if (spell == null) {
            return;
        }
        const buttonX = 2 + this.topX + i * 34;
        const buttonY = 2 + this.topY;
        ctx.fillStyle = '#444';
        ctx.fillRect(buttonX, this.topY + 2, 32, 32);
        spell.sprite.paintScale(buttonX, buttonY, 32, 32);

        if (spell == this.castingSpell) {
            const total = this.castingUntilTick - this.startCastingAtTick;
            const current = tickNumber - this.startCastingAtTick;
            const progress = current / total;
            this.paintProgressOverSpell(buttonX, buttonY, progress, '#b718');
        }
        if (spell.lastAttackTick && tickNumber < spell.lastAttackTick + spell.cooldown * 30) {
            ctx.fillStyle = '#4448';
            ctx.fillRect(buttonX, this.topY + 2, 32, 32);
            const cooldownFor = tickNumber - spell.lastAttackTick;
            const cooldownRatio = 1 - cooldownFor / (spell.cooldown * 30);
            this.paintProgressOverSpell(buttonX, buttonY, cooldownRatio, '#222c');
            //TODO: show cooldown in sec in middle of the icon
        }
        else if (spell.mana != 0 && this.mana < spell.mana) {
            const ratio = 1 - this.mana / spell.mana;
            ctx.fillStyle = '#44f8';
            ctx.fillRect(buttonX, this.topY + 2, 32, 32);
            this.paintProgressOverSpell(buttonX, buttonY, ratio, '#22fc');
        }
        ctx.fillStyle = "white";
        ctx.font = "12px Consolas";
        ctx.textRendering = "geometricPrecision";
        ctx.fillText(this.shortcuts[i], buttonX + 2, buttonY + 30);
    }
    paintProgressOverSpell(buttonX, buttonY, ratio, color) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(buttonX, buttonY, 32, 32);
        ctx.clip();
        ctx.beginPath();
        ctx.moveTo(buttonX + 16, buttonY + 16);
        ctx.lineTo(buttonX + 16, buttonY);
        ctx.arc(buttonX + 16, buttonY + 16, 30, -0.5 * Math.PI, -0.5 * Math.PI - 2 * ratio * Math.PI, true);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
        ctx.restore();
    }
    paintManaLifeBar(topX, topY, ratio, color, height) {
        const width = this.width - 4;
        ctx.fillStyle = "#0008";
        ctx.fillRect(topX, topY, width, height);
        ctx.fillStyle = color;
        ctx.fillRect(topX, topY, width * ratio, height);
    }
}

class AggroMobBrain {
    init(mob, worldLevel) {
        this.mob = mob;
        this.worldLevel = worldLevel;
        this.intialCoord = { x: this.mob.x, y: this.mob.y };
        this.targetCoord = null;
        this.targetPlayer = null;
        this.fireRange = 6;
        this.speed = 3;
        this.walkAroundPlayerUntil = -9999;
    }
    update() {
        if (this.targetPlayer != null && this.targetPlayer.life <= 0) {
            this.targetPlayer = this.worldLevel.findNearestPlayer(this.mob);
        }
        if (this.targetCoord != null && distanceSquare(this.mob, this.targetCoord) < square(this.speed)) {
            this.targetCoord = null;
        }
        let destCoord;
        if (this.targetPlayer != null) {
            const distanceToPlayer = distanceSquare(this.mob, this.targetPlayer);
            if (distanceToPlayer < square((this.fireRange + 3) * 64)) {
                this.mob.tryShoot(this.targetPlayer.getCenterCoord(), this.worldLevel);
            }
            if (this.targetCoord != null && tickNumber < this.walkAroundPlayerUntil) {
                destCoord = this.targetCoord;
            } else if (distanceToPlayer < square(64 * 1.5)) {
                this.targetCoord = AggroMobBrain.getRandomTargetCoord(this.mob, this.intialCoord, this.worldLevel);
                this.walkAroundPlayerUntil = tickNumber + 30 * 1;
                destCoord = this.targetCoord;
            } else {
                destCoord = this.targetPlayer;
                this.targetCoord = null;
            }
        } else {
            if (this.targetCoord == null) {
                this.targetCoord = AggroMobBrain.getRandomTargetCoord(this.mob, this.intialCoord, this.worldLevel);
            }
            destCoord = this.targetCoord;
        }
        const d = computeDistance(this.mob, destCoord);
        if (d < 0.01) {
            return;
        }

        if (this.mob.buffs.find(b => b.id == BuffId.root)) {
            return;
        }

        const vx = this.speed * (destCoord.x - this.mob.x) / d;
        const vy = this.speed * (destCoord.y - this.mob.y) / d;
        this.mob.x += vx;
        this.mob.y += vy;
    }
    onHit() {
        if (this.targetPlayer == null) {
            this.targetPlayer = this.worldLevel.findNearestPlayer(this.mob);
        }
    }
    static getRandomTargetCoord(mob, initialCoord, worldLevel) {
        function getNextCoord(quarter) {
            const angus = Math.PI * 2 * (quarter % 8) / 8;
            const dx = Math.sign(Math.floor(Math.cos(angus) * 10));
            const dy = Math.sign(Math.floor(Math.sin(angus) * 10));
            let nextCoord = {
                x: mob.x + dx * 64,
                y: mob.y + dy * 64,
            };
            const dist1 = distanceSquare(nextCoord, initialCoord);
            if (dist1 > 64 * 64 * 4 * 4) {
                const otherCoord = {
                    x: mob.x - dx * 64,
                    y: mob.y - dy * 64,
                };
                if (distanceSquare(otherCoord, initialCoord) < dist1) {
                    nextCoord = otherCoord;
                }
            }
            return nextCoord;
        }
        mob.seed = getNextRand(mob.seed);
        for (let i = 0; i < 8; i++) {
            const nextCoord = getNextCoord(mob.seed + i);
            const targetCell = worldLevel.map.getCell(nextCoord.x, nextCoord.y);
            if (targetCell.canWalk) {
                return nextCoord;
            }
        }
        return initialCoord;
    }
}

class Mob {
    constructor(sprite, brain, spell, x, y) {
        this.sprite = sprite;
        this.brain = brain;
        this.spell = spell;
        this.x = x;
        this.y = y;
        this.initialX = x;
        this.initialY = y;
        this.maxLife = 100;
        this.life = this.maxLife;
        this.lastHitTick = -9999;
        this.lastShootTick = -9999;
        this.buffs = [];
        this.lookLeft = false;
        this.createExitCell = false;
        this.seed = 0;
    }
    init(id, worldLevel, mobSeed) {
        this.id = id;
        this.worldLevel = worldLevel;
        this.seed = mobSeed;
        this.brain.init(this, worldLevel);
    }
    getCenterCoord() {
        return { x: this.x + this.sprite.tWidth, y: this.y + this.sprite.tHeight };
    }
    update() {
        for (let i = this.buffs.length - 1; i >= 0; i--) {
            if (tickNumber > this.buffs[i].endTick) {
                this.buffs.splice(i, 1);
            }
        }
        if (this.life <= 0) {
            return;
        }
        const oldX = this.x;
        this.brain.update();
        if (this.x != oldX) {
            this.lookLeft = this.x < oldX;
        }
    }
    tryShoot(target, worldLevel) {
        if (tickNumber < this.lastShootTick + this.spell.cooldown * 30) {
            return;
        }
        if (this.spell.trigger(this, target, worldLevel)) {
            this.lastShootTick = tickNumber;
        }
    }
    paint(camera) {
        const canvasX = camera.toCanvasX(this.x);
        const canvasY = camera.toCanvasY(this.y);
        if (this.life <= 0) {
            this.sprite.paintRotate(canvasX, canvasY, Math.PI / 2);
            deadSprite.paint(canvasX, canvasY + 10);
            return;
        }
        if (this.lastHitTick + 5 >= tickNumber) {
            ctx.fillStyle = 'red';
            ctx.fillRect(canvasX, canvasY, this.sprite.tWidth * 2, this.sprite.tHeight * 2);
        }
        this.sprite.paint(canvasX, canvasY, (tickNumber % 40) < 20, this.lookLeft);
        this.paintLifebar(canvasX, canvasY);
    }
    paintLifebar(canvasX, canvasY) {
        let top = canvasY + this.sprite.tHeight * 2;
        ctx.fillStyle = "black";
        ctx.fillRect(canvasX, top + 2, this.sprite.tWidth * 2, 4);
        ctx.fillStyle = "green";
        ctx.fillRect(canvasX, top + 2, this.life * this.sprite.tWidth * 2 / this.maxLife, 4);
    }
    onHit(damage, worldLevel, projectile, fromPlayer) {
        if (!fromPlayer) {
            throw new Error("missing fromPlayer");
        }
        if (fromPlayer == this.worldLevel.remotePlayer) {
            return;
        }
        this.decreaseLife(damage);
        const msg = this.getMsg();
        msg.t = 'mobHit';
        msg.damage = damage;
        this.worldLevel.updates.push(msg);
    }
    decreaseLife(damage) {
        this.life = Math.max(0, this.life - damage);
        this.lastHitTick = tickNumber;
        this.brain.onHit();
        if (this.life <= 0 && !this.worldLevel.exitCell) {
            this.worldLevel.exitCell = new ExitCell(this.initialX, this.initialY);
        }
    }
    onHeal(heal, worldLevel, projectile, fromCharacter) {
    }
    addBuff(buff, fromCharacter) {
        if (!buff.endTick || buff.endTick <= 0) {
            buff.endTick = tickNumber + buff.duration * 30;
        }
        for (let i = 0; i < this.buffs.length; i++) {
            if (this.buffs[i].id == buff.id) {
                this.buffs[i] = buff;
                return;
            }
        }
        this.buffs.push(buff)
    }
    getMsg() {
        return {
            id: this.id,
            x: this.x,
            y: this.y,
            life: this.life,
            seed: this.seed,
            buffs: this.buffs.map(b => b.getMsg()),
            // ...
        };
    }
    refreshFromMsg(msg) {
        this.x = msg.x;
        this.y = msg.y;
        if (msg.t != 'mobHit') {
            this.life = msg.life;
        }
        this.seed = msg.seed;
        if (msg.t == 'mobHit') {
            this.decreaseLife(msg.damage);
        }
        for (let buff of msg.buffs) {
            this.addBuff(Buff.fromMsg(buff));
        }
    }
}
class CellColorSprite {
    constructor(color) {
        this.color = color;
    }
    paint(x, y) {
        ctx.beginPath();
        ctx.lineWidth = 0;
        ctx.fillStyle = this.color;
        ctx.rect(x, y, 64, 64);
        ctx.fill();
    }
}
class CellDecoSprite {
    constructor(sprite, offsetX, offsetY) {
        this.sprite = sprite;
        this.offsetX = offsetX;
        this.offsetY = offsetY;
    }
    paint(x, y) {
        this.sprite.paintScale(x + this.offsetX, y + this.offsetX, 32, 32);
    }
}
class CellSpriteFactory {
    constructor() {
        this.grass1 = new CellColorSprite('#509060');
        this.grass2 = new CellColorSprite('#509360');
        this.water = new CellColorSprite('#55B');
        this.chunkTrunk = new CellDecoSprite(getOutdoorDecorSprite(0, 2), 16, 16);
        this.rock = new CellDecoSprite(getOutdoorDecorSprite(2, 2), 16, 16);
        this.grassSmallDecosSprites = [
            getOutdoorDecorSprite(0, 0),
            getOutdoorDecorSprite(1, 0),
            getOutdoorDecorSprite(2, 0),
            getOutdoorDecorSprite(0, 1),
            getOutdoorDecorSprite(1, 1),
            getOutdoorDecorSprite(2, 1),
            getOutdoorDecorSprite(3, 1),
            getOutdoorDecorSprite(4, 1),
            getOutdoorDecorSprite(5, 1),
            getOutdoorDecorSprite(6, 1),
            getOutdoorDecorSprite(1, 2),
            getOutdoorDecorSprite(5, 2),
            //getOutdoorDecorSprite(6, 2),
            getOutdoorDecorSprite(2, 7),
            getOutdoorDecorSprite(0, 8),
            getOutdoorDecorSprite(1, 8),
            getOutdoorDecorSprite(0, 9),
            getOutdoorDecorSprite(1, 9),
            getOutdoorDecorSprite(0, 10),
            getOutdoorDecorSprite(1, 10),
            getOutdoorDecorSprite(0, 11),
            getOutdoorDecorSprite(1, 11),
        ];


    }
}
const cellSpriteFactory = new CellSpriteFactory();
class Cell {
    constructor(cellSprites, prop) {
        this.cellSprites = cellSprites;
        prop = prop || {};
        this.canWalk = prop.canWalk === undefined ? true : prop.canWalk;
    }
    paint(x, y) {
        for (let s of this.cellSprites) {
            s.paint(x, y);
        }
    }
    static getGrassCell(i, j, seed) {
        const grass = (i + j) % 2 == 0 ? cellSpriteFactory.grass1 : cellSpriteFactory.grass2;
        const layers = [grass];
        if (seed % 19 == 7) {
            layers.push(cellSpriteFactory.chunkTrunk)
        } else if (seed % 23 == 8) {
            layers.push(cellSpriteFactory.rock)
        } else {
            const coords = [
                { x: 0, y: 0, mod: 191 },
                { x: 32, y: 0, mod: 193 },
                { x: 0, y: 32, mod: 197 },
                { x: 32, y: 32, mod: 199 },
            ]
            for (let c of coords) {
                const index = seed % c.mod;
                if (index < cellSpriteFactory.grassSmallDecosSprites.length) {
                    const decoSprite = cellSpriteFactory.grassSmallDecosSprites[index];
                    layers.push(new CellDecoSprite(decoSprite, c.x, c.y));
                }
            }
        }
        return new Cell(layers);
    }
}

class LevelBackground {
    constructor() {
        this.borderCell = new Cell([cellSpriteFactory.water], { canWalk: false });
        this.cells = new Array(10);
        let seed = 1;
        for (var j = 0; j < this.cells.length; j++) {
            this.cells[j] = new Array(30);
            for (var i = 0; i < this.cells[j].length; i++) {
                seed = getNextRand(seed);
                this.cells[j][i] = Cell.getGrassCell(i, j, seed);
            }
        }
    }
    getCell(x, y) {
        const i = Math.floor(x / 64);
        const j = Math.floor(y / 64);
        if (j < 0 || j >= this.cells.length) {
            return this.borderCell;
        }
        const row = this.cells[j];
        if (i < 0 || i >= row.length) {
            return this.borderCell;
        }
        return row[i];
    }
    paint(camera) {
        const topX = camera.topX;
        const topY = camera.topY;
        const offsetX = Math.floor(topX / 64) * 64 - topX;
        const offsetY = Math.floor(topY / 64) * 64 - topY;
        for (let j = -1; j <= CanvasCellHeight; j++) {
            for (let i = -1; i <= CanvasCellWidth; i++) {
                const x = topX + i * 64;
                const y = topY + j * 64;
                this.getCell(x, y).paint(offsetX + i * 64, offsetY + j * 64);
            }
        }
    }
}

class ExitCell {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.sprite = getRavenSprite(2, 0);
    }
    paint(camera) {
        const canvasX = camera.toCanvasX(this.x);
        const canvasY = camera.toCanvasY(this.y);
        this.sprite.paint(canvasX, canvasY)
    }
    trigger(worldLevel) {
        if (worldLevel.isServer) {
            game.currentView = game.worldMap;
            return { t: 'exitLevel' };
        } else {
            game.currentView = game.worldMap;
            return { t: 'exitLevelRequest' };
        }

    }
    isPlayerInside(player) {
        return distanceSquare(this, player) < square(32);
    }
}

class WorldLevel {
    constructor(isServer, players) {
        this.isServer = isServer;
        this.players = players;
        this.mouse = null;
        this.localPlayer = players[isServer ? 0 : 1];
        this.remotePlayer = players[isServer ? 1 : 0];
        if (!this.localPlayer) {
            throw new Error(`Player not found ${localPlayerId}`);
        }
        this.camera = new CameraOffset(this.localPlayer);
        this.actionBar = new ActionBar(this.localPlayer, this);
        this.level = new LevelContent();
        this.map = this.level.map;
        this.mobs = this.level.mobs;
        this.projectiles = [];
        this.annimAdded = false;
        this.mobs[this.mobs.length - 1].createExitCell = true;
        this.updates = [];
    }
    startLevel(level) {
        this.level = level;
        this.map = this.level.map;
        this.mobs = this.level.mobs;
        for (let i = 0; i < this.players.length; i++) {
            this.players[i].initLevel(this, 32 * (5 * i), 32 * 5);
        }
        this.projectiles = [];
        for (let i = 0; i < this.mobs.length; i++) {
            this.mobs[i].init(i, this, i);
        }
        this.exitCell = null;
    }
    addProjectile(anim) {
        this.projectiles.push(anim);
        this.annimAdded = true;
    }
    update() {
        this.updates = [];
        if (this.annimAdded) {
            this.projectiles.sort((a, b) => a.zIndex - b.zIndex);
            this.annimAdded = false;
        }
        const changed = this.localPlayer.updateLocalPlayer(input, this);
        for (let p of this.players) {
            p.update();
        }
        this.camera.update();
        if (changed || tickNumber % 30 == 0) {
            this.updates.push(this.localPlayer.getMsg());
        }
        this.moveProjectiles(this.projectiles);
        for (let m of this.mobs) {
            m.update(this);
        }
        this.checkBulletsHitOnAll(this.projectiles)
        this.actionBar.update(input, this);
        return this.updates;
    }
    moveProjectiles(projectiles) {
        for (let i = projectiles.length - 1; i >= 0; i--) {
            if (!projectiles[i].update(this)) {
                projectiles.splice(i, 1);
            }
        }
    }
    checkBulletsHitOnAll(projectiles) {
        for (let i = projectiles.length - 1; i >= 0; i--) {
            if (!this.checkBulletHitOnAll(projectiles[i])) {
                projectiles.splice(i, 1);
            }
        }
    }
    checkBulletHitOnAll(projectile) {
        if (projectile.targerPlayers) {
            for (let c of this.players.filter(c => c.life > 0)) {
                if (!projectile.checkHit(c, this)) {
                    return false;
                }
            }
        }
        if (projectile.targerMobs) {
            for (let c of this.mobs.filter(c => c.life > 0)) {
                if (!projectile.checkHit(c, this)) {
                    return false;
                }
            }
        }
        return true;
    }
    findNearestPlayer(coord) {
        let minD = 999999999;
        let player = null;
        for (let p of this.players) {
            if (p.life > 0) {
                const d = distanceSquare(p, coord);
                if (d < minD) {
                    minD = d;
                    player = p;
                }
            }
        }
        return player;
    }
    paint() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        this.level.map.paint(this.camera);
        for (let p of this.projectiles) {
            p.paint(this.camera);
        }
        if (this.exitCell) {
            this.exitCell.paint(this.camera);
        }
        for (let mob of this.level.mobs) {
            mob.paint(this.camera);
        }


        for (let p of this.players) {
            p.paint(this.camera);
        }
        this.actionBar.paint();
        this.paintCursor();
    }
    paintCursor() {
        ctx.beginPath();
        ctx.arc(input.mouse.x, input.mouse.y, 5, 2 * Math.PI, 0);
        ctx.fillStyle = 'yellow';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(input.mouse.x, input.mouse.y, 4, 2 * Math.PI, 0);
        ctx.fillStyle = 'red';
        ctx.fill();
    }

    onUpdates(updates) {
        for (let m of updates) {
            if (m.t === 'playerMove') {
                this.players[m.id].onMessage(m);
            } else if (m.t === 'playerCastSpell') {
                this.actionBar.onMessage(m);
            } else if (m.t === 'mobHit') {
                this.mobs[m.id].refreshFromMsg(m);
            } else if (m.t == 'exitLevelRequest') {
                if (this.isServer && this.exitCell) {
                    return this.exitCell.trigger(this);
                                        
                }
            } else if (m.t == 'exitLevel') {
                if (!this.isServer) {
                    game.currentView = game.worldMap;                    
                }
            }
            else {
                console.log("WorldLevel.onUpdates() unknown: " + m.t);
                console.dir(m);
            }
        }
    }
    getWorldMsg() {
        return {
            players: this.players.map(p => ({
                id: p.id,
                x: p.x,
                y: p.y,
                life: p.life,
                maxLife: p.maxLife,
            })),
            mobs: this.mobs.map(m => m.getMsg()),
            //...
        }
    }
    refreshWorldFromMsg(msg) {
        this.startLevel(this.level);
        for (let i = 0; i < this.players.length; i++) {
            const current = this.players[i]
            const saved = msg.players[i];
            current.x = saved.x;
            current.y = saved.y;
            current.life = saved.life;
            current.maxLife = saved.maxLife;
        }
        for (let i = 0; i < this.mobs.length; i++) {
            this.mobs[i].refreshFromMsg(msg.mobs[i]);
        }
    }

}
class CameraOffset {
    constructor(localPlayer) {
        this.localPlayer = localPlayer;
        this.topX = 0;
        this.topY = 0;
    }
    update() {
        this.topX = Math.floor(this.localPlayer.x - CanvasWidth / 2);
        this.topY = Math.floor(this.localPlayer.y - CanvasHeight / 2);
    }
    toCanvasX(x) {
        return Math.floor(x - this.topX)
    }
    toCanvasY(y) {
        return Math.floor(y - this.topY)
    }
    toWorldCoord(canvasPoint) {
        return {
            x: canvasPoint.x + this.topX,
            y: canvasPoint.y + this.topY,
        };
    }
}