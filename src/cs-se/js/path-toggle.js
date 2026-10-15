/* Choose which major's four-year plan is visible. */
(() => {
    const switchers = document.querySelectorAll(".path-switcher");
    const panels = document.querySelectorAll("[data-path-panel]");
    if (!switchers.length || !panels.length) return;

    const initial = window.location.pathname.includes("software-engineering") ? "se" : "cs";
    const setTrack = (track) => {
        panels.forEach((panel) => {
            panel.hidden = panel.dataset.pathPanel !== track;
        });
        document.querySelectorAll("[data-path-choice]").forEach((button) => {
            button.setAttribute("aria-pressed", String(button.dataset.pathChoice === track));
        });
    };

    document.querySelectorAll("[data-path-choice]").forEach((button) => {
        button.addEventListener("click", () => setTrack(button.dataset.pathChoice));
    });
    setTrack(initial);
})();
