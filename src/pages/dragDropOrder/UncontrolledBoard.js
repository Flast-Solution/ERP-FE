/**************************************************************************/
/*  UncontrolledBoard.js                                                  */
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

import React, { useCallback } from 'react'
import Board from "@asseinfo/react-kanban";
import { Button, Input, message } from 'antd';
import RequestUtils from 'utils/RequestUtils';
import { useState, useEffect } from 'react';
import { arrayEmpty } from 'utils/dataUtils';
import { ContainerStyles } from './style';
import { useEffectAsync } from 'hooks/MyHooks';
import KanbanCard from './KanbanCard';
import { SUCCESS_CODE } from 'configs';
import { isEmpty } from 'lodash';
import { InAppEvent } from 'utils/FuseUtils';
import { HASH_POPUP } from 'configs/constant';
import '@asseinfo/react-kanban/dist/styles.css'

const { Search } = Input;
const generateCart = (details, order, status) => {
  let items = [];
  for (let detail of details) {
    let { id, code, status: detailStatus } = detail;
    if (detailStatus !== status) {
      continue;
    }
    let item = { id, title: code, ...detail, order }
    items.push(item);
  }
  return items;
}

const generateDataInBoard = (datas, columns) => {
  if (arrayEmpty(columns) || isEmpty(datas)) {
    return []
  }
  /* Build item in card */
  let items = [];
  for (let column of columns) {
    const { id, name, ...rest } = column;
    const orders = datas[column.id];
    let item = {
      ...rest,
      id,
      searchQuery: '',
      title: column.name,
      cards: []
    }
    for (let order of orders) {
      const { details, ...orderRest } = order;
      const items = generateCart(details, orderRest, column.id);
      item.cards = item.cards.concat(items);
    }
    items.push(item);
  }
  return items;
};

const UncontrolledBoard = () => {

  const [ dataOrigin, setDataOrigin ] = useState([]);
  const [ dataInBoard, setDataInBoard ] = useState([]);
  const [ listStatus, setListStatus ] = useState([]);

  useEffectAsync(async () => {
    const dataStatus = await RequestUtils.GetAsList("/order-status/fetch");
    setListStatus(dataStatus);
  }, [])

  useEffectAsync(async () => {
    if (arrayEmpty(listStatus)) {
      return;
    }
    const kanban = await RequestUtils.Get("/order/fetch-kanban");
    const dataGenerate = generateDataInBoard(kanban.data, listStatus);
    setDataInBoard(dataGenerate);
    setDataOrigin(dataGenerate);
  }, [listStatus])

  const handleColumnSearch = async (value, { columnId }) => {

    const column = dataInBoard[columnId - 1];
    const { id: status } = column;
    const orders = await RequestUtils.GetAsList("/order/fetch-kanban-detail", { customerPhone: value, status });
    let kanban = { [status]: orders };

    let orderStatus = listStatus.filter(i => i.id === status) ?? [];
    const dataGenerate = generateDataInBoard(kanban, orderStatus);
    let filteredCards = dataGenerate.find(i => i.id === status)?.cards ?? [];

    setDataInBoard((prev) => prev.map((col) => {
      if (col.id !== columnId) {
        return col;
      }
      if (value.trim()) {
        return { ...col, cards: filteredCards, searchQuery: value };
      } else {
        const originalCards = dataOrigin.find((originCol) => originCol.id === columnId)?.cards || [];
        return { ...col, cards: originalCards, searchQuery: '' };
      }
    }));
  }

  const handleCardDragEnd = useCallback(async (board, card, source, destination) => {
    const { id: detailId, order } = card;
    const column = dataInBoard[destination.toColumnId - 1];
    const { message: msg, errorCode } = await RequestUtils.Post("/order/update-status-order", {}, {
      orderId: order.id,
      detailId,
      statusId: column.id
    });
    if (errorCode !== SUCCESS_CODE) {
      message.error(msg);
    }
  }, [dataInBoard]);

  const boardKey = JSON.stringify(dataInBoard.map(col => ({
    id: col.id,
    cards: col.cards.map(card => card.id),
    searchQuery: col.searchQuery
  })));

  const onClickAddStatus = () => InAppEvent.emit(HASH_POPUP, {
    hash: "order.add.status",
    title: "Cập nhật trạng thái đơn hàng",
    data: {
      onSave: (values) => setListStatus(values),
      listStatus
    }
  });

  return (
    <ContainerStyles>
      <div style={{ display: 'flex', justifyContent: 'end', marginBottom: 20 }}>
        <Button type="primary" onClick={onClickAddStatus}>Cấu hình trạng thái qui trình</Button>
      </div>
      <Board
        key={boardKey}
        initialBoard={{ columns: dataInBoard }}
        renderColumnHeader={
          (column) => <RenderHeaderSearch column={column} handleColumnSearch={handleColumnSearch} />
        }
        onCardDragEnd={handleCardDragEnd}
        renderCard={(card) => <KanbanCard {...card} />}
      />
    </ContainerStyles>
  )
}

const RenderHeaderSearch = ({ column, handleColumnSearch }) => {

  const [text, setText] = useState("");
  useEffect(() => {
    setText(column.searchQuery || '');
  }, [column.searchQuery]);

  return <>
    <p className='title' style={{ backgroundColor: column.color || 'unset' }}>{column.title}</p>
    <div style={{ margin: '15px 0px' }}>
      <Search
        placeholder="Tìm mã hoặc SĐT..."
        onChange={({ target }) => setText(target.value)}
        value={text}
        onSearch={(value) => handleColumnSearch(value, { columnId: column.id })}
        onPressEnter={(e) => handleColumnSearch(e.target.value, { columnId: column.id })}
        allowClear
        style={{ width: '100%' }}
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  </>
}

export default UncontrolledBoard
