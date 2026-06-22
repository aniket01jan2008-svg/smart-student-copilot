import { startTransition, useMemo, useState } from 'react'
import { GoogleGenAI } from '@google/genai'
import './App.css'

const officialLinks = [
  {
    label: 'Vibe2Ship Event Page',
    href: 'https://blockseblock.com/hackathon_details/Vibe2Ship',
  },
  {
    label: 'Coding Ninjas Landing Page',
    href: 'https://www.codingninjas.com/landing/10x-vibe2ship/',
  },
  {
    label: 'Guidelines Doc',
    href: 'https://docs.google.com/document/d/1tRlULMcNthm3wAVd2MKEwosv44BqvRXIil4e359_5BM/edit?tab=t.6awy00z9xq1f',
  },
]

const initialForm = {
  name: 'Aniket',
  goal: 'Build a solo AI-powered student productivity assistant for the Vibe2Ship hackathon.',
  hours: '5',
  deadline: 'June 29, 2026, 2:00 PM IST',
  challenges:
    'Task planning, clear next steps, study prioritization, and keeping the project small enough to finish on time.',
}

const demoFrames = [
  {
    label: 'Frame 01',
    title: 'Problem Setup',
    detail: 'Show a stressed student workload and explain the need for clarity, not complexity.',
  },
  {
    label: 'Frame 02',
    title: 'AI Planning Moment',
    detail: 'Enter a goal, hours, and constraints, then generate the plan live with Gemini or demo mode.',
  },
  {
    label: 'Frame 03',
    title: 'Usable Output',
    detail: 'Show the structured result cards, today plan, and reusable prompt pack in one clean flow.',
  },
]

const demoScript = [
  'Students usually do not need another cluttered dashboard; they need a clear next move.',
  'Smart Student Copilot turns one messy academic goal into a focused plan with priorities, milestones, and action steps.',
  'The product stays intentionally small so a solo builder can ship a polished experience before the deadline.',
]

function buildFallbackPlan(form) {
  const hoursNumber = Number(form.hours) || 4

  return {
    title: 'Smart Student Copilot',
    pitch:
      'An AI-powered study companion that turns academic chaos into clear daily action.',
    focus:
      'Ship one clean workflow: students enter a goal or workload, and the app returns a structured study plan with clear priorities and next actions.',
    whyNow:
      'This is solo-friendly, easy to demo, and aligned with the hackathon requirement to use Google AI Studio as part of the solution.',
    roadmap: [
      {
        label: 'Launch Surface',
        items: [
          'Turn the hero into a believable product story, not a generic project page.',
          'Keep the planning form and generated result in the first viewport decision flow.',
          'Use one memorable AI interaction that screenshots well for submission.',
        ],
      },
      {
        label: 'Core Build',
        items: [
          'Connect Gemini through Google AI Studio with a single planning prompt that produces clear, structured output.',
          'Polish the planner results with cleaner sections, smarter prompts, and better empty states.',
          'Deploy early and iterate on the interface rather than chasing extra features.',
        ],
      },
      {
        label: 'Submission Edge',
        items: [
          'Record one crisp walkthrough with a student problem, input, and generated plan.',
          'Keep the story around productivity, clarity, and approachable AI guidance.',
          'Spend the final pass on visual polish, mobile behavior, and demo reliability.',
        ],
      },
    ],
    todayTasks: [
      `Work in ${hoursNumber}-hour blocks and make the planner flow feel premium before adding new screens.`,
      'Keep only one AI moment in the MVP: turning a messy student goal into a usable plan.',
      'Avoid auth, databases, multiplayer, or any integration that slows the first polished submission.',
      'Prepare one sample workflow that you can confidently show in screenshots and video.',
    ],
    promptIdeas: [
      `You are an academic productivity coach. Given a student's goal, workload, available hours, and constraints, return a practical study plan with priorities, milestones, and next actions.\n\nGoal: ${form.goal}\nHours per day: ${form.hours}\nChallenges: ${form.challenges}\nDeadline: ${form.deadline}`,
      'Rewrite the plan for a beginner-friendly student interface. Keep the advice encouraging, concrete, and broken into daily actions.',
    ],
  }
}

function extractJson(text) {
  const raw = text.trim()

  if (raw.startsWith('{')) {
    return raw
  }

  const fenced = raw.match(/```json\s*([\s\S]*?)```/i)
  if (fenced) {
    return fenced[1].trim()
  }

  const bracketStart = raw.indexOf('{')
  const bracketEnd = raw.lastIndexOf('}')

  if (bracketStart !== -1 && bracketEnd !== -1 && bracketEnd > bracketStart) {
    return raw.slice(bracketStart, bracketEnd + 1)
  }

  throw new Error('No JSON payload returned')
}

