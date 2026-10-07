# CS & SE Site Redesign Plan

**Status:** Phases 1 to 3 built (2026-10-07). The robot path puzzle is built (Home, Computer Science, Challenges); the breadboard, cipher, and binary activities have reserved spaces. See `docs/content-review.md` for every item that still needs verifying or supplying.
**Prepared:** 2026-10-07
**Scope:** Computer Science (CS) and Software Engineering (SE) only. Information Systems (IS) is removed everywhere.

---

## 1. What we are trying to do

Make a site that helps a 16 to 19 year old (and the parent sitting next to them) **picture themselves as a person who builds useful things**, and that says, with quiet confidence:

> AI is a powerful new tool. People still decide what is worth building, learn the fundamentals underneath it, think critically about the results, and answer for what they make. That is what we teach.

The human is the hero of every page. AI shows up as a tool the student learns to use well, never as the subject of the site and never as a threat to be defended against. Church leaders' words and scripture give that stance weight without the site ever arguing about it.

---

## 2. Review of the current site

### What works and should be kept

- The **campaign line "Build what comes next"** is good. Keep it.
- The **small static builder** (`lib/`, includes, Lightning CSS) is clean and fine for this. No framework change needed.
- **Accessible bones:** skip link, `details` accordions, semantic headings, alt text slots, reduced motion handling.
- The **evidence discipline** from the source of truth doc (source and date beside every number).

### What is falling short

