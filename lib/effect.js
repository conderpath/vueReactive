import { isArray, isIntegerKey } from "./share.js";

export function effect(fn,options) {
  const effect = createReactiveEffect(fn, options={})
  if (!options.lazy) {
    effect()
  }
  return effect
}
let activeEffect;// 存储当前的effect
let effectStack = [];// 收集的依赖栈
let uid = 0;
// 收集依赖时避免 activeEffect在这种情况下对应不上，所以在执行完成之后 eg
/*
effect(()=>{ // effect1
  state.name; // effect1
  effect(()=>{ // effect2
    state.age;  // effect2
  });
  state.sex;  // effect1
})
*/
function createReactiveEffect(fn,options) {
  const effect = function reactiveEffect(){
    // 此处try,finally避免在函数执行过程中出错，导致当前活动的activeEffect对应不上
    if(!effectStack.includes(effect)) { // 如果当前栈中已经存在了，就不继续添加了
      try{
        activeEffect = effect;
        effectStack.push(effect);
        fn(); // 函数执行时会取值，进行依赖收集，将该值和activeEffect进行绑定
      }finally{ // 执行完成需要将活动的effect置为外层的effect
        effectStack.pop();
        activeEffect = effectStack[effectStack.length-1];
      }
    }
  }
  effect.uid = uid++; // 用来标识每一个effect
  effect._isEffect = true; // 用于标识这是一个响应式的effect
  effect.raw = fn //保留effect对应的原函数
  effect.options = options;
  return effect;
}
/*
进行依赖收集，即将target中的key和当前activeEffect进行关联,当key发生变化时，更新收集到的依赖
eg:target = {name:10,age:10},依赖如下格式
{
  target:{
    name:[effect1,effect2],
    age:[effect]
  }
}
*/
const targetMap = new WeakMap(); // 响应式的依赖关系
// const 
export function track(target,key,receiver) {
  // 此属性没有收集依赖，因为没有在effect中使用
  if(activeEffect===undefined) { 
    return
  }
  // 针对数组时，页面直接显示数组，会传一个key为symbole的key，进行过滤
  let depsMap = targetMap.get(target)
  if(!depsMap) { // 第一次收集时，暂时不存在进行初始化
    targetMap.set(target,(depsMap = new Map()));
  }
  // 获取当前key中是否已经存在依赖
  let deps = depsMap.get(key);
  if(!deps) {
    depsMap.set(key,(deps = new Set()));
  }
  // 在当前target下 该key没有收集到此依赖时，需要进行依赖收集
  if (!deps.has(activeEffect)) {
    deps.add(activeEffect);
  }
  // console.log(targetMap)
}
/* 通知依赖进行更新,
1.可能是新增的属性  types:ADD
2.修改原来的属性  types:SET
*/export function trigger(target,types,key,newValue,oldValue) {
  const depsMap = targetMap.get(target);
  console.log(depsMap)
  if(depsMap) {
    // 将key中对应的effect全部存到一个新的集合中，最后进行遍历执行
    // 由于不同的key可能会对应同一个effect，所以需要定义成set进行去重
    const effects = new Set();
    const add = (deps=>{
      if(deps) {
        deps.forEach(effect=>effects.add(effect));
      }
    })
    // 如果修改的是数组的长度,则影响比较大，需要进行hook处理
    if("length" === key && isArray(target)) {
      depsMap.forEach((deps,key)=>{
        /* 如果对应的长度有依赖收集,或者页面中使用数组中的元素下标大于等于该长度时  则需要收集更新
          const state = reactive({arr:[1,2,3]})
          effect(()=>{
            app.innerHTML = state.arr[2]+state.arr.length
          })
          // 修改了数组长度为1，但是页面中收集了数组下标为2的  以及数组的下标
          state.length = 1

        */
      // 1.如果收集的索引中存在length属性
      // 2.如果更改的索引 小于收集的索引
        if(key==='length' || key>=newValue) { 
          add(deps)
        }
      })
    }else { // 可能时对象
      if(key!==undefined) { // 说明是types是set时
        // 如果以前收集过的 需要进行更新，没有收集过的add(undefined),不会进行更新
        add(depsMap.get(key));
      }
      // 如果修改某一个索引值?
      /*
        const state = reactive({arr:[1,2,3]})
        effect(()=>{
          app.innerHTML = state.arr // 此时会收集length的effect
        })
        setTimeout(()=>{
          state.arr[100] = 10
        })
      */
      switch(types) {
        case 'ADD':
          // 如果数组长度的更新
          if(isArray(target) && isIntegerKey(key)) {
            // 如果页面中存在length的effect，则需要effect添加
            add(depsMap.get("length"))
          }
      }
    }
  
    // 获取当前key对应的effect
    effects.forEach(effect => {
      effect()
    });
  }
}