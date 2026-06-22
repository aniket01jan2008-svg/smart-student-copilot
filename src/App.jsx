import {
  startTransition,
  useDeferredValue,
  useEffect,
  useEffectEvent,
  useMemo,
  useState,
} from 'react'
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
    detail: 'Open with an overloaded student schedule and frame the product as clarity-first, not feature-first.',
  },
  {
    label: 'Frame 02',
    title: 'AI Planning Moment',
    detail: 'Enter the goal, time available, and blockers, then generate the study plan live with Gemini or demo mode.',
  },
  {
    label: 'Frame 03',
    title: 'Usable Output',
    detail: 'Show the cleaned result cards, today tasks, prompt pack, and polished interface in one flow.',
  },
]

const demoScript = [
  'Students do not need another cluttered dashboard; they need a clear next move.',
  'Smart Student Copilot turns one messy academic goal into a focused plan with priorities, milestones, and daily action.',
  'The product stays intentionally small so a solo builder can ship polish, explain the value fast, and finish on time.',
]

const scrollStages = [
  { id: 'hero', code: '00', label: 'Surface', detail: 'Product framing and premium first impression.' },
  { id: 'planner', code: '01', label: 'Input', detail: 'Student goal, time, and blockers enter the system.' },
  { id: 'systems', code: '02', label: 'Signals', detail: 'Problem, AI core, and judging angle become clear.' },
  { id: 'story', code: '03', label: 'Narrative', detail: 'Before, AI moment, and after-state stay readable.' },
  { id: 'execution', code: '04', label: 'Execution', detail: 'Pitch, focus, and why-now stay front and center.' },
  { id: 'roadmap', code: '05', label: 'Roadmap', detail: 'The build sequence becomes the next action plan.' },
  { id: 'result', code: '06', label: 'Output', detail: 'The generated experience feels real and shippable.' },
  { id: 'prompts', code: '07', label: 'Prompts', detail: 'Gemini usage is visible, useful, and reusable.' },
  { id: 'submission', code: '08', label: 'Submission', detail: 'Screenshots, demo flow, and final pitch line up.' },
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
          'Connect Gemini through Google AI Studio with one planning prompt that produces clear, structured output.',
          'Polish the planner results with cleaner sections, smarter prompts, and better empty states.',
          'Deploy early and iterate on interface quality instead of chasing extra features.',
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
  const rotateY = ((offsetX / bounds.width) - 0.5) * 12
  const rotateX = ((offsetY / bounds.height) - 0.5) * -10

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
  const [activeStage, setActiveStage] = useState('hero')

  const aiMode = import.meta.env.VITE_GEMINI_API_KEY ? 'Gemini connected' : 'Demo mode'
  const deferredActiveStage = useDeferredValue(activeStage)

  const heroStats = useMemo(
    () => [
      {
        label: 'Mode',
        value: aiMode,
        detail: 'Planning engine state',
      },
      {
        label: 'Stack',
        value: 'React + Gemini',
        detail: 'Frontend-first build',
      },
      {
        label: 'Scope',
        value: 'Solo MVP',
        detail: 'One workflow locked',
      },
      {
        label: 'Deadline',
        value: 'Jun 29',
        detail: 'Submission timing',
      },
    ],
    [aiMode],
  )

  const signalStrip = useMemo(
    () => [
      'Google AI Studio required',
      'One polished workflow',
      'Solo-friendly scope',
      'Judge-ready story',
      'Deployed on Vercel',
      'Prompt-driven planner',
      'Verified Vibe2Ship refs',
    ],
    [],
  )

  const sceneChecklist = useMemo(
    () => [
      'Official event links loaded into the product story',
      'Gemini workflow positioned as the main live moment',
      'Scope locked to one visible student productivity problem',
    ],
    [],
  )

  const proofMarkers = useMemo(
    () => [
      { label: 'Scope Lock', value: '1 strong workflow' },
      { label: 'Builder Fit', value: 'Beginner-friendly stack' },
      { label: 'Judge Hook', value: 'Clear live output' },
    ],
    [],
  )

  const systemSignals = useMemo(
    () => [
      {
        label: 'Problem Surface',
        value: 'Student overload is scattered',
        detail: 'Assignments, study targets, deadlines, and learning resources usually live in different places.',
      },
      {
        label: 'AI Core',
        value: 'Goal to plan to next move',
        detail: 'The product takes one messy input and turns it into priorities, milestones, and daily action.',
      },
      {
        label: 'Submission Edge',
        value: 'Easy to judge in one minute',
        detail: 'The flow is simple to explain, polished to show, and realistic for a solo builder to finish.',
      },
    ],
    [],
  )

  const storyCards = useMemo(
    () => [
      {
        label: 'Before',
        title: 'Students usually begin with chaos',
        detail:
          'Too many tabs, unclear priorities, and no simple place to decide what matters first.',
      },
      {
        label: 'Copilot Engine',
        title: 'The AI narrows the problem fast',
        detail: plan.focus,
      },
      {
        label: 'After',
        title: 'The output feels immediately useful',
        detail:
          'A student sees what to do today, what to push later, and how to move forward without overthinking.',
      },
    ],
    [plan.focus],
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

  const activeStageIndex = useMemo(
    () => scrollStages.findIndex((stage) => stage.id === deferredActiveStage),
    [deferredActiveStage],
  )

  const activeStageMeta = useMemo(
    () => scrollStages[Math.max(activeStageIndex, 0)] ?? scrollStages[0],
    [activeStageIndex],
  )

  const syncScrollDepth = useEffectEvent(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.documentElement.style.setProperty('--page-progress', '0')
      document.documentElement.style.setProperty('--hero-shift', '0px')
      document.documentElement.style.setProperty('--hero-tilt', '0deg')
      document.documentElement.style.setProperty('--scene-lift', '0px')
      return
    }

    const scrollTop = window.scrollY
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight
    const progress = maxScroll > 0 ? Math.min(scrollTop / maxScroll, 1) : 0
    const heroShift = Math.min(scrollTop * 0.1, 96)
    const heroTilt = Math.min(scrollTop * 0.018, 8)
    const sceneLift = Math.min(scrollTop * 0.085, 72)

    document.documentElement.style.setProperty('--page-progress', progress.toFixed(4))
    document.documentElement.style.setProperty('--hero-shift', `${heroShift.toFixed(2)}px`)
    document.documentElement.style.setProperty('--hero-tilt', `${heroTilt.toFixed(2)}deg`)
    document.documentElement.style.setProperty('--scene-lift', `${sceneLift.toFixed(2)}px`)
  })

  const syncActiveStage = useEffectEvent((entries) => {
    let nextStage = deferredActiveStage
    let strongest = 0

    for (const entry of entries) {
      const stageId = entry.target.getAttribute('data-stage')

      if (!stageId) {
        continue
      }

      if (entry.isIntersecting && entry.intersectionRatio >= strongest) {
        strongest = entry.intersectionRatio
        nextStage = stageId
      }
    }

    if (nextStage !== deferredActiveStage) {
      startTransition(() => {
        setActiveStage(nextStage)
      })
    }
  })

  useEffect(() => {
    let frameId = 0

    const scheduleSync = () => {
      if (frameId) {
        return
      }

      frameId = window.requestAnimationFrame(() => {
        frameId = 0
        syncScrollDepth()
      })
    }

    scheduleSync()
    window.addEventListener('scroll', scheduleSync, { passive: true })
    window.addEventListener('resize', scheduleSync)

    return () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId)
      }

      window.removeEventListener('scroll', scheduleSync)
      window.removeEventListener('resize', scheduleSync)
    }
  }, [])

  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll('[data-stage]'))

    if (!nodes.length) {
      return undefined
    }

    const observer = new IntersectionObserver(syncActiveStage, {
      threshold: [0.2, 0.35, 0.5, 0.7],
      rootMargin: '-18% 0px -30% 0px',
    })

    for (const node of nodes) {
      observer.observe(node)
    }

    return () => {
      observer.disconnect()
    }
  }, [])

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

  function stagePanelClass(base, stageId) {
    return `${base} stage-panel${deferredActiveStage === stageId ? ' stage-panel-active' : ''}`
  }

  return (
    <div className="page-shell">
      <div className="backdrop">
        <div className="backdrop-grid" />
        <div className="backdrop-orb backdrop-orb-a" />
        <div className="backdrop-orb backdrop-orb-b" />
        <div className="backdrop-orb backdrop-orb-c" />
      </div>

      <header
        className={`hero${deferredActiveStage === 'hero' ? ' hero-active' : ''}`}
        id="hero"
        data-stage="hero"
      >
        <nav className="topbar" aria-label="Primary">
          <div className="brand-lockup">
            <span className="brand-mark">SSC</span>
            <div>
              <p className="eyebrow">Vibe2Ship Build</p>
              <strong>Smart Student Copilot</strong>
            </div>
          </div>

          <div className="topbar-meta">
            <div className="status-pill" aria-label="Build status">
              <span className="status-dot" />
              Build story active
            </div>
            <div className="topbar-links">
              <a href="#planner">Planner</a>
              <a href="#roadmap">Roadmap</a>
              <a href="#prompts">Prompt Pack</a>
            </div>
          </div>
        </nav>

        <div className="hero-layout">
          <section className="hero-copy">
            <div className="hero-availability">
              <span className="status-dot" />
              <p>Available to ship a focused student AI product</p>
            </div>

            <p className="eyebrow">AI Productivity Prototype</p>

            <div className="hero-headline-grid">
              <div className="hero-headline-stack">
                <span className="hero-outline-word">Turn</span>
                <span className="hero-solid-word">student overload</span>
              </div>

              <div className="hero-sideword">
                <span>Master Your</span>
                <strong>FLOW</strong>
              </div>
            </div>

            <h1 className="hero-subheadline">into a clean, demo-ready AI workflow.</h1>
            <p className="hero-text">
              Smart Student Copilot keeps the same product idea, but presents it like a
              serious product: students enter goals, available time, and blockers, then get
              a calm AI-backed action plan they can actually follow.
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

            <div className="scroll-enter">
              <span />
              <p>Scroll to enter the build story</p>
            </div>

            <div className="stat-grid">
              {heroStats.map((item) => (
                <article className="stat-card" key={item.label}>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                  <p>{item.detail}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="hero-scene" aria-label="Product system view">
            <div className="scene-rails scene-rails-horizontal" />
            <div className="scene-rails scene-rails-vertical" />
            <div className="scene-orbit" />
            <div className="scene-grid" />
            <div className="scene-glow scene-glow-primary" />
            <div className="scene-glow scene-glow-secondary" />

            <article
              className="scene-panel scene-panel-main interactive-card"
              onMouseMove={setTilt}
              onMouseLeave={resetTilt}
            >
              <div className="card-sheen" />
              <div className="scene-head">
                <p className="card-badge">Mission Status</p>
                <span className="status-chip">Ready to demo</span>
              </div>
              <h2>{plan.pitch}</h2>
              <p>{plan.focus}</p>

              <div className="scene-metric-row">
                {proofMarkers.map((item) => (
                  <article className="marker-card" key={item.label}>
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                  </article>
                ))}
              </div>

              <div className="scene-progress" aria-hidden="true">
                <span />
                <span />
                <span />
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

      <section className="hero-support-grid" aria-label="Hero support details">
        <article className="support-card">
          <p className="card-badge">Build Window</p>
          <ul className="support-list">
            {sceneChecklist.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>

        <article className="support-card">
          <p className="card-badge">Judge Lens</p>
          <p className="support-copy">
            One strong AI workflow beats a feature-heavy student dashboard. The story should
            show clear input, clear intelligence, and a result that looks immediately useful.
          </p>
        </article>
      </section>

      <section className="scroll-dock" aria-label="Scroll narrative status">
        <div className="scroll-dock-copy">
          <p className="eyebrow">Scroll Depth</p>
          <h2>{activeStageMeta.label}</h2>
          <p>{activeStageMeta.detail}</p>
        </div>

        <div className="scroll-dock-rail">
          <div className="scroll-progress-bar" aria-hidden="true">
            <span style={{ width: `${((activeStageIndex + 1) / scrollStages.length) * 100}%` }} />
          </div>

          <div className="scroll-stage-grid">
            {scrollStages.map((stage, index) => (
              <a
                className={`scroll-stage-card${deferredActiveStage === stage.id ? ' scroll-stage-card-active' : ''}`}
                href={`#${stage.id}`}
                key={stage.id}
              >
                <span>{stage.code}</span>
                <strong>{stage.label}</strong>
                <p>{index <= activeStageIndex ? 'Live' : 'Pending'}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      <main className="content-grid">
        <section className={stagePanelClass('panel planner-panel', 'planner')} id="planner" data-stage="planner">
          <div className="section-head">
            <p className="eyebrow">Mission Input</p>
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

        <section className={stagePanelClass('panel mission-panel', 'planner')} data-stage="planner">
          <div className="section-head">
            <p className="eyebrow">Official Context</p>
            <h2>Real hackathon references</h2>
            <p>
              The product keeps the verified event context visible so the project story stays
              grounded in the actual Vibe2Ship requirement set.
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

          <ul className="context-list">
            <li>Solo participation is supported.</li>
            <li>Google AI Studio usage is part of the challenge requirement.</li>
            <li>Final detailed statements remain participant-gated inside the event flow.</li>
          </ul>
        </section>

        <section
          className={stagePanelClass('panel panel-wide systems-panel', 'systems')}
          id="systems"
          data-stage="systems"
        >
          <div className="section-head">
            <p className="eyebrow">System Signals</p>
            <h2>Why this project direction is strong</h2>
          </div>

          <div className="systems-grid">
            {systemSignals.map((item) => (
              <article
                className="system-card interactive-card"
                key={item.label}
                onMouseMove={setTilt}
                onMouseLeave={resetTilt}
              >
                <div className="card-sheen" />
                <p className="roadmap-label">{item.label}</p>
                <h3>{item.value}</h3>
                <p>{item.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section
          className={stagePanelClass('panel panel-wide story-panel', 'story')}
          id="story"
          data-stage="story"
        >
          <div className="section-head">
            <p className="eyebrow">Narrative Flow</p>
            <h2>Keep the product story easy to understand</h2>
          </div>

          <div className="story-grid">
            {storyCards.map((item) => (
              <article
                className="insight-card interactive-card"
                key={item.title}
                onMouseMove={setTilt}
                onMouseLeave={resetTilt}
              >
                <div className="card-sheen" />
                <p className="roadmap-label">{item.label}</p>
                <h3>{item.title}</h3>
                <p>{item.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section
          className={stagePanelClass('panel panel-wide signal-panel', 'execution')}
          id="execution"
          data-stage="execution"
        >
          <div className="section-head">
            <p className="eyebrow">Execution Layer</p>
            <h2>{plan.title}</h2>
          </div>

          <div className="insight-grid">
            {resultHighlights.map((item) => (
              <article
                className="insight-card interactive-card"
                key={item.title}
                onMouseMove={setTilt}
                onMouseLeave={resetTilt}
              >
                <div className="card-sheen" />
                <h3>{item.title}</h3>
                <p>{item.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section
          className={stagePanelClass('panel panel-wide roadmap-panel', 'roadmap')}
          id="roadmap"
          data-stage="roadmap"
        >
          <div className="section-head">
            <p className="eyebrow">Roadmap</p>
            <h2>Build sequence with stronger visual discipline</h2>
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

        <section className={stagePanelClass('panel', 'roadmap')} data-stage="roadmap">
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

        <section className={stagePanelClass('panel', 'result')} id="result" data-stage="result">
          <div className="section-head">
            <p className="eyebrow">Generated View</p>
            <h2>What the result screen should feel like</h2>
          </div>
          <div className="result-deck">
            <article
              className="result-card result-card-feature interactive-card"
              onMouseMove={setTilt}
              onMouseLeave={resetTilt}
            >
              <div className="card-sheen" />
              <div className="card-badge">AI Output</div>
              <h3>Priority-first study plan</h3>
              <p>{plan.promptIdeas[1]}</p>
            </article>
            <article
              className="result-card interactive-card"
              onMouseMove={setTilt}
              onMouseLeave={resetTilt}
            >
              <div className="card-sheen" />
              <div className="card-badge">Today</div>
              <ul>
                {plan.todayTasks.slice(0, 3).map((task) => (
                  <li key={task}>{task}</li>
                ))}
              </ul>
            </article>
            <article
              className="result-card interactive-card"
              onMouseMove={setTilt}
              onMouseLeave={resetTilt}
            >
              <div className="card-sheen" />
              <div className="card-badge">Proof of Value</div>
              <p>
                One polished AI workflow is easier to judge, easier to explain, and easier to
                ship than a wide feature set with weak execution.
              </p>
            </article>
          </div>
        </section>

        <section className={stagePanelClass('panel', 'prompts')} id="prompts" data-stage="prompts">
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

        <section
          className={stagePanelClass('panel panel-wide', 'submission')}
          id="submission"
          data-stage="submission"
        >
          <div className="section-head">
            <p className="eyebrow">Submission Prep</p>
            <h2>Screenshots and demo copy ready for the final story</h2>
          </div>

          <div className="submission-grid">
            <div className="demo-frame-grid">
              {demoFrames.map((frame) => (
                <article
                  className="demo-frame interactive-card"
                  key={frame.label}
                  onMouseMove={setTilt}
                  onMouseLeave={resetTilt}
                >
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

        <section className={stagePanelClass('panel panel-wide footer-cta', 'submission')} data-stage="submission">
          <div className="cta-band">
            <div className="cta-copy">
              <p className="eyebrow">Final Push</p>
              <h2>Ship the cleanest version, then record the demo.</h2>
              <p>
                The strongest submission is not the most complex one. It is the version that
                looks intentional, works reliably, and shows clear value in under a minute.
              </p>
            </div>
            <div className="cta-actions">
              <a className="primary-link" href="#planner">
                Refine Plan
              </a>
              <a
                className="secondary-link"
                href="https://github.com/aniket01jan2008-svg/smart-student-copilot"
                target="_blank"
                rel="noreferrer"
              >
                Open GitHub Repo
              </a>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
