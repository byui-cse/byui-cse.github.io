/**
 * Challenge puzzles that share one simple shell with the robot game: level chips,
 * a goal, a play area, and a result with "Next Level". Solved levels are saved on
 * this device.
 *
 *   bits     Flip the Bits: flip 8 switches to make a number or letter.
 *   circuit  Circuit Builder: pick logic gates so the lights match the goal.
 *   cipher   Security Puzzles: crack Caesar ciphers, then think like a defender.
 *
 * Markup: <div class="puzzle" data-puzzle="bits|circuit|cipher"></div>
 */
(() => {
    "use strict";

    const SAVE_KEY = "byui-cse-puzzles";

    /* ---------- Helpers ---------- */

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

    const readSolved = () => {
        try {
            return JSON.parse(localStorage.getItem(SAVE_KEY)) || {};
        } catch {
            return {};
        }
    };

    const saveSolved = (id) => {
        try {
            const all = readSolved();

            all[id] = true;
            localStorage.setItem(SAVE_KEY, JSON.stringify(all));
        } catch {
            /* storage blocked: progress just is not remembered */
        }
    };

    /* ---------- Flip the Bits ---------- */

    const BITS = [
        { goal: "Make the number 5.", target: 5 },
        { goal: "Make the number 12.", target: 12 },
        { goal: "Make the number 42.", target: 42 },
        { goal: "Make the biggest number 8 bits can hold.", target: 255 },
        { goal: "Make the letter A. Computers store it as the number 65.", target: 65, letter: true },
        { goal: "Spell the letter C, for Computer. You know A is 65.", target: 67, letter: true }
    ];

    const bitsGame = (level, stage, done) => {
        let value = 0;
        const row = el("div", { class: "puzzle__bits", role: "group", "aria-label": "Eight switches" });
        const readout = el("p", { class: "puzzle__readout", "aria-live": "polite" });

        const update = () => {
            const letter = value === 32 ? "space" : value > 32 && value <= 126 ? String.fromCharCode(value) : "none";

            readout.textContent = level.letter
                ? `Number: ${value} · Letter: ${letter}`
                : `Number: ${value}`;

            if (value === level.target) {
                done(level.letter
                    ? `${value} is the letter ${String.fromCharCode(value)}. Every letter you type is stored as a number like this.`
                    : `${value} in binary is ${value.toString(2).padStart(8, "0")}. Each switch doubles the one to its right.`);
            }
        };

        [128, 64, 32, 16, 8, 4, 2, 1].forEach((place) => {
            const button = el("button", { type: "button", class: "puzzle__bit", "aria-pressed": "false", "aria-label": `${place}s switch` });

            button.append(el("span", { class: "puzzle__bit-value" }, "0"), el("span", { class: "puzzle__bit-place" }, String(place)));
            button.addEventListener("click", () => {
                const on = button.getAttribute("aria-pressed") !== "true";

                button.setAttribute("aria-pressed", String(on));
                button.firstChild.textContent = on ? "1" : "0";
                value += on ? place : -place;
                update();
            });
            row.append(button);
        });

        stage.append(row, readout);
        update();
    };

    /* ---------- Circuit Builder ---------- */

    const GATES = {
        AND: (a, b) => a && b,
        OR: (a, b) => a || b,
        XOR: (a, b) => a !== b,
        NOT: (a) => !a
    };

    /* Each level: input names, gate slots, how the outputs are wired, and the goal. */
    const CIRCUITS = [
        {
            goal: "Light the lamp only when switch A and switch B are both on.",
            inputs: ["A", "B"], slots: [["AND", "OR", "XOR"]], lamps: ["Lamp"],
            wire: ([a, b], [g]) => [g(a, b)],
            target: ([a, b]) => [a && b]
        },
        {
            goal: "Light the lamp when either switch is on, or both.",
            inputs: ["A", "B"], slots: [["AND", "OR", "XOR"]], lamps: ["Lamp"],
            wire: ([a, b], [g]) => [g(a, b)],
            target: ([a, b]) => [a || b]
        },
        {
            goal: "Light the lamp when the switch is off. A night light!",
            inputs: ["A"], slots: [["AND", "OR", "NOT"]], lamps: ["Lamp"],
            wire: ([a], [g]) => [g(a, a)],
            target: ([a]) => [!a]
        },
        {
            goal: "Light the lamp when exactly one switch is on, but not both.",
            inputs: ["A", "B"], slots: [["AND", "OR", "XOR"]], lamps: ["Lamp"],
            wire: ([a, b], [g]) => [g(a, b)],
            target: ([a, b]) => [a !== b]
        },
        {
            goal: "Light the lamp when A and B are both on, or when C is on.",
            inputs: ["A", "B", "C"], slots: [["AND", "OR", "XOR"], ["AND", "OR", "XOR"]], lamps: ["Lamp"],
            wire: ([a, b, c], [g1, g2]) => [g2(g1(a, b), c)],
            target: ([a, b, c]) => [(a && b) || c],
            layout: "(A [1] B) [2] C"
        },
        {
            goal: "Add two 1-bit numbers. Sum shows the ones place; Carry lights when 1 + 1 makes 10.",
            inputs: ["A", "B"], slots: [["AND", "OR", "XOR"], ["AND", "OR", "XOR"]], lamps: ["Sum", "Carry"],
            wire: ([a, b], [g1, g2]) => [g1(a, b), g2(a, b)],
            target: ([a, b]) => [a !== b, a && b],
            layout: "Sum = A [1] B · Carry = A [2] B"
        }
    ];

    const allInputs = (n) => Array.from({ length: 2 ** n }, (_, i) =>
        Array.from({ length: n }, (_, bit) => Boolean((i >> (n - 1 - bit)) & 1)));

    const circuitGame = (level, stage, done) => {
        const inputs = level.inputs.map(() => false);
        const picks = level.slots.map(() => null);
        const switches = el("div", { class: "puzzle__switches", role: "group", "aria-label": "Switches" });
        const slots = el("div", { class: "puzzle__slots" });
        const lamps = el("div", { class: "puzzle__lamps", "aria-live": "polite" });
        const table = el("table", { class: "puzzle__table" });
        const tableWrap = el("div", { class: "puzzle__table-wrap" });
        const tested = new Set(); /* switch combinations the player has actually tried */
        const comboKey = (combo) => combo.map(Number).join("");

        tableWrap.append(table);

        if (level.layout) {
            stage.append(el("p", { class: "puzzle__layout" }, level.layout));
        }

        const gateFns = () => picks.map((name) => (name ? GATES[name] : () => false));

        const render = () => {
            const out = level.wire(inputs, gateFns());
            const ready = picks.every(Boolean);

            if (ready) {
                tested.add(comboKey(inputs));
            }

            lamps.textContent = "";
            level.lamps.forEach((name, i) => {
                const lamp = el("span", { class: `puzzle__lamp${ready && out[i] ? " is-on" : ""}` });

                lamp.append(el("span", { class: "puzzle__lamp-bulb", "aria-hidden": "true" }), el("span", {}, !ready ? "Pick a gate" : level.lamps.length > 1 ? `${name}: ${out[i] ? "on" : "off"}` : (out[i] ? "On" : "Off")));
                lamps.append(lamp);
            });

            /* Truth table: every switch combination, the goal, and what the circuit does. */
            table.textContent = "";
            const head = el("tr");

            [...level.inputs, ...level.lamps.flatMap((n) => [`${n} should be`, `Your ${n.toLowerCase()}`]), "Match"]
                .forEach((h) => head.append(el("th", { scope: "col" }, h)));
            table.append(el("caption", {}, `Tested ${tested.size} of ${2 ** level.inputs.length} switch combinations`), head);

            let all = ready;

            allInputs(level.inputs.length).forEach((combo) => {
                const key = comboKey(combo);
                const isTested = tested.has(key);
                const tr = el("tr", { class: key === comboKey(inputs) ? "is-current" : "" });
                const want = level.target(combo);
                const got = level.wire(combo, gateFns());
                const ok = want.every((w, i) => w === got[i]);
                const onOff = (v) => (v ? "on" : "off");

                all = all && isTested && ok;
                combo.forEach((v) => tr.append(el("td", {}, onOff(v))));
                want.forEach((v, i) => tr.append(el("td", {}, onOff(v)), el("td", {}, isTested ? onOff(got[i]) : "?")));
                tr.append(el("td", { class: isTested && ok ? "is-ok" : "" }, isTested ? (ok ? "✓" : "✗") : "Not tested"));
                table.append(tr);
            });

            if (all) {
                done(level.lamps.length > 1
                    ? "You built a half adder. Join two of them with an OR gate and you get a full adder. Chain full adders together and you can add numbers of any size, which is how processors do math."
                    : "Every combination matches. That table is called a truth table, and engineers use them to prove circuits work.");
            }
        };

        level.inputs.forEach((name, i) => {
            const b = el("button", { type: "button", class: "puzzle__switch", "aria-pressed": "false" }, `${name}: off`);

            b.addEventListener("click", () => {
                inputs[i] = !inputs[i];
                b.setAttribute("aria-pressed", String(inputs[i]));
                b.textContent = `${name}: ${inputs[i] ? "on" : "off"}`;
                render();
            });
            switches.append(b);
        });

        level.slots.forEach((options, i) => {
            const group = el("div", { class: "puzzle__slot", role: "group", "aria-label": level.slots.length > 1 ? `Gate ${i + 1}` : "Gate" });

            if (level.slots.length > 1) {
                group.append(el("span", { class: "puzzle__slot-label" }, `Gate ${i + 1}`));
            }

            options.forEach((name) => {
                const b = el("button", { type: "button", class: "puzzle__gate", "aria-pressed": "false" }, name);

                b.addEventListener("click", () => {
                    picks[i] = name;
                    tested.clear();
                    group.querySelectorAll(".puzzle__gate").forEach((g) => g.setAttribute("aria-pressed", String(g === b)));
                    render();
                });
                group.append(b);
            });
            slots.append(group);
        });

        /* One row that reads like the circuit: Switches -> Gate -> Lamp. */
        const part = (label, content) => {
            const wrap = el("div", { class: "puzzle__part" });

            wrap.append(el("span", { class: "puzzle__part-label" }, label), content);
            return wrap;
        };
        const arrow = () => el("span", { class: "puzzle__arrow", "aria-hidden": "true" }, "→");
        const row = el("div", { class: "puzzle__circuit" });

        row.append(
            part("Switches", switches), arrow(),
            part(level.slots.length > 1 ? "Gates" : "Gate", slots), arrow(),
            part(level.lamps.length > 1 ? "Lamps" : "Lamp", lamps)
        );
        stage.append(el("p", { class: "puzzle__label" }, "Pick a gate, then flip the switches through every combination to prove your circuit works."), row, tableWrap);
        render();
    };

    /* ---------- Security Puzzles ---------- */

    const shift = (text, n) => text.replace(/[A-Z]/g, (ch) =>
        String.fromCharCode(((ch.charCodeAt(0) - 65 + n + 26) % 26) + 65));

    const CIPHERS = [
        {
            type: "caesar",
            goal: "Every letter was moved 3 places forward. Set the key to 3, then use the strip to decode the word.",
            answer: "HELLO", key: 3
        },
        {
            type: "caesar",
            goal: "New key, and we are not telling. Hint: The real word starts with B. Find the key that turns the first letter into B.",
            answer: "BUILD", key: 7
        },
        {
            type: "caesar",
            goal: "Codebreaker trick: Find the one-letter word. In English it is almost always A or I. That gives away the key.",
            answer: "THINK LIKE A DEFENDER", key: 11
        },
        {
            type: "choose",
            goal: "Think like a defender. Which password would a cracking tool guess first?",
            options: ["password123", "Tr0ub4dor&3", "lantern-orbit-maple-gravel", "m7#Qv!2pLz9&"],
            answer: "password123",
            win: "Right. Common words and number patterns are the first thing attackers try."
        },
        {
            type: "choose",
            goal: "Now pick the strongest password, the one that would take longest to guess.",
            options: ["Summer2026!", "byuidaho", "lantern-orbit-maple-gravel", "qwerty"],
            answer: "lantern-orbit-maple-gravel",
            win: "Right. Length beats cleverness. Four random words make a password that is long, strong, and still easy to remember."
        }
    ];

    const cipherGame = (level, stage, done) => {
        if (level.type === "choose") {
            const group = el("div", { class: "puzzle__choices", role: "group", "aria-label": "Passwords" });
            const note = el("p", { class: "puzzle__readout", "aria-live": "polite" });

            level.options.forEach((option) => {
                const b = el("button", { type: "button", class: "puzzle__choice" }, option);

                b.addEventListener("click", () => {
                    if (stage.dataset.solved) {
                        return;
                    }

                    if (option === level.answer) {
                        b.classList.add("is-right");
                        note.textContent = "";
                        done(level.win);
                    } else {
                        b.classList.add("is-wrong");
                        note.textContent = "Not quite. Think about what an attacker would try first.";
                    }
                });
                group.append(b);
            });
            stage.append(group, note);
            return;
        }

        /* The player decodes by hand: the key only moves a letter strip, and they type the answer. */
        const secret = shift(level.answer, level.key);
        const sliderId = `cipher-key-${Math.random().toString(36).slice(2, 8)}`;
        const label = el("label", { class: "puzzle__key-label", for: sliderId }, "Key: ");
        const keyValue = el("output", {}, "0");
        const slider = el("input", { type: "range", min: "0", max: "25", value: "0", class: "puzzle__key", id: sliderId });
        const strip = el("div", { class: "puzzle__strip", tabindex: "0", role: "region", "aria-label": "Decoder strip: secret letters above real letters" });
        const form = el("form", { class: "puzzle__answer" });
        const answer = el("input", { type: "text", class: "puzzle__answer-input", autocomplete: "off", spellcheck: "false", "aria-label": "Your decoded message", placeholder: "Type the real message" });
        const note = el("p", { class: "puzzle__readout", "aria-live": "polite" });
        const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

        label.append(keyValue);
        form.append(answer, el("button", { type: "submit", class: "button button--small" }, "Check"));

        const drawStrip = () => {
            const n = Number(slider.value);

            keyValue.textContent = String(n);
            strip.textContent = "";
            strip.append(el("span", { class: "puzzle__strip-label" }, "Secret"), el("span", { class: "puzzle__strip-label" }, "Real"));
            letters.forEach((real) => {
                strip.append(el("span", { class: "puzzle__strip-secret" }, shift(real, n)), el("span", { class: "puzzle__strip-real" }, real));
            });
        };

        form.addEventListener("submit", (event) => {
            event.preventDefault();

            if (stage.dataset.solved) {
                return;
            }

            const guess = answer.value.toUpperCase().replace(/[^A-Z]+/g, " ").trim();

            if (guess === level.answer) {
                note.textContent = "";
                done(`Key ${level.key} cracks it. This is a Caesar cipher, one of the oldest codes there is. With only 25 useful keys, a computer breaks it instantly. Modern encryption uses keys with so many options that trying them all would take billions of years.`);
            } else {
                note.textContent = "Not yet. Match each secret letter on the top row to the real letter under it.";
            }
        });

        slider.addEventListener("input", drawStrip);
        stage.append(
            el("p", { class: "puzzle__label" }, "Secret message"),
            el("p", { class: "puzzle__coded" }, secret),
            label, slider, strip, form, note
        );
        drawStrip();
    };

    /* ---------- Shared shell ---------- */

    const GAMES = {
        bits: { levels: BITS, play: bitsGame },
        circuit: { levels: CIRCUITS, play: circuitGame },
        cipher: { levels: CIPHERS, play: cipherGame }
    };

    const createPuzzle = (root) => {
        const game = GAMES[root.dataset.puzzle];

        if (!game) {
            return;
        }

        root.textContent = "";

        const picker = el("div", { class: "robot__levels", role: "group", "aria-label": "Levels" });
        const goal = el("p", { class: "puzzle__goal" });
        const stage = el("div", { class: "puzzle__stage" });
        const result = el("div", { class: "robot__result", hidden: true, "aria-live": "polite" });
        let current = 0;
        let solved = false;

        const levelKey = (i) => `${root.dataset.puzzle}-${i}`;

        const drawPicker = () => {
            const saved = readSolved();

            picker.textContent = "";
            game.levels.forEach((_, i) => {
                const b = el("button", { type: "button", class: "robot__level", "aria-pressed": String(i === current) });

                b.append(el("span", { class: "robot__level-num" }, String(i + 1)), el("span", {}, saved[levelKey(i)] ? "Solved ✓" : `Level ${i + 1}`));
                b.addEventListener("click", () => load(i, true));
                picker.append(b);
            });
        };

        const done = (message) => {
            if (solved) {
                return;
            }

            solved = true;
            stage.dataset.solved = "true";
            saveSolved(levelKey(current));
            drawPicker();
            result.textContent = "";
            result.hidden = false;
            result.append(el("h4", { class: "robot__result-title" }, current === game.levels.length - 1 ? "You Solved Them All!" : "Solved!"), el("p", {}, message));

            if (current < game.levels.length - 1) {
                const next = el("button", { type: "button", class: "button button--secondary button--small" }, "Next Level →");
                const actions = el("div", { class: "robot__result-actions" });

                next.addEventListener("click", () => load(current + 1, true));
                actions.append(next);
                result.append(actions);
            }
        };

        const load = (i, moveFocus = false) => {
            current = i;
            solved = false;
            delete stage.dataset.solved;
            result.hidden = true;
            stage.textContent = "";
            goal.textContent = game.levels[i].goal;
            drawPicker();
            game.play(game.levels[i], stage, done);

            if (moveFocus) {
                picker.querySelector('[aria-pressed="true"]')?.focus();
            }
        };

        root.append(picker, goal, stage, result);
        load(0);
    };

    document.querySelectorAll("[data-puzzle]").forEach(createPuzzle);

    /* A link like challenges.html#game-circuit opens that game right away. */
    let hashId = "";

    try {
        hashId = decodeURIComponent(window.location.hash.slice(1));
    } catch {
        /* malformed hash: ignore */
    }

    const linked = hashId ? document.getElementById(hashId) : null;

    if (linked instanceof HTMLDialogElement && linked.classList.contains("learn--game")) {
        linked.showModal();
    }
})();
