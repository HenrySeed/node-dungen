import React, { useEffect, useState } from "react";
import { useInput, useApp, Box, Text, Newline } from "ink";
import { Dungeon } from "./Dungeon";
var colors = require("colors/safe");
import {
    range,
    randint,
    fillArray,
    Pos,
    getDist,
    Direction,
    height,
} from "./utils";
import { genEnemies, Player } from "./Entities";

const dungeon = new Dungeon(80, 40);
let enemies = genEnemies(dungeon);
const player = new Player("Hrothgar", {
    x: Math.floor(80 / 2),
    y: Math.floor(40 / 2),
});

export let log: (...things: any[]) => void,
    quietLog: (...things: any[]) => void;

export function isMoveValid(map: string[][], newPos: Pos): boolean {
    if (map !== null) {
        const newPosVal = dungeon.map[newPos.y][newPos.x];

        // Wall collision
        if (newPosVal !== dungeon.empty) {
            log(`Collided with "${newPosVal}"`);
            return false;
        }
        // Enemy collision
        if (
            enemies.find(
                (val) => val.pos.x === newPos.x && val.pos.y === newPos.y
            )
        ) {
            log(`Collided with "Enemy"`);
            return false;
        }
        // Player collision
        if (player.pos.x === newPos.x && player.pos.y === newPos.y) {
            log(`Enemy Collided with "Player"`);
            return false;
        }

        return true;
    } else {
        return false;
    }
}

/**
 *
 * @returns
 */
