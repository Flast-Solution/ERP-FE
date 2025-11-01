/**************************************************************************/
/*  FileUploadView.js                                                     */
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

import { useState, useEffect } from "react";
import { Col, Tag, Popconfirm } from "antd";
import { DeleteOutlined } from '@ant-design/icons';

const FileUploadView = ({
	files = [],
	multiPathFile,
	onRemoveFile = (file) => file,
	onRemoveMultiPathFile = (value) => value
}) => {

	const [multiPaths, setmultiPaths] = useState([]);
	useEffect(() => {
		let files = multiPathFile.map(f => f.name);
		setmultiPaths(files);
	}, [multiPathFile]);

	const onDelete = (name) => {
		if (String(name).startsWith("http")) {
			onRemoveFile(name);
		} else {
			onRemoveMultiPathFile(name)
		}
	}

	const onClick = (file) => {
		if (String(file).startsWith("http")) {
			window.open(file, '_blank');
		}
	}

	return [...multiPaths, ...files].map((file, key) =>
		<Col span={8} key={key}>
			<Tag
				color="#108ee9"
				icon={
					<Popconfirm
						title="Bạn có chắc muốn xóa File này ?"
						onConfirm={() => onDelete(file)}
						okText="Yes"
						cancelText="No"
					>
						<DeleteOutlined />
					</Popconfirm>
				}
			>
				<span onClick={() => onClick(file)} >
					{file.split("/").filter(Boolean).pop()}
				</span>
			</Tag>
		</Col>
	)
}

export default FileUploadView;