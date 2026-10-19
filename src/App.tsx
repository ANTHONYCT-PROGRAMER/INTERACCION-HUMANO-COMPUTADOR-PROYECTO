import { useEffect, useState } from 'react'

type View = 'design' | 'learning' | 'mobile' | 'extension'
type MobileFrame = 'acierto' | 'incorrecto' | 'racha' | 'logro'
type ExtensionFrame = 'base' | 'verificado' | 'alucinacion'

const VIEW_KEY = 'ml-view'
const VARIANT_KEY = 'ml-variant'
const FRAME_KEY = 'ml-frame'
const EXT_FRAME_KEY = 'ml-ext-frame'

const FRAMES: ReadonlyArray<{ id: MobileFrame; label: string; hint: string }> = [
  { id: 'acierto', label: 'Acierto', hint: 'Estado base: opción B en verde con check, banner «¡Correcto! +50 XP» y confeti sutil.' },
  { id: 'incorrecto', label: 'Incorrecto', hint: 'Opción A en rojo con shake, banner «Casi lo tienes… equivocarse forma parte de aprender» y botón «Ver pista».' },
  { id: 'racha', label: 'Racha', hint: 'Maki anima a repasar 1 tarjeta de 30 s sin prisa para mantener la racha de 5 días.' },
  { id: 'logro', label: 'Logro', hint: 'Fase 1 superada: medalla «Maestro del montículo» con botón compartir.' },
]

const EXT_FRAMES: ReadonlyArray<{ id: ExtensionFrame; label: string; hint: string }> = [
  { id: 'base', label: 'Auditoría mixta', hint: 'Bridge Extension (popup 380×280) + InsightLens: 1 fuente verificada, 1 ambigua y 1 falsa.' },
  { id: 'verificado', label: 'Todo verificado', hint: 'Las 3 fuentes en verde, confeti y aviso «Estás listo para entregar ✅».' },
  { id: 'alucinacion', label: 'Alucinación crítica', hint: 'Fuente roja con borde pulsante y alerta «No entregues esta cita sin verificar».' },
]

function isFrame(value: string | null): value is MobileFrame {
  return value === 'acierto' || value === 'incorrecto' || value === 'racha' || value === 'logro'
}

function isExtFrame(value: string | null): value is ExtensionFrame {
  return value === 'base' || value === 'verificado' || value === 'alucinacion'
}

function useView() {
  const [view, setView] = useState<View>(() => {
    if (typeof window === 'undefined') return 'design'
    const saved = window.localStorage.getItem(VIEW_KEY)
    return saved === 'learning' || saved === 'mobile' || saved === 'extension' ? saved : 'design'
  })

  useEffect(() => {
    window.localStorage.setItem(VIEW_KEY, view)
  }, [view])

  return [view, setView] as const
}

/**
 * Alterna la variante «Test fallido» de la pantalla 02.
 * No duplica el HTML: sólo cambia el query string que lee public/js/screen.js
 * (`?state=fallido`), de modo que el diseño original sigue siendo la fuente única.
 */
function useFailVariant() {
  const [failVariant, setFailVariant] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.localStorage.getItem(VARIANT_KEY) === 'fallido'
  })

  useEffect(() => {
    window.localStorage.setItem(VARIANT_KEY, failVariant ? 'fallido' : 'ok')
  }, [failVariant])

  return [failVariant, setFailVariant] as const
}

/**
 * Frame activo del prototipo móvil (pantalla 03).
 * Igual que en la 02, el estado vive en la URL (`?state=`), que es lo que lee
 * public/js/mobile.js: una sola fuente de verdad para los cuatro frames.
 */
function useMobileFrame() {
  const [frame, setFrame] = useState<MobileFrame>(() => {
    if (typeof window === 'undefined') return 'acierto'
    const saved = window.localStorage.getItem(FRAME_KEY)
    return isFrame(saved) ? saved : 'acierto'
  })

  useEffect(() => {
    window.localStorage.setItem(FRAME_KEY, frame)
  }, [frame])

  return [frame, setFrame] as const
}

/**
 * Frame activo del ecosistema de extensión (pantalla 04).
 * Mismo contrato que 02 y 03: el estado vive en el query string `?state=`
 * y quien lo lee es public/js/extension.js.
 */
function useExtensionFrame() {
  const [frame, setFrame] = useState<ExtensionFrame>(() => {
    if (typeof window === 'undefined') return 'base'
    const saved = window.localStorage.getItem(EXT_FRAME_KEY)
    return isExtFrame(saved) ? saved : 'base'
  })

  useEffect(() => {
    window.localStorage.setItem(EXT_FRAME_KEY, frame)
  }, [frame])

  return [frame, setFrame] as const
}

