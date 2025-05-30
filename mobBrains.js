
class AggroMobBrain {
    init(mob, worldLevel) {
        this.mob = mob;
        this.worldLevel = worldLevel;
        this.intialCoord = { x: this.mob.x, y: this.mob.y };
        this.fireRange = 6;
        this.walkAroundPlayerUntil = -9999;
    }
    update() {
        if (this.mob.targetPlayer != null && this.mob.targetPlayer.life <= 0) {
            this.mob.targetPlayer = this.worldLevel.findNearestPlayer(this.mob);
        }
        if (this.mob.targetCoord != null && distanceSquare(this.mob, this.mob.targetCoord) < square(this.mob.speed)) {
            this.mob.targetCoord = null;
            this.mob.idleUntilTick = tickNumber + 30 + 30 * (this.mob.seed % 2);
        }
        let destCoord;
        if (this.mob.targetPlayer != null) {
            const distanceToPlayer = distanceSquare(this.mob, this.mob.targetPlayer);
            if (distanceToPlayer < square((this.fireRange + 3) * 64)) {
                this.mob.tryShoot(this.mob.targetPlayer.getCenterCoord(), this.worldLevel);
            }
            if (this.mob.targetCoord != null && tickNumber < this.walkAroundPlayerUntil) {
                destCoord = this.mob.targetCoord;
            } else if (distanceToPlayer < square(64 * 1.5)) {
                this.mob.targetCoord = AggroMobBrain.getRandomTargetCoord(this.mob, this.intialCoord, this.worldLevel);
                this.walkAroundPlayerUntil = tickNumber + 30 * 1;
                destCoord = this.mob.targetCoord;
            } else {
                destCoord = this.mob.targetPlayer;
                this.mob.targetCoord = null;
            }
        } else {
            if (tickNumber < this.mob.idleUntilTick) {
                return;
            }
            if (this.mob.targetCoord == null) {
                this.mob.targetCoord = AggroMobBrain.getRandomTargetCoord(this.mob, this.intialCoord, this.worldLevel);
            }
            destCoord = this.mob.targetCoord;
        }
        const d = computeDistance(this.mob, destCoord);
        if (d < 0.01) {
            return;
        }
        if (this.mob.buffs.find(b => b.id == BuffId.root)) {
            return;
        }
        const vx = this.mob.speed * (destCoord.x - this.mob.x) / d;
        const vy = this.mob.speed * (destCoord.y - this.mob.y) / d;
        this.mob.x += vx;
        this.mob.y += vy;
    }
    onHit() {
        if (this.mob.targetPlayer == null) {
            this.mob.targetPlayer = this.worldLevel.findNearestPlayer(this.mob);
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

class FearfullMobBrain {
    init(mob, worldLevel) {
        this.mob = mob;
        this.worldLevel = worldLevel;
        this.fireRange = 6;
    }
    update() {
        if (tickNumber < this.mob.idleUntilTick) {
            return;
        }
        const d1 = distanceSquare(this.mob, this.worldLevel.players[0]);
        const d2 = distanceSquare(this.mob, this.worldLevel.players[1]);
        const limit = square(64 * this.fireRange);
        if (d1 > limit && d2 > limit) {
            this.mob.idleUntilTick = tickNumber + 30;
            return;
        }
        FearfullMobBrain.moveMob(this.mob, this.worldLevel, FearfullMobBrain.fearfullScore)
    }
    onHit() {
    }
    static moveMob(mob, worldLevel, scoreFunc) {
        let destCoord = mob.targetCoord;
        if (!destCoord) {
            destCoord = FearfullMobBrain.getNextCoord(mob, worldLevel, scoreFunc);
            if (!destCoord) {
                mob.idleUntilTick = tickNumber + 30;
                return;
            }
            mob.targetCoord = destCoord;
        }
        if (mob.buffs.find(b => b.id == BuffId.root)) {
            return;
        }
        const d = computeDistance(mob, destCoord);
        if (d <= mob.speed) {
            mob.x = destCoord.x;
            mob.y = destCoord.y;
            mob.targetCoord = null;
            return;
        }
        const vx = mob.speed * (destCoord.x - mob.x) / d;
        const vy = mob.speed * (destCoord.y - mob.y) / d;
        mob.x += vx;
        mob.y += vy;
    }
    static fearfullScore(coord, worldLevel, mob) {
        const d1 = distanceSquare(coord, worldLevel.players[0]);
        const d2 = distanceSquare(coord, worldLevel.players[1]);
        const score = Math.min(d1, d2);
        return score;
    }
    static getNextCoord(mob, worldLevel, scoreFunc) {
        function getAround(quarter) {
            const angus = Math.PI * 2 * (quarter % 8) / 8;
            const dx = Math.sign(Math.floor(Math.cos(angus) * 10));
            const dy = Math.sign(Math.floor(Math.sin(angus) * 10));
            let nextCoord = {
                x: mob.x + dx * 64,
                y: mob.y + dy * 64,
            };
            return nextCoord;
        }
        let best = -999;
        let selected = null;
        for (let i = 0; i < 8; i++) {
            const nextCoord = getAround(i);
            const targetCell1 = worldLevel.map.getCell(nextCoord.x, nextCoord.y);
            const targetCell2 = worldLevel.map.getCell(nextCoord.x + mob.sprite.tWidth * 2, nextCoord.y + mob.sprite.tHeight * 2);
            if (!targetCell1.canWalk || !targetCell2.canWalk) {
                continue;
            }
            const score = scoreFunc(nextCoord, worldLevel, mob);
            if (score > best) {
                best = score;
                selected = nextCoord
            }
        }
        return selected;
    }
}

class SupportMobBrain {
    init(mob, worldLevel) {
        this.mob = mob;
        this.worldLevel = worldLevel;
        this.healRange = 5;
    }
    update() {
        if (tickNumber < this.mob.idleUntilTick) {
            return;
        }
        FearfullMobBrain.moveMob(this.mob, this.worldLevel, SupportMobBrain.beAroundTribeScore);
        if (this.mob.targetPlayer == null) {
            SupportMobBrain.PropagateAggro(this.worldLevel, this.mob);
        }
    }
    static PropagateAggro(worldLevel, mob) {
       
        const aggroMob = worldLevel.mobs.find(m => m.life > 0 && m.targetPlayer != null);
        if (!aggroMob) {
            return;
        }
        for (let other of worldLevel.mobs.filter(m => m.life > 0 && m.targetPlayer == null)) {
            other.targetPlayer = aggroMob.targetPlayer;
        }
    }
    static beAroundTribeScore(coord, worldLevel, mob) {
        const d1 = 1 + distanceSquare(coord, worldLevel.players[0]);
        const d2 = 1 + distanceSquare(coord, worldLevel.players[1]);
        let score = 1 - 1 / d1 - 1 / d2;
        const minDistance = square(16);
        const maxDistance = square(64 * mob.brain.healRange);

        for (let other of worldLevel.mobs.filter(m => m.life > 0 && m.id != mob.id)) {
            const d = distanceSquare(coord, other);
            if (d < minDistance || d > maxDistance) {
                continue;
            }
            score += 1;
        }
        return score;
    }
    onHit() {
         if (this.mob.targetPlayer == null) {
            this.mob.targetPlayer = this.worldLevel.findNearestPlayer(this.mob);
            SupportMobBrain.PropagateAggro(this.worldLevel, this.mob);
        }
    }

}
