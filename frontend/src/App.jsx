import React, { useState } from 'react'
import CreditOnboard from './components/CreditOnboard'
import LoansList from './components/LoansList'
import LoanDetail from './components/LoanDetail'

export default function App(){
  const [view, setView] = useState({ name: 'list', loanId: null })

  return (
    <div>
      <header style={{padding:12, background:'#0f172a', color:'#fff'}}>
        <div style={{maxWidth:900, margin:'0 auto', display:'flex', gap:12}}>
          <h1 style={{fontSize:18}}>Unlink Loans Demo</h1>
          <div style={{marginLeft:'auto'}}>
            <button onClick={()=>setView({name:'list'})}>Marketplace</button>
            <button onClick={()=>setView({name:'onboard'})}>Onboard</button>
          </div>
        </div>
      </header>

      {view.name==='list' && <LoansList onSelect={id=>setView({name:'detail', loanId:id})} />}
      {view.name==='onboard' && <CreditOnboard />}
      {view.name==='detail' && <LoanDetail id={view.loanId} onBack={()=>setView({name:'list'})} />}
    </div>
  )
}
