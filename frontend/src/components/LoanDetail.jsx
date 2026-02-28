import React, { useEffect, useState } from 'react'
import { fetchLoan, fetchBids, postBid, triggerLoan } from '../api'

export default function LoanDetail({ id, onBack }) {
  const [loan, setLoan] = useState(null)
  const [bids, setBids] = useState([])
  const [form, setForm] = useState({ lenderUnlink: '', amount: '', rate: 0.05 })
  const [paymentInfo, setPaymentInfo] = useState(null)

  useEffect(()=>{ if (!id) return; fetchLoan(id).then(setLoan).catch(console.error); fetchBids(id).then(setBids).catch(console.error) }, [id])

  async function submit(e){
    e.preventDefault()
    // send amount as string to avoid BigInt JSON issues
    const payload = { lenderUnlink: form.lenderUnlink, amount: String(form.amount), rate: form.rate }
    const res = await postBid(id, payload)
    if (res.paymentInfo) setPaymentInfo(res.paymentInfo)
    const updated = await fetchBids(id)
    setBids(updated)
  }

  async function demoTrigger(){
    await triggerLoan(id)
    const updated = await fetchLoan(id); setLoan(updated)
  }

  if (!loan) return <div className="container">Loading...</div>

  return (
    <div className="container">
      <button onClick={onBack}>Back</button>
      <h2>Loan #{loan.onChainId}</h2>
      <div>Amount: {String(loan.amount)}</div>
      <div>Duration: {loan.duration} hours</div>
      <div>Max rate: {loan.maxRate}</div>

      <h3>Bids (sealed, private)</h3>
      <p style={{fontStyle:'italic', color:'#555'}}>
        Lender identities are hidden to preserve auction privacy – bids are only
        visible after the deadline and cannot be undercut.
      </p>
      {bids.length===0 && <p>No bids yet</p>}
      {bids.map(b => {
        const hidden = new Date() < new Date(loan.deadline) && loan.status === 'OPEN';
        return (
          <div key={b.id} style={{borderBottom:'1px solid #eef2f7', padding:'8px 0'}}>
            {hidden ? (
              <div style={{fontStyle:'italic', color:'#777'}}>Bid details hidden until deadline</div>
            ) : (
              <>
                <div>Amount: {String(b.amount)}</div>
                <div>Rate: {b.rate}</div>
                <div>Status: {b.status}</div>
              </>
            )}
          </div>
        );
      })}

      <h3>Submit Bid</h3>
      <form onSubmit={submit} className="row" style={{flexDirection:'column', gap:8}}>
        <input placeholder="lender unlink" value={form.lenderUnlink} onChange={e=>setForm({...form, lenderUnlink:e.target.value})} />
        <input placeholder="amount (wei)" type="text" value={form.amount} onChange={e=>setForm({...form, amount: e.target.value})} />
        <input placeholder="rate (e.g. 0.07)" type="number" step="0.0001" value={form.rate} onChange={e=>setForm({...form, rate: Number(e.target.value)})} />
        <button type="submit">Submit Bid</button>
      </form>

      {paymentInfo && (
        <div style={{marginTop:12, padding:8, border:'1px solid #eef2f7'}}>
          <h4>Payment Instructions</h4>
          <div>Send your funds to the agent escrow address:</div>
          <pre style={{background:'#f1f5f9', padding:8, borderRadius:6}}>{paymentInfo.agentUnlinkAddress}</pre>
          <div>{paymentInfo.note}</div>
        </div>
      )}

      <div style={{marginTop:12}}>
        <button onClick={demoTrigger}>Force-expire (demo)</button>
      </div>
    </div>
  )
}
