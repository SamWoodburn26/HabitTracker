/**
 * Procedural lavender care-pet art (75 evolutions).
 * Morphs smoothly from cream spotted egg → fluff → standing → crystals.
 */

type PetArtProps = {
  evolution: number
}

function clamp01(n: number) {
  return Math.min(1, Math.max(0, n))
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * clamp01(t)
}

/** 0–1 progress through [from, to] evolution numbers */
function rangeT(evo: number, from: number, to: number) {
  if (to <= from) return evo >= to ? 1 : 0
  return clamp01((evo - from) / (to - from))
}

export function PetArt({ evolution }: PetArtProps) {
  const e = Math.min(75, Math.max(1, Math.round(evolution)))

  // Egg fades out over evo 1→8; creature fades in over 3→10
  const eggAmount = 1 - rangeT(e, 1, 8)
  const crack = rangeT(e, 1, 6)
  const peekEyes = rangeT(e, 2, 5)
  const shellBits = rangeT(e, 4, 8) * (1 - rangeT(e, 8, 14))
  const creature = rangeT(e, 3, 9)
  const sitToStand = rangeT(e, 38, 50)
  const size = lerp(0.62, 1.15, rangeT(e, 4, 75))
  const fluff = lerp(0.75, 1.28, rangeT(e, 8, 55))
  const hornLen = rangeT(e, 10, 65)
  const hornThick = lerp(0.45, 1.25, rangeT(e, 16, 65))
  const tail = rangeT(e, 22, 48)
  const paws = rangeT(e, 12, 40)
  const crystals = rangeT(e, 48, 75)
  const heart = rangeT(e, 52, 70)
  const lashes = rangeT(e, 56, 75)
  const backTufts = rangeT(e, 40, 62)
  const smileOpen = e % 7 === 0 && e > 12 ? 1 : 0
  const wink = e % 11 === 3 && e > 16 ? 1 : 0

  const bodyCy = lerp(64, 58, sitToStand)
  const bodyRx = 28 * fluff
  const bodyRy = lerp(26, 22, sitToStand) * fluff
  const headCy = lerp(44, 36, sitToStand)
  const headR = 18 * lerp(1, 0.95, sitToStand)
  const nestOpacity = eggAmount > 0.05 ? eggAmount : 0

  // Whole creature group scale/position via SVG transform (reliable vs CSS)
  const creatureScale = size
  const creatureY = lerp(92, 86, sitToStand)

  const fur = '#C9B0E8'
  const furDeep = '#A889D4'
  const furLight = '#E4D4F5'
  const cream = '#F5EDE0'
  const creamSpot = '#D4B8E8'
  const horn = '#F0D9C8'
  const eye = '#2A1F3D'
  const pad = '#E8A8B8'
  const crystal = '#9B6FD4'

  const uid = `pet-${e}`

  return (
    <svg viewBox="0 0 160 160" className="pet-art" aria-hidden>
      <defs>
        <radialGradient id={`${uid}-fur`} cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor={furLight} />
          <stop offset="55%" stopColor={fur} />
          <stop offset="100%" stopColor={furDeep} />
        </radialGradient>
        <radialGradient id={`${uid}-egg`} cx="40%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#FFF8F0" />
          <stop offset="100%" stopColor={cream} />
        </radialGradient>
      </defs>

      <ellipse
        cx="80"
        cy="138"
        rx={lerp(26, 44, rangeT(e, 1, 75))}
        ry="8"
        fill="#C4A8D8"
        opacity="0.28"
      />

      {/* Nest */}
      <g opacity={nestOpacity}>
        <ellipse cx="80" cy="118" rx="38" ry="12" fill="#E8D5B8" />
        <ellipse cx="80" cy="116" rx="32" ry="8" fill="#F0E4CC" />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <ellipse
            key={i}
            cx={56 + i * 10}
            cy={114 + (i % 2) * 3}
            rx="7"
            ry="3"
            fill="#D4C09A"
            opacity="0.7"
            transform={`rotate(${-20 + i * 12} ${56 + i * 10} ${114})`}
          />
        ))}
      </g>

      {/* Egg */}
      <g opacity={eggAmount}>
        <ellipse cx="80" cy="88" rx="28" ry="36" fill={`url(#${uid}-egg)`} />
        <ellipse cx="72" cy="72" rx="10" ry="14" fill="#fff" opacity="0.35" />
        {[
          [68, 70, 5],
          [92, 78, 4],
          [78, 98, 6],
          [88, 58, 3.5],
          [64, 92, 3],
        ].map(([cx, cy, r], i) => (
          <ellipse
            key={i}
            cx={cx}
            cy={cy}
            rx={r}
            ry={r * 0.85}
            fill={creamSpot}
            opacity="0.85"
          />
        ))}
        <path
          d={`M70 55 L78 ${55 + crack * 18} L72 ${55 + crack * 28} L82 ${55 + crack * 40}`}
          fill="none"
          stroke="#B89A78"
          strokeWidth={1.5 + crack}
          strokeLinecap="round"
          opacity={Math.max(crack, 0.15)}
        />
        <path
          d={`M88 60 L84 ${60 + crack * 14} L90 ${60 + crack * 24}`}
          fill="none"
          stroke="#B89A78"
          strokeWidth={1.2 + crack * 0.8}
          strokeLinecap="round"
          opacity={crack * 0.95}
        />
        <g opacity={peekEyes}>
          <ellipse cx="72" cy="78" rx="4" ry="5" fill={eye} />
          <ellipse cx="88" cy="78" rx="4" ry="5" fill={eye} />
          <circle cx="73.2" cy="76.5" r="1.2" fill="#fff" />
          <circle cx="89.2" cy="76.5" r="1.2" fill="#fff" />
        </g>
      </g>

      {/* Shell bits */}
      <g opacity={shellBits}>
        <path
          d="M52 100 Q58 88 70 92 L66 110 Z"
          fill={cream}
          stroke="#D4C4A8"
          strokeWidth="1"
        />
        <path
          d="M108 98 Q100 86 88 90 L94 112 Z"
          fill={cream}
          stroke="#D4C4A8"
          strokeWidth="1"
        />
      </g>

      {/* Creature */}
      <g
        opacity={creature}
        transform={`translate(80 ${creatureY}) scale(${creatureScale}) translate(-80 -88)`}
      >
        <g opacity={tail}>
          <ellipse
            cx={lerp(108, 118, tail)}
            cy={lerp(78, 72, sitToStand)}
            rx={lerp(8, 22, tail) * fluff}
            ry={lerp(10, 18, tail) * fluff}
            fill={`url(#${uid}-fur)`}
            transform={`rotate(${lerp(20, -25, sitToStand)} ${lerp(108, 118, tail)} ${lerp(78, 72, sitToStand)})`}
          />
        </g>

        <g opacity={sitToStand * paws}>
          <ellipse cx="58" cy="98" rx="9" ry="14" fill={`url(#${uid}-fur)`} />
          <ellipse cx="102" cy="98" rx="9" ry="14" fill={`url(#${uid}-fur)`} />
          <ellipse cx="58" cy="110" rx="7" ry="4" fill={pad} opacity="0.85" />
          <ellipse cx="102" cy="110" rx="7" ry="4" fill={pad} opacity="0.85" />
        </g>

        <ellipse
          cx="80"
          cy={bodyCy}
          rx={bodyRx}
          ry={bodyRy}
          fill={`url(#${uid}-fur)`}
        />
        <ellipse
          cx="68"
          cy={bodyCy - 6}
          rx={bodyRx * 0.45}
          ry={bodyRy * 0.5}
          fill={furLight}
          opacity="0.45"
        />

        <g opacity={backTufts}>
          {[0, 1, 2, 3].map((i) => (
            <ellipse
              key={i}
              cx={70 + i * 7}
              cy={bodyCy - bodyRy + 4}
              rx={3 + i * 0.4}
              ry={6 + backTufts * 4}
              fill={furDeep}
              opacity={0.55 + i * 0.08}
            />
          ))}
        </g>

        <g opacity={paws}>
          <ellipse
            cx={lerp(62, 56, sitToStand)}
            cy={lerp(78, 92, sitToStand)}
            rx={lerp(7, 8, sitToStand)}
            ry={lerp(6, 12, sitToStand)}
            fill={`url(#${uid}-fur)`}
          />
          <ellipse
            cx={lerp(98, 104, sitToStand)}
            cy={lerp(78, 92, sitToStand)}
            rx={lerp(7, 8, sitToStand)}
            ry={lerp(6, 12, sitToStand)}
            fill={`url(#${uid}-fur)`}
          />
        </g>

        <g opacity={crystals}>
          {[
            [74, bodyCy - bodyRy + 2, 4],
            [86, bodyCy - bodyRy + 4, 5],
            [80, bodyCy - bodyRy - 2, 3.5],
            [64, bodyCy - 4, 3],
            [96, bodyCy - 2, 3.2],
          ].map(([cx, cy, s], i) => (
            <polygon
              key={i}
              points={`${cx},${cy - s * Math.max(crystals, 0.2)} ${cx + s * 0.7},${cy} ${cx},${cy + s * 0.5} ${cx - s * 0.7},${cy}`}
              fill={crystal}
              opacity={0.75}
              stroke="#E8D4FF"
              strokeWidth="0.6"
            />
          ))}
        </g>

        <circle cx="80" cy={headCy} r={headR} fill={`url(#${uid}-fur)`} />
        <ellipse
          cx="74"
          cy={headCy - 4}
          rx={headR * 0.4}
          ry={headR * 0.35}
          fill={furLight}
          opacity="0.5"
        />

        <g opacity={Math.max(hornLen, 0)}>
          <path
            d={`M${70 - hornThick} ${headCy - headR * 0.55}
               Q${66 - hornThick * 2} ${headCy - headR * (0.9 + hornLen * 0.55)}
               ${72} ${headCy - headR * 0.35}`}
            fill={horn}
            stroke="#E8C8B4"
            strokeWidth="0.8"
          />
          <path
            d={`M${90 + hornThick} ${headCy - headR * 0.55}
               Q${94 + hornThick * 2} ${headCy - headR * (0.9 + hornLen * 0.55)}
               ${88} ${headCy - headR * 0.35}`}
            fill={horn}
            stroke="#E8C8B4"
            strokeWidth="0.8"
          />
        </g>

        <g
          opacity={heart}
          transform={`translate(80 ${headCy - 2}) scale(${0.35 + heart * 0.25})`}
        >
          <path
            d="M0 4 C0 0 -6 -2 -6 -6 C-6 -10 0 -10 0 -6 C0 -10 6 -10 6 -6 C6 -2 0 0 0 4 Z"
            fill={pad}
          />
        </g>

        {wink > 0 ? (
          <>
            <path
              d={`M${80 - headR * 0.35} ${headCy} Q${80 - headR * 0.22} ${headCy + 2} ${80 - headR * 0.1} ${headCy}`}
              fill="none"
              stroke={eye}
              strokeWidth="2"
              strokeLinecap="round"
            />
            <ellipse
              cx={80 + headR * 0.22}
              cy={headCy}
              rx={headR * 0.14}
              ry={headR * 0.17}
              fill={eye}
            />
            <circle
              cx={80 + headR * 0.26}
              cy={headCy - headR * 0.05}
              r={headR * 0.045}
              fill="#fff"
            />
          </>
        ) : (
          <>
            <ellipse
              cx={80 - headR * 0.22}
              cy={headCy}
              rx={headR * 0.14}
              ry={headR * 0.17}
              fill={eye}
            />
            <ellipse
              cx={80 + headR * 0.22}
              cy={headCy}
              rx={headR * 0.14}
              ry={headR * 0.17}
              fill={eye}
            />
            <circle
              cx={80 - headR * 0.18}
              cy={headCy - headR * 0.05}
              r={headR * 0.045}
              fill="#fff"
            />
            <circle
              cx={80 + headR * 0.26}
              cy={headCy - headR * 0.05}
              r={headR * 0.045}
              fill="#fff"
            />
          </>
        )}

        <g opacity={lashes} stroke={eye} strokeWidth="1.2" strokeLinecap="round">
          <path
            d={`M${80 - headR * 0.34} ${headCy - headR * 0.12} L${80 - headR * 0.4} ${headCy - headR * 0.22}`}
          />
          <path
            d={`M${80 + headR * 0.34} ${headCy - headR * 0.12} L${80 + headR * 0.4} ${headCy - headR * 0.22}`}
          />
        </g>

        {smileOpen ? (
          <ellipse
            cx="80"
            cy={headCy + headR * 0.35}
            rx={headR * 0.12}
            ry={headR * 0.1}
            fill="#5A4068"
          />
        ) : (
          <path
            d={`M${80 - headR * 0.12} ${headCy + headR * 0.28}
               Q80 ${headCy + headR * 0.4} ${80 + headR * 0.12} ${headCy + headR * 0.28}`}
            fill="none"
            stroke="#5A4068"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        )}
        <ellipse
          cx="80"
          cy={headCy + headR * 0.18}
          rx={headR * 0.06}
          ry={headR * 0.04}
          fill="#5A4068"
          opacity="0.7"
        />
      </g>
    </svg>
  )
}
