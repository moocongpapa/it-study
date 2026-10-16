/** Tiny deterministic teaching models. These are not hardware/model benchmarks. */
export function readFourBits(value: number, signed = false) {
  return signed && value >= 8 ? value - 16 : value;
}
export function logicResult(kind: "AND" | "OR" | "NOT", a: boolean, b: boolean) {
  return kind === "AND" ? a && b : kind === "OR" ? a || b : !a;
}
export const CLASSIFICATION_SAMPLES = [
  {score:.1,positive:false},{score:.2,positive:false},{score:.25,positive:true},
  {score:.4,positive:false},{score:.48,positive:false},{score:.52,positive:true},
  {score:.62,positive:true},{score:.7,positive:false},{score:.8,positive:true},
  {score:.87,positive:true},{score:.9,positive:false},{score:.96,positive:true},
];
export function classificationCounts(threshold: number) {
  const counts={tp:0,fp:0,fn:0,tn:0};
  for(const sample of CLASSIFICATION_SAMPLES) {
    if(sample.score>=threshold) { if(sample.positive) counts.tp++; else counts.fp++; }
    else { if(sample.positive) counts.fn++; else counts.tn++; }
  }
  return counts;
}
export function averageAndMedian(values: number[]) {
  const sorted=[...values].sort((a,b)=>a-b), middle=Math.floor(sorted.length/2);
  return {mean:values.reduce((a,b)=>a+b,0)/values.length,median:sorted.length%2?sorted[middle]:(sorted[middle-1]+sorted[middle])/2};
}
export function queueTurn(waiting: number, incoming: number, capacity: number) {
  const finished=Math.min(waiting+incoming,capacity);
  return {finished,waiting:waiting+incoming-finished};
}
export function vectorSimilarities(degrees: number) {
  const radians=degrees*Math.PI/180, x=Math.cos(radians),y=Math.sin(radians);
  return {x,y,scores:[x,y,.8*x+.6*y]};
}
export function neuronOutput(a:number,b:number,w1:number,w2:number,bias:number) {
  return 1/(1+Math.exp(-(a*w1+b*w2+bias)));
}
export function trainNeuron(a:number,b:number,target:number,w1:number,w2:number,bias:number) {
  const prediction=neuronOutput(a,b,w1,w2,bias),gradient=prediction-target,rate=.1;
  return {w1:w1-rate*gradient*a,w2:w2-rate*gradient*b,bias:bias-rate*gradient};
}
export function scheduleExample(apiDays:number) {
  const integrationStart=2+Math.max(apiDays,2);
  return {integrationStart,total:integrationStart+1,apiCritical:apiDays>=2,uiCritical:apiDays<=2};
}
export const ATTENTION_EXAMPLE = [
  [.55,.1,.1,.25],[.1,.55,.05,.3],[.1,.1,.5,.3],[.35,.35,.1,.2],
];