function setTilt(event) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return
  }

  const target = event.currentTarget
  const bounds = target.getBoundingClientRect()
  const offsetX = event.clientX - bounds.left
  const offsetY = event.clientY - bounds.top
  const rotateY = ((offsetX / bounds.width) - 0.5) * 16
  const rotateX = ((offsetY / bounds.height) - 0.5) * -14

  target.style.setProperty('--tilt-x', `${rotateX.toFixed(2)}deg`)
  target.style.setProperty('--tilt-y', `${rotateY.toFixed(2)}deg`)
  target.style.setProperty('--glow-x', `${((offsetX / bounds.width) * 100).toFixed(1)}%`)
  target.style.setProperty('--glow-y', `${((offsetY / bounds.height) * 100).toFixed(1)}%`)
}

function resetTilt(event) {
  const target = event.currentTarget
  target.style.setProperty('--tilt-x', '0deg')
  target.style.setProperty('--tilt-y', '0deg')
  target.style.setProperty('--glow-x', '50%')
  target.style.setProperty('--glow-y', '50%')
}

async function generateGeminiPlan(form) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY
  const model = import.meta.env.VITE_GEMINI_MODEL || 'gemini-3.5-flash'
  const ai = new GoogleGenAI({ apiKey })

  const prompt = `
Return only valid JSON.

You are helping a solo hackathon participant build an MVP called Smart Student Copilot.
The output must be concise, practical, and realistic for a beginner-to-early-intermediate frontend developer.

JSON shape:
{
  "title": string,
  "pitch": string,
  "focus": string,
  "whyNow": string,
  "roadmap": [
    {
      "label": string,
      "items": [string, string, string]
    }
  ],
  "todayTasks": [string, string, string, string],
  "promptIdeas": [string, string]
}

Context:
- Participant name: ${form.name}
- Goal: ${form.goal}
- Available hours per day: ${form.hours}
- Deadline: ${form.deadline}
- Challenges: ${form.challenges}
- Hackathon requirement: Google AI Studio must be used as part of the solution.
- Keep the MVP focused on one strong workflow and avoid unnecessary complexity.
`.trim()

  const interaction = await ai.interactions.create({
    model,
    input: prompt,
  })

  const payload = extractJson(interaction.outputText)
  return JSON.parse(payload)
}

