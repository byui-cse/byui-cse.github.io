/*
 * A|B media slots ([data-media-cycle]): each slot holds one or two .slot__media items.
 *  - Images swap every 3 seconds.
 *  - YouTube videos swap every 10 seconds. Each skips its first and last 30 seconds and
 *    loops inside that range. The hidden video pauses, then resumes 10 seconds further on,
 *    and is only shown once it is actually playing.
 *  - Clicking a video opens the CSE channel, or the video itself in [data-video-link] slots.
 *  - [data-video-sound] slots get a sound toggle; [data-video-text] blocks follow the video.
 * Reduced-motion visitors see only the first item.
 */
(() => {
    const IMAGE_DELAY = 3000;
    const VIDEO_DELAY = 10000;
    const TRIM = 30;
    const JUMP = 10;
    const START_TIMEOUT = 5000;
    const CHANNEL = "https://www.youtube.com/@byui-cse";
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const slots = [...document.querySelectorAll("[data-media-cycle]")];
    const imageSlots = slots.filter((slot) => slot.dataset.mediaCycle !== "video");
    const videoSlots = slots.filter((slot) => slot.dataset.mediaCycle === "video");

    /* ---------- Images ---------- */

    imageSlots.forEach((slot) => {
        const items = slot.querySelectorAll(".slot__media");
        if (items.length < 2 || reducedMotion) return;
        let current = 0;
        setInterval(() => {
            items[current].classList.remove("is-active");
            current = (current + 1) % items.length;
            items[current].classList.add("is-active");
        }, IMAGE_DELAY);
    });

    if (!videoSlots.length) return;

    /* ---------- Videos ---------- */

    const players = new Map();
    const videoId = (frame) => frame.src.match(/embed\/([\w-]+)/)?.[1];
    const activeFrame = (slot) => slot.querySelector("iframe.slot__media.is-active");
    const isActive = (frame) => frame.classList.contains("is-active");
    const soundOn = (slot) => slot.querySelector(".slot__sound")?.getAttribute("aria-pressed") === "true";

    /** Videos too short to trim just play and loop from the start. */
    const canTrim = (player) => player.getDuration() > TRIM * 2 + JUMP;

    /** Keep a time inside the trimmed range, wrapping back to its start. */
    const clamp = (player, time) => {
        /* Duration reads 0 until a video has played once; assume it is long enough to trim. */
        if (!player.getDuration()) return Math.max(time, TRIM);
        if (!canTrim(player)) return time;
        return time >= player.getDuration() - TRIM ? TRIM : Math.max(time, TRIM);
    };

    /** Point the slot's link at the visible video (only in [data-video-link] slots). */
    const updateLink = (slot) => {
        const link = slot.querySelector(".slot__channel-link");
        if (!link || !slot.hasAttribute("data-video-link")) return;
        const frame = activeFrame(slot);
        link.href = `https://youtu.be/${videoId(frame)}`;
        link.setAttribute("aria-label", `Watch on YouTube: ${frame.title}`);
    };

    /** Show the [data-video-text] block that matches the visible video. */
    const syncText = (slot) => {
        const id = videoId(activeFrame(slot));
        (slot.closest("section") || document).querySelectorAll("[data-video-text]").forEach((item) => {
            item.classList.toggle("is-active", item.dataset.videoText === id);
        });
    };

    // Overlay link with a YouTube logo (bottom right, like YouTube's own) and optional sound toggle.
    videoSlots.forEach((slot) => {
        const link = document.createElement("a");
        link.className = "slot__channel-link";
        link.href = CHANNEL;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.setAttribute("aria-label", "Watch more on the BYU-Idaho CSE YouTube channel");
        link.innerHTML = '<svg viewBox="0 0 28 20" aria-hidden="true"><rect width="28" height="20" rx="5" fill="#ff0000"/><path d="M11 6l7 4-7 4z" fill="#ffffff"/></svg>';
        slot.append(link);
        updateLink(slot);

        if (!slot.hasAttribute("data-video-sound")) return;
        const button = document.createElement("button");
        button.type = "button";
        button.className = "slot__sound";
        button.setAttribute("aria-pressed", "false");
        button.setAttribute("aria-label", "Sound");
        button.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path class="slot__sound-off" d="M16 9l5 6M21 9l-5 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path class="slot__sound-on" d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
        button.addEventListener("click", () => {
            const on = !soundOn(slot);
            button.setAttribute("aria-pressed", String(on));
            const player = players.get(activeFrame(slot));
            if (on) player?.unMute?.();
            else player?.mute?.();
        });
        slot.append(button);
    });

    /** Every 10 seconds, start the hidden video and show it once it is playing. */
    const cycleVideos = (slot) => {
        const frames = [...slot.querySelectorAll("iframe.slot__media")];
        if (frames.length < 2 || reducedMotion) return;
        let current = 0;

        const advance = () => {
            const nextIndex = (current + 1) % frames.length;
            const outgoing = frames[current];
            const incoming = frames[nextIndex];
            const next = players.get(incoming);
            if (!next?.getPlayerState) {
                setTimeout(advance, VIDEO_DELAY);
                return;
            }

            next.seekTo(clamp(next, next.getCurrentTime() + JUMP), true);
            next.playVideo();
            const started = Date.now();

            const showWhenPlaying = () => {
                if (next.getPlayerState() === YT.PlayerState.PLAYING) {
                    incoming.classList.add("is-active");
                    outgoing.classList.remove("is-active");
                    players.get(outgoing)?.mute?.();
                    players.get(outgoing)?.pauseVideo?.();
                    if (soundOn(slot)) next.unMute();
                    updateLink(slot);
                    syncText(slot);
                    current = nextIndex;
                    setTimeout(advance, VIDEO_DELAY);
                } else if (Date.now() - started > START_TIMEOUT) {
                    // It never started; keep the current video and try again next cycle.
                    next.pauseVideo();
                    setTimeout(advance, VIDEO_DELAY);
                } else {
                    setTimeout(showWhenPlaying, 100);
                }
            };
            showWhenPlaying();
        };

        setTimeout(advance, VIDEO_DELAY);
    };

    window.onYouTubeIframeAPIReady = () => {
        videoSlots.forEach((slot) => {
            slot.querySelectorAll("iframe.slot__media").forEach((frame) => {
                const player = new YT.Player(frame, {
                    events: {
                        onReady: () => {
                            player.mute();
                            if (reducedMotion) {
                                player.pauseVideo();
                                return;
                            }
                            if (isActive(frame)) {
                                player.seekTo(clamp(player, TRIM), true);
                                player.playVideo();
                            }
                        },
                        // Captions load after playback starts, so turn them off whenever they appear.
                        onApiChange: () => {
                            player.setOption?.("captions", "track", {});
                            player.unloadModule?.("captions");
                            player.unloadModule?.("cc");
                        },
                        onStateChange: (event) => {
                            if (event.data === YT.PlayerState.ENDED && isActive(frame)) {
                                player.seekTo(canTrim(player) ? TRIM : 0, true);
                                player.playVideo();
                            }
                        }
                    }
                });
                players.set(frame, player);
            });

            cycleVideos(slot);
        });

        // Loop back to the start of the trimmed range when the last 30 seconds begin.
        setInterval(() => {
            players.forEach((player, frame) => {
                if (!isActive(frame) || !player.getCurrentTime || !canTrim(player)) return;
                if (player.getCurrentTime() >= player.getDuration() - TRIM) {
                    player.seekTo(TRIM, true);
                }
            });
        }, 500);
    };

    const api = document.createElement("script");
    api.src = "https://www.youtube.com/iframe_api";
    document.head.append(api);
})();
