// Copy buttons for the install commands. Everything else on the page works without JavaScript.
for (const button of document.querySelectorAll('[data-copy]')) {
  button.addEventListener('click', async () => {
    const target = document.getElementById(button.dataset.copy)
    if (!target || !navigator.clipboard) return
    try {
      await navigator.clipboard.writeText(target.innerText.replace(/^\s*[$>]\s*/gm, '').trim())
      const label = button.textContent
      button.textContent = 'Copied'
      setTimeout(() => { button.textContent = label }, 1600)
    } catch {
      button.textContent = 'Press Ctrl/Cmd+C'
    }
  })
}

// The live board: the public leaderboard of the DeskFit API, read when the section comes into view.
const board = document.querySelector('[data-board]')

if (board) {
  const api = board.dataset.api
  const rows = board.querySelector('[data-rows]')
  const note = board.querySelector('[data-note]')
  const tabs = [...board.querySelectorAll('[data-period]')]
  let period = 'week'
  let isLoaded = false

  const row = r => {
    const li = document.createElement('li')
    const parts = [
      ['rank', String(Number(r.rank) || '')],
      ['name', String(r.nickname ?? '')],
      ['pts', `${Number(r.points) || 0} pts`],
      ['sets', `${Number(r.sets) || 0} ${Number(r.sets) === 1 ? 'set' : 'sets'}`],
    ]

    for (const [cls, text] of parts) {
      const span = document.createElement('span')

      span.className = cls
      span.textContent = text // text only: a nickname never becomes markup
      li.append(span)
    }

    return li
  }

  const load = async () => {
    isLoaded = true
    note.textContent = 'Loading the board…'

    try {
      const res = await fetch(`${api}/v1/leaderboard?period=${period}&limit=10`, { headers: { accept: 'application/json' } })

      if (!res.ok) throw new Error(String(res.status))

      const data = await res.json()
      const list = Array.isArray(data.rows) ? data.rows.slice(0, 10) : []

      rows.replaceChildren(...list.map(row))
      note.textContent = list.length === 0 ? 'No one has scored in this period yet. Be the first.' : ''
    } catch {
      rows.replaceChildren()
      note.textContent = 'The board is not reachable right now. Try again in a moment.'
    }
  }

  for (const tab of tabs) {
    tab.addEventListener('click', () => {
      period = tab.dataset.period
      for (const t of tabs) t.setAttribute('aria-pressed', String(t === tab))
      void load()
    })
  }

  board.querySelector('[data-refresh]')?.addEventListener('click', () => void load())

  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries, observer) => {
      if (entries.some(e => e.isIntersecting) && !isLoaded) {
        observer.disconnect()
        void load()
      }
    }, { rootMargin: '200px' }).observe(board)
  } else {
    void load()
  }
}
