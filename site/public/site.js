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
