import { useEffect, useState } from 'react'

type View = 'design' | 'learning' | 'mobile' | 'home' | 'phase' | 'extension'
type MobileFrame = 'acierto' | 'incorrecto' | 'racha' | 'logro'
type HomeFrame = 'inicio' | 'generando' | 'itinerario' | 'error'
type PhaseFrame = '1' | '2' | '3'
type ExtensionFrame = 'base' | 'verificado' | 'alucinacion'

const VIEW_KEY = 'ml-view'
const VARIANT_KEY = 'ml-variant'
const FRAME_KEY = 'ml-frame'
const HOME_FRAME_KEY = 'ml-home-frame'
const PHASE_KEY = 'ml-phase'
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

const HOME_FRAMES: ReadonlyArray<{ id: HomeFrame; label: string; hint: string }> = [
  { id: 'inicio', label: 'Inicio', hint: 'Menú del estudiante: escribe el tema que quieres estudiar, continúa donde lo dejaste y repasa tu semana.' },
  { id: 'generando', label: 'Generando', hint: 'Maki «piensa» mientras la app arma el itinerario: esqueleto de 3 fases con mensaje de acompañamiento.' },
  { id: 'itinerario', label: 'Itinerario', hint: 'El tema convertido en 3 fases: Fase 1 en curso 🔵, Fase 2 y Fase 3 bloqueadas 🔒. +20 XP por decidir.' },
  { id: 'error', label: 'Error de red', hint: 'Recuperación sin puertas cerradas: «No pudimos armar tu itinerario» con Reintentar, otra idea y plan base.' },
]

const PHASE_FRAMES: ReadonlyArray<{ id: PhaseFrame; label: string; hint: string }> = [
  { id: '1', label: 'Fase 1', hint: 'Fundamentos y complejidad (80%): objetivos, 3 conceptos con analogía y mini-quiz de comprensión.' },
  { id: '2', label: 'Fase 2', hint: 'Implementación con montículo: 5 pasos, snippet con desglose de complejidad y dependencias, y checklist de código.' },
  { id: '3', label: 'Fase 3', hint: 'Optimización y casos límite: casos borde desplegables, checklist pre-entrega y envío a MakerLearn (+120 XP).' },
]

function isFrame(value: string | null): value is MobileFrame {
  return value === 'acierto' || value === 'incorrecto' || value === 'racha' || value === 'logro'
}

function isHomeFrame(value: string | null): value is HomeFrame {
  return value === 'inicio' || value === 'generando' || value === 'itinerario' || value === 'error'
}

function isPhaseFrame(value: string | null): value is PhaseFrame {
  return value === '1' || value === '2' || value === '3'
}

function isExtFrame(value: string | null): value is ExtensionFrame {
  return value === 'base' || value === 'verificado' || value === 'alucinacion'
}

