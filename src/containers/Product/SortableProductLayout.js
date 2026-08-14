import React from 'react';
import { Col, Row, Typography } from 'antd';
import { HolderOutlined } from '@ant-design/icons';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const dragHandleStyle = {
  alignItems: 'center',
  color: '#8c8c8c',
  cursor: 'grab',
  display: 'inline-flex',
  padding: 6,
  touchAction: 'none',
};

export const SortableProductItem = ({ blockId, editMode, item, children }) => {
  const {
    attributes,
    isDragging,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({
    id: item.id,
    data: { type: 'product-form-item', blockId },
    disabled: !editMode,
  });

  return (
    <Col
      ref={setNodeRef}
      md={item.md ?? 24}
      xs={24}
      style={{
        opacity: isDragging ? 0.45 : 1,
        position: 'relative',
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 2 : undefined,
      }}
    >
      {editMode && (
        <span
          {...attributes}
          {...listeners}
          aria-label={`Di chuyển ${item.label}`}
          title={`Di chuyển ${item.label}`}
          style={{
            ...dragHandleStyle,
            background: '#fff',
            border: '1px solid #d9d9d9',
            borderRadius: 6,
            position: 'absolute',
            right: 10,
            top: -3,
            zIndex: 3,
          }}
        >
          <HolderOutlined />
        </span>
      )}
      {children}
    </Col>
  );
};

const SortableProductBlock = ({ block, editMode, children }) => {
  const {
    attributes,
    isDragging,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({
    id: block.id,
    data: { type: 'product-form-block' },
    disabled: !editMode,
  });

  return (
    <Col
      ref={setNodeRef}
      span={24}
      style={{
        opacity: isDragging ? 0.4 : 1,
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      <section style={{
        border: editMode ? '1px dashed #91caff' : 'none',
        borderRadius: editMode ? 8 : 0,
        marginBottom: editMode ? 12 : 0,
        padding: editMode ? '10px 10px 0' : 0,
      }}>
        {editMode && (
          <div style={{ alignItems: 'center', display: 'flex', marginBottom: 10 }}>
            <span {...attributes} {...listeners} style={dragHandleStyle}>
              <HolderOutlined />
            </span>
            <Typography.Text strong>{block.title}</Typography.Text>
          </div>
        )}
        <Row gutter={16}>{children}</Row>
      </section>
    </Col>
  );
};

export default SortableProductBlock;