export default function App() {
  const [view, setView] = useView()
  const [failVariant, setFailVariant] = useFailVariant()
  const [mobileFrame, setMobileFrame] = useMobileFrame()
  const [extensionFrame, setExtensionFrame] = useExtensionFrame()

  const appSrc =
    view === 'design'
      ? '/design.html'
      : view === 'mobile'
        ? `/mobile.html?state=${mobileFrame}`
        : view === 'extension'
          ? `/extension.html?state=${extensionFrame}`
          : failVariant
            ? '/app.html?state=fallido'
            : '/app.html'

  const frameTitle = FRAMES.find((item) => item.id === mobileFrame)?.hint ?? ''
  const extFrameTitle = EXT_FRAMES.find((item) => item.id === extensionFrame)?.hint ?? ''

  return (
    <div className="app-shell">
      <nav className="app-switcher" aria-label="Vistas del prototipo">
        <a
          className={`app-switcher__link${view === 'design' ? ' is-active' : ''}`}
          href="#design"
          onClick={(event) => {
            event.preventDefault()
            setView('design')
          }}
          aria-current={view === 'design' ? 'page' : undefined}
        >
          <span className="app-switcher__num">01</span>
          <span className="app-switcher__label">Sistema de diseño</span>
        </a>
        <a
          className={`app-switcher__link${view === 'learning' ? ' is-active' : ''}`}
          href="#learning"
          onClick={(event) => {
            event.preventDefault()
            setView('learning')
          }}
          aria-current={view === 'learning' ? 'page' : undefined}
        >
          <span className="app-switcher__num">02</span>
          <span className="app-switcher__label">Ruta Activa · App</span>
        </a>
        <a
          className={`app-switcher__link${view === 'mobile' ? ' is-active' : ''}`}
          href="#mobile"
          onClick={(event) => {
            event.preventDefault()
            setView('mobile')
          }}
          aria-current={view === 'mobile' ? 'page' : undefined}
        >
          <span className="app-switcher__num">03</span>
          <span className="app-switcher__label">Aprender · Móvil</span>
        </a>
        <a
          className={`app-switcher__link${view === 'extension' ? ' is-active' : ''}`}
          href="#extension"
          onClick={(event) => {
            event.preventDefault()
            setView('extension')
          }}
          aria-current={view === 'extension' ? 'page' : undefined}
        >
          <span className="app-switcher__num">04</span>
          <span className="app-switcher__label">Extensión · Bridge</span>
        </a>

        {view === 'learning' && (
          <button
            type="button"
            className={`app-variant${failVariant ? ' is-on' : ''}`}
            aria-pressed={failVariant}
            onClick={() => setFailVariant(!failVariant)}
            title="Alterna entre el estado normal (01–03 ✅, 04 ❌) y la variante con el test 02 fallando"
          >
            <span className="app-variant__dot" aria-hidden="true" />
            <span>Variante «Test fallido»</span>
            <span className="app-variant__state">{failVariant ? 'ON' : 'OFF'}</span>
          </button>
        )}

        {view === 'mobile' && (
          <div className="app-frames" role="group" aria-label="Estados del prototipo móvil">
            {FRAMES.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`app-frames__btn${mobileFrame === item.id ? ' is-on' : ''}`}
                aria-pressed={mobileFrame === item.id}
                onClick={() => setMobileFrame(item.id)}
                title={item.hint}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}

        {view === 'extension' && (
          <div className="app-frames" role="group" aria-label="Estados del ecosistema de extensión">
            {EXT_FRAMES.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`app-frames__btn${extensionFrame === item.id ? ' is-on' : ''}`}
                aria-pressed={extensionFrame === item.id}
                onClick={() => setExtensionFrame(item.id)}
                title={item.hint}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
      </nav>

      {view === 'mobile' && frameTitle && (
        <p className="app-frame-caption" aria-live="polite">
          <span className="app-frame-caption__dot" aria-hidden="true" />
          <span>
            <strong>Estado «{FRAMES.find((item) => item.id === mobileFrame)?.label}»</strong>
            {' · '}
            {frameTitle}
          </span>
        </p>
      )}

      {view === 'extension' && extFrameTitle && (
        <p className="app-frame-caption" aria-live="polite">
          <span className="app-frame-caption__dot" aria-hidden="true" />
          <span>
            <strong>Estado «{EXT_FRAMES.find((item) => item.id === extensionFrame)?.label}»</strong>
            {' · '}
            {extFrameTitle}
          </span>
        </p>
      )}

      <div className="app-frame">
        <iframe
          key={`${view}:${view === 'learning' ? (failVariant ? 'fallido' : 'ok') : 'base'}:${view === 'mobile' ? mobileFrame : view === 'extension' ? extensionFrame : '-'}`}
          className={`app-iframe${view === 'mobile' ? ' is-light' : ''}`}
          title={
            view === 'design'
              ? 'Sistema de diseño MakerLearn'
              : view === 'mobile'
                ? 'Aprender · MakerLearn Studio (móvil)'
                : view === 'extension'
                  ? 'Extensión · MakerLearn Studio (Bridge + InsightLens)'
                  : 'Ruta Activa · MakerLearn Studio'
          }
          src={appSrc}
          loading="eager"
        />
      </div>
    </div>
  )
}
