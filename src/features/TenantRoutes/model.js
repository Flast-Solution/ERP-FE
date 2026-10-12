import { matchPath } from 'react-router-dom';
export const ROUTES = [
 ['/sale/hateco','Tổng quan đơn hàng','OrderOverview'],['/sale/order','Danh sách đơn hàng','OrderList'],['/sale/order/*','Đơn hàng khác','OrderList'],['/sale/order/after-sale','Sau bán hàng','OrderList'],['/sale/order/cancelled','Đơn huỷ','OrderList'],['/sale/ban-hang','Tạo bán hàng','SalesEditor'],['/sale/ban-hang/:orderId','Sửa bán hàng','SalesEditor'],['/sale/co-hoi','Cơ hội','Opportunities'],['/sale/co-hoi/*','Cơ hội khác','Opportunities'],['/sale/co-hoi/seven-day','Cơ hội quá hạn','Opportunities'],['/sale/order-production','Theo dõi sản xuất','ProductionTracking'],['/sale/order/progress','Tiến trình','WorkflowProgress'],['/sale/order/progress/:orderId','Tiến trình đơn hàng','WorkflowProgress'],['/sale/production/lots/create','Nhập LOT','ManufacturingLotCreate'],['/material/bom','Lệnh sản xuất','ProductionOrders'],
].map(([route,label,module])=>({route,label,module}));
export const emptyConfig = bizId => ({bizId,revision:0,remotes:[],routes:[]});
export function validateConfig(config,bizId) {
 if(String(config?.bizId)!==String(bizId))throw new Error('Cấu hình không thuộc doanh nghiệp hiện tại');
 if(!Array.isArray(config.remotes)||!Array.isArray(config.routes))throw new Error('Cấu hình route không hợp lệ');
 const ids=new Set(), paths=new Set();
 config.remotes.forEach(remote=>{if(!remote.id||ids.has(remote.id))throw new Error('Mã remote phải duy nhất');ids.add(remote.id);const url=new URL(remote.remoteEntry);if(!['http:','https:'].includes(url.protocol)||url.username||url.password)throw new Error('URL remote phải là HTTP/HTTPS, không chứa thông tin đăng nhập');if(!/^[a-zA-Z_$][\w$]*$/.test(remote.scope))throw new Error('Scope remote không hợp lệ');});
 config.routes.forEach(row=>{if(!ROUTES.some(r=>r.route===row.route)||paths.has(row.route))throw new Error('Route không được hỗ trợ hoặc bị trùng');paths.add(row.route);if(!ids.has(row.remoteId))throw new Error('Không tìm thấy remote của route');if(!/^[\w/-]+$/.test(row.module))throw new Error('Module không hợp lệ');if(typeof row.enabled!=='boolean')throw new Error('Trạng thái route không hợp lệ');});return config;
}
export function resolveRoute(config,pathname,page) {
 const matches=config.routes.filter(r=>matchPath({path:r.route,end:true},pathname)).sort((a,b)=>{const score=r=>r.route.split('/').reduce((n,s)=>n+(s==='*'?0:s.startsWith(':')?1:3),0);return score(b)-score(a)||Number(a.route.includes('*'))-Number(b.route.includes('*'));});
 const row=matches[0];if(!row?.enabled)return null;
 const remote=config.remotes.find(r=>r.id===row.remoteId);if(!remote)throw new Error('Route tham chiếu remote không tồn tại');
 const primary=ROUTES.find(r=>r.route===row.route)?.module;
 return {...remote,module:page&&page!==primary?page:row.module};
}
