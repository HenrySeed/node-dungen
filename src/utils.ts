export const [width, height] = [process.stdout.columns, process.stdout.rows];

export function range(start: number, end?: number): number[] {
    const out = [];
    if (!end) {
        for (let i = 0; i < start; i++) {
            out.push(i);
        }
    } else {
        for (let i = start; i < end; i++) {
            out.push(i);
        }
    }
    return out;
}

export function randint(min: number, max?: number) {
    if (max === undefined) {
        return Math.floor(Math.random() * (min - 0)) + 0;
    } else {
        return Math.floor(Math.random() * (max - min)) + min;
    }
}

export function fillArray(num: number, fill: any) {
    let arr = [];
    for (const i of range(num)) {
        arr.push(fill);
    }
    return arr;
}

export function getDist(pos1: Pos, pos2: Pos) {
    return Math.max(Math.abs(pos1.x - pos2.x), Math.abs(pos1.y - pos2.y));
}

export type Pos = { x: number; y: number };
export type Direction = { x: -1 | 0 | 1; y: -1 | 0 | 1 };
