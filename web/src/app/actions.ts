'use server'

export type ContactState = {status: 'idle' | 'success' | 'error'; message?: string}

// Sends enquiries through Web3Forms (free tier, delivers to the inbox the access key was created with).
export async function sendEnquiry(_prev: ContactState, formData: FormData): Promise<ContactState> {
  // Honeypot: real people never fill this hidden field
  if (formData.get('company_website')) return {status: 'success'}

  const name = String(formData.get('name') ?? '').trim()
  const email = String(formData.get('email') ?? '').trim()
  const message = String(formData.get('message') ?? '').trim()
  const company = String(formData.get('company') ?? '').trim()
  const budget = String(formData.get('budget') ?? '').trim()

  if (!name || !email || !message) {
    return {status: 'error', message: 'Please fill in your name, email and a short message.'}
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return {status: 'error', message: 'That email address doesn’t look quite right.'}
  }

  const accessKey = process.env.WEB3FORMS_ACCESS_KEY
  if (!accessKey) {
    return {status: 'error', message: 'The contact form isn’t set up yet. Please email or WhatsApp me instead.'}
  }

  try {
    const res = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: {'Content-Type': 'application/json', Accept: 'application/json'},
      body: JSON.stringify({
        access_key: accessKey,
        subject: `New enquiry from ${name}${company ? ` (${company})` : ''}`,
        from_name: 'Portfolio site',
        replyto: email,
        name,
        email,
        company,
        budget,
        message,
      }),
    })
    const data = (await res.json()) as {success?: boolean; message?: string}
    if (!res.ok || !data.success) throw new Error(data.message || `HTTP ${res.status}`)
    return {status: 'success'}
  } catch (err) {
    console.error('Contact form failed', err)
    return {status: 'error', message: 'Something went wrong sending that. Please email or WhatsApp me instead.'}
  }
}
