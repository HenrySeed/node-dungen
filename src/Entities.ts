import { Dungeon } from "./Dungeon";
import { isMoveValid, log } from "./Map";
import { range, randint, Pos, Direction, getDist } from "./utils";
var colors = require("colors/safe");

export class Entity {
    hp: number;
    name: string;
    animProgress = 0;
    direction: Direction = { x: 0, y: -1 };
    pos: Pos;
    color: (val: string) => string;

    constructor(name: string, pos: Pos) {
        this.name = name;
        this.hp = 20;
        this.pos = pos;
        this.color = (val: string) => colors.brightYellow.bold(val);
    }

    turn(newPos: Pos) {
        if (newPos.x < this.pos.x) this.direction = { x: -1, y: 0 };
        if (newPos.x > this.pos.x) this.direction = { x: 1, y: 0 };
        if (newPos.y < this.pos.y) this.direction = { x: 0, y: -1 };
        if (newPos.y > this.pos.y) this.direction = { x: 0, y: 1 };
    }

    move(pos: Pos) {
        this.turn(pos);
        this.animProgress = 0;
        this.pos = pos;
    }

    swing(other?: Entity) {
        this.animProgress = 3;

        // roll for hit
        if (other !== undefined) {
            const xDirec =
                other.pos.x < this.pos.x
                    ? -1
                    : other.pos.x > this.pos.x
                    ? 1
                    : 0;
            const yDirec =
                other.pos.y < this.pos.y
                    ? -1
                    : other.pos.y > this.pos.y
                    ? 1
                    : 0;
            this.direction = { x: xDirec, y: yDirec };
            if (randint(10) > 2) {
                const damage = randint(10) + 5;
                log(
                    `Swinging at ${other.name}, dealt ${damage} damage, Goblin: ${other.hp}HP`
                );
                const dead = other.takeHit(damage);

                if (dead && this instanceof Player) {
                    this.xp += 30;
                }
            } else {
                log(`Swinging at ${other.name} but missed`);
            }
        }
    }

    takeHit(amount: number) {
        this.hp -= amount;
        if (this.hp <= 0) {
            this.hp = 0;
            if (this instanceof Player) {
                log("You Died... Loser");
            } else {
                log(`You killed the ${this.name}, you monster`);
            }
            return true;
        }
        return false;
    }
}

export class Player extends Entity {
    viewDistance = 8;
    xp = 0;
    constructor(name: string, pos: Pos) {
        super(name, pos);
        this.color = (val: string) => colors.brightYellow.bold(val);
    }
}

export class Enemy extends Entity {
    constructor(name: string, pos: Pos) {
        super(name, pos);
        this.color = (val: string) => colors.brightRed.bold(val);
    }

    updateAI(player: Player, map: string[][]) {
        const pos = this.pos;
        if (getDist(pos, player.pos) < 10) {
            const yChange =
                pos.y < player.pos.y ? 1 : pos.y > player.pos.y ? -1 : 0;
            const xChange =
                pos.x < player.pos.x ? 1 : pos.x > player.pos.x ? -1 : 0;

            let newDirec: Direction = { x: xChange, y: yChange };
            if (yChange !== 0 && xChange !== 0) {
                newDirec =
                    Math.random() > 5
                        ? { x: xChange, y: 0 }
                        : { x: 0, y: yChange };
            }

            const newPos = {
                x: pos.x + newDirec.x,
                y: pos.y + newDirec.y,
            };

            if (isMoveValid(map, newPos)) {
                log(
                    `Found enemy near player, moving to ${JSON.stringify(
                        newPos
                    )}`
                );
                this.move(newPos);
            }
        }
    }
}

export function genEnemies(dungeon: Dungeon): Enemy[] {
    const positions: Enemy[] = [];

    for (const row of range(dungeon.height)) {
        for (const col of range(dungeon.width)) {
            const val = dungeon.map[row][col];
            if (val === dungeon.empty) {
                if (Math.random() > 0.99) {
                    positions.push(new Enemy("Goblin", { x: col, y: row }));
                }
            }
        }
    }

    return positions;
}
