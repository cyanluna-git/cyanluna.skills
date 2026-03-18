import pt from"https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs";(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const o of document.querySelectorAll('link[rel="modulepreload"]'))s(o);new MutationObserver(o=>{for(const i of o)if(i.type==="childList")for(const l of i.addedNodes)l.tagName==="LINK"&&l.rel==="modulepreload"&&s(l)}).observe(document,{childList:!0,subtree:!0});function n(o){const i={};return o.integrity&&(i.integrity=o.integrity),o.referrerPolicy&&(i.referrerPolicy=o.referrerPolicy),o.crossOrigin==="use-credentials"?i.credentials="include":o.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function s(o){if(o.ep)return;o.ep=!0;const i=n(o);fetch(o.href,i)}})();pt.initialize({startOnLoad:!1,theme:"dark",themeVariables:{primaryColor:"#334155",primaryBorderColor:"#60a5fa",primaryTextColor:"#f1f5f9",lineColor:"#64748b",secondaryColor:"#1e293b",tertiaryColor:"#0f172a"}});window.__mermaid=pt;const Pt="modulepreload",qt=function(e){return"/"+e},st={},Dt=function(t,n,s){let o=Promise.resolve();if(n&&n.length>0){let l=function(r){return Promise.all(r.map(p=>Promise.resolve(p).then(m=>({status:"fulfilled",value:m}),m=>({status:"rejected",reason:m}))))};document.getElementsByTagName("link");const c=document.querySelector("meta[property=csp-nonce]"),a=(c==null?void 0:c.nonce)||(c==null?void 0:c.getAttribute("nonce"));o=l(n.map(r=>{if(r=qt(r),r in st)return;st[r]=!0;const p=r.endsWith(".css"),m=p?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${r}"]${m}`))return;const u=document.createElement("link");if(u.rel=p?"stylesheet":Pt,p||(u.as="script"),u.crossOrigin="",u.href=r,a&&u.setAttribute("nonce",a),document.head.appendChild(u),p)return new Promise((h,d)=>{u.addEventListener("load",h),u.addEventListener("error",()=>d(new Error(`Unable to preload CSS for ${r}`)))})}))}function i(l){const c=new Event("vite:preloadError",{cancelable:!0});if(c.payload=l,window.dispatchEvent(c),!c.defaultPrevented)throw l}return o.then(l=>{for(const c of l||[])c.status==="rejected"&&i(c.reason);return t().catch(i)})},F=[{key:"todo",label:"Requirements",icon:"📋"},{key:"plan",label:"Plan",icon:"🗺️"},{key:"plan_review",label:"Review Plan",icon:"🔍"},{key:"impl",label:"Implement",icon:"🔨"},{key:"impl_review",label:"Review Impl",icon:"📝"},{key:"test",label:"Test",icon:"🧪"},{key:"done",label:"Done",icon:"✅"}],Mt={plan:"Planning",plan_review:"Plan Review",impl:"Implementing",impl_review:"Impl Review",test:"Testing"},Ie="kanban-auth-token",Oe="kanban-current-view",ut="kanban-mobile-board-columns",Ut=3e4,Ht=10,Nt=10,mt="kanban-summary-cache",Ft={board:3e4,full:6e4},ht=window.matchMedia("(max-width: 768px)");function Vt(){!("serviceWorker"in navigator)||!(window.location.protocol==="https:"||window.location.hostname==="localhost"||window.location.hostname==="127.0.0.1")||window.addEventListener("load",()=>{navigator.serviceWorker.register("/sw.js").catch(t=>{console.warn("Service worker registration failed",t)})})}function Wt(e){return e==="board"||e==="list"||e==="chronicle"||e==="graph"}function Kt(e){return F.some(t=>t.key===e)}function Jt(){try{const e=localStorage.getItem(ut);if(!e)return new Set;const t=JSON.parse(e);return Array.isArray(t)?new Set(t.filter(n=>typeof n=="string"&&Kt(n))):new Set}catch{return new Set}}let E=localStorage.getItem("kanban-project"),Se=!1,L=ht.matches,_=Wt(localStorage.getItem(Oe))?localStorage.getItem(Oe):L?"list":"board",ue="",K=localStorage.getItem("kanban-sort")||"default",O=localStorage.getItem("kanban-hide-old")==="true",A=localStorage.getItem(Ie)||"",R=!1,I=!1,ke=!1,le=!L,J=Jt(),C=null,ie=null,G=null;const re=new Map,ee=new Map,ce=new Map;let W=null;function te(e,t="default"){const n=document.getElementById("auth-message");n.textContent=e,n.classList.remove("error","success"),t!=="default"&&n.classList.add(t)}function D(){const t=[document.getElementById("modal-overlay"),document.getElementById("add-card-overlay"),document.getElementById("auth-overlay")].some(n=>n&&!n.classList.contains("hidden"));document.body.classList.toggle("overlay-open",t)}function me(){const e=document.getElementById("auth-btn");if(e){if(!R){e.textContent="Open",e.title="Board access is open in this environment";return}e.textContent=I?"Private":"Locked",e.title=I?"Shared token configured for this browser":"Shared token required"}}function X(e="Enter the shared access token to load the board.",t="default"){I=!1,document.getElementById("auth-overlay").classList.remove("hidden"),D();const n=document.getElementById("auth-token-input");n.value=A,te(e,t),me(),setTimeout(()=>n.focus(),0)}function he(){document.getElementById("auth-overlay").classList.add("hidden"),D(),me()}function gt(e){A=e.trim(),A?localStorage.setItem(Ie,A):localStorage.removeItem(Ie)}function qe(){document.body.classList.toggle("mobile-shell",L),document.body.classList.toggle("mobile-toolbar-open",!L||le);const e=document.getElementById("toolbar-mobile-toggle");if(e){const t=!L||le;e.hidden=!L,e.setAttribute("aria-expanded",String(t)),e.textContent=t?"Hide Filters":"Show Filters"}}function zt(e){L=e,L||(le=!0),qe(),I&&_==="board"&&B()}function ft(){return window.location.hostname==="localhost"||window.location.hostname==="127.0.0.1"}function De(){ie!==null&&(window.clearInterval(ie),ie=null)}function Me(e=E,t="full"){return`${e||"__all__"}::${t}`}function Ce(e=E,t="full"){return`${mt}::${Me(e,t)}`}function Yt(e=E,t="full"){try{const n=localStorage.getItem(Ce(e,t));if(!n)return null;const s=JSON.parse(n);return!s||typeof s.fetchedAt!="number"||!s.board?null:Date.now()-s.fetchedAt>Ft[t]?(localStorage.removeItem(Ce(e,t)),null):s}catch{return null}}function Zt(e,t,n,s){try{const o={fetchedAt:Date.now(),etag:s,board:n};localStorage.setItem(Ce(e,t),JSON.stringify(o))}catch{}}function P(e=E,t){const n=t?[t]:["board","full"];for(const s of n){const o=Me(e,s);re.delete(o),ee.delete(o),ce.delete(o);try{localStorage.removeItem(Ce(e,s))}catch{}}e===E&&(C=null,G=null)}function Ue(e={}){if(re.clear(),ee.clear(),ce.clear(),C=null,G=null,e.persisted)try{const t=[];for(let n=0;n<localStorage.length;n+=1){const s=localStorage.key(n);s!=null&&s.startsWith(`${mt}::`)&&t.push(s)}t.forEach(n=>localStorage.removeItem(n))}catch{}}function vt(){A="",localStorage.removeItem(Ie);const e=document.getElementById("auth-token-input");e&&(e.value="")}async function Gt(){const e=new Headers;A&&e.set("X-Kanban-Auth",A);const n=await(await fetch("/api/auth/session",{method:"GET",headers:e,credentials:"same-origin"})).json().catch(()=>({}));return{authenticated:!!n.authenticated,authRequired:!!n.authRequired,mode:n.mode,source:n.source??null,reason:n.reason??null,error:n.error??null}}async function yt(e){const t=e.trim(),n=await fetch("/api/auth/session",{method:"POST",headers:{"X-Kanban-Auth":t},credentials:"same-origin"}),s=await n.json().catch(()=>({}));if(!n.ok){const o=s.reason==="invalid_token"?"Shared token is invalid.":s.reason==="token_hash_missing"?"Server auth is not configured yet.":"Board authentication failed.";throw new Error(o)}gt(t),R=!!s.authRequired,I=!0,he(),me()}async function Xt(){await fetch("/api/auth/session",{method:"DELETE",credentials:"same-origin"}).catch(()=>{}),De(),Ue({persisted:!0}),vt(),I=!R,me()}async function S(e,t={},n=!1){const s=new Headers(t.headers||{});A&&!s.has("X-Kanban-Auth")&&s.set("X-Kanban-Auth",A);const o=await fetch(e,{...t,headers:s,credentials:"same-origin"});if((o.status===401||o.status===403||o.status===503)&&!n){const i=await o.clone().json().catch(()=>({}));R=!0,I=!1,i.reason==="invalid_token"&&vt();const l=i.reason==="invalid_token"?"Stored token was rejected. Enter a valid shared token.":i.reason==="token_hash_missing"?"Server auth hash is not configured yet.":"Shared token is required for this board.";throw X(l,"error"),new Error(i.error||l)}return o}async function He(e=E){const t=e?`?project=${encodeURIComponent(e)}`:"",n=new Headers;G&&n.set("If-None-Match",G);const s=await S(`/api/board/version${t}`,{headers:n});return s.status===304?C?null:(G=null,He()):(G=s.headers.get("ETag"),s.json())}function Qt(e){return e==="board"?_==="board"&&!Pe():_==="list"||_==="chronicle"||_==="board"&&Pe()}function Pe(){return ue.trim().length>0}function en(e,t,n,s){if(!I||ce.has(t))return;const o=(async()=>{try{const i=await He(s);if(!i)return;if(n&&i.version===n){C=i.version;return}P(s,e),await ne(e,{bypassTtl:!0,projectOverride:s}),E===s&&Qt(e)&&B()}catch{}finally{ce.delete(t)}})();ce.set(t,o)}async function ne(e="full",t={}){const n=t.projectOverride===void 0?E:t.projectOverride,s=["summary=true"];n&&s.unshift(`project=${encodeURIComponent(n)}`),e==="board"&&s.push("compact=board",`todo_limit=${Ht}`,`done_limit=${Nt}`);const o=`?${s.join("&")}`,i=Me(n,e);if(!t.bypassTtl){const m=Yt(n,e);if(m)return re.set(i,m.board),m.etag&&ee.set(i,m.etag),C=m.board.version||C,en(e,i,m.board.version||null,n),m.board}const l=new Headers,c=ee.get(i);c&&l.set("If-None-Match",c);const a=await S(`/api/board${o}`,{headers:l});if(a.status===304){const m=re.get(i);return m?(C=m.version||C,m):(ee.delete(i),ne(e,{bypassTtl:!0}))}const r=await a.json(),p=a.headers.get("ETag");return p&&ee.set(i,p),re.set(i,r),Zt(n,e,r,p),C=r.version||C,r}function tn(){ft()||ie!==null||(ie=window.setInterval(async()=>{if(!I||Se)return;const e=!document.getElementById("modal-overlay").classList.contains("hidden"),t=!document.getElementById("add-card-overlay").classList.contains("hidden");if(!(e||t))try{const n=await He();if(!n)return;if(!C){C=n.version;return}n.version!==C&&(C=n.version,B())}catch{R&&!I&&De()}},Ut))}function $t(){if(ft()){De(),Ct();return}tn()}function nn(){const e=new URL(window.location.href),t=e.searchParams.get("auth")||e.searchParams.get("token");t&&(gt(t),e.searchParams.delete("auth"),e.searchParams.delete("token"),window.history.replaceState({},"",e.toString()))}async function an(){if(nn(),A)try{return await yt(A),!0}catch(t){return X(t instanceof Error?t.message:"Board authentication failed.","error"),!1}const e=await Gt();return R=e.authRequired,I=e.authenticated||!e.authRequired,e.authRequired&&!e.authenticated?(X("Enter the shared access token to load the board."),!1):(he(),!0)}function Be(e){return e==="high"?"high":e==="medium"?"medium":e==="low"?"low":""}function bt(){localStorage.setItem(ut,JSON.stringify([...J]))}function sn(e){if(!L||J.size>0)return;const t=F.filter(n=>n.key==="todo"||n.key==="impl"||n.key!=="done"&&e[n.key].length>0).map(n=>n.key);J=new Set(t.length>0?t:["todo"]),bt()}function on(e){return!L||ue.trim()?!0:J.has(e)}function _e(e){var t;return((t=F.find(n=>n.key===e))==null?void 0:t.label)||e}function rn(e,t){return e===1?{todo:["impl"],impl:["done"],done:[]}[t]||[]:e===2?{todo:["plan"],plan:["impl","todo"],impl:["impl_review"],impl_review:["done","impl"],done:[]}[t]||[]:{todo:["plan"],plan:["plan_review","todo"],plan_review:["impl","plan"],impl:["impl_review"],impl_review:["test","impl"],test:["done","impl"],done:[]}[t]||[]}async function cn(e,t){if(!t||t===e.status)return;const n=await S(`/api/task/${e.id}?project=${encodeURIComponent(e.project)}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({status:t})});if(!n.ok){const s=await n.json().catch(()=>({}));ve(s.error||"Failed to move task");return}P(e.project),fe()}function be(e){return e?Date.now()-new Date(e).getTime()>4320*60*1e3:!1}function wt(e,t){return K==="default"?t==="done"?[...e].sort((n,s)=>{const o=(s.completed_at||"").localeCompare(n.completed_at||"");return o!==0?o:n.rank-s.rank||n.id-s.id}):[...e].sort((n,s)=>s.rank-n.rank||s.id-n.id):[...e].sort((n,s)=>K==="created_asc"?n.created_at.localeCompare(s.created_at):K==="created_desc"?s.created_at.localeCompare(n.created_at):K==="completed_desc"?(s.completed_at||"").localeCompare(n.completed_at||""):0)}function Te(){const e=ue.toLowerCase().replace(/^#/,""),t=e.length>0||O;document.body.classList.toggle("mobile-board-search",_==="board"&&L&&e.length>0),_==="board"?(document.querySelectorAll(".card").forEach(n=>{const s=!e||(()=>{var r,p,m,u;const i=n.dataset.id||"",l=((p=(r=n.querySelector(".card-title"))==null?void 0:r.textContent)==null?void 0:p.toLowerCase())||"",c=((u=(m=n.querySelector(".card-desc"))==null?void 0:m.textContent)==null?void 0:u.toLowerCase())||"",a=[...n.querySelectorAll(".tag")].map(h=>{var d;return((d=h.textContent)==null?void 0:d.toLowerCase())||""}).join(" ");return i===e||l.includes(e)||c.includes(e)||a.includes(e)})(),o=O&&n.dataset.status==="done"&&be(n.dataset.completedAt||"");n.style.display=s&&!o?"":"none"}),document.querySelectorAll(".column").forEach(n=>{const s=n.querySelectorAll(".card"),o=[...s].filter(a=>a.style.display!=="none").length,i=s.length,l=Number.parseInt(n.dataset.totalCount||`${i}`,10)||i,c=n.querySelector(".count");c&&(c.textContent=t||l!==i?`${o}/${l}`:`${l}`)})):_==="list"?(document.querySelectorAll("#list-view tbody tr").forEach(n=>{const s=!e||(()=>{var r,p,m,u;const i=n.dataset.id||"",l=((p=(r=n.querySelector(".col-title"))==null?void 0:r.textContent)==null?void 0:p.toLowerCase())||"",c=((u=(m=n.cells[5])==null?void 0:m.textContent)==null?void 0:u.toLowerCase())||"",a=[...n.querySelectorAll(".tag")].map(h=>{var d;return((d=h.textContent)==null?void 0:d.toLowerCase())||""}).join(" ");return i===e||l.includes(e)||c.includes(e)||a.includes(e)})(),o=O&&n.classList.contains("status-done")&&be(n.dataset.completedAt||"");n.style.display=s&&!o?"":"none"}),document.querySelectorAll("#list-view .list-card").forEach(n=>{const s=!e||(()=>{var r,p,m;const i=n.dataset.id||"",l=((p=(r=n.querySelector(".list-card-title"))==null?void 0:r.textContent)==null?void 0:p.toLowerCase())||"",c=((m=n.dataset.project)==null?void 0:m.toLowerCase())||"",a=[...n.querySelectorAll(".tag")].map(u=>{var h;return((h=u.textContent)==null?void 0:h.toLowerCase())||""}).join(" ");return i===e||l.includes(e)||c.includes(e)||a.includes(e)})(),o=O&&n.classList.contains("status-done")&&be(n.dataset.completedAt||"");n.style.display=s&&!o?"":"none"})):(document.querySelectorAll("#chronicle-view .chronicle-event").forEach(n=>{const s=!e||(()=>{var a,r,p;const i=n.dataset.id||"",l=((r=(a=n.querySelector(".chronicle-task-link"))==null?void 0:a.textContent)==null?void 0:r.toLowerCase())||"",c=((p=n.dataset.project)==null?void 0:p.toLowerCase())||"";return i===e||l.includes(e)||c.includes(e)})(),o=O&&be(n.dataset.completedAt||"");n.style.display=s&&!o?"":"none"}),document.querySelectorAll("#chronicle-view .chronicle-group").forEach(n=>{const s=[...n.querySelectorAll(".chronicle-event")].filter(o=>o.style.display!=="none").length;n.style.display=s>0?"":"none"}))}function ge(e){if(!e||e==="null")return[];try{const t=JSON.parse(e);return Array.isArray(t)?t:[]}catch{return[]}}function ln(e){const t=new Date(e+"Z"),s=new Date().getTime()-t.getTime(),o=Math.floor(s/864e5);return o===0?"today":o===1?"yesterday":o<7?`${o}d ago`:o<30?`${Math.floor(o/7)}w ago`:e.slice(0,10)}function H(e){if(!e||e==="null")return[];try{const t=JSON.parse(e);return Array.isArray(t)?t:[]}catch{return[]}}function dn(e){var k,U;const t=Be(e.priority),n=t?`<span class="badge ${t}">${e.priority}</span>`:"",s=e.completed_at?`<span class="badge date">${e.completed_at.slice(0,10)}</span>`:e.created_at?`<span class="badge created">${ln(e.created_at)}</span>`:"",o=!E&&e.project?`<span class="badge project">${e.project}</span>`:"",i=Mt[e.status],l=i?`<span class="badge status-${e.status}">${i}</span>`:"",c=`<span class="badge level-${e.level}">L${e.level}</span>`,a=e.current_agent?`<span class="badge agent-tag">${e.current_agent}</span>`:"",r=e.last_review_status?[]:H(e.review_comments),p=e.last_review_status||(r.length>0?(k=r[r.length-1])==null?void 0:k.status:null),m=p?`<span class="badge ${p==="approved"?"review-approved":"review-changes"}">${p==="approved"?"Approved":"Changes Req."}</span>`:e.status==="impl_review"?'<span class="badge review-pending">Awaiting Review</span>':"",u=e.last_plan_review_status?[]:H(e.plan_review_comments),h=e.last_plan_review_status||(u.length>0?(U=u[u.length-1])==null?void 0:U.status:null),d=h?`<span class="badge ${h==="approved"?"review-approved":"review-changes"}">${h==="approved"?"Plan OK":"Plan Changes"}</span>`:e.status==="plan_review"?'<span class="badge review-pending">Plan Review</span>':"",v=ge(e.tags).map(z=>`<span class="tag">${z}</span>`).join(""),g=e.note_count??H(e.notes).length,$=g>0?`<span class="badge notes-count" title="${g} note(s)">💬 ${g}</span>`:"",j=rn(e.level,e.status).map(z=>`<option value="${z}">${_e(z)}</option>`).join(""),x=j?`
      <label class="mobile-card-move card-interactive">
        <span>Move</span>
        <select class="mobile-status-select" data-id="${e.id}" data-project="${e.project}" data-current-status="${e.status}">
          <option value="${e.status}">${_e(e.status)}</option>
          ${j}
        </select>
      </label>
    `:"";return`
    <div class="${L?"card mobile-card":"card"}" ${L?'draggable="false"':'draggable="true"'} data-id="${e.id}" data-status="${e.status}" data-project="${e.project}" data-completed-at="${e.completed_at||""}">
      <div class="card-header">
        <span class="card-id">#${e.id}</span>
        ${c}
        ${n}
        ${l}
        ${a}
        <button class="card-copy-btn" data-copy="#${e.id} ${e.title}" title="Copy to clipboard">⎘</button>
      </div>
      <div class="card-title">${e.title}</div>
      <div class="card-footer">
        ${o}
        ${d}
        ${m}
        ${$}
        ${s}
      </div>
      ${x}
      ${v?`<div class="card-tags">${v}</div>`:""}
    </div>
  `}function pn(e,t,n,s,o=s.length){const i=on(e),l=wt(s,e).map(dn).join(""),c=e==="todo"?'<button class="add-card-btn" id="add-card-btn" title="Add card">+</button>':"",a=o!==s.length?`${s.length}/${o}`:`${o}`;return`
    <div class="column ${e}" data-column="${e}" data-mobile-expanded="${i}" data-total-count="${o}">
      <div class="column-header">
        <button class="column-toggle-btn" type="button" data-column-toggle="${e}" aria-expanded="${i}">
          <span class="column-toggle-label">${n} ${t}</span>
          <span class="column-toggle-meta">
            <span class="count">${a}</span>
            <span class="column-toggle-icon" aria-hidden="true">${i?"−":"+"}</span>
          </span>
        </button>
        <div class="column-header-right">
          ${c}
        </div>
      </div>
      <div class="column-body" data-column="${e}">
        ${l||'<div class="empty">No items</div>'}
      </div>
    </div>
  `}const un=/```[\s\S]*?```/g,mn=/```\w*\n?/,ot=/```$/,it=/^```mermaid\s*\n?/,hn=/\*\*(.+?)\*\*/g,gn=/`([^`]+)`/g,fn=/^\x00CB(\d+)\x00$/,vn=/^### (.+)$/,yn=/^## (.+)$/,$n=/^# (.+)$/,bn=/^[-*]\s+(.+)$/,wn=/^\d+\.\s+(.+)$/,rt=/^\|(.+)\|$/,ct=/^\|[\s:-]+\|$/;let En=0;function de(e){const t=[];let n=e.replace(un,r=>{if(it.test(r)){const p=r.replace(it,"").replace(ot,"").trim(),m=`mermaid-${++En}`;t.push(`<pre class="mermaid" id="${m}">${p}</pre>`)}else{const p=r.replace(mn,"").replace(ot,"");t.push(`<pre><code>${p}</code></pre>`)}return`\0CB${t.length-1}\0`});n=n.replace(/</g,"&lt;"),n=n.replace(hn,"<strong>$1</strong>").replace(gn,"<code>$1</code>");const s=n.split(`
`),o=[];let i=!1,l=!1;function c(){i&&(o.push("</ul>"),i=!1),l&&(o.push("</ol>"),l=!1)}let a=0;for(;a<s.length;){const r=s[a].trim(),p=r.match(fn);if(p){c(),o.push(t[parseInt(p[1])]),a++;continue}if(rt.test(r)){c();const g=[];for(;a<s.length&&rt.test(s[a].trim());)g.push(s[a].trim()),a++;if(g.length>=2){const $=ct.test(g[1]),j=$?g[0]:null,x=$?2:0;let T='<table class="md-table">';if(j){const M=j.slice(1,-1).split("|").map(k=>k.trim());T+="<thead><tr>"+M.map(k=>`<th>${k}</th>`).join("")+"</tr></thead>"}T+="<tbody>";for(let M=x;M<g.length;M++){if(ct.test(g[M]))continue;const k=g[M].slice(1,-1).split("|").map(U=>U.trim());T+="<tr>"+k.map(U=>`<td>${U}</td>`).join("")+"</tr>"}T+="</tbody></table>",o.push(T)}else o.push(`<p>${g[0]}</p>`);continue}const m=r.match(vn);if(m){c(),o.push(`<h3>${m[1]}</h3>`),a++;continue}const u=r.match(yn);if(u){c(),o.push(`<h2>${u[1]}</h2>`),a++;continue}const h=r.match($n);if(h){c(),o.push(`<h1>${h[1]}</h1>`),a++;continue}const d=r.match(bn);if(d){l&&(o.push("</ol>"),l=!1),i||(o.push("<ul>"),i=!0),o.push(`<li>${d[1]}</li>`),a++;continue}const v=r.match(wn);if(v){i&&(o.push("</ul>"),i=!1),l||(o.push("<ol>"),l=!0),o.push(`<li>${v[1]}</li>`),a++;continue}c(),r===""?o.push(""):o.push(`<p>${r}</p>`),a++}return c(),o.join(`
`)}async function Ln(e){const t=window.__mermaid;if(!t)return;const n=e.querySelectorAll("pre.mermaid");if(n.length!==0)try{await t.run({nodes:n})}catch(s){console.warn("Mermaid render failed:",s)}}function we(e,t,n,s,o){if(!s&&!o)return"";const i=s?de(s):'<span class="phase-empty">Not yet documented</span>';return`
    <div class="lifecycle-phase ${n} ${o?"active":""}">
      <div class="phase-header">
        <span class="phase-icon">${t}</span>
        <span class="phase-label">${e}</span>
        <button class="phase-expand-btn" title="Expand to full screen">&#x26F6;</button>
      </div>
      <div class="phase-body">${i}</div>
    </div>
  `}function lt(e){return e.length===0?"":e.map(t=>{var n;return`
    <div class="review-entry ${t.status}">
      <div class="review-header">
        <span class="badge ${t.status==="approved"?"review-approved":"review-changes"}">
          ${t.status==="approved"?"Approved":"Changes Requested"}
        </span>
        <span class="review-meta">${t.reviewer||""} &middot; ${((n=t.timestamp)==null?void 0:n.slice(0,16))||""}</span>
      </div>
      <div class="review-comment">${de(t.comment||"")}</div>
    </div>
  `}).join("")}function In(e){return e.length===0?"":e.map(t=>{var n;return`
    <div class="review-entry ${t.status==="pass"?"approved":"changes_requested"}">
      <div class="review-header">
        <span class="badge ${t.status==="pass"?"review-approved":"review-changes"}">
          ${t.status==="pass"?"Pass":"Fail"}
        </span>
        <span class="review-meta">${t.tester||""} &middot; ${((n=t.timestamp)==null?void 0:n.slice(0,16))||""}</span>
      </div>
      ${t.lint?`<div class="test-output"><strong>Lint:</strong> <pre>${t.lint}</pre></div>`:""}
      ${t.build?`<div class="test-output"><strong>Build:</strong> <pre>${t.build}</pre></div>`:""}
      ${t.tests?`<div class="test-output"><strong>Tests:</strong> <pre>${t.tests}</pre></div>`:""}
      ${t.comment?`<div class="review-comment">${de(t.comment)}</div>`:""}
    </div>
  `}).join("")}async function Sn(e,t=1920,n=.82){return new Promise((s,o)=>{const i=new Image,l=URL.createObjectURL(e);i.onload=()=>{URL.revokeObjectURL(l);let{width:c,height:a}=i;(c>t||a>t)&&(c>a?(a=Math.round(a*t/c),c=t):(c=Math.round(c*t/a),a=t));const r=document.createElement("canvas");r.width=c,r.height=a,r.getContext("2d").drawImage(i,0,0,c,a),s(r.toDataURL("image/jpeg",n))},i.onerror=()=>{URL.revokeObjectURL(l),o(new Error("Image load failed"))},i.src=l})}async function Ee(e,t,n){var s,o;for(const i of Array.from(t)){if(!i.type.startsWith("image/"))continue;let l;try{l=await Sn(i)}catch{l=await new Promise(p=>{const m=new FileReader;m.onload=()=>p(m.result),m.readAsDataURL(i)})}const c=(o=(s=i.name.match(/\.[^.]+$/))==null?void 0:s[0])==null?void 0:o.toLowerCase(),a=c===".jpg"||c===".jpeg"||c===".png"||c===".webp"||c===".gif"||c===".svg"?i.name:i.name.replace(/\.[^.]+$/,"")+".jpg",r=await S(`/api/task/${e}/attachment?project=${encodeURIComponent(n)}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({filename:a,data:l})});if(!r.ok){const p=await r.json().catch(()=>({}));ve(p.error||`Upload failed (${r.status})`);return}}N(e,n)}async function N(e,t){var i;const n=document.getElementById("modal-overlay"),s=document.getElementById("modal-content");s.innerHTML='<div style="color:#94a3b8">Loading...</div>',n.classList.remove("hidden"),D();try{const l=t?`?project=${encodeURIComponent(t)}`:"",a=await(await S(`/api/task/${e}${l}`)).json(),r=document.querySelector(`.card[data-id="${a.id}"][data-project="${CSS.escape(a.project)}"]`);r&&r.dataset.status!==a.status&&(Ue(),B());const p=ge(a.tags),m=p.length?`<div class="modal-tags">${p.map(f=>`<span class="tag">${f}</span>`).join("")}</div>`:"",u=[`<strong>Project:</strong> ${a.project}`,`<strong>Status:</strong> ${a.status}`,`<strong>Priority:</strong> ${a.priority}`,`<strong>Created:</strong> ${((i=a.created_at)==null?void 0:i.slice(0,10))||"-"}`,a.started_at?`<strong>Started:</strong> ${a.started_at.slice(0,10)}`:"",a.planned_at?`<strong>Planned:</strong> ${a.planned_at.slice(0,10)}`:"",a.reviewed_at?`<strong>Reviewed:</strong> ${a.reviewed_at.slice(0,10)}`:"",a.tested_at?`<strong>Tested:</strong> ${a.tested_at.slice(0,10)}`:"",a.completed_at?`<strong>Completed:</strong> ${a.completed_at.slice(0,10)}`:""].filter(Boolean).join(" &nbsp;|&nbsp; "),h={1:{labels:["Req","Impl","Done"],statuses:["todo","impl","done"]},2:{labels:["Req","Plan","Impl","Review","Done"],statuses:["todo","plan","impl","impl_review","done"]},3:{labels:["Req","Plan","Plan Rev","Impl","Impl Rev","Test","Done"],statuses:["todo","plan","plan_review","impl","impl_review","test","done"]}},d=h[a.level]||h[3],v=Math.max(0,d.statuses.indexOf(a.status)),g=`
      <div class="lifecycle-progress">
        <span class="level-indicator">L${a.level}</span>
        ${d.labels.map((f,y)=>`
          <div class="progress-step ${y<v?"completed":""} ${y===v?"current":""}">
            <div class="step-dot"></div>
            <span class="step-label">${f}</span>
          </div>
        `).join('<div class="progress-line"></div>')}
      </div>
    `,$=H(a.attachments),j=$.length>0?`<div class="attachments-grid">${$.map(f=>`<div class="attachment-thumb" data-stored="${f.storedName}">
            <img src="${f.url}" alt="${f.filename}" loading="lazy" />
            <button class="attachment-remove" data-id="${e}" data-name="${f.storedName}" title="Remove">&times;</button>
            <span class="attachment-name">${f.filename}</span>
          </div>`).join("")}</div>`:"",x=a.description?de(a.description):'<span class="phase-empty">Not yet documented</span>',T=[1,2,3].map(f=>`<option value="${f}" ${f===a.level?"selected":""}>L${f}</option>`).join(""),M=`
      <div class="lifecycle-phase phase-requirement ${v===0?"active":""}">
        <div class="phase-header">
          <span class="phase-icon">📋</span>
          <span class="phase-label">Requirements</span>
          <select class="level-select" id="level-select" title="Pipeline Level">${T}</select>
          <button class="phase-edit-btn" id="req-edit-btn" title="Edit">&#9998;</button>
          <button class="phase-expand-btn" title="Expand to full screen">&#x26F6;</button>
        </div>
        <div class="phase-body" id="req-body-view">
          ${x}
          ${j}
        </div>
        <div class="phase-body hidden" id="req-body-edit">
          <textarea id="req-textarea" rows="8">${(a.description||"").replace(/</g,"&lt;")}</textarea>
          <div class="attachment-drop-zone" id="attachment-drop-zone">
            <span>📎 Drop images, paste (⌘V), or click to attach</span>
            <input type="file" id="attachment-input" accept="image/*" multiple hidden />
          </div>
          ${j?`<div id="edit-attachments">${j}</div>`:""}
          <div class="phase-edit-actions">
            <button class="phase-save-btn" id="req-save-btn">Save</button>
            <button class="phase-cancel-btn" id="req-cancel-btn">Cancel</button>
          </div>
        </div>
      </div>
    `,k=we("Plan","🗺️","phase-plan",a.plan,v===1&&!a.plan);let U="";a.decision_log&&(U=we("Decision Log","🧭","phase-decision-log",a.decision_log,!1));let z="";a.done_when&&(z=we("Done When","🎯","phase-done-when",a.done_when,!1));const _t=H(a.plan_review_comments),Ve=lt(_t);let We="";(Ve||v===2)&&(We=`
        <div class="lifecycle-phase phase-plan-review ${v===2?"active":""}">
          <div class="phase-header">
            <span class="phase-icon">🔍</span>
            <span class="phase-label">Plan Review</span>
            ${a.plan_review_count>0?`<span class="review-count">${a.plan_review_count} review(s)</span>`:""}
            <button class="phase-expand-btn" title="Expand to full screen">&#x26F6;</button>
          </div>
          <div class="phase-body">${Ve||'<span class="phase-empty">Awaiting plan review</span>'}</div>
        </div>
      `);const jt=we("Implementation","🔨","phase-impl",a.implementation_notes,v===3&&!a.implementation_notes),Bt=H(a.review_comments),Ke=lt(Bt);let Je="";(Ke||v===4)&&(Je=`
        <div class="lifecycle-phase phase-review ${v===4?"active":""}">
          <div class="phase-header">
            <span class="phase-icon">📝</span>
            <span class="phase-label">Implementation Review</span>
            ${a.impl_review_count>0?`<span class="review-count">${a.impl_review_count} review(s)</span>`:""}
            <button class="phase-expand-btn" title="Expand to full screen">&#x26F6;</button>
          </div>
          <div class="phase-body">${Ke||'<span class="phase-empty">Awaiting implementation review</span>'}</div>
        </div>
      `);const Tt=H(a.test_results),ze=In(Tt);let Ye="";(ze||v===5)&&(Ye=`
        <div class="lifecycle-phase phase-test ${v===5?"active":""}">
          <div class="phase-header">
            <span class="phase-icon">🧪</span>
            <span class="phase-label">Test Results</span>
            <button class="phase-expand-btn" title="Expand to full screen">&#x26F6;</button>
          </div>
          <div class="phase-body">${ze||'<span class="phase-empty">Awaiting test execution</span>'}</div>
        </div>
      `);const Ae=H(a.agent_log);let Ze="";if(Ae.length>0){let f=function(b){if(!b)return{name:"",model:null};const se=b.toLowerCase();for(const xe of y){const Y=se.lastIndexOf(xe);if(Y>0){let Z=Y;for(;Z>0&&(b[Z-1]==="-"||b[Z-1]==="_");)Z--;return{name:b.slice(0,Z),model:b.slice(Y)}}}return{name:b,model:null}};var o=f;const y=["opus","sonnet","haiku","gemini","copilot","gpt"],w=Ae.map(b=>{var at;const{name:se,model:xe}=f(b.agent||""),Y=b.model||xe,Z=Y?`<span class="badge model-tag model-${Y.toLowerCase()}">${Y}</span>`:"";return`
          <div class="agent-log-entry">
            <span class="agent-log-time">${((at=b.timestamp)==null?void 0:at.slice(0,16))||""}</span>
            <span class="badge agent-tag">${se||b.agent||""}</span>
            ${Z}
            <span class="agent-log-msg">${b.message||""}</span>
          </div>
        `}).join("");Ze=`
        <details class="lifecycle-phase phase-agent-log">
          <summary class="phase-header">
            <span class="phase-icon">🤖</span>
            <span class="phase-label">Agent Log</span>
            <span class="review-count">${Ae.length} entries</span>
          </summary>
          <div class="phase-body agent-log-body">${w}</div>
        </details>
      `}const Ge=H(a.notes),At=Ge.map(f=>{var y;return`
      <div class="note-entry">
        <div class="note-header">
          <span class="note-author">${f.author||"user"}</span>
          <span class="note-time">${((y=f.timestamp)==null?void 0:y.slice(0,16).replace("T"," "))||""}</span>
          <button class="note-delete" data-note-id="${f.id}" title="Delete">&times;</button>
        </div>
        <div class="note-text">${de(f.text||"")}</div>
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
      ${g}
      <div class="lifecycle-sections">
        ${M}
        ${k}
        ${U}
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
    `,Ln(s),s.querySelectorAll(".phase-expand-btn").forEach(f=>{f.addEventListener("click",y=>{y.stopPropagation();const w=f.closest(".lifecycle-phase");w==null||w.requestFullscreen().catch(()=>{})})});const Xe=document.getElementById("level-select");Xe.addEventListener("change",async()=>{const f=parseInt(Xe.value);await S(`/api/task/${e}?project=${encodeURIComponent(a.project)}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({level:f})}),P(a.project),N(e,a.project)}),document.getElementById("delete-task-btn").addEventListener("click",async()=>{confirm(`Delete card #${a.id} "${a.title}"?`)&&(await S(`/api/task/${e}?project=${encodeURIComponent(a.project)}`,{method:"DELETE"}),P(a.project),document.getElementById("modal-overlay").classList.add("hidden"),B())});const xt=document.getElementById("req-edit-btn"),Qe=document.getElementById("req-body-view"),et=document.getElementById("req-body-edit"),Re=document.getElementById("req-textarea"),tt=document.getElementById("req-save-btn"),kt=document.getElementById("req-cancel-btn");xt.addEventListener("click",()=>{Qe.classList.add("hidden"),et.classList.remove("hidden"),Re.focus()}),kt.addEventListener("click",()=>{Re.value=a.description||"",et.classList.add("hidden"),Qe.classList.remove("hidden")}),tt.addEventListener("click",async()=>{const f=Re.value;tt.textContent="Saving...",await S(`/api/task/${e}?project=${encodeURIComponent(a.project)}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({description:f})}),P(a.project),N(e,a.project)});const V=document.getElementById("attachment-drop-zone"),ae=document.getElementById("attachment-input");V&&ae&&(V.addEventListener("click",()=>ae.click()),V.addEventListener("dragover",f=>{f.preventDefault(),V.classList.add("drop-active")}),V.addEventListener("dragleave",()=>{V.classList.remove("drop-active")}),V.addEventListener("drop",async f=>{var w;f.preventDefault(),V.classList.remove("drop-active");const y=(w=f.dataTransfer)==null?void 0:w.files;y&&await Ee(e,y,a.project)}),ae.addEventListener("change",async()=>{ae.files&&await Ee(e,ae.files,a.project)})),s.addEventListener("paste",async f=>{var w;const y=Array.from(((w=f.clipboardData)==null?void 0:w.files)??[]).filter(b=>b.type.startsWith("image/"));y.length!==0&&(f.preventDefault(),await Ee(e,y,a.project))}),s.querySelectorAll(".attachment-remove").forEach(f=>{f.addEventListener("click",async y=>{y.stopPropagation();const w=f,b=w.dataset.id,se=w.dataset.name;await S(`/api/task/${b}/attachment/${encodeURIComponent(se)}?project=${encodeURIComponent(a.project)}`,{method:"DELETE"}),N(e,a.project)})});const Ot=document.getElementById("note-form"),nt=document.getElementById("note-input");Ot.addEventListener("submit",async f=>{f.preventDefault();const y=nt.value.trim();y&&(nt.disabled=!0,await S(`/api/task/${e}/note?project=${encodeURIComponent(a.project)}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({text:y})}),P(a.project),N(e,a.project))}),s.querySelectorAll(".note-delete").forEach(f=>{f.addEventListener("click",async y=>{y.stopPropagation();const w=f.dataset.noteId;await S(`/api/task/${e}/note/${w}?project=${encodeURIComponent(a.project)}`,{method:"DELETE"}),P(a.project),N(e,a.project)})})}catch{s.innerHTML='<div style="color:#ef4444">Failed to load</div>'}}function Et(e){if(!e)return new Date(NaN);let t=e.replace(" ","T");return t.length===10?t+="T00:00:00Z":/Z$|[+-]\d{2}:\d{2}$/.test(t)||(t+="Z"),new Date(t)}function Cn(e){const t=Et(e);if(isNaN(t.getTime()))return"Unknown";const n=t.getUTCDay()||7;t.setUTCDate(t.getUTCDate()+4-n);const s=new Date(Date.UTC(t.getUTCFullYear(),0,1)),o=Math.ceil(((t.getTime()-s.getTime())/864e5+1)/7);return`${t.getUTCFullYear()}-W${String(o).padStart(2,"0")}`}function _n(e){const t=Et(e);if(isNaN(t.getTime()))return e.slice(0,10)||"—";const n=t.toLocaleDateString(void 0,{month:"short",day:"numeric",timeZone:"UTC"}),s=t.toLocaleTimeString(void 0,{hour:"2-digit",minute:"2-digit",timeZone:"UTC",hour12:!1});return`${n}
${s}`}function jn(e){const t=Be(e.priority),n=!E&&e.project?`<span class="badge project">${e.project}</span>`:"",s=t?`<span class="badge ${t}">${e.priority}</span>`:"",o=`<span class="badge status-${e.status}">${_e(e.status)}</span>`;return`
    <div class="chronicle-event" data-id="${e.id}" data-project="${e.project}" data-completed-at="${e.completed_at||""}">
      <div class="chronicle-dot ev-completed"></div>
      <div class="chronicle-event-time">${_n(e.completed_at)}</div>
      <div class="chronicle-event-body">
        <button class="chronicle-task-link" data-id="${e.id}" data-project="${e.project}">
          #${e.id} ${e.title}
        </button>
        ${o}
        ${s}
        ${n}
      </div>
    </div>`}function Bn(e){var p,m;const t=Be(e.priority),n=t?`<span class="badge ${t}">${e.priority}</span>`:"",s=!E&&e.project?`<span class="badge project">${e.project}</span>`:"",o=`<span class="badge status-${e.status}">${_e(e.status)}</span>`,i=`<span class="badge level-${e.level}">L${e.level}</span>`,l=((p=e.created_at)==null?void 0:p.slice(0,10))||"",c=((m=e.completed_at)==null?void 0:m.slice(0,10))||"—",r=ge(e.tags).map(u=>`<span class="tag">${u}</span>`).join("");return`
    <article class="list-card status-${e.status}" data-id="${e.id}" data-project="${e.project}" data-completed-at="${e.completed_at||""}">
      <div class="list-card-top">
        <div class="list-card-meta">
          <span class="list-card-id">#${e.id}</span>
          ${o}
          ${i}
          ${n}
        </div>
        ${s}
      </div>
      <button class="list-card-title col-title" data-id="${e.id}" data-project="${e.project}">
        ${e.title}
      </button>
      <div class="list-card-dates">
        <span>Created ${l||"—"}</span>
        <span>Done ${c}</span>
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
          <select class="list-priority-select ${t}" data-id="${e.id}" data-field="priority">
            ${["high","medium","low"].map(u=>`<option value="${u}" ${u===e.priority?"selected":""}>${u[0].toUpperCase()+u.slice(1)}</option>`).join("")}
          </select>
        </label>
      </div>
      ${r?`<div class="list-card-tags">${r}</div>`:""}
    </article>
  `}async function Lt(){const e=document.getElementById("chronicle-view");try{const t=await ne("full");Ne(t.projects);const n=[];for(const l of F)for(const c of t[l.key])n.push(c);const s=n.filter(l=>!!l.completed_at).sort((l,c)=>c.completed_at.localeCompare(l.completed_at)),o=new Map;for(const l of s){const c=Cn(l.completed_at);o.has(c)||o.set(c,[]),o.get(c).push(l)}if(o.size===0){e.innerHTML=`
        <div style="display:flex;align-items:center;justify-content:center;color:#64748b;font-size:0.9rem;padding:64px">
          No completed tasks yet
        </div>`;return}const i=[...o.entries()].map(([l,c])=>{const a=c.map(jn).join("");return`
        <div class="chronicle-group">
          <div class="chronicle-week-header">${l}</div>
          <div class="chronicle-events">${a}</div>
        </div>`}).join("");e.innerHTML=`<div class="chronicle-timeline">${i}</div>`,e.querySelectorAll(".chronicle-task-link").forEach(l=>{l.addEventListener("click",c=>{c.stopPropagation();const a=parseInt(l.dataset.id),r=l.dataset.project||void 0;N(a,r)})})}catch(t){console.error("loadChronicleView failed:",t),e.innerHTML=`
      <div style="display:flex;align-items:center;justify-content:center;color:#ef4444;font-size:0.9rem;padding:48px">
        Failed to load chronicle
      </div>`}}async function It(){const e=document.getElementById("graph-view");e.innerHTML=`
    <div class="graph-placeholder">
      <div class="graph-spinner"></div>
      <p>Loading graph&hellip;</p>
    </div>`,W&&(W.disconnect(),W=null);const t={todo:"#475569",plan:"#3b82f6",impl:"#8b5cf6",impl_review:"#6366f1",plan_review:"#a855f7",test:"#f59e0b",done:"#22c55e"},n={1:4,2:7,3:10};try{const[{default:s},o]=await Promise.all([Dt(()=>import("./force-graph-B6EEfo0M.js"),[]),ne("full")]),i=[];for(const d of F){const v=o[d.key];for(const g of v)i.push({...g,_status:d.key})}let l=i,c="";i.length>300&&(l=i.filter(d=>d._status!=="done"),c=`<div style="position:absolute;top:8px;left:50%;transform:translateX(-50%);z-index:10;background:#1e293b;color:#f59e0b;padding:4px 12px;border-radius:6px;font-size:0.8rem;border:1px solid #f59e0b40">${i.length} nodes — done tasks hidden for performance</div>`);const a=l.map(d=>({id:d.id,title:`#${d.id} ${d.title}`,status:d._status,level:d.level??1,tags:ge(d.tags)})),r=new Map;for(const d of a)for(const v of d.tags){const g=v.toLowerCase();r.has(g)||r.set(g,[]),r.get(g).push(d.id)}const p=new Set,m=[];for(const[d,v]of r)for(let g=0;g<v.length;g++)for(let $=g+1;$<v.length;$++){const j=Math.min(v[g],v[$]),x=Math.max(v[g],v[$]),T=`${j}-${x}`;p.has(T)||(p.add(T),m.push({source:j,target:x,tag:d}))}e.innerHTML=c,e.style.position="relative",e.style.padding="0";const u=document.createElement("div");u.style.width="100%",u.style.height="100%",e.appendChild(u);const h=s()(u).backgroundColor("#0f172a").nodeId("id").nodeLabel("title").nodeColor(d=>t[d.status]||"#475569").nodeVal(d=>n[d.level]||n[1]).linkColor(()=>"#334155").linkWidth(.5).warmupTicks(50).cooldownTime(3e3).width(e.clientWidth).height(e.clientHeight).graphData({nodes:a,links:m});W=new ResizeObserver(d=>{for(const v of d){const{width:g,height:$}=v.contentRect;g>0&&$>0&&h.width(g).height($)}}),W.observe(e)}catch(s){console.error("loadGraphView failed:",s),e.innerHTML=`
      <div class="graph-placeholder">
        <p style="color:#ef4444;font-size:0.9rem">Failed to load graph</p>
      </div>`}}async function fe(){var t,n,s,o,i,l,c,a;const e=document.getElementById("board");try{const r=await ne(Pe()?"full":"board");sn(r),Ne(r.projects),e.innerHTML=F.map(h=>{var d;return pn(h.key,h.label,h.icon,r[h.key],((d=r.counts)==null?void 0:d[h.key])??r[h.key].length)}).join("");const p=((t=r.counts)==null?void 0:t.done)??r.done.length,m=r.total??(((n=r.counts)==null?void 0:n.todo)??r.todo.length)+(((s=r.counts)==null?void 0:s.plan)??r.plan.length)+(((o=r.counts)==null?void 0:o.plan_review)??r.plan_review.length)+(((i=r.counts)==null?void 0:i.impl)??r.impl.length)+(((l=r.counts)==null?void 0:l.impl_review)??r.impl_review.length)+(((c=r.counts)==null?void 0:c.test)??r.test.length)+(((a=r.counts)==null?void 0:a.done)??r.done.length);document.getElementById("count-summary").textContent=`${p}/${m} completed`,e.querySelectorAll(".card").forEach(h=>{h.addEventListener("click",d=>{if(d.target.closest(".card-interactive")){d.stopPropagation();return}const g=d.target.closest(".card-copy-btn");if(g){d.stopPropagation(),navigator.clipboard.writeText(g.dataset.copy).then(()=>{const x=g.textContent;g.textContent="✓",setTimeout(()=>{g.textContent=x},1e3)});return}const $=parseInt(h.dataset.id),j=h.dataset.project;N($,j)})}),L||Rn(),Tn(),Te();const u=document.getElementById("add-card-btn");u&&u.addEventListener("click",h=>{h.stopPropagation(),document.getElementById("add-card-overlay").classList.remove("hidden"),D(),L||document.getElementById("add-title").focus()})}catch(r){console.error("loadBoard failed:",r),e.innerHTML=`
      <div style="grid-column:1/-1;display:flex;align-items:center;justify-content:center;color:#ef4444;font-size:0.9rem;padding:48px">
        Cannot find .claude/kanban.db
      </div>
    `}}function Tn(){document.querySelectorAll("[data-column-toggle]").forEach(e=>{e.addEventListener("click",t=>{if(!L)return;t.stopPropagation();const n=e.dataset.columnToggle;if(!n)return;J.has(n)?J.delete(n):J.add(n),bt();const s=e.closest(".column"),o=J.has(n)||!!ue.trim();s&&s.setAttribute("data-mobile-expanded",String(o)),e.setAttribute("aria-expanded",String(o));const i=e.querySelector(".column-toggle-icon");i&&(i.textContent=o?"−":"+")})}),document.querySelectorAll(".mobile-status-select").forEach(e=>{e.addEventListener("click",t=>t.stopPropagation()),e.addEventListener("change",async t=>{t.stopPropagation();const n=e.value,s=parseInt(e.dataset.id||"",10),o=e.dataset.project||"",i=e.dataset.currentStatus||"";!s||!o||await cn({id:s,project:o,status:i},n)})})}async function je(){const e=document.getElementById("list-view");try{const t=await ne("full");Ne(t.projects);const n=[];for(const a of F)for(const r of t[a.key])n.push(r);const s=K==="default"?[...n].sort((a,r)=>r.id-a.id):wt(n),o=s.length,i=s.filter(a=>a.status==="done").length;document.getElementById("count-summary").textContent=`${i}/${o} completed`;const l=s.map(a=>{var u,h;const r=Be(a.priority),m=ge(a.tags).map(d=>`<span class="tag">${d}</span>`).join("");return`
        <tr class="status-${a.status}" data-id="${a.id}" data-project="${a.project}" data-completed-at="${a.completed_at||""}">
          <td class="col-id">#${a.id}</td>
          <td class="col-title">${a.title}</td>
          <td>
            <select class="list-status-select" data-id="${a.id}" data-field="status">
              ${F.map(d=>`<option value="${d.key}" ${d.key===a.status?"selected":""}>${d.icon} ${d.label}</option>`).join("")}
            </select>
          </td>
          <td>
            <select class="list-level-select" data-id="${a.id}" data-field="level">
              ${[1,2,3].map(d=>`<option value="${d}" ${d===a.level?"selected":""}>L${d}</option>`).join("")}
            </select>
          </td>
          <td>
            <select class="list-priority-select ${r}" data-id="${a.id}" data-field="priority">
              ${["high","medium","low"].map(d=>`<option value="${d}" ${d===a.priority?"selected":""}>${d[0].toUpperCase()+d.slice(1)}</option>`).join("")}
            </select>
          </td>
          <td class="list-date">${a.project||""}</td>
          <td>${m}</td>
          <td class="list-date">${((u=a.created_at)==null?void 0:u.slice(0,10))||""}</td>
          <td class="list-date">${((h=a.completed_at)==null?void 0:h.slice(0,10))||""}</td>
        </tr>
      `}).join(""),c=s.map(Bn).join("");e.innerHTML=`
      <div class="list-view-shell">
        <div class="list-cards" data-mobile-list>
          ${c||'<div class="empty">No items</div>'}
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
          <tbody>${l}</tbody>
        </table>
      </div>
    `,e.querySelectorAll("select").forEach(a=>{a.addEventListener("change",async r=>{r.stopPropagation();const p=a,m=p.dataset.id,u=p.dataset.field;let h=p.value;u==="level"&&(h=parseInt(h));const d=p.closest("tr"),v=(d==null?void 0:d.dataset.project)||"",g=await S(`/api/task/${m}?project=${encodeURIComponent(v)}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({[u]:h})});if(!g.ok){const $=await g.json().catch(()=>({}));$.error&&ve($.error),je();return}P(v),je()})}),e.querySelectorAll(".col-title").forEach(a=>{a.addEventListener("click",r=>{r.stopPropagation();const p=a.closest("[data-id]"),m=parseInt(p.dataset.id),u=p.dataset.project;N(m,u)})}),Te()}catch(t){console.error("loadListView failed:",t),e.innerHTML=`
      <div style="display:flex;align-items:center;justify-content:center;color:#ef4444;font-size:0.9rem;padding:48px">
        Failed to load task list
      </div>
    `}}function Ne(e){const t=document.getElementById("project-filter");if(e.length<=1){t.innerHTML=e[0]?`<span class="project-label">${e[0]}</span>`:"";return}const n=e.map(s=>`<option value="${s}" ${s===E?"selected":""}>${s}</option>`).join("");t.innerHTML=`
    <select id="project-select">
      <option value="">All Projects</option>
      ${n}
    </select>
  `,document.getElementById("project-select").addEventListener("change",s=>{E=s.target.value||null,E?localStorage.setItem("kanban-project",E):localStorage.removeItem("kanban-project"),C=null,G=null,B()})}function dt(e,t){const n=[...e.querySelectorAll(".card:not(.dragging)")];for(const s of n){const o=s.getBoundingClientRect(),i=o.top+o.height/2;if(t<i)return s}return null}function Le(){document.querySelectorAll(".drop-indicator").forEach(e=>e.remove())}function An(e,t){Le();const n=document.createElement("div");n.className="drop-indicator",t?e.insertBefore(n,t):e.appendChild(n)}function Rn(){const e=document.querySelectorAll(".card"),t=document.querySelectorAll(".column-body");e.forEach(n=>{n.addEventListener("dragstart",s=>{const o=s,i=n;o.dataTransfer.setData("text/plain",`${i.dataset.project}:${i.dataset.id}`),i.classList.add("dragging"),Se=!0}),n.addEventListener("dragend",()=>{n.classList.remove("dragging"),Le(),Se=!1})}),t.forEach(n=>{n.addEventListener("dragover",s=>{s.preventDefault();const o=n;o.classList.add("drag-over");const i=dt(o,s.clientY);An(o,i)}),n.addEventListener("dragleave",s=>{const o=n;o.contains(s.relatedTarget)||(o.classList.remove("drag-over"),Le())}),n.addEventListener("drop",async s=>{s.preventDefault();const o=n;o.classList.remove("drag-over"),Le();const i=s,l=i.dataTransfer.getData("text/plain"),c=l.lastIndexOf(":"),a=c>=0?l.slice(0,c):"",r=parseInt(c>=0?l.slice(c+1):l),p=o.dataset.column,m=dt(o,i.clientY),u=[...o.querySelectorAll(".card:not(.dragging)")];let h=null,d=null;if(m){d=parseInt(m.dataset.id);const g=u.indexOf(m);g>0&&(h=parseInt(u[g-1].dataset.id))}else u.length>0&&(h=parseInt(u[u.length-1].dataset.id));const v=await S(`/api/task/${r}/reorder?project=${encodeURIComponent(a)}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({status:p,afterId:h,beforeId:d})});if(!v.ok){const g=await v.json().catch(()=>({}));g.error&&ve(g.error)}P(a),fe()})})}function ve(e){const t=document.querySelector(".toast");t&&t.remove();const n=document.createElement("div");n.className="toast",n.textContent=e,document.body.appendChild(n),setTimeout(()=>n.remove(),3e3)}async function St(){try{const t=await(await S("/api/info")).json();t.projectName&&(document.title=`Kanban · ${t.projectName}`,document.querySelector("header h1").textContent=`Kanban · ${t.projectName}`)}catch{}}function ye(e){_=e,localStorage.setItem(Oe,_);const t=document.getElementById("board"),n=document.getElementById("list-view"),s=document.getElementById("chronicle-view"),o=document.getElementById("graph-view");W&&e!=="graph"&&(W.disconnect(),W=null),t.classList.add("hidden"),n.classList.add("hidden"),s.classList.add("hidden"),o.classList.add("hidden"),document.getElementById("tab-board").classList.remove("active"),document.getElementById("tab-list").classList.remove("active"),document.getElementById("tab-chronicle").classList.remove("active"),document.getElementById("tab-graph").classList.remove("active"),e==="board"?(t.classList.remove("hidden"),document.getElementById("tab-board").classList.add("active"),fe()):e==="list"?(n.classList.remove("hidden"),document.getElementById("tab-list").classList.add("active"),je()):e==="chronicle"?(s.classList.remove("hidden"),document.getElementById("tab-chronicle").classList.add("active"),Lt()):(o.classList.remove("hidden"),document.getElementById("tab-graph").classList.add("active"),It())}function B(){_==="board"?fe():_==="list"?je():_==="chronicle"?Lt():It()}document.getElementById("sort-select").value=K;O&&document.getElementById("hide-done-btn").classList.add("active");me();qe();document.getElementById("auth-btn").addEventListener("click",()=>{if(R&&I){X("Shared token is stored on this device. Use Forget Token to reset it.","success");return}X(R?"Enter the shared access token to load the board.":"This environment does not require a shared token.")});document.getElementById("auth-close").addEventListener("click",()=>{R&&!I||he()});document.getElementById("auth-clear-btn").addEventListener("click",async()=>{await Xt(),R?X("Stored token cleared. Enter a shared access token to continue."):(he(),te("Stored token cleared."))});document.getElementById("auth-form").addEventListener("submit",async e=>{e.preventDefault();const n=document.getElementById("auth-token-input").value.trim();if(!n){te("Enter the shared access token.","error");return}te("Unlocking board...","default");try{await yt(n),te("Board unlocked.","success"),await St(),$t(),B()}catch(s){te(s instanceof Error?s.message:"Board authentication failed.","error")}});document.getElementById("tab-board").addEventListener("click",()=>ye("board"));document.getElementById("tab-list").addEventListener("click",()=>ye("list"));document.getElementById("tab-chronicle").addEventListener("click",()=>ye("chronicle"));document.getElementById("tab-graph").addEventListener("click",()=>ye("graph"));document.getElementById("toolbar-mobile-toggle").addEventListener("click",()=>{le=!le,qe()});ht.addEventListener("change",e=>{zt(e.matches)});document.addEventListener("visibilitychange",()=>{document.visibilityState!=="visible"||!I||(Ue(),B())});function Ct(){if(ke)return;ke=!0;const e=new EventSource("/api/events");e.onmessage=()=>{if(Se)return;const t=!document.getElementById("modal-overlay").classList.contains("hidden"),n=!document.getElementById("add-card-overlay").classList.contains("hidden");!t&&!n&&B()},e.onerror=()=>{e.close(),ke=!1,(!R||I)&&setTimeout(Ct,5e3)}}document.getElementById("refresh-btn").addEventListener("click",B);document.getElementById("search-input").addEventListener("input",e=>{if(ue=e.target.value.trim(),_==="board"){fe();return}Te()});document.getElementById("sort-select").addEventListener("change",e=>{K=e.target.value,localStorage.setItem("kanban-sort",K),B()});document.getElementById("hide-done-btn").addEventListener("click",()=>{O=!O,localStorage.setItem("kanban-hide-old",String(O)),document.getElementById("hide-done-btn").classList.toggle("active",O),Te()});document.getElementById("modal-close").addEventListener("click",()=>{document.getElementById("modal-overlay").classList.add("hidden"),D()});document.getElementById("modal-overlay").addEventListener("click",e=>{e.target===e.currentTarget&&(document.getElementById("modal-overlay").classList.add("hidden"),D())});document.addEventListener("keydown",e=>{e.key==="Escape"&&(document.getElementById("modal-overlay").classList.add("hidden"),document.getElementById("add-card-overlay").classList.add("hidden"),!document.getElementById("auth-overlay").classList.contains("hidden")&&I&&he(),D())});const pe=document.getElementById("add-card-overlay");let q=[];function $e(){const e=document.getElementById("add-attachment-preview");if(q.length===0){e.innerHTML="";return}e.innerHTML=q.map((t,n)=>`
    <div class="attachment-thumb">
      <img src="${URL.createObjectURL(t)}" alt="${t.name}" />
      <button class="attachment-remove" data-idx="${n}" title="Remove" type="button">&times;</button>
      <span class="attachment-name">${t.name}</span>
    </div>
  `).join(""),e.querySelectorAll(".attachment-remove").forEach(t=>{t.addEventListener("click",n=>{n.stopPropagation();const s=parseInt(t.dataset.idx);q.splice(s,1),$e()})})}function Fe(e){for(const t of Array.from(e))t.type.startsWith("image/")&&q.push(t);$e()}document.getElementById("add-card-close").addEventListener("click",()=>{pe.classList.add("hidden"),q=[],$e(),D()});pe.addEventListener("click",e=>{e.target===e.currentTarget&&(pe.classList.add("hidden"),q=[],$e(),D())});const Q=document.getElementById("add-attachment-zone"),oe=document.getElementById("add-attachment-input");Q.addEventListener("click",()=>oe.click());Q.addEventListener("dragover",e=>{e.preventDefault(),Q.classList.add("drop-active")});Q.addEventListener("dragleave",()=>{Q.classList.remove("drop-active")});Q.addEventListener("drop",e=>{var n;e.preventDefault(),Q.classList.remove("drop-active");const t=(n=e.dataTransfer)==null?void 0:n.files;t&&Fe(t)});oe.addEventListener("change",()=>{oe.files&&Fe(oe.files),oe.value=""});pe.addEventListener("paste",e=>{var n;const t=Array.from(((n=e.clipboardData)==null?void 0:n.files)??[]).filter(s=>s.type.startsWith("image/"));t.length!==0&&(e.preventDefault(),Fe(t))});document.getElementById("add-card-form").addEventListener("submit",async e=>{e.preventDefault();const t=document.getElementById("add-title").value.trim();if(!t)return;const n=document.getElementById("add-priority").value,s=parseInt(document.getElementById("add-level").value)||3,o=document.getElementById("add-description").value.trim()||null,i=document.getElementById("add-tags").value.trim(),l=i?i.split(",").map(m=>m.trim()).filter(Boolean):null,c=E;if(!c){ve("Select a project first");return}const a=document.querySelector("#add-card-form .form-submit");a.textContent=q.length>0?"Creating...":"Add Card",a.disabled=!0;const p=await(await S("/api/task",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({title:t,priority:n,level:s,description:o,tags:l,project:c})})).json();q.length>0&&p.id&&await Ee(p.id,q,c),q=[],a.textContent="Add Card",a.disabled=!1,document.getElementById("add-card-form").reset(),$e(),pe.classList.add("hidden"),D(),P(c),B()});an().then(async e=>{e&&(await St(),ye(_),$t())}).catch(()=>{X("Unable to initialize board authentication.","error")});Vt();
