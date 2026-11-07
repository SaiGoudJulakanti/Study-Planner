const K = 'placement-planner-v1';


/* Utility Functions */

const pad = n => String(n).padStart(2, '0');


const dkey = d =>
    d.getFullYear() +
    '-' +
    pad(d.getMonth() + 1) +
    '-' +
    pad(d.getDate());


const today = () => dkey(new Date());


const uid = () =>
    Math.random()
        .toString(36)
        .slice(2, 9);


const esc = s =>
    String(s).replace(
        /[&<>"']/g,
        c => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[c])
    );


const mk = a =>
    a.map(t => ({
        id: uid(),
        t,
        done: false
    }));


/* Default Data */

function fresh() {

    return {

        target: '',

        focus: 25,

        brk: 5,

        goal: 240,

        tab: 'today',

        tasks: [],

        log: {},

        topics: {

            'Aptitude': mk([

                'Percentages, ratios and averages',

                'Time, speed and work',

                'Permutations and probability',

                'Number series and puzzles',

                'Logical reasoning sets',

                'Verbal and reading comprehension'

            ]),


            'DSA': mk([

                'Arrays and strings',

                'Linked lists',

                'Stacks and queues',

                'Trees and BST',

                'Graphs (BFS, DFS)',

                'Recursion and backtracking',

                'Dynamic programming',

                'Sorting and searching'

            ]),


            'CS core': mk([

                'Operating systems',

                'DBMS and SQL queries',

                'Computer networks',

                'OOP concepts'

            ]),


            'Profile and interviews': mk([

                'Resume reviewed and one page',

                'Two projects I can explain in depth',

                'GitHub and LinkedIn cleaned up',

                'HR answers: intro, strengths, goals',

                'Three mock interviews done'

            ])
        }
    };
}


/* Load Data */

let S;


try {

    const r = localStorage.getItem(K);

    S = r
        ? JSON.parse(r)
        : fresh();

} catch (e) {

    S = fresh();

}


if (!S || !S.topics) {

    S = fresh();

}


/* Save Data */

const save = () => {

    try {

        localStorage.setItem(
            K,
            JSON.stringify(S)
        );

    } catch (e) {}

};


/* Categories */

const cats = () =>
    Object.keys(S.topics);


/* Timer State */

const T = {

    mode: 'focus',

    running: false,

    end: 0,

    left: S.focus * 60,

    subj: cats()[1] || 'Other'
};


/* Timer Helpers */

const total = () =>
    (
        T.mode === 'focus'
            ? S.focus
            : S.brk
    ) * 60;


const left = () =>
    T.running
        ? Math.max(
            0,
            Math.round(
                (T.end - Date.now()) / 1000
            )
        )
        : T.left;


const fmt = s =>
    pad(Math.floor(s / 60)) +
    ':' +
    pad(s % 60);


const hm = m =>
    m >= 60
        ? Math.floor(m / 60) +
          'h ' +
          pad(m % 60) +
          'm'
        : m + 'm';


/* Days Until Placement */

const daysLeft = () =>
    S.target
        ? Math.ceil(
            (
                new Date(
                    S.target + 'T00:00'
                ) -

                new Date(
                    today() + 'T00:00'
                )
            ) / 864e5
        )
        : null;


/* Study Streak */

function streak() {

    let n = 0;

    const d = new Date();


    if (!S.log[dkey(d)]) {

        d.setDate(
            d.getDate() - 1
        );
    }


    while (S.log[dkey(d)] > 0) {

        n++;

        d.setDate(
            d.getDate() - 1
        );
    }


    return n;
}


/* Last 7 Days */

function week() {

    const out = [];


    for (
        let i = 6;
        i >= 0;
        i--
    ) {

        const d = new Date();

        d.setDate(
            d.getDate() - i
        );


        out.push({

            k: dkey(d),

            n: d.toLocaleDateString(
                'en-IN',
                {
                    weekday: 'short'
                }
            ),

            m:
                S.log[dkey(d)] ||
                0
        });
    }


    return out;
}


