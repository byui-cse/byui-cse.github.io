/**
 * Shared UI behavior:
 *  - Popups (mobile menu, Lights panel): only one open at a time; each closes on
 *    Escape, on a click outside, or when keyboard focus moves outside it.
 *  - FAQ lists: opening one question closes the others in the same list.
 *  - Current-page highlighting in the nav.
 */

/**
 * Register a toggle button + panel pair as a popup.
 * The panel is shown when the button's aria-expanded is "true".
 * @param {HTMLElement} root     element containing both button and panel
 * @param {HTMLButtonElement} button
 * @param {(open: boolean) => void} [onChange]
 */
const registerPopup = (root, button, onChange) => {
    const isOpen = () => button.getAttribute("aria-expanded") === "true";

    const setOpen = (open, { restoreFocus = false } = {}) => {
        if (open === isOpen()) {
            return;
        }

        button.setAttribute("aria-expanded", String(open));
        onChange?.(open);

        if (open) {
            document.dispatchEvent(new CustomEvent("byui:popup-open", { detail: root }));
        } else if (restoreFocus) {
            button.focus();
        }
    };

    button.addEventListener("click", () => setOpen(!isOpen()));

    /* Another popup opened: close this one. */
    document.addEventListener("byui:popup-open", (event) => {
        if (event.detail !== root) {
            setOpen(false);
        }
    });

    /* Click outside. */
    document.addEventListener("click", (event) => {
        if (isOpen() && !root.contains(event.target)) {
            setOpen(false);
        }
    });

    /* Keyboard focus moved somewhere outside. */
    root.addEventListener("focusout", (event) => {
        if (isOpen() && event.relatedTarget && !root.contains(event.relatedTarget)) {
            setOpen(false);
        }
    });

    root.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && isOpen()) {
            setOpen(false, { restoreFocus: true });
        }
    });

    return { setOpen, isOpen };
};

window.BYUIPopup = { register: registerPopup };

const initNav = () => {
    const nav = document.querySelector(".site-nav");

    if (!nav) {
        return;
    }

    const toggle = nav.querySelector(".site-nav__toggle");

    if (toggle) {
        const popup = registerPopup(nav, toggle, (open) => {
            document.documentElement.classList.toggle("menu-open", open);
        });
        const wide = window.matchMedia("(min-width: 64rem)");

        /* Leaving the mobile layout should not leave a hidden menu "open". */
        wide.addEventListener("change", () => popup.setOpen(false));
    }

    const path = window.location.pathname.replace(/\\/g, "/");
    const file = path.split("/").pop() || "index.html";
    const key = file.replace(/\.html$/i, "") || "index";

    nav.querySelectorAll(".site-nav__link[data-nav]").forEach((link) => {
        if (link.getAttribute("data-nav") === key) {
            link.setAttribute("aria-current", "page");
        } else {
            link.removeAttribute("aria-current");
        }
    });
};

/**
 * FAQ lists: one open answer at a time per list.
 * (Native <details name> does this in newer browsers; this covers the rest.)
 */
const initFaqs = () => {
    document.querySelectorAll(".faq").forEach((list) => {
        const items = list.querySelectorAll("details");

        items.forEach((item) => {
            item.addEventListener("toggle", () => {
                if (!item.open) {
                    return;
                }

                items.forEach((other) => {
                    if (other !== item && other.open) {
                        other.open = false;
                    }
                });
            });
        });
    });
};

initNav();
initFaqs();
