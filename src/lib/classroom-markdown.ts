const start = "<!-- classroom-reference:start -->";
const end = "<!-- classroom-reference:end -->";
export function splitClassroomReference(body: string) {
  const a=body.indexOf(start),b=body.indexOf(end,a+start.length);
  if(a<0||b<a)return {before:body,reference:null,after:""};
  return {before:body.slice(0,a),reference:body.slice(a+start.length,b).trim(),after:body.slice(b+end.length)};
}