/* Percentage */

const pct = a =>
    a.length
        ? Math.round(
            a.filter(
                x => x.done
            ).length /
            a.length *
            100
        )
        : 0;


/* =========================
   HEADER
========================= */

function header() {

    const d = daysLeft();

    const h = new Date().getHours();


    const g =
        h < 12
            ? 'Good morning'
            : h < 17
                ? 'Good afternoon'
                : 'Good evening';


    let cd;


    if (d === null) {

        cd = `

        <label class="cd">

            <span class="cdl">

                <b>
                    When are placements?
                </b>

                Pick the date to start
                the countdown

            </span>

            <input
                type="date"
                data-chg="target"
                aria-label="Placement date"
            >

        </label>

        `;

    } else {

        cd = `

        <label class="cd">

            <span class="cdn">

                ${Math.max(d, 0)}

            </span>


            <span class="cdl">

                <b>

                    ${
                        d < 0
                            ? 'Placement date passed'
                            : d === 1
                                ? 'day to placements'
                                : 'days to placements'
                    }

                </b>


                <input
                    type="date"
                    data-chg="target"
                    value="${S.target}"
                    aria-label="Placement date"
                >

            </span>

        </label>

        `;
    }


    return `

    <header class="top">

        <div>

            <h1>
                Placement Planner
            </h1>

            <p class="sub">

                ${g}.
                Focus on one thing at a time.

            </p>

        </div>


        ${cd}

    </header>


    <nav aria-label="Sections">

        ${
            [
                ['today', 'Today'],
                ['roadmap', 'Roadmap'],
                ['progress', 'Progress']
            ]

            .map(

                ([v, l]) => `

                <button
                    data-act="tab"
                    data-v="${v}"
                    aria-current="${S.tab === v}"
                >

                    ${l}

                </button>

                `
            )

            .join('')
        }

    </nav>

    `;
}


/* =========================
   TIMER CARD
========================= */

function timerCard() {

    const m = today();

    const done =
        S.log[m] || 0;


    const gp =
        Math.min(
            100,

            Math.round(
                done /
                S.goal *
                100
            )
        );


    const opts = [

        ...cats(),

        'Other'

    ]

        .map(

            c => `

            <option
                ${
                    c === T.subj
                        ? 'selected'
                        : ''
                }
            >

                ${esc(c)}

            </option>

            `
        )

        .join('');


    return `

    <section class="card timer">


        <div
            class="seg"
            role="group"
            aria-label="Timer mode"
        >

            <button
                data-act="mode"
                data-v="focus"
                aria-pressed="${
                    T.mode === 'focus'
                }"
            >

                Focus

            </button>


            <button
                data-act="mode"
                data-v="break"
                aria-pressed="${
                    T.mode === 'break'
                }"
            >

                Break

            </button>

        </div>


        <div class="ringwrap">


            <svg
                viewBox="0 0 200 200"
                aria-hidden="true"
            >

                <circle
                    cx="100"
                    cy="100"
                    r="90"
                    fill="none"
                    stroke="var(--track)"
                    stroke-width="10"
                />


                <circle
                    id="ring"
                    cx="100"
                    cy="100"
                    r="90"
                    fill="none"
                    stroke="var(--pri)"
                    stroke-width="10"
                    stroke-linecap="round"
                    stroke-dasharray="565.5"
                    stroke-dashoffset="0"
                />

            </svg>


            <div class="tm">

                <div
                    class="big"
                    id="tm"
                    role="timer"
                >

                    ${fmt(left())}

                </div>


                <div class="mute">

                    ${
                        T.mode === 'focus'
                            ? 'Studying'
                            : 'Rest your eyes'
                    }

                </div>

            </div>

        </div>


        <div
            class="row c"
            style="margin-bottom:12px"
        >

            <label class="mute">

                Working on

                <select data-chg="subj">

                    ${opts}

                </select>

            </label>

        </div>


        <div class="row c">

            <button
                class="btn"
                data-act="toggle"
            >

                ${
                    T.running
                        ? 'Pause'
                        : 'Start'
                }

                ${T.mode}

            </button>


            <button
                class="btn ghost"
                data-act="reset"
            >

                Reset

            </button>

        </div>


        <div
            class="row c"
            style="margin-top:14px"
        >

            <label class="mute">

                Focus

                <select data-chg="focus">

                    ${
                        [25, 30, 45, 50, 60]

                            .map(

                                x => `

                                <option
                                    ${
                                        x === S.focus
                                            ? 'selected'
                                            : ''
                                    }
                                >

                                    ${x}

                                </option>

                                `
                            )

                            .join('')
                    }

                </select>

                min

            </label>


            <label class="mute">

                Break

                <select data-chg="brk">

                    ${
                        [5, 10, 15]

                            .map(

                                x => `

                                <option
                                    ${
                                        x === S.brk
                                            ? 'selected'
                                            : ''
                                    }
                                >

                                    ${x}

                                </option>

                                `
                            )

                            .join('')
                    }

                </select>

                min

            </label>

        </div>


        <div
            style="
                text-align:left;
                margin-top:18px
            "
        >

            <div class="head">

                <b>
                    Today
                </b>


                <span class="mute">

                    ${hm(done)}
                    of
                    ${hm(S.goal)}
                    goal

                </span>

            </div>


            <div class="bar">

                <i
                    style="
                        width:${gp}%
                    "
                ></i>

            </div>


            <label
                class="mute"
                style="
                    display:block;
                    margin-top:8px
                "
            >

                Daily goal (hours)

                <input
                    type="number"
                    min="1"
                    max="16"
                    step="0.5"
                    value="${S.goal / 60}"
                    data-chg="goal"
                    style="width:80px"
                >

            </label>

        </div>

    </section>

    `;
}