export const Map = () => {
    const { exit } = useApp();
    const [map, setMap] = useState(dungeon.rendered_map);
    const [logStrs, setLogStrs] = useState<string[][]>([]);
    const [pastSeen, setPastSeen] = useState<Set<string>>(new Set());
    const [renderCount, setRenderCount] = useState(0);

    useEffect(() => {
        // setup every 2 second enemy update tick
        const aiLoop = setTimeout(() => {
            for (const enemy of enemies) {
                enemy.updateAI(player, map);
            }
            setRenderCount(renderCount + 1);
        }, 1000);

        return () => {
            clearTimeout(aiLoop);
        };
    });

    log = function (...things: any[]) {
        quietLog(...things);
        setLogStrs(logStrs);
    };

    quietLog = function (...things: any[]) {
        logStrs.push(
            things.map((val) =>
                typeof val === "string" ? val : JSON.stringify(val)
            )
        );
    };

    function isSeen([x, y]: [number, number]) {
        const r = player.viewDistance;
        const lhs = (x - player.pos.x) ** 2 / r ** 2;
        const rhs = (y - player.pos.y) ** 2 / (r / 1.9) ** 2;
        return lhs + rhs <= 1;
    }

    function renderPlayerAnim(pos: Pos): string | null {
        const swings = [
            ["\\", "|", "/"], // up
            ["/", "|", "\\"], // down
            ["\\", "─", "/"], // left
            ["/", "─", "\\"], // right
        ];

        // Swing left or right
        if (player.direction.x != 0) {
            if (
                pos.x === player.pos.x + player.direction.x &&
                pos.y >= player.pos.y - 1 &&
                pos.y <= player.pos.y + 1
            ) {
                if (pos.y - player.pos.y + 2 === player.animProgress) {
                    return player.color(
                        swings[player.direction.x > 0 ? 3 : 2][
                            pos.y - player.pos.y + 1
                        ]
                    );
                }
            }
        }
        // Swing up or down
        else {
            if (
                pos.y === player.pos.y + player.direction.y &&
                pos.x >= player.pos.x - 1 &&
                pos.x <= player.pos.x + 1
            ) {
                if (pos.x - player.pos.x + 2 === player.animProgress) {
                    return player.color(
                        swings[player.direction.y > 0 ? 1 : 0][
                            pos.x - player.pos.x + 1
                        ]
                    );
                }
            }
        }
        return null;
    }

    function renderScreen() {
        if (map) {
            const newMap = range(40).map((val) => fillArray(80, " "));

            for (const row of range(40)) {
                for (const col of range(80)) {
                    const pos: Pos = { x: col, y: row };
                    const val = map[row][col];
                    const nearEnemy = enemies.find(
                        (val) => val.pos.x === col && val.pos.y === row
                    );

                    // Player Icon
                    if (col === player.pos.x && row === player.pos.y) {
                        newMap[row][col] = player.color("@");
                    }
                    // Visible to Player
                    else if (isSeen([col, row])) {
                        // Animation layer
                        const tile = renderPlayerAnim(pos);
                        if (player.animProgress > 0 && tile) {
                            newMap[row][col] = tile;
                        }
                        // Render Enemies
                        else if (nearEnemy) {
                            newMap[row][col] = nearEnemy.color("G");
                        }
                        // Regular visible map
                        else {
                            newMap[row][col] = val;
                        }
                        pastSeen.add(`${col}, ${row}`);
                    }
                    // Previously seen areas Dim
                    else if (
                        pastSeen.has(`${col}, ${row}`) &&
                        val !== dungeon.empty
                    ) {
                        newMap[row][col] = colors.dim(val);
                    }
                }
            }
            // handle animations
            if (player.animProgress > 0) {
                setTimeout(() => {
                    // quietLog(
                    //     `animProgress: ${player.animProgress}`,
                    //     `direction: ${JSON.stringify(player.direction)}`
                    // );
                    setRenderCount(renderCount + 1); // force another render for the animation
                    player.animProgress -= 1;
                }, 50);
            }
            return newMap;
        } else {
            return null;
        }
    }

    useInput((input, key) => {
        if (input === "q") {
            exit();
            return;
        }
        if (player.animProgress > 0) {
            return;
        }
        let newDirec: Direction = { x: 0, y: 0 };

        if (key.leftArrow || input === "a") {
            newDirec.x = -1;
        } else if (key.rightArrow || input === "d") {
            newDirec.x = 1;
        } else if (key.upArrow || input === "w") {
            newDirec.y = -1;
        } else if (key.downArrow || input === "s") {
            newDirec.y = 1;
        } else if (input === " ") {
            player.swing(
                enemies.find((val) => getDist(val.pos, player.pos) <= 1)
            );
        }

        if (newDirec.x !== 0 || newDirec.y !== 0) {
            const newPos = {
                x: player.pos.x + newDirec.x,
                y: player.pos.y + newDirec.y,
            };
            if (isMoveValid(map, newPos)) {
                player.move(newPos);
            }
            player.turn(newPos);
        }

        // cleanup the enemies array
        enemies = enemies.filter((val) => val.hp > 0);
        setRenderCount(renderCount + 1);
    });

    return (
        <Box width="100%" height={height - 1} flexDirection="column">
            <Box width="100%" height="100%">
                <Text wrap="truncate-middle">
                    {renderScreen()
                        ?.map((val) => val.join(""))
                        .join("\n")}
                </Text>
            </Box>

            <Box width="100%">
                <Box
                    width="70%"
                    height={7}
                    borderColor="green"
                    borderStyle="round"
                    flexDirection="column"
                >
                    <Box marginTop={-1}>
                        <Text>Console</Text>
                    </Box>
                    <Box flexDirection="column">
                        {logStrs
                            .map((val, i) => [val, i] as [string[], number])
                            .slice(
                                logStrs.length > 5 ? logStrs.length - 5 : 0,
                                logStrs.length
                            )
                            .map(([val, i]) => (
                                <Box>
                                    <Text color="white" dimColor>
                                        {i}&nbsp;
                                    </Text>
                                    <Text>{val.join(", ")}</Text>
                                </Box>
                            ))}
                    </Box>
                </Box>
                <Box
                    width="30%"
                    borderColor="green"
                    borderStyle="round"
                    flexDirection="column"
                    height={7}
                >
                    <Box marginTop={-1}>
                        <Text>Player</Text>
                    </Box>
                    <Box flexDirection="column">
                        <Text>Name: {player.color(player.name)}</Text>
                        <Text>Hp: {player.hp}</Text>
                        <Text>Xp: {player.xp} / 100</Text>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
};
