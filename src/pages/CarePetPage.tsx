import {
  CHECKS_PER_EVOLUTION,
  TOTAL_EVOLUTIONS,
} from '../lib/petProgress'
import { PetPlaceholder } from '../components/PetPlaceholder'
import { TopBar } from '../components/TopBar'
import type { AppDataApi } from '../hooks/useAppData'

type CarePetPageProps = {
  api: AppDataApi
  onBack: () => void
}

export function CarePetPage({ api, onBack }: CarePetPageProps) {
  const { pet, data } = api
  const checksToNext =
    pet.nextThreshold !== null ? pet.nextThreshold - pet.totalChecks : 0

  return (
    <div>
      <TopBar title="My Care Pet" onBack={onBack} />
      <div className="pet-page">
        <PetPlaceholder evolution={pet.evolution} />
        <p className="pet-evo-badge">
          Evolution {pet.evolution} / {TOTAL_EVOLUTIONS}
        </p>
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '2.2rem',
            margin: '0 0 4px',
          }}
        >
          {pet.phaseLabel}
        </h2>
        <p className="muted" style={{ marginTop: 0 }}>
          Every {CHECKS_PER_EVOLUTION} habit checks unlocks the next evolution
          (75 total). Watch the egg crack, hatch, and grow!
        </p>
        <div className="pet-stats">
          <div className="pet-stat">
            <div className="value">{data.coins}</div>
            <div className="label">Coins</div>
          </div>
          <div className="pet-stat">
            <div className="value">{pet.totalChecks}</div>
            <div className="label">Habits done</div>
          </div>
          <div className="pet-stat">
            <div className="value">{pet.evolution}</div>
            <div className="label">Evolution</div>
          </div>
        </div>
        {pet.nextThreshold !== null ? (
          <>
            <p className="muted" style={{ fontSize: '0.9rem' }}>
              {checksToNext} more check{checksToNext === 1 ? '' : 's'} until
              evolution {pet.evolution + 1}
            </p>
            <div className="pet-progress-bar" aria-hidden>
              <span style={{ width: `${pet.progressInStage * 100}%` }} />
            </div>
          </>
        ) : (
          <p className="muted">
            Fully evolved lavender guardian — keep checking habits for coins!
          </p>
        )}
      </div>
    </div>
  )
}
