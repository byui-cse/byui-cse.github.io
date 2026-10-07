# BYU-Idaho CS and SE Website Source of Truth

This document guides the design, writing, and development of the BYU-Idaho Computer Science and Software Engineering marketing website. It is a practical source of truth for the website, not a complete university policy or brand manual.

## Scope

This site covers **Computer Science (CS)** and **Software Engineering (SE)** only. Do not add Information Systems (IS) or other programs to pages, comparisons, navigation, or copy. Any IS material in research notes was context only.

## Purpose

Help prospective students, current students, major changers, transfer students, returning students, and parents understand why computing remains valuable in the age of AI.

The website should help visitors:

- Picture themselves building useful things
- Understand what CS and SE students actually do
- See evidence of student opportunity and outcomes
- Find the computing major that fits them
- Get honest answers about AI, careers, learning, and value
- Take a clear next step

The site should attract students who are willing to learn difficult things, solve problems, work with others, and keep developing. It should not promise an effortless path or guaranteed employment.

## Core message

> AI has changed the tools and the job market. It has not removed the need for people who understand problems, make sound decisions, build useful technology, and use it to serve others.

Primary campaign idea:

> **Build what comes next.**

Supporting idea:

> AI can generate code. Engineers decide what is worth building, make it work, and take responsibility for the result.

Additional approved ideas:

- AI can build many things. Learn how to decide what is worth building.
- Do not study computing merely to use the next tool. Study it so you can help decide what the next tools become.
- Use technology as a servant, not a master.

The Church connection should be sincere and purposeful. Do not turn sacred teachings or quotations into slogans. Technology should be presented as a powerful tool that people direct through agency, wisdom, responsibility, and service.

## Audiences

### Prospective students

Mostly high school juniors and seniors, including students who are uncertain about their major.

They need energy, belonging, creativity, independence, and a clear picture of what they could build.

### Current BYU-Idaho students

Students considering computing, switching majors, or questioning whether to remain in CS or SE.

They need a clear path, realistic encouragement, examples of student work, and help comparing CS and SE.

### Parents and families

They want evidence of educational quality, career preparation, return on investment, learning integrity, and character.

They should receive honest information, not guarantees.

### AI-skeptical or AI-anxious visitors

Their concerns should be acknowledged rather than dismissed. The site should explain that students remain responsible for learning, judgment, accuracy, ethics, and the consequences of what they build.

## Recommended homepage structure

1. **Build what comes next**
   - Short supporting statement
   - **See what our students build**
   - **Ask BYU-Idaho AI**

2. **The questions everyone is asking about AI**
   - Why learn to code if AI can do it?
   - Are there still jobs?
   - Will AI weaken real learning?
   - Is computing only sitting at a screen?
   - What if I am not an AI person?

3. **What could you build?**
   - Apps, games, websites, automation tools, security systems, data tools, interactive experiences, startup ideas, and senior projects
   - Use real student work whenever possible

4. **Find your fit: CS or SE**
   - Compare the programs plainly
   - Explain the kinds of problems, work, and interests associated with each

5. **Where this can lead**
   - Salary outlook
   - Internships
   - Job titles
   - Industries and employers
   - Verified graduate outcomes

6. **For parents and families**
   - Degree value
   - Employability
   - Learning quality
   - Responsible AI use
   - Faith, family, and service

7. **Could computing be a better fit?**
   - Guidance for current students changing majors
   - Beginner course information
   - Advising and program comparison links

8. **Your next step**
   - Apply or learn about admission
   - Explore programs
   - Ask BYU-Idaho AI
   - Visit campus or contact the appropriate university office

## Calls to action

Use clear, specific link text.

### Primary public call to action

**Ask BYU-Idaho AI**

Link: <https://agenthub.byui.edu/guest>

This is the preferred general resource for prospective students and visitors with degree or university questions. Do not describe it as a human advisor.

### Current student call to action

**Open the Student Hub**

Link: <https://agenthub.byui.edu/hub>

This resource is for existing BYU-Idaho students and provides additional tools and agents.

### Student work call to action

**See what our students build**

Link to a curated project showcase page or a dedicated YouTube playlist. A general channel link is acceptable, but a focused playlist is preferable because visitors should not have to search for student projects.

## Student project showcase

The showcase should use real, approved student work. Each project card may include:

- Project image, screenshot, or video thumbnail
- Project title
- Student name and major, when approved
- Course, society, event, or program connection
- One sentence explaining the problem or opportunity
- Link to a video, live demo, repository, or project page

Do not claim that students used AI, caught AI errors, or directed AI tools unless the featured project actually demonstrates that process.

The site may later include a short video showing a student reviewing, testing, correcting, and improving an AI-generated first draft. Until a real example exists, do not create a standalone section that merely explains the idea.

## Salary and outcomes module

Use the heading:

### Average salary after graduation

| 1 year | 5 years | 10 years |
|---:|---:|---:|
| **$79,787** | **$112,227** | **$138,529** |

Supporting line:

