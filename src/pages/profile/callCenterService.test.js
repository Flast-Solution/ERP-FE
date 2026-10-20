import { RequestUtils } from '@flast-erp/core/utils'
import { saveCallCenterExtension } from './callCenterService'
jest.mock('@flast-erp/core/utils', () => ({RequestUtils:{Post:jest.fn()}}))
beforeEach(()=>jest.clearAllMocks())
test('saves sipExt for the existing user without sending authentication secrets',async()=>{
 RequestUtils.Post.mockResolvedValue({success:true})
 await expect(saveCallCenterExtension({id:7,fullName:'User',userProfiles:[{id:3}],accessToken:'secret',password:'secret'},' company_1001 ')).resolves.toBe('company_1001')
 expect(RequestUtils.Post).toHaveBeenCalledWith('/auth/user-bussiness/save-user',{id:7,fullName:'User',userProfiles:[{id:3}],sipExt:'company_1001'},{id:7})
})
test('rejects empty extensions and does not report failed API updates as saved',async()=>{
 await expect(saveCallCenterExtension({id:7},' ')).rejects.toThrow('Vui lòng nhập máy nhánh')
 expect(RequestUtils.Post).not.toHaveBeenCalled()
 RequestUtils.Post.mockResolvedValue({success:false,message:'No permission'})
 await expect(saveCallCenterExtension({id:7},'1001')).rejects.toThrow('No permission')
})
