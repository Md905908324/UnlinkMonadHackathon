import React, { useState } from 'react'
import { postLoan } from '../api'

export default function CreateLoan({ onCreated }) {
  const [form, setForm] = useState({ borrowerUnlink: '', onChainId: '', amount: '', duration: 7, maxRate: 0.12 })
  const [busy, setBusy] = useState(false)

  async function submit(e){
    e.preventDefault()
    setBusy(true)
    try {
      // amount as string to avoid BigInt issues
      const payload = { ...form, amount: String(form.amount), onChainId: Number(form.onChainId) }
      const res = await postLoan(payload)
      console.log('loan created', res)
      if (onCreated) onCreated(res)
    } catch (err) {
      console.error(err)
      alert('Failed to create loan')
    } finally { setBusy(false) }
  }

  return (
    <div className="container">
      <h2>Create Loan Request</h2>
      <form onSubmit={submit} className="row" style={{flexDirection:'column', gap:8}}>
        <input placeholder="borrower unlink address" value={form.borrowerUnlink} onChange={e=>setForm({...form, borrowerUnlink:e.target.value})} />
        <input placeholder="onChainId (int)" type="number" value={form.onChainId} onChange={e=>setForm({...form, onChainId:e.target.value})} />
        <input placeholder="amount (wei)" value={form.amount} onChange={e=>setForm({...form, amount:e.target.value})} />
        <input placeholder="duration (days)" type="number" value={form.duration} onChange={e=>setForm({...form, duration: Number(e.target.value)})} />
        <input placeholder="maxRate (e.g. 0.12)" type="number" step="0.0001" value={form.maxRate} onChange={e=>setForm({...form, maxRate: Number(e.target.value)})} />
        <div style={{display:'flex', gap:8}}>
          <button type="submit" disabled={busy}>Create Loan</button>
          <button type="button" onClick={()=>onCreated && onCreated(null)}>Cancel</button>
        </div>
      </form>
    </div>
  )
}