/* =========================
   TASK CARD
========================= */

function taskCard() {

    const t = today();


    const open = S.tasks

        .filter(x => !x.done)

        .sort(

            (a, b) =>

                (a.due || '9') <
                (b.due || '9')

                    ? -1

                    : 1
        );


    const dn = S.tasks
        .filter(x => x.done);


    const row = x => {

        const od =

            !x.done &&
            x.due &&
            x.due < t;


        return `

        <li
            class="it${
                x.done
                    ? ' done'
                    : ''
            }"
        >

            <label>

                <input
                    type="checkbox"
                    data-act="tt"
                    data-id="${x.id}"
                    ${
                        x.done
                            ? 'checked'
                            : ''
                    }
                >

                <span class="t">

                    ${esc(x.t)}

                </span>

            </label>


            <span class="chip">

                ${esc(x.s)}

            </span>


            ${
                x.due

                    ? `

                    <span
                        class="chip${
                            od
                                ? ' bad'
                                : ''
                        }"
                    >

                        ${
                            od
                                ? 'Overdue '
                                : ''
                        }

                        ${
                            new Date(
                                x.due +
                                'T00:00'
                            )

                            .toLocaleDateString(
                                'en-IN',
                                {
                                    day: 'numeric',
                                    month: 'short'
                                }
                            )
                        }

                    </span>

                    `

                    : ''
            }


            <button
                class="x"
                data-act="td"
                data-id="${x.id}"
                aria-label="Delete task"
            >

                &times;

            </button>

        </li>

        `;
    };


    const opts = [

        ...cats(),

        'Other'

    ]

        .map(

            c => `

            <option>

                ${esc(c)}

            </option>

            `
        )

        .join('');


    return `

    <section class="card">


        <h2>
            Tasks
        </h2>


        <form
            class="add"
            data-form="task"
        >

            <input
                type="text"
                name="t"
                placeholder="What will you finish? e.g. Solve 10 array problems"
                required
                maxlength="120"
                aria-label="Task"
            >


            <select
                name="s"
                aria-label="Subject"
            >

                ${opts}

            </select>


            <input
                type="date"
                name="d"
                aria-label="Due date"
            >


            <button class="btn">

                Add task

            </button>

        </form>


        ${
            open.length

                ? `

                <ul>

                    ${
                        open
                            .map(row)
                            .join('')
                    }

                </ul>

                `

                : `

                <p class="empty">

                    Nothing planned yet.
                    Add the first task you want done today.

                </p>

                `
        }


        ${
            dn.length

                ? `

                <div
                    class="head"
                    style="margin-top:16px"
                >

                    <b>
                        Done (${dn.length})
                    </b>


                    <button
                        class="x"
                        data-act="clear"
                        style="font-size:.85rem"
                    >

                        Clear done

                    </button>

                </div>


                <ul>

                    ${
                        dn
                            .map(row)
                            .join('')
                    }

                </ul>

                `

                : ''
        }

    </section>

    `;
}


