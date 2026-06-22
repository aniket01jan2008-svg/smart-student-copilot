# Smart Student Copilot

An AI-powered study companion that turns academic chaos into clear action.

## What This Is

Smart Student Copilot is a solo hackathon project created for Vibe2Ship. It is designed to help students turn a messy workload into a more structured plan with clearer next steps, better prioritization, and a calmer daily workflow.

The app ships with two modes:

- Demo mode that works immediately without any API key
- Gemini mode that uses Google AI Studio through the current JavaScript SDK once `VITE_GEMINI_API_KEY` is configured

## Why This Repo Uses Google AI Studio

The public Vibe2Ship guidelines and event page state that participants are required to use Google AI Studio as part of their solution development process.

Official references:

- https://blockseblock.com/hackathon_details/Vibe2Ship
- https://www.codingninjas.com/landing/10x-vibe2ship/
- https://docs.google.com/document/d/1tRlULMcNthm3wAVd2MKEwosv44BqvRXIil4e359_5BM/edit?tab=t.6awy00z9xq1f

## Stack

- React
- Vite
- Google Gemini via `@google/genai`
- Plain CSS

## Local Development

```bash
npm install
npm run dev
```

## Gemini Setup

Create a `.env` file:

```bash
VITE_GEMINI_API_KEY=your_key_here
VITE_GEMINI_MODEL=gemini-3.5-flash
```

If the API key is missing, the app falls back to a built-in demo planner so the project still works in development and on first deploy.

## Deploy

```bash
npm run build
vercel
```

## Submission-Safe Summary

Smart Student Copilot is an AI-powered productivity assistant that helps students organize academic tasks, break goals into smaller steps, and plan study work more effectively using Google AI Studio.
