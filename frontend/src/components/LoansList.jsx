import React, { useEffect, useState } from 'react'
import { fetchLoans } from '../api'

export default function LoansList({ onSelect }) {
  const [loans, setLoans] = useState([])

  useEffect(()=>{ fetchLoans().then(setLoans).catch(console.error) }, [])

  return (
    <div className="container">
      <h2>Open Loans</h2>
      <p style={{fontStyle:'italic', color:'#555'}}>
        This is a sealed auction: individual bids are hidden until the bidding window closes.
      </p>
      {loans.length===0 && <p>No open loans</p>}
      {loans.map(l => (
        <div key={l.id} className="loan">
          <div style={{display:'flex', justifyContent:'space-between'}}>
            <div>
              <strong>Loan #{l.onChainId}</strong>
              <div>Amount: {String(l.amount)}</div>
              <div>Duration: {l.duration} hours</div>
              <div>Credit score: {l.creditScore}</div>
            </div>
            <div>
              <button onClick={()=>onSelect(l.id)}>View</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