/* =========================
   ROADMAP
========================= */

function roadmap() {

    const all =
        Object.values(S.topics)
            .flat();


    return `

    <p
        class="mute"
        style="margin-top:0"
    >

        Overall
        ${pct(all)}%
        ready.

        Tick topics as you finish them,
        or add your own.

    </p>


    <div class="grid cats">

        ${
            cats()

                .map(c => {

                    const a =
                        S.topics[c];


                    return `

                    <section class="card">


                        <div class="head">

                            <h3>

                                ${esc(c)}

                            </h3>


                            <span class="mute">

                                ${
                                    a.filter(
                                        x => x.done
                                    ).length
                                }

                                /

                                ${a.length}

                            </span>

                        </div>


                        <div
                            class="bar"
                            style="margin-bottom:8px"
                        >

                            <i
                                style="
                                    width:${pct(a)}%
                                "
                            ></i>

                        </div>


                        <ul>

                            ${
                                a

                                    .map(x => `

                                    <li
                                        class="it${
                                            x.done
                                                ? ' done'
                                                : ''
                                        }"
                                    >

                                        <label>

                                            <input
                                                type="checkbox"
                                                data-act="rt"
                                                data-c="${esc(c)}"
                                                data-id="${x.id}"
                                                ${
                                                    x.done
                                                        ? 'checked'
                                                        : ''
                                                }
                                            >


                                            <span class="t">

                                                ${esc(x.t)}

                                            </span>

                                        </label>


                                        <button
                                            class="x"
                                            data-act="rd"
                                            data-c="${esc(c)}"
                                            data-id="${x.id}"
                                            aria-label="Delete topic"
                                        >

                                            &times;

                                        </button>

                                    </li>

                                    `)

                                    .join('')
                            }

                        </ul>


                        <form
                            class="row"
                            data-form="topic"
                            data-c="${esc(c)}"
                            style="
                                margin-top:10px;
                                flex-wrap:nowrap
                            "
                        >

                            <input
                                type="text"
                                name="t"
                                placeholder="Add a topic"
                                required
                                maxlength="80"
                                aria-label="New topic in ${esc(c)}"
                                style="flex:1"
                            >


                            <button
                                class="btn ghost"
                            >

                                Add

                            </button>

                        </form>

                    </section>

                    `;
                })

                .join('')
        }

    </div>

    `;
}


/* =========================
   PROGRESS
========================= */

