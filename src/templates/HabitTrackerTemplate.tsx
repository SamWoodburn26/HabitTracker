import type { AppDataApi } from '../hooks/useAppData'

type HabitTrackerTemplateProps = {
  api: AppDataApi
}

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1)

export function HabitTrackerTemplate({ api }: HabitTrackerTemplateProps) {
  const {
    data,
    activeHabitSheet,
    toggleHabitCheck,
    setHabitMonthLabel,
    setMonthHighlights,
    setHobbyItem,
  } = api

  if (!activeHabitSheet) return null

  return (
    <div className="ht-page" data-color-target="habitTracker">
      <div className="ht-header">
        <h2 className="title">habit tracker</h2>
        <input
          className="ht-month-input"
          value={activeHabitSheet.habitMonthLabel}
          onChange={(e) => setHabitMonthLabel(e.target.value)}
          placeholder="Month / year"
          aria-label="Month"
          data-erase-field="habit-month"
        />
      </div>

      <div className="ht-grid-wrap">
        <div className="ht-grid" role="grid" aria-label="Monthly habit checks">
          <div className="ht-corner" />
          {DAYS.map((day) => (
            <div key={day} className="ht-day-head">
              {day}
            </div>
          ))}
          {data.habits.map((habit) => (
            <div key={habit.id} style={{ display: 'contents' }}>
              <div className="ht-habit-label" title={habit.label}>
                {habit.label}
              </div>
              {DAYS.map((day) => {
                const checked = Boolean(
                  activeHabitSheet.habitChecks[habit.id]?.[String(day)],
                )
                return (
                  <button
                    key={`${habit.id}-${day}`}
                    type="button"
                    className={`ht-cell${checked ? ' checked' : ''}`}
                    aria-pressed={checked}
                    aria-label={`${habit.label} day ${day}`}
                    onClick={() => toggleHabitCheck(habit.id, day)}
                  >
                    {checked ? '✓' : ''}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="ht-bottom">
        <section className="ht-hobby">
          <h3>Hobby List:</h3>
          <div className="ht-hobby-list">
            {activeHabitSheet.hobbyList.map((item, i) => (
              <label key={i}>
                <span>{i + 1}.</span>
                <input
                  value={item}
                  onChange={(e) => setHobbyItem(i, e.target.value)}
                  aria-label={`Hobby ${i + 1}`}
                  data-erase-field="hobby"
                  data-erase-index={i}
                />
              </label>
            ))}
          </div>
        </section>
        <section className="ht-highlights">
          <h3>This Months Highlights:</h3>
          <textarea
            value={activeHabitSheet.monthHighlights}
            onChange={(e) => setMonthHighlights(e.target.value)}
            placeholder="Write highlights here…"
            aria-label="Month highlights"
            data-erase-field="highlights"
          />
        </section>
      </div>
    </div>
  )
}
