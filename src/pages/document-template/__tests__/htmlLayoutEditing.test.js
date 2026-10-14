import {readLayout,updateLayout} from '@erp/shared-ui/components/DocumentTemplateEditor/html/layoutEditing';
import {normalizeHtmlDefinition} from '@erp/shared-ui/components/DocumentTemplateEditor/html/model';
const definition={html:'<div class="line"><span data-field="name"></span></div><table><tbody><tr><td><span data-field="price"></span></td></tr></tbody></table>',css:'',fields:{name:{mode:'manual',value:'Name',allowedModes:['manual']},price:{mode:'manual',value:'10',allowedModes:['manual']}},repeats:{}};
test('paragraph indentation survives normalization and reload without altering bindings',()=>{
 const edited=updateLayout(definition,'name','paragraph','padding-left','40px');
 const restored=normalizeHtmlDefinition(JSON.parse(JSON.stringify(edited)));
 expect(readLayout(restored,'name','paragraph')['padding-left']).toBe('40px');
 expect(restored.fields.name.value).toBe('Name');
 const doc=new DOMParser().parseFromString(restored.html,'text/html');
 expect(doc.querySelector('.line').classList.contains('erp-layout-edited')).toBe(true);
});
test('table borders apply consistently to cells and can be reset',()=>{
 const edited=updateLayout(definition,'price','table','border-width','1px');
 const doc=new DOMParser().parseFromString(edited.html,'text/html');
 expect(doc.querySelector('td').style.borderWidth).toBe('1px');
 expect(readLayout(updateLayout(edited,'price','table','border-width',''),'price','table')['border-width']).toBeUndefined();
});
