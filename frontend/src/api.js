const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

export async function postCredit(profile) {
  const res = await fetch(`${API}/credit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profile)
  })
  return res.json()
}

export async function fetchLoans() {
  const res = await fetch(`${API}/loans`)
  return res.json()
}

export async function fetchLoan(id) {
  const res = await fetch(`${API}/loans/${id}`)
  return res.json()
}

export async function fetchBids(id) {
  const res = await fetch(`${API}/loans/${id}/bids`)
  return res.json()
}

export async function postBid(id, bid) {
  const res = await fetch(`${API}/loans/${id}/bids`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bid)
  })
  return res.json()
}

export async function triggerLoan(id) {
  const res = await fetch(`${API}/admin/trigger/${id}`, { method: 'POST' })
  return res.json()
}

export async function postLoan(loan) {
  const res = await fetch(`${API}/loans`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(loan)
  });
  return res.json();
}
