import {isObject} from './share.js'
import {
  mutableHandlers,
  shallowHandlers,
  readonlyHandlers,
  shallowReadonlyHandlers
} from './baseHandlers.js'


export function reactive(target) {
  return createReactiveObject(target,false,mutableHandlers)
}
// 浅响应式，即只对第一层进行响应式
export function shallowReactive(target) {
  return createReactiveObject(target,false,shallowHandlers)
}
// 只读响应式，即无法进行修改
export function readonly(target) {
  return createReactiveObject(target,true,readonlyHandlers)
}
// 浅响应式 并且第一层只读
export function shallowReadonly(target) {
  return createReactiveObject(target,true,shallowReadonlyHandlers)
}

// 是不是只读 是不是深度  函数柯里化
const reactiveMap = new WeakMap(); // 会自动垃圾回收，不会引起内存泄漏
const readonlyMap = new WeakMap();
function createReactiveObject(target,isReadonly=false,baseHandler) {
  if(!isObject(target)) {
    console.warn("不支持非对象")
    return target
  }
  const map = isReadonly?reactiveMap:readonlyMap;
  // 判断是否已经 被代理过了
  const exitProxy = map.get(target);

  if(exitProxy) { // 如果已经代理了 直接返回
    return exitProxy
  }
  const proxy = new Proxy(target,baseHandler);
  map.set(target,proxy); // 将被代理的对象和代理结果缓存起来
  return proxy;
}