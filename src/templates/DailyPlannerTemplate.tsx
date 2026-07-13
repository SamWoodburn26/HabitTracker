import type { AppDataApi } from '../hooks/useAppData'

type DailyPlannerTemplateProps = {
  api: AppDataApi
}

export function DailyPlannerTemplate({ api }: DailyPlannerTemplateProps) {
  const { activeDailySheet, updateDailyPlan, addDailyPlan } = api

  if (!activeDailySheet) return null

  return (
    <div className="dp-page" data-color-target="dailyPlanner">
      <h2 className="dp-title">Daily Planner</h2>
      <div className="dp-stack">
        {activeDailySheet.plans.map((plan) => (
          <article key={plan.id} className="dp-card" data-color-target="dailyPlanner">
            <input
              className="dp-date"
              value={plan.date}
              onChange={(e) => updateDailyPlan(plan.id, { date: e.target.value })}
              placeholder="Date"
              aria-label="Date"
            />
            <div className="dp-cols">
              <div>
                <h4>want to:</h4>
                <div className="dp-list">
                  {plan.wantTo.map((item, i) => (
                    <input
                      key={i}
                      value={item}
                      onChange={(e) => {
                        const wantTo = [...plan.wantTo]
                        wantTo[i] = e.target.value
                        updateDailyPlan(plan.id, { wantTo })
                      }}
                      aria-label={`Want to ${i + 1}`}
                    />
                  ))}
                </div>
              </div>
              <div>
                <h4>need to:</h4>
                <div className="dp-list">
                  {plan.needTo.map((item, i) => (
                    <input
                      key={i}
                      value={item}
                      onChange={(e) => {
                        const needTo = [...plan.needTo]
                        needTo[i] = e.target.value
                        updateDailyPlan(plan.id, { needTo })
                      }}
                      aria-label={`Need to ${i + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="dp-footer">
              <label>
                <span>todays goal:</span>
                <input
                  value={plan.goal}
                  onChange={(e) => updateDailyPlan(plan.id, { goal: e.target.value })}
                  aria-label="Today's goal"
                />
              </label>
              <label>
                <span>todays highlight:</span>
                <input
                  value={plan.highlight}
                  onChange={(e) =>
                    updateDailyPlan(plan.id, { highlight: e.target.value })
                  }
                  aria-label="Today's highlight"
                />
              </label>
            </div>
          </article>
        ))}
        <button type="button" className="add-day-btn" onClick={addDailyPlan}>
          + Add another day
        </button>
      </div>
    </div>
  )
}
