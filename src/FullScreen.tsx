import React, { useState, useEffect } from "react";
const { Box } = require("ink");

export const FullScreen: React.FC = (props) => {
    const [size, setSize] = useState({
        columns: process.stdout.columns,
        rows: process.stdout.rows,
    });

    if (!process.argv.includes("--debug")) {
        useEffect(() => {
            function onResize() {
                setSize({
                    columns: process.stdout.columns,
                    rows: process.stdout.rows,
                });
            }

            process.stdout.on("resize", onResize);
            process.stdout.write("\x1b[?1049h");
            return () => {
                process.stdout.off("resize", onResize);
                process.stdout.write("\x1b[?1049l");
            };
        }, []);
    }

    return (
        <Box width={size.columns} height={size.rows}>
            {props.children}
        </Box>
    );
};
