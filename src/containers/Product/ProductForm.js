/**************************************************************************/
/*  ProductForm.js                                                        */
/**************************************************************************/
/*                       Tệp này là một phần của:                         */
/*                             Open CDP                                   */
/*                        https://flast.vn                                */
/**************************************************************************/
/* Bản quyền (c) 2025 - này thuộc về các cộng tác viên Flast Solution     */
/* (xem AUTHORS.md).                                                      */
/* Bản quyền (c) 2024-2025 Long Huu, Quang Duc, Hung Bui                  */
/*                                                                        */
/* Bạn được quyền sử dụng phần mềm này miễn phí cho bất kỳ mục đích nào,  */
/* bao gồm sao chép, sửa đổi, phân phối, bán lại…                         */
/*                                                                        */
/* Chỉ cần giữ nguyên thông tin bản quyền và nội dung giấy phép này trong */
/* các bản sao.                                                           */
/*                                                                        */
/* Đội ngũ phát triển mong rằng phần mềm được sử dụng đúng mục đích và    */
/* có trách nghiệm                                                        */
/**************************************************************************/

import React, { useEffect, useMemo, useState } from 'react';
import { Row, Col, Typography, Form, Button, Space, Tooltip, message } from 'antd';
import {
  FormInput,
  FormInputNumber,
  FormSelectAPI,
  FormSelect,
  FormHidden,
  CustomButton,
  FormListAddtion,
  useStore,
} from "@flast-erp/core/components";

import ProductFormProperty from './ProductFormProperty';
import { AppstoreOutlined, ReloadOutlined, SwitcherOutlined } from '@ant-design/icons';
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import ProductFormPrice from './ProductFormPrice';
import { PRODUCT_CURRENCIES, PRODUCT_STATUS } from '@/configs/localData';
import { FormListStyles } from "@/css/global";
import FormInfiniteQcProduct from '@/components/FormInfiniteQcProduct';
import ProductImagesUpload from './ProductImagesUpload';
import ProductFilesUpload from './ProductFilesUpload';
import SortableProductBlock, { SortableProductItem } from './SortableProductLayout';
import {
  createProductFormLayoutStorageKey,
  readProductFormLayout,
  resetProductFormLayout,
  saveProductFormLayout,
} from './productFormLayout';

const PRODUCT_FORM_ITEMS = {
  name: { label: 'Tên sản phẩm', md: 24 },
  serviceId: { label: 'Dịch vụ', md: 12 },
  providerId: { label: 'Nhà cung cấp', md: 12 },
  unit: { label: 'Đơn vị tính', md: 12 },
  status: { label: 'Trạng thái', md: 12 },
  currency: { label: 'Loại tiền', md: 8 },
  price: { label: 'Giá hiển thị', md: 8 },
  priceRef: { label: 'Giá tham khảo', md: 8 },
  image: { label: 'Ảnh sản phẩm', md: 24 },
  file: { label: 'Tài liệu sản phẩm', md: 24 },
  listProperties: { label: 'Thiết lập sản phẩm', md: 24 },
  priceRanges: { label: 'Thiết lập khoảng giá bán', md: 24 },
  listOpenInfo: { label: 'Thông tin mở rộng', md: 24 },
  qualityControl: { label: 'Kiểm định chất lượng', md: 24 },
};

