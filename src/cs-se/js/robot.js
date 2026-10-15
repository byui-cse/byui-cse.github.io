/**
 * Robot path puzzle.
 *
 * Players stack command blocks (Forward, Turn Left, Turn Right, Repeat) to guide
 * a robot to the goal. Stars:
 *   1  reach the goal
 *   2  ...using the fewest possible moves (shortest path)
 *   3  ...and the fewest possible blocks (usually means discovering Repeat)
 *
 * The shortest path and the block target are computed per level with a
 * breadth-first search, so levels can be edited as plain text maps.
 *
 * Markup: <div class="robot" data-robot="home|cs|challenges"></div>
 * Options: data-robot-solver (adds "Watch the Computer Solve It"),
 *          data-robot-learn="dialog-id" (Learn dialog opened after success).
 */
(() => {
    "use strict";

    /* ---------- Levels ---------- */
    /* . open   # wall   G goal   > v < ^ robot start and facing direction */
    const LEVELS = {
        "first-steps": {
            name: "First Steps",
            map: [
                "#.#..#G",
                "#...#..",
                "..#....",
                ".#..#..",
                ">......"
            ]
        },
        "up-and-over": {
            name: "Up and Over",
            map: [
                "v..#...",
                ".#...#.",
                ".#.#...",
                ".....#.",
                "#.#...G"
            ]
        },
        "zigzag": {
            name: "Zigzag",
            map: [
                ">....#.",
                "##.#.#.",
                "...#...",
                ".#...#.",
                "...#..G"
            ]
        },
        "staircase": {
            name: "Staircase",
            map: [
                "#####G",
                "####..",
                "###..#",
                "##..##",
                "#..###",
                ">.####"
            ]
        },
        "around-the-wall": {
            name: "Around the Wall",
            map: [
                "...#..G",
                ".#.#.#.",
                ".#...#.",
                ".####..",
                "......#",
                "#.###.#",
                ">.....#"
            ]
        },
        "two-doors": {
            name: "Two Doors",
            map: [
                ">..#...",
                "##.#.#.",
                "...#.#.",
                ".###.#.",
                ".....#.",
                "#.####.",
                "......G"
            ]
        },
        "the-long-hall": {
            name: "The Long Hall",
            map: [
                "v.#....",
                "..#.##.",
                ".##..#.",
                "....#..",
                "##.##.#",
                "...#...",
                ".#...#G"
            ]
        },
        "switchback": {
            name: "Switchback",
            map: [
                ">.....#",
                "#####.#",
                "#.....#",
                "#.#####",
                "#.....G",
                "#######"
            ]
        },
        "spiral": {
            name: "Spiral",
            map: [
                ">......",
                "######.",
                ".....#.",
                ".###.#.",
                ".#G..#.",
                ".#####.",
                "......."
            ]
        }
    };

    /* Home and Computer Science rotate through three levels, one per page load. */
    const SETS = {
        home: ["first-steps", "up-and-over", "zigzag"],
        cs: ["around-the-wall", "two-doors", "the-long-hall"],
        challenges: ["first-steps", "up-and-over", "zigzag", "staircase", "around-the-wall", "two-doors", "the-long-hall", "switchback", "spiral"]
    };
    const ROTATING = new Set(["home", "cs"]);
    const ROTATE_KEY = "byui-cse-robot-rotation";

    const MAX_BLOCKS = 24;
    const STAR_KEY = "byui-cse-robot-stars";

    /* Directions: 0 east, 1 south, 2 west, 3 north (y grows downward). */
    const DIRS = [[1, 0], [0, 1], [-1, 0], [0, -1]];
    const DIR_CHARS = { ">": 0, "v": 1, "<": 2, "^": 3 };
    const DIR_NAMES = ["right", "down", "left", "up"];

    const ACTIONS = {
        F: { label: "Forward", icon: "↑" },
        L: { label: "Turn Left", icon: "↶" },
        R: { label: "Turn Right", icon: "↷" }
    };

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* ---------- Level parsing and solving ---------- */

    const parseLevel = (id) => {
        const def = LEVELS[id];
        const rows = def.map.length;
        const cols = def.map[0].length;
        const walls = new Set();
        let start = null;
        let goal = null;

        def.map.forEach((row, y) => {
            [...row].forEach((ch, x) => {
                if (ch === "#") {
                    walls.add(`${x},${y}`);
                } else if (ch === "G") {
                    goal = { x, y };
                } else if (ch in DIR_CHARS) {
                    start = { x, y, d: DIR_CHARS[ch] };
                }
            });
        });

        const level = { id, name: def.name, cols, rows, walls, start, goal };
        const unreachable = findUnreachable(level);

        if (unreachable.length) {
            throw new Error(`Robot level "${id}" has open squares the robot can never reach: ${unreachable.join(" ")}`);
        }

        Object.assign(level, solve(level));

        return level;
    };

    /** Open squares that cannot be reached from the start, as "x,y" strings. */
    const findUnreachable = (level) => {
        const seen = new Set([`${level.start.x},${level.start.y}`]);
        const queue = [[level.start.x, level.start.y]];

        while (queue.length) {
            const [x, y] = queue.shift();

            for (const [dx, dy] of DIRS) {
                const nx = x + dx;
                const ny = y + dy;
                const k = `${nx},${ny}`;

                if (!seen.has(k) && isOpen(level, nx, ny)) {
                    seen.add(k);
                    queue.push([nx, ny]);
                }
            }
        }

        const missing = [];

        for (let y = 0; y < level.rows; y += 1) {
            for (let x = 0; x < level.cols; x += 1) {
                if (isOpen(level, x, y) && !seen.has(`${x},${y}`)) {
                    missing.push(`${x},${y}`);
                }
            }
        }

        return missing;
    };

    const isOpen = (level, x, y) =>
        x >= 0 && y >= 0 && x < level.cols && y < level.rows && !level.walls.has(`${x},${y}`);

    const applyAction = (level, s, a) => {
        if (a === "L") {
            return { x: s.x, y: s.y, d: (s.d + 3) % 4 };
        }

        if (a === "R") {
            return { x: s.x, y: s.y, d: (s.d + 1) % 4 };
        }

        const nx = s.x + DIRS[s.d][0];
        const ny = s.y + DIRS[s.d][1];

        return isOpen(level, nx, ny) ? { x: nx, y: ny, d: s.d } : null;
    };

    /** Fewest blocks needed to write an action string (Repeat holds simple blocks only). */
    const encodeCost = (seq) => {
        const n = seq.length;
        const best = new Array(n + 1).fill(Infinity);

        best[0] = 0;

        for (let j = 1; j <= n; j += 1) {
            best[j] = best[j - 1] + 1;

            for (let i = 0; i < j - 1; i += 1) {
                const sub = seq.slice(i, j);

                for (let p = 1; p <= sub.length / 2; p += 1) {
                    const times = sub.length / p;

                    if (Number.isInteger(times) && times <= 9 && sub.slice(0, p).repeat(times) === sub) {
                        best[j] = Math.min(best[j], best[i] + 1 + p);
                    }
                }
            }
        }

        return best[n];
    };

    /** Breadth-first search over (x, y, facing). Returns move and block targets. */
    const solve = (level) => {
        const key = (s) => `${s.x},${s.y},${s.d}`;
        const dist = new Map([[key(level.start), 0]]);
        const parents = new Map([[key(level.start), []]]);
        const states = new Map([[key(level.start), level.start]]);
        const cellOrder = [`${level.start.x},${level.start.y}`];
        const seenCells = new Set(cellOrder);
        let frontier = [level.start];
        let goalDepth = Infinity;

        for (let depth = 0; frontier.length && depth < goalDepth; depth += 1) {
            const next = [];

            for (const s of frontier) {
                for (const a of ["F", "L", "R"]) {
                    const t = applyAction(level, s, a);

                    if (!t) {
                        continue;
                    }

                    const k = key(t);

                    if (!dist.has(k)) {
                        dist.set(k, depth + 1);
                        parents.set(k, [[key(s), a]]);
                        states.set(k, t);
                        next.push(t);

                        const cell = `${t.x},${t.y}`;

                        if (!seenCells.has(cell)) {
                            seenCells.add(cell);
                            cellOrder.push(cell);
                        }

                        if (t.x === level.goal.x && t.y === level.goal.y) {
                            goalDepth = Math.min(goalDepth, depth + 1);
                        }
                    } else if (dist.get(k) === depth + 1) {
                        parents.get(k).push([key(s), a]);
                    }
                }
            }

            frontier = next;
        }

        if (goalDepth === Infinity) {
            throw new Error(`Robot level "${level.id}" has no solution`);
        }

        /* Every shortest action sequence, then the cheapest one to write. */
        const goalKeys = [...dist.keys()].filter((k) => {
            const s = states.get(k);

            return dist.get(k) === goalDepth && s.x === level.goal.x && s.y === level.goal.y;
        });
        const sequences = [];
        const walk = (k, suffix) => {
            if (sequences.length > 20000) {
                return;
            }

            const ps = parents.get(k);

            if (!ps.length) {
                sequences.push(suffix);
                return;
            }

            for (const [pk, a] of ps) {
                walk(pk, a + suffix);
            }
        };

        goalKeys.forEach((k) => walk(k, ""));

        let parBlocks = Infinity;
        let bestSequence = sequences[0];

        for (const seq of sequences) {
            const cost = encodeCost(seq);

            if (cost < parBlocks) {
                parBlocks = cost;
                bestSequence = seq;
            }
        }

        return { minMoves: goalDepth, parBlocks, bestSequence, searchOrder: cellOrder, bidirectionalOrder: buildBidirectionalOrder(level) };
    };

    /** Explore from the start and goal at the same time until the frontiers meet. */
    const buildBidirectionalOrder = (level) => {
        const start = `${level.start.x},${level.start.y}`;
        const goal = `${level.goal.x},${level.goal.y}`;
        const frontSeen = new Set([start]);
        const backSeen = new Set([goal]);
        const order = [];
        const shown = new Set();
        let front = [start];
        let back = [goal];

        const add = (cell) => {
            if (!shown.has(cell)) {
                shown.add(cell);
                order.push(cell);
            }
        };

        add(start);
        add(goal);

        const neighbors = (cell) => {
            const [x, y] = cell.split(",").map(Number);

            return DIRS
                .map(([dx, dy]) => `${x + dx},${y + dy}`)
                .filter((next) => {
                    const [nx, ny] = next.split(",").map(Number);
                    return isOpen(level, nx, ny);
                });
        };

        while (front.length && back.length) {
            const nextFront = [];

            for (const cell of front) {
                for (const next of neighbors(cell)) {
                    if (!frontSeen.has(next)) {
                        frontSeen.add(next);
                        nextFront.push(next);
                        add(next);
                    }

                    if (backSeen.has(next)) return order;
                }
            }

            front = nextFront;
            const nextBack = [];

            for (const cell of back) {
                for (const next of neighbors(cell)) {
                    if (!backSeen.has(next)) {
                        backSeen.add(next);
                        nextBack.push(next);
                        add(next);
                    }

                    if (frontSeen.has(next)) return order;
                }
            }

            back = nextBack;
        }

        return order;
    };

    /* ---------- Program model ---------- */

    let nextId = 1;
    const makeBlock = (type) => (type === "repeat"
        ? { id: nextId++, type, count: 3, body: [] }
        : { id: nextId++, type });

    const countBlocks = (program) =>
        program.reduce((n, b) => n + (b.type === "repeat" ? 1 + b.body.length : 1), 0);

    const flatten = (program) => {
        const steps = [];

        for (const b of program) {
            if (b.type === "repeat") {
                for (let i = 0; i < b.count; i += 1) {
                    for (const inner of b.body) {
                        steps.push({ action: inner.type, ids: [b.id, inner.id] });
                    }
                }
            } else {
                steps.push({ action: b.type, ids: [b.id] });
            }
        }

        return steps;
    };

    const findBlock = (program, id) => {
        for (let i = 0; i < program.length; i += 1) {
            if (program[i].id === id) {
                return { list: program, index: i, block: program[i], parent: null };
            }

            if (program[i].type === "repeat") {
                const j = program[i].body.findIndex((b) => b.id === id);

                if (j >= 0) {
                    return { list: program[i].body, index: j, block: program[i].body[j], parent: program[i] };
                }
            }
        }

        return null;
    };

    /* ---------- Stars storage ---------- */

    const readStars = () => {
        try {
            return JSON.parse(localStorage.getItem(STAR_KEY)) || {};
        } catch {
            return {};
        }
    };

    const saveStars = (levelId, stars) => {
        try {
            const all = readStars();

            all[levelId] = Math.max(all[levelId] || 0, stars);
            localStorage.setItem(STAR_KEY, JSON.stringify(all));
        } catch {
            /* storage blocked: stars just are not remembered */
        }
    };

    /* ---------- DOM helpers ---------- */

    const SVG_NS = "http://www.w3.org/2000/svg";
    const el = (tag, attrs = {}, text) => {
        const node = document.createElement(tag);

        Object.entries(attrs).forEach(([k, v]) => {
            if (v === true) {
                node.setAttribute(k, "");
            } else if (v !== false && v != null) {
                node.setAttribute(k, v);
            }
        });

        if (text != null) {
            node.textContent = text;
        }

        return node;
    };
    const svg = (tag, attrs = {}) => {
        const node = document.createElementNS(SVG_NS, tag);

        Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, v));

        return node;
    };
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

    const starIcons = (n) => {
        const wrap = el("span", { class: "robot__stars", role: "img", "aria-label": `${n} of 3 stars` });

        for (let i = 0; i < 3; i += 1) {
            wrap.append(el("span", { class: i < n ? "is-on" : "", "aria-hidden": "true" }, "★"));
        }

        return wrap;
    };

    /* Block icons as SVG so they center exactly with the label text. */
    const ICON_PATHS = {
        F: "M12 19V5M6 11l6-6 6 6",
        L: "M9 15L4 10l5-5M4 10h10a5 5 0 0 1 5 5v5",
        R: "M15 15l5-5-5-5M20 10H10a5 5 0 0 0-5 5v5",
        repeat: "M17 3l3 3-3 3M4 11V9a3 3 0 0 1 3-3h13M7 21l-3-3 3-3M20 13v2a3 3 0 0 1-3 3H4"
    };

    const icon = (type) => {
        const node = svg("svg", {
            viewBox: "0 0 24 24",
            class: "robot__icon",
            "aria-hidden": "true",
            fill: "none",
            stroke: "currentColor",
            "stroke-width": "2.5",
            "stroke-linecap": "round",
            "stroke-linejoin": "round"
        });

        node.append(svg("path", { d: ICON_PATHS[type] }));

        return node;
    };

    /* ---------- The game ---------- */

    const createGame = (root) => {
        const setName = root.dataset.robot in SETS ? root.dataset.robot : "home";
        const levelIds = SETS[setName];
        const learnId = root.dataset.robotLearn || null;
        const withSolver = root.hasAttribute("data-robot-solver");

        let level = null;
        let levelIndex = 0;
        let program = [];
        let target = null; /* id of the Repeat block new blocks go into, or null for the main program */
        let busy = false;
        let pose = null;
        let angle = 0;

        root.textContent = "";
        root.classList.add("robot--ready");

        /* Level picker (challenges) */
        const picker = el("div", { class: "robot__levels", role: "group", "aria-label": "Levels" });

        /* Board */
        const boardWrap = el("div", { class: "robot__board" });
        const board = svg("svg", { class: "robot__svg", role: "img" });
        const layerCells = svg("g");
        const layerSearch = svg("g");
        const layerTrail = svg("g");
        const goalMark = svg("g", { class: "robot__goal" });
        const robot = svg("g", { class: "robot__bot" });

        goalMark.append(
            svg("circle", { cx: 5, cy: 5, r: 3.6, class: "robot__goal-ring" }),
            svg("circle", { cx: 5, cy: 5, r: 1.8, class: "robot__goal-dot" })
        );
        robot.append(
            svg("rect", { x: 1.6, y: 1.6, width: 6.8, height: 6.8, rx: 1.8, class: "robot__body" }),
            svg("path", { d: "M4.4 3.3 L6.9 5 L4.4 6.7", class: "robot__face" }),
            svg("circle", { cx: 3.3, cy: 3.5, r: 0.55, class: "robot__eye" }),
            svg("circle", { cx: 3.3, cy: 6.5, r: 0.55, class: "robot__eye" })
        );
        board.append(layerCells, layerSearch, layerTrail, goalMark, robot);

        const targets = el("p", { class: "robot__targets" });

        boardWrap.append(board, targets);

        /* Panel */
        const panel = el("div", { class: "robot__panel" });
        const palette = el("div", { class: "robot__palette", role: "group", "aria-label": "Add a command block" });

        [["F"], ["L"], ["R"], ["repeat"]].forEach(([type]) => {
            const label = type === "repeat" ? "Repeat" : ACTIONS[type].label;
            const b = el("button", { type: "button", class: `robot__chip robot__chip--${type}`, draggable: "true", "data-type": type });

            b.append(icon(type), el("span", {}, label));
            b.addEventListener("click", () => addBlock(type));
            b.addEventListener("dragstart", (e) => {
                e.dataTransfer.setData("text/plain", `new:${type}`);
                e.dataTransfer.effectAllowed = "copy";
            });
            palette.append(b);
        });

        const targetNote = el("p", { class: "robot__target-note", "aria-live": "polite" });
        const programHead = el("div", { class: "robot__program-head" });
        const programTitle = el("h4", { class: "robot__program-title" }, "Your Program");
        const blockCount = el("span", { class: "robot__count" });

        programHead.append(programTitle, blockCount);

        const programList = el("ol", { class: "robot__program", "aria-label": "Your program", "data-list": "main" });
        const controls = el("div", { class: "robot__controls" });
        const runBtn = el("button", { type: "button", class: "button robot__run" }, "Run ▶");
        const resetBtn = el("button", { type: "button", class: "button button--secondary button--small" }, "Reset Robot");
        const clearBtn = el("button", { type: "button", class: "button button--secondary button--small" }, "Clear Program");

        controls.append(runBtn, resetBtn, clearBtn);

        let solverBtn = null;

        if (withSolver) {
            solverBtn = el("button", { type: "button", class: "button robot__solver robot__solver--prominent" }, "Watch the Computer Solve It");
            const intro = root.closest(".activity")?.querySelector(".activity__intro");
            const solverCallout = el("div", { class: "robot__solver-callout" });
            solverCallout.append(el("p", {}, "Want to see the algorithm find the route?"), solverBtn);

            if (intro) {
                intro.append(solverCallout);
            } else {
                controls.append(solverBtn);
            }
        }

        const status = el("p", { class: "robot__status", role: "status", "aria-live": "polite" });
        const result = el("div", { class: "robot__result", hidden: true });

        /* Wins open a centered modal; misses stay inline next to the program. */
        const win = el("dialog", { class: "learn robot-win", "aria-labelledby": `robot-win-title-${root.dataset.robot}` });
        const winInner = el("div", { class: "learn__inner robot-win__inner" });

        /* Lives outside the inner content so it stays pinned while the dialog scrolls. */
        win.append(
            el("button", { type: "button", class: "learn__close", "data-win-close": true, "aria-label": "Close" }, "×"),
            winInner
        );
        document.body.append(win);
        win.addEventListener("click", (e) => {
            if (e.target === win || e.target.closest("[data-win-close]")) {
                win.close();
            }
        });
        win.addEventListener("close", () => runBtn.focus());

        panel.append(palette, targetNote, programHead, programList, controls, status, result);

        const showPicker = !ROTATING.has(setName) && levelIds.length > 1;

        if (showPicker) {
            root.append(picker);
        }

        const layout = el("div", { class: "robot__layout" });

        layout.append(boardWrap, panel);
        root.append(layout);

        /* ---------- rendering ---------- */

        const drawBoard = () => {
            board.setAttribute("viewBox", `0 0 ${level.cols * 10} ${level.rows * 10}`);
            board.setAttribute(
                "aria-label",
                `Level ${level.name}: A ${level.cols} by ${level.rows} grid. The robot starts at column ${level.start.x + 1}, row ${level.start.y + 1}, facing ${DIR_NAMES[level.start.d]}. The goal is at column ${level.goal.x + 1}, row ${level.goal.y + 1}.`
            );
            layerCells.textContent = "";

            for (let y = 0; y < level.rows; y += 1) {
                for (let x = 0; x < level.cols; x += 1) {
                    const wall = level.walls.has(`${x},${y}`);

                    layerCells.append(svg("rect", {
                        x: x * 10 + 0.4,
                        y: y * 10 + 0.4,
                        width: 9.2,
                        height: 9.2,
                        rx: wall ? 1.4 : 1,
                        class: wall ? "robot__wall" : "robot__cell"
                    }));
                }
            }

            goalMark.setAttribute("transform", `translate(${level.goal.x * 10} ${level.goal.y * 10})`);
            targets.textContent = "";
            targets.append(
                el("span", {}, `★ Reach the goal`),
                el("span", {}, `★★ Shortest path: ${level.minMoves} moves`),
                el("span", {}, `★★★ Fewest blocks: ${level.parBlocks}`)
            );
        };

        const placeRobot = (p, a) => {
            robot.setAttribute("transform", `translate(${p.x * 10} ${p.y * 10}) rotate(${a} 5 5)`);
        };

        const resetRobot = () => {
            pose = { ...level.start };
            angle = level.start.d * 90;
            placeRobot(pose, angle);
            layerTrail.textContent = "";
            layerSearch.textContent = "";
            robot.classList.remove("is-crashed", "is-home");
            highlight([]);
        };

        const drawPicker = () => {
            picker.textContent = "";

            const stars = readStars();

            levelIds.forEach((id, i) => {
                const b = el("button", {
                    type: "button",
                    class: "robot__level",
                    "aria-pressed": String(i === levelIndex)
                });

                b.append(el("span", { class: "robot__level-num" }, String(i + 1)), document.createTextNode(LEVELS[id].name), starIcons(stars[id] || 0));
                b.addEventListener("click", () => {
                    if (!busy) {
                        loadLevel(i);
                    }
                });
                picker.append(b);
            });
        };

        const blockLabel = (b) => (b.type === "repeat" ? "Repeat" : ACTIONS[b.type].label);

        const renderBlock = (b, isInner) => {
            const li = el("li", { class: `robot__block robot__block--${b.type}`, "data-id": b.id, draggable: "true" });
            const row = el("div", { class: "robot__block-row" });

            if (b.type === "repeat") {
                const selectBtn = el("button", {
                    type: "button",
                    class: "robot__block-label",
                    "aria-pressed": String(target === b.id),
                    title: "Select to add blocks inside this Repeat"
                });

                selectBtn.append(icon("repeat"), el("span", {}, "Repeat"));
                selectBtn.addEventListener("click", () => {
                    target = target === b.id ? null : b.id;
                    render();
                    focusBlock(b.id, ".robot__block-label");
                });

                const minus = el("button", { type: "button", class: "robot__step", "aria-label": "Fewer repeats" }, "−");
                const count = el("span", { class: "robot__times", "aria-live": "polite" }, `${b.count}×`);
                const plus = el("button", { type: "button", class: "robot__step robot__step--plus", "aria-label": "More repeats" }, "+");

                minus.addEventListener("click", () => {
                    b.count = Math.max(2, b.count - 1);
                    render();
                    focusBlock(b.id, ".robot__step");
                });
                plus.addEventListener("click", () => {
                    b.count = Math.min(9, b.count + 1);
                    render();
                    focusBlock(b.id, ".robot__step--plus");
                });

                row.append(selectBtn, minus, count, plus);
            } else {
                const label = el("span", { class: "robot__block-label robot__block-label--static", tabindex: "0", "aria-label": `${blockLabel(b)} block. Press Delete to remove, Alt and arrow keys to move.` });

                label.append(icon(b.type), el("span", {}, ACTIONS[b.type].label));
                row.append(label);
            }

            const remove = el("button", { type: "button", class: "robot__remove", "aria-label": `Remove ${blockLabel(b)} block` }, "×");

            remove.addEventListener("click", () => removeBlock(b.id));
            row.append(remove);
            li.append(row);

            if (b.type === "repeat") {
                const body = el("ol", { class: "robot__body", "data-list": String(b.id), "aria-label": `Inside Repeat ${b.count} times` });

                if (!b.body.length) {
                    body.append(el("li", { class: "robot__empty" }, target === b.id ? "Now tap a block above to add it here." : "Tap Repeat, then add blocks inside."));
                }

                b.body.forEach((inner) => body.append(renderBlock(inner, true)));
                li.append(body);

                if (target === b.id) {
                    li.classList.add("is-target");
                }
            }

            li.addEventListener("dragstart", (e) => {
                e.stopPropagation();
                e.dataTransfer.setData("text/plain", `move:${b.id}`);
                e.dataTransfer.effectAllowed = "move";
            });
            li.addEventListener("keydown", (e) => onBlockKey(e, b.id));

            if (isInner) {
                li.classList.add("is-inner");
            }

            return li;
        };

        const render = () => {
            programList.textContent = "";

            if (!program.length) {
                programList.append(el("li", { class: "robot__empty" }, "Tap or drag blocks here to build your program."));
            }

            program.forEach((b) => programList.append(renderBlock(b, false)));

            const n = countBlocks(program);
            const t = target && findBlock(program, target);

            blockCount.textContent = `${n} ${n === 1 ? "block" : "blocks"}`;
            targetNote.textContent = t ? `Adding blocks inside: Repeat ${t.block.count}×` : "Adding blocks to: Your program";
            runBtn.disabled = busy || !program.length;
            [resetBtn, clearBtn, solverBtn].forEach((b) => b && (b.disabled = busy));
            palette.querySelectorAll("button").forEach((b) => {
                b.disabled = busy;
            });
        };

        const focusBlock = (id, selector) => {
            const li = programList.querySelector(`[data-id="${id}"]`);
            const node = li && (li.querySelector(selector || ".robot__block-label") || li);

            node?.focus();
        };

        const highlight = (ids) => {
            programList.querySelectorAll(".is-running").forEach((n) => n.classList.remove("is-running"));
            ids.forEach((id) => programList.querySelector(`[data-id="${id}"]`)?.classList.add("is-running"));
        };

        /* ---------- editing ---------- */

        const say = (text) => {
            status.textContent = text;
        };

        const addBlock = (type, list, index) => {
            if (busy) {
                return;
            }

            if (countBlocks(program) >= MAX_BLOCKS) {
                say(`That is ${MAX_BLOCKS} blocks. Try a Repeat block to make your program shorter.`);
                return;
            }

            const t = target && findBlock(program, target);
            let dest = list || (t ? t.block.body : program);
            let at = index;

            /* Repeats cannot nest: a new Repeat goes into the main program, right after the current one. */
            if (type === "repeat" && dest !== program) {
                const outerIndex = program.findIndex((b) => b.type === "repeat" && b.body === dest);

                dest = program;
                at = outerIndex >= 0 ? outerIndex + 1 : program.length;
            }

            const block = makeBlock(type);

            dest.splice(at == null ? dest.length : at, 0, block);

            if (type === "repeat") {
                target = block.id;
                say("Repeat added. Now add the blocks it should repeat.");
            } else {
                say("");
            }

            hideResult();
            render();
        };

        const removeBlock = (id) => {
            if (busy) {
                return;
            }

            const f = findBlock(program, id);

            if (!f) {
                return;
            }

            f.list.splice(f.index, 1);

            if (target === id) {
                target = null;
            }

            hideResult();
            render();

            const next = f.list[f.index] || f.list[f.index - 1] || f.parent;

            if (next) {
                focusBlock(next.id);
            } else {
                palette.querySelector("button")?.focus();
            }
        };

        const moveBlock = (id, list, index) => {
            const f = findBlock(program, id);

            if (!f || (f.block.type === "repeat" && list !== program)) {
                return;
            }

            f.list.splice(f.index, 1);

            const at = list === f.list && index > f.index ? index - 1 : index;

            list.splice(Math.max(0, Math.min(at, list.length)), 0, f.block);
            hideResult();
            render();
        };

        const onBlockKey = (e, id) => {
            if (busy || e.target.closest("[data-id]")?.dataset.id !== String(id)) {
                return;
            }

            if (e.key === "Delete" || e.key === "Backspace") {
                e.preventDefault();
                removeBlock(id);
            } else if (e.altKey && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
                e.preventDefault();

                const f = findBlock(program, id);
                const to = f.index + (e.key === "ArrowUp" ? -1 : 2);

                if (to >= 0 && to <= f.list.length) {
                    moveBlock(id, f.list, to);
                    focusBlock(id);
                }
            }
        };

        /* Drag and drop (mouse and trackpad; touch and keyboard use tap-to-add). */
        const dropIndex = (listEl, y) => {
            const items = [...listEl.children].filter((c) => c.matches("[data-id]"));

            for (let i = 0; i < items.length; i += 1) {
                const r = items[i].getBoundingClientRect();

                if (y < r.top + r.height / 2) {
                    return i;
                }
            }

            return items.length;
        };

        const listFor = (listEl) => {
            if (listEl.dataset.list === "main") {
                return program;
            }

            return findBlock(program, Number(listEl.dataset.list))?.block.body || null;
        };

        /* A thin insertion line shows exactly where a dragged block will land. */
        const marker = el("li", { class: "robot__drop-marker", "aria-hidden": "true" });
        const clearDrop = () => {
            marker.remove();
            root.querySelectorAll(".is-drop").forEach((n) => n.classList.remove("is-drop"));
        };

        root.addEventListener("dragover", (e) => {
            const listEl = e.target.closest(".robot__program, .robot__body");

            if (!listEl || busy) {
                return;
            }

            e.preventDefault();

            if (!listEl.classList.contains("is-drop")) {
                root.querySelectorAll(".is-drop").forEach((n) => n.classList.remove("is-drop"));
                listEl.classList.add("is-drop");
            }

            const items = [...listEl.children].filter((c) => c.matches("[data-id]"));
            const index = dropIndex(listEl, e.clientY);
            const before = items[index] || null;

            if (marker.parentNode !== listEl || marker.nextElementSibling !== before) {
                listEl.insertBefore(marker, before);
            }
        });

        root.addEventListener("dragleave", (e) => {
            if (!root.contains(e.relatedTarget)) {
                clearDrop();
            }
        });

        root.addEventListener("dragend", clearDrop);

        root.addEventListener("drop", (e) => {
            const listEl = e.target.closest(".robot__program, .robot__body");

            clearDrop();

            if (!listEl || busy) {
                return;
            }

            e.preventDefault();

            const data = e.dataTransfer.getData("text/plain");
            const list = listFor(listEl);
            const index = dropIndex(listEl, e.clientY);

            if (!list) {
                return;
            }

            if (data.startsWith("new:")) {
                addBlock(data.slice(4), list, index);
            } else if (data.startsWith("move:")) {
                moveBlock(Number(data.slice(5)), list, index);
            }
        });

        /* ---------- running ---------- */

        const stepTime = reducedMotion ? 120 : 380;

        const animateTo = (from, to, fromAngle, toAngle, ms) => new Promise((resolve) => {
            if (reducedMotion) {
                placeRobot(to, toAngle);
                setTimeout(resolve, ms);
                return;
            }

            const t0 = performance.now();
            const tick = (now) => {
                const k = Math.min(1, (now - t0) / ms);
                const e = k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2;

                placeRobot(
                    { x: from.x + (to.x - from.x) * e, y: from.y + (to.y - from.y) * e },
                    fromAngle + (toAngle - fromAngle) * e
                );

                if (k < 1) {
                    requestAnimationFrame(tick);
                } else {
                    resolve();
                }
            };

            requestAnimationFrame(tick);
        });

        const dropTrail = (p) => {
            layerTrail.append(svg("circle", { cx: p.x * 10 + 5, cy: p.y * 10 + 5, r: 1.1, class: "robot__trail" }));
        };

        const hideResult = () => {
            result.hidden = true;
            result.textContent = "";
        };

        const showResult = (stars, title, body, extra) => {
            result.textContent = "";
            result.hidden = false;

            const head = el("div", { class: "robot__result-head" });

            if (stars != null) {
                head.append(starIcons(stars));
            }

            head.append(el("h4", { class: "robot__result-title" }, title));
            result.append(head, el("p", {}, body));

            const actions = el("div", { class: "robot__result-actions" });

            if (stars && learnId) {
                actions.append(el("button", { type: "button", class: "button button--small", "data-learn-open": learnId }, "What You Just Learned"));
            }

            if (stars && levelIndex < levelIds.length - 1) {
                const next = el("button", { type: "button", class: "button button--secondary button--small" }, "Next Level →");

                next.addEventListener("click", () => loadLevel(levelIndex + 1));
                actions.append(next);
            }

            if (extra) {
                actions.append(extra);
            }

            if (actions.childElementCount) {
                result.append(actions);
            }
        };

        const showWin = (stars, title, body) => {
            winInner.textContent = "";

            const big = starIcons(stars);

            big.classList.add("robot-win__stars");
            winInner.append(
                big,
                el("h2", { class: "robot-win__title", id: `robot-win-title-${root.dataset.robot}` }, title),
                el("p", { class: "robot-win__text" }, body)
            );

            const actions = el("div", { class: "robot-win__actions" });

            if (learnId) {
                actions.append(el("button", { type: "button", class: "button", "data-learn-open": learnId }, "What You Just Learned"));
            }

            if (levelIndex < levelIds.length - 1) {
                const next = el("button", { type: "button", class: "button button--secondary" }, "Next Level \u2192");

                next.addEventListener("click", () => {
                    win.close();
                    loadLevel(levelIndex + 1);
                });
                actions.append(next);
            } else if (stars < 3) {
                const again = el("button", { type: "button", class: "button button--secondary", "data-win-close": true }, "Try for 3 Stars");

                actions.append(again);
            } else {
                actions.append(el("button", { type: "button", class: "button button--secondary", "data-win-close": true }, "Close"));
            }

            winInner.append(actions);
            win.showModal();
        };

        const run = async () => {
            if (busy || !program.length) {
                return;
            }

            busy = true;
            target = null;
            hideResult();
            resetRobot();
            render();

            const steps = flatten(program);
            const usedLoop = program.some((b) => b.type === "repeat" && b.body.length);
            let moves = 0;
            let outcome = "short";

            dropTrail(pose);

            for (let i = 0; i < steps.length; i += 1) {
                const { action, ids } = steps[i];

                highlight(ids);
                say(`Step ${i + 1} of ${steps.length}: ${ACTIONS[action].label}`);

                const next = applyAction(level, pose, action);

                if (!next) {
                    /* Bump into the wall and back. */
                    const bump = { x: pose.x + DIRS[pose.d][0] * 0.25, y: pose.y + DIRS[pose.d][1] * 0.25 };

                    robot.classList.add("is-crashed");
                    await animateTo(pose, bump, angle, angle, stepTime / 2);
                    await animateTo(bump, pose, angle, angle, stepTime / 2);
                    outcome = { crash: i + 1 };
                    break;
                }

                moves += 1;

                const nextAngle = action === "L" ? angle - 90 : action === "R" ? angle + 90 : angle;

                await animateTo(pose, next, angle, nextAngle, stepTime);
                pose = next;
                angle = nextAngle;

                if (action === "F") {
                    dropTrail(pose);
                }

                if (pose.x === level.goal.x && pose.y === level.goal.y) {
                    outcome = "goal";
                    break;
                }
            }

            highlight([]);
            busy = false;
            render();

            const blocks = countBlocks(program);

            if (outcome === "goal") {
                robot.classList.add("is-home");

                const shortest = moves === level.minMoves;
                const fewest = shortest && blocks <= level.parBlocks;
                const stars = fewest ? 3 : shortest ? 2 : 1;

                saveStars(level.id, stars);

                if (showPicker) {
                    drawPicker();
                }

                say(`Goal reached in ${moves} moves with ${blocks} blocks.`);

                if (stars === 3) {
                    showWin(3, "Perfect Program!", `Shortest path, fewest blocks. ${usedLoop ? "You just wrote a loop: One instruction that runs many times." : "That is clean, efficient code."}`);
                } else if (stars === 2) {
                    showWin(2, "Shortest Path Found!", `Now make it shorter to write. Can you do it in ${level.parBlocks} blocks? Hint: Try a Repeat block.`);
                } else {
                    showWin(1, "You Made It!", `The robot took ${moves} moves. The shortest path takes ${level.minMoves}. Can you find it?`);
                }
            } else if (outcome.crash) {
                say(`The robot hit a wall on step ${outcome.crash}.`);
                showResult(0, "Bonk!", `The robot hit a wall on step ${outcome.crash}. Find the block that sent it the wrong way, fix it, and run it again. That is debugging.`);
            } else {
                say("The program ended before the robot reached the goal.");
                showResult(0, "So Close!", "The robot ran out of instructions before it reached the goal. Add a few more blocks and run it again.");
            }
        };

        /* ---------- "Watch the Computer Solve It" ---------- */

        const runSolver = async (mode = "breadth") => {
            if (busy) {
                return;
            }

            busy = true;
            hideResult();
            resetRobot();
            render();

            const wait = reducedMotion ? 15 : 70;

            const bidirectional = mode === "bidirectional";
            const searchOrder = bidirectional ? level.bidirectionalOrder : level.searchOrder;

            say(bidirectional
                ? "Searching from both ends until the two frontiers meet…"
                : "Searching: Checking every square one step away, then two, then three…");

            for (const cell of searchOrder) {
                const [x, y] = cell.split(",").map(Number);

                layerSearch.append(svg("rect", { x: x * 10 + 1.6, y: y * 10 + 1.6, width: 6.8, height: 6.8, rx: 1.2, class: "robot__searched" }));
                await sleep(wait);
            }

            /* Drive the shortest path the search found. */
            dropTrail(pose);

            for (const action of level.bestSequence) {
                const next = applyAction(level, pose, action);
                const nextAngle = action === "L" ? angle - 90 : action === "R" ? angle + 90 : angle;

                await animateTo(pose, next, angle, nextAngle, reducedMotion ? 60 : 200);
                pose = next;
                angle = nextAngle;

                if (action === "F") {
                    dropTrail(pose);
                }
            }

            robot.classList.add("is-home");
            busy = false;
            render();
            const method = bidirectional ? "Bidirectional Search" : "Breadth-First Search";
            say(`The computer checked ${searchOrder.length} squares and found a ${level.minMoves}-move path.`);
            showResult(null, method, bidirectional
                ? `The computer searched outward from the start and the goal until the two frontiers met. That can reduce the work on larger maps while still finding a shortest path. Now try to match it with ${level.parBlocks} blocks.`
                : `The computer checked each frontier layer, closest first, so the first path it found to the goal is guaranteed to be the shortest. Now try to match it with ${level.parBlocks} blocks.`);

            if (learnId) {
                const learnSearch = el("button", { type: "button", class: "button button--small", "data-learn-open": `${learnId}-${bidirectional ? "bidirectional" : "search"}` }, "What You Just Saw");
                const alternate = el("button", { type: "button", class: "button button--secondary button--small" }, bidirectional ? "Prefer Breadth-First Search" : "Try Bidirectional Search");

                alternate.addEventListener("click", () => runSolver(bidirectional ? "breadth" : "bidirectional"));

                const actions = el("div", { class: "robot__result-actions" });

                actions.append(learnSearch, alternate);
                result.append(actions);
            }
        };

        /* ---------- level loading and wiring ---------- */

        const loadLevel = (i) => {
            levelIndex = i;
            level = parseLevel(levelIds[i]);
            program = [];
            target = null;
            hideResult();
            say("");
            drawBoard();
            resetRobot();
            render();

            if (showPicker) {
                drawPicker();
            }
        };

        runBtn.addEventListener("click", run);
        resetBtn.addEventListener("click", () => {
            if (!busy) {
                hideResult();
                resetRobot();
                say("");
            }
        });
        clearBtn.addEventListener("click", () => {
            if (!busy) {
                program = [];
                target = null;
                hideResult();
                resetRobot();
                render();
                say("");
            }
        });
        solverBtn?.addEventListener("click", runSolver);

        let first = 0;

        if (ROTATING.has(setName)) {
            try {
                const all = JSON.parse(localStorage.getItem(ROTATE_KEY)) || {};

                first = ((Number(all[setName]) || 0) + 1) % levelIds.length;

                if (!(setName in all)) {
                    first = 0;
                }

                all[setName] = first;
                localStorage.setItem(ROTATE_KEY, JSON.stringify(all));
            } catch {
                first = Math.floor(Math.random() * levelIds.length);
            }
        }

        loadLevel(first);
    };

    document.querySelectorAll("[data-robot]").forEach(createGame);

    /* Exposed for automated checks. */
    window.BYUIRobot = { LEVELS, SETS, parseLevel, encodeCost, findUnreachable };
})();
