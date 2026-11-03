'use strict';
// Decimal arithmetic: 16 significant digits, half-up, without binary float rounding.
const pow10=n=>10n**BigInt(n);
class Decimal{
 constructor(c,s=0){this.c=c;this.s=s;this.normalize();}
 normalize(){if(this.c===0n){this.s=0;return;}while(this.s>0&&this.c%10n===0n){this.c/=10n;this.s--;}}
 static parse(text){const parts=text.split('.');return new Decimal(BigInt((parts[0]||'0')+(parts[1]||'')),(parts[1]||'').length).round();}
 round(){const neg=this.c<0n;let a=neg?-this.c:this.c;const cut=a.toString().length-16;if(cut>0){const p=pow10(cut);a=(a+p/2n)/p;this.s-=cut;if(this.s<0){a*=pow10(-this.s);this.s=0;}this.c=neg?-a:a;}this.normalize();return this;}
 add(b){const s=Math.max(this.s,b.s);return new Decimal(this.c*pow10(s-this.s)+b.c*pow10(s-b.s),s).round();}
 neg(){return new Decimal(-this.c,this.s);}
 mul(b){return new Decimal(this.c*b.c,this.s+b.s).round();}
 div(b){if(b.c===0n)throw Error('لا يمكن القسمة على صفر');const negative=(this.c<0n)!==(b.c<0n);const a=this.c<0n?-this.c:this.c;const d=b.c<0n?-b.c:b.c;const q=(a*pow10(b.s+240))/(d*pow10(this.s));return new Decimal(negative?-q:q,240).round();}
 toString(){let a=(this.c<0n?-this.c:this.c).toString();if(this.s){a=a.padStart(this.s+1,'0');a=a.slice(0,-this.s)+'.'+a.slice(-this.s);}return(this.c<0n?'-':'')+a;}
}
function evaluate(source){
 if(!source)throw Error('أدخل عملية أولاً');if(source.length>180)throw Error('العملية طويلة جداً');let pos=0;
 function number(){const start=pos;let dot=false,digit=false;while(pos<source.length){const c=source[pos];if(/[0-9]/.test(c)){digit=true;pos++;}else if(c==='.'&&!dot){dot=true;pos++;}else break;}if(!digit)throw Error('أكمل الرقم أو العملية');return Decimal.parse(source.slice(start,pos));}
 function factor(){const negative=source[pos]==='-';if(negative)pos++;let value,percent=false;if(source[pos]==='('){pos++;const g=sum();value=g.value;percent=g.percent;if(source[pos]!==')')throw Error('أغلق القوس قبل الحساب');pos++;}else value=number();while(source[pos]==='%'){value=value.div(new Decimal(100n));percent=true;pos++;}return{value:negative?value.neg():value,percent};}
 function product(){let item=factor();while(source[pos]==='*'||source[pos]==='/'){const op=source[pos++],rhs=factor();item={value:op==='*'?item.value.mul(rhs.value):item.value.div(rhs.value),percent:false};}return item;}
 function sum(){let total=product();while(source[pos]==='+'||source[pos]==='-'){const op=source[pos++],item=product();const rhs=item.percent?total.value.mul(item.value):item.value;total={value:total.value.add(op==='-'?rhs.neg():rhs),percent:false};}return total;}
 const result=sum().value;if(pos!==source.length)throw Error('إدخال غير صالح');const text=result.toString();if(text.length>220)throw Error('النتيجة أكبر من الحد المدعوم');return text;
}
const field=document.querySelector('#expression'),result=document.querySelector('#result'),message=document.querySelector('#message'),context=document.querySelector('#context');
let solved=false;
const normalize=s=>s.replace(/[٠-٩]/g,c=>String(c.charCodeAt(0)-1632)).replace(/[۰-۹]/g,c=>String(c.charCodeAt(0)-1776)).replace(/×/g,'*').replace(/[÷]/g,'/').replace(/[−–]/g,'-').replace(/[٫,،]/g,'.').replace(/٪/g,'%').replace(/\s/g,'');
function notice(text,error=false){message.textContent=text;message.classList.toggle('error',error);}
function preview(){solved=false;context.textContent='العملية الحالية';notice('');if(!field.value){result.textContent='0';notice('اكتب عملية أو استخدم الأزرار');return;}try{result.textContent=evaluate(field.value);}catch(e){result.textContent='—';}}
function calculate(){try{const expr=field.value;const answer=evaluate(expr);field.value=answer;result.textContent=answer;context.textContent=expr.replace(/\*/g,'×').replace(/\//g,'÷')+' =';notice('تم الحساب');solved=true;field.scrollLeft=field.scrollWidth;}catch(e){notice(e.message,true);}}
function insert(text){let start=field.selectionStart??field.value.length,end=field.selectionEnd??start;if(solved&&/^[0-9.(]$/.test(text)){field.value='';start=end=0;}solved=false;if(field.value.length-(end-start)+text.length>180){notice('العملية طويلة جداً',true);return;}field.setRangeText(text,start,end,'end');preview();field.scrollLeft=field.scrollWidth;}
function press(key){if(key==='AC'){field.value='';solved=false;context.textContent='جاهزة للحساب';result.textContent='0';notice('اكتب عملية أو استخدم الأزرار');return;}if(key==='='){calculate();return;}if(key==='DEL'){let start=field.selectionStart??field.value.length,end=field.selectionEnd??start;if(start===end)start=Math.max(0,start-1);field.setRangeText('',start,end,'end');preview();return;}if(key==='PAREN'){const left=field.value.slice(0,field.selectionStart??field.value.length);const balance=[...left].reduce((n,c)=>n+(c==='('?1:c===')'?-1:0),0);if(balance>0&&/[0-9)%]$/.test(left))insert(')');else insert(/[0-9)%]$/.test(left)?'*(':'(');return;}if(key==='('&&/[0-9)%]$/.test(field.value.slice(0,field.selectionStart??field.value.length)))insert('*(');else insert(key);}
document.querySelectorAll('[data-key]').forEach(button=>{button.addEventListener('pointerdown',event=>event.preventDefault());button.addEventListener('click',()=>{button.classList.remove('pulse');void button.offsetWidth;button.classList.add('pulse');press(button.dataset.key);});});
field.addEventListener('input',()=>{const raw=field.value,pos=field.selectionStart;field.value=normalize(raw);const next=normalize(raw.slice(0,pos)).length;field.setSelectionRange(next,next);preview();});
field.addEventListener('paste',event=>{event.preventDefault();insert(normalize(event.clipboardData.getData('text')));});
document.addEventListener('keydown',event=>{if(event.ctrlKey||event.metaKey||event.altKey)return;if(event.key==='Escape'){event.preventDefault();press('AC');return;}if(event.key==='Enter'||event.key==='='){if(event.target.tagName==='BUTTON'&&event.key==='Enter')return;event.preventDefault();calculate();return;}if(event.target===field)return;if(event.target.tagName==='SUMMARY')return;const key=normalize(event.key);if(/^[0-9.+\-*/()%]$/.test(key)){event.preventDefault();press(key);}else if(event.key==='Backspace'||event.key==='Delete'){event.preventDefault();press('DEL');}});
