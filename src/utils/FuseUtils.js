/**************************************************************************/
/*  FuseUtils.js                                                          */
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

import { CHANGE_STORE, HASH_MODAL, INAPP_NOTIFICATION_EMITTER } from 'configs';

class EventEmitter {

    constructor() {
        this.events = {};
    }

    _getEventListByName(eventName) {
        if (typeof this.events[eventName] === 'undefined') {
            this.events[eventName] = new Set();
        }
        return this.events[eventName]
    }

    on(eventName, fn) {
        this._getEventListByName(eventName).add(fn);
    }

    once(eventName, fn) {
        const self = this;
        const onceFn = function (...args) {
            self.removeListener(eventName, onceFn);
            fn.apply(self, args);
        };
        this.on(eventName, onceFn);
    }

    emit(eventName, ...args) {
        this._getEventListByName(eventName).forEach(function (fn) {
            fn.apply(this, args);
        }.bind(this));
    }

    addEventListener(eventName, fn) {
        this.on(eventName, fn)
    }

    removeListener(eventName, fn) {
        this._getEventListByName(eventName).delete(fn);
    }
}

class FuseUtils {

    static EventEmitter = EventEmitter;
    static hasPermission(authArr, enabled) {
        if (authArr === '*') {
            return true;
        } else if ((authArr || '') === '') {
            return true;
        } else if (authArr.length === 0) {
            return true;
        }
        return enabled;
    }

    static generateRoutesFromConfigs(configs, defaultAuth) {
        let allRoutes = [];
        configs.forEach((config) => {
            allRoutes = [
                ...allRoutes,
                ...this.setRoutes(config, defaultAuth)
            ]
        });
        return allRoutes;
    }

    static setRoutes(config, defaultAuth) {
        let routes = [...config.routes];
        if (config.settings || config.auth) {
            routes = routes.map((route) => {
                let auth = config.auth ? [...config.auth] : defaultAuth || null;
                auth = route.auth ? [...auth, ...route.auth] : auth;
                return {
                    ...route,
                    settings: { ...config.settings, ...route.settings },
                    auth
                };
            });
        }
        return [...routes];
    }
}

class AppEvent extends EventEmitter {
    normalSuccess(content, title = null) {
        this.emit(INAPP_NOTIFICATION_EMITTER, { type: 'success', content, title });
    }
    normalInfo(content, title = null) {
        this.emit(INAPP_NOTIFICATION_EMITTER, { type: 'info', content, title });
    }
    normalError(content, title = null) {
        this.emit(INAPP_NOTIFICATION_EMITTER, { type: 'error', content, title });
    }
    modal(content, type) {
        this.emit(INAPP_NOTIFICATION_EMITTER, { type, content, cate: 'modal' });
    }
    changeStore(data) {
        this.emit(CHANGE_STORE, data);
    }
    openDrawer = (route, { title, ...rest }) => this.emit(HASH_MODAL, {
        hash: route,
        title,
        data: rest
    });
}

export const DRAWER_ROUTE = {
    CONTRACT_FORM: 'CONTRACT_FORM'
}

export const InAppEvent = new AppEvent();
export default FuseUtils;
