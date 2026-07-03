import { AgentTrigger } from './AgentTrigger'
import { Wrap, Overlay, Tag, TriggerSlot } from './EditableHighlight.style'

export function EditableHighlight({
  elementId,
  onEdit,
  active = false,
  selected = false,
  disabled = false,
  showTrigger = true,
  triggerProps,
  children,
  ...rest
}) {
  const cls = [
    active && 'is-active',
    selected && 'is-selected',
    disabled && 'is-disabled',
  ].filter(Boolean).join(' ')

  return (
    <Wrap className={cls} {...rest}>
      {children}
      <Overlay aria-hidden="true" />
      {elementId && <Tag>#{elementId}</Tag>}
      {showTrigger && !disabled && (
        <TriggerSlot>
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
