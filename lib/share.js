export const isObject = (target)=> typeof target =="object" && target!=null;
export const isFunction = (val)=> typeof val === 'function';
export const isArray = Array.isArray;
export const isString = (val)=> typeof val === 'string';
export const isNumber = (val)=> typeof val === 'number';
export const isIntegerKey = (val)=>parseInt(val)+'' === val;

const has = Object.prototype.hasOwnProperty;
export const hasOwn = (target,key)=>has.call(target,key);
export const hasChanged = (oldValue,newValue)=> oldValue === newValue

export const isSymbol = (val) => typeof val === 'symbol'
