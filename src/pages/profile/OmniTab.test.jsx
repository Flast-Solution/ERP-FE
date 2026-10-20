/* eslint-disable testing-library/no-unnecessary-act */
import React,{act} from 'react'
import {createRoot} from 'react-dom/client'
import OmniTab from './OmniTab'
import {omniApi} from '@/services/omniService'
import {saveCallCenterExtension} from './callCenterService'
const mockSetMe=jest.fn()
let mockUser
jest.mock('@/hooks/useGetMe',()=>()=>({user:mockUser,setMe:mockSetMe}))
jest.mock('@/services/omniService',()=>({omniApi:{fetchChannels:jest.fn(),startConnect:jest.fn()}}))
jest.mock('./callCenterService',()=>({saveCallCenterExtension:jest.fn()}))
jest.mock('antd',()=>{
 const React=require('react')
 return {Button:({children,onClick,disabled})=><button onClick={onClick} disabled={disabled}>{children}</button>,Input:props=><input id={props.id} value={props.value} disabled={props.disabled} onChange={props.onChange}/>,Modal:({open,children})=>open?<section>{children}</section>:null,Skeleton:()=>null,Tooltip:({children})=>children,message:{error:jest.fn(),success:jest.fn()}}
})
let root,container
beforeEach(()=>{jest.clearAllMocks();global.IS_REACT_ACT_ENVIRONMENT=true;mockUser={id:7,fullName:'User'};omniApi.fetchChannels.mockResolvedValue([]);container=document.createElement('div');root=createRoot(container)})
afterEach(async()=>{await act(async()=>root.unmount());delete global.IS_REACT_ACT_ENVIRONMENT})
const click=async text=>act(async()=>Array.from(container.querySelectorAll('button')).find(button=>button.textContent===text).click())
test('shows sipExt input only after choosing call center and saves to the current user',async()=>{
 saveCallCenterExtension.mockResolvedValue('company_1001')
 await act(async()=>root.render(<OmniTab/>))
 expect(container.textContent).toContain('Kênh tương tác')
 await click('Nối kênh')
 expect(container.querySelector('input')).toBeNull()
 await act(async()=>Array.from(container.querySelectorAll('button')).find(button=>button.textContent.includes('Cấu hình máy nhánh')).click())
 const input=container.querySelector('input')
 expect(input).not.toBeNull()
 await act(async()=>{
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'company_1001')
  input.dispatchEvent(new Event('input',{bubbles:true}))
 })
 await click('Lưu máy nhánh')
 expect(saveCallCenterExtension).toHaveBeenCalledWith(mockUser,'company_1001')
 expect(mockSetMe).toHaveBeenCalledWith({...mockUser,sipExt:'company_1001'})
 expect(omniApi.startConnect).not.toHaveBeenCalled()
})
test('shows a configured extension and keeps failed edits out of user state',async()=>{
 mockUser={id:7,sipExt:'1001'};saveCallCenterExtension.mockRejectedValue(new Error('Save failed'))
 await act(async()=>root.render(<OmniTab/>))
 expect(container.textContent).toContain('Máy nhánh: 1001')
 await click('Chỉnh sửa');await click('Lưu máy nhánh')
 expect(mockSetMe).not.toHaveBeenCalled()
 expect(container.querySelector('input').value).toBe('1001')
})
