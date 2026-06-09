const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

async function request(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Error desconocido' }))
    throw new Error(error.error || 'Error en la petición')
  }

  return res.json()
}

export function getPlans() {
  return request('/billing/plans')
}

export function getPlanPrice(planId: string, monedaDestino = 'GTQ') {
  return request('/billing/plans/price', {
    method: 'POST',
    body: JSON.stringify({
      plan_id: planId,
      moneda_destino: monedaDestino,
    }),
  })
}

export function createSubscription(planId: string, monto: number, moneda = 'USD', meses = 1) {
  return request('/billing/subscriptions', {
    method: 'POST',
    body: JSON.stringify({
      plan_id: planId,
      monto,
      moneda,
      meses,
    }),
  })
}

export function getMySubscription() {
  return request('/billing/subscriptions/me')
}

export function changeSubscription(
  nuevoPlanId: string,
  monto: number,
  moneda = 'USD',
  meses = 1
) {
  return request('/billing/subscriptions/change', {
    method: 'PUT',
    body: JSON.stringify({
      nuevo_plan_id: nuevoPlanId,
      monto,
      moneda,
      meses,
    }),
  })
}

export function cancelSubscription() {
  return request('/billing/subscriptions/cancel', {
    method: 'PUT',
  })
}