function App() {
  const [form, setForm] = useState(initialForm)
  const [plan, setPlan] = useState(() => buildFallbackPlan(initialForm))
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const [copiedIndex, setCopiedIndex] = useState(null)

  const aiMode = import.meta.env.VITE_GEMINI_API_KEY ? 'Gemini connected' : 'Demo mode'

  const stats = useMemo(
    () => [
      { label: 'Mode', value: aiMode },
      { label: 'Stack', value: 'React + Gemini' },
      { label: 'Vibe', value: 'Solo MVP' },
      { label: 'Deadline', value: 'Jun 29' },
    ],
    [aiMode],
  )

  const signalStrip = useMemo(
    () => [
      'Google AI Studio required',
      'Solo build only',
      'Deployed on Vercel',
      'Prompt-driven planner',
      'Submission-first scope',
      'Official Vibe2Ship refs included',
    ],
    [],
  )

  const resultHighlights = useMemo(
    () => [
      {
        title: 'Product Pitch',
        detail: plan.pitch,
      },
      {
        title: 'MVP Focus',
        detail: plan.focus,
      },
      {
        title: 'Why It Works',
        detail: plan.whyNow,
      },
    ],
    [plan],
  )

  async function handleGenerate(event) {
    event.preventDefault()
    setStatus('loading')
    setError('')

    try {
      const nextPlan = import.meta.env.VITE_GEMINI_API_KEY
        ? await generateGeminiPlan(form)
        : buildFallbackPlan(form)

      startTransition(() => {
        setPlan(nextPlan)
        setStatus('done')
      })
    } catch (err) {
      setPlan(buildFallbackPlan(form))
      setStatus('done')
      setError(
        err instanceof Error
          ? `${err.message}. Showing the built-in demo plan instead.`
          : 'Gemini generation failed. Showing the built-in demo plan instead.',
      )
    }
  }

  async function handleCopyPrompt(index, prompt) {
    await navigator.clipboard.writeText(prompt)
    setCopiedIndex(index)
    window.setTimeout(() => setCopiedIndex(null), 1400)
  }

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  return (
    <div className="page-shell">
      <div className="backdrop">
        <div className="backdrop-grid" />
        <div className="backdrop-orb backdrop-orb-a" />
        <div className="backdrop-orb backdrop-orb-b" />
        <div className="backdrop-orb backdrop-orb-c" />
      </div>

      <header className="hero">
        <nav className="topbar" aria-label="Primary">
          <div className="brand-lockup">
            <span className="brand-mark">SSC</span>
            <div>
              <p className="eyebrow">Vibe2Ship Build</p>
              <strong>Smart Student Copilot</strong>
            </div>
          </div>
          <div className="topbar-links">
            <a href="#planner">Planner</a>
            <a href="#roadmap">Roadmap</a>
            <a href="#prompts">Prompt Pack</a>
          </div>
        </nav>

        <div className="hero-layout">
          <section className="hero-copy">
            <p className="eyebrow">AI Productivity Prototype</p>
            <h1>Make the hackathon project look like a product, not a school assignment.</h1>
            <p className="hero-text">
              Smart Student Copilot is a more cinematic Vibe2Ship concept for
              transforming overloaded student workflows into a calmer, clearer, AI-assisted
              action plan.
            </p>

            <div className="hero-actions">
              <a className="primary-link" href="#planner">
                Generate MVP Plan
              </a>
              <a
                className="secondary-link"
                href="https://smart-student-copilot.vercel.app"
                target="_blank"
                rel="noreferrer"
              >
                Open Live Build
              </a>
            </div>

            <div className="stat-grid">
              {stats.map((item) => (
                <article className="stat-card" key={item.label}>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </article>
              ))}
            </div>
          </section>

          <section className="hero-scene" aria-label="Product showcase">
            <div className="scene-base" />
            <div className="scene-glow" />

            <article className="floating-card floating-card-main">
              <div className="tilt-shell interactive-card" onMouseMove={setTilt} onMouseLeave={resetTilt}>
                <div className="card-sheen" />
                <div className="card-badge">Current Direction</div>
                <h2>{plan.pitch}</h2>
                <p>{plan.focus}</p>
                <div className="mini-bars">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            </article>

            <article className="floating-card floating-card-side">
              <div className="tilt-shell interactive-card" onMouseMove={setTilt} onMouseLeave={resetTilt}>
                <div className="card-sheen" />
                <div className="card-badge">Today’s Push</div>
                <ul>
                  {plan.todayTasks.slice(0, 2).map((task) => (
                    <li key={task}>{task}</li>
                  ))}
                </ul>
              </div>
            </article>

            <article className="floating-card floating-card-mini">
              <div className="tilt-shell interactive-card" onMouseMove={setTilt} onMouseLeave={resetTilt}>
                <div className="card-sheen" />
                <div className="card-badge">Official Links</div>
                <p>Real Vibe2Ship references are built into the app and README.</p>
              </div>
            </article>
          </section>
        </div>
      </header>

      <section className="signal-strip" aria-label="Project highlights">
        <div className="signal-track">
          {signalStrip.concat(signalStrip).map((item, index) => (
            <span className="signal-pill" key={`${item}-${index}`}>
              {item}
            </span>
          ))}
        </div>
      </section>

      <main className="content-grid">
        <section className="panel planner-panel" id="planner">
          <div className="section-head">
            <p className="eyebrow">Mission Control</p>
            <h2>Generate a realistic solo build plan</h2>
            <p>
              Keep the product story sharp, the scope small, and the AI output useful enough
              to demo in one minute.
            </p>
          </div>

          <form className="planner-form" onSubmit={handleGenerate}>
            <label>
              <span>Builder name</span>
              <input
                value={form.name}
                onChange={(event) => updateField('name', event.target.value)}
              />
            </label>

            <label>
              <span>Project goal</span>
              <textarea
                rows="4"
                value={form.goal}
                onChange={(event) => updateField('goal', event.target.value)}
              />
            </label>

            <div className="two-up">
              <label>
                <span>Hours per day</span>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={form.hours}
                  onChange={(event) => updateField('hours', event.target.value)}
                />
              </label>

              <label>
                <span>Deadline</span>
                <input
                  value={form.deadline}
                  onChange={(event) => updateField('deadline', event.target.value)}
                />
              </label>
            </div>

            <label>
              <span>Current challenges</span>
              <textarea
                rows="4"
                value={form.challenges}
                onChange={(event) => updateField('challenges', event.target.value)}
              />
            </label>

            <div className="form-meta">
              <p>
                {aiMode === 'Gemini connected'
                  ? 'Gemini mode is active. The planner uses the Google AI Studio-backed SDK.'
                  : 'Demo mode is active. Add VITE_GEMINI_API_KEY later to unlock Gemini-backed planning.'}
              </p>
              <button type="submit" className="generate-button" disabled={status === 'loading'}>
                {status === 'loading' ? 'Generating...' : 'Generate Hackathon Plan'}
              </button>
            </div>
          </form>

          {error ? <p className="notice warning">{error}</p> : null}
        </section>

        <section className="panel mission-panel">
          <div className="section-head">
            <p className="eyebrow">Official Context</p>
            <h2>Real hackathon references</h2>
            <p>
              The app keeps the verified event context visible so the project stays grounded
              in the actual Vibe2Ship rules.
            </p>
          </div>

          <ul className="resource-list">
            {officialLinks.map((item, index) => (
              <li key={item.href}>
                <a href={item.href} target="_blank" rel="noreferrer">
                  <span className="resource-index">0{index + 1}</span>
                  <span>{item.label}</span>
                </a>
              </li>
            ))}
          </ul>

          <p className="notice">
            Public pages confirm solo participation and required use of Google AI Studio, but
            the final statement details are still participant-gated.
          </p>
        </section>

        <section className="panel panel-wide signal-panel">
          <div className="section-head">
            <p className="eyebrow">Execution Layer</p>
            <h2>{plan.title}</h2>
          </div>

          <div className="insight-grid">
            {resultHighlights.map((item) => (
              <article className="insight-card interactive-card" key={item.title} onMouseMove={setTilt} onMouseLeave={resetTilt}>
                <div className="card-sheen" />
                <h3>{item.title}</h3>
                <p>{item.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="panel panel-wide roadmap-panel" id="roadmap">
          <div className="section-head">
            <p className="eyebrow">Roadmap</p>
            <h2>Build sequence with stronger visual story</h2>
          </div>

          <div className="roadmap-grid">
            {plan.roadmap.map((block) => (
              <article
                className="roadmap-card interactive-card"
                key={block.label}
                onMouseMove={setTilt}
                onMouseLeave={resetTilt}
              >
                <div className="card-sheen" />
                <p className="roadmap-label">{block.label}</p>
                <ul>
                  {block.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="section-head">
            <p className="eyebrow">Immediate Moves</p>
            <h2>What to do next</h2>
          </div>
          <ol className="task-list">
            {plan.todayTasks.map((task) => (
              <li key={task}>{task}</li>
            ))}
          </ol>
        </section>

        <section className="panel">
          <div className="section-head">
            <p className="eyebrow">Generated View</p>
            <h2>What the result screen should feel like</h2>
          </div>
          <div className="result-deck">
            <article className="result-card result-card-feature interactive-card" onMouseMove={setTilt} onMouseLeave={resetTilt}>
              <div className="card-sheen" />
              <div className="card-badge">AI Output</div>
              <h3>Priority-first study plan</h3>
              <p>{plan.promptIdeas[1]}</p>
            </article>
            <article className="result-card interactive-card" onMouseMove={setTilt} onMouseLeave={resetTilt}>
              <div className="card-sheen" />
              <div className="card-badge">Today</div>
              <ul>
                {plan.todayTasks.slice(0, 3).map((task) => (
                  <li key={task}>{task}</li>
                ))}
              </ul>
            </article>
            <article className="result-card interactive-card" onMouseMove={setTilt} onMouseLeave={resetTilt}>
              <div className="card-sheen" />
              <div className="card-badge">Proof of Value</div>
              <p>
                One polished AI workflow is easier to judge, easier to explain, and easier to
                ship than a wide feature set with weak execution.
              </p>
            </article>
          </div>
        </section>

        <section className="panel" id="prompts">
          <div className="section-head">
            <p className="eyebrow">Prompt Pack</p>
            <h2>Gemini prompts ready to reuse</h2>
          </div>
          <div className="prompt-stack">
            {plan.promptIdeas.map((prompt, index) => (
              <article className="prompt-card" key={prompt}>
                <pre>{prompt}</pre>
                <button type="button" onClick={() => handleCopyPrompt(index, prompt)}>
                  {copiedIndex === index ? 'Copied' : 'Copy prompt'}
                </button>
              </article>
            ))}
          </div>
        </section>

        <section className="panel panel-wide">
          <div className="section-head">
            <p className="eyebrow">Submission Prep</p>
            <h2>Screenshots and demo copy ready for the final story</h2>
          </div>

          <div className="submission-grid">
            <div className="demo-frame-grid">
              {demoFrames.map((frame) => (
                <article className="demo-frame interactive-card" key={frame.label} onMouseMove={setTilt} onMouseLeave={resetTilt}>
                  <div className="card-sheen" />
                  <p className="roadmap-label">{frame.label}</p>
                  <h3>{frame.title}</h3>
                  <p>{frame.detail}</p>
                </article>
              ))}
            </div>

            <article className="demo-script-card">
              <p className="eyebrow">Voiceover Copy</p>
              <ol className="script-list">
                {demoScript.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ol>
            </article>
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
