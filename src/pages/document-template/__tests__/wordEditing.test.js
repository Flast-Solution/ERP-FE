import {prepareWordDocument,commitWordDocument} from '@erp/shared-ui/components/DocumentTemplateEditor/html/wordEditing';
import {normalizeHtmlDefinition} from '@erp/shared-ui/components/DocumentTemplateEditor/html/model';
const definition={html:'<div class="document sales-contract"><div class="line"><div><span data-field="B6"></span></div></div><div class="line"><div><span data-field="B7"></span></div></div><p><span data-field="customer"></span></p><table><tbody><tr data-repeat="items"><td><span data-field="product"></span></td></tr></tbody></table></div>',css:'',fields:{B6:{mode:'manual',value:'Căn cứ bộ luật',allowedModes:['manual']},B7:{mode:'manual',value:'và có hiệu lực',allowedModes:['manual']},customer:{mode:'binding',path:'customer.name',label:'Khách hàng',allowedModes:['binding']},product:{mode:'binding',path:'productName',repeatId:'items',label:'Sản phẩm',allowedModes:['binding']}},repeats:{items:{source:'customerOrder.details'}}};
test('joins split fixed text into an editable paragraph while retaining dynamic data tokens',()=>{
 const prepared=prepareWordDocument(definition),doc=new DOMParser().parseFromString(prepared.html,'text/html');
 expect(doc.querySelector('p').textContent).toBe('Căn cứ bộ luật và có hiệu lực');
 expect(prepared.fields.B6).toBeUndefined();
 expect(doc.querySelector('[data-field="customer"]').getAttribute('contenteditable')).toBe('false');
 expect(doc.querySelector('[data-repeat="items"]')).not.toBeNull();
});
test('persists direct text edits and table structure without storing preview token labels',()=>{
 const prepared=prepareWordDocument(definition);
 const edited=prepared.html.replace('Căn cứ bộ luật','Nội dung được sửa trực tiếp');
 const saved=normalizeHtmlDefinition(commitWordDocument(definition,edited,prepared.fields));
 expect(saved.html).toContain('Nội dung được sửa trực tiếp');
 expect(saved.html).not.toContain('[Khách hàng]');
 expect(saved.fields.customer.path).toBe('customer.name');
 expect(saved.fields.product.repeatId).toBe('items');
 expect(saved.html).toContain('erp-word-template');
});
test('recovers literal token labels and prevents preview labels from being persisted',()=>{
 const broken={...definition,html:'<div class="document sales-contract"><p>[Sales Contract C40]</p><p>[Sales Contract C78]</p><p>[Sales Contract C79]</p></div>',fields:{}};
 const prepared=prepareWordDocument(broken),saved=normalizeHtmlDefinition(commitWordDocument(broken,prepared.html,prepared.fields));
 expect(saved.fields.C40.path).toBe('contractCommodity');
 expect(saved.fields.C78.value).toBe('MIDORI APPAREL VIETNAM CO.,LTD');
 expect(saved.html).not.toContain('[Sales Contract');
 expect(saved.html).toContain('data-field="C40"');
});
