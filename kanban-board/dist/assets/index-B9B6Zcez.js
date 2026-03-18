import pt from"https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs";(function(){const n=document.createElement("link").relList;if(n&&n.supports&&n.supports("modulepreload"))return;for(const o of document.querySelectorAll('link[rel="modulepreload"]'))s(o);new MutationObserver(o=>{for(const i of o)if(i.type==="childList")for(const c of i.addedNodes)c.tagName==="LINK"&&c.rel==="modulepreload"&&s(c)}).observe(document,{childList:!0,subtree:!0});function t(o){const i={};return o.integrity&&(i.integrity=o.integrity),o.referrerPolicy&&(i.referrerPolicy=o.referrerPolicy),o.crossOrigin==="use-credentials"?i.credentials="include":o.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function s(o){if(o.ep)return;o.ep=!0;const i=t(o);fetch(o.href,i)}})();pt.initialize({startOnLoad:!1,theme:"dark",themeVariables:{primaryColor:"#334155",primaryBorderColor:"#60a5fa",primaryTextColor:"#f1f5f9",lineColor:"#64748b",secondaryColor:"#1e293b",tertiaryColor:"#0f172a"}});window.__mermaid=pt;const Ot="modulepreload",qt=function(e){return"/"+e},st={},Dt=function(n,t,s){let o=Promise.resolve();if(t&&t.length>0){let c=function(r){return Promise.all(r.map(p=>Promise.resolve(p).then(m=>({status:"fulfilled",value:m}),m=>({status:"rejected",reason:m}))))};document.getElementsByTagName("link");const l=document.querySelector("meta[property=csp-nonce]"),a=(l==null?void 0:l.nonce)||(l==null?void 0:l.getAttribute("nonce"));o=c(t.map(r=>{if(r=qt(r),r in st)return;st[r]=!0;const p=r.endsWith(".css"),m=p?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${r}"]${m}`))return;const u=document.createElement("link");if(u.rel=p?"stylesheet":Ot,p||(u.as="script"),u.crossOrigin="",u.href=r,a&&u.setAttribute("nonce",a),document.head.appendChild(u),p)return new Promise((g,h)=>{u.addEventListener("load",g),u.addEventListener("error",()=>h(new Error(`Unable to preload CSS for ${r}`)))})}))}function i(c){const l=new Event("vite:preloadError",{cancelable:!0});if(l.payload=c,window.dispatchEvent(l),!l.defaultPrevented)throw c}return o.then(c=>{for(const l of c||[])l.status==="rejected"&&i(l.reason);return n().catch(i)})},F=[{key:"todo",label:"Requirements",icon:"📋"},{key:"plan",label:"Plan",icon:"🗺️"},{key:"plan_review",label:"Review Plan",icon:"🔍"},{key:"impl",label:"Implement",icon:"🔨"},{key:"impl_review",label:"Review Impl",icon:"📝"},{key:"test",label:"Test",icon:"🧪"},{key:"done",label:"Done",icon:"✅"}],Mt={plan:"Planning",plan_review:"Plan Review",impl:"Implementing",impl_review:"Impl Review",test:"Testing"},Ie="kanban-auth-token",xe="kanban-current-view",ut="kanban-mobile-board-columns",Ut=3e4,Ht=10,Nt=10,mt="kanban-summary-cache",Ft={board:3e4,full:6e4},ht=window.matchMedia("(max-width: 768px)");function Vt(){!("serviceWorker"in navigator)||!(window.location.protocol==="https:"||window.location.hostname==="localhost"||window.location.hostname==="127.0.0.1")||window.addEventListener("load",()=>{navigator.serviceWorker.register("/sw.js").catch(n=>{console.warn("Service worker registration failed",n)})})}function Wt(e){return e==="board"||e==="list"||e==="chronicle"||e==="graph"}function Kt(e){return F.some(n=>n.key===e)}function Jt(){try{const e=localStorage.getItem(ut);if(!e)return new Set;const n=JSON.parse(e);return Array.isArray(n)?new Set(n.filter(t=>typeof t=="string"&&Kt(t))):new Set}catch{return new Set}}let S=localStorage.getItem("kanban-project"),Se=!1,C=ht.matches,A=Wt(localStorage.getItem(xe))?localStorage.getItem(xe):C?"list":"board",ue="",K=localStorage.getItem("kanban-sort")||"default",O=localStorage.getItem("kanban-hide-old")==="true",P=localStorage.getItem(Ie)||"",x=!1,_=!1,Pe=!1,ce=!C,J=Jt(),T=null,ie=null,G=null;const re=new Map,ee=new Map,le=new Map;let W=null;function te(e,n="default"){const t=document.getElementById("auth-message");t.textContent=e,t.classList.remove("error","success"),n!=="default"&&t.classList.add(n)}function U(){const n=[document.getElementById("modal-overlay"),document.getElementById("add-card-overlay"),document.getElementById("auth-overlay")].some(t=>t&&!t.classList.contains("hidden"));document.body.classList.toggle("overlay-open",n)}function me(){const e=document.getElementById("auth-btn");if(e){if(!x){e.textContent="Open",e.title="Board access is open in this environment";return}e.textContent=_?"Private":"Locked",e.title=_?"Shared token configured for this browser":"Shared token required"}}function X(e="Enter the shared access token to load the board.",n="default"){_=!1,document.getElementById("auth-overlay").classList.remove("hidden"),U();const t=document.getElementById("auth-token-input");t.value=P,te(e,n),me(),setTimeout(()=>t.focus(),0)}function he(){document.getElementById("auth-overlay").classList.add("hidden"),U(),me()}function gt(e){P=e.trim(),P?localStorage.setItem(Ie,P):localStorage.removeItem(Ie)}function qe(){document.body.classList.toggle("mobile-shell",C),document.body.classList.toggle("mobile-toolbar-open",!C||ce);const e=document.getElementById("toolbar-mobile-toggle");if(e){const n=!C||ce;e.hidden=!C,e.setAttribute("aria-expanded",String(n)),e.textContent=n?"Hide Filters":"Show Filters"}}function zt(e){C=e,C||(ce=!0),qe(),_&&A==="board"&&R()}function ft(){return window.location.hostname==="localhost"||window.location.hostname==="127.0.0.1"}function De(){ie!==null&&(window.clearInterval(ie),ie=null)}function Me(e=S,n="full"){return`${e||"__all__"}::${n}`}function Ce(e=S,n="full"){return`${mt}::${Me(e,n)}`}function Yt(e=S,n="full"){try{const t=localStorage.getItem(Ce(e,n));if(!t)return null;const s=JSON.parse(t);return!s||typeof s.fetchedAt!="number"||!s.board?null:Date.now()-s.fetchedAt>Ft[n]?(localStorage.removeItem(Ce(e,n)),null):s}catch{return null}}function Zt(e,n,t,s){try{const o={fetchedAt:Date.now(),etag:s,board:t};localStorage.setItem(Ce(e,n),JSON.stringify(o))}catch{}}function q(e=S,n){const t=n?[n]:["board","full"];for(const s of t){const o=Me(e,s);re.delete(o),ee.delete(o),le.delete(o);try{localStorage.removeItem(Ce(e,s))}catch{}}e===S&&(T=null,G=null)}function Ue(e={}){if(re.clear(),ee.clear(),le.clear(),T=null,G=null,e.persisted)try{const n=[];for(let t=0;t<localStorage.length;t+=1){const s=localStorage.key(t);s!=null&&s.startsWith(`${mt}::`)&&n.push(s)}n.forEach(t=>localStorage.removeItem(t))}catch{}}function vt(){P="",localStorage.removeItem(Ie);const e=document.getElementById("auth-token-input");e&&(e.value="")}async function Gt(){const e=new Headers;P&&e.set("X-Kanban-Auth",P);const t=await(await fetch("/api/auth/session",{method:"GET",headers:e,credentials:"same-origin"})).json().catch(()=>({}));return{authenticated:!!t.authenticated,authRequired:!!t.authRequired,mode:t.mode,source:t.source??null,reason:t.reason??null,error:t.error??null}}async function yt(e){const n=e.trim(),t=await fetch("/api/auth/session",{method:"POST",headers:{"X-Kanban-Auth":n},credentials:"same-origin"}),s=await t.json().catch(()=>({}));if(!t.ok){const o=s.reason==="invalid_token"?"Shared token is invalid.":s.reason==="token_hash_missing"?"Server auth is not configured yet.":"Board authentication failed.";throw new Error(o)}gt(n),x=!!s.authRequired,_=!0,he(),me()}async function Xt(){await fetch("/api/auth/session",{method:"DELETE",credentials:"same-origin"}).catch(()=>{}),De(),Ue({persisted:!0}),vt(),_=!x,me()}async function B(e,n={},t=!1){const s=new Headers(n.headers||{});P&&!s.has("X-Kanban-Auth")&&s.set("X-Kanban-Auth",P);const o=await fetch(e,{...n,headers:s,credentials:"same-origin"});if((o.status===401||o.status===403||o.status===503)&&!t){const i=await o.clone().json().catch(()=>({}));x=!0,_=!1,i.reason==="invalid_token"&&vt();const c=i.reason==="invalid_token"?"Stored token was rejected. Enter a valid shared token.":i.reason==="token_hash_missing"?"Server auth hash is not configured yet.":"Shared token is required for this board.";throw X(c,"error"),new Error(i.error||c)}return o}async function He(e=S){const n=e?`?project=${encodeURIComponent(e)}`:"",t=new Headers;G&&t.set("If-None-Match",G);const s=await B(`/api/board/version${n}`,{headers:t});return s.status===304?T?null:(G=null,He()):(G=s.headers.get("ETag"),s.json())}function Qt(e){return e==="board"?A==="board"&&!Oe():A==="list"||A==="chronicle"||A==="board"&&Oe()}function Oe(){return ue.trim().length>0}function en(e,n,t,s){if(!_||le.has(n))return;const o=(async()=>{try{const i=await He(s);if(!i)return;if(t&&i.version===t){T=i.version;return}q(s,e),await ne(e,{bypassTtl:!0,projectOverride:s}),S===s&&Qt(e)&&R()}catch{}finally{le.delete(n)}})();le.set(n,o)}async function ne(e="full",n={}){const t=n.projectOverride===void 0?S:n.projectOverride,s=["summary=true"];t&&s.unshift(`project=${encodeURIComponent(t)}`),e==="board"&&s.push("compact=board",`todo_limit=${Ht}`,`done_limit=${Nt}`);const o=`?${s.join("&")}`,i=Me(t,e);if(!n.bypassTtl){const m=Yt(t,e);if(m)return re.set(i,m.board),m.etag&&ee.set(i,m.etag),T=m.board.version||T,en(e,i,m.board.version||null,t),m.board}const c=new Headers,l=ee.get(i);l&&c.set("If-None-Match",l);const a=await B(`/api/board${o}`,{headers:c});if(a.status===304){const m=re.get(i);return m?(T=m.version||T,m):(ee.delete(i),ne(e,{bypassTtl:!0}))}const r=await a.json(),p=a.headers.get("ETag");return p&&ee.set(i,p),re.set(i,r),Zt(t,e,r,p),T=r.version||T,r}function tn(){ft()||ie!==null||(ie=window.setInterval(async()=>{if(!_||Se)return;const e=!document.getElementById("modal-overlay").classList.contains("hidden"),n=!document.getElementById("add-card-overlay").classList.contains("hidden");if(!(e||n))try{const t=await He();if(!t)return;if(!T){T=t.version;return}t.version!==T&&(T=t.version,R())}catch{x&&!_&&De()}},Ut))}function $t(){if(ft()){De(),Ct();return}tn()}function nn(){const e=new URL(window.location.href),n=e.searchParams.get("auth")||e.searchParams.get("token");n&&(gt(n),e.searchParams.delete("auth"),e.searchParams.delete("token"),window.history.replaceState({},"",e.toString()))}async function an(){if(nn(),P)try{return await yt(P),!0}catch(n){return X(n instanceof Error?n.message:"Board authentication failed.","error"),!1}const e=await Gt();return x=e.authRequired,_=e.authenticated||!e.authRequired,e.authRequired&&!e.authenticated?(X("Enter the shared access token to load the board."),!1):(he(),!0)}function Be(e){return e==="high"?"high":e==="medium"?"medium":e==="low"?"low":""}function bt(){localStorage.setItem(ut,JSON.stringify([...J]))}function sn(e){if(!C||J.size>0)return;const n=F.filter(t=>t.key==="todo"||t.key==="impl"||t.key!=="done"&&e[t.key].length>0).map(t=>t.key);J=new Set(n.length>0?n:["todo"]),bt()}function on(e){return!C||ue.trim()?!0:J.has(e)}function _e(e){var n;return((n=F.find(t=>t.key===e))==null?void 0:n.label)||e}function rn(e,n){return e===1?{todo:["impl"],impl:["done"],done:[]}[n]||[]:e===2?{todo:["plan"],plan:["impl","todo"],impl:["impl_review"],impl_review:["done","impl"],done:[]}[n]||[]:{todo:["plan"],plan:["plan_review","todo"],plan_review:["impl","plan"],impl:["impl_review"],impl_review:["test","impl"],test:["done","impl"],done:[]}[n]||[]}async function ln(e,n){if(!n||n===e.status)return;const t=await B(`/api/task/${e.id}?project=${encodeURIComponent(e.project)}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({status:n})});if(!t.ok){const s=await t.json().catch(()=>({}));ve(s.error||"Failed to move task");return}q(e.project),fe()}function be(e){return e?Date.now()-new Date(e).getTime()>4320*60*1e3:!1}function wt(e,n){return K==="default"?n==="done"?[...e].sort((t,s)=>{const o=(s.completed_at||"").localeCompare(t.completed_at||"");return o!==0?o:t.rank-s.rank||t.id-s.id}):[...e].sort((t,s)=>s.rank-t.rank||s.id-t.id):[...e].sort((t,s)=>K==="created_asc"?t.created_at.localeCompare(s.created_at):K==="created_desc"?s.created_at.localeCompare(t.created_at):K==="completed_desc"?(s.completed_at||"").localeCompare(t.completed_at||""):0)}function Te(){const e=ue.toLowerCase().replace(/^#/,""),n=e.length>0||O;document.body.classList.toggle("mobile-board-search",A==="board"&&C&&e.length>0),A==="board"?(document.querySelectorAll(".card").forEach(t=>{const s=!e||(()=>{var r,p,m,u;const i=t.dataset.id||"",c=((p=(r=t.querySelector(".card-title"))==null?void 0:r.textContent)==null?void 0:p.toLowerCase())||"",l=((u=(m=t.querySelector(".card-desc"))==null?void 0:m.textContent)==null?void 0:u.toLowerCase())||"",a=[...t.querySelectorAll(".tag")].map(g=>{var h;return((h=g.textContent)==null?void 0:h.toLowerCase())||""}).join(" ");return i===e||c.includes(e)||l.includes(e)||a.includes(e)})(),o=O&&t.dataset.status==="done"&&be(t.dataset.completedAt||"");t.style.display=s&&!o?"":"none"}),document.querySelectorAll(".column").forEach(t=>{const s=t.querySelectorAll(".card"),o=[...s].filter(a=>a.style.display!=="none").length,i=s.length,c=Number.parseInt(t.dataset.totalCount||`${i}`,10)||i,l=t.querySelector(".count");l&&(l.textContent=n||c!==i?`${o}/${c}`:`${c}`)})):A==="list"?(document.querySelectorAll("#list-view tbody tr").forEach(t=>{const s=!e||(()=>{var r,p,m,u;const i=t.dataset.id||"",c=((p=(r=t.querySelector(".col-title"))==null?void 0:r.textContent)==null?void 0:p.toLowerCase())||"",l=((u=(m=t.cells[5])==null?void 0:m.textContent)==null?void 0:u.toLowerCase())||"",a=[...t.querySelectorAll(".tag")].map(g=>{var h;return((h=g.textContent)==null?void 0:h.toLowerCase())||""}).join(" ");return i===e||c.includes(e)||l.includes(e)||a.includes(e)})(),o=O&&t.classList.contains("status-done")&&be(t.dataset.completedAt||"");t.style.display=s&&!o?"":"none"}),document.querySelectorAll("#list-view .list-card").forEach(t=>{const s=!e||(()=>{var r,p,m;const i=t.dataset.id||"",c=((p=(r=t.querySelector(".list-card-title"))==null?void 0:r.textContent)==null?void 0:p.toLowerCase())||"",l=((m=t.dataset.project)==null?void 0:m.toLowerCase())||"",a=[...t.querySelectorAll(".tag")].map(u=>{var g;return((g=u.textContent)==null?void 0:g.toLowerCase())||""}).join(" ");return i===e||c.includes(e)||l.includes(e)||a.includes(e)})(),o=O&&t.classList.contains("status-done")&&be(t.dataset.completedAt||"");t.style.display=s&&!o?"":"none"})):(document.querySelectorAll("#chronicle-view .chronicle-event").forEach(t=>{const s=!e||(()=>{var a,r,p;const i=t.dataset.id||"",c=((r=(a=t.querySelector(".chronicle-task-link"))==null?void 0:a.textContent)==null?void 0:r.toLowerCase())||"",l=((p=t.dataset.project)==null?void 0:p.toLowerCase())||"";return i===e||c.includes(e)||l.includes(e)})(),o=O&&be(t.dataset.completedAt||"");t.style.display=s&&!o?"":"none"}),document.querySelectorAll("#chronicle-view .chronicle-group").forEach(t=>{const s=[...t.querySelectorAll(".chronicle-event")].filter(o=>o.style.display!=="none").length;t.style.display=s>0?"":"none"}))}function ge(e){if(!e||e==="null")return[];try{const n=JSON.parse(e);return Array.isArray(n)?n:[]}catch{return[]}}function cn(e){const n=new Date(e+"Z"),s=new Date().getTime()-n.getTime(),o=Math.floor(s/864e5);return o===0?"today":o===1?"yesterday":o<7?`${o}d ago`:o<30?`${Math.floor(o/7)}w ago`:e.slice(0,10)}function N(e){if(!e||e==="null")return[];try{const n=JSON.parse(e);return Array.isArray(n)?n:[]}catch{return[]}}function dn(e){var E,H;const n=Be(e.priority),t=n?`<span class="badge ${n}">${e.priority}</span>`:"",s=e.completed_at?`<span class="badge date">${e.completed_at.slice(0,10)}</span>`:e.created_at?`<span class="badge created">${cn(e.created_at)}</span>`:"",o=!S&&e.project?`<span class="badge project">${e.project}</span>`:"",i=Mt[e.status],c=i?`<span class="badge status-${e.status}">${i}</span>`:"",l=`<span class="badge level-${e.level}">L${e.level}</span>`,a=e.current_agent?`<span class="badge agent-tag">${e.current_agent}</span>`:"",r=e.last_review_status?[]:N(e.review_comments),p=e.last_review_status||(r.length>0?(E=r[r.length-1])==null?void 0:E.status:null),m=p?`<span class="badge ${p==="approved"?"review-approved":"review-changes"}">${p==="approved"?"Approved":"Changes Req."}</span>`:e.status==="impl_review"?'<span class="badge review-pending">Awaiting Review</span>':"",u=e.last_plan_review_status?[]:N(e.plan_review_comments),g=e.last_plan_review_status||(u.length>0?(H=u[u.length-1])==null?void 0:H.status:null),h=g?`<span class="badge ${g==="approved"?"review-approved":"review-changes"}">${g==="approved"?"Plan OK":"Plan Changes"}</span>`:e.status==="plan_review"?'<span class="badge review-pending">Plan Review</span>':"",$=ge(e.tags).map(z=>`<span class="tag">${z}</span>`).join(""),d=e.note_count??N(e.notes).length,f=d>0?`<span class="badge notes-count" title="${d} note(s)">💬 ${d}</span>`:"",y=rn(e.level,e.status).map(z=>`<option value="${z}">${_e(z)}</option>`).join(""),b=y?`
      <label class="mobile-card-move card-interactive">
        <span>Move</span>
        <select class="mobile-status-select" data-id="${e.id}" data-project="${e.project}" data-current-status="${e.status}">
          <option value="${e.status}">${_e(e.status)}</option>
          ${y}
        </select>
      </label>
    `:"";return`
    <div class="${C?"card mobile-card":"card"}" ${C?'draggable="false"':'draggable="true"'} data-id="${e.id}" data-status="${e.status}" data-project="${e.project}" data-completed-at="${e.completed_at||""}">
      <div class="card-header">
        <span class="card-id">#${e.id}</span>
        ${l}
        ${t}
        ${c}
        ${a}
        <button class="card-copy-btn" data-copy="#${e.id} ${e.title}" title="Copy to clipboard">⎘</button>
      </div>
      <div class="card-title">${e.title}</div>
      <div class="card-footer">
        ${o}
        ${h}
        ${m}
        ${f}
        ${s}
      </div>
      ${b}
      ${$?`<div class="card-tags">${$}</div>`:""}
    </div>
  `}function pn(e,n,t,s,o=s.length){const i=on(e),c=wt(s,e).map(dn).join(""),l=e==="todo"?'<button class="add-card-btn" id="add-card-btn" title="Add card">+</button>':"",a=o!==s.length?`${s.length}/${o}`:`${o}`;return`
    <div class="column ${e}" data-column="${e}" data-mobile-expanded="${i}" data-total-count="${o}">
      <div class="column-header">
        <button class="column-toggle-btn" type="button" data-column-toggle="${e}" aria-expanded="${i}">
          <span class="column-toggle-label">${t} ${n}</span>
          <span class="column-toggle-meta">
            <span class="count">${a}</span>
            <span class="column-toggle-icon" aria-hidden="true">${i?"−":"+"}</span>
          </span>
        </button>
        <div class="column-header-right">
          ${l}
        </div>
      </div>
      <div class="column-body" data-column="${e}">
        ${c||'<div class="empty">No items</div>'}
      </div>
    </div>
  `}const un=/```[\s\S]*?```/g,mn=/```\w*\n?/,ot=/```$/,it=/^```mermaid\s*\n?/,hn=/\*\*(.+?)\*\*/g,gn=/`([^`]+)`/g,fn=/^\x00CB(\d+)\x00$/,vn=/^### (.+)$/,yn=/^## (.+)$/,$n=/^# (.+)$/,bn=/^[-*]\s+(.+)$/,wn=/^\d+\.\s+(.+)$/,rt=/^\|(.+)\|$/,lt=/^\|[\s:-]+\|$/;let En=0;function de(e){const n=[];let t=e.replace(un,r=>{if(it.test(r)){const p=r.replace(it,"").replace(ot,"").trim(),m=`mermaid-${++En}`;n.push(`<pre class="mermaid" id="${m}">${p}</pre>`)}else{const p=r.replace(mn,"").replace(ot,"");n.push(`<pre><code>${p}</code></pre>`)}return`\0CB${n.length-1}\0`});t=t.replace(/</g,"&lt;"),t=t.replace(hn,"<strong>$1</strong>").replace(gn,"<code>$1</code>");const s=t.split(`
`),o=[];let i=!1,c=!1;function l(){i&&(o.push("</ul>"),i=!1),c&&(o.push("</ol>"),c=!1)}let a=0;for(;a<s.length;){const r=s[a].trim(),p=r.match(fn);if(p){l(),o.push(n[parseInt(p[1])]),a++;continue}if(rt.test(r)){l();const d=[];for(;a<s.length&&rt.test(s[a].trim());)d.push(s[a].trim()),a++;if(d.length>=2){const f=lt.test(d[1]),y=f?d[0]:null,b=f?2:0;let k='<table class="md-table">';if(y){const j=y.slice(1,-1).split("|").map(E=>E.trim());k+="<thead><tr>"+j.map(E=>`<th>${E}</th>`).join("")+"</tr></thead>"}k+="<tbody>";for(let j=b;j<d.length;j++){if(lt.test(d[j]))continue;const E=d[j].slice(1,-1).split("|").map(H=>H.trim());k+="<tr>"+E.map(H=>`<td>${H}</td>`).join("")+"</tr>"}k+="</tbody></table>",o.push(k)}else o.push(`<p>${d[0]}</p>`);continue}const m=r.match(vn);if(m){l(),o.push(`<h3>${m[1]}</h3>`),a++;continue}const u=r.match(yn);if(u){l(),o.push(`<h2>${u[1]}</h2>`),a++;continue}const g=r.match($n);if(g){l(),o.push(`<h1>${g[1]}</h1>`),a++;continue}const h=r.match(bn);if(h){c&&(o.push("</ol>"),c=!1),i||(o.push("<ul>"),i=!0),o.push(`<li>${h[1]}</li>`),a++;continue}const $=r.match(wn);if($){i&&(o.push("</ul>"),i=!1),c||(o.push("<ol>"),c=!0),o.push(`<li>${$[1]}</li>`),a++;continue}l(),r===""?o.push(""):o.push(`<p>${r}</p>`),a++}return l(),o.join(`
`)}async function Ln(e){const n=window.__mermaid;if(!n)return;const t=e.querySelectorAll("pre.mermaid");if(t.length!==0)try{await n.run({nodes:t})}catch(s){console.warn("Mermaid render failed:",s)}}function we(e,n,t,s,o){if(!s&&!o)return"";const i=s?de(s):'<span class="phase-empty">Not yet documented</span>';return`
    <div class="lifecycle-phase ${t} ${o?"active":""}">
      <div class="phase-header">
        <span class="phase-icon">${n}</span>
        <span class="phase-label">${e}</span>
        <button class="phase-expand-btn" title="Expand to full screen">&#x26F6;</button>
      </div>
      <div class="phase-body">${i}</div>
    </div>
  `}function ct(e){return e.length===0?"":e.map(n=>{var t;return`
    <div class="review-entry ${n.status}">
      <div class="review-header">
        <span class="badge ${n.status==="approved"?"review-approved":"review-changes"}">
          ${n.status==="approved"?"Approved":"Changes Requested"}
        </span>
        <span class="review-meta">${n.reviewer||""} &middot; ${((t=n.timestamp)==null?void 0:t.slice(0,16))||""}</span>
      </div>
      <div class="review-comment">${de(n.comment||"")}</div>
    </div>
  `}).join("")}function In(e){return e.length===0?"":e.map(n=>{var t;return`
    <div class="review-entry ${n.status==="pass"?"approved":"changes_requested"}">
      <div class="review-header">
        <span class="badge ${n.status==="pass"?"review-approved":"review-changes"}">
          ${n.status==="pass"?"Pass":"Fail"}
        </span>
        <span class="review-meta">${n.tester||""} &middot; ${((t=n.timestamp)==null?void 0:t.slice(0,16))||""}</span>
      </div>
      ${n.lint?`<div class="test-output"><strong>Lint:</strong> <pre>${n.lint}</pre></div>`:""}
      ${n.build?`<div class="test-output"><strong>Build:</strong> <pre>${n.build}</pre></div>`:""}
      ${n.tests?`<div class="test-output"><strong>Tests:</strong> <pre>${n.tests}</pre></div>`:""}
      ${n.comment?`<div class="review-comment">${de(n.comment)}</div>`:""}
    </div>
  `}).join("")}async function Sn(e,n=1920,t=.82){return new Promise((s,o)=>{const i=new Image,c=URL.createObjectURL(e);i.onload=()=>{URL.revokeObjectURL(c);let{width:l,height:a}=i;(l>n||a>n)&&(l>a?(a=Math.round(a*n/l),l=n):(l=Math.round(l*n/a),a=n));const r=document.createElement("canvas");r.width=l,r.height=a,r.getContext("2d").drawImage(i,0,0,l,a),s(r.toDataURL("image/jpeg",t))},i.onerror=()=>{URL.revokeObjectURL(c),o(new Error("Image load failed"))},i.src=c})}async function Ee(e,n,t){var s,o;for(const i of Array.from(n)){if(!i.type.startsWith("image/"))continue;let c;try{c=await Sn(i)}catch{c=await new Promise(p=>{const m=new FileReader;m.onload=()=>p(m.result),m.readAsDataURL(i)})}const l=(o=(s=i.name.match(/\.[^.]+$/))==null?void 0:s[0])==null?void 0:o.toLowerCase(),a=l===".jpg"||l===".jpeg"||l===".png"||l===".webp"||l===".gif"||l===".svg"?i.name:i.name.replace(/\.[^.]+$/,"")+".jpg",r=await B(`/api/task/${e}/attachment?project=${encodeURIComponent(t)}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({filename:a,data:c})});if(!r.ok){const p=await r.json().catch(()=>({}));ve(p.error||`Upload failed (${r.status})`);return}}D(e,t)}async function D(e,n){var i;const t=document.getElementById("modal-overlay"),s=document.getElementById("modal-content");s.innerHTML='<div style="color:#94a3b8">Loading...</div>',t.classList.remove("hidden"),U();try{const c=n?`?project=${encodeURIComponent(n)}`:"",a=await(await B(`/api/task/${e}${c}`)).json(),r=document.querySelector(`.card[data-id="${a.id}"][data-project="${CSS.escape(a.project)}"]`);r&&r.dataset.status!==a.status&&(Ue(),R());const p=ge(a.tags),m=p.length?`<div class="modal-tags">${p.map(v=>`<span class="tag">${v}</span>`).join("")}</div>`:"",u=[`<strong>Project:</strong> ${a.project}`,`<strong>Status:</strong> ${a.status}`,`<strong>Priority:</strong> ${a.priority}`,`<strong>Created:</strong> ${((i=a.created_at)==null?void 0:i.slice(0,10))||"-"}`,a.started_at?`<strong>Started:</strong> ${a.started_at.slice(0,10)}`:"",a.planned_at?`<strong>Planned:</strong> ${a.planned_at.slice(0,10)}`:"",a.reviewed_at?`<strong>Reviewed:</strong> ${a.reviewed_at.slice(0,10)}`:"",a.tested_at?`<strong>Tested:</strong> ${a.tested_at.slice(0,10)}`:"",a.completed_at?`<strong>Completed:</strong> ${a.completed_at.slice(0,10)}`:""].filter(Boolean).join(" &nbsp;|&nbsp; "),g={1:{labels:["Req","Impl","Done"],statuses:["todo","impl","done"]},2:{labels:["Req","Plan","Impl","Review","Done"],statuses:["todo","plan","impl","impl_review","done"]},3:{labels:["Req","Plan","Plan Rev","Impl","Impl Rev","Test","Done"],statuses:["todo","plan","plan_review","impl","impl_review","test","done"]}},h=g[a.level]||g[3],$=Math.max(0,h.statuses.indexOf(a.status)),d=`
      <div class="lifecycle-progress">
        <span class="level-indicator">L${a.level}</span>
        ${h.labels.map((v,w)=>`
          <div class="progress-step ${w<$?"completed":""} ${w===$?"current":""}">
            <div class="step-dot"></div>
            <span class="step-label">${v}</span>
          </div>
        `).join('<div class="progress-line"></div>')}
      </div>
    `,f=N(a.attachments),y=f.length>0?`<div class="attachments-grid">${f.map(v=>`<div class="attachment-thumb" data-stored="${v.storedName}">
            <img src="${v.url}" alt="${v.filename}" loading="lazy" />
            <button class="attachment-remove" data-id="${e}" data-name="${v.storedName}" title="Remove">&times;</button>
            <span class="attachment-name">${v.filename}</span>
          </div>`).join("")}</div>`:"",b=a.description?de(a.description):'<span class="phase-empty">Not yet documented</span>',k=[1,2,3].map(v=>`<option value="${v}" ${v===a.level?"selected":""}>L${v}</option>`).join(""),j=`
      <div class="lifecycle-phase phase-requirement ${$===0?"active":""}">
        <div class="phase-header">
          <span class="phase-icon">📋</span>
          <span class="phase-label">Requirements</span>
          <select class="level-select" id="level-select" title="Pipeline Level">${k}</select>
          <button class="phase-edit-btn" id="req-edit-btn" title="Edit">&#9998;</button>
          <button class="phase-expand-btn" title="Expand to full screen">&#x26F6;</button>
        </div>
        <div class="phase-body" id="req-body-view">
          ${b}
          ${y}
        </div>
        <div class="phase-body hidden" id="req-body-edit">
          <textarea id="req-textarea" rows="8">${(a.description||"").replace(/</g,"&lt;")}</textarea>
          <div class="attachment-drop-zone" id="attachment-drop-zone">
            <span>📎 Drop images, paste (⌘V), or click to attach</span>
            <input type="file" id="attachment-input" accept="image/*" multiple hidden />
          </div>
          ${y?`<div id="edit-attachments">${y}</div>`:""}
          <div class="phase-edit-actions">
            <button class="phase-save-btn" id="req-save-btn">Save</button>
            <button class="phase-cancel-btn" id="req-cancel-btn">Cancel</button>
          </div>
        </div>
      </div>
    `,E=we("Plan","🗺️","phase-plan",a.plan,$===1&&!a.plan);let H="";a.decision_log&&(H=we("Decision Log","🧭","phase-decision-log",a.decision_log,!1));let z="";a.done_when&&(z=we("Done When","🎯","phase-done-when",a.done_when,!1));const _t=N(a.plan_review_comments),Ve=ct(_t);let We="";(Ve||$===2)&&(We=`
        <div class="lifecycle-phase phase-plan-review ${$===2?"active":""}">
          <div class="phase-header">
            <span class="phase-icon">🔍</span>
            <span class="phase-label">Plan Review</span>
            ${a.plan_review_count>0?`<span class="review-count">${a.plan_review_count} review(s)</span>`:""}
            <button class="phase-expand-btn" title="Expand to full screen">&#x26F6;</button>
          </div>
          <div class="phase-body">${Ve||'<span class="phase-empty">Awaiting plan review</span>'}</div>
        </div>
      `);const jt=we("Implementation","🔨","phase-impl",a.implementation_notes,$===3&&!a.implementation_notes),Bt=N(a.review_comments),Ke=ct(Bt);let Je="";(Ke||$===4)&&(Je=`
        <div class="lifecycle-phase phase-review ${$===4?"active":""}">
          <div class="phase-header">
            <span class="phase-icon">📝</span>
            <span class="phase-label">Implementation Review</span>
            ${a.impl_review_count>0?`<span class="review-count">${a.impl_review_count} review(s)</span>`:""}
            <button class="phase-expand-btn" title="Expand to full screen">&#x26F6;</button>
          </div>
          <div class="phase-body">${Ke||'<span class="phase-empty">Awaiting implementation review</span>'}</div>
        </div>
      `);const Tt=N(a.test_results),ze=In(Tt);let Ye="";(ze||$===5)&&(Ye=`
        <div class="lifecycle-phase phase-test ${$===5?"active":""}">
          <div class="phase-header">
            <span class="phase-icon">🧪</span>
            <span class="phase-label">Test Results</span>
            <button class="phase-expand-btn" title="Expand to full screen">&#x26F6;</button>
          </div>
          <div class="phase-body">${ze||'<span class="phase-empty">Awaiting test execution</span>'}</div>
        </div>
      `);const Ae=N(a.agent_log);let Ze="";if(Ae.length>0){let v=function(L){if(!L)return{name:"",model:null};const se=L.toLowerCase();for(const ke of w){const Y=se.lastIndexOf(ke);if(Y>0){let Z=Y;for(;Z>0&&(L[Z-1]==="-"||L[Z-1]==="_");)Z--;return{name:L.slice(0,Z),model:L.slice(Y)}}}return{name:L,model:null}};var o=v;const w=["opus","sonnet","haiku","gemini","copilot","gpt"],I=Ae.map(L=>{var at;const{name:se,model:ke}=v(L.agent||""),Y=L.model||ke,Z=Y?`<span class="badge model-tag model-${Y.toLowerCase()}">${Y}</span>`:"";return`
          <div class="agent-log-entry">
            <span class="agent-log-time">${((at=L.timestamp)==null?void 0:at.slice(0,16))||""}</span>
            <span class="badge agent-tag">${se||L.agent||""}</span>
            ${Z}
            <span class="agent-log-msg">${L.message||""}</span>
          </div>
        `}).join("");Ze=`
        <details class="lifecycle-phase phase-agent-log">
          <summary class="phase-header">
            <span class="phase-icon">🤖</span>
            <span class="phase-label">Agent Log</span>
            <span class="review-count">${Ae.length} entries</span>
          </summary>
          <div class="phase-body agent-log-body">${I}</div>
        </details>
      `}const Ge=N(a.notes),At=Ge.map(v=>{var w;return`
      <div class="note-entry">
        <div class="note-header">
          <span class="note-author">${v.author||"user"}</span>
          <span class="note-time">${((w=v.timestamp)==null?void 0:w.slice(0,16).replace("T"," "))||""}</span>
          <button class="note-delete" data-note-id="${v.id}" title="Delete">&times;</button>
        </div>
        <div class="note-text">${de(v.text||"")}</div>
      </div>
    `}).join(""),Rt=`
      <div class="notes-section">
        <div class="notes-header">
          <span>Notes</span>
          <span class="notes-count">${Ge.length}</span>
        </div>
        <div class="notes-list">${At}</div>
        <form class="note-form" id="note-form">
          <textarea id="note-input" rows="2" placeholder="Add a note... (supports markdown)"></textarea>
          <button type="submit" class="note-submit">Add Note</button>
        </form>
      </div>
    `;s.innerHTML=`
      <h1>#${a.id} ${a.title}</h1>
      <div class="modal-meta">${u}</div>
      ${m}
      ${d}
      <div class="lifecycle-sections">
        ${j}
        ${E}
        ${H}
        ${z}
        ${We}
        ${jt}
        ${Je}
        ${Ye}
        ${Ze}
      </div>
      ${Rt}
      <div class="modal-danger-zone">
        <button class="delete-task-btn" id="delete-task-btn">Delete Card</button>
      </div>
    `,Ln(s),s.querySelectorAll(".phase-expand-btn").forEach(v=>{v.addEventListener("click",w=>{w.stopPropagation();const I=v.closest(".lifecycle-phase");I==null||I.requestFullscreen().catch(()=>{})})});const Xe=document.getElementById("level-select");Xe.addEventListener("change",async()=>{const v=parseInt(Xe.value);await B(`/api/task/${e}?project=${encodeURIComponent(a.project)}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({level:v})}),q(a.project),D(e,a.project)}),document.getElementById("delete-task-btn").addEventListener("click",async()=>{confirm(`Delete card #${a.id} "${a.title}"?`)&&(await B(`/api/task/${e}?project=${encodeURIComponent(a.project)}`,{method:"DELETE"}),q(a.project),document.getElementById("modal-overlay").classList.add("hidden"),R())});const kt=document.getElementById("req-edit-btn"),Qe=document.getElementById("req-body-view"),et=document.getElementById("req-body-edit"),Re=document.getElementById("req-textarea"),tt=document.getElementById("req-save-btn"),Pt=document.getElementById("req-cancel-btn");kt.addEventListener("click",()=>{Qe.classList.add("hidden"),et.classList.remove("hidden"),Re.focus()}),Pt.addEventListener("click",()=>{Re.value=a.description||"",et.classList.add("hidden"),Qe.classList.remove("hidden")}),tt.addEventListener("click",async()=>{const v=Re.value;tt.textContent="Saving...",await B(`/api/task/${e}?project=${encodeURIComponent(a.project)}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({description:v})}),q(a.project),D(e,a.project)});const V=document.getElementById("attachment-drop-zone"),ae=document.getElementById("attachment-input");V&&ae&&(V.addEventListener("click",()=>ae.click()),V.addEventListener("dragover",v=>{v.preventDefault(),V.classList.add("drop-active")}),V.addEventListener("dragleave",()=>{V.classList.remove("drop-active")}),V.addEventListener("drop",async v=>{var I;v.preventDefault(),V.classList.remove("drop-active");const w=(I=v.dataTransfer)==null?void 0:I.files;w&&await Ee(e,w,a.project)}),ae.addEventListener("change",async()=>{ae.files&&await Ee(e,ae.files,a.project)})),s.addEventListener("paste",async v=>{var I;const w=Array.from(((I=v.clipboardData)==null?void 0:I.files)??[]).filter(L=>L.type.startsWith("image/"));w.length!==0&&(v.preventDefault(),await Ee(e,w,a.project))}),s.querySelectorAll(".attachment-remove").forEach(v=>{v.addEventListener("click",async w=>{w.stopPropagation();const I=v,L=I.dataset.id,se=I.dataset.name;await B(`/api/task/${L}/attachment/${encodeURIComponent(se)}?project=${encodeURIComponent(a.project)}`,{method:"DELETE"}),D(e,a.project)})});const xt=document.getElementById("note-form"),nt=document.getElementById("note-input");xt.addEventListener("submit",async v=>{v.preventDefault();const w=nt.value.trim();w&&(nt.disabled=!0,await B(`/api/task/${e}/note?project=${encodeURIComponent(a.project)}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({text:w})}),q(a.project),D(e,a.project))}),s.querySelectorAll(".note-delete").forEach(v=>{v.addEventListener("click",async w=>{w.stopPropagation();const I=v.dataset.noteId;await B(`/api/task/${e}/note/${I}?project=${encodeURIComponent(a.project)}`,{method:"DELETE"}),q(a.project),D(e,a.project)})})}catch{s.innerHTML='<div style="color:#ef4444">Failed to load</div>'}}function Et(e){if(!e)return new Date(NaN);let n=e.replace(" ","T");return n.length===10?n+="T00:00:00Z":/Z$|[+-]\d{2}:\d{2}$/.test(n)||(n+="Z"),new Date(n)}function Cn(e){const n=Et(e);if(isNaN(n.getTime()))return"Unknown";const t=n.getUTCDay()||7;n.setUTCDate(n.getUTCDate()+4-t);const s=new Date(Date.UTC(n.getUTCFullYear(),0,1)),o=Math.ceil(((n.getTime()-s.getTime())/864e5+1)/7);return`${n.getUTCFullYear()}-W${String(o).padStart(2,"0")}`}function _n(e){const n=Et(e);if(isNaN(n.getTime()))return e.slice(0,10)||"—";const t=n.toLocaleDateString(void 0,{month:"short",day:"numeric",timeZone:"UTC"}),s=n.toLocaleTimeString(void 0,{hour:"2-digit",minute:"2-digit",timeZone:"UTC",hour12:!1});return`${t}
${s}`}function jn(e){const n=Be(e.priority),t=!S&&e.project?`<span class="badge project">${e.project}</span>`:"",s=n?`<span class="badge ${n}">${e.priority}</span>`:"",o=`<span class="badge status-${e.status}">${_e(e.status)}</span>`;return`
    <div class="chronicle-event" data-id="${e.id}" data-project="${e.project}" data-completed-at="${e.completed_at||""}">
      <div class="chronicle-dot ev-completed"></div>
      <div class="chronicle-event-time">${_n(e.completed_at)}</div>
      <div class="chronicle-event-body">
        <button class="chronicle-task-link" data-id="${e.id}" data-project="${e.project}">
          #${e.id} ${e.title}
        </button>
        ${o}
        ${s}
        ${t}
      </div>
    </div>`}function Bn(e){var p,m;const n=Be(e.priority),t=n?`<span class="badge ${n}">${e.priority}</span>`:"",s=!S&&e.project?`<span class="badge project">${e.project}</span>`:"",o=`<span class="badge status-${e.status}">${_e(e.status)}</span>`,i=`<span class="badge level-${e.level}">L${e.level}</span>`,c=((p=e.created_at)==null?void 0:p.slice(0,10))||"",l=((m=e.completed_at)==null?void 0:m.slice(0,10))||"—",r=ge(e.tags).map(u=>`<span class="tag">${u}</span>`).join("");return`
    <article class="list-card status-${e.status}" data-id="${e.id}" data-project="${e.project}" data-completed-at="${e.completed_at||""}">
      <div class="list-card-top">
        <div class="list-card-meta">
          <span class="list-card-id">#${e.id}</span>
          ${o}
          ${i}
          ${t}
        </div>
        ${s}
      </div>
      <button class="list-card-title col-title" data-id="${e.id}" data-project="${e.project}">
        ${e.title}
      </button>
      <div class="list-card-dates">
        <span>Created ${c||"—"}</span>
        <span>Done ${l}</span>
      </div>
      <div class="list-card-controls">
        <label>
          <span>Status</span>
          <select class="list-status-select" data-id="${e.id}" data-field="status">
            ${F.map(u=>`<option value="${u.key}" ${u.key===e.status?"selected":""}>${u.label}</option>`).join("")}
          </select>
        </label>
        <label>
          <span>Level</span>
          <select class="list-level-select" data-id="${e.id}" data-field="level">
            ${[1,2,3].map(u=>`<option value="${u}" ${u===e.level?"selected":""}>L${u}</option>`).join("")}
          </select>
        </label>
        <label>
          <span>Priority</span>
          <select class="list-priority-select ${n}" data-id="${e.id}" data-field="priority">
            ${["high","medium","low"].map(u=>`<option value="${u}" ${u===e.priority?"selected":""}>${u[0].toUpperCase()+u.slice(1)}</option>`).join("")}
          </select>
        </label>
      </div>
      ${r?`<div class="list-card-tags">${r}</div>`:""}
    </article>
  `}async function Lt(){const e=document.getElementById("chronicle-view");try{const n=await ne("full");Ne(n.projects);const t=[];for(const c of F)for(const l of n[c.key])t.push(l);const s=t.filter(c=>!!c.completed_at).sort((c,l)=>l.completed_at.localeCompare(c.completed_at)),o=new Map;for(const c of s){const l=Cn(c.completed_at);o.has(l)||o.set(l,[]),o.get(l).push(c)}if(o.size===0){e.innerHTML=`
        <div style="display:flex;align-items:center;justify-content:center;color:#64748b;font-size:0.9rem;padding:64px">
          No completed tasks yet
        </div>`;return}const i=[...o.entries()].map(([c,l])=>{const a=l.map(jn).join("");return`
        <div class="chronicle-group">
          <div class="chronicle-week-header">${c}</div>
          <div class="chronicle-events">${a}</div>
        </div>`}).join("");e.innerHTML=`<div class="chronicle-timeline">${i}</div>`,e.querySelectorAll(".chronicle-task-link").forEach(c=>{c.addEventListener("click",l=>{l.stopPropagation();const a=parseInt(c.dataset.id),r=c.dataset.project||void 0;D(a,r)})})}catch(n){console.error("loadChronicleView failed:",n),e.innerHTML=`
      <div style="display:flex;align-items:center;justify-content:center;color:#ef4444;font-size:0.9rem;padding:48px">
        Failed to load chronicle
      </div>`}}async function It(){const e=document.getElementById("graph-view");e.innerHTML=`
    <div class="graph-placeholder">
      <div class="graph-spinner"></div>
      <p>Loading graph&hellip;</p>
    </div>`,W&&(W.disconnect(),W=null);const n={todo:"#475569",plan:"#3b82f6",impl:"#8b5cf6",impl_review:"#6366f1",plan_review:"#a855f7",test:"#f59e0b",done:"#22c55e"},t={1:4,2:7,3:10},s={high:{width:3,color:"#ef4444"},medium:{width:2,color:"#f59e0b"},low:{width:1,color:"#64748b"}};try{const[{default:o},i]=await Promise.all([Dt(()=>import("./force-graph-B6EEfo0M.js"),[]),ne("full")]),c=[];for(const d of F){const f=i[d.key];for(const y of f)c.push({...y,_status:d.key})}let l=c,a="";c.length>300&&(l=c.filter(d=>d._status!=="done"),a=`<div style="position:absolute;top:8px;left:50%;transform:translateX(-50%);z-index:10;background:#1e293b;color:#f59e0b;padding:4px 12px;border-radius:6px;font-size:0.8rem;border:1px solid #f59e0b40">${c.length} nodes — done tasks hidden for performance</div>`);const r=l.map(d=>({id:d.id,title:`#${d.id} ${d.title}`,status:d._status,level:d.level??1,tags:ge(d.tags),priority:d.priority||"medium",project:d.project})),p=new Map;for(const d of r)for(const f of d.tags){const y=f.toLowerCase();p.has(y)||p.set(y,[]),p.get(y).push(d.id)}const m=new Set,u=[];for(const[d,f]of p)for(let y=0;y<f.length;y++)for(let b=y+1;b<f.length;b++){const k=Math.min(f[y],f[b]),j=Math.max(f[y],f[b]),E=`${k}-${j}`;m.has(E)||(m.add(E),u.push({source:k,target:j,tag:d}))}e.innerHTML=a,e.style.position="relative",e.style.padding="0";const g=document.createElement("div");g.style.width="100%",g.style.height="100%",e.appendChild(g);const h=document.createElement("div");h.className="graph-tooltip",e.appendChild(h),e.addEventListener("mousemove",d=>{const f=e.getBoundingClientRect();h.style.left=`${d.clientX-f.left+12}px`,h.style.top=`${d.clientY-f.top+12}px`});const $=o()(g).backgroundColor("#0f172a").nodeId("id").nodeLabel(()=>"").nodeVal(d=>t[d.level]||t[1]).nodeCanvasObject((d,f,y)=>{const b=Math.sqrt(t[d.level]||t[1])*2,k=d.x??0,j=d.y??0;d.status==="done"&&(f.globalAlpha=.35),f.beginPath(),f.arc(k,j,b,0,2*Math.PI),f.fillStyle=n[d.status]||"#475569",f.fill();const E=s[d.priority]||s.medium;f.beginPath(),f.arc(k,j,b+E.width/2,0,2*Math.PI),f.strokeStyle=E.color,f.lineWidth=E.width/y,f.stroke(),f.globalAlpha=1}).nodePointerAreaPaint((d,f,y)=>{const b=Math.sqrt(t[d.level]||t[1])*2+2;y.beginPath(),y.arc(d.x??0,d.y??0,b,0,2*Math.PI),y.fillStyle=f,y.fill()}).onNodeClick(d=>{D(d.id,d.project)}).onNodeHover(d=>{if(g.style.cursor=d?"pointer":"default",!d){h.style.display="none";return}const f=d.tags.slice(0,3),y=f.length?`<div class="graph-tooltip-tags">${f.map(b=>`<span>${b}</span>`).join("")}</div>`:"";h.innerHTML=`
          <div class="graph-tooltip-title">${d.title}</div>
          <div class="graph-tooltip-meta">${d.status} &middot; ${d.priority} &middot; L${d.level}</div>
          ${y}`,h.style.display="block"}).linkColor(()=>"#334155").linkWidth(.5).warmupTicks(50).cooldownTime(3e3).width(e.clientWidth).height(e.clientHeight).graphData({nodes:r,links:u});W=new ResizeObserver(d=>{for(const f of d){const{width:y,height:b}=f.contentRect;y>0&&b>0&&$.width(y).height(b)}}),W.observe(e)}catch(o){console.error("loadGraphView failed:",o),e.innerHTML=`
      <div class="graph-placeholder">
        <p style="color:#ef4444;font-size:0.9rem">Failed to load graph</p>
      </div>`}}async function fe(){var n,t,s,o,i,c,l,a;const e=document.getElementById("board");try{const r=await ne(Oe()?"full":"board");sn(r),Ne(r.projects),e.innerHTML=F.map(g=>{var h;return pn(g.key,g.label,g.icon,r[g.key],((h=r.counts)==null?void 0:h[g.key])??r[g.key].length)}).join("");const p=((n=r.counts)==null?void 0:n.done)??r.done.length,m=r.total??(((t=r.counts)==null?void 0:t.todo)??r.todo.length)+(((s=r.counts)==null?void 0:s.plan)??r.plan.length)+(((o=r.counts)==null?void 0:o.plan_review)??r.plan_review.length)+(((i=r.counts)==null?void 0:i.impl)??r.impl.length)+(((c=r.counts)==null?void 0:c.impl_review)??r.impl_review.length)+(((l=r.counts)==null?void 0:l.test)??r.test.length)+(((a=r.counts)==null?void 0:a.done)??r.done.length);document.getElementById("count-summary").textContent=`${p}/${m} completed`,e.querySelectorAll(".card").forEach(g=>{g.addEventListener("click",h=>{if(h.target.closest(".card-interactive")){h.stopPropagation();return}const d=h.target.closest(".card-copy-btn");if(d){h.stopPropagation(),navigator.clipboard.writeText(d.dataset.copy).then(()=>{const b=d.textContent;d.textContent="✓",setTimeout(()=>{d.textContent=b},1e3)});return}const f=parseInt(g.dataset.id),y=g.dataset.project;D(f,y)})}),C||Rn(),Tn(),Te();const u=document.getElementById("add-card-btn");u&&u.addEventListener("click",g=>{g.stopPropagation(),document.getElementById("add-card-overlay").classList.remove("hidden"),U(),C||document.getElementById("add-title").focus()})}catch(r){console.error("loadBoard failed:",r),e.innerHTML=`
      <div style="grid-column:1/-1;display:flex;align-items:center;justify-content:center;color:#ef4444;font-size:0.9rem;padding:48px">
        Cannot find .claude/kanban.db
      </div>
    `}}function Tn(){document.querySelectorAll("[data-column-toggle]").forEach(e=>{e.addEventListener("click",n=>{if(!C)return;n.stopPropagation();const t=e.dataset.columnToggle;if(!t)return;J.has(t)?J.delete(t):J.add(t),bt();const s=e.closest(".column"),o=J.has(t)||!!ue.trim();s&&s.setAttribute("data-mobile-expanded",String(o)),e.setAttribute("aria-expanded",String(o));const i=e.querySelector(".column-toggle-icon");i&&(i.textContent=o?"−":"+")})}),document.querySelectorAll(".mobile-status-select").forEach(e=>{e.addEventListener("click",n=>n.stopPropagation()),e.addEventListener("change",async n=>{n.stopPropagation();const t=e.value,s=parseInt(e.dataset.id||"",10),o=e.dataset.project||"",i=e.dataset.currentStatus||"";!s||!o||await ln({id:s,project:o,status:i},t)})})}async function je(){const e=document.getElementById("list-view");try{const n=await ne("full");Ne(n.projects);const t=[];for(const a of F)for(const r of n[a.key])t.push(r);const s=K==="default"?[...t].sort((a,r)=>r.id-a.id):wt(t),o=s.length,i=s.filter(a=>a.status==="done").length;document.getElementById("count-summary").textContent=`${i}/${o} completed`;const c=s.map(a=>{var u,g;const r=Be(a.priority),m=ge(a.tags).map(h=>`<span class="tag">${h}</span>`).join("");return`
        <tr class="status-${a.status}" data-id="${a.id}" data-project="${a.project}" data-completed-at="${a.completed_at||""}">
          <td class="col-id">#${a.id}</td>
          <td class="col-title">${a.title}</td>
          <td>
            <select class="list-status-select" data-id="${a.id}" data-field="status">
              ${F.map(h=>`<option value="${h.key}" ${h.key===a.status?"selected":""}>${h.icon} ${h.label}</option>`).join("")}
            </select>
          </td>
          <td>
            <select class="list-level-select" data-id="${a.id}" data-field="level">
              ${[1,2,3].map(h=>`<option value="${h}" ${h===a.level?"selected":""}>L${h}</option>`).join("")}
            </select>
          </td>
          <td>
            <select class="list-priority-select ${r}" data-id="${a.id}" data-field="priority">
              ${["high","medium","low"].map(h=>`<option value="${h}" ${h===a.priority?"selected":""}>${h[0].toUpperCase()+h.slice(1)}</option>`).join("")}
            </select>
          </td>
          <td class="list-date">${a.project||""}</td>
          <td>${m}</td>
          <td class="list-date">${((u=a.created_at)==null?void 0:u.slice(0,10))||""}</td>
          <td class="list-date">${((g=a.completed_at)==null?void 0:g.slice(0,10))||""}</td>
        </tr>
      `}).join(""),l=s.map(Bn).join("");e.innerHTML=`
      <div class="list-view-shell">
        <div class="list-cards" data-mobile-list>
          ${l||'<div class="empty">No items</div>'}
        </div>
        <table class="list-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Status</th>
              <th>Level</th>
              <th>Priority</th>
              <th>Project</th>
              <th>Tags</th>
              <th>Created</th>
              <th>Completed</th>
            </tr>
          </thead>
          <tbody>${c}</tbody>
        </table>
      </div>
    `,e.querySelectorAll("select").forEach(a=>{a.addEventListener("change",async r=>{r.stopPropagation();const p=a,m=p.dataset.id,u=p.dataset.field;let g=p.value;u==="level"&&(g=parseInt(g));const h=p.closest("tr"),$=(h==null?void 0:h.dataset.project)||"",d=await B(`/api/task/${m}?project=${encodeURIComponent($)}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({[u]:g})});if(!d.ok){const f=await d.json().catch(()=>({}));f.error&&ve(f.error),je();return}q($),je()})}),e.querySelectorAll(".col-title").forEach(a=>{a.addEventListener("click",r=>{r.stopPropagation();const p=a.closest("[data-id]"),m=parseInt(p.dataset.id),u=p.dataset.project;D(m,u)})}),Te()}catch(n){console.error("loadListView failed:",n),e.innerHTML=`
      <div style="display:flex;align-items:center;justify-content:center;color:#ef4444;font-size:0.9rem;padding:48px">
        Failed to load task list
      </div>
    `}}function Ne(e){const n=document.getElementById("project-filter");if(e.length<=1){n.innerHTML=e[0]?`<span class="project-label">${e[0]}</span>`:"";return}const t=e.map(s=>`<option value="${s}" ${s===S?"selected":""}>${s}</option>`).join("");n.innerHTML=`
    <select id="project-select">
      <option value="">All Projects</option>
      ${t}
    </select>
  `,document.getElementById("project-select").addEventListener("change",s=>{S=s.target.value||null,S?localStorage.setItem("kanban-project",S):localStorage.removeItem("kanban-project"),T=null,G=null,R()})}function dt(e,n){const t=[...e.querySelectorAll(".card:not(.dragging)")];for(const s of t){const o=s.getBoundingClientRect(),i=o.top+o.height/2;if(n<i)return s}return null}function Le(){document.querySelectorAll(".drop-indicator").forEach(e=>e.remove())}function An(e,n){Le();const t=document.createElement("div");t.className="drop-indicator",n?e.insertBefore(t,n):e.appendChild(t)}function Rn(){const e=document.querySelectorAll(".card"),n=document.querySelectorAll(".column-body");e.forEach(t=>{t.addEventListener("dragstart",s=>{const o=s,i=t;o.dataTransfer.setData("text/plain",`${i.dataset.project}:${i.dataset.id}`),i.classList.add("dragging"),Se=!0}),t.addEventListener("dragend",()=>{t.classList.remove("dragging"),Le(),Se=!1})}),n.forEach(t=>{t.addEventListener("dragover",s=>{s.preventDefault();const o=t;o.classList.add("drag-over");const i=dt(o,s.clientY);An(o,i)}),t.addEventListener("dragleave",s=>{const o=t;o.contains(s.relatedTarget)||(o.classList.remove("drag-over"),Le())}),t.addEventListener("drop",async s=>{s.preventDefault();const o=t;o.classList.remove("drag-over"),Le();const i=s,c=i.dataTransfer.getData("text/plain"),l=c.lastIndexOf(":"),a=l>=0?c.slice(0,l):"",r=parseInt(l>=0?c.slice(l+1):c),p=o.dataset.column,m=dt(o,i.clientY),u=[...o.querySelectorAll(".card:not(.dragging)")];let g=null,h=null;if(m){h=parseInt(m.dataset.id);const d=u.indexOf(m);d>0&&(g=parseInt(u[d-1].dataset.id))}else u.length>0&&(g=parseInt(u[u.length-1].dataset.id));const $=await B(`/api/task/${r}/reorder?project=${encodeURIComponent(a)}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({status:p,afterId:g,beforeId:h})});if(!$.ok){const d=await $.json().catch(()=>({}));d.error&&ve(d.error)}q(a),fe()})})}function ve(e){const n=document.querySelector(".toast");n&&n.remove();const t=document.createElement("div");t.className="toast",t.textContent=e,document.body.appendChild(t),setTimeout(()=>t.remove(),3e3)}async function St(){try{const n=await(await B("/api/info")).json();n.projectName&&(document.title=`Kanban · ${n.projectName}`,document.querySelector("header h1").textContent=`Kanban · ${n.projectName}`)}catch{}}function ye(e){A=e,localStorage.setItem(xe,A);const n=document.getElementById("board"),t=document.getElementById("list-view"),s=document.getElementById("chronicle-view"),o=document.getElementById("graph-view");W&&e!=="graph"&&(W.disconnect(),W=null),n.classList.add("hidden"),t.classList.add("hidden"),s.classList.add("hidden"),o.classList.add("hidden"),document.getElementById("tab-board").classList.remove("active"),document.getElementById("tab-list").classList.remove("active"),document.getElementById("tab-chronicle").classList.remove("active"),document.getElementById("tab-graph").classList.remove("active"),e==="board"?(n.classList.remove("hidden"),document.getElementById("tab-board").classList.add("active"),fe()):e==="list"?(t.classList.remove("hidden"),document.getElementById("tab-list").classList.add("active"),je()):e==="chronicle"?(s.classList.remove("hidden"),document.getElementById("tab-chronicle").classList.add("active"),Lt()):(o.classList.remove("hidden"),document.getElementById("tab-graph").classList.add("active"),It())}function R(){A==="board"?fe():A==="list"?je():A==="chronicle"?Lt():It()}document.getElementById("sort-select").value=K;O&&document.getElementById("hide-done-btn").classList.add("active");me();qe();document.getElementById("auth-btn").addEventListener("click",()=>{if(x&&_){X("Shared token is stored on this device. Use Forget Token to reset it.","success");return}X(x?"Enter the shared access token to load the board.":"This environment does not require a shared token.")});document.getElementById("auth-close").addEventListener("click",()=>{x&&!_||he()});document.getElementById("auth-clear-btn").addEventListener("click",async()=>{await Xt(),x?X("Stored token cleared. Enter a shared access token to continue."):(he(),te("Stored token cleared."))});document.getElementById("auth-form").addEventListener("submit",async e=>{e.preventDefault();const t=document.getElementById("auth-token-input").value.trim();if(!t){te("Enter the shared access token.","error");return}te("Unlocking board...","default");try{await yt(t),te("Board unlocked.","success"),await St(),$t(),R()}catch(s){te(s instanceof Error?s.message:"Board authentication failed.","error")}});document.getElementById("tab-board").addEventListener("click",()=>ye("board"));document.getElementById("tab-list").addEventListener("click",()=>ye("list"));document.getElementById("tab-chronicle").addEventListener("click",()=>ye("chronicle"));document.getElementById("tab-graph").addEventListener("click",()=>ye("graph"));document.getElementById("toolbar-mobile-toggle").addEventListener("click",()=>{ce=!ce,qe()});ht.addEventListener("change",e=>{zt(e.matches)});document.addEventListener("visibilitychange",()=>{document.visibilityState!=="visible"||!_||(Ue(),R())});function Ct(){if(Pe)return;Pe=!0;const e=new EventSource("/api/events");e.onmessage=()=>{if(Se)return;const n=!document.getElementById("modal-overlay").classList.contains("hidden"),t=!document.getElementById("add-card-overlay").classList.contains("hidden");!n&&!t&&R()},e.onerror=()=>{e.close(),Pe=!1,(!x||_)&&setTimeout(Ct,5e3)}}document.getElementById("refresh-btn").addEventListener("click",R);document.getElementById("search-input").addEventListener("input",e=>{if(ue=e.target.value.trim(),A==="board"){fe();return}Te()});document.getElementById("sort-select").addEventListener("change",e=>{K=e.target.value,localStorage.setItem("kanban-sort",K),R()});document.getElementById("hide-done-btn").addEventListener("click",()=>{O=!O,localStorage.setItem("kanban-hide-old",String(O)),document.getElementById("hide-done-btn").classList.toggle("active",O),Te()});document.getElementById("modal-close").addEventListener("click",()=>{document.getElementById("modal-overlay").classList.add("hidden"),U(),R()});document.getElementById("modal-overlay").addEventListener("click",e=>{e.target===e.currentTarget&&(document.getElementById("modal-overlay").classList.add("hidden"),U(),R())});document.addEventListener("keydown",e=>{if(e.key==="Escape"){const n=!document.getElementById("modal-overlay").classList.contains("hidden");document.getElementById("modal-overlay").classList.add("hidden"),document.getElementById("add-card-overlay").classList.add("hidden"),!document.getElementById("auth-overlay").classList.contains("hidden")&&_&&he(),U(),n&&R()}});const pe=document.getElementById("add-card-overlay");let M=[];function $e(){const e=document.getElementById("add-attachment-preview");if(M.length===0){e.innerHTML="";return}e.innerHTML=M.map((n,t)=>`
    <div class="attachment-thumb">
      <img src="${URL.createObjectURL(n)}" alt="${n.name}" />
      <button class="attachment-remove" data-idx="${t}" title="Remove" type="button">&times;</button>
      <span class="attachment-name">${n.name}</span>
    </div>
  `).join(""),e.querySelectorAll(".attachment-remove").forEach(n=>{n.addEventListener("click",t=>{t.stopPropagation();const s=parseInt(n.dataset.idx);M.splice(s,1),$e()})})}function Fe(e){for(const n of Array.from(e))n.type.startsWith("image/")&&M.push(n);$e()}document.getElementById("add-card-close").addEventListener("click",()=>{pe.classList.add("hidden"),M=[],$e(),U()});pe.addEventListener("click",e=>{e.target===e.currentTarget&&(pe.classList.add("hidden"),M=[],$e(),U())});const Q=document.getElementById("add-attachment-zone"),oe=document.getElementById("add-attachment-input");Q.addEventListener("click",()=>oe.click());Q.addEventListener("dragover",e=>{e.preventDefault(),Q.classList.add("drop-active")});Q.addEventListener("dragleave",()=>{Q.classList.remove("drop-active")});Q.addEventListener("drop",e=>{var t;e.preventDefault(),Q.classList.remove("drop-active");const n=(t=e.dataTransfer)==null?void 0:t.files;n&&Fe(n)});oe.addEventListener("change",()=>{oe.files&&Fe(oe.files),oe.value=""});pe.addEventListener("paste",e=>{var t;const n=Array.from(((t=e.clipboardData)==null?void 0:t.files)??[]).filter(s=>s.type.startsWith("image/"));n.length!==0&&(e.preventDefault(),Fe(n))});document.getElementById("add-card-form").addEventListener("submit",async e=>{e.preventDefault();const n=document.getElementById("add-title").value.trim();if(!n)return;const t=document.getElementById("add-priority").value,s=parseInt(document.getElementById("add-level").value)||3,o=document.getElementById("add-description").value.trim()||null,i=document.getElementById("add-tags").value.trim(),c=i?i.split(",").map(m=>m.trim()).filter(Boolean):null,l=S;if(!l){ve("Select a project first");return}const a=document.querySelector("#add-card-form .form-submit");a.textContent=M.length>0?"Creating...":"Add Card",a.disabled=!0;const p=await(await B("/api/task",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({title:n,priority:t,level:s,description:o,tags:c,project:l})})).json();M.length>0&&p.id&&await Ee(p.id,M,l),M=[],a.textContent="Add Card",a.disabled=!1,document.getElementById("add-card-form").reset(),$e(),pe.classList.add("hidden"),U(),q(l),R()});an().then(async e=>{e&&(await St(),ye(A),$t())}).catch(()=>{X("Unable to initialize board authentication.","error")});Vt();
