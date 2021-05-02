import { Dungeon } from "./Dungeon";

const dun = new Dungeon(80, 40);
console.log(dun.rendered_map.map((val) => val.join("")).join("\n"));