function useView() {
  const [view, setView] = useState<View>(() => {
    if (typeof window === 'undefined') return 'design'
    const saved = window.localStorage.getItem(VIEW_KEY)
    return saved === 'learning' || saved === 'mobile' || saved === 'home' || saved === 'phase' || saved === 'extension'
      ? saved
      : 'design'
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
 * Frame activo de la pantalla 05 «Inicio».
 * El estado vive en el query string `?state=inicio|generando|itinerario`,
 * que es lo que lee public/js/journey.js.
 */
function useHomeFrame() {
  const [frame, setFrame] = useState<HomeFrame>(() => {
    if (typeof window === 'undefined') return 'inicio'
    const saved = window.localStorage.getItem(HOME_FRAME_KEY)
    return isHomeFrame(saved) ? saved : 'inicio'
  })

  useEffect(() => {
    window.localStorage.setItem(HOME_FRAME_KEY, frame)
  }, [frame])

  return [frame, setFrame] as const
}

/**
 * Fase activa de la pantalla 06 «Fase» (itinerario).
 * El estado vive en `?phase=1|2|3`, que es lo que lee public/js/journey.js.
 */
function usePhaseFrame() {
  const [frame, setFrame] = useState<PhaseFrame>(() => {
    if (typeof window === 'undefined') return '1'
    const saved = window.localStorage.getItem(PHASE_KEY)
    return isPhaseFrame(saved) ? saved : '1'
  })

  useEffect(() => {
    window.localStorage.setItem(PHASE_KEY, frame)
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
  const [homeFrame, setHomeFrame] = useHomeFrame()
  const [phaseFrame, setPhaseFrame] = usePhaseFrame()
  const [extensionFrame, setExtensionFrame] = useExtensionFrame()

  const appSrc =
    view === 'design'
      ? '/design.html'
      : view === 'mobile'
        ? `/mobile.html?state=${mobileFrame}`
        : view === 'home'
          ? `/home.html?state=${homeFrame}`
          : view === 'phase'
            ? `/phase.html?phase=${phaseFrame}`
            : view === 'extension'
              ? `/extension.html?state=${extensionFrame}`
              : failVariant
                ? '/app.html?state=fallido'
                : '/app.html'

  const frameTitle = FRAMES.find((item) => item.id === mobileFrame)?.hint ?? ''
  const homeFrameTitle = HOME_FRAMES.find((item) => item.id === homeFrame)?.hint ?? ''
  const phaseFrameTitle = PHASE_FRAMES.find((item) => item.id === phaseFrame)?.hint ?? ''
  const extFrameTitle = EXT_FRAMES.find((item) => item.id === extensionFrame)?.hint ?? ''

  /* La `key` del iframe obliga a React a recrearlo al cambiar de frame:
     así el estado del prototipo se reinicia igual que al recargar. */
  const variantKey =
    view === 'learning'
      ? failVariant
        ? 'fallido'
        : 'ok'
      : view === 'mobile'
        ? mobileFrame
        : view === 'home'
          ? homeFrame
          : view === 'phase'
            ? phaseFrame
            : view === 'extension'
              ? extensionFrame
              : '-'

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
        <a
          className={`app-switcher__link${view === 'home' ? ' is-active' : ''}`}
          href="#home"
          onClick={(event) => {
            event.preventDefault()
            setView('home')
          }}
          aria-current={view === 'home' ? 'page' : undefined}
        >
          <span className="app-switcher__num">05</span>
          <span className="app-switcher__label">Inicio · Menú</span>
        </a>
        <a
          className={`app-switcher__link${view === 'phase' ? ' is-active' : ''}`}
          href="#phase"
          onClick={(event) => {
            event.preventDefault()
            setView('phase')
          }}
          aria-current={view === 'phase' ? 'page' : undefined}
        >
          <span className="app-switcher__num">06</span>
          <span className="app-switcher__label">Fase · Itinerario</span>
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

        {view === 'home' && (
          <div className="app-frames" role="group" aria-label="Estados de la pantalla de Inicio">
            {HOME_FRAMES.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`app-frames__btn${homeFrame === item.id ? ' is-on' : ''}`}
                aria-pressed={homeFrame === item.id}
                onClick={() => setHomeFrame(item.id)}
                title={item.hint}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}

        {view === 'phase' && (
          <div className="app-frames" role="group" aria-label="Fases del itinerario">
            {PHASE_FRAMES.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`app-frames__btn${phaseFrame === item.id ? ' is-on' : ''}`}
                aria-pressed={phaseFrame === item.id}
                onClick={() => setPhaseFrame(item.id)}
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

      {view === 'home' && homeFrameTitle && (
        <p className="app-frame-caption" aria-live="polite">
          <span className="app-frame-caption__dot" aria-hidden="true" />
          <span>
            <strong>Estado «{HOME_FRAMES.find((item) => item.id === homeFrame)?.label}»</strong>
            {' · '}
            {homeFrameTitle}
          </span>
        </p>
      )}

      {view === 'phase' && phaseFrameTitle && (
        <p className="app-frame-caption" aria-live="polite">
          <span className="app-frame-caption__dot" aria-hidden="true" />
          <span>
            <strong>Vista «{PHASE_FRAMES.find((item) => item.id === phaseFrame)?.label}»</strong>
            {' · '}
            {phaseFrameTitle}
          </span>
        </p>
      )}

      <div className="app-frame">
        <iframe
          key={`${view}:${variantKey}`}
          className={`app-iframe${view === 'mobile' || view === 'home' || view === 'phase' ? ' is-light' : ''}`}
          title={
            view === 'design'
              ? 'Sistema de diseño MakerLearn'
              : view === 'mobile'
                ? 'Aprender · MakerLearn Studio (móvil)'
                : view === 'home'
                  ? 'Inicio · MakerLearn Studio (móvil)'
                  : view === 'phase'
                    ? 'Fase del itinerario · MakerLearn Studio (móvil)'
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
