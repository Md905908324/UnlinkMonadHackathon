import React, { useState } from 'react'
import { postLoan } from '../api'

export default function CreateLoan({ onCreated }) {
  const [form, setForm] = useState({ borrowerUnlink: '', onChainId: '', amount: '', days: 1, hours: 0, minutes: 0, maxRate: 0.12 })
  const [busy, setBusy] = useState(false)

  async function submit(e){
    e.preventDefault()
    setBusy(true)
    try {
      // amount as string to avoid BigInt issues
      const totalHours = Number(form.days) * 24 + Number(form.hours) + Math.ceil(Number(form.minutes) / 60);
      const payload = { ...form, amount: String(form.amount), onChainId: Number(form.onChainId), duration: totalHours }
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
        <label>
          Borrower Unlink Address
          <input placeholder="unlink1..." value={form.borrowerUnlink} onChange={e=>setForm({...form, borrowerUnlink:e.target.value})} />
        </label>
        <label>
          On-chain Loan ID
          <input placeholder="integer" type="number" value={form.onChainId} onChange={e=>setForm({...form, onChainId:e.target.value})} />
        </label>
        <label>
          Amount (USDC wei)
          <input placeholder="e.g. 1000000" value={form.amount} onChange={e=>setForm({...form, amount:e.target.value})} />
        </label>
        <fieldset style={{border:'1px solid #e2e8f0', padding:8, borderRadius:6}}>
          <legend>Bidding window</legend>
          <label>
            Days
            <input type="number" min="0" value={form.days} onChange={e=>setForm({...form, days: Number(e.target.value)})} />
          </label>
          <label>
            Hours
            <input type="number" min="0" max="23" value={form.hours} onChange={e=>setForm({...form, hours: Number(e.target.value)})} />
          </label>
          <label>
            Minutes
            <input type="number" min="0" max="59" value={form.minutes} onChange={e=>setForm({...form, minutes: Number(e.target.value)})} />
          </label>
        </fieldset>
        <label>
          Max interest rate (e.g. 0.12)
          <input placeholder="0.12" type="number" step="0.0001" value={form.maxRate} onChange={e=>setForm({...form, maxRate: Number(e.target.value)})} />
        </label>
        <div style={{display:'flex', gap:8}}>
          <button type="submit" disabled={busy}>Create Loan</button>
          <button type="button" onClick={()=>onCreated && onCreated(null)}>Cancel</button>
        </div>
      </form>
    </div>
  )
}
