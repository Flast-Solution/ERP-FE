/**************************************************************************/
/*  dataUtils.js                                                          */
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

import i18next from 'i18next';
import { random } from "lodash";
import { InAppEvent } from "utils/FuseUtils";
import { ACTIONS, CHANGE_STORE } from "configs";
import moment from 'moment';
import dayjs from 'dayjs';

export const formatDataI18n = (displayName, name) => {
    return displayName?.[i18next.language] || name;
};

export const f5List = (apiPath = '') => InAppEvent.emit(CHANGE_STORE, {
    type: ACTIONS.F5_LIST,
    data: { apiPath, random: random() }
});

export const dataArray = (ret) => {
    const { errorCode, data } = ret;
    return errorCode === 200 ? data : [];
}

export const dataAsObj = (ret) => {
    const { errorCode, data } = ret;
    return errorCode === 200 ? data : {};
}

export const arrayNotEmpty = (data) => Array.isArray(data) && data.length > 0;
export const arrayEmpty = (data) => !arrayNotEmpty(data);

export function decodeProperty(obj, propertys = []) {
    if (arrayNotEmpty(obj)) {
        obj.forEach(elm => decodeProperty(elm, propertys));
        return obj;
    }
    if (!obj || typeof obj !== 'object') {
        return obj;
    }
    for (let p of propertys) {
        const value = obj[p];
        if (value && typeof value === 'string') {
            obj[p] = JSON.parse(value);
        }
    }
    return obj;
}

export function encodeProperty(obj, propertys = []) {
    if (!obj || typeof obj !== 'object') {
        return obj;
    }
    if (!arrayNotEmpty(propertys)) {
        return JSON.stringify(obj);
    }
    for (let k of propertys) {
        const value = obj[k];
        if (value && typeof value === 'object') {
            obj[k] = JSON.stringify(value);
        }
    }
    return obj;
}

/* dateFormatForm(entity, ['startTime', 'endTime'], 'HH:mm') */
export const dateFormatForm = (entity, propertes = [], format) => {
    if (!entity || !propertes) {
        return;
    }
    for (let k of propertes) {
        const value = entity[k];
        if (value && (typeof value === 'string' || typeof value === 'number')) {
            entity[k] = dayjs(new Date(value), format);
        }
    }
}

export const dateFormatOnSubmit = (entity, propertes = [], format = "YYYY-MM-DD HH:mm:ss") => {
	if(typeof(entity) !== 'object') {
		return dayjs(entity).format(format);
	}
	for(let k of propertes) {
		const value = entity[k];
		if(value) {
			entity[k] = dayjs(value).format(format);
		}
	}
	return entity;
}

export const formatTime = (text, fm = "DD-MM-YYYY") => text ? moment(new Date(text)).format(fm) : 'N/a';
export const formatMoney = (x) => x ? x.toLocaleString('it-IT') + ' đ' : '0 đ';
export const calVat = ({ total, vatPercent }) => (total || 0) * (vatPercent / 100);
