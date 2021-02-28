// Proxy(target,baseHandler)
// 是不是仅读的,仅读的属性set时会报异常
// 是不是深度的

import { reactive, readonly } from "./reactive.js";
import {track,trigger} from './effect.js'
import { hasOwn, isArray, isIntegerKey, isObject, isSymbol } from "./share.js";

export const mutableHandlers={
  get:createGetter(),
  set:createSetter()
}

export const shallowHandlers={
  get:createGetter(false,true),
  set:createSetter()
}

export const readonlyHandlers={
  get:createGetter(true),
  set:(target,key)=>{
    console.warn(`In ${target} ${key} can not be set`);
    return true;
  }
}

export const shallowReadonlyHandlers={
  get:createGetter(true,true),
  set:(target,key)=>{
    console.warn(`In ${target} ${key} can not be set`);
    return true;
  }
}



function createGetter(isReadonly = false,shallow = false) {
  return function(target,key,receiver) {
    const res = Reflect.get(target,key,receiver);
    if(isSymbol(key)) { // 读取数组时 会收集symbol，需要进行过滤
      return res;
    }
    if(!isReadonly) {
      // 收集依赖，数据变化后更新视图
      track(target,key,receiver);
    }

    if(shallow) { // 浅响应式
      return res
    }

    if(isObject(res)) { // 如果结果是对象,vue2是直接进行递归进行依赖收集，vue3是在取值时才进行依赖收集
      return isReadonly?readonly(res):reactive(res);
    }
    return res;
  }
}
// shallowReadonly 仅第一层不能更改
function createSetter(shallow = false) {
  return function(target,key,value,receiver) {
    // 获取猿来的值
    const oldValue = target[key];
    /* 判断原来是否已经存在该key，分数组和对象2中情况
    数组时需要判断更改的下标是否在原来的数组长度之内
     */
    const hadKey = isArray(target) && isIntegerKey(key)?Number(key)<target.length:
    hasOwn(target,key);
    const res =  Reflect.set(target,key,value,receiver)
    if(!hadKey) { // 说明是添加
      trigger(target,"ADD",key,value)
    }else { // 说明是修改
      trigger(target,"SET",key,value,oldValue)
    }
    
    // 属性更新时通知更新
    // trigger(target,key);
    return res;
  }
}