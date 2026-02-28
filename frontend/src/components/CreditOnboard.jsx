import React, { useState } from 'react'
import { postCredit } from '../api'

export default function CreditOnboard() {
  const [form, setForm] = useState({ unlinkAddress: '', walletAddress: '', declaredIncome: 60000 })
  const [score, setScore] = useState(null)

  async function submit(e) {
    e.preventDefault()
    const res = await postCredit(form)
    setScore(res.creditScore ?? res.creditScore)
  }

  return (
    <div className="container">
      <h2>Onboard / Credit</h2>
      <form onSubmit={submit} className="row" style={{gap:8}}>
        <input placeholder="unlink address" value={form.unlinkAddress} onChange={e=>setForm({...form, unlinkAddress:e.target.value})} />
        <input placeholder="wallet address" value={form.walletAddress} onChange={e=>setForm({...form, walletAddress:e.target.value})} />
        <input type="number" value={form.declaredIncome} onChange={e=>setForm({...form, declaredIncome: Number(e.target.value)})} />
        <button type="submit">Create</button>
      </form>
      {score && <p>Credit score: <strong>{score}</strong></p>}
    </div>
  )
}
