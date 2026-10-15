/**
 * Lights control (header) and the shared Learn dialog.
 * Colors are computed by lights-core.js; popup behavior comes from nav.js.
 */
let lightsPopup = null;

const initLights = () => {
    const lights = window.BYUILights;
    const root = document.querySelector("[data-lights-control]");

    if (!lights || !root || !window.BYUIPopup) {
        return;
    }

    const toggle = root.querySelector("[data-lights-toggle]");
    const panel = root.querySelector("[data-lights-panel]");
    const range = root.querySelector("[data-lights-range]");
    const output = root.querySelector("[data-lights-value]");

    const show = (level) => {
        range.value = String(level);
        output.textContent = `${level}%`;
        range.setAttribute("aria-valuetext", `${level} percent`);
    };

    show(lights.current ?? 100);

    range.addEventListener("input", () => {
        const level = lights.apply(range.value).level;

        lights.current = level;
        lights.save(level);
        show(level);
    });

    lightsPopup = window.BYUIPopup.register(root, toggle, (open) => {
        panel.hidden = !open;

        if (open) {
            range.focus();
        }
    });
};

/**
 * Any element with data-learn-open="dialog-id" opens that <dialog class="learn">.
 * Dialogs close on Escape (native), the close button, or a click on the backdrop,
 * and focus returns to whatever opened them.
 */
const initLearnDialogs = () => {
    const returnFocus = new WeakMap();

    document.addEventListener("click", (event) => {
        const opener = event.target.closest("[data-learn-open]");

        if (opener) {
            const dialog = document.getElementById(opener.dataset.learnOpen);

            if (!(dialog instanceof HTMLDialogElement)) {
                return;
            }

            /* If the opener lives in a popup (e.g. the Lights panel), close it and
               return focus to that popup's button instead of a hidden element. */
            const popupRoot = opener.closest("[data-lights-control]");

            if (popupRoot && lightsPopup) {
                lightsPopup.setOpen(false);
                returnFocus.set(dialog, popupRoot.querySelector("[data-lights-toggle]"));
            } else {
                returnFocus.set(dialog, opener);
            }

            /* Close other Learn panels, but keep an open game underneath. */
            document.querySelectorAll("dialog.learn[open]:not(.learn--game)").forEach((other) => other.close());
            dialog.showModal();
            return;
        }

        if (event.target.closest("[data-learn-close]")) {
            event.target.closest("dialog")?.close();
            return;
        }

        /* A click on the backdrop lands on the <dialog> element itself. */
        if (event.target instanceof HTMLDialogElement && event.target.classList.contains("learn") && !event.target.classList.contains("learn--game")) {
            event.target.close();
        }
    });

    document.querySelectorAll("dialog.learn").forEach((dialog) => {
        dialog.addEventListener("close", () => {
            returnFocus.get(dialog)?.focus();
        });
    });
};

initLights();
initLearnDialogs();
