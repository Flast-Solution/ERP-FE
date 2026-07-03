import { TriggerBtn, TriggerWrap, TriggerRing } from './AgentTrigger.style'

const Sparkle = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.5 3 11 7.5 15.5 9 11 10.5 9.5 15 8 10.5 3.5 9 8 7.5z" />
    <path d="M18 14l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z" />
  </svg>
)

export function AgentTrigger({ size = 'md', pulse = false, label = 'Sửa với AI', children, ...rest }) {
  const btn = (
    <TriggerBtn type="button" $size={size} aria-label={label} {...rest}>
      {children || <Sparkle />}
    </TriggerBtn>
  )

  if (!pulse) return btn

  return (
    <TriggerWrap>
      <TriggerRing />
      {btn}
    </TriggerWrap>
  )
}
