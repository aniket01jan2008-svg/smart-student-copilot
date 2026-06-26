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

const energyOptions = [
  { value: 'low', label: 'Low Energy' },
  { value: 'medium', label: 'Normal Energy' },
  { value: 'high', label: 'High Energy' },
]

const rescueWindows = [
  { value: '24', label: 'Next 24 hours' },
  { value: '72', label: 'Next 3 days' },
  { value: '168', label: 'Next 7 days' },
]

const initialForm = {
  studentName: 'Aniket',
  goal: 'Recover from deadline overload and stop missing important academic work.',
  availableHours: '5',
  rescueWindow: '72',
  energy: 'medium',
  notes: 'I want a realistic rescue plan, clear priorities, and what to do first today.',
}

const initialTasks = [
  {
    id: 'task-1',
    title: 'DBMS assignment submission',
    dueInHours: '18',
    effortHours: '3',
    importance: '5',
  },
  {
    id: 'task-2',
    title: 'Prepare for DSA test',
    dueInHours: '42',
    effortHours: '4',
    importance: '5',
  },
  {
    id: 'task-3',
    title: 'React component practice',
    dueInHours: '60',
    effortHours: '2',
    importance: '3',
  },
  {
    id: 'task-4',
    title: 'Hackathon landing page polish',
    dueInHours: '30',
    effortHours: '3',
    importance: '4',
  },
]

const scenarioPresets = [
  {
    label: 'Exam Week',
    form: {
      goal: 'Survive exam week without missing submissions or revision targets.',
      availableHours: '6',
      rescueWindow: '72',
      energy: 'medium',
      notes: 'I need a rescue plan that balances revision, assignments, and fast recovery.',
    },
    tasks: [
      {
        id: 'exam-1',
        title: 'Computer Networks revision',
        dueInHours: '26',
        effortHours: '4',
        importance: '5',
      },
      {
        id: 'exam-2',
        title: 'OS lab file completion',
        dueInHours: '20',
        effortHours: '2',
        importance: '4',
      },
      {
        id: 'exam-3',
        title: 'DSA mock test',
        dueInHours: '48',
        effortHours: '3',
        importance: '5',
      },
      {
        id: 'exam-4',
        title: 'Resume update for internship form',
        dueInHours: '60',
        effortHours: '1',
        importance: '3',
      },
    ],
  },
  {
    label: 'Submission Crunch',
    form: {
      goal: 'Rescue a packed deadline week and avoid last-day collapse.',
      availableHours: '4',
      rescueWindow: '24',
      energy: 'low',
      notes: 'I have little time, low energy, and I need the fastest safe rescue strategy.',
    },
    tasks: [
      {
        id: 'crunch-1',
        title: 'Finalize hackathon demo flow',
        dueInHours: '10',
        effortHours: '3',
        importance: '5',
      },
      {
        id: 'crunch-2',
        title: 'Deploy updated build',
        dueInHours: '8',
        effortHours: '1',
        importance: '5',
      },
      {
        id: 'crunch-3',
        title: 'Write README and project doc',
        dueInHours: '12',
        effortHours: '2',
        importance: '4',
      },
      {
        id: 'crunch-4',
        title: 'Record 60-second demo video',
        dueInHours: '18',
        effortHours: '2',
        importance: '4',
      },
    ],
  },
]

