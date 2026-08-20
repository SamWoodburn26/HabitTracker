import type { AppDataApi } from '../hooks/useAppData'

type GratitudeTemplateProps = {
  api: AppDataApi
}

export function GratitudeTemplate({ api }: GratitudeTemplateProps) {
  const { activeGratitudeSheet, updateGratitude } = api

  if (!activeGratitudeSheet) return null

  return (
    <div className="grat-page">
      <h2 className="grat-title" data-color-target="gratitudeTitle">
        Gratitude
      </h2>
      <div className="grat-grid" data-color-target="gratitudeAccent">
        {activeGratitudeSheet.entries.map((entry) => (
          <div key={entry.id} className="grat-box">
            <div className="grat-date-row">
              <span>* date *</span>
              <input
                value={entry.date}
                onChange={(e) => updateGratitude(entry.id, { date: e.target.value })}
                placeholder="…"
                aria-label="Date"
                data-erase-field="grat-date"
                data-erase-entry={entry.id}
              />
            </div>
            <div className="grat-prompt">i am grateful for…</div>
            {entry.items.map((item, idx) => (
              <div key={idx} className="grat-item">
                <span>{idx + 1}-</span>
                <input
                  value={item}
                  onChange={(e) => {
                    const items = [...entry.items] as [string, string, string]
                    items[idx] = e.target.value
                    updateGratitude(entry.id, { items })
                  }}
                  aria-label={`Grateful item ${idx + 1}`}
                  data-erase-field="grat-item"
                  data-erase-entry={entry.id}
                  data-erase-index={idx}
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