const ProductForm = () => {
  const { user } = useStore();
  const storageKey = useMemo(
    () => createProductFormLayoutStorageKey(user),
    [user],
  );
  const [editLayout, setEditLayout] = useState(false);
  const [blocks, setBlocks] = useState(() => readProductFormLayout(storageKey));
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  useEffect(() => {
    setBlocks(readProductFormLayout(storageKey));
  }, [storageKey]);

  useEffect(() => {
    saveProductFormLayout(storageKey, blocks);
  }, [blocks, storageKey]);

  const findBlockByItemId = (itemId) => (
    blocks.find(block => block.items.includes(itemId))
  );

  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;

    if (active.data.current?.type === 'product-form-block') {
      const overBlock = over.data.current?.type === 'product-form-block'
        ? over.id
        : findBlockByItemId(over.id)?.id;
      const oldIndex = blocks.findIndex(block => block.id === active.id);
      const newIndex = blocks.findIndex(block => block.id === overBlock);
      if (oldIndex >= 0 && newIndex >= 0) {
        setBlocks(current => arrayMove(current, oldIndex, newIndex));
      }
      return;
    }

    if (active.data.current?.type === 'product-form-item') {
      const sourceBlockId = active.data.current.blockId;
      const targetBlock = findBlockByItemId(over.id);
      // Controls are sortable inside their own semantic block only.
      if (!targetBlock || targetBlock.id !== sourceBlockId) return;

      setBlocks(current => current.map(block => {
        if (block.id !== sourceBlockId) return block;
        const oldIndex = block.items.indexOf(active.id);
        const newIndex = block.items.indexOf(over.id);
        return oldIndex >= 0 && newIndex >= 0
          ? { ...block, items: arrayMove(block.items, oldIndex, newIndex) }
          : block;
      }));
    }
  };

  const handleResetLayout = () => {
    setBlocks(resetProductFormLayout(storageKey));
    message.success('Đã khôi phục bố cục mặc định');
  };

  const renderProductItem = (itemId) => {
    switch (itemId) {
      case 'name':
        return (
          <FormInput
            required
            label="Tên sản phẩm"
            name="name"
            placeholder="Nhập tên sản phẩm"
          />
        );
      case 'serviceId':
        return (
          <FormSelectAPI
            required
            showSearch
            onData={(data) => data ?? []}
            apiPath="service/list"
            apiAddNewItem="erp/service/create"
            label="Dịch vụ"
            name="serviceId"
            placeholder="Chọn dịch vụ"
          />
        );
      case 'providerId':
        return (
          <FormSelectAPI
            required
            apiPath="provider/fetch"
            apiAddNewItem="provider/save"
            onData={(data) => data?.embedded ?? []}
            label="Nhà cung cấp"
            name="providerId"
            placeholder="Chọn nhà cung cấp"
          />
        );
      case 'unit':
        return <FormInput label="Đơn vị tính" name="unit" placeholder="Nhập đơn vị tính" />;
      case 'status':
        return (
          <FormSelect
            required
            resourceData={PRODUCT_STATUS}
            valueProp="value"
            titleProp="text"
            label="Trạng thái"
            name="status"
            placeholder="Chọn trạng thái"
          />
        );
      case 'currency':
        return (
          <FormSelect
            required
            initialValue="VND"
            resourceData={PRODUCT_CURRENCIES}
            valueProp="value"
            titleProp="text"
            label="Loại tiền"
            name="currency"
            placeholder="Chọn loại tiền"
          />
        );
      case 'price':
        return <FormInputNumber required label="Giá hiển thị" name="price" placeholder="Nhập giá hiển thị" />;
      case 'priceRef':
        return <FormInputNumber label="Giá tham khảo" name="priceRef" placeholder="Nhập giá tham khảo" />;
      case 'image':
        return <ProductImagesUpload />;
      case 'file':
        return <ProductFilesUpload />;
      case 'listProperties':
        return (
          <>
            <Typography.Title level={5}>
              <SwitcherOutlined />
              <span style={{ marginLeft: 20 }}>Thiết lập sản phẩm (Có tính nhận diện tồn kho)</span>
            </Typography.Title>
            <FormListAddtion name="listProperties" textAddNew="Thêm mới thuộc tính">
              <ProductFormProperty />
            </FormListAddtion>
          </>
        );
      case 'priceRanges':
        return (
          <>
            <Typography.Title level={5}>
              <SwitcherOutlined />
              <span style={{ marginLeft: 20 }}>Thiết lập khoảng giá bán</span>
            </Typography.Title>
            <Form.Item
              noStyle
              shouldUpdate={(prevValues, curValues) => (
                prevValues.listProperties !== curValues.listProperties
              )}
            >
              {({ getFieldValue }) => (
                <ProductFormPrice listProperties={getFieldValue('listProperties')} />
              )}
            </Form.Item>
          </>
        );
      case 'listOpenInfo':
        return (
          <>
            <Typography.Title level={5}>
              <SwitcherOutlined />
              <span style={{ marginLeft: 20 }}>Thông tin mở rộng</span>
            </Typography.Title>
            <FormListAddtion name="listOpenInfo" textAddNew="Thêm mới" showBtnInLeft={false}>
              <FormOpenInfo />
            </FormListAddtion>
          </>
        );
      case 'qualityControl':
        return (
          <>
            <Typography.Title level={5}>
              <SwitcherOutlined />
              <span style={{ marginLeft: 20 }}>Kiểm định chất lượng sản phẩm (Nếu có)</span>
            </Typography.Title>
            <FormInfiniteQcProduct placeholder="Chọn trong danh sách" />
          </>
        );
      default:
        return null;
    }
  };

  return (
    <Row gutter={16} style={{ marginTop: 20 }}>
      <FormHidden name={'id'} />
      <Col span={24} style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <Space>
          {editLayout && (
            <Tooltip title="Xóa bố cục đã lưu trên thiết bị và trở về mặc định">
              <Button icon={<ReloadOutlined />} onClick={handleResetLayout}>
                Khôi phục mặc định
              </Button>
            </Tooltip>
          )}
          <Button
            icon={<AppstoreOutlined />}
            type={editLayout ? 'primary' : 'default'}
            onClick={() => setEditLayout(current => !current)}
          >
            {editLayout ? 'Hoàn tất sắp xếp' : 'Sắp xếp bố cục'}
          </Button>
        </Space>
      </Col>

      <Col span={24}>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <Row gutter={16}>
            <SortableContext
              items={blocks.map(block => block.id)}
              strategy={verticalListSortingStrategy}
            >
              {blocks.map(block => (
                <SortableProductBlock key={block.id} block={block} editMode={editLayout}>
                  <SortableContext items={block.items} strategy={rectSortingStrategy}>
                    {block.items.map(itemId => {
                      const item = { id: itemId, ...PRODUCT_FORM_ITEMS[itemId] };
                      return (
                        <SortableProductItem
                          key={itemId}
                          blockId={block.id}
                          editMode={editLayout}
                          item={item}
                        >
                          {renderProductItem(itemId)}
                        </SortableProductItem>
                      );
                    })}
                  </SortableContext>
                </SortableProductBlock>
              ))}
            </SortableContext>
          </Row>
        </DndContext>
      </Col>

      <Col md={24} xs={24}>
        <CustomButton
          htmlType="submit"
          title="Hoàn thành"
          color="danger"
          variant="solid"
        />
      </Col>
    </Row>
  )
};

const FormOpenInfo = ({ field }) => {
  const { name } = field || { name: 0 };
  return (
    <FormListStyles gutter={16}>
      <Col md={6} xs={24}>
        <FormInput
          name={[name, 'name']}
          required
          placeholder={"Tên trường"}
        />
      </Col>
      <Col md={14} xs={24}>
        <FormInput
          required
          name={[name, 'value']}
          placeholder="Gía trị"
        />
      </Col>
      <Col md={4} xs={24}>
        <FormInput
          name={[name, 'type']}
          required={false}
          placeholder={"Loại trường (vd: icon, link, text...)"}
        />
      </Col>
    </FormListStyles>
  )
};

export default ProductForm;