function createTask() {
  return {
    id: globalThis.crypto?.randomUUID?.() ?? `task-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    title: '',
    dueInHours: '24',
    effortHours: '2',
    importance: '3',
  }
}

function parseNumber(value, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

function riskBand(score) {
  if (score >= 78) return 'High'
  if (score >= 56) return 'Medium'
  return 'Low'
}

function urgencyLabel(hours) {
  if (hours <= 12) return 'Immediate'
  if (hours <= 24) return 'Today'
  if (hours <= 48) return 'Very soon'
  if (hours <= 72) return 'This week'
  return 'Stable'
}

function scoreTask(task, availableHours, rescueWindowHours) {
  const dueInHours = clamp(parseNumber(task.dueInHours, 24), 1, 999)
  const effortHours = clamp(parseNumber(task.effortHours, 1), 0.5, 24)
  const importance = clamp(parseNumber(task.importance, 3), 1, 5)
  const urgencyScore =
    dueInHours <= 12 ? 42 : dueInHours <= 24 ? 34 : dueInHours <= 48 ? 26 : dueInHours <= 72 ? 18 : 10
  const importanceScore = importance * 10
  const effortPressure = clamp(Math.round((effortHours / dueInHours) * 160), 4, 24)
  const capacityPressure = effortHours > availableHours ? 10 : 0
  const windowPressure = dueInHours <= rescueWindowHours ? 8 : 2
  const score = clamp(
    urgencyScore + importanceScore + effortPressure + capacityPressure + windowPressure,
    18,
    98,
  )

  const why =
    dueInHours <= effortHours * 3
      ? 'The effort required is too close to the time remaining.'
      : importance >= 4
        ? 'This has strong academic impact and should not slip.'
        : 'This is still worth doing, but it can wait behind urgent work.'

  const nextStep =
    dueInHours <= 12
      ? `Start a focused ${Math.min(90, effortHours * 30)} minute block immediately.`
      : dueInHours <= 24
        ? 'Finish the first meaningful chunk today, not later tonight.'
        : 'Reserve a protected block before smaller tasks eat the schedule.'

  return {
    ...task,
    cleanTitle: task.title.trim() || 'Untitled task',
    dueInHours,
    effortHours,
    importance,
    score,
    band: riskBand(score),
    urgency: urgencyLabel(dueInHours),
    why,
    nextStep,
  }
}

function buildTimeline(priorities, availableHours, energy) {
  const energyFactor = energy === 'high' ? 1.15 : energy === 'low' ? 0.82 : 1
  let remainingMinutes = Math.round(availableHours * energyFactor * 60)
  const blocks = []

  for (const [index, task] of priorities.entries()) {
    if (remainingMinutes <= 25 || blocks.length === 4) {
      break
    }

    const desired = clamp(Math.round(task.effortHours * 45), 35, 95)
    const duration = clamp(Math.min(desired, remainingMinutes), 30, 95)
    remainingMinutes -= duration

    blocks.push({
      block: `Block 0${index + 1}`,
      duration: `${duration} min`,
      task: task.cleanTitle,
      outcome:
        index === 0
          ? 'Remove the biggest immediate risk first.'
          : index === 1
            ? 'Lock the next deadline before context-switching.'
            : 'Use this block to prevent tomorrow from becoming panic time.',
    })
  }

  if (!blocks.length) {
    blocks.push({
      block: 'Block 01',
      duration: '45 min',
      task: 'Emergency focus reset',
      outcome: 'Pick one urgent task and create momentum before anything else.',
    })
  }

  return blocks
}

function buildFallbackPlan(form, tasks) {
  const activeTasks = tasks.filter((task) => task.title.trim())
  const safeTasks = activeTasks.length ? activeTasks : initialTasks
  const availableHours = clamp(parseNumber(form.availableHours, 4), 1, 16)
  const rescueWindowHours = clamp(parseNumber(form.rescueWindow, 72), 24, 168)
  const scored = safeTasks
    .map((task) => scoreTask(task, availableHours, rescueWindowHours))
    .sort((left, right) => right.score - left.score)

  const totalEffort = scored.reduce((sum, task) => sum + task.effortHours, 0)
  const energyFactor = form.energy === 'high' ? 1.15 : form.energy === 'low' ? 0.82 : 1
  const windowCapacity = availableHours * energyFactor * (rescueWindowHours / 24)
  const overloadIndex = Math.round(clamp((totalEffort / Math.max(windowCapacity, 1)) * 100, 18, 100))
  const atRiskTasks = scored.filter((task) => task.band !== 'Low')
  const rescueConfidence = clamp(92 - atRiskTasks.length * 12 - Math.max(0, overloadIndex - 70), 24, 90)
  const planFocus =
    overloadIndex >= 86 || rescueWindowHours === 24
      ? 'Last-minute mode'
      : atRiskTasks.length >= 2
        ? 'Recovery mode'
        : 'Steady mode'

  const priorities = scored.slice(0, 4).map((task) => ({
    title: task.cleanTitle,
    score: task.score,
    risk: task.band,
    urgency: task.urgency,
    why: task.why,
    nextStep: task.nextStep,
  }))

  const timeline = buildTimeline(scored.slice(0, 4), availableHours, form.energy)
  const risks = scored.slice(0, 3).map((task) => ({
    title: task.cleanTitle,
    severity: task.band,
    warning:
      task.band === 'High'
        ? 'If this slips, the rest of the schedule becomes harder to recover.'
        : 'This can still become urgent if smaller tasks keep interrupting you.',
    fix: task.nextStep,
  }))

  const taskContext = scored
    .map(
      (task) =>
        `${task.cleanTitle}: due in ${task.dueInHours}h, effort ${task.effortHours}h, importance ${task.importance}/5`,
    )
    .join('\n')

  return {
    headline:
      planFocus === 'Last-minute mode'
        ? 'You need a rescue plan, not a bigger to-do list.'
        : 'You can still recover this week if you protect the right work first.',
    summary: `Smart Student Copilot reframes ${form.goal.toLowerCase()} into a focused recovery workflow: identify the hardest deadline pressure, schedule a realistic first block, and remove low-value context switching.`,
    rescueMode: planFocus,
    metrics: [
      {
        label: 'Overload Index',
        value: `${overloadIndex}%`,
        note: 'Compares planned effort against realistic time capacity.',
      },
      {
        label: 'At-Risk Tasks',
        value: `${atRiskTasks.length}`,
        note: 'These need action before they turn into missed deadlines.',
      },
      {
        label: 'Rescue Confidence',
        value: `${rescueConfidence}%`,
        note: 'Higher when the plan stays narrow and urgent tasks move first.',
      },
      {
        label: 'Today Capacity',
        value: `${Math.round(availableHours * energyFactor * 10) / 10}h`,
        note: 'Adjusted for your current energy so the plan stays believable.',
      },
    ],
    priorities,
    timeline,
    risks,
    coachTips: [
      'Finish one urgent block before opening new tabs or starting smaller “easy” work.',
      'Use the second block to reduce tomorrow risk, not to perfect something already good enough.',
      'If a task is low importance and high effort, postpone it before it steals rescue time.',
    ],
    pitchLine:
      'An AI last-minute recovery system that turns overloaded student deadlines into a priority queue, rescue schedule, and risk-aware next steps.',
    demoScript: [
      'The student enters all pending work, time left, and current energy.',
      'Smart Student Copilot scores what is truly dangerous instead of treating every task equally.',
      'The result is a believable rescue plan the student can follow today.',
    ],
    promptPack: [
      `You are Smart Student Copilot, an AI last-minute recovery coach for students.\nGoal: ${form.goal}\nAvailable hours today: ${availableHours}\nRescue window: ${rescueWindowHours} hours\nEnergy: ${form.energy}\nTasks:\n${taskContext}\n\nReturn the top priorities, what to start first, and what can safely wait.`,
      `Compress the current study workload into a realistic rescue schedule. Keep the tone direct, calm, and practical. Notes: ${form.notes}`,
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

  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')

  if (start !== -1 && end !== -1 && end > start) {
    return raw.slice(start, end + 1)
  }

  throw new Error('No JSON response found')
}

async function generateGeminiPlan(form, tasks) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY
  const model = import.meta.env.VITE_GEMINI_MODEL || 'gemini-3.5-flash'
  const ai = new GoogleGenAI({ apiKey })

  const safeTasks = tasks.filter((task) => task.title.trim())
  const taskContext = (safeTasks.length ? safeTasks : initialTasks)
    .map(
      (task) =>
        `- ${task.title || 'Untitled'} | due in ${task.dueInHours} hours | effort ${task.effortHours} hours | importance ${task.importance}/5`,
    )
    .join('\n')

  const prompt = `
You are Smart Student Copilot, an AI last-minute recovery system for students.
Return only valid JSON.

The product is built for Vibe2Ship Problem Statement 1: "The Last-Minute Life Saver."
The response must feel practical, calm, and demo-ready.
Do not give a generic motivational answer.

JSON shape:
{
  "headline": string,
  "summary": string,
  "rescueMode": string,
  "metrics": [
    { "label": string, "value": string, "note": string },
    { "label": string, "value": string, "note": string },
    { "label": string, "value": string, "note": string },
    { "label": string, "value": string, "note": string }
  ],
  "priorities": [
    { "title": string, "score": number, "risk": "High" | "Medium" | "Low", "urgency": string, "why": string, "nextStep": string }
  ],
  "timeline": [
    { "block": string, "duration": string, "task": string, "outcome": string }
  ],
  "risks": [
    { "title": string, "severity": "High" | "Medium" | "Low", "warning": string, "fix": string }
  ],
  "coachTips": [string, string, string],
  "pitchLine": string,
  "demoScript": [string, string, string],
  "promptPack": [string, string]
}

Student context:
- Name: ${form.studentName}
- Goal: ${form.goal}
- Available hours today: ${form.availableHours}
- Rescue window: ${form.rescueWindow} hours
- Energy: ${form.energy}
- Notes: ${form.notes}

Tasks:
${taskContext}

Requirements:
- Keep the output realistic for a second-year CS student.
- Focus on priority order, immediate next steps, and deadline risk.
- Make it obvious why this project is more useful than a normal to-do list.
- Keep the plan tight enough to demo in under a minute.
`.trim()

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
    },
  })

  return JSON.parse(extractJson(response.text))
}

function setTilt(event) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return
  }

  const target = event.currentTarget
  const bounds = target.getBoundingClientRect()
  const rotateX = ((event.clientY - bounds.top) / bounds.height - 0.5) * -9
  const rotateY = ((event.clientX - bounds.left) / bounds.width - 0.5) * 10
  target.style.setProperty('--card-rotate-x', `${rotateX.toFixed(2)}deg`)
  target.style.setProperty('--card-rotate-y', `${rotateY.toFixed(2)}deg`)
}

function resetTilt(event) {
  const target = event.currentTarget
  target.style.setProperty('--card-rotate-x', '0deg')
  target.style.setProperty('--card-rotate-y', '0deg')
}

function revealClass(direction) {
  return `reveal-item reveal-${direction}`
}

function splitTextFragments(text, groupSize = 3) {
  const words = text.trim().split(/\s+/)
  const fragments = []

  for (let index = 0; index < words.length; index += groupSize) {
    fragments.push(words.slice(index, index + groupSize).join(' '))
  }

  return fragments
}

function ScatterText({
  as: Tag = 'p',
  className = '',
  groupSize = 3,
  text,
}) {
  const directions = ['top-left', 'top-right', 'bottom-left', 'bottom-right']
  const fragments = splitTextFragments(text, groupSize)

  return (
    <Tag className={`scatter-text reveal-item ${className}`.trim()} data-reveal>
      {fragments.map((fragment, index) => (
        <span
          className={`scatter-fragment reveal-corner-${directions[index % directions.length]}`}
          key={`${fragment}-${index}`}
          style={{ transitionDelay: `${index * 90}ms` }}
        >
          {fragment}
        </span>
      ))}
    </Tag>
  )
}

function App() {
  const [form, setForm] = useState(initialForm)
  const [tasks, setTasks] = useState(initialTasks)
  const [plan, setPlan] = useState(() => buildFallbackPlan(initialForm, initialTasks))
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const [scrollProgress, setScrollProgress] = useState(0)

  const deferredPlan = useDeferredValue(plan)
  const deferredScrollProgress = useDeferredValue(scrollProgress)
  const aiMode = import.meta.env.VITE_GEMINI_API_KEY ? 'Gemini connected' : 'Demo scoring mode'

  const taskCount = useMemo(
    () => tasks.filter((task) => task.title.trim()).length,
    [tasks],
  )

  const taskTotals = useMemo(
    () =>
      tasks.reduce(
        (summary, task) => ({
          effort: summary.effort + parseNumber(task.effortHours, 0),
          urgent: summary.urgent + (parseNumber(task.dueInHours, 999) <= 24 ? 1 : 0),
        }),
        { effort: 0, urgent: 0 },
      ),
    [tasks],
  )

  const studentMood = useMemo(() => {
    if (deferredScrollProgress < 0.34) {
      return {
        label: 'Pressure Peak',
        detail: 'Too many deadlines, too much noise, and no clear first move yet.',
      }
    }

    if (deferredScrollProgress < 0.68) {
      return {
        label: 'Recovery Shift',
        detail: 'The student is still under pressure, but the rescue plan is creating order.',
      }
    }

    return {
      label: 'Calm Control',
      detail: 'The pressure clears because the work is finally organized into action.',
    }
  }, [deferredScrollProgress])

  const syncStoryProgress = useEffectEvent(() => {
    const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1)
    const nextProgress = Math.min(window.scrollY / maxScroll, 1)

    setScrollProgress((current) =>
      Math.abs(current - nextProgress) > 0.008 ? nextProgress : current,
    )
  })

  useEffect(() => {
    let frameId = 0

    const scheduleSync = () => {
      if (frameId) {
        return
      }

      frameId = window.requestAnimationFrame(() => {
        frameId = 0
        syncStoryProgress()
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
    const nodes = Array.from(document.querySelectorAll('[data-reveal]'))

    if (!nodes.length) {
      return undefined
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) {
            continue
          }

          entry.target.classList.add('reveal-visible')
          observer.unobserve(entry.target)
        }
      },
      {
        threshold: 0.14,
        rootMargin: '0px 0px -10% 0px',
      },
    )

    for (const node of nodes) {
      observer.observe(node)
    }

    return () => {
      observer.disconnect()
    }
  }, [])

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function updateTask(id, field, value) {
    setTasks((current) =>
      current.map((task) => (task.id === id ? { ...task, [field]: value } : task)),
    )
  }

  function addTask() {
    setTasks((current) => [...current, createTask()])
  }

  function removeTask(id) {
    setTasks((current) => (current.length > 1 ? current.filter((task) => task.id !== id) : current))
  }

  function loadScenario(preset) {
    startTransition(() => {
      setForm((current) => ({
        ...current,
        ...preset.form,
      }))
      setTasks(preset.tasks)
      setPlan(buildFallbackPlan({ ...form, ...preset.form }, preset.tasks))
    })
  }

  async function handleGenerate(event) {
    event.preventDefault()
    setStatus('loading')
    setError('')

    try {
      const nextPlan = import.meta.env.VITE_GEMINI_API_KEY
        ? await generateGeminiPlan(form, tasks)
        : buildFallbackPlan(form, tasks)

      startTransition(() => {
        setPlan(nextPlan)
        setStatus('done')
      })
    } catch (err) {
      setPlan(buildFallbackPlan(form, tasks))
      setStatus('done')
      setError(
        err instanceof Error
          ? `${err.message}. Showing the built-in rescue engine instead.`
          : 'Gemini generation failed. Showing the built-in rescue engine instead.',
      )
    }
  }

  return (
    <div
      className="app-shell"
      style={{ '--story-progress': deferredScrollProgress.toFixed(4) }}
    >
      <div className="ambient ambient-a" />
      <div className="ambient ambient-b" />
      <div className="readability-wash" aria-hidden="true" />

      <header className="hero-panel">
        <div className="hero-noise" />
        <div className="hero-beam hero-beam-a" />
        <div className="hero-beam hero-beam-b" />
        <div className="hero-gridline hero-gridline-a" />
        <div className="hero-gridline hero-gridline-b" />
        <div className="student-storybackdrop" aria-hidden="true">
          <div className="story-word word-pressure">OVERLOAD</div>
          <div className="story-word word-relief">RELIEF</div>

          <div className="student-pressure-cloud">
            <div className="pressure-note pressure-note-a">5 deadlines</div>
            <div className="pressure-note pressure-note-b">No time left</div>
            <div className="pressure-note pressure-note-c">Exam week</div>
            <div className="pressure-note pressure-note-d">Submission panic</div>
          </div>

          <div className="nobita-story">
            <div className="nobita-aura nobita-aura-sleep" />
            <div className="nobita-aura nobita-aura-study" />
            <div className="nobita-scene nobita-scene-sleep" />
            <div className="nobita-scene nobita-scene-transition" />
            <div className="nobita-scene nobita-scene-study" />
            <div className="nobita-progress-line">
              <span />
            </div>
            <div className="student-success-orb">
              <span>Study mode</span>
            </div>
          </div>
        </div>

        <div className="hero-copy">
          <div className={`hero-badges ${revealClass('left')}`} data-reveal>
            <span className="chip chip-primary">Vibe2Ship Statement 1</span>
            <span className="chip">{aiMode}</span>
          </div>

          <p className={`eyebrow ${revealClass('up')}`} data-reveal>
            Smart Student Copilot
          </p>
          <ScatterText
            as="h1"
            className="hero-title"
            groupSize={2}
            text="An AI last-minute recovery system for overloaded students."
          />
          <div className={`hero-signal-bar ${revealClass('left')}`} data-reveal>
            <span>Chaos</span>
            <span>Scoring</span>
            <span>Rescue Engine</span>
            <span>Action Plan</span>
          </div>
          <div className={`mood-caption ${revealClass('up')}`} data-reveal>
            <span>{studentMood.label}</span>
            <p>{studentMood.detail}</p>
          </div>
          <ScatterText
            className="hero-text"
            groupSize={4}
            text="This is the final product direction: students dump pending work, available time, and current pressure into one place. Smart Student Copilot then turns that overload into a priority queue, rescue schedule, and risk-aware next steps."
          />

          <div className={`hero-actions ${revealClass('left')}`} data-reveal>
            <a className="button button-primary" href="#mission">
              Build Rescue Plan
            </a>
            <a className="button button-secondary" href="#results">
              See Output
            </a>
          </div>

          <div className={`hero-metrics ${revealClass('up')}`} data-reveal>
            {deferredPlan.metrics.map((metric) => (
              <article className="metric-card" key={metric.label}>
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
                <p>{metric.note}</p>
              </article>
            ))}
          </div>
        </div>

        <article
          className={`hero-stage cinematic-card ${revealClass('right')}`}
          data-reveal
          onMouseMove={setTilt}
          onMouseLeave={resetTilt}
        >
          <div className="stage-shell">
            <div className="stage-copy-wrap">
              <p className="eyebrow">Judge Hook</p>
              <ScatterText as="h2" className="stage-title" groupSize={3} text={deferredPlan.pitchLine} />
              <ScatterText
                className="stage-copy"
                groupSize={4}
                text="The core win is not another planner. It is a rescue workflow that decides what is actually dangerous, what to start now, and what can wait."
              />
            </div>

            <div className="stage-scene">
              <div className="scene-layer scene-layer-back" />
              <div className="scene-layer scene-layer-mid" />
              <div className="scene-platform" />
              <div className="scene-orbit orbit-a" />
              <div className="scene-orbit orbit-b" />
              <div className="scene-orbit orbit-c" />
              <div className="scene-core">
                <div className="core-shell core-shell-a" />
                <div className="core-shell core-shell-b" />
                <div className="core-sphere">
                  <span>AI</span>
                  <strong>Rescue Engine</strong>
                </div>
              </div>

              <article className="scene-float scene-float-a">
                <span className="stage-label">Mission mode</span>
                <strong>{deferredPlan.rescueMode}</strong>
                <p>Live system decides what is slipping first.</p>
              </article>

              {deferredPlan.priorities.slice(0, 2).map((item, index) => (
                <article className={`scene-float scene-float-priority scene-float-priority-${index + 1}`} key={item.title}>
                  <span className="stage-label">{item.risk} risk</span>
                  <strong>{item.title}</strong>
                  <p>{item.urgency}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="stage-grid">
            <div>
              <span className="stage-label">Problem fit</span>
              <strong>The Last-Minute Life Saver</strong>
            </div>
            <div>
              <span className="stage-label">Workflow</span>
              <strong>Input → score → rescue plan</strong>
            </div>
            <div>
              <span className="stage-label">Builder fit</span>
              <strong>Solo-friendly React + Gemini</strong>
            </div>
            <div>
              <span className="stage-label">Submission goal</span>
              <strong>Simple, useful, demo-ready</strong>
            </div>
          </div>
        </article>
      </header>

      <main className="workspace">
        <section className="column column-builder" id="mission">
          <article className="panel">
            <div className={`section-head ${revealClass('left')}`} data-reveal>
              <p className="eyebrow">Mission Input</p>
              <ScatterText as="h2" groupSize={2} text="Describe the overload" />
              <ScatterText
                groupSize={4}
                text="Feed the app the real deadline pressure. The stronger the input, the more useful the rescue plan feels in a live demo."
              />
            </div>

            <form className={`planner-form ${revealClass('up')}`} data-reveal onSubmit={handleGenerate}>
              <label>
                <span>Student name</span>
                <input
                  value={form.studentName}
                  onChange={(event) => updateForm('studentName', event.target.value)}
                />
              </label>

              <label>
                <span>Recovery goal</span>
                <textarea
                  rows="3"
                  value={form.goal}
                  onChange={(event) => updateForm('goal', event.target.value)}
                />
              </label>

              <div className="field-grid">
                <label>
                  <span>Hours available today</span>
                  <input
                    type="number"
                    min="1"
                    max="16"
                    value={form.availableHours}
                    onChange={(event) => updateForm('availableHours', event.target.value)}
                  />
                </label>

                <label>
                  <span>Rescue window</span>
                  <select
                    value={form.rescueWindow}
                    onChange={(event) => updateForm('rescueWindow', event.target.value)}
                  >
                    {rescueWindows.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label>
                <span>Current energy</span>
                <div className="toggle-row" role="radiogroup" aria-label="Current energy">
                  {energyOptions.map((option) => (
                    <button
                      className={`toggle-chip${form.energy === option.value ? ' toggle-chip-active' : ''}`}
                      key={option.value}
                      onClick={(event) => {
                        event.preventDefault()
                        updateForm('energy', option.value)
                      }}
                      type="button"
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </label>

              <label>
                <span>Notes for the copilot</span>
                <textarea
                  rows="3"
                  value={form.notes}
                  onChange={(event) => updateForm('notes', event.target.value)}
                />
              </label>

              <div className="preset-row">
                <span>Quick demo setups</span>
                <div className="preset-actions">
                  {scenarioPresets.map((preset) => (
                    <button
                      className="button button-ghost"
                      key={preset.label}
                      onClick={() => loadScenario(preset)}
                      type="button"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-footer">
                <p>
                  {aiMode === 'Gemini connected'
                    ? 'Gemini is active. The output can become a live AI planning moment in the demo.'
                    : 'Demo scoring mode is active. Add VITE_GEMINI_API_KEY to switch to Gemini-backed planning.'}
                </p>
                <button className="button button-primary" disabled={status === 'loading'} type="submit">
                  {status === 'loading' ? 'Building rescue plan...' : 'Generate Rescue Plan'}
                </button>
              </div>
            </form>

            {error ? <p className="notice">{error}</p> : null}
          </article>

          <article className="panel">
            <div className={`section-head compact-head ${revealClass('right')}`} data-reveal>
              <div>
                <p className="eyebrow">Task Pressure</p>
                <ScatterText as="h2" groupSize={2} text="Capture the real deadlines" />
              </div>
              <button className="button button-secondary" onClick={addTask} type="button">
                Add task
              </button>
            </div>

            <div className={`task-overview ${revealClass('up')}`} data-reveal>
              <div className="overview-pill">
                <span>Tasks</span>
                <strong>{taskCount}</strong>
              </div>
              <div className="overview-pill">
                <span>Total effort</span>
                <strong>{taskTotals.effort}h</strong>
              </div>
              <div className="overview-pill">
                <span>Due in 24h</span>
                <strong>{taskTotals.urgent}</strong>
              </div>
            </div>

            <div className="task-stack">
              {tasks.map((task, index) => (
                <article
                  className={`task-card ${revealClass(index % 2 === 0 ? 'left' : 'right')}`}
                  data-reveal
                  key={task.id}
                >
                  <div className="task-card-head">
                    <p>Task {index + 1}</p>
                    <button
                      aria-label={`Remove task ${index + 1}`}
                      className="icon-button"
                      onClick={() => removeTask(task.id)}
                      type="button"
                    >
                      Remove
                    </button>
                  </div>

                  <label>
                    <span>Task title</span>
                    <input
                      value={task.title}
                      onChange={(event) => updateTask(task.id, 'title', event.target.value)}
                      placeholder="Ex: Finish OS assignment"
                    />
                  </label>

                  <div className="field-grid three-up">
                    <label>
                      <span>Due in hours</span>
                      <input
                        type="number"
                        min="1"
                        value={task.dueInHours}
                        onChange={(event) => updateTask(task.id, 'dueInHours', event.target.value)}
                      />
                    </label>

                    <label>
                      <span>Effort hours</span>
                      <input
                        type="number"
                        min="1"
                        value={task.effortHours}
                        onChange={(event) => updateTask(task.id, 'effortHours', event.target.value)}
                      />
                    </label>

                    <label>
                      <span>Importance</span>
                      <select
                        value={task.importance}
                        onChange={(event) => updateTask(task.id, 'importance', event.target.value)}
                      >
                        <option value="1">1 - Low</option>
                        <option value="2">2</option>
                        <option value="3">3 - Medium</option>
                        <option value="4">4</option>
                        <option value="5">5 - Critical</option>
                      </select>
                    </label>
                  </div>
                </article>
              ))}
            </div>
          </article>

        </section>

        <section className="column column-results" id="results">
          <article className={`panel panel-highlight ${revealClass('up')}`} data-reveal>
            <div className="section-head">
              <p className="eyebrow">Rescue Output</p>
              <ScatterText as="h2" groupSize={3} text={deferredPlan.headline} />
              <ScatterText groupSize={4} text={deferredPlan.summary} />
            </div>

            <div className="mode-banner">
              <span className="chip chip-primary">{deferredPlan.rescueMode}</span>
              <p>{deferredPlan.pitchLine}</p>
            </div>
          </article>

          <div className={`metric-grid ${revealClass('up')}`} data-reveal>
            {deferredPlan.metrics.map((metric) => (
              <article className="panel metric-panel" key={metric.label}>
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
                <p>{metric.note}</p>
              </article>
            ))}
          </div>

          <article className="panel">
            <div className={`section-head compact-head ${revealClass('left')}`} data-reveal>
              <div>
                <p className="eyebrow">Priority Queue</p>
                <ScatterText as="h2" groupSize={2} text="What to attack first" />
              </div>
            </div>

            <div className="priority-list">
              {deferredPlan.priorities.map((item, index) => (
                <article
                  className={`priority-card cinematic-card ${revealClass(index % 2 === 0 ? 'left' : 'right')}`}
                  data-reveal
                  key={item.title}
                  onMouseMove={setTilt}
                  onMouseLeave={resetTilt}
                >
                  <div className="priority-head">
                    <div>
                      <p>{item.urgency}</p>
                      <h3>{item.title}</h3>
                    </div>
                    <div className={`risk-pill risk-${item.risk.toLowerCase()}`}>
                      {item.risk} • {item.score}
                    </div>
                  </div>
                  <p>{item.why}</p>
                  <strong>{item.nextStep}</strong>
                </article>
              ))}
            </div>
          </article>

          <article className="panel">
            <div className={`section-head ${revealClass('right')}`} data-reveal>
              <p className="eyebrow">Daily Rescue Plan</p>
              <ScatterText as="h2" groupSize={2} text="What today should look like" />
            </div>

            <div className="timeline">
              {deferredPlan.timeline.map((block) => (
                <div className={`timeline-row ${revealClass('up')}`} data-reveal key={block.block}>
                  <div className="timeline-tag">
                    <span>{block.block}</span>
                    <strong>{block.duration}</strong>
                  </div>
                  <div className="timeline-copy">
                    <h3>{block.task}</h3>
                    <p>{block.outcome}</p>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="panel">
            <div className={`section-head ${revealClass('left')}`} data-reveal>
              <p className="eyebrow">Risk Alerts</p>
              <ScatterText as="h2" groupSize={2} text="What could still go wrong" />
            </div>

            <div className="risk-grid">
              {deferredPlan.risks.map((risk, index) => (
                <article
                  className={`risk-card ${revealClass(index % 2 === 0 ? 'left' : 'right')}`}
                  data-reveal
                  key={risk.title}
                >
                  <div className="priority-head">
                    <h3>{risk.title}</h3>
                    <div className={`risk-pill risk-${risk.severity.toLowerCase()}`}>{risk.severity}</div>
                  </div>
                  <p>{risk.warning}</p>
                  <strong>{risk.fix}</strong>
                </article>
              ))}
            </div>
          </article>

          <article className={`panel two-column-panel ${revealClass('up')}`} data-reveal>
            <div>
              <div className="section-head">
                <p className="eyebrow">Coach Notes</p>
                <ScatterText as="h2" groupSize={2} text="Why this feels smarter than a to-do app" />
              </div>

              <ul className="checklist">
                {deferredPlan.coachTips.map((tip) => (
                  <li key={tip}>{tip}</li>
                ))}
              </ul>
            </div>

            <div>
              <div className="section-head">
                <p className="eyebrow">Demo Script</p>
                <ScatterText as="h2" groupSize={2} text="How to explain it fast" />
              </div>

              <ol className="script-list">
                {deferredPlan.demoScript.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ol>
            </div>
          </article>

        </section>
      </main>
    </div>
  )
}

export default App
