var colors = require("colors/safe");
import { range, randint, fillArray } from "./utils";

export class Dungeon {
    width: number;
    height: number;
    fill = "#";
    empty = colors.dim.white(".");

    map: string[][];
    rendered_map: string[][];

    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;

        this.map = range(height).map((val) => fillArray(width, this.empty));
        this.rendered_map = range(height).map((val) =>
            fillArray(width, this.empty)
        );
        this.makeDungeon();
    }

    /**
     * Checks the dungeon for(validity, eg{ blocks out of bounds
     */
    isValid() {
        for (const row of range(this.height)) {
            for (const col of range(this.width)) {
                if (this.map[row][col] != this.fill) {
                    if (row == 0 || row > this.height - 2) {
                        return false;
                    }
                    if (col == 0 || col > this.width - 2) {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    /**
     * returns true if the given pos falls on the map as a vertical wall
     */
    isVertWall(x: number, y: number) {
        const neighbours = this.getNeighbours([x, y]);
        if (
            (neighbours[3] == this.empty || neighbours[5] == this.empty) &&
            neighbours[1] == this.fill &&
            neighbours[7] == this.fill
        ) {
            return true;
        } else {
            return false;
        }
    }

    /**
     * returns true if the given pos falls on the map as a horizontal wall
     */
    isHorozWall(x: number, y: number) {
        const neighbours = this.getNeighbours([x, y]);
        if (
            (neighbours[1] == this.empty || neighbours[7] == this.empty) &&
            neighbours[3] == this.fill &&
            neighbours[5] == this.fill
        ) {
            return true;
        } else {
            return false;
        }
    }

    /**
     * returns true if the given pos falls on the map as a corner wall
     */
    isCorner(x: number, y: number) {
        const neighbours = this.getNeighbours([x, y]);
        return (
            neighbours.includes(this.fill) && neighbours.includes(this.empty)
        );
    }

    /**
     * returns true if the given pos falls on the map as next to a wall, horozontal || vertical
     */
    isOnWall(x: number, y: number) {
        const neighbours = this.getNeighbours([x, y], this.rendered_map);
        if (
            (neighbours.includes("|") || neighbours.includes("-")) &&
            this.getPoint([x, y]) == this.empty
        ) {
            return true;
        } else {
            return false;
        }
    }

    /**
     * Generated a dungeon, checks it for(validity && renders it out with vertical && horozontal walls
     */
    makeDungeon() {
        let crashed = false;

        try {
            this.genDungeon();
            crashed = false;
        } catch (e) {
            crashed = true;
        }

        while (!this.isValid() || crashed) {
            try {
                this.genDungeon();
                crashed = false;
            } catch (e) {
                crashed = true;
            }
        }

        this.rendered_map = [];
        for (const i of range(this.height)) {
            this.rendered_map.push(fillArray(this.width, this.empty));
        }

        for (const row of range(this.height)) {
            for (const col of range(this.width)) {
                // renders points to this.rendered_map
                if (this.map[row][col] == this.fill) {
                    if (this.isVertWall(col, row)) {
                        this.rendered_map[row][col] = "|";
                    } else if (this.isHorozWall(col, row)) {
                        this.rendered_map[row][col] = "-";
                    } else if (this.isCorner(col, row)) {
                        this.rendered_map[row][col] = "+";
                    } else {
                        this.rendered_map[row][col] = " ";
                    }
                } else if (this.map[row][col] == this.empty) {
                    this.rendered_map[row][col] = this.empty;
                } else {
                    this.rendered_map[row][col] = this.map[row][col];
                }
            }
        }
    }

    /**
     * Generate a dungeon, filling the this.map array
     */
    genDungeon() {
        // reset map
        this.map = [];
        for (const i of range(this.height)) {
            this.map.push(fillArray(this.width, this.fill));
        }
        // start pos
        let moves = 6;
        let direcs = [0, 1, 2, 3];

        for (const direc of direcs) {
            let newDirec = direc;
            let pos: [number, number] = [
                Math.round(this.width / 2),
                Math.round(this.height / 2),
            ];
            // draw a point where pos is currently
            this.drawPoint(pos[0], pos[1], this.empty);
            let old_direc = 0;

            for (const move of range(moves)) {
                // choose a direction && move randint(3, 10), making a corridor
                // numbers for(N,E,S,W

                while (newDirec == old_direc || old_direc % 2 == newDirec % 2) {
                    newDirec =
                        direcs[Math.floor(Math.random() * direcs.length)];
                }

                pos = this.genCorridor(pos, newDirec);
                pos = this.genRoom(pos);

                old_direc = newDirec;
                newDirec = direcs[Math.floor(Math.random() * direcs.length)];
            }
        }
    }

    /**
     * Generate a Corridor from the given pos && direction
     */
    genCorridor(pos: [number, number], direc: number) {
        let length: number = 0;
        if (direc == 0 || direc == 2) {
            length = randint(5, 8);
        } // vertical paths are shorted due to ascii
        if (direc == 1 || direc == 3) {
            length = randint(9, 16);
        }

        for (const pix of range(length)) {
            if (direc == 0) {
                pos = [pos[0], pos[1] - 1];
            }
            if (direc == 1) {
                pos = [pos[0] + 1, pos[1]];
            }
            if (direc == 2) {
                pos = [pos[0], pos[1] + 1];
            }
            if (direc == 3) {
                pos = [pos[0] - 1, pos[1]];
            }

            // draw a point where pos is currently
            this.drawPoint(pos[0], pos[1], this.empty);
        }

        return pos;
    }

    /**
     * Generate a room from the given position
     */
    genRoom(pos: [number, number]) {
        const width = randint(5, 9);
        const height = randint(3, 6);
        const center = [
            pos[0] - randint(1, width - 1),
            pos[1] - randint(1, height - 1),
        ];

        for (const row of range(height)) {
            for (const col of range(width)) {
                this.drawPoint(center[0] + col, center[1] + row, this.empty);
            }
        }

        return pos;
    }

    /**
     * Adds items to the Map of the given room
     */
    genItems(top_leftPos: [number, number], bottom_rightPos: [number, number]) {
        const min_items = 1;
        const max_items = 4;
        const possible_locations = [];

        // find all suitable positions of the given room
        for (const row of range(top_leftPos[1], bottom_rightPos[1])) {
            for (const col of range(top_leftPos[0], bottom_rightPos[0])) {
                if (this.isOnWall(col, row)) {
                    possible_locations.push([col, row]);
                }
            }
        }

        let num_items = randint(min_items, max_items);
        if (possible_locations.length <= num_items) {
            num_items = possible_locations.length - 1;
        }

        for (const item of range(num_items)) {
            // choose random coords along a wall
            const loc = possible_locations[item];
            // possible_locations.remove(loc)
            this.drawPoint(loc[1], loc[0], "&");
        }
    }

    /**
     * makes a point on this.map
     */
    drawPoint(x: number, y: number, val: string) {
        this.map[y][x] = val;
    }

    getPoint(pos: [number, number], on_map?: string[][]) {
        const useMap = on_map || this.map;
        try {
            return useMap[pos[1]][pos[0]];
        } catch {
            return undefined;
        }
    }

    /**
     * Checks if the point pos of this.map has val as a neighbour
     */
    getNeighbours(pos: [number, number], on_map?: string[][]) {
        const useMap = on_map || this.map;

        const neighbours = [];
        neighbours.push(this.getPoint([pos[0] - 1, pos[1] - 1], useMap));
        neighbours.push(this.getPoint([pos[0], pos[1] - 1], useMap));
        neighbours.push(this.getPoint([pos[0] + 1, pos[1] - 1], useMap));

        neighbours.push(this.getPoint([pos[0] - 1, pos[1]], useMap));
        neighbours.push(this.getPoint([pos[0], pos[1]], useMap));
        neighbours.push(this.getPoint([pos[0] + 1, pos[1]], useMap));

        neighbours.push(this.getPoint([pos[0] - 1, pos[1] + 1], useMap));
        neighbours.push(this.getPoint([pos[0], pos[1] + 1], useMap));
        neighbours.push(this.getPoint([pos[0] + 1, pos[1] + 1], useMap));

        return neighbours;
    }
}
