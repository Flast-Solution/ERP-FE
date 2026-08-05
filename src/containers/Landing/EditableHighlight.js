import { AgentTrigger } from './AgentTrigger'
import { Wrap, Overlay, Tag, TriggerSlot } from './EditableHighlight.style'

export function EditableHighlight({
  elementId,
  domId,
  onEdit,
  active = false,
  selected = false,
  disabled = false,
  showTrigger = true,
  triggerProps,
  className = '',
  children,
  ...rest
}) {
  const cls = [
    className,
    active && 'is-active',
    selected && 'is-selected',
    disabled && 'is-disabled',
  ].filter(Boolean).join(' ')

  return (
    <Wrap id={domId || elementId || undefined} className={cls} {...rest}>
      {children}
      <Overlay aria-hidden="true" data-landing-editor-only="true" />
      {elementId && <Tag data-landing-editor-only="true">#{elementId}</Tag>}
      {showTrigger && !disabled && (
        <TriggerSlot data-landing-editor-only="true">
          <AgentTrigger
            size="sm"
            label={`Sửa #${elementId || 'phần tử'}`}
            onClick={(e) => { e.stopPropagation(); onEdit && onEdit(elementId, e) }}
            {...triggerProps}
          />
        </TriggerSlot>
      )}
    </Wrap>
  )
}
