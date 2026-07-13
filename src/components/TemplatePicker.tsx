import { TEMPLATE_META } from '../data/templateMeta'
import type { TemplateId } from '../types'

type TemplatePickerProps = {
  active: TemplateId
  onSelect: (id: TemplateId) => void
}

export function TemplatePicker({ active, onSelect }: TemplatePickerProps) {
  return (
    <div className="template-picker" role="tablist" aria-label="Page templates">
      {TEMPLATE_META.map((t) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          aria-selected={active === t.id}
          className={`template-chip${active === t.id ? ' active' : ''}`}
          style={
            active === t.id
              ? { background: t.accent }
              : undefined
          }
          onClick={() => onSelect(t.id)}
        >
          {t.label}
        </button>
      ))}
      <button type="button" className="template-chip stub" disabled>
        More soon
      </button>
    </div>
  )
}
