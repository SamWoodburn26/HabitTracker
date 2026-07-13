import { PetArt } from './PetArt'

type PetPlaceholderProps = {
  evolution: number
}

export function PetPlaceholder({ evolution }: PetPlaceholderProps) {
  return (
    <div className="pet-stage-wrap" data-evolution={evolution}>
      <PetArt key={evolution} evolution={evolution} />
    </div>
  )
}