function progress() {

    const w = week();


    const tot = w.reduce(
        (a, x) => a + x.m,
        0
    );


    const mx = Math.max(
        60,
        ...w.map(x => x.m)
    );


    const all =
        Object.values(S.topics)
            .flat();


    return `

    <div class="stats">


        <div class="stat">

            <b>
                ${hm(tot)}
            </b>

            <span class="mute">

                studied this week

            </span>

        </div>


        <div class="stat">

            <b>
                ${streak()}
            </b>

            <span class="mute">

                day streak

            </span>

        </div>


        <div class="stat">

            <b>
                ${pct(all)}%
            </b>

            <span class="mute">

                roadmap done

            </span>

        </div>


        <div class="stat">

            <b>
                ${
                    S.tasks.filter(
                        x => x.done
                    ).length
                }
            </b>

            <span class="mute">

                tasks finished

            </span>

        </div>

    </div>


    <section class="card">


        <h2>
            Last 7 days
        </h2>


        <div class="chart">

            ${
                w

                    .map(

                        (x, i) => `

                        <div
                            class="col${
                                i === 6
                                    ? ' today'
                                    : ''
                            }"
                        >

                            <em>

                                ${
                                    x.m
                                        ? hm(x.m)
                                        : ''
                                }

                            </em>


                            <i
                                style="
                                    height:${
                                        Math.round(
                                            x.m /
                                            mx *
                                            100
                                        )
                                    }%
                                "
                            ></i>


                            <span>

                                ${x.n}

                            </span>

                        </div>

                        `
                    )

                    .join('')
            }

        </div>

    </section>


    <section
        class="card"
        style="margin-top:16px"
    >

        <h2>
            By topic area
        </h2>


        ${
            cats()

                .map(

                    c => `

                    <div
                        style="
                            margin-bottom:12px
                        "
                    >

                        <div class="head">

                            <span>

                                ${esc(c)}

                            </span>


                            <span class="mute">

                                ${
                                    pct(
                                        S.topics[c]
                                    )
                                }%

                            </span>

                        </div>


                        <div class="bar">

                            <i
                                style="
                                    width:${
                                        pct(
                                            S.topics[c]
                                        )
                                    }%
                                "
                            ></i>

                        </div>

                    </div>

                    `
                )

                .join('')
        }

    </section>


    <p class="foot">

        <button
            class="btn ghost"
            data-act="theme"
        >

            Switch light/dark

        </button>


        <button
            class="btn ghost"
            data-act="wipe"
        >

            Reset all data

        </button>

    </p>

    `;
}


/* =========================
   RENDER APP
========================= */

function render() {

    const v =

        S.tab === 'today'

            ? `

                <div class="grid two">

                    ${timerCard()}

                    ${taskCard()}

                </div>

                `

            : S.tab === 'roadmap'

                ? roadmap()

                : progress();


    document.getElementById('app').innerHTML =

        header() +

        '<main>' +

        v +

        '</main>';


    paint();
}


/* =========================
   PAINT TIMER
========================= */

function paint() {

    const r =
        document.getElementById('ring');


    const t =
        document.getElementById('tm');


    if (!t) return;


    const l = left();


    t.textContent =
        fmt(l);


    r.setAttribute(

        'stroke-dashoffset',

        (
            565.5 *
            (1 - l / total())
        ).toFixed(1)
    );


    document.title =

        T.running

            ? fmt(l) +
              ' · ' +
              (
                  T.mode === 'focus'
                      ? 'Focus'
                      : 'Break'
              )

            : 'Placement Study Planner';
}


/* =========================
   TIMER SOUND
========================= */

function beep() {

    try {

        const a =
            new (
                window.AudioContext ||
                window.webkitAudioContext
            )();


        const o =
            a.createOscillator();


        const g =
            a.createGain();


        o.connect(g);

        g.connect(
            a.destination
        );


        o.frequency.value = 660;


        g.gain.setValueAtTime(
            0.15,
            a.currentTime
        );


        g.gain.exponentialRampToValueAtTime(
            0.001,
            a.currentTime + 0.8
        );


        o.start();

        o.stop(
            a.currentTime + 0.8
        );

    } catch (e) {}
}


/* =========================
   TIMER FINISH
========================= */

function finish() {

    T.running = false;


    if (T.mode === 'focus') {

        S.log[today()] =

            (
                S.log[today()] ||
                0
            ) +

            S.focus;


        save();
    }


    beep();


    T.mode =

        T.mode === 'focus'

            ? 'break'

            : 'focus';


    T.left = total();


    render();
}


/* Update Timer */

setInterval(() => {

    if (T.running) {

        if (left() <= 0) {

            finish();

        } else {

            paint();
        }
    }

}, 500);


/* Reset Timer */

function setTimer() {

    if (!T.running) {

        T.left = total();
    }
}


/* =========================
   ACTIONS
========================= */

