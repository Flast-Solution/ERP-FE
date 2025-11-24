import { useContext, useState, useRef, useImperativeHandle, forwardRef } from 'react';
import JoditEditor from 'jodit-react';
import { useEffectAsync } from '@/hooks/MyHooks';
import { FormContextCustom } from '@/components/context/FormContextCustom';

const FormJoditEditor = forwardRef(({ 
  name,
  initContent = '',
  placeholder = 'Nhập nội dung'
 }, ref) => {

  const { form } = useContext(FormContextCustom);
  const [ editorValue, setEditorValue ] = useState('');
  const joditInstance = useRef(null);

  const config = {
    placeholder: placeholder || '',
    minHeight: 700,
    spellcheck: true,
    enter: "BR"
  };

  const handleChange = (newContent) => {
    const content = newContent || '';
    form.setFieldValue(name, content);
  };

  /* Hàm public để chèn ảnh (sẽ được gọi từ ngoài) */
  useImperativeHandle(ref, () => ({
    insertImage: (imageUrl) => {
      if (!joditInstance.current) {
        return;
      }
      const editor = joditInstance.current;
      const imgHtml = `
        <p style="text-align: center;">
          <img src="${imageUrl}" style="max-width: 600px; height: auto;" />
        </p>
      `;
      try {
        editor.selection.insertHTML(imgHtml);
        handleChange(editor.value);
      } catch (err) {
        console.error('Insert failed:', err);
      }
    }
    /* eslint-disable-next-line */
  }), [form, name]);

  useEffectAsync(() => {
    setEditorValue(initContent);
  }, [initContent]);

  return (
   <JoditEditor
      value={editorValue}
      config={config}
      onChange={handleChange}
      ref={(editor) => {
        joditInstance.current = editor;
      }}
    />
  )
});

export default FormJoditEditor;