import { FullScreen } from "./FullScreen";
import { Map } from "./Map";
import { render } from "ink";
import React from "react";

if (!process.argv.includes("--debug")) {
    const enterAltScreenCommand = "\x1b[?1049h";
    const leaveAltScreenCommand = "\x1b[?1049l";
    process.stdout.write(enterAltScreenCommand);
    process.on("exit", () => {
        process.stdout.write(leaveAltScreenCommand);
    });
}

render(
    <FullScreen>
        <Map />
    </FullScreen>
);
