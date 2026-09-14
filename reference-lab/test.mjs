import {test} from 'node:test';import assert from 'node:assert/strict';import {validate} from './analyze.mjs';
const fixture=()=>({summary:'Test',uncertainties:[],fingerprints:Object.fromEntries(['narrative','editing','product_presentation','motion','graphics'].map(x=>[x,[]])),ideas:[{start_s:0,end_s:2,keyframe_times_s:[0,1],...Object.fromEntries(['title','observed_sequence','communication_problem','creative_mechanism','adaptation_example','do_not_transfer','interpretation_caveat'].map(k=>[k,'test']))}]});
test('accept supported intervals',()=>assert.deepEqual(validate(fixture(),3),[]));
test('reject fabricated out-of-range moments',()=>{let c=fixture();c.ideas[0].end_s=9;assert.ok(validate(c,3).length)});
test('reject keyframes outside their moment',()=>{let c=fixture();c.ideas[0].keyframe_times_s=[0,9];assert.ok(validate(c,3).length)});
test('reject missing evidence category',()=>{let c=fixture();delete c.fingerprints.graphics;assert.ok(validate(c,3).length)});
