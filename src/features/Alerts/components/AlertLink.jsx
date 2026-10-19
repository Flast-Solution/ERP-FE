import React from 'react';
import { Button, Tooltip } from 'antd';
import { BellOutlined } from '@ant-design/icons';
import { openBusinessAlert } from '../entrypoint';
export default function AlertLink({entityId,entityKind}) {
  if(entityId==null)return null;
  return <Tooltip title="Cảnh báo của đối tượng"><Button size="small" aria-label="Xem cảnh báo" icon={<BellOutlined/>} onClick={event=>{event.stopPropagation();openBusinessAlert({entityId,entityKind})}}/></Tooltip>;
}
