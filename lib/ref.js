import { track, trigger } from "./effect.js";
import { reactive } from "./reactive.js";
import { hasChanged, isArray, isObject } from "./share.js";
// 将普通的类型转化为对象，对象中有一个value属性指向原来的值，在获取这个值时进行依赖收集，改变值时执行回调
export function ref(value) {
  // 将普通类型转化为对象
  return createRef(value)
}
export function shallowRef(value) {
  return createRef(value,true)
}
function createRef(value,shallow=false) {
  return new RefImpl(value,shallow)
}
// 将一个对象的某一个属性转为对象,这个对象中有value属性指向原来的值，如果该属性是响应式的，那么转换后也是响应式的，反之相反
function toRef(target,key) {
  return ObjectRefImpl(target,key);
}
// 将对象中所有的属性转化为对象，转化后的对象有一个value属性指向原来的值
function toRefs(target) {
  let ret = isArray(target)?new Array(target.length):{};
  for(const key in target) {
    ret[key] = toRef(target,key);
  }
  return ret;
}
function toRefs(target) {}
const convert = (value)=>isObject(value)?reactive(value):value;
class RefImpl{
  __v_isRef = true; // 标识是通过ref创建的
  constructor(rawValue,_shallow=false) {
    this._rawValue = rawValue
    // 如果是深度的，并且是对象时 需要reactive进行包裹，避免对象里面属性不是响应式的
    this._value = _shallow?rawValue:convert(rawValue);
  }
  // 需要进行依赖收集
  get value() {
    track(this,"value")
    return this._value
  }
  // 需要将收集的依赖进行更新
  set value(newVal) {
    let oldValue = this._rawValue;
    if(hasChanged(newVal,oldValue)) {
      this._rawValue = newVal
      this._value = newVal;
      // this._value = this._shallow?newVal:convert(newVal)
      trigger(this,"SET","value",oldValue,newVal)
    }
  }
}

class ObjectRefImpl {
  __v_isRef = true;
  constructor(target,key) {
    this.target = target;
    this._key = key;
  }

  get value() {
    return this.target[this._key];
  }
  set value(newValue) {
    this.target[this._key] = newValue
  }
}