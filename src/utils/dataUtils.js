import i18next from 'i18next';
import { random } from "lodash";
import { InAppEvent } from "@flast-erp/core/utils";
import { ACTIONS, CHANGE_STORE } from "@/configs";
import moment from 'moment';
import dayjs from 'dayjs';

export const formatDataI18n = ( displayName, name ) => {
  return displayName?.[i18next.language] || name;
};

export const f5List = (apiPath = '') =>
InAppEvent.emit(CHANGE_STORE, {
	type: ACTIONS.F5_LIST,
	data: { apiPath, random: random() }
});

export const dataArray = (ret) => {
	const { errorCode, data } = ret;
	return errorCode === 200 ? data : [];
}

export const dataObj = (ret) => {
	const { errorCode, data } = ret;
	return errorCode === 200 ? data : {};
}

export const arrayNotEmpty = (data) => Array.isArray(data) && data.length > 0;
export const arrayEmpty = (data) => !arrayNotEmpty(data);

export function decodeProperty(obj, propertys = []) {
	if(arrayNotEmpty(obj)) {
		obj.forEach(elm => decodeProperty(elm, propertys));
		return obj;
	}
	if(!obj || typeof obj !== 'object') {
		return obj;
	}
	for(let p of propertys) {
		const value = obj[p];
		if(value && typeof value === 'string') {
			obj[p] = JSON.parse(value);
		}
	}
	return obj;
}

export function encodeProperty(obj, propertys = []) {
	if(!obj || typeof obj !== 'object') {
		return obj;
	}
	if(!arrayNotEmpty(propertys)){
		return JSON.stringify(obj);
	}
	for(let k of propertys) {
		const value = obj[k];
		if(value && typeof value === 'object') {
			obj[k] = JSON.stringify(value);
		}
	}
	return obj;
}

/* dateFormatForm(entity, ['startTime', 'endTime'], 'HH:mm') */
export const dateFormatForm = (entity, propertes = [], format) => {
	if(!entity || arrayEmpty(propertes)) {
		return;
	}
	for(let k of propertes) {
		const value = entity[k];
		if(value && (typeof value === 'string' || typeof value === 'number')) {
			entity[k] = dayjs(value, format);
		}
	}
	return entity;
}

export const dateFormatOnSubmit = (entity, propertes = [], format = "YYYY-MM-DD HH:mm:ss") => {
	if(typeof(entity) !== 'object') {
		return entity;
	}
	for(let k of propertes) {
		const value = entity[k];
		if(value) {
			entity[k] = dayjs(value).format(format).valueOf();
		}
	}
	return entity;
}

export const formatTime = (text, fm = "DD-MM-YYYY") => text ? moment(new Date(text)).format(fm) : 'N/a';
export const formatMoney = (x) => x ? x.toLocaleString('it-IT', {style : 'currency', currency : 'VND'}) : '0'.concat(' VND');
export const calVat = ({ total, vatPercent }) => (total || 0) * (vatPercent / 100);

export const getDiscountAmount = ({
	discountValue,
	discountUnit,
	estimatedAmount
}) => {
  return formatMoney(discountAsNumber({ discountUnit, discountValue, total: estimatedAmount }));
};

export const discountAsNumber = ({ discountUnit, discountValue, total }) => {
	if(!discountUnit || !discountValue) {
		return 0;
	}
	return discountUnit === 'percent' ? (Number(discountValue) / 100) * Number(total) : discountValue
}

export const checkValidParentInboxId = (inboxId) => inboxId && inboxId !== 'parent';
export const checkValidInboxId = (inboxId) => inboxId && inboxId !== 'inbox';
export const getLocationIdLocal = () => localStorage.getItem('locationId');
export const getBusinessIdLocal = () => localStorage.getItem('businessId');

export const getUserFullNameInbox = (item) => {
  return item?.customer?.fullName || item?.user?.fullName || item?.senderName;
};

export const getUserAvatarInbox = (item) => {
  return item?.customer?.avatar || item?.user?.avatar || item?.senderAvatar;
};

export const formatTimeSubmit = (time) =>
  time ? moment(time).toISOString() : null;

export const string2Object = (data) => {
	if(!data) {
		return [ '(empty)', null ];
	}
	if(typeof(data) !== 'string') {
		return [ '(invalid)', null ];
	}
	try {
		let obj = JSON.parse(data);
		return [ null, obj ];
	} catch (e) {
		return [ e, null ];
	}
}
