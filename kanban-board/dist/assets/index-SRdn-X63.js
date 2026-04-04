import wt from"https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs";(function(){const n=document.createElement("link").relList;if(n&&n.supports&&n.supports("modulepreload"))return;for(const o of document.querySelectorAll('link[rel="modulepreload"]'))s(o);new MutationObserver(o=>{for(const r of o)if(r.type==="childList")for(const d of r.addedNodes)d.tagName==="LINK"&&d.rel==="modulepreload"&&s(d)}).observe(document,{childList:!0,subtree:!0});function t(o){const r={};return o.integrity&&(r.integrity=o.integrity),o.referrerPolicy&&(r.referrerPolicy=o.referrerPolicy),o.crossOrigin==="use-credentials"?r.credentials="include":o.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function s(o){if(o.ep)return;o.ep=!0;const r=t(o);fetch(o.href,r)}})();wt.initialize({startOnLoad:!1,theme:"dark",themeVariables:{primaryColor:"#334155",primaryBorderColor:"#60a5fa",primaryTextColor:"#f1f5f9",lineColor:"#64748b",secondaryColor:"#1e293b",tertiaryColor:"#0f172a"}});window.__mermaid=wt;const Nt="modulepreload",Ft=function(e){return"/"+e},mt={},Vt=function(n,t,s){let o=Promise.resolve();if(t&&t.length>0){let d=function(i){return Promise.all(i.map(u=>Promise.resolve(u).then(h=>({status:"fulfilled",value:h}),h=>({status:"rejected",reason:h}))))};document.getElementsByTagName("link");const c=document.querySelector("meta[property=csp-nonce]"),a=(c==null?void 0:c.nonce)||(c==null?void 0:c.getAttribute("nonce"));o=d(t.map(i=>{if(i=Ft(i),i in mt)return;mt[i]=!0;const u=i.endsWith(".css"),h=u?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${i}"]${h}`))return;const m=document.createElement("link");if(m.rel=u?"stylesheet":Nt,u||(m.as="script"),m.crossOrigin="",m.href=i,a&&m.setAttribute("nonce",a),document.head.appendChild(m),u)return new Promise((g,f)=>{m.addEventListener("load",g),m.addEventListener("error",()=>f(new Error(`Unable to preload CSS for ${i}`)))})}))}function r(d){const c=new Event("vite:preloadError",{cancelable:!0});if(c.payload=d,window.dispatchEvent(c),!c.defaultPrevented)throw d}return o.then(d=>{for(const c of d||[])c.status==="rejected"&&r(c.reason);return n().catch(r)})},G=[{key:"todo",label:"Requirements",icon:"📋"},{key:"plan",label:"Plan",icon:"🗺️"},{key:"plan_review",label:"Review Plan",icon:"🔍"},{key:"impl",label:"Implement",icon:"🔨"},{key:"impl_review",label:"Review Impl",icon:"📝"},{key:"test",label:"Test",icon:"🧪"},{key:"done",label:"Done",icon:"✅"}],zt={plan:"Planning",plan_review:"Plan Review",impl:"Implementing",impl_review:"Impl Review",test:"Testing"},Oe="kanban-auth-token",Ze="kanban-current-view",Et="kanban-mobile-board-columns",Wt=3e4,Kt=10,Jt=10,Lt="kanban-summary-cache",Yt={board:3e4,full:6e4},It=window.matchMedia("(max-width: 768px)");function Gt(){!("serviceWorker"in navigator)||!(window.location.protocol==="https:"||window.location.hostname==="localhost"||window.location.hostname==="127.0.0.1")||window.addEventListener("load",()=>{navigator.serviceWorker.register("/sw.js").catch(n=>{console.warn("Service worker registration failed",n)})})}function Zt(e){return e==="board"||e==="list"||e==="chronicle"||e==="graph"}function Xt(e){return G.some(n=>n.key===e)}function Qt(){try{const e=localStorage.getItem(Et);if(!e)return new Set;const n=JSON.parse(e);return Array.isArray(n)?new Set(n.filter(t=>typeof t=="string"&&Xt(t))):new Set}catch{return new Set}}let E=localStorage.getItem("kanban-project"),J=localStorage.getItem("kanban-category"),Ct=[];const Me=new Map;let ht=!1,De=!1,T=It.matches,C=Zt(localStorage.getItem(Ze))?localStorage.getItem(Ze):T?"list":"board",ue="",ee=localStorage.getItem("kanban-sort")||"default",U=localStorage.getItem("kanban-hide-old")==="true",N=localStorage.getItem(Oe)||"",F=!1,A=!1,Ge=!1,Ee=!T,te=Qt(),B=null,be=null,ne=null;const $e=new Map,de=new Map,we=new Map;let Q=null,re=null;function pe(e,n="default"){const t=document.getElementById("auth-message");t.textContent=e,t.classList.remove("error","success"),n!=="default"&&t.classList.add(n)}function K(){const n=[document.getElementById("modal-overlay"),document.getElementById("add-card-overlay"),document.getElementById("auth-overlay")].some(t=>t&&!t.classList.contains("hidden"));document.body.classList.toggle("overlay-open",n)}function Se(){const e=document.getElementById("auth-btn");if(e){if(!F){e.textContent="Open",e.title="Board access is open in this environment";return}e.textContent=A?"Private":"Locked",e.title=A?"Shared token configured for this browser":"Shared token required"}}function ce(e="Enter the shared access token to load the board.",n="default"){A=!1,document.getElementById("auth-overlay").classList.remove("hidden"),K();const t=document.getElementById("auth-token-input");t.value=N,pe(e,n),Se(),setTimeout(()=>t.focus(),0)}function je(){document.getElementById("auth-overlay").classList.add("hidden"),K(),Se()}function St(e){N=e.trim(),N?localStorage.setItem(Oe,N):localStorage.removeItem(Oe)}function Qe(){document.body.classList.toggle("mobile-shell",T),document.body.classList.toggle("mobile-toolbar-open",!T||Ee);const e=document.getElementById("toolbar-mobile-toggle");if(e){const n=!T||Ee;e.hidden=!T,e.setAttribute("aria-expanded",String(n)),e.textContent=n?"Hide Filters":"Show Filters"}}function en(e){T=e,T||(Ee=!0),Qe(),A&&C==="board"&&k()}function jt(){return window.location.hostname==="localhost"||window.location.hostname==="127.0.0.1"}function et(){be!==null&&(window.clearInterval(be),be=null)}function tt(e=E,n="full"){return`${e||"__all__"}::${n}`}function He(e=E,n="full"){return`${Lt}::${tt(e,n)}`}function tn(e=E,n="full"){try{const t=localStorage.getItem(He(e,n));if(!t)return null;const s=JSON.parse(t);return!s||typeof s.fetchedAt!="number"||!s.board?null:Date.now()-s.fetchedAt>Yt[n]?(localStorage.removeItem(He(e,n)),null):s}catch{return null}}function nn(e,n,t,s){try{const o={fetchedAt:Date.now(),etag:s,board:t};localStorage.setItem(He(e,n),JSON.stringify(o))}catch{}}function V(e=E,n){const t=n?[n]:["board","full"];for(const s of t){const o=tt(e,s);$e.delete(o),de.delete(o),we.delete(o);try{localStorage.removeItem(He(e,s))}catch{}}e===E&&(B=null,ne=null)}function nt(e={}){if($e.clear(),de.clear(),we.clear(),B=null,ne=null,e.persisted)try{const n=[];for(let t=0;t<localStorage.length;t+=1){const s=localStorage.key(t);s!=null&&s.startsWith(`${Lt}::`)&&n.push(s)}n.forEach(t=>localStorage.removeItem(t))}catch{}}function _t(){N="",localStorage.removeItem(Oe);const e=document.getElementById("auth-token-input");e&&(e.value="")}async function an(){const e=new Headers;N&&e.set("X-Kanban-Auth",N);const t=await(await fetch("/api/auth/session",{method:"GET",headers:e,credentials:"same-origin"})).json().catch(()=>({}));return{authenticated:!!t.authenticated,authRequired:!!t.authRequired,mode:t.mode,source:t.source??null,reason:t.reason??null,error:t.error??null}}async function Bt(e){const n=e.trim(),t=await fetch("/api/auth/session",{method:"POST",headers:{"X-Kanban-Auth":n},credentials:"same-origin"}),s=await t.json().catch(()=>({}));if(!t.ok){const o=s.reason==="invalid_token"?"Shared token is invalid.":s.reason==="token_hash_missing"?"Server auth is not configured yet.":"Board authentication failed.";throw new Error(o)}St(n),F=!!s.authRequired,A=!0,je(),Se()}async function sn(){await fetch("/api/auth/session",{method:"DELETE",credentials:"same-origin"}).catch(()=>{}),et(),nt({persisted:!0}),_t(),A=!F,Se()}async function _(e,n={},t=!1){const s=new Headers(n.headers||{});N&&!s.has("X-Kanban-Auth")&&s.set("X-Kanban-Auth",N);const o=await fetch(e,{...n,headers:s,credentials:"same-origin"});if((o.status===401||o.status===403||o.status===503)&&!t){const r=await o.clone().json().catch(()=>({}));F=!0,A=!1,r.reason==="invalid_token"&&_t();const d=r.reason==="invalid_token"?"Stored token was rejected. Enter a valid shared token.":r.reason==="token_hash_missing"?"Server auth hash is not configured yet.":"Shared token is required for this board.";throw ce(d,"error"),new Error(r.error||d)}return o}async function at(e=E){const n=e?`?project=${encodeURIComponent(e)}`:"",t=new Headers;ne&&t.set("If-None-Match",ne);const s=await _(`/api/board/version${n}`,{headers:t});return s.status===304?B?null:(ne=null,at()):(ne=s.headers.get("ETag"),s.json())}function on(e){return e==="board"?C==="board"&&!Xe():C==="list"||C==="chronicle"||C==="board"&&Xe()}function Xe(){return ue.trim().length>0}function rn(e,n,t,s){if(!A||we.has(n))return;const o=(async()=>{try{const r=await at(s);if(!r)return;if(t&&r.version===t){B=r.version;return}V(s,e),await me(e,{bypassTtl:!0,projectOverride:s}),E===s&&on(e)&&k()}catch{}finally{we.delete(n)}})();we.set(n,o)}async function me(e="full",n={}){const t=n.projectOverride===void 0?E:n.projectOverride,s=["summary=true"];t&&s.unshift(`project=${encodeURIComponent(t)}`),e==="board"&&s.push("compact=board",`todo_limit=${Kt}`,`done_limit=${Jt}`);const o=`?${s.join("&")}`,r=tt(t,e);if(!n.bypassTtl){const h=tn(t,e);if(h)return $e.set(r,h.board),h.etag&&de.set(r,h.etag),B=h.board.version||B,rn(e,r,h.board.version||null,t),h.board}const d=new Headers,c=de.get(r);c&&d.set("If-None-Match",c);const a=await _(`/api/board${o}`,{headers:d});if(a.status===304){const h=$e.get(r);return h?(B=h.version||B,h):(de.delete(r),me(e,{bypassTtl:!0}))}const i=await a.json(),u=a.headers.get("ETag");return u&&de.set(r,u),$e.set(r,i),nn(t,e,i,u),B=i.version||B,i}function cn(){jt()||be!==null||(be=window.setInterval(async()=>{if(!A||De)return;const e=!document.getElementById("modal-overlay").classList.contains("hidden"),n=!document.getElementById("add-card-overlay").classList.contains("hidden");if(!(e||n))try{const t=await at();if(!t)return;if(!B){B=t.version;return}t.version!==B&&(B=t.version,k())}catch{F&&!A&&et()}},Wt))}function Tt(){if(jt()){et(),qt();return}cn()}function ln(){const e=new URL(window.location.href),n=e.searchParams.get("auth")||e.searchParams.get("token");n&&(St(n),e.searchParams.delete("auth"),e.searchParams.delete("token"),window.history.replaceState({},"",e.toString()))}async function dn(){if(ln(),N)try{return await Bt(N),!0}catch(n){return ce(n instanceof Error?n.message:"Board authentication failed.","error"),!1}const e=await an();return F=e.authRequired,A=e.authenticated||!e.authRequired,e.authRequired&&!e.authenticated?(ce("Enter the shared access token to load the board."),!1):(je(),!0)}function Fe(e){return e==="high"?"high":e==="medium"?"medium":e==="low"?"low":""}function At(){localStorage.setItem(Et,JSON.stringify([...te]))}function pn(e){if(!T||te.size>0)return;const n=G.filter(t=>t.key==="todo"||t.key==="impl"||t.key!=="done"&&e[t.key].length>0).map(t=>t.key);te=new Set(n.length>0?n:["todo"]),At()}function un(e){return!T||ue.trim()?!0:te.has(e)}function Ue(e){var n;return((n=G.find(t=>t.key===e))==null?void 0:n.label)||e}function mn(e,n){return e===1?{todo:["impl"],impl:["done"],done:[]}[n]||[]:e===2?{todo:["plan"],plan:["impl","todo"],impl:["impl_review"],impl_review:["done","impl"],done:[]}[n]||[]:{todo:["plan"],plan:["plan_review","todo"],plan_review:["impl","plan"],impl:["impl_review"],impl_review:["test","impl"],test:["done","impl"],done:[]}[n]||[]}async function hn(e,n){if(!n||n===e.status)return;const t=await _(`/api/task/${e.id}?project=${encodeURIComponent(e.project)}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({status:n})});if(!t.ok){const s=await t.json().catch(()=>({}));Te(s.error||"Failed to move task");return}V(e.project),Be()}function ve(e){return e?Date.now()-new Date(e).getTime()>4320*60*1e3:!1}function kt(e,n){return ee==="default"?n==="done"?[...e].sort((t,s)=>{const o=(s.completed_at||"").localeCompare(t.completed_at||"");return o!==0?o:t.rank-s.rank||t.id-s.id}):[...e].sort((t,s)=>s.rank-t.rank||s.id-t.id):[...e].sort((t,s)=>ee==="created_asc"?t.created_at.localeCompare(s.created_at):ee==="created_desc"?s.created_at.localeCompare(t.created_at):ee==="completed_desc"?(s.completed_at||"").localeCompare(t.completed_at||""):0)}function Ve(){const e=ue.toLowerCase().replace(/^#/,""),n=e.length>0||U;document.body.classList.toggle("mobile-board-search",C==="board"&&T&&e.length>0),C==="board"?(document.querySelectorAll(".card").forEach(t=>{const s=!e||(()=>{var i,u,h,m;const r=t.dataset.id||"",d=((u=(i=t.querySelector(".card-title"))==null?void 0:i.textContent)==null?void 0:u.toLowerCase())||"",c=((m=(h=t.querySelector(".card-desc"))==null?void 0:h.textContent)==null?void 0:m.toLowerCase())||"",a=[...t.querySelectorAll(".tag")].map(g=>{var f;return((f=g.textContent)==null?void 0:f.toLowerCase())||""}).join(" ");return r===e||d.includes(e)||c.includes(e)||a.includes(e)})(),o=U&&t.dataset.status==="done"&&ve(t.dataset.completedAt||"");t.style.display=s&&!o?"":"none"}),document.querySelectorAll(".column").forEach(t=>{const s=t.querySelectorAll(".card"),o=[...s].filter(a=>a.style.display!=="none").length,r=s.length,d=Number.parseInt(t.dataset.totalCount||`${r}`,10)||r,c=t.querySelector(".count");c&&(c.textContent=n||d!==r?`${o}/${d}`:`${d}`)})):C==="list"?(document.querySelectorAll("#list-view tbody tr").forEach(t=>{const s=!e||(()=>{var i,u,h,m;const r=t.dataset.id||"",d=((u=(i=t.querySelector(".col-title"))==null?void 0:i.textContent)==null?void 0:u.toLowerCase())||"",c=((m=(h=t.cells[5])==null?void 0:h.textContent)==null?void 0:m.toLowerCase())||"",a=[...t.querySelectorAll(".tag")].map(g=>{var f;return((f=g.textContent)==null?void 0:f.toLowerCase())||""}).join(" ");return r===e||d.includes(e)||c.includes(e)||a.includes(e)})(),o=U&&t.classList.contains("status-done")&&ve(t.dataset.completedAt||"");t.style.display=s&&!o?"":"none"}),document.querySelectorAll("#list-view .list-card").forEach(t=>{const s=!e||(()=>{var i,u,h;const r=t.dataset.id||"",d=((u=(i=t.querySelector(".list-card-title"))==null?void 0:i.textContent)==null?void 0:u.toLowerCase())||"",c=((h=t.dataset.project)==null?void 0:h.toLowerCase())||"",a=[...t.querySelectorAll(".tag")].map(m=>{var g;return((g=m.textContent)==null?void 0:g.toLowerCase())||""}).join(" ");return r===e||d.includes(e)||c.includes(e)||a.includes(e)})(),o=U&&t.classList.contains("status-done")&&ve(t.dataset.completedAt||"");t.style.display=s&&!o?"":"none"})):(document.querySelectorAll("#chronicle-view .chronicle-event").forEach(t=>{const s=!e||(()=>{var a,i,u;const r=t.dataset.id||"",d=((i=(a=t.querySelector(".chronicle-task-link"))==null?void 0:a.textContent)==null?void 0:i.toLowerCase())||"",c=((u=t.dataset.project)==null?void 0:u.toLowerCase())||"";return r===e||d.includes(e)||c.includes(e)})(),o=U&&ve(t.dataset.completedAt||"");t.style.display=s&&!o?"":"none"}),document.querySelectorAll("#chronicle-view .chronicle-group").forEach(t=>{const s=[...t.querySelectorAll(".chronicle-event")].filter(o=>o.style.display!=="none").length;t.style.display=s>0?"":"none"}))}function _e(e){if(!e||e==="null")return[];try{const n=JSON.parse(e);return Array.isArray(n)?n:[]}catch{return[]}}function fn(e){const n=new Date(e+"Z"),s=new Date().getTime()-n.getTime(),o=Math.floor(s/864e5);return o===0?"today":o===1?"yesterday":o<7?`${o}d ago`:o<30?`${Math.floor(o/7)}w ago`:e.slice(0,10)}function Y(e){if(!e||e==="null")return[];try{const n=JSON.parse(e);return Array.isArray(n)?n:[]}catch{return[]}}function gn(e){var M,l;const n=Fe(e.priority),t=n?`<span class="badge ${n}">${e.priority}</span>`:"",s=e.completed_at?`<span class="badge date">${e.completed_at.slice(0,10)}</span>`:e.created_at?`<span class="badge created">${fn(e.created_at)}</span>`:"",o=!E&&e.project?`<span class="badge project">${e.project}</span>`:"",r=zt[e.status],d=r?`<span class="badge status-${e.status}">${r}</span>`:"",c=`<span class="badge level-${e.level}">L${e.level}</span>`,a=e.current_agent?`<span class="badge agent-tag">${e.current_agent}</span>`:"",i=e.last_review_status?[]:Y(e.review_comments),u=e.last_review_status||(i.length>0?(M=i[i.length-1])==null?void 0:M.status:null),h=u?`<span class="badge ${u==="approved"?"review-approved":"review-changes"}">${u==="approved"?"Approved":"Changes Req."}</span>`:e.status==="impl_review"?'<span class="badge review-pending">Awaiting Review</span>':"",m=e.last_plan_review_status?[]:Y(e.plan_review_comments),g=e.last_plan_review_status||(m.length>0?(l=m[m.length-1])==null?void 0:l.status:null),f=g?`<span class="badge ${g==="approved"?"review-approved":"review-changes"}">${g==="approved"?"Plan OK":"Plan Changes"}</span>`:e.status==="plan_review"?'<span class="badge review-pending">Plan Review</span>':"",$=_e(e.tags).map(p=>`<span class="tag">${p}</span>`).join(""),b=e.note_count??Y(e.notes).length,R=b>0?`<span class="badge notes-count" title="${b} note(s)">💬 ${b}</span>`:"",S=mn(e.level,e.status).map(p=>`<option value="${p}">${Ue(p)}</option>`).join(""),x=S?`
      <label class="mobile-card-move card-interactive">
        <span>Move</span>
        <select class="mobile-status-select" data-id="${e.id}" data-project="${e.project}" data-current-status="${e.status}">
          <option value="${e.status}">${Ue(e.status)}</option>
          ${S}
        </select>
      </label>
    `:"";return`
    <div class="${T?"card mobile-card":"card"}" ${T?'draggable="false"':'draggable="true"'} data-id="${e.id}" data-status="${e.status}" data-project="${e.project}" data-completed-at="${e.completed_at||""}">
      <div class="card-header">
        <span class="card-id">#${e.id}</span>
        ${c}
        ${t}
        ${d}
        ${a}
        <button class="card-copy-btn" data-copy="#${e.id} ${e.title}" title="Copy to clipboard">⎘</button>
      </div>
      <div class="card-title">${e.title}</div>
      <div class="card-footer">
        ${o}
        ${f}
        ${h}
        ${R}
        ${s}
      </div>
      ${x}
      ${$?`<div class="card-tags">${$}</div>`:""}
    </div>
  `}function vn(e,n,t,s,o=s.length){const r=un(e),d=kt(s,e).map(gn).join(""),c=e==="todo"?'<button class="add-card-btn" id="add-card-btn" title="Add card">+</button>':"",a=o!==s.length?`${s.length}/${o}`:`${o}`;return`
    <div class="column ${e}" data-column="${e}" data-mobile-expanded="${r}" data-total-count="${o}">
      <div class="column-header">
        <button class="column-toggle-btn" type="button" data-column-toggle="${e}" aria-expanded="${r}">
          <span class="column-toggle-label">${t} ${n}</span>
          <span class="column-toggle-meta">
            <span class="count">${a}</span>
            <span class="column-toggle-icon" aria-hidden="true">${r?"−":"+"}</span>
          </span>
        </button>
        <div class="column-header-right">
          ${c}
        </div>
      </div>
      <div class="column-body" data-column="${e}">
        ${d||'<div class="empty">No items</div>'}
      </div>
    </div>
  `}const yn=/```[\s\S]*?```/g,bn=/```\w*\n?/,ft=/```$/,gt=/^```mermaid\s*\n?/,$n=/\*\*(.+?)\*\*/g,wn=/`([^`]+)`/g,En=/^\x00CB(\d+)\x00$/,Ln=/^### (.+)$/,In=/^## (.+)$/,Cn=/^# (.+)$/,Sn=/^[-*]\s+(.+)$/,jn=/^\d+\.\s+(.+)$/,vt=/^\|(.+)\|$/,yt=/^\|[\s:-]+\|$/;let _n=0;function Le(e){const n=[];let t=e.replace(yn,i=>{if(gt.test(i)){const u=i.replace(gt,"").replace(ft,"").trim(),h=`mermaid-${++_n}`;n.push(`<pre class="mermaid" id="${h}">${u}</pre>`)}else{const u=i.replace(bn,"").replace(ft,"");n.push(`<pre><code>${u}</code></pre>`)}return`\0CB${n.length-1}\0`});t=t.replace(/</g,"&lt;"),t=t.replace($n,"<strong>$1</strong>").replace(wn,"<code>$1</code>");const s=t.split(`
`),o=[];let r=!1,d=!1;function c(){r&&(o.push("</ul>"),r=!1),d&&(o.push("</ol>"),d=!1)}let a=0;for(;a<s.length;){const i=s[a].trim(),u=i.match(En);if(u){c(),o.push(n[parseInt(u[1])]),a++;continue}if(vt.test(i)){c();const b=[];for(;a<s.length&&vt.test(s[a].trim());)b.push(s[a].trim()),a++;if(b.length>=2){const R=yt.test(b[1]),S=R?b[0]:null,x=R?2:0;let D='<table class="md-table">';if(S){const H=S.slice(1,-1).split("|").map(M=>M.trim());D+="<thead><tr>"+H.map(M=>`<th>${M}</th>`).join("")+"</tr></thead>"}D+="<tbody>";for(let H=x;H<b.length;H++){if(yt.test(b[H]))continue;const M=b[H].slice(1,-1).split("|").map(l=>l.trim());D+="<tr>"+M.map(l=>`<td>${l}</td>`).join("")+"</tr>"}D+="</tbody></table>",o.push(D)}else o.push(`<p>${b[0]}</p>`);continue}const h=i.match(Ln);if(h){c(),o.push(`<h3>${h[1]}</h3>`),a++;continue}const m=i.match(In);if(m){c(),o.push(`<h2>${m[1]}</h2>`),a++;continue}const g=i.match(Cn);if(g){c(),o.push(`<h1>${g[1]}</h1>`),a++;continue}const f=i.match(Sn);if(f){d&&(o.push("</ol>"),d=!1),r||(o.push("<ul>"),r=!0),o.push(`<li>${f[1]}</li>`),a++;continue}const $=i.match(jn);if($){r&&(o.push("</ul>"),r=!1),d||(o.push("<ol>"),d=!0),o.push(`<li>${$[1]}</li>`),a++;continue}c(),i===""?o.push(""):o.push(`<p>${i}</p>`),a++}return c(),o.join(`
`)}async function Bn(e){const n=window.__mermaid;if(!n)return;const t=e.querySelectorAll("pre.mermaid");if(t.length!==0)try{await n.run({nodes:t})}catch(s){console.warn("Mermaid render failed:",s)}}function xe(e,n,t,s,o){if(!s&&!o)return"";const r=s?Le(s):'<span class="phase-empty">Not yet documented</span>';return`
    <div class="lifecycle-phase ${t} ${o?"active":""}">
      <div class="phase-header">
        <span class="phase-icon">${n}</span>
        <span class="phase-label">${e}</span>
        <button class="phase-expand-btn" title="Expand to full screen">&#x26F6;</button>
      </div>
      <div class="phase-body">${r}</div>
    </div>
  `}function bt(e){return e.length===0?"":e.map(n=>{var t;return`
    <div class="review-entry ${n.status}">
      <div class="review-header">
        <span class="badge ${n.status==="approved"?"review-approved":"review-changes"}">
          ${n.status==="approved"?"Approved":"Changes Requested"}
        </span>
        <span class="review-meta">${n.reviewer||""} &middot; ${((t=n.timestamp)==null?void 0:t.slice(0,16))||""}</span>
      </div>
      <div class="review-comment">${Le(n.comment||"")}</div>
    </div>
  `}).join("")}function Tn(e){return e.length===0?"":e.map(n=>{var t;return`
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
      ${n.comment?`<div class="review-comment">${Le(n.comment)}</div>`:""}
    </div>
  `}).join("")}async function An(e,n=1920,t=.82){return new Promise((s,o)=>{const r=new Image,d=URL.createObjectURL(e);r.onload=()=>{URL.revokeObjectURL(d);let{width:c,height:a}=r;(c>n||a>n)&&(c>a?(a=Math.round(a*n/c),c=n):(c=Math.round(c*n/a),a=n));const i=document.createElement("canvas");i.width=c,i.height=a,i.getContext("2d").drawImage(r,0,0,c,a),s(i.toDataURL("image/jpeg",t))},r.onerror=()=>{URL.revokeObjectURL(d),o(new Error("Image load failed"))},r.src=d})}async function Pe(e,n,t){var s,o;for(const r of Array.from(n)){if(!r.type.startsWith("image/"))continue;let d;try{d=await An(r)}catch{d=await new Promise(u=>{const h=new FileReader;h.onload=()=>u(h.result),h.readAsDataURL(r)})}const c=(o=(s=r.name.match(/\.[^.]+$/))==null?void 0:s[0])==null?void 0:o.toLowerCase(),a=c===".jpg"||c===".jpeg"||c===".png"||c===".webp"||c===".gif"||c===".svg"?r.name:r.name.replace(/\.[^.]+$/,"")+".jpg",i=await _(`/api/task/${e}/attachment?project=${encodeURIComponent(t)}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({filename:a,data:d})});if(!i.ok){const u=await i.json().catch(()=>({}));Te(u.error||`Upload failed (${i.status})`);return}}z(e,t)}async function z(e,n){var r;const t=document.getElementById("modal-overlay"),s=document.getElementById("modal-content");s.innerHTML='<div style="color:#94a3b8">Loading...</div>',t.classList.remove("hidden"),K();try{const d=n?`?project=${encodeURIComponent(n)}`:"",a=await(await _(`/api/task/${e}${d}`)).json(),i=document.querySelector(`.card[data-id="${a.id}"][data-project="${CSS.escape(a.project)}"]`);i&&i.dataset.status!==a.status&&(nt(),k());const u=_e(a.tags),h=u.length?`<div class="modal-tags">${u.map(v=>`<span class="tag">${v}</span>`).join("")}</div>`:"",m=[`<strong>Project:</strong> ${a.project}`,`<strong>Status:</strong> ${a.status}`,`<strong>Priority:</strong> ${a.priority}`,`<strong>Created:</strong> ${((r=a.created_at)==null?void 0:r.slice(0,10))||"-"}`,a.started_at?`<strong>Started:</strong> ${a.started_at.slice(0,10)}`:"",a.planned_at?`<strong>Planned:</strong> ${a.planned_at.slice(0,10)}`:"",a.reviewed_at?`<strong>Reviewed:</strong> ${a.reviewed_at.slice(0,10)}`:"",a.tested_at?`<strong>Tested:</strong> ${a.tested_at.slice(0,10)}`:"",a.completed_at?`<strong>Completed:</strong> ${a.completed_at.slice(0,10)}`:""].filter(Boolean).join(" &nbsp;|&nbsp; "),g={1:{labels:["Req","Impl","Done"],statuses:["todo","impl","done"]},2:{labels:["Req","Plan","Impl","Review","Done"],statuses:["todo","plan","impl","impl_review","done"]},3:{labels:["Req","Plan","Plan Rev","Impl","Impl Rev","Test","Done"],statuses:["todo","plan","plan_review","impl","impl_review","test","done"]}},f=g[a.level]||g[3],$=Math.max(0,f.statuses.indexOf(a.status)),b=`
      <div class="lifecycle-progress">
        <span class="level-indicator">L${a.level}</span>
        ${f.labels.map((v,w)=>`
          <div class="progress-step ${w<$?"completed":""} ${w===$?"current":""}">
            <div class="step-dot"></div>
            <span class="step-label">${v}</span>
          </div>
        `).join('<div class="progress-line"></div>')}
      </div>
    `,R=Y(a.attachments),S=R.length>0?`<div class="attachments-grid">${R.map(v=>`<div class="attachment-thumb" data-stored="${v.storedName}">
            <img src="${v.url}" alt="${v.filename}" loading="lazy" />
            <button class="attachment-remove" data-id="${e}" data-name="${v.storedName}" title="Remove">&times;</button>
            <span class="attachment-name">${v.filename}</span>
          </div>`).join("")}</div>`:"",x=a.description?Le(a.description):'<span class="phase-empty">Not yet documented</span>',D=[1,2,3].map(v=>`<option value="${v}" ${v===a.level?"selected":""}>L${v}</option>`).join(""),H=`
      <div class="lifecycle-phase phase-requirement ${$===0?"active":""}">
        <div class="phase-header">
          <span class="phase-icon">📋</span>
          <span class="phase-label">Requirements</span>
          <select class="level-select" id="level-select" title="Pipeline Level">${D}</select>
          <button class="phase-edit-btn" id="req-edit-btn" title="Edit">&#9998;</button>
          <button class="phase-expand-btn" title="Expand to full screen">&#x26F6;</button>
        </div>
        <div class="phase-body" id="req-body-view">
          ${x}
          ${S}
        </div>
        <div class="phase-body hidden" id="req-body-edit">
          <textarea id="req-textarea" rows="8">${(a.description||"").replace(/</g,"&lt;")}</textarea>
          <div class="attachment-drop-zone" id="attachment-drop-zone">
            <span>📎 Drop images, paste (⌘V), or click to attach</span>
            <input type="file" id="attachment-input" accept="image/*" multiple hidden />
          </div>
          ${S?`<div id="edit-attachments">${S}</div>`:""}
          <div class="phase-edit-actions">
            <button class="phase-save-btn" id="req-save-btn">Save</button>
            <button class="phase-cancel-btn" id="req-cancel-btn">Cancel</button>
          </div>
        </div>
      </div>
    `,M=xe("Plan","🗺️","phase-plan",a.plan,$===1&&!a.plan);let l="";a.decision_log&&(l=xe("Decision Log","🧭","phase-decision-log",a.decision_log,!1));let p="";a.done_when&&(p=xe("Done When","🎯","phase-done-when",a.done_when,!1));const y=Y(a.plan_review_comments),L=bt(y);let P="";(L||$===2)&&(P=`
        <div class="lifecycle-phase phase-plan-review ${$===2?"active":""}">
          <div class="phase-header">
            <span class="phase-icon">🔍</span>
            <span class="phase-label">Plan Review</span>
            ${a.plan_review_count>0?`<span class="review-count">${a.plan_review_count} review(s)</span>`:""}
            <button class="phase-expand-btn" title="Expand to full screen">&#x26F6;</button>
          </div>
          <div class="phase-body">${L||'<span class="phase-empty">Awaiting plan review</span>'}</div>
        </div>
      `);const O=xe("Implementation","🔨","phase-impl",a.implementation_notes,$===3&&!a.implementation_notes),q=Y(a.review_comments),Z=bt(q);let Re="";(Z||$===4)&&(Re=`
        <div class="lifecycle-phase phase-review ${$===4?"active":""}">
          <div class="phase-header">
            <span class="phase-icon">📝</span>
            <span class="phase-label">Implementation Review</span>
            ${a.impl_review_count>0?`<span class="review-count">${a.impl_review_count} review(s)</span>`:""}
            <button class="phase-expand-btn" title="Expand to full screen">&#x26F6;</button>
          </div>
          <div class="phase-body">${Z||'<span class="phase-empty">Awaiting implementation review</span>'}</div>
        </div>
      `);const Ke=Y(a.test_results),he=Tn(Ke);let ae="";(he||$===5)&&(ae=`
        <div class="lifecycle-phase phase-test ${$===5?"active":""}">
          <div class="phase-header">
            <span class="phase-icon">🧪</span>
            <span class="phase-label">Test Results</span>
            <button class="phase-expand-btn" title="Expand to full screen">&#x26F6;</button>
          </div>
          <div class="phase-body">${he||'<span class="phase-empty">Awaiting test execution</span>'}</div>
        </div>
      `);const se=Y(a.agent_log);let ot="";if(se.length>0){let v=function(I){if(!I)return{name:"",model:null};const ge=I.toLowerCase();for(const Ye of w){const oe=ge.lastIndexOf(Ye);if(oe>0){let ie=oe;for(;ie>0&&(I[ie-1]==="-"||I[ie-1]==="_");)ie--;return{name:I.slice(0,ie),model:I.slice(oe)}}}return{name:I,model:null}};var o=v;const w=["opus","sonnet","haiku","gemini","copilot","gpt"],j=se.map(I=>{var ut;const{name:ge,model:Ye}=v(I.agent||""),oe=I.model||Ye,ie=oe?`<span class="badge model-tag model-${oe.toLowerCase()}">${oe}</span>`:"";return`
          <div class="agent-log-entry">
            <span class="agent-log-time">${((ut=I.timestamp)==null?void 0:ut.slice(0,16))||""}</span>
            <span class="badge agent-tag">${ge||I.agent||""}</span>
            ${ie}
            <span class="agent-log-msg">${I.message||""}</span>
          </div>
        `}).join("");ot=`
        <details class="lifecycle-phase phase-agent-log">
          <summary class="phase-header">
            <span class="phase-icon">🤖</span>
            <span class="phase-label">Agent Log</span>
            <span class="review-count">${se.length} entries</span>
          </summary>
          <div class="phase-body agent-log-body">${j}</div>
        </details>
      `}const it=Y(a.notes),Ot=it.map(v=>{var w;return`
      <div class="note-entry">
        <div class="note-header">
          <span class="note-author">${v.author||"user"}</span>
          <span class="note-time">${((w=v.timestamp)==null?void 0:w.slice(0,16).replace("T"," "))||""}</span>
          <button class="note-delete" data-note-id="${v.id}" title="Delete">&times;</button>
        </div>
        <div class="note-text">${Le(v.text||"")}</div>
      </div>
    `}).join(""),Mt=`
      <div class="notes-section">
        <div class="notes-header">
          <span>Notes</span>
          <span class="notes-count">${it.length}</span>
        </div>
        <div class="notes-list">${Ot}</div>
        <form class="note-form" id="note-form">
          <textarea id="note-input" rows="2" placeholder="Add a note... (supports markdown)"></textarea>
          <button type="submit" class="note-submit">Add Note</button>
        </form>
      </div>
    `;s.innerHTML=`
      <h1>#${a.id} ${a.title}</h1>
      <div class="modal-meta">${m}</div>
      ${h}
      ${b}
      <div class="lifecycle-sections">
        ${H}
        ${M}
        ${l}
        ${p}
        ${P}
        ${O}
        ${Re}
        ${ae}
        ${ot}
      </div>
      ${Mt}
      <div class="modal-danger-zone">
        <button class="delete-task-btn" id="delete-task-btn">Delete Card</button>
      </div>
    `,Bn(s),s.querySelectorAll(".phase-expand-btn").forEach(v=>{v.addEventListener("click",w=>{w.stopPropagation();const j=v.closest(".lifecycle-phase");j==null||j.requestFullscreen().catch(()=>{})})});const rt=document.getElementById("level-select");rt.addEventListener("change",async()=>{const v=parseInt(rt.value);await _(`/api/task/${e}?project=${encodeURIComponent(a.project)}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({level:v})}),V(a.project),z(e,a.project)}),document.getElementById("delete-task-btn").addEventListener("click",async()=>{confirm(`Delete card #${a.id} "${a.title}"?`)&&(await _(`/api/task/${e}?project=${encodeURIComponent(a.project)}`,{method:"DELETE"}),V(a.project),document.getElementById("modal-overlay").classList.add("hidden"),k())});const Dt=document.getElementById("req-edit-btn"),ct=document.getElementById("req-body-view"),lt=document.getElementById("req-body-edit"),Je=document.getElementById("req-textarea"),dt=document.getElementById("req-save-btn"),Ht=document.getElementById("req-cancel-btn");Dt.addEventListener("click",()=>{ct.classList.add("hidden"),lt.classList.remove("hidden"),Je.focus()}),Ht.addEventListener("click",()=>{Je.value=a.description||"",lt.classList.add("hidden"),ct.classList.remove("hidden")}),dt.addEventListener("click",async()=>{const v=Je.value;dt.textContent="Saving...",await _(`/api/task/${e}?project=${encodeURIComponent(a.project)}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({description:v})}),V(a.project),z(e,a.project)});const X=document.getElementById("attachment-drop-zone"),fe=document.getElementById("attachment-input");X&&fe&&(X.addEventListener("click",()=>fe.click()),X.addEventListener("dragover",v=>{v.preventDefault(),X.classList.add("drop-active")}),X.addEventListener("dragleave",()=>{X.classList.remove("drop-active")}),X.addEventListener("drop",async v=>{var j;v.preventDefault(),X.classList.remove("drop-active");const w=(j=v.dataTransfer)==null?void 0:j.files;w&&await Pe(e,w,a.project)}),fe.addEventListener("change",async()=>{fe.files&&await Pe(e,fe.files,a.project)})),s.addEventListener("paste",async v=>{var j;const w=Array.from(((j=v.clipboardData)==null?void 0:j.files)??[]).filter(I=>I.type.startsWith("image/"));w.length!==0&&(v.preventDefault(),await Pe(e,w,a.project))}),s.querySelectorAll(".attachment-remove").forEach(v=>{v.addEventListener("click",async w=>{w.stopPropagation();const j=v,I=j.dataset.id,ge=j.dataset.name;await _(`/api/task/${I}/attachment/${encodeURIComponent(ge)}?project=${encodeURIComponent(a.project)}`,{method:"DELETE"}),z(e,a.project)})});const Ut=document.getElementById("note-form"),pt=document.getElementById("note-input");Ut.addEventListener("submit",async v=>{v.preventDefault();const w=pt.value.trim();w&&(pt.disabled=!0,await _(`/api/task/${e}/note?project=${encodeURIComponent(a.project)}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({text:w})}),V(a.project),z(e,a.project))}),s.querySelectorAll(".note-delete").forEach(v=>{v.addEventListener("click",async w=>{w.stopPropagation();const j=v.dataset.noteId;await _(`/api/task/${e}/note/${j}?project=${encodeURIComponent(a.project)}`,{method:"DELETE"}),V(a.project),z(e,a.project)})})}catch{s.innerHTML='<div style="color:#ef4444">Failed to load</div>'}}function Rt(e){if(!e)return new Date(NaN);let n=e.replace(" ","T");return n.length===10?n+="T00:00:00Z":/Z$|[+-]\d{2}:\d{2}$/.test(n)||(n+="Z"),new Date(n)}function kn(e){const n=Rt(e);if(isNaN(n.getTime()))return"Unknown";const t=n.getUTCDay()||7;n.setUTCDate(n.getUTCDate()+4-t);const s=new Date(Date.UTC(n.getUTCFullYear(),0,1)),o=Math.ceil(((n.getTime()-s.getTime())/864e5+1)/7);return`${n.getUTCFullYear()}-W${String(o).padStart(2,"0")}`}function Rn(e){const n=Rt(e);if(isNaN(n.getTime()))return e.slice(0,10)||"—";const t=n.toLocaleDateString(void 0,{month:"short",day:"numeric",timeZone:"UTC"}),s=n.toLocaleTimeString(void 0,{hour:"2-digit",minute:"2-digit",timeZone:"UTC",hour12:!1});return`${t}
${s}`}function xn(e){const n=Fe(e.priority),t=!E&&e.project?`<span class="badge project">${e.project}</span>`:"",s=n?`<span class="badge ${n}">${e.priority}</span>`:"",o=`<span class="badge status-${e.status}">${Ue(e.status)}</span>`;return`
    <div class="chronicle-event" data-id="${e.id}" data-project="${e.project}" data-completed-at="${e.completed_at||""}">
      <div class="chronicle-dot ev-completed"></div>
      <div class="chronicle-event-time">${Rn(e.completed_at)}</div>
      <div class="chronicle-event-body">
        <button class="chronicle-task-link" data-id="${e.id}" data-project="${e.project}">
          #${e.id} ${e.title}
        </button>
        ${o}
        ${s}
        ${t}
      </div>
    </div>`}function Pn(e){var u,h;const n=Fe(e.priority),t=n?`<span class="badge ${n}">${e.priority}</span>`:"",s=!E&&e.project?`<span class="badge project">${e.project}</span>`:"",o=`<span class="badge status-${e.status}">${Ue(e.status)}</span>`,r=`<span class="badge level-${e.level}">L${e.level}</span>`,d=((u=e.created_at)==null?void 0:u.slice(0,10))||"",c=((h=e.completed_at)==null?void 0:h.slice(0,10))||"—",i=_e(e.tags).map(m=>`<span class="tag">${m}</span>`).join("");return`
    <article class="list-card status-${e.status}" data-id="${e.id}" data-project="${e.project}" data-completed-at="${e.completed_at||""}">
      <div class="list-card-top">
        <div class="list-card-meta">
          <span class="list-card-id">#${e.id}</span>
          ${o}
          ${r}
          ${t}
        </div>
        ${s}
      </div>
      <button class="list-card-title col-title" data-id="${e.id}" data-project="${e.project}">
        ${e.title}
      </button>
      <div class="list-card-dates">
        <span>Created ${d||"—"}</span>
        <span>Done ${c}</span>
      </div>
      <div class="list-card-controls">
        <label>
          <span>Status</span>
          <select class="list-status-select" data-id="${e.id}" data-field="status">
            ${G.map(m=>`<option value="${m.key}" ${m.key===e.status?"selected":""}>${m.label}</option>`).join("")}
          </select>
        </label>
        <label>
          <span>Level</span>
          <select class="list-level-select" data-id="${e.id}" data-field="level">
            ${[1,2,3].map(m=>`<option value="${m}" ${m===e.level?"selected":""}>L${m}</option>`).join("")}
          </select>
        </label>
        <label>
          <span>Priority</span>
          <select class="list-priority-select ${n}" data-id="${e.id}" data-field="priority">
            ${["high","medium","low"].map(m=>`<option value="${m}" ${m===e.priority?"selected":""}>${m[0].toUpperCase()+m.slice(1)}</option>`).join("")}
          </select>
        </label>
      </div>
      ${i?`<div class="list-card-tags">${i}</div>`:""}
    </article>
  `}async function xt(){const e=document.getElementById("chronicle-view");try{const n=await me("full");We(n.projects),Ie();const t=[];for(const d of G)for(const c of n[d.key])t.push(c);const s=t.filter(d=>!!d.completed_at).sort((d,c)=>c.completed_at.localeCompare(d.completed_at)),o=new Map;for(const d of s){const c=kn(d.completed_at);o.has(c)||o.set(c,[]),o.get(c).push(d)}if(o.size===0){e.innerHTML=`
        <div style="display:flex;align-items:center;justify-content:center;color:#64748b;font-size:0.9rem;padding:64px">
          No completed tasks yet
        </div>`;return}const r=[...o.entries()].map(([d,c])=>{const a=c.map(xn).join("");return`
        <div class="chronicle-group">
          <div class="chronicle-week-header">${d}</div>
          <div class="chronicle-events">${a}</div>
        </div>`}).join("");e.innerHTML=`<div class="chronicle-timeline">${r}</div>`,e.querySelectorAll(".chronicle-task-link").forEach(d=>{d.addEventListener("click",c=>{c.stopPropagation();const a=parseInt(d.dataset.id),i=d.dataset.project||void 0;z(a,i)})})}catch(n){console.error("loadChronicleView failed:",n),e.innerHTML=`
      <div style="display:flex;align-items:center;justify-content:center;color:#ef4444;font-size:0.9rem;padding:48px">
        Failed to load chronicle
      </div>`}}async function ze(){const e=document.getElementById("graph-view"),n=e.getBoundingClientRect().top;e.style.height=`${window.innerHeight-n}px`,e.innerHTML=`
    <div class="graph-placeholder">
      <div class="graph-spinner"></div>
      <p>Loading graph&hellip;</p>
    </div>`,re&&(re.pauseAnimation(),re=null),Q&&(Q.disconnect(),Q=null);const t={react:"#61dafb",nextjs:"#ffffff",typescript:"#3178c6",tailwind:"#38bdf8","react-query":"#ff4154",vite:"#a855f7",shadcn:"#f8fafc",zustand:"#764abc",hotwire:"#cc0000",css:"#264de4",fastapi:"#009688",rails:"#cc0000",python:"#3572a5",nodejs:"#68a063",ruby:"#cc342d",postgresql:"#336791",sqlite:"#003b57",neon:"#00e599",supabase:"#3ecf8e",timescaledb:"#fdb515",influxdb:"#22adf6",drizzle:"#c5f74f",prisma:"#5a67d8",sqlalchemy:"#d71f00",oracle:"#f80000",auth:"#f59e0b","auth.js":"#f59e0b",oauth:"#f97316",docker:"#2496ed","docker-compose":"#2496ed",vercel:"#ffffff",deploy:"#10b981",kamal:"#10b981",gcp:"#4285f4",azure:"#0078d4","ci-cd":"#f05032",mobile:"#a78bfa",capacitor:"#119eff",pwa:"#5a0fc8",api:"#64748b",modbus:"#e67e22",realtime:"#ef4444",webhook:"#6366f1",ai:"#f59e0b",testing:"#22c55e",storage:"#0ea5e9",s3:"#ff9900",r2:"#f38020",pdf:"#e53e3e",excel:"#217346",performance:"#f97316",cache:"#8b5cf6",migration:"#ec4899",maps:"#34a853",gps:"#34a853",visualization:"#06b6d4",dashboard:"#06b6d4",canvas:"#f59e0b",graph:"#06b6d4",chart:"#06b6d4",modal:"#94a3b8",refactor:"#a3a3a3",kanban:"#818cf8",obsidian:"#7c3aed","cycling-data":"#10b981",euv:"#e11d48",plc:"#e11d48",schema:"#64748b"},s=["react","nextjs","typescript","fastapi","rails","python","nodejs","postgresql","sqlite","neon","supabase","timescaledb","influxdb","drizzle","prisma","sqlalchemy","oracle","auth","auth.js","oauth","docker","docker-compose","vercel","deploy","kamal","gcp","azure","ci-cd","mobile","capacitor","pwa","api","modbus","realtime","webhook","ai","testing","storage","s3","r2","pdf","excel","performance","cache","migration","maps","gps","visualization","dashboard","canvas","graph","chart","modal","refactor","kanban","obsidian","cycling-data","euv","plc","schema"];function o(c){const a=c.map(i=>i.toLowerCase());for(const i of s)if(a.includes(i))return i;return a.find(i=>i in t)??null}const r={1:9,2:16,3:25},d={todo:"#475569",plan:"#3b82f6",impl:"#8b5cf6",impl_review:"#6366f1",plan_review:"#a855f7",test:"#f59e0b",done:"#22c55e"};try{const[{default:c},a]=await Promise.all([Vt(()=>import("./force-graph-B6EEfo0M.js"),[]),me("full")]),i=[];for(const l of G){const p=a[l.key];for(const y of p)i.push({...y,_status:l.key})}let u=i,h="";i.length>300?(u=i.filter(l=>l._status!=="done"),h=`<div style="position:absolute;top:8px;left:50%;transform:translateX(-50%);z-index:10;background:#1e293b;color:#f59e0b;padding:4px 12px;border-radius:6px;font-size:0.8rem;border:1px solid #f59e0b40">${i.length} nodes — done tasks hidden for performance</div>`):U&&(u=i.filter(l=>!(l._status==="done"&&ve(l.completed_at||""))));const m=ue.toLowerCase().replace(/^#/,""),g=u.map(l=>({id:l.id,title:`#${l.id} ${l.title}`,status:l._status,level:l.level??1,tags:_e(l.tags),priority:l.priority||"medium",project:l.project})),f=new Map;for(const l of g)for(const p of l.tags){const y=p.toLowerCase();f.has(y)||f.set(y,[]),f.get(y).push(l.id)}const $=new Map;for(const[,l]of f)for(let p=0;p<l.length;p++)for(let y=p+1;y<l.length;y++){const L=Math.min(l[p],l[y]),P=Math.max(l[p],l[y]),O=`${L}-${P}`;$.set(O,($.get(O)||0)+1)}const b=new Set,R=[];for(const[l,p]of f)for(let y=0;y<p.length;y++)for(let L=y+1;L<p.length;L++){const P=Math.min(p[y],p[L]),O=Math.max(p[y],p[L]),q=`${P}-${O}`;b.has(q)||(b.add(q),R.push({source:P,target:O,tag:l,sharedCount:$.get(q)||1}))}e.innerHTML=h,e.style.position="relative",e.style.padding="0",e.style.overflow="hidden";const S=document.createElement("div");S.style.cssText="position:absolute;inset:0;width:100%;height:100%",e.appendChild(S);const x=document.createElement("div");x.className="graph-tooltip",e.appendChild(x),e.addEventListener("mousemove",l=>{const p=e.getBoundingClientRect();x.style.left=`${l.clientX-p.left+12}px`,x.style.top=`${l.clientY-p.top+12}px`});const D=c()(S).backgroundColor("#0f172a").nodeId("id").nodeLabel(()=>"").nodeVal(l=>r[l.level]||r[1]).nodeCanvasObject((l,p,y)=>{const L=Math.sqrt(r[l.level]||r[1])*2,P=l.x??0,O=l.y??0;let q=1;m?q=l.title.toLowerCase().includes(m)||l.tags.some(se=>se.toLowerCase().includes(m))?1:.15:l.status==="done"&&(q=.35),p.globalAlpha=q;const Z=o(l.tags),Re=Z?t[Z]??"#334155":"#334155";p.beginPath(),p.arc(P,O,L,0,2*Math.PI),p.fillStyle=Re,p.fill();const Ke=d[l.status]??"#475569";p.beginPath(),p.arc(P,O,L+1.5/y,0,2*Math.PI),p.strokeStyle=Ke,p.lineWidth=1.5/y,p.stroke();const he=Z??l.tags[0]??"";if(he){const ae=Math.max(2,10/y);p.font=`600 ${ae}px sans-serif`,p.fillStyle=q<.5?"rgba(148,163,184,0.15)":Z?t[Z]??"#94a3b8":"#94a3b8",p.textAlign="center",p.textBaseline="top",p.fillText(he,P,O+L+2/y)}if(y>2.5){const ae=l.title.replace(/^#\d+\s*/,"").slice(0,30),se=9/y;p.font=`${se}px sans-serif`,p.fillStyle=q<.5?"rgba(148,163,184,0.2)":"#64748b",p.textAlign="center",p.textBaseline="bottom",p.fillText(ae,P,O-L-2/y)}p.globalAlpha=1}).nodePointerAreaPaint((l,p,y)=>{const L=Math.sqrt(r[l.level]||r[1])*2+2;y.beginPath(),y.arc(l.x??0,l.y??0,L,0,2*Math.PI),y.fillStyle=p,y.fill()}).onNodeClick(l=>{z(l.id,l.project)}).onNodeHover(l=>{if(S.style.cursor=l?"pointer":"default",!l){x.style.display="none";return}const p=o(l.tags),y=p?t[p]??null:null,L=p?`<span style="background:${y};color:#0f172a;padding:1px 7px;border-radius:4px;font-weight:600">${p}</span>`:"",P=l.tags.filter(q=>q.toLowerCase()!==p).slice(0,3),O=P.length?`<div class="graph-tooltip-tags">${P.map(q=>`<span>${q}</span>`).join("")}</div>`:"";x.innerHTML=`
          <div class="graph-tooltip-title">${l.title}</div>
          <div class="graph-tooltip-meta" style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">
            ${L}
            <span>${l.status} &middot; ${l.priority} &middot; L${l.level}</span>
          </div>
          ${O}`,x.style.display="block"}).linkColor(l=>t[l.tag.toLowerCase()]??"#334155").linkWidth(l=>Math.min(1.5+(l.sharedCount-1)*.8,4)).d3AlphaDecay(.02).d3VelocityDecay(.3).warmupTicks(100).cooldownTime(5e3).width(e.offsetWidth||window.innerWidth).height(window.innerHeight-e.getBoundingClientRect().top).graphData({nodes:g,links:R});re=D;const H=new Set(g.flatMap(l=>l.tags.map(p=>p.toLowerCase()))),M=s.filter(l=>H.has(l)&&l in t).slice(0,16);if(M.length>0){const l=document.createElement("div");l.className="graph-legend",l.innerHTML=M.map(p=>`<div class="graph-legend-item"><span style="background:${t[p]}"></span>${p}</div>`).join(""),e.appendChild(l)}Q=new ResizeObserver(()=>{const l=e.offsetWidth,p=window.innerHeight-e.getBoundingClientRect().top;l>0&&p>0&&(e.style.height=`${p}px`,D.width(l).height(p))}),Q.observe(document.documentElement)}catch(c){console.error("loadGraphView failed:",c),e.innerHTML=`
      <div class="graph-placeholder">
        <p style="color:#ef4444;font-size:0.9rem">Failed to load graph</p>
      </div>`}}async function Be(){var n,t,s,o,r,d,c,a;const e=document.getElementById("board");try{const i=await me(Xe()?"full":"board");pn(i),We(i.projects),ht?Ie():(ht=!0,On().then(()=>Ie())),e.innerHTML=G.map(g=>{var f;return vn(g.key,g.label,g.icon,i[g.key],((f=i.counts)==null?void 0:f[g.key])??i[g.key].length)}).join("");const u=((n=i.counts)==null?void 0:n.done)??i.done.length,h=i.total??(((t=i.counts)==null?void 0:t.todo)??i.todo.length)+(((s=i.counts)==null?void 0:s.plan)??i.plan.length)+(((o=i.counts)==null?void 0:o.plan_review)??i.plan_review.length)+(((r=i.counts)==null?void 0:r.impl)??i.impl.length)+(((d=i.counts)==null?void 0:d.impl_review)??i.impl_review.length)+(((c=i.counts)==null?void 0:c.test)??i.test.length)+(((a=i.counts)==null?void 0:a.done)??i.done.length);document.getElementById("count-summary").textContent=`${u}/${h} completed`,e.querySelectorAll(".card").forEach(g=>{g.addEventListener("click",f=>{if(f.target.closest(".card-interactive")){f.stopPropagation();return}const b=f.target.closest(".card-copy-btn");if(b){f.stopPropagation(),navigator.clipboard.writeText(b.dataset.copy).then(()=>{const x=b.textContent;b.textContent="✓",setTimeout(()=>{b.textContent=x},1e3)});return}const R=parseInt(g.dataset.id),S=g.dataset.project;z(R,S)})}),T||Dn(),qn(),Ve();const m=document.getElementById("add-card-btn");m&&m.addEventListener("click",g=>{g.stopPropagation(),document.getElementById("add-card-overlay").classList.remove("hidden"),K(),T||document.getElementById("add-title").focus()})}catch(i){console.error("loadBoard failed:",i),e.innerHTML=`
      <div style="grid-column:1/-1;display:flex;align-items:center;justify-content:center;color:#ef4444;font-size:0.9rem;padding:48px">
        Cannot find .claude/kanban.db
      </div>
    `}}function qn(){document.querySelectorAll("[data-column-toggle]").forEach(e=>{e.addEventListener("click",n=>{if(!T)return;n.stopPropagation();const t=e.dataset.columnToggle;if(!t)return;te.has(t)?te.delete(t):te.add(t),At();const s=e.closest(".column"),o=te.has(t)||!!ue.trim();s&&s.setAttribute("data-mobile-expanded",String(o)),e.setAttribute("aria-expanded",String(o));const r=e.querySelector(".column-toggle-icon");r&&(r.textContent=o?"−":"+")})}),document.querySelectorAll(".mobile-status-select").forEach(e=>{e.addEventListener("click",n=>n.stopPropagation()),e.addEventListener("change",async n=>{n.stopPropagation();const t=e.value,s=parseInt(e.dataset.id||"",10),o=e.dataset.project||"",r=e.dataset.currentStatus||"";!s||!o||await hn({id:s,project:o,status:r},t)})})}async function Ne(){const e=document.getElementById("list-view");try{const n=await me("full");We(n.projects),Ie();const t=[];for(const a of G)for(const i of n[a.key])t.push(i);const s=ee==="default"?[...t].sort((a,i)=>i.id-a.id):kt(t),o=s.length,r=s.filter(a=>a.status==="done").length;document.getElementById("count-summary").textContent=`${r}/${o} completed`;const d=s.map(a=>{var m,g;const i=Fe(a.priority),h=_e(a.tags).map(f=>`<span class="tag">${f}</span>`).join("");return`
        <tr class="status-${a.status}" data-id="${a.id}" data-project="${a.project}" data-completed-at="${a.completed_at||""}">
          <td class="col-id">#${a.id}</td>
          <td class="col-title">${a.title}</td>
          <td>
            <select class="list-status-select" data-id="${a.id}" data-field="status">
              ${G.map(f=>`<option value="${f.key}" ${f.key===a.status?"selected":""}>${f.icon} ${f.label}</option>`).join("")}
            </select>
          </td>
          <td>
            <select class="list-level-select" data-id="${a.id}" data-field="level">
              ${[1,2,3].map(f=>`<option value="${f}" ${f===a.level?"selected":""}>L${f}</option>`).join("")}
            </select>
          </td>
          <td>
            <select class="list-priority-select ${i}" data-id="${a.id}" data-field="priority">
              ${["high","medium","low"].map(f=>`<option value="${f}" ${f===a.priority?"selected":""}>${f[0].toUpperCase()+f.slice(1)}</option>`).join("")}
            </select>
          </td>
          <td class="list-date">${a.project||""}</td>
          <td>${h}</td>
          <td class="list-date">${((m=a.created_at)==null?void 0:m.slice(0,10))||""}</td>
          <td class="list-date">${((g=a.completed_at)==null?void 0:g.slice(0,10))||""}</td>
        </tr>
      `}).join(""),c=s.map(Pn).join("");e.innerHTML=`
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
          <tbody>${d}</tbody>
        </table>
      </div>
    `,e.querySelectorAll("select").forEach(a=>{a.addEventListener("change",async i=>{i.stopPropagation();const u=a,h=u.dataset.id,m=u.dataset.field;let g=u.value;m==="level"&&(g=parseInt(g));const f=u.closest("tr"),$=(f==null?void 0:f.dataset.project)||"",b=await _(`/api/task/${h}?project=${encodeURIComponent($)}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({[m]:g})});if(!b.ok){const R=await b.json().catch(()=>({}));R.error&&Te(R.error),Ne();return}V($),Ne()})}),e.querySelectorAll(".col-title").forEach(a=>{a.addEventListener("click",i=>{i.stopPropagation();const u=a.closest("[data-id]"),h=parseInt(u.dataset.id),m=u.dataset.project;z(h,m)})}),Ve()}catch(n){console.error("loadListView failed:",n),e.innerHTML=`
      <div style="display:flex;align-items:center;justify-content:center;color:#ef4444;font-size:0.9rem;padding:48px">
        Failed to load task list
      </div>
    `}}async function On(){try{const e=await _("/api/projects");if(!e.ok)return;const n=await e.json();for(const t of n.projects??[])t.id&&t.category&&Me.set(t.id,t.category)}catch{}}function Ie(){const e=document.getElementById("category-filter");if(!e)return;const n=[...new Set(Me.values())].sort();if(n.length===0){e.innerHTML="";return}const t=[`<button class="cat-chip${J?"":" active"}" data-cat="">All</button>`,...n.map(s=>`<button class="cat-chip${J===s?" active":""}" data-cat="${s}">${s}</button>`)].join("");e.innerHTML=t,e.querySelectorAll(".cat-chip").forEach(s=>{s.addEventListener("click",()=>{J=s.dataset.cat||null,J?localStorage.setItem("kanban-category",J):localStorage.removeItem("kanban-category"),E&&J&&Me.get(E)!==J&&(E=null,localStorage.removeItem("kanban-project")),B=null,ne=null,Ie(),We(Ct),k()})})}function We(e){Ct=e;const n=J?e.filter(o=>Me.get(o)===J):e,t=document.getElementById("project-filter");if(n.length<=1){t.innerHTML=n[0]?`<span class="project-label">${n[0]}</span>`:"";return}const s=n.map(o=>`<option value="${o}" ${o===E?"selected":""}>${o}</option>`).join("");t.innerHTML=`
    <select id="project-select">
      <option value="">All Projects</option>
      ${s}
    </select>
  `,document.getElementById("project-select").addEventListener("change",o=>{E=o.target.value||null,E?localStorage.setItem("kanban-project",E):localStorage.removeItem("kanban-project"),B=null,ne=null,k()})}function $t(e,n){const t=[...e.querySelectorAll(".card:not(.dragging)")];for(const s of t){const o=s.getBoundingClientRect(),r=o.top+o.height/2;if(n<r)return s}return null}function qe(){document.querySelectorAll(".drop-indicator").forEach(e=>e.remove())}function Mn(e,n){qe();const t=document.createElement("div");t.className="drop-indicator",n?e.insertBefore(t,n):e.appendChild(t)}function Dn(){const e=document.querySelectorAll(".card"),n=document.querySelectorAll(".column-body");e.forEach(t=>{t.addEventListener("dragstart",s=>{const o=s,r=t;o.dataTransfer.setData("text/plain",`${r.dataset.project}:${r.dataset.id}`),r.classList.add("dragging"),De=!0}),t.addEventListener("dragend",()=>{t.classList.remove("dragging"),qe(),De=!1})}),n.forEach(t=>{t.addEventListener("dragover",s=>{s.preventDefault();const o=t;o.classList.add("drag-over");const r=$t(o,s.clientY);Mn(o,r)}),t.addEventListener("dragleave",s=>{const o=t;o.contains(s.relatedTarget)||(o.classList.remove("drag-over"),qe())}),t.addEventListener("drop",async s=>{s.preventDefault();const o=t;o.classList.remove("drag-over"),qe();const r=s,d=r.dataTransfer.getData("text/plain"),c=d.lastIndexOf(":"),a=c>=0?d.slice(0,c):"",i=parseInt(c>=0?d.slice(c+1):d),u=o.dataset.column,h=$t(o,r.clientY),m=[...o.querySelectorAll(".card:not(.dragging)")];let g=null,f=null;if(h){f=parseInt(h.dataset.id);const b=m.indexOf(h);b>0&&(g=parseInt(m[b-1].dataset.id))}else m.length>0&&(g=parseInt(m[m.length-1].dataset.id));const $=await _(`/api/task/${i}/reorder?project=${encodeURIComponent(a)}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({status:u,afterId:g,beforeId:f})});if(!$.ok){const b=await $.json().catch(()=>({}));b.error&&Te(b.error)}V(a),Be()})})}function Te(e){const n=document.querySelector(".toast");n&&n.remove();const t=document.createElement("div");t.className="toast",t.textContent=e,document.body.appendChild(t),setTimeout(()=>t.remove(),3e3)}async function Pt(){try{const n=await(await _("/api/info")).json();n.projectName&&(document.title=`Kanban · ${n.projectName}`,document.querySelector("header h1").textContent=`Kanban · ${n.projectName}`)}catch{}}function Ae(e){C=e,localStorage.setItem(Ze,C);const n=document.getElementById("board"),t=document.getElementById("list-view"),s=document.getElementById("chronicle-view"),o=document.getElementById("graph-view");e!=="graph"&&(Q&&(Q.disconnect(),Q=null),re&&(re.pauseAnimation(),re=null)),n.classList.add("hidden"),t.classList.add("hidden"),s.classList.add("hidden"),o.classList.add("hidden"),document.getElementById("tab-board").classList.remove("active"),document.getElementById("tab-list").classList.remove("active"),document.getElementById("tab-chronicle").classList.remove("active"),document.getElementById("tab-graph").classList.remove("active"),e==="board"?(n.classList.remove("hidden"),document.getElementById("tab-board").classList.add("active"),Be()):e==="list"?(t.classList.remove("hidden"),document.getElementById("tab-list").classList.add("active"),Ne()):e==="chronicle"?(s.classList.remove("hidden"),document.getElementById("tab-chronicle").classList.add("active"),xt()):(o.classList.remove("hidden"),document.getElementById("tab-graph").classList.add("active"),ze())}function k(){C==="board"?Be():C==="list"?Ne():C==="chronicle"?xt():ze()}document.getElementById("sort-select").value=ee;U&&document.getElementById("hide-done-btn").classList.add("active");Se();Qe();document.getElementById("auth-btn").addEventListener("click",()=>{if(F&&A){ce("Shared token is stored on this device. Use Forget Token to reset it.","success");return}ce(F?"Enter the shared access token to load the board.":"This environment does not require a shared token.")});document.getElementById("auth-close").addEventListener("click",()=>{F&&!A||je()});document.getElementById("auth-clear-btn").addEventListener("click",async()=>{await sn(),F?ce("Stored token cleared. Enter a shared access token to continue."):(je(),pe("Stored token cleared."))});document.getElementById("auth-form").addEventListener("submit",async e=>{e.preventDefault();const t=document.getElementById("auth-token-input").value.trim();if(!t){pe("Enter the shared access token.","error");return}pe("Unlocking board...","default");try{await Bt(t),pe("Board unlocked.","success"),await Pt(),Tt(),k()}catch(s){pe(s instanceof Error?s.message:"Board authentication failed.","error")}});document.getElementById("tab-board").addEventListener("click",()=>Ae("board"));document.getElementById("tab-list").addEventListener("click",()=>Ae("list"));document.getElementById("tab-chronicle").addEventListener("click",()=>Ae("chronicle"));document.getElementById("tab-graph").addEventListener("click",()=>Ae("graph"));document.getElementById("toolbar-mobile-toggle").addEventListener("click",()=>{Ee=!Ee,Qe()});It.addEventListener("change",e=>{en(e.matches)});document.addEventListener("visibilitychange",()=>{document.visibilityState!=="visible"||!A||(nt(),k())});function qt(){if(Ge)return;Ge=!0;const e=new EventSource("/api/events");e.onmessage=()=>{if(De)return;const n=!document.getElementById("modal-overlay").classList.contains("hidden"),t=!document.getElementById("add-card-overlay").classList.contains("hidden");!n&&!t&&k()},e.onerror=()=>{e.close(),Ge=!1,(!F||A)&&setTimeout(qt,5e3)}}document.getElementById("refresh-btn").addEventListener("click",k);document.getElementById("search-input").addEventListener("input",e=>{if(ue=e.target.value.trim(),C==="board"){Be();return}if(C==="graph"){ze();return}Ve()});document.getElementById("sort-select").addEventListener("change",e=>{ee=e.target.value,localStorage.setItem("kanban-sort",ee),k()});document.getElementById("hide-done-btn").addEventListener("click",()=>{if(U=!U,localStorage.setItem("kanban-hide-old",String(U)),document.getElementById("hide-done-btn").classList.toggle("active",U),C==="graph"){ze();return}Ve()});document.getElementById("modal-close").addEventListener("click",()=>{document.getElementById("modal-overlay").classList.add("hidden"),K(),k()});document.getElementById("modal-overlay").addEventListener("click",e=>{e.target===e.currentTarget&&(document.getElementById("modal-overlay").classList.add("hidden"),K(),k())});document.addEventListener("keydown",e=>{if(e.key==="Escape"){const n=!document.getElementById("modal-overlay").classList.contains("hidden");document.getElementById("modal-overlay").classList.add("hidden"),document.getElementById("add-card-overlay").classList.add("hidden"),!document.getElementById("auth-overlay").classList.contains("hidden")&&A&&je(),K(),n&&k()}});const Ce=document.getElementById("add-card-overlay");let W=[];function ke(){const e=document.getElementById("add-attachment-preview");if(W.length===0){e.innerHTML="";return}e.innerHTML=W.map((n,t)=>`
    <div class="attachment-thumb">
      <img src="${URL.createObjectURL(n)}" alt="${n.name}" />
      <button class="attachment-remove" data-idx="${t}" title="Remove" type="button">&times;</button>
      <span class="attachment-name">${n.name}</span>
    </div>
  `).join(""),e.querySelectorAll(".attachment-remove").forEach(n=>{n.addEventListener("click",t=>{t.stopPropagation();const s=parseInt(n.dataset.idx);W.splice(s,1),ke()})})}function st(e){for(const n of Array.from(e))n.type.startsWith("image/")&&W.push(n);ke()}document.getElementById("add-card-close").addEventListener("click",()=>{Ce.classList.add("hidden"),W=[],ke(),K()});Ce.addEventListener("click",e=>{e.target===e.currentTarget&&(Ce.classList.add("hidden"),W=[],ke(),K())});const le=document.getElementById("add-attachment-zone"),ye=document.getElementById("add-attachment-input");le.addEventListener("click",()=>ye.click());le.addEventListener("dragover",e=>{e.preventDefault(),le.classList.add("drop-active")});le.addEventListener("dragleave",()=>{le.classList.remove("drop-active")});le.addEventListener("drop",e=>{var t;e.preventDefault(),le.classList.remove("drop-active");const n=(t=e.dataTransfer)==null?void 0:t.files;n&&st(n)});ye.addEventListener("change",()=>{ye.files&&st(ye.files),ye.value=""});Ce.addEventListener("paste",e=>{var t;const n=Array.from(((t=e.clipboardData)==null?void 0:t.files)??[]).filter(s=>s.type.startsWith("image/"));n.length!==0&&(e.preventDefault(),st(n))});document.getElementById("add-card-form").addEventListener("submit",async e=>{e.preventDefault();const n=document.getElementById("add-title").value.trim();if(!n)return;const t=document.getElementById("add-priority").value,s=parseInt(document.getElementById("add-level").value)||3,o=document.getElementById("add-description").value.trim()||null,r=document.getElementById("add-tags").value.trim(),d=r?r.split(",").map(h=>h.trim()).filter(Boolean):null,c=E;if(!c){Te("Select a project first");return}const a=document.querySelector("#add-card-form .form-submit");a.textContent=W.length>0?"Creating...":"Add Card",a.disabled=!0;const u=await(await _("/api/task",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({title:n,priority:t,level:s,description:o,tags:d,project:c})})).json();W.length>0&&u.id&&await Pe(u.id,W,c),W=[],a.textContent="Add Card",a.disabled=!1,document.getElementById("add-card-form").reset(),ke(),Ce.classList.add("hidden"),K(),V(c),k()});dn().then(async e=>{e&&(await Pt(),Ae(C),Tt())}).catch(()=>{ce("Unable to initialize board authentication.","error")});Gt();