> Reported average earnings for BYU-Idaho graduates in computer science related fields.

Include a link to the federal Post-Secondary Employment Outcomes data and identify the data year or access date before publishing. Confirm whether the source applies specifically to Computer Science or to a broader computer science related category.

Salary information must never be presented as a promise or guarantee. Place it alongside internships, job titles, industries, and graduate stories so visitors see a fuller picture of outcomes.

## Tone and writing rules

The voice is warm, honest, hopeful, clear, and inviting.

### Use

- Plain language
- Concrete examples
- Real student experiences
- Short sections and descriptive headings
- Honest acknowledgment of difficulty and uncertainty
- Language that helps students picture who they can become

### Avoid

- AI hype
- Corporate buzzwords
- Generic claims such as “cutting edge” or “future proof”
- Fear, guilt, pressure, or exaggerated urgency
- Promises of jobs, salaries, admission, or spiritual outcomes
- Treating students as coders who only type code
- Presenting technology as the whole identity of the degree
- Negative comparisons with other majors or universities

### House style rules

- **Modified Chicago Title Case:** Titles, headings, buttons, navigation, and bold lead-ins before a colon use Chicago title case. Capitalize the first and last words and all major words (nouns, verbs including *is* and *be*, adjectives, adverbs, pronouns such as *that*, subordinating conjunctions such as *if*). Lowercase articles (*a, an, the*), coordinating conjunctions (*and, but, or, for, nor, so, yet*), all prepositions (*of, in, on, to, with, after*), and infinitive *to*. **Modification:** Always capitalize the first word after a colon, in headings and in body copy.
- **External Links:** Every link to another site opens in a new tab with `target="_blank" rel="noopener noreferrer"`. `pnpm run verify` fails if one is missing.
- **Department Name:** The Computer Science and Engineering Department, or the CSE Department. The site covers its Computer Science and Software Engineering majors.
- **Program, Not Code:** Use "program" as the verb ("program it," "learn to program," "already programming?"). "Code" is fine as a noun ("code review," "read unfamiliar code").
- **Times:** Write times as "5:00 PM" or "5:00 pm," never "p.m." or "a.m." with periods. The site uses uppercase: "5:00 PM."
- **Do Not Lead with AI:** Never start a main or lead sentence with "AI," and keep the hero free of AI framing. Many prospective students fear AI. Lead with people, building, and concrete experiences; mention AI as one tool among many, later in a sentence.
- **Write Like Marketing, Not a Thesis:** Concrete, confident, and energetic. Name real things (courses, projects, societies, outcomes) instead of abstract virtues.

Prefer **engineers**, **builders**, **problem solvers**, and **people who create useful things** when those terms are accurate. Do not use “engineers, not coders” as the primary hero message. It is an internal distinction, not the most compelling invitation to students.

## Church and university context

On first reference, use **The Church of Jesus Christ of Latter-day Saints**. Later references may use **the Church**. Do not use “LDS Church,” “Mormon Church,” or similar labels.

BYU-Idaho is owned and guided by The Church of Jesus Christ of Latter-day Saints. The website should reflect the university mission through service, integrity, agency, growth, and care for people. Explicit religious language should be used when it has a clear purpose, not as decoration.

Useful principle:

> We do not worship technology, fear technology, or surrender our judgment to technology. We learn to use it wisely in service of people.

## Visual direction

- Follow current BYU-Idaho brand standards for logos, colors, fonts, and photography.
- Use the official logo artwork without distortion or recoloring.
- Use BYU-Idaho blue with black, white, and restrained supporting colors.
- Show real students, projects, collaboration, demonstrations, and useful work.
- Favor images that communicate making, testing, explaining, and improving.
- Avoid generic stock images of isolated people staring at screens.
- Avoid AI-generated people or student work presented as real.
- Keep layouts clean, readable, and easy to scan.
- Use cards only when they help visitors compare or explore real options.

## Accessibility and media

- Provide meaningful alt text for informative images.
- Caption every video.
- Maintain strong color contrast.
- Do not communicate essential information through color alone.
- Use descriptive link text such as “See what our students build,” not “Click here.”
- Keep videos short and place the key message in text as well.
- Optimize images and embedded media so the page remains fast.

## Evidence and publishing standards

Every statistic, salary figure, internship count, program detail, cost, deadline, and policy must be verified before publication.

For each changing fact, record:

- Source
- Date accessed
- Population or group represented
- Time period
- Definition of the measure
- Any important limitations

Use placeholders during design and copy development when information has not been verified. Do not invent student stories, outcomes, employer relationships, project results, or statistics.

## Content maintenance

Review the following regularly:

- Salary and graduate outcome data
- Internship totals and definitions
- Program names and course maps
- Tuition, costs, scholarships, and deadlines
- AI guidance and course expectations
- Links to the BYU-Idaho AI agents
- YouTube playlists and project showcase content
- University brand and accessibility requirements

The website should remain useful even when individual facts change. Put dates beside statistics and link to authoritative pages for details that require frequent updates.
