import { useState, useCallback } from 'react'
import { getCollection } from '../App'
import { getDriftReadings } from '../lib/driftStorage'
import { fetchAggregates } from '../lib/driftCloud'
import { useAuth } from '../contexts/AuthContext'
import PageSeo from '../components/PageSeo'
import { usePageTitle } from '../contexts/PageTitleContext'

function getApiBase() {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL.replace(/\/$/, '')
  return ''
}

function buildContext(watches, communityByRef) {
  const drift = []
  watches.forEach((w) => {
    const readings = getDriftReadings(w.reference)
    const n = readings.length
    const specMin = w.specMin ?? -999
    const specMax = w.specMax ?? 999
    const inSpecCount = readings.filter((r) => r.driftInSeconds >= specMin && r.driftInSeconds <= specMax).length
    const mean = n > 0 ? readings.reduce((a, r) => a + r.driftInSeconds, 0) / n : null
    const inSpecPct = n > 0 ? Math.round((inSpecCount / n) * 100) : null
    const agg = communityByRef[w.reference]
    const communityMean = agg?.readingCount > 0 ? agg.sumDrift / agg.readingCount : null
    drift.push({
      reference: w.reference,
      brand: w.brand,
      model: w.model,
      n,
      mean,
      inSpecPct,
      specMin,
      specMax,
      communityMean,
    })
  })
  return {
    watches: watches.map((w) => ({
      reference: w.reference,
      brand: w.brand,
      model: w.model,
      specMin: w.specMin,
      specMax: w.specMax,
    })),
    drift,
  }
}

export default function Ask() {
  const { user } = useAuth()
  usePageTitle('Ask about your accuracy')
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const sendMessage = useCallback(async () => {
    const text = input.trim()
    if (!text || !user || loading) return
    setInput('')
    setMessages((m) => [...m, { role: 'user', content: text }])
    setLoading(true)
    try {
      const watches = getCollection()
      let byRef = {}
      try {
        const aggs = await fetchAggregates()
        aggs.forEach((a) => { byRef[a.reference] = a })
      } catch (_) {}
      const context = buildContext(watches, byRef)
      const token = await user.getIdToken()
      const base = getApiBase()
      const res = await fetch(`${base}/api/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: text, context }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 429 && data.code === 'DAILY_LIMIT') {
          throw new Error('Daily limit of 5 questions reached. Try again tomorrow.')
        }
        throw new Error(data.error || 'Request failed')
      }
      setMessages((m) => [...m, { role: 'assistant', content: data.reply || 'No reply.' }])
    } catch (e) {
      setMessages((m) => [...m, { role: 'assistant', content: `Error: ${e.message}` }])
    } finally {
      setLoading(false)
    }
  }, [input, user, loading])

  return (
    <>
      <PageSeo title="Ask" description="Ask about your watch accuracy. AI answers using your drift data and specs. 5 questions per day." />
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: 15 }}>
        Ask anything about your watches and drift data. Answers use your collection and readings. <strong>5 questions per day.</strong>
      </p>

      <div className="card" style={{ padding: '1rem', minHeight: 280 }}>
        <div className="ask-messages">
          {messages.length === 0 && (
            <p className="ask-placeholder">e.g. &quot;How is my Speedmaster doing?&quot; or &quot;Should I get my watch serviced?&quot;</p>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`ask-msg ask-msg--${msg.role}`}>
              <span className="ask-msg-label">{msg.role === 'user' ? 'You' : 'Collector IQ'}</span>
              <p className="ask-msg-text">{msg.content}</p>
            </div>
          ))}
          {loading && (
            <div className="ask-msg ask-msg--assistant">
              <span className="ask-msg-label">Collector IQ</span>
              <p className="ask-msg-text ask-msg-text--loading">…</p>
            </div>
          )}
        </div>
        <div className="ask-input-row">
          <input
            type="text"
            className="input ask-input"
            placeholder="Ask about your watches..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            disabled={loading}
          />
          <button type="button" className="btn ask-send" onClick={sendMessage} disabled={loading || !input.trim()}>
            Send
          </button>
        </div>
      </div>
    </>
  )
}
