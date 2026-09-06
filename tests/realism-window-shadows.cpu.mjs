import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { test } from 'node:test';
import ts from 'typescript';
import * as three from 'three';

// Actual Runtime, PreparationBudget and shadow adapter; controlled asset/driver boundary.
const root = path.resolve(process.env.QA_WORLD_SOURCE_ROOT || process.env.QA_SOURCE_ROOT || process.cwd());
function load(relative, dependencies = {}) {
  const source = ts.transpileModule(fs.readFileSync(path.join(root, relative), 'utf8'), {
    compilerOptions: { module:ts.ModuleKind.CommonJS, target:ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports = {};
  vm.runInNewContext(source, { exports, require(id) {
    assert.ok(Object.hasOwn(dependencies,id), `Unmapped dependency ${id}`); return dependencies[id];
  }, performance,setTimeout,clearTimeout,AbortController,HTMLImageElement:class{},
  console:{...console,warn(){}},window:{setTimeout,removeEventListener(){}},document:{hidden:false,removeEventListener(){}} });
  return exports;
}
const journey = load('lib/world/journey.ts');
const { PreparationBudget } = load('lib/world/PreparationBudget.ts');
const shadows = load('lib/world/windowShadows.ts',{three});
async function until(predicate) {
  const end=performance.now()+2000;
  while(!predicate()){assert.ok(performance.now()<end,'Controlled shader stage was not reached');await new Promise(resolve=>setTimeout(resolve,5));}
}
function fixture(quality='high') {
  const handles=[],events=[],statuses=[];
  let factoryCalls=0,compiled=0,failCompile=false,holdPrograms=false;
  function handle() {
    const group=new three.Group(),geometry=new three.BoxGeometry(),material=new three.MeshStandardMaterial();
    material.userData.variant='initial';
    const ownerCompile=shader=>{shader.fragmentShader+='\n// room-owner-hook';};
    const ownerKey=function(){return `room-owner-${this.userData.variant}`;};
    material.onBeforeCompile=ownerCompile;material.customProgramCacheKey=ownerKey;
    const value={group,material,ownerCompile,ownerKey,expectedCompile:ownerCompile,expectedKey:ownerKey,disposals:0,targets:[],anchors:{room:{position:[.6,2.11,2.5],target:[-.25,1.51,-1.55]}},
      dispose(){
        assert.equal(material.onBeforeCompile,value.expectedCompile,'Restore callback before disposing owner material');
        assert.equal(material.customProgramCacheKey,value.expectedKey,'Restore key before disposing owner material');
        value.disposals++;events.push('room-dispose');geometry.dispose();material.dispose();group.clear();
      }};
    group.add(new three.Mesh(geometry,material));handles.push(value);return value;
  }
  const {WorldRuntime}=load('lib/world/WorldRuntime.ts',{
    three,'./journey':journey,'./PreparationBudget':{PreparationBudget},'./windowShadows':shadows,
    './art/createWorldArt':{},'./environment':{},'./input':{},'./projection':{},
    '@/components/room/createRoom':{createRoom(){factoryCalls++;return Promise.resolve(handle());}},
  });
  const runtime=Object.create(WorldRuntime.prototype),environmentTexture=new three.Texture();
  Object.assign(runtime,{
    disposed:false,gpuDisposed:false,ready:true,roomReady:false,room:null,roomPromise:null,restoreRoomShadows:null,
    state:{destination:'about',mode:'world',device:null,navigationToken:1},quality,scene:new three.Scene(),camera:new three.PerspectiveCamera(),
    contextLost:false,contextGeneration:0,environmentReady:false,environmentRecovery:null,
    preparation:[],preparationBudgets:new Set(),uploadedTextures:new WeakSet(),bitmapImages:new Map(),resumePreparation:new Set(),
    art:{neighbourhood:new three.Group(),house:new three.Group(),dispose(){events.push('art-dispose');}},
    environment:{group:new three.Group(),setRoom(){},reflectionIntensity:.1,prepareReflections(){return environmentTexture;},dispose(){events.push('environment-dispose');environmentTexture.dispose();}},
    renderer:{info:{programs:[{program:{}}]},compile(pending){
      const materials=new Set();pending.traverse(object=>{if(object.isMesh)materials.add(object.material);});
      for(const material of materials){
        const shader={vertexShader:three.ShaderLib.standard.vertexShader,fragmentShader:three.ShaderLib.standard.fragmentShader};
        material.onBeforeCompile(shader,{});
        assert.ok(shader.fragmentShader.includes('// room-owner-hook'));
        if(quality==='high'){
          assert.equal((shader.fragmentShader.match(/float getWindowAreaShadow\(/g)||[]).length,1);
          assert.ok(shader.fragmentShader.includes('getShadow( directionalShadowMap[ i ],'));
          assert.ok(shader.fragmentShader.includes('getWindowAreaShadow( spotShadowMap[ i ],'));
        }else assert.equal(shader.fragmentShader.includes('getWindowAreaShadow'),false);
      }
      compiled++;if(failCompile)throw new Error('Controlled GPU compile failure');
    },getContext(){return{getExtension:()=>holdPrograms?{COMPLETION_STATUS_KHR:1}:null,getProgramParameter:()=>false};},
    initTexture(){},dispose(){events.push('renderer-dispose');},forceContextLoss(){events.push('force-loss');},domElement:{removeEventListener(){},remove(){}}},
    observer:{disconnect(){}},reduced:{removeEventListener(){}},callbacks:{status(value){statuses.push(value);},fallback(){events.push('fallback');}},
    stop(){},hideProjection(){},wake(){},warmScene(){},
  });
  return{runtime,handles,events,statuses,get factoryCalls(){return factoryCalls;},get compiled(){return compiled;},fail(value){failCompile=value;},hold(value){holdPrograms=value;},cleanup(){runtime.dispose();}};
}

test('actual failed Room compile restores adapter before disposal; fresh retry installs one filter',async()=>{
  const f=fixture();
  try{
    f.fail(true);await f.runtime.ensureRoom();
    assert.equal(f.handles[0].disposals,1);assert.equal(f.runtime.restoreRoomShadows,null);assert.equal(f.runtime.roomPromise,null);assert.equal(f.runtime.roomReady,false);
    f.fail(false);await f.runtime.ensureRoom();
    assert.equal(f.factoryCalls,2);assert.equal(f.runtime.roomReady,true);assert.equal(f.handles[1].group.parent,f.runtime.scene);
    const material=f.handles[1].material;material.userData.variant='retry-variant';
    assert.equal(material.customProgramCacheKey(),'room-owner-retry-variant:world-window-area-v1-32');
    f.runtime.dispose();f.runtime.dispose();
    assert.deepEqual(f.handles.map(handle=>handle.disposals),[1,1]);assert.equal(f.runtime.restoreRoomShadows,null);
  }finally{f.cleanup();}
});

test('actual Runtime disposal while shader completion stalls restores helper before owner teardown',async()=>{
  const f=fixture();
  try{
    f.hold(true);const pending=f.runtime.ensureRoom();await until(()=>f.compiled===1);
    assert.notEqual(f.handles[0].material.onBeforeCompile,f.handles[0].ownerCompile);
    f.runtime.dispose();await pending;
    assert.equal(f.handles[0].disposals,1);assert.equal(f.runtime.restoreRoomShadows,null);
    assert.equal(f.statuses.includes('ready'),false);assert.equal(f.runtime.preparationBudgets.size,0);
  }finally{f.cleanup();}
});

test('actual Runtime cleanup preserves later owner callback and key replacements',async()=>{
  const f=fixture();
  try{
    await f.runtime.ensureRoom();const handle=f.handles[0];
    handle.expectedCompile=()=>{};handle.expectedKey=()=> 'later-owner';
    handle.material.onBeforeCompile=handle.expectedCompile;handle.material.customProgramCacheKey=handle.expectedKey;
    f.runtime.dispose();assert.equal(handle.disposals,1);assert.equal(f.runtime.restoreRoomShadows,null);
  }finally{f.cleanup();}
});

test('low-quality acquisition leaves owner shaders unpatched through success and disposal',async()=>{
  const f=fixture('low');
  try{
    await f.runtime.ensureRoom();assert.equal(f.runtime.roomReady,true);assert.equal(f.runtime.restoreRoomShadows,null);
    assert.equal(f.handles[0].material.onBeforeCompile,f.handles[0].ownerCompile);
    assert.equal(f.handles[0].material.customProgramCacheKey,f.handles[0].ownerKey);
    f.runtime.dispose();assert.equal(f.handles[0].disposals,1);
  }finally{f.cleanup();}
});
