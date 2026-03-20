import { GATEWAY } from 'configs';
import axios from 'axios';
import { SUCCESS_API_CODE } from 'configs/constant';
import fileDownload from 'js-file-download';
import { result } from 'lodash';

class RequestUtils {

	static encodeQueryData(data) {
		if (!data) {
			return '';
		}
		const ret = [];
		for (let d in data) {
			if (!data[d]) {
				continue;
			}
			ret.push(encodeURIComponent(d) + '=' + encodeURIComponent(data[d]));
		}
		return ret.length > 0 ? ('?' + ret.join('&')) : '';
	}

	static httpRequest(input, service, method = 'GET', params = '') {
		const _uri = GATEWAY + service;
		let getOrPost;
		if (method === 'GET') {
			getOrPost = axios.get(_uri + this.encodeQueryData(input));
		} else {
			getOrPost = axios.post(_uri + this.encodeQueryData(params), input);
		}
		return getOrPost.then(({ data }) => {
			return data;
		}).catch(({ response }) => {
			return response.data;
		});
	}

	static Get(
		service,
		input = ''
	) {
		return this.httpRequest(input, service, 'GET');
	}

	static Post(
		service,
		input = '',
		params = ''
	) {
		return this.httpRequest(input, service, 'POST', params);
	}

	static getJsonFromUrl(url) {
		if (!url) return {};
		var query = url.substr(1);
		var result = {};
		query.split("&").forEach(function (part) {
			var item = part.split("=");
			result[item[0]] = decodeURIComponent(item[1]);
		});
		return result;
	}

	static uploadSigFile = ({
		onSuccess,
		onError,
		file,
		onProgress = (progress) => progress,
		onSuccessUploadServer = (values) => values,
		api
	}) => {
		const fmData = new FormData();
		const config = {
			headers: { "content-type": "multipart/form-data" },
			onUploadProgress: event => {
				onProgress({ percent: (event.loaded / event.total) * 100 }, file);
			}
		};
		fmData.append("files", file);
		axios.post(GATEWAY + "/" + api, fmData, config).then(({ data: ret }) => {
			const { data, errorCode } = ret;
			onSuccess(file);
			if (errorCode === SUCCESS_API_CODE && (data?.fileName || '') !== '') {
				onSuccessUploadServer(data.fileName);
			}
		}).catch(err => {
			const error = new Error(err.message);
			onError({ event: error });
		});
	}

	static downloadFile = (
		service,
		params,
		fileName
	) => {
		let result;
		const _uri = GATEWAY + service;
		result = axios.post(_uri, params, { responseType: 'blob' });

		return result.then((data) => {
			if (data) {
				fileDownload(data, `${fileName}.xls`);
			}
		}).catch(err => {
			return err;
		});
	}
}

export default RequestUtils;