| Problem | Where | Why it matters |
|---|---|---|
| **IS is merged in** without permission | Home "Find your fit: CS, SE, or IS", `programs.html#is`, `students.html` ("Compare CS, SE, and IS"), and the docs themselves (`byui-cse-website-source-of-truth.md`, `byui-cse-site-builder-strategy-guide.md`) | Off scope. The docs will keep reintroducing it to any future AI unless they are corrected too. |
| **The site is defensive about AI** | `ai.html` hero: "If you are skeptical of AI hype, good." Button: "See what students build *instead*." Home section 2 is the AI worry list. | It frames AI as the enemy and makes the whole site a reaction to fear. That is the opposite of the intended posture (confident, human centered, not anti AI). |
| **No flair, no people** | Every section is the same shape: eyebrow, heading, one paragraph, buttons. Images are `picsum.photos` random stock. Cream "graph paper" background, Georgia headings. | Nothing a teenager would stop scrolling for. No faces, no work, no motion, no color. Reads like a policy page. |
| **Signpost sections** | Home sections "For parents and families" and "Could computing be a better fit?" are just a sentence plus buttons to other pages. | Visitors are sent away instead of being told something. Seven thin pages instead of a few rich ones. |
| **Internal notes leaked into public copy** | "Placeholder embed until a curated student video ID is approved", "Occasional two-up video layout when you have more than one short clip", "Each card needs an approved title...", "It is not marketed as chat entertainment", "(not a human advisor)" | The previous AI copied its own instructions onto the page. Reads strangely to a real visitor. |
| **Visible placeholders everywhere** | Yellow `<mark>[...]</mark>` on salaries, courses, careers | Much of this is **already verifiable** (see section 7). |
| **Abstract language** (your coworker's point) | "Algorithms, systems, and theory", "Process and quality", "Best if you enjoy rigorous, abstract challenges", "ship" | A teenager cannot picture any of this. Job titles like "Systems Architect" mean nothing at 17. |
| **No Church voice at all** | Only a footer line and one parents paragraph | The quotes and scripture you want are not used anywhere. |
| **Type too small and too faint** | `--font-size-xs: 0.875rem` (14px) on labels, masthead, project meta; card lists at 16px; hero and lede text dimmed with `opacity: 0.88–0.9`; Georgia reads small | Confirms your instinct. Small and dimmed text also hurts contrast and mobile reading. |
| **Off brand** | Fonts are Georgia and Segoe UI; accent is coral `#ef6c57`; "theme temperature" slider in the header | BYU-Idaho's official faces are **Acumin** and **Minion** ([fonts guide](https://www.byui.edu/branding/fonts-typefaces)); color is Brand Blue (Pantone 300) with black, white, gray, and sparing accents ([color guide](https://www.byui.edu/branding/color-guide)). The temperature slider is a good idea with broken execution (see section 9). |

---

## 3. Page structure: Home is king, six rich pages plus Challenges

*Decision (2026-10-07): Home is the attention grabber and must make visitors want to stay and explore. Four pages felt too light.*

The current site's problem was never the number of pages. It was that each page was thin and the Home page was mostly signposts. The new structure has **six pages**, each with real content. Home works like a movie trailer: every section gives a satisfying taste on its own **and** ends with a clear door to the page that goes deeper.

| Page | Replaces | Main audience | Main action | Signature interaction |
|---|---|---|---|---|
| **Home** (`index.html`) | Home, AI questions | Prospective students (and their parents looking over their shoulder) | Pick a door: a major, Student Work, or Life Here | Lights (header), Robot path puzzle (level 1) |
| **Computer Science** (`computer-science.html`) | Half of Programs, Outcomes detail | Students drawn to puzzles, math, how things work | Explore the major / apply | Robot puzzle "watch the computer solve it" |
| **Software Engineering** (`software-engineering.html`) | Half of Programs, Outcomes detail | Students drawn to building apps and products | Explore the major / apply | Breadboard circuit (hardware meets software) |
| **Student Work** (`projects.html`) | Student work | Everyone (proof) | Watch a demo | None (the projects are the show) |
| **Life Here** (`life.html`) | New | Prospective students | Picture yourself here / visit | Cipher dial (near Cybersecurity Society) |
| **For Families** (`families.html`) | Parents, the "learning integrity" half of AI questions | Parents | Visit / review cost and outcomes | None (calm, informative) |
| **Challenges** (`challenges.html`) | New | Students who want more | Try harder puzzles, then explore a major | Harder robot, circuit, and security levels |

**Why separate CS and SE pages:** each major gets room for its own story, sample semester path, careers, salary, and interaction, and each page is a direct link a counselor, recruiter, or social post can share. The side by side **CS or SE?** comparison and the "Which sounds more like you?" picker live on Home, where the choice first comes up.

**Current, switching, transfer, and returning students:** a "Start here if you are already a student" section near the bottom of both major pages (first course CSE 110, advising, credit evaluation, returning students), linked from Home and the footer. If that content grows, it can become a seventh page later.

**Challenges** is the standalone page for harder versions of each activity. Every quick activity on the other pages ends with "Want a harder one? Try the Challenges." It is linked from the footer and from the activities, not the main nav, so the nav stays focused.

Removed: `ai.html`, `outcomes.html`, `students.html`, `parents.html`, `programs.html` (redirect or delete). Nav: **Computer Science · Software Engineering · Student Work · Life Here · Families**, plus an **Apply** button.

### What makes Home "king"

- **The first screen earns the scroll:** a big human headline, real students in motion, and the Lights control in the header. Something to look at and something to touch right away.
- **Do something within the first two scrolls:** the Robot path puzzle (level 1) sits in or right after "What you could build" so a visitor *does* something early.
- **Rhythm:** alternating full width color bands and white sections, a quote band, photos, and interactions. No two sections in a row look alike.
- **Every section ends with a door** to the deeper page ("Explore Computer Science", "See all student work", "See life in Rexburg").
- **Complete on its own:** a visitor who only reads Home still leaves knowing what CS and SE are, what students build, how we teach in the age of AI, where it leads, and how to apply.

---

## 4. Messaging framework: people first

### The one sentence

> **Build what comes next.** Learn to think, create, and solve real problems, then use every tool available, including AI, to build things that help people.

### Five pillars (used across all pages)

These are what "keeping the human front and center" looks like in practice. Each one should be **shown** with a real course, project, society, or student, not just claimed.

1. **Fundamentals first.** You still learn to program from the ground up (CSE 110, CSE 111), data structures, algorithms. You understand what the tools are doing.
2. **Thinking.** Breaking down messy problems, testing ideas, spotting what is wrong, including when an AI tool is confidently wrong.
3. **Creativity.** Games, apps, drones, websites, art and sound in games. Computing as a creative craft.
4. **People.** Team projects, real users, societies, mentors, service. Most of the job is working with humans.
5. **Wisdom with tools.** AI is taught as both a tool and a discipline (the official CS page says this), used with integrity, honesty, and judgment.

### Voice and contractions

*Decision (2026-10-07):* professional voice first. Contractions are allowed but used **sparingly**, where they make a line feel more human and relatable (a hero line, a FAQ answer, a student voice). Explanations, outcomes, policy, and Families content stay without contractions.

### AI tone rules (replacing the current defensive tone)

- State it plainly and move on: AI is here, it is useful, we teach it, and we teach what it cannot do for you.
- Never "if you are skeptical, good" or "instead of AI." Never hype either.
- Show AI inside the student's story (a student using it to test or draft, then improving the result) only when a real example exists.
- Do not say or imply "Church leaders are not anti AI." Let the quotes stand on their own.

### Making it concrete (the coworker's point)

Every abstract term gets translated into **something you could hold, use, or see**. Proposed pattern for careers: plain description first, title second.

| Plain language (lead with this) | Title (secondary) |
|---|---|
| Builds the apps and websites people use every day | Software developer |
| Tries to break the app before a customer does, then makes sure it gets fixed | Quality assurance / test engineer |
| Designs how the big pieces of a system fit together so it does not fall over | Systems architect |
| Makes the worlds, rules, and mechanics in a game work | Game developer |
| Keeps people's data and accounts safe from attackers | Cybersecurity engineer |
| Turns piles of data into answers someone can act on | Data scientist |

Same idea for the majors:

- **CS:** "How do you make a computer solve a hard problem fast and correctly? You like puzzles, math, and knowing how things work underneath." Then examples (a route finder, a game AI, a search feature).
- **SE:** "How do you build software a whole team can trust and real people love to use? You like building, designing, and seeing people use what you made." Then examples (a full web app, a mobile app, a tool for a local business).

Add a short **"Which sounds more like you?"** picker (4 to 6 either/or questions, pure HTML/CSS or a few lines of JS) that points to CS or SE. Interactive, fast, and very teenager friendly.

---

## 5. Page by page plan

### Home

1. **Hero.** Full width Brand Blue band with a real student photo or short silent looping clip of students building something (drone, game, whiteboard). Big headline "Build what comes next." One human line under it. Buttons: *See what students build* and *Find your major*
2. **"Here is what you could build."** A visual strip of real project types with one-line plain descriptions (game, app, drone autopilot, website for a nonprofit, security challenge). Links to Student Work.
3. **"People first. Tools second."** The five pillars as a bold, visual section (large numerals or icons, one sentence each, one proof link each). This is the heart of the human message.
4. **Quote band.** One Elder Gong quote set large in Minion, with name, title, event, date, and source link. (See section 6.)
5. **CS or SE?** Two side by side panels in plain language, plus the "Which sounds more like you?" picker.
6. **Life here.** The Computing Society (13 groups, including Video Game Design, Cybersecurity, Drone/UAS, AI, Hackathon, Web, Formula Hybrid, Society of Women Engineers), the Wednesday 5:00 p.m. meetup in STC 398, plus Rexburg and the outdoors. Real photos. Door: *See life here*.
7. **Where it can lead.** Salary by major with source and date, plus the plain language careers table above. Not a guarantee.
8. **Straight answers.** Short FAQ (4 items): Why learn to code if AI can write code? Are there still jobs? Do I need to be good at math? I have never coded, can I start here? Confident tone.
9. **Next step.** Apply, visit, ask BYU-Idaho AI (agenthub guest), with a scripture or quote footer line.

### Computer Science and Software Engineering (same template, different story)

1. **Hero:** plain language one liner about the major ("How do you make a computer solve a hard problem fast and correctly?" / "How do you build software a whole team can trust and people love to use?"), with a real student photo.
2. **Is this you?** Three or four "You might love this if..." statements.
3. **What you will build:** concrete examples and links to matching Student Work.
4. **The signature interaction** with its Learn panel.
5. **Your path:** a visual semester by semester path with real course names from the official plans ([CS 2026–2027](https://brightspotcdn.byui.edu/e6/f7/e7a6f1f941fa9efa008091527d1a/2026-2027-plan-cs.pdf), [SE 2026–2027](https://brightspotcdn.byui.edu/2c/7c/75f2e41b4ca981ae7b176ee4ab89/2026-2027-plan-se-combined.pdf)), each course with a plain one line description. SE also explains its two tracks (Software Design; Full Stack Web Development) by what you would build in each.
6. **How you will learn:** fundamentals first, team projects, and AI as both a tool and a discipline (wording from the official major pages).
7. **Where it leads:** salary for *this* major with source and date, plus the plain language careers table.
8. **Start here if you are already a student:** switching, transfer, returning.
9. **Next step:** apply, visit, ask BYU-Idaho AI, link to the other major ("Not quite you? See Software Engineering").

### Life Here

- **Wednesday nights:** the Computing Society meets Wednesdays at 5:00 p.m. in STC 398, then splits into its 13 groups. Show each group with a photo and a one line "what you do there."
- **Hackathons and competitions:** Hackathon, Formula Hybrid, cybersecurity challenges (only those that actually happen; verify).
- **Friends and mentors:** teams, faculty who know your name, peer tutoring (verify).
- **Rexburg and the outdoors:** Yellowstone, Jackson Hole, and the seasons. Verify every distance and claim.
- **Faith and campus life:** devotionals, wards, service, and the Honor Code environment, shown through real student moments.
- Interactions: Crack the code (near Cybersecurity) and Flip the bits.

### Student Work

- Featured video at top, then a filterable grid (Games, Web, Mobile, Hardware/Drones, Security, Data) of real projects.
- Each card: thumbnail, title, student name and major (with permission), one sentence on **the problem it solves and who it helps**.
- Optional "How it was built" note per project (fundamentals, team, tools used, including AI when true).
- Remove all internal notes from visible copy; empty states should hide, not show yellow brackets.

### For Families

- **Value:** cost (link to official tuition and aid), salary by major, careers, the three semester calendar if still current.
- **How we teach in an age of AI:** fundamentals, own work, course AI policies (green/yellow/red if still current, verify), critical thinking, integrity. This is where parents' AI concerns are answered, calmly.
- **Faith and character:** mission statement, environment, one quote and one scripture, real student life photo.
- **Next step:** visit with your student, admissions, cost calculator.

---

## 6. Church voice: quotes and scripture

*Decision (2026-10-07): do not use the whole list. Use a quote or verse only where and when it feels right. Every quote must clearly say who said it.*

**Rules**

- **A pool, not a quota.** The tables below are candidates. A page may have one, or none. A good target is two or three quotes and two or three verses across the whole site, each where it deepens what the section is already saying.
- **Visible attribution, always.** Directly under the quote, on the page (not only in a link):
  > "We want to enhance critical thinking, problem solving, and creativity."
  > **Elder Gerrit W. Gong**, Quorum of the Twelve Apostles · "Becoming BYU in an Age of Artificial Intelligence," BYU University Conference, August 24, 2026 · *source link*

  Scripture is cited by full reference ("Doctrine and Covenants 88:118"), linked to churchofjesuschrist.org.
- **Exact wording only.** Quote from the primary source, word for word. No paraphrase inside quotation marks.
- **No commentary** that explains what leaders think about AI. The quote stands on its own.
- **Never a slogan or decoration.** No quotes on buttons, in headlines, or as background art.

### Candidate Elder Gerrit W. Gong quotes (Quorum of the Twelve Apostles)

*Verified 2026-10-07 against primary sources: the official Church Newsroom transcript and the BYU Speeches transcript. Use these exact words and link these sources, not news summaries.*

**Source A:** "Faith, Dignity, and Human Flourishing: Hearing God's Voice in an Age of Artificial Intelligence," workshop video, June 7, 2026. [Church Newsroom transcript](https://newsroom.churchofjesuschrist.org/article/transcript-faith-dignity-and-human-flourishing-hearing-god-s-voice-in-an-age-of-artificial-intelligence)

**Source B:** "Becoming BYU in an Age of Artificial Intelligence," BYU University Conference (BYU, Provo), August 24, 2026. [BYU Speeches](https://speeches.byu.edu/talks/gerrit-w-gong/becoming-byu-in-an-age-of-artificial-intelligence/)

**Source C:** BYU Education Week devotional, August 19, 2025, as reported by [Church Newsroom](https://newsroom.churchofjesuschrist.org/article/elder-gong-ai-gospel-context-byu-education-week). Use only if the full talk transcript is found.

| Exact quote | Source | Strong fit |
|---|---|---|
| "We want to enhance critical thinking, problem solving, and creativity." | B | **Home, "People first" pillars.** Almost word for word the site's message. |
| "God creates and entrusts us with opportunities and experiences to work, learn, create." | A | Home or Student Work (people as creators) |
| "When we truly understand who we are, we can approach AI and other new technologies with greater confidence, purpose, and wisdom." | A | **Home quote band** (from `new-updates.md`, confirmed exact) |
| "I want AI and related technologies to change our world for the better; to narrow digital divides; to expand human flourishing; and to enhance faith, moral clarity, human meaning, and possibility." | A | Families or Home closing (from `new-updates.md`, confirmed exact) |
| "Please do not let AI replace you in work that would otherwise help you stretch and grow." | A | Families, "How we teach" / Fundamentals. *LDS Living paraphrased this; use this transcript wording.* |
| "The more we work with intent, diligence, and effort, the more and better we benefit from and through our work." | A | Major pages, "How you will learn" |
| "We can embrace this opportunity." | B | Families, "How we teach" (with the next sentence if more is needed) |
| "It gives us the opportunity to reexamine, reimagine, and reaffirm our educational principles, purposes, and processes as well as our means and ends." | B | Families. *The Daily Herald version was paraphrased; use this wording.* |
| "Help them learn to use AI to deepen their experience with the real world, to hone their reasoning skills, and to do their own work, such that they do not become lazy, dependent, or dishonest in describing AI's work as their own." | B | Families, "How we teach" (spoken to faculty, so introduce it as "Elder Gong counseled BYU faculty:") |
| "We are not afraid of AI, nor do we think it is the answer to every problem." | C | FAQ, only if the transcript is found |

Use only two or three of these across the whole site (see rules above).

### Candidate scripture pairings

| Reference | Text (abridged) | Fits |
|---|---|---|
| Doctrine and Covenants 88:118 | "Seek learning, even by study and also by faith." | Fundamentals / Families |
| 2 Nephi 2:26 | "...to act for themselves and not to be acted upon..." | Agency, people decide (wisdom with tools) |
| Doctrine and Covenants 58:27 | "...anxiously engaged in a good cause, and do many things of their own free will..." | Builders, initiative, next step |
| Doctrine and Covenants 130:18–19 | Intelligence we gain rises with us; "through his diligence and obedience" | Effort matters; learning that lasts |
| Ether 12:27 | "...then will I make weak things become strong unto them." | "Never coded before?" FAQ, hard courses |
| Alma 37:6 | "...by small and simple things are great things brought to pass..." | Project process, small steps |
| Mosiah 2:17 | "...when ye are in the service of your fellow beings ye are only in the service of your God." | People pillar, building for others |

Link each to the scripture on churchofjesuschrist.org. Use full book names on first reference.

---

## 7. Content we can fill now (verified from official pages, 2026-10-07)

- **CS salary** (byui.edu CS major page, PSEO data): 1 yr $79,787 · 5 yr $112,227 · 10 yr $138,529. These are **CS specific**, which resolves the open question in the source of truth doc. ([CS B.S.](https://www.byui.edu/majors/computer-science-bs))
- **SE salary** (byui.edu SE major page): 1 yr $74,476 · 5 yr $113,931. ([SE B.S.](https://www.byui.edu/majors/software-engineering-bs))
  Still needed: PSEO data year and population definition for the footnote.
- **Careers** (both pages): software developers, QA analysts and testers, systems engineers/architects, video game designers, hardware engineers, programmers, web developers (SE).
- **Courses:** CSE 110, CSE 111, CSE 212, CSE 370, CSE 381, CSE 382, WDD 130/131, ITM 220, ITM 300, Machine Learning, Big Data, Discrete Math (from official pages and 2026–2027 plans).
- **Societies:** 13 groups under the Computing Society, shared meeting Wednesdays 5:00 p.m., STC 398. ([Societies](https://www.byui.edu/computer-science-engineering/student-resources/societies))
- **Official positioning on AI:** CS page says AI is taught as "both a tool and a core discipline"; SE page says AI is integrated for requirements, testing, and optimization "while maintaining ethical engineering standards."

Still needed from you or the department: real project list and permissions, a featured video and playlist, student/graduate photos and stories, advising link, internship numbers, course AI policy link.

---

## 8. Visual and typography plan

### Type (fixes "too small")

| Role | Current | Proposed |
|---|---|---|
| Body text | 19px Georgia | **19px mobile → 20px desktop**, Minion (or fallback), line height 1.6 |
| Smallest text anywhere (labels, meta, captions, footer) | 14px | **16px minimum**, no exceptions |
| Section lede | 22px at 90% opacity | **22–26px**, full opacity |
| Hero headline | up to 72px | **48px mobile → 96px desktop**, Acumin bold/black |
| Section headings | 28–38px | **32px → 56px**, Acumin bold |
| Buttons | 19px | **18–20px**, bigger touch targets |

Remove every `opacity` dimming on text; use a proper muted color that passes WCAG AA instead.

### Fonts

*Decision (2026-10-07): use free look-alikes.*

The official faces are **Acumin** (sans) and **Minion** (serif). The site uses free, self-hosted look-alikes so there is no Adobe kit dependency:

- **Headings and UI (Acumin role):** a free grotesque sans such as **Source Sans 3** or **Public Sans** (both open source, variable weight, very readable at large sizes).
- **Body text and quotes (Minion role):** a free text serif such as **Crimson Pro** or **Source Serif 4**.

Final pairing is chosen by testing both at the new sizes. Fonts are self-hosted as `woff2` in `src/fonts/` (no third party requests), with `font-display: swap`. Both are set through two CSS variables, so switching to the official Acumin and Minion later is a one-line change if a kit becomes available.

### Color and feel

- Brand Blue as the dominant color in full width bands (hero, quote band, next step), not just links. Confirm the exact web hex from the color guide.
- Black, white, cool gray. One restrained accent only if the color guide allows it; drop the coral.
- Remove the graph paper background. Replace the theme temperature slider with the Lights dimmer in section 9.2.
- Alternate full bleed bands and white sections so the page has rhythm instead of one long column of identical blocks.
- Real photography and video loops of students building, presenting, flying drones, playing their own games. No stock, no AI generated people.
- Subtle motion: hover lift on project cards, a gentle fade in on scroll, all disabled under reduced motion.

---

## 9. Interactive moments ("try it, then learn it")

The site should not only *say* students build things. Visitors should get to **touch a small working piece of computing**, then immediately see what they just did and where they would learn it in the degree. Every interaction is a tiny lesson, which makes it the most direct proof of the "people first" message: *you* flipped the switch, *you* found the bug, *you* wired the circuit.

### 9.1 Why the current light/dark slider looks wrong

The slider in `src/js/theme-temp.js` sets one number (`--theme-temp`, 0 to 1), and `src/css/tokens/colors.css` blends **every** color between its light and dark version with `color-mix(... var(--theme-temp-pct) ...)`. Text blends from dark ink toward light ink while the background blends from light paper toward dark paper at the same rate. At the halfway point **both land on nearly the same middle gray**, so contrast collapses. Meanwhile Brand Blue stays fixed and the coral accent drifts, so they clash with the muddy background. More tweaking cannot fix this. Linear blending of text and background toward each other will always pass through unreadable.

### 9.2 The fix: a true 1 to 100% "Lights" dimmer that cannot become unreadable

*Decision (2026-10-07): no fixed themes. A real 1 to 100% dimmer. Lights on at 100%, dim down to 1%. Fake the range where needed to protect contrast and beauty.*

**The control (intuitive first).** A pull-chain lamp is charming, but most people would not know what to do with it. People already know one pattern well: the **brightness slider** on their phone. So the control is:

- A small **light bulb button** in the header labeled "Lights". The bulb's glow reflects the current level.
- Clicking it opens a small panel with a horizontal **brightness slider (moon icon on the left, sun on the right)** and the value ("Lights 72%").
- A small "How does this work?" link in the panel opens the Learn panel, so the control is one of the site's "try it, learn it" moments without getting in anyone's way.
- On mobile, the same button sits next to the Menu button.
- Fully keyboard operable (arrow keys, Home/End) and labeled for screen readers ("Page brightness, 72 percent").

**How the colors work (why it will not look like the current demo).** The math (checked 2026-10-07) shows exactly where the current slider fails. Even with the text at the best possible color, a neutral background with OKLCH lightness between about **0.45 and 0.70** cannot give comfortable reading contrast; it bottoms out near 4.4:1 at 0.60. So:

1. **Every slider value maps to a background outside that dead zone.** 100% down to 51% walks the background from bright paper (0.985) to a soft evening tone (about 0.74). 50% down to 1% walks it from deep dusk (about 0.42) to night (about 0.16, never pure black). Crossing 50% is a quick 250 ms crossfade where the text flips from dark to light, like a light switch moment inside a smooth dimmer. Every step still visibly changes the page, so it feels like a true 1 to 100% dimmer.
2. **Text, borders, links, buttons, and Brand Blue are computed from the background**, not blended toward each other. Each is solved for at least WCAG AA contrast (4.5:1 body text, 3:1 large text and UI) at every value. Brand Blue gets deeper on light backgrounds and brighter on dark ones, so it always reads as BYU-Idaho blue.
3. **Beauty:** a slight warm tint at high brightness and a slight cool blue tint at low brightness (a lamp in the evening, then moonlight). Photos dim very slightly (`filter: brightness()`) at low levels so they do not glare.
4. **Implementation:** a small script computes the color tokens for the chosen value with OKLCH formulas and sets CSS variables. The CSS ships light defaults plus dark defaults under `prefers-color-scheme: dark`, so it also works without JavaScript.
5. **Enforced by the build:** `pnpm run verify` sweeps every value from 1 to 100 and fails if any text, link, button, or border pair drops below its contrast target.

**Starting state (decision 2026-10-07):** Lights 100% by default. If the visitor's operating system is set to dark mode, start at a comfortable dark level (about 20%). Once the visitor moves the slider, their choice is remembered and wins over both.

### 9.3 The Learn panel (every interaction has one)

One shared component, a native `<dialog>` that slides up after the interaction is completed (or from a small "What just happened?" button that appears beside it). It never pops up uninvited before the visitor has done anything. Same four parts every time:

1. **What you just did.** One plain sentence. *"You changed one value, and the whole site re-painted itself."*
2. **The idea behind it.** Two or three short bullets naming the real concept: *variables, state, events, saving a preference.*
3. **Where you would learn this.** Real course numbers and names or societies, linked. *CSE 110 Introduction to Programming; WDD 131 Dynamic Web Fundamentals.*
4. **The human part.** One line on the judgment a person makes. *"A computer can change a color. A person decides whether everyone can still read it."*

Optional fifth: **"See the code"**, a link to the readable source for that interaction on GitHub (the footer already links `github.com/byui-cse`).

### 9.4 Interactions

*Decision (2026-10-07): professional first. Every activity must be quick to grasp, feel like solving something (never guessing), and leave the visitor feeling capable. "Spot the bug" and "Tune the game" are dropped. Harder versions live on the Challenges page.*

| # | Interaction | Where | What they do | Concepts | Where you would learn it |
|---|---|---|---|---|---|
| 1 | **Lights** (page brightness) | Header, every page | Dim the page from 100% down to 1% | Variables, events, color math and contrast (accessibility), saving a preference | CSE 110, WDD 130/131 |
| 2 | **Robot path puzzle** (signature activity) | Home (level 1), Computer Science page ("watch the computer solve it"), Challenges (harder levels) | Guide a robot across a small grid with obstacles to the goal by stacking command blocks: `forward`, `turn left`, `turn right`, and `repeat (n)`. Press Run and watch it go. | Sequencing, loops, debugging, and efficiency (fewest steps and fewest blocks) | CSE 110, CSE 111; CSE 212 and CSE 381 for the "computer solves it" view |
| 3 | **Breadboard circuit** (hardware) | Software Engineering page (or Home, "What you could build"), Challenges | Connect jumper wires battery → switch → resistor → LED to light it. Challenges adds AND/OR gates and a simple adder. | Circuits, binary on/off, logic gates, where hardware meets software | ECEN 106 Computer Systems, Discrete Math; Drone/UAS, Amateur Radio, Formula Hybrid societies |
| 4 | **Cipher dial** (quick security) | Life Here, next to the Society of Cybersecurity; Challenges | A short scrambled message and a dial. Turn the dial until the message reads clearly (usually under 20 seconds). The Learn panel shows why a computer cracks this in a blink and what modern encryption does instead. Challenges adds harder puzzles. | Encryption, keys, thinking like a defender | Society of Cybersecurity, security coursework (confirm course) |
| 5 | **Flip the bits** (optional, small) | Computer Science page or Challenges | Flip 8 switches to make a number or letter | Binary, how computers store text | ECEN 106, CSE 110 |

**Robot path puzzle details.** This one carries the site's message best: you plan, you decide, you make it efficient.

- **Look:** a clean grid in site colors with a simple, friendly robot or rover (not a tank or weapon, to keep it professional for parents). Obstacles are plain blocks. It works at every Lights level.
- **Scoring (three stars, no timer):** one star for reaching the goal; two for the shortest path; three for the fewest blocks, which means discovering `repeat`. For example, four `forward` blocks become one `repeat (4) { forward }`, so 4 blocks become 2. A short message rewards the insight: *"You just wrote a loop."*
- **Input:** drag and drop, **and** tap or click to add a block, plus full keyboard support. Works on phones.
- **Levels:** Home has one level (about 30 to 60 seconds). Challenges has 6 to 10 that add `if wall ahead`, then functions.
- **Learn panel:** what you did (a sequence and a loop), the idea (algorithms, efficiency), where you learn it (CSE 110, CSE 111, CSE 212), and the human part (*"The robot only follows the plan. You made the plan."*). On the Computer Science page, a "Watch the computer solve it" button animates a search algorithm finding the shortest path, linking to CSE 381 Algorithms and Complexity.

### 9.5 Design rules so it blends with the site

- **Professional above all.** This is a marketing site for high school students, early college students, and parents. No cartoon style, sound effects, confetti, or weapons. Feedback is calm and specific (stars and a short line of text).
- **One visual language:** the same Brand Blue palette, line weight, and rounded corners as the rest of the site. A clean "schematic" illustration style (simple strokes, flat fills), not a different game art style per widget. The robot puzzle, breadboard, and Lights control should look like they belong on the same page as the headings.
- **Works at every Lights level.** Each widget uses the theme tokens only, so it looks right from 1% to 100% automatically, and the contrast check covers it.
- **Never blocks content.** Every interaction is optional, the page reads fine if you skip it, and there is a static image plus text fallback without JavaScript.
- **Accessible:** full keyboard support (wires can be placed by selecting endpoints, not only by dragging), screen reader labels, no flashing, and reduced motion honored.
- **Light and fast:** plain JavaScript modules (no framework), each loaded only when scrolled near (`IntersectionObserver`), with a small shared `learn-dialog.js`. Each widget should stay small; the robot puzzle and breadboard are the heaviest and should use SVG or a single small `<canvas>`.
- **Student built, eventually.** These are good candidates for student projects or society contributions later, which becomes its own story on the Student Work page ("this breadboard was built by...").

---

## 10. Implementation phases

1. **Clean up scope (small).** ~~Update the docs to CS and SE only~~ (done 2026-10-07). Remove IS from all pages. Remove leaked internal notes. Fix defensive AI copy. Update `byui-cse-website-source-of-truth.md` and `byui-cse-site-builder-strategy-guide.md` so they say CS and SE only (so future AI does not re-add IS).
2. **Design system and theme.** New tokens: type scale, Brand Blue palette, fonts, spacing. Replace the blended theme with the contrast-safe 1 to 100% Lights system plus the contrast sweep in `pnpm run verify`. Remove the grid. New components: full bleed band, quote block, pillar grid, comparison panels, careers table, project filter, CS/SE picker, Learn dialog.
3. **Restructure the pages.** Build Home first (it is king), then Computer Science, Software Engineering, Student Work, Life Here, For Families, and Challenges. Delete or redirect `ai.html`, `outcomes.html`, `students.html`, `parents.html`, and `programs.html`.
4. **First interactions.** Lights and the Robot path puzzle (level 1), each with its Learn panel.
5. **Fill verified content.** Salaries, courses, careers, societies, quotes (after primary source check), scripture.
6. **Real media.** Swap in approved photos, video, and projects as they arrive. Placeholders hidden from public view, listed in a tracking doc instead.
7. **More interactions.** Breadboard, cipher dial, flip the bits, and the Challenges page levels.
8. **Review.** Accessibility pass (contrast at every Lights level, keyboard, captions), mobile pass at 360px, `pnpm run build` and `pnpm run verify`, then department and University Communications review.

---

## 11. Decisions

### Made (2026-10-07)

1. **Pages:** Home is king; six rich pages (section 3).
2. **Voice:** professional, contractions used sparingly (section 4).
3. **Quotes:** use only where they fit, always with visible attribution (section 6).
4. **Fonts:** free look-alikes, self-hosted (section 8).
5. **Theme:** light by default, respect OS dark mode, remember the visitor's choice (section 9.2).
6. **Docs cleanup:** done. IS removed from `byui-cse-website-source-of-truth.md` and `byui-cse-site-builder-strategy-guide.md`, and a scope rule added to both.
7. **Lights:** a real 1 to 100% dimmer, no fixed themes, with the range quietly remapped to protect contrast (section 9.2). The control is a bulb button with a brightness slider, not a pull chain.
8. **Interactions:** Spot the bug and Tune the game dropped. The Robot path puzzle with loop scoring is the signature activity. Security puzzles must be quick; harder versions go on a Challenges page (section 9.4).
9. **Quotes:** looked up and verified against primary sources (section 6).

### Still open

10. **Course mapping:** who on the faculty can confirm the course numbers each Learn panel names?
11. **Robot look:** a friendly robot (recommended) or a rover, which ties to the Drone/UAS Society? Not a tank, to keep it professional for parents.

Neither blocks phases 1 to 3.

---

### Research sources

- BYU-Idaho [Computer Science B.S.](https://www.byui.edu/majors/computer-science-bs), [Software Engineering B.S.](https://www.byui.edu/majors/software-engineering-bs), [CSE societies](https://www.byui.edu/computer-science-engineering/student-resources/societies), 2026-2027 plans for [CS](https://brightspotcdn.byui.edu/e6/f7/e7a6f1f941fa9efa008091527d1a/2026-2027-plan-cs.pdf) and [SE](https://brightspotcdn.byui.edu/2c/7c/75f2e41b4ca981ae7b176ee4ab89/2026-2027-plan-se-combined.pdf)
- BYU-Idaho branding: [fonts](https://www.byui.edu/branding/fonts-typefaces), [colors](https://www.byui.edu/branding/color-guide), [photo and video](https://www.byui.edu/branding/photo-illustration-video)
- [Church Newsroom transcript: "Faith, Dignity, and Human Flourishing" (June 7, 2026)](https://newsroom.churchofjesuschrist.org/article/transcript-faith-dignity-and-human-flourishing-hearing-god-s-voice-in-an-age-of-artificial-intelligence)
- [BYU Speeches: "Becoming BYU in an Age of Artificial Intelligence" (Aug. 24, 2026)](https://speeches.byu.edu/talks/gerrit-w-gong/becoming-byu-in-an-age-of-artificial-intelligence/)
- [Church Newsroom: Elder Gong at BYU Education Week 2025](https://newsroom.churchofjesuschrist.org/article/elder-gong-ai-gospel-context-byu-education-week)
- [Principles for Church Use of Artificial Intelligence](https://www.churchofjesuschrist.org/learn/artificial-intelligence)
- [CRA CERP pulse survey on 2025 computing enrollment](https://cra.org/crn/2025/10/cerp-pulse-survey-a-snapshot-of-2025-undergraduate-computing-enrollment-patterns/) (context: reported CS enrollment declines driven largely by AI and job worries, which is why confident, concrete, human messaging matters now)
