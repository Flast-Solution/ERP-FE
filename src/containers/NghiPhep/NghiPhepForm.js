import { Row, Col, Form, Button, Upload } from 'antd';
import FormHidden from 'components/form/FormHidden';
import FormTextArea from 'components/form/FormTextArea';
import FormDatePicker from 'components/form/FormDatePicker';
import FormSelect from 'components/form/FormSelect';
import CustomButton from 'components/CustomButton';
import { UploadOutlined, DeleteTwoTone, HourglassOutlined } from '@ant-design/icons';
import { NGHI_PHEP_META } from 'configs/constant';
import FormInput from 'components/form/FormInput';
import { FormContextCustom } from 'components/context/FormContextCustom';
import { useCallback, useContext, useEffect, useState } from 'react';
import RequestUtils from 'utils/RequestUtils';
import { arrayNotEmpty, string2Object } from 'utils/dataUtils';
import { getFileName } from 'utils/fileUtils';
import { GATEWAY } from 'configs';
import { isArray } from 'lodash';

const NghiPhepForm = () => {

  const { form, record, updateRecord } = useContext(FormContextCustom);
  const onClickPreview = useCallback(() => {
    const preview = form.getFieldValue('preview');
    form.setFieldValue('preview', !preview ? true : false);
  }, [form]);

  const [uploadList, setUploadFiles] = useState([]);
  useEffect(() => {
    const [err, files] = string2Object(record.file);
    let nFiles = [];
    if (!err && arrayNotEmpty(files)) {
      for (let file of files) {
        let nameFile = getFileName(file);
        nFiles.push({ uid: nameFile, name: nameFile, status: 'done', url: GATEWAY + file });
      }
    }
    setUploadFiles(nFiles);
    /* eslint-disable-next-line */
  }, [record]);

  const uploadsProps = {
    onRemove: (file) => {
      const [err, files] = string2Object(record.file);
      if (!err && arrayNotEmpty(files)) {
        let nFiles = [];
        for (let f of files) {
          if (f && !f.endsWith(file.name)) {
            nFiles.push(f);
          }
        }
        updateRecord({ file: JSON.stringify(nFiles) });
      }
    },
    customRequest: (options) => RequestUtils.uploadSigFile({
      ...options,
      api: "leave-of-absence/upload-file",
      onSuccessUploadServer: (file) => {
        if (!file) {
          return;
        }
        let [err, files] = string2Object(record.file);
        if (!err && isArray(files)) {
          if (!files.includes(file)) {
            files.push(file);
          }
        } else {
          files = [file];
        }
        updateRecord({ file: JSON.stringify(files) });
      }
    }),
    fileList: uploadList,
    showUploadList: {
      showDownloadIcon: true,
      downloadIcon: 'Download',
      showRemoveIcon: true,
      removeIcon: <DeleteTwoTone />
    }
  };

  return (
    <Row gutter={16} style={{ marginTop: 20 }}>
      <FormHidden name={'id'} />
      <FormHidden name={'preview'} />
      <Col md={24} xs={24}>
        <FormTextArea
          rows={5}
          required
          name={'note'}
          label="Lý do xin nghỉ/Reason for leave"
          placeholder="Reason for leave"
        />
      </Col>
      <Col md={12} xs={24}>
        <FormDatePicker
          format='YYYY-MM-DD HH:mm'
          showTime
          required
          name='startedAt'
          label="Từ ngày/From Date"
          placeholder="From Date"
        />
      </Col>
      <Col md={12} xs={24}>
        <FormDatePicker
          format='YYYY-MM-DD HH:mm'
          required
          showTime
          name='endAt'
          label="Đến ngày/To Date"
          placeholder="To Date"
        />
      </Col>

      <Form.Item
        noStyle
        shouldUpdate={(prevValues, curValues) => prevValues.type !== curValues.type}
      >
        { /* type = 5 Lý do khác */}
        {({ getFieldValue }) => getFieldValue('type') === 5 ? (
          <Col md={24} xs={24}>
            <FormInput
              name='textOther'
              label='Hình thức nghỉ khác'
              required
            />
          </Col>
        ) : <span />}
      </Form.Item>

      <Col md={12} xs={24}>
        <FormSelect
          required
          name={'type'}
          label="Loại nghỉ/Type of leave"
          placeholder="Type of leave"
          valueProp='id'
          titleProp='name'
          resourceData={NGHI_PHEP_META}
        />
      </Col>
      <Col md={12} xs={24}>
        <FormInput
          required
          name={'numberOff'}
          label="Số ngày nghỉ/Number of day off"
          placeholder="Number of day off"
        />
      </Col>
      <Col md={12} xs={24}>
        <Upload {...uploadsProps}>
          <Button icon={<UploadOutlined />}>Upload Files</Button>
        </Upload>
      </Col>
      <Col md={12} xs={24}>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Form.Item
            noStyle
            shouldUpdate={(prevValues, curValues) => prevValues.preview !== curValues.preview}
          >
            {({ getFieldValue }) => {
              const preview = getFieldValue('preview');
              return (
                <CustomButton
                  onClick={() => onClickPreview()}
                  title={`(${preview ? 'Close' : 'Preview'})`}
                  icon={<HourglassOutlined />}
                  type='primary'
                />
              )
            }}
          </Form.Item>
          <CustomButton
            htmlType="submit"
            title="Gửi duyệt"
            color="danger"
            variant="solid"
            style={{ marginLeft: 20 }}
          />
        </div>
      </Col>
    </Row>
  )
}

export default NghiPhepForm;