function act(a, d) {


    /* Change Tab */

    if (a === 'tab') {

        S.tab = d.v;

        save();
    }


    /* Change Timer Mode */

    else if (a === 'mode') {

        T.mode = d.v;

        T.running = false;

        T.left = total();
    }


    /* Start / Pause */

    else if (a === 'toggle') {

        if (T.running) {

            T.left = left();

            T.running = false;

        } else {

            T.end =
                Date.now() +
                T.left * 1000;

            T.running = true;
        }
    }


    /* Reset */

    else if (a === 'reset') {

        T.running = false;

        T.left = total();
    }


    /* Toggle Task */

    else if (a === 'tt') {

        const x =
            S.tasks.find(
                x => x.id === d.id
            );


        x.done = !x.done;

        save();
    }


    /* Delete Task */

    else if (a === 'td') {

        S.tasks =
            S.tasks.filter(
                x => x.id !== d.id
            );

        save();
    }


    /* Clear Completed Tasks */

    else if (a === 'clear') {

        S.tasks =
            S.tasks.filter(
                x => !x.done
            );

        save();
    }


    /* Toggle Roadmap */

    else if (a === 'rt') {

        const x =
            S.topics[d.c].find(
                x => x.id === d.id
            );


        x.done = !x.done;

        save();
    }


    /* Delete Roadmap Topic */

    else if (a === 'rd') {

        S.topics[d.c] =
            S.topics[d.c].filter(
                x => x.id !== d.id
            );

        save();
    }


    /* Theme */

    else if (a === 'theme') {

        const r =
            document.documentElement;


        const dark =

            r.dataset.theme

                ? r.dataset.theme === 'dark'

                : matchMedia(
                    '(prefers-color-scheme:dark)'
                ).matches;


        r.dataset.theme =
            dark
                ? 'light'
                : 'dark';
    }


    /* Reset All Data */

    else if (a === 'wipe') {

        if (

            confirm(
                'Delete all tasks, progress and settings on this device?'
            )

        ) {

            S = fresh();

            T.running = false;

            T.mode = 'focus';

            T.left =
                S.focus * 60;


            save();
        }
    }


    render();
}


/* =========================
   CLICK EVENTS
========================= */

document.addEventListener(
    'click',

    e => {

        const b =
            e.target.closest(
                '[data-act]'
            );


        if (b) {

            act(
                b.dataset.act,
                b.dataset
            );
        }
    }
);


/* =========================
   CHANGE EVENTS
========================= */

document.addEventListener(
    'change',

    e => {

        const k =
            e.target.dataset.chg;


        if (!k) return;


        const v =
            e.target.value;


        /* Placement Date */

        if (k === 'target') {

            S.target = v;
        }


        /* Subject */

        else if (k === 'subj') {

            T.subj = v;

            return;
        }


        /* Focus / Break */

        else if (

            k === 'focus' ||
            k === 'brk'

        ) {

            S[k] = +v;

            setTimer();
        }


        /* Daily Goal */

        else if (k === 'goal') {

            S.goal =
                Math.max(

                    60,

                    Math.round(
                        (+v || 4) * 60
                    )
                );
        }


        save();

        render();
    }
);


/* =========================
   FORM SUBMIT
========================= */

document.addEventListener(
    'submit',

    e => {

        e.preventDefault();


        const f =
            e.target;


        const fd =
            new FormData(f);


        const t =
            (
                fd.get('t') ||
                ''
            ).trim();


        if (!t) return;


        /* Add Task */

        if (

            f.dataset.form ===
            'task'

        ) {

            S.tasks.push({

                id: uid(),

                t,

                s:
                    fd.get('s'),

                due:
                    fd.get('d') ||
                    '',

                done: false
            });
        }


        /* Add Roadmap Topic */

        else if (

            f.dataset.form ===
            'topic'

        ) {

            S.topics[
                f.dataset.c
            ].push({

                id: uid(),

                t,

                done: false
            });
        }


        save();

        render();
    }
);


/* =========================
   INITIAL RENDER
========================= */

render();