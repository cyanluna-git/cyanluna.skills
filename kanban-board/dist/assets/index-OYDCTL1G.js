import Lt from"https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs";(function(){const n=document.createElement("link").relList;if(n&&n.supports&&n.supports("modulepreload"))return;for(const o of document.querySelectorAll('link[rel="modulepreload"]'))a(o);new MutationObserver(o=>{for(const r of o)if(r.type==="childList")for(const d of r.addedNodes)d.tagName==="LINK"&&d.rel==="modulepreload"&&a(d)}).observe(document,{childList:!0,subtree:!0});function t(o){const r={};return o.integrity&&(r.integrity=o.integrity),o.referrerPolicy&&(r.referrerPolicy=o.referrerPolicy),o.crossOrigin==="use-credentials"?r.credentials="include":o.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function a(o){if(o.ep)return;o.ep=!0;const r=t(o);fetch(o.href,r)}})();Lt.initialize({startOnLoad:!1,theme:"dark",themeVariables:{primaryColor:"#334155",primaryBorderColor:"#60a5fa",primaryTextColor:"#f1f5f9",lineColor:"#64748b",secondaryColor:"#1e293b",tertiaryColor:"#0f172a"}});window.__mermaid=Lt;const Ft="modulepreload",Vt=function(e){return"/"+e},ft={},zt=function(n,t,a){let o=Promise.resolve();if(t&&t.length>0){let d=function(i){return Promise.all(i.map(u=>Promise.resolve(u).then(h=>({status:"fulfilled",value:h}),h=>({status:"rejected",reason:h}))))};document.getElementsByTagName("link");const c=document.querySelector("meta[property=csp-nonce]"),s=(c==null?void 0:c.nonce)||(c==null?void 0:c.getAttribute("nonce"));o=d(t.map(i=>{if(i=Vt(i),i in ft)return;ft[i]=!0;const u=i.endsWith(".css"),h=u?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${i}"]${h}`))return;const m=document.createElement("link");if(m.rel=u?"stylesheet":Ft,u||(m.as="script"),m.crossOrigin="",m.href=i,s&&m.setAttribute("nonce",s),document.head.appendChild(m),u)return new Promise((g,f)=>{m.addEventListener("load",g),m.addEventListener("error",()=>f(new Error(`Unable to preload CSS for ${i}`)))})}))}function r(d){const c=new Event("vite:preloadError",{cancelable:!0});if(c.payload=d,window.dispatchEvent(c),!c.defaultPrevented)throw d}return o.then(d=>{for(const c of d||[])c.status==="rejected"&&r(c.reason);return n().catch(r)})},G=[{key:"todo",label:"Requirements",icon:"📋"},{key:"plan",label:"Plan",icon:"🗺️"},{key:"plan_review",label:"Review Plan",icon:"🔍"},{key:"impl",label:"Implement",icon:"🔨"},{key:"impl_review",label:"Review Impl",icon:"📝"},{key:"test",label:"Test",icon:"🧪"},{key:"done",label:"Done",icon:"✅"}],Wt={plan:"Planning",plan_review:"Plan Review",impl:"Implementing",impl_review:"Impl Review",test:"Testing"},De="kanban-auth-token",Xe="kanban-current-view",It="kanban-mobile-board-columns",Kt=3e4,Jt=10,Yt=10,Ct="kanban-summary-cache",Gt={board:3e4,full:6e4},St=window.matchMedia("(max-width: 768px)");function Zt(){!("serviceWorker"in navigator)||!(window.location.protocol==="https:"||window.location.hostname==="localhost"||window.location.hostname==="127.0.0.1")||window.addEventListener("load",()=>{navigator.serviceWorker.register("/sw.js").catch(n=>{console.warn("Service worker registration failed",n)})})}function Xt(e){return e==="board"||e==="list"||e==="chronicle"||e==="graph"}function Qt(e){return G.some(n=>n.key===e)}function en(){try{const e=localStorage.getItem(It);if(!e)return new Set;const n=JSON.parse(e);return Array.isArray(n)?new Set(n.filter(t=>typeof t=="string"&&Qt(t))):new Set}catch{return new Set}}let E=localStorage.getItem("kanban-project"),D=localStorage.getItem("kanban-category"),qe=[];const Ee=new Map;let gt=!1,He=!1,T=St.matches,C=Xt(localStorage.getItem(Xe))?localStorage.getItem(Xe):T?"list":"board",ue="",ee=localStorage.getItem("kanban-sort")||"default",N=localStorage.getItem("kanban-hide-old")==="true",F=localStorage.getItem(De)||"",V=!1,A=!1,Ze=!1,Le=!T,te=en(),B=null,be=null,ne=null;const $e=new Map,de=new Map,we=new Map;let Q=null,re=null;function pe(e,n="default"){const t=document.getElementById("auth-message");t.textContent=e,t.classList.remove("error","success"),n!=="default"&&t.classList.add(n)}function J(){const n=[document.getElementById("modal-overlay"),document.getElementById("add-card-overlay"),document.getElementById("auth-overlay")].some(t=>t&&!t.classList.contains("hidden"));document.body.classList.toggle("overlay-open",n)}function je(){const e=document.getElementById("auth-btn");if(e){if(!V){e.textContent="Open",e.title="Board access is open in this environment";return}e.textContent=A?"Private":"Locked",e.title=A?"Shared token configured for this browser":"Shared token required"}}function ce(e="Enter the shared access token to load the board.",n="default"){A=!1,document.getElementById("auth-overlay").classList.remove("hidden"),J();const t=document.getElementById("auth-token-input");t.value=F,pe(e,n),je(),setTimeout(()=>t.focus(),0)}function _e(){document.getElementById("auth-overlay").classList.add("hidden"),J(),je()}function jt(e){F=e.trim(),F?localStorage.setItem(De,F):localStorage.removeItem(De)}function et(){document.body.classList.toggle("mobile-shell",T),document.body.classList.toggle("mobile-toolbar-open",!T||Le);const e=document.getElementById("toolbar-mobile-toggle");if(e){const n=!T||Le;e.hidden=!T,e.setAttribute("aria-expanded",String(n)),e.textContent=n?"Hide Filters":"Show Filters"}}function tn(e){T=e,T||(Le=!0),et(),A&&C==="board"&&k()}function _t(){return window.location.hostname==="localhost"||window.location.hostname==="127.0.0.1"}function tt(){be!==null&&(window.clearInterval(be),be=null)}function nt(e=E,n="full"){return`${e||"__all__"}::${n}`}function Ue(e=E,n="full"){return`${Ct}::${nt(e,n)}`}function nn(e=E,n="full"){try{const t=localStorage.getItem(Ue(e,n));if(!t)return null;const a=JSON.parse(t);return!a||typeof a.fetchedAt!="number"||!a.board?null:Date.now()-a.fetchedAt>Gt[n]?(localStorage.removeItem(Ue(e,n)),null):a}catch{return null}}function an(e,n,t,a){try{const o={fetchedAt:Date.now(),etag:a,board:t};localStorage.setItem(Ue(e,n),JSON.stringify(o))}catch{}}function z(e=E,n){const t=n?[n]:["board","full"];for(const a of t){const o=nt(e,a);$e.delete(o),de.delete(o),we.delete(o);try{localStorage.removeItem(Ue(e,a))}catch{}}e===E&&(B=null,ne=null)}function at(e={}){if($e.clear(),de.clear(),we.clear(),B=null,ne=null,e.persisted)try{const n=[];for(let t=0;t<localStorage.length;t+=1){const a=localStorage.key(t);a!=null&&a.startsWith(`${Ct}::`)&&n.push(a)}n.forEach(t=>localStorage.removeItem(t))}catch{}}function Bt(){F="",localStorage.removeItem(De);const e=document.getElementById("auth-token-input");e&&(e.value="")}async function sn(){const e=new Headers;F&&e.set("X-Kanban-Auth",F);const t=await(await fetch("/api/auth/session",{method:"GET",headers:e,credentials:"same-origin"})).json().catch(()=>({}));return{authenticated:!!t.authenticated,authRequired:!!t.authRequired,mode:t.mode,source:t.source??null,reason:t.reason??null,error:t.error??null}}async function Tt(e){const n=e.trim(),t=await fetch("/api/auth/session",{method:"POST",headers:{"X-Kanban-Auth":n},credentials:"same-origin"}),a=await t.json().catch(()=>({}));if(!t.ok){const o=a.reason==="invalid_token"?"Shared token is invalid.":a.reason==="token_hash_missing"?"Server auth is not configured yet.":"Board authentication failed.";throw new Error(o)}jt(n),V=!!a.authRequired,A=!0,_e(),je()}async function on(){await fetch("/api/auth/session",{method:"DELETE",credentials:"same-origin"}).catch(()=>{}),tt(),at({persisted:!0}),Bt(),A=!V,je()}async function _(e,n={},t=!1){const a=new Headers(n.headers||{});F&&!a.has("X-Kanban-Auth")&&a.set("X-Kanban-Auth",F);const o=await fetch(e,{...n,headers:a,credentials:"same-origin"});if((o.status===401||o.status===403||o.status===503)&&!t){const r=await o.clone().json().catch(()=>({}));V=!0,A=!1,r.reason==="invalid_token"&&Bt();const d=r.reason==="invalid_token"?"Stored token was rejected. Enter a valid shared token.":r.reason==="token_hash_missing"?"Server auth hash is not configured yet.":"Shared token is required for this board.";throw ce(d,"error"),new Error(r.error||d)}return o}async function st(e=E){const n=e?`?project=${encodeURIComponent(e)}`:"",t=new Headers;ne&&t.set("If-None-Match",ne);const a=await _(`/api/board/version${n}`,{headers:t});return a.status===304?B?null:(ne=null,st()):(ne=a.headers.get("ETag"),a.json())}function rn(e){return e==="board"?C==="board"&&!Qe():C==="list"||C==="chronicle"||C==="board"&&Qe()}function Qe(){return ue.trim().length>0}function cn(e,n,t,a){if(!A||we.has(n))return;const o=(async()=>{try{const r=await st(a);if(!r)return;if(t&&r.version===t){B=r.version;return}z(a,e),await me(e,{bypassTtl:!0,projectOverride:a}),E===a&&rn(e)&&k()}catch{}finally{we.delete(n)}})();we.set(n,o)}async function me(e="full",n={}){const t=n.projectOverride===void 0?E:n.projectOverride,a=["summary=true"];t&&a.unshift(`project=${encodeURIComponent(t)}`),e==="board"&&a.push("compact=board",`todo_limit=${Jt}`,`done_limit=${Yt}`);const o=`?${a.join("&")}`,r=nt(t,e);if(!n.bypassTtl){const h=nn(t,e);if(h)return $e.set(r,h.board),h.etag&&de.set(r,h.etag),B=h.board.version||B,cn(e,r,h.board.version||null,t),h.board}const d=new Headers,c=de.get(r);c&&d.set("If-None-Match",c);const s=await _(`/api/board${o}`,{headers:d});if(s.status===304){const h=$e.get(r);return h?(B=h.version||B,h):(de.delete(r),me(e,{bypassTtl:!0}))}const i=await s.json(),u=s.headers.get("ETag");return u&&de.set(r,u),$e.set(r,i),an(t,e,i,u),B=i.version||B,i}function ln(){_t()||be!==null||(be=window.setInterval(async()=>{if(!A||He)return;const e=!document.getElementById("modal-overlay").classList.contains("hidden"),n=!document.getElementById("add-card-overlay").classList.contains("hidden");if(!(e||n))try{const t=await st();if(!t)return;if(!B){B=t.version;return}t.version!==B&&(B=t.version,k())}catch{V&&!A&&tt()}},Kt))}function At(){if(_t()){tt(),Ot();return}ln()}function dn(){const e=new URL(window.location.href),n=e.searchParams.get("auth")||e.searchParams.get("token");n&&(jt(n),e.searchParams.delete("auth"),e.searchParams.delete("token"),window.history.replaceState({},"",e.toString()))}async function pn(){if(dn(),F)try{return await Tt(F),!0}catch(n){return ce(n instanceof Error?n.message:"Board authentication failed.","error"),!1}const e=await sn();return V=e.authRequired,A=e.authenticated||!e.authRequired,e.authRequired&&!e.authenticated?(ce("Enter the shared access token to load the board."),!1):(_e(),!0)}function Ve(e){return e==="high"?"high":e==="medium"?"medium":e==="low"?"low":""}function kt(){localStorage.setItem(It,JSON.stringify([...te]))}function un(e){if(!T||te.size>0)return;const n=G.filter(t=>t.key==="todo"||t.key==="impl"||t.key!=="done"&&e[t.key].length>0).map(t=>t.key);te=new Set(n.length>0?n:["todo"]),kt()}function mn(e){return!T||ue.trim()?!0:te.has(e)}function Ne(e){var n;return((n=G.find(t=>t.key===e))==null?void 0:n.label)||e}function hn(e,n){return e===1?{todo:["impl"],impl:["done"],done:[]}[n]||[]:e===2?{todo:["plan"],plan:["impl","todo"],impl:["impl_review"],impl_review:["done","impl"],done:[]}[n]||[]:{todo:["plan"],plan:["plan_review","todo"],plan_review:["impl","plan"],impl:["impl_review"],impl_review:["test","impl"],test:["done","impl"],done:[]}[n]||[]}async function fn(e,n){if(!n||n===e.status)return;const t=await _(`/api/task/${e.id}?project=${encodeURIComponent(e.project)}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({status:n})});if(!t.ok){const a=await t.json().catch(()=>({}));Ae(a.error||"Failed to move task");return}z(e.project),Te()}function ve(e){return e?Date.now()-new Date(e).getTime()>4320*60*1e3:!1}function Rt(e,n){return ee==="default"?n==="todo"?[...e].sort((t,a)=>a.created_at.localeCompare(t.created_at)||a.id-t.id):n==="done"?[...e].sort((t,a)=>{const o=(a.completed_at||"").localeCompare(t.completed_at||"");return o!==0?o:t.rank-a.rank||t.id-a.id}):[...e].sort((t,a)=>a.rank-t.rank||a.id-t.id):[...e].sort((t,a)=>ee==="created_asc"?t.created_at.localeCompare(a.created_at):ee==="created_desc"?a.created_at.localeCompare(t.created_at):ee==="completed_desc"?(a.completed_at||"").localeCompare(t.completed_at||""):0)}function ze(){const e=ue.toLowerCase().replace(/^#/,""),n=e.length>0||N;document.body.classList.toggle("mobile-board-search",C==="board"&&T&&e.length>0),C==="board"?(document.querySelectorAll(".card").forEach(t=>{const a=!e||(()=>{var i,u,h,m;const r=t.dataset.id||"",d=((u=(i=t.querySelector(".card-title"))==null?void 0:i.textContent)==null?void 0:u.toLowerCase())||"",c=((m=(h=t.querySelector(".card-desc"))==null?void 0:h.textContent)==null?void 0:m.toLowerCase())||"",s=[...t.querySelectorAll(".tag")].map(g=>{var f;return((f=g.textContent)==null?void 0:f.toLowerCase())||""}).join(" ");return r===e||d.includes(e)||c.includes(e)||s.includes(e)})(),o=N&&t.dataset.status==="done"&&ve(t.dataset.completedAt||"");t.style.display=a&&!o?"":"none"}),document.querySelectorAll(".column").forEach(t=>{const a=t.querySelectorAll(".card"),o=[...a].filter(s=>s.style.display!=="none").length,r=a.length,d=Number.parseInt(t.dataset.totalCount||`${r}`,10)||r,c=t.querySelector(".count");c&&(c.textContent=n||d!==r?`${o}/${d}`:`${d}`)})):C==="list"?(document.querySelectorAll("#list-view tbody tr").forEach(t=>{const a=!e||(()=>{var i,u,h,m;const r=t.dataset.id||"",d=((u=(i=t.querySelector(".col-title"))==null?void 0:i.textContent)==null?void 0:u.toLowerCase())||"",c=((m=(h=t.cells[5])==null?void 0:h.textContent)==null?void 0:m.toLowerCase())||"",s=[...t.querySelectorAll(".tag")].map(g=>{var f;return((f=g.textContent)==null?void 0:f.toLowerCase())||""}).join(" ");return r===e||d.includes(e)||c.includes(e)||s.includes(e)})(),o=N&&t.classList.contains("status-done")&&ve(t.dataset.completedAt||"");t.style.display=a&&!o?"":"none"}),document.querySelectorAll("#list-view .list-card").forEach(t=>{const a=!e||(()=>{var i,u,h;const r=t.dataset.id||"",d=((u=(i=t.querySelector(".list-card-title"))==null?void 0:i.textContent)==null?void 0:u.toLowerCase())||"",c=((h=t.dataset.project)==null?void 0:h.toLowerCase())||"",s=[...t.querySelectorAll(".tag")].map(m=>{var g;return((g=m.textContent)==null?void 0:g.toLowerCase())||""}).join(" ");return r===e||d.includes(e)||c.includes(e)||s.includes(e)})(),o=N&&t.classList.contains("status-done")&&ve(t.dataset.completedAt||"");t.style.display=a&&!o?"":"none"})):(document.querySelectorAll("#chronicle-view .chronicle-event").forEach(t=>{const a=!e||(()=>{var s,i,u;const r=t.dataset.id||"",d=((i=(s=t.querySelector(".chronicle-task-link"))==null?void 0:s.textContent)==null?void 0:i.toLowerCase())||"",c=((u=t.dataset.project)==null?void 0:u.toLowerCase())||"";return r===e||d.includes(e)||c.includes(e)})(),o=N&&ve(t.dataset.completedAt||"");t.style.display=a&&!o?"":"none"}),document.querySelectorAll("#chronicle-view .chronicle-group").forEach(t=>{const a=[...t.querySelectorAll(".chronicle-event")].filter(o=>o.style.display!=="none").length;t.style.display=a>0?"":"none"}))}function Be(e){if(!e||e==="null")return[];try{const n=JSON.parse(e);return Array.isArray(n)?n:[]}catch{return[]}}function gn(e){const n=new Date(e+"Z"),a=new Date().getTime()-n.getTime(),o=Math.floor(a/864e5);return o===0?"today":o===1?"yesterday":o<7?`${o}d ago`:o<30?`${Math.floor(o/7)}w ago`:e.slice(0,10)}function Y(e){if(!e||e==="null")return[];try{const n=JSON.parse(e);return Array.isArray(n)?n:[]}catch{return[]}}function vn(e){var M,l;const n=Ve(e.priority),t=n?`<span class="badge ${n}">${e.priority}</span>`:"",a=e.completed_at?`<span class="badge date">${e.completed_at.slice(0,10)}</span>`:e.created_at?`<span class="badge created">${gn(e.created_at)}</span>`:"",o=!E&&e.project?`<span class="badge project">${e.project}</span>`:"",r=Wt[e.status],d=r?`<span class="badge status-${e.status}">${r}</span>`:"",c=`<span class="badge level-${e.level}">L${e.level}</span>`,s=e.current_agent?`<span class="badge agent-tag">${e.current_agent}</span>`:"",i=e.last_review_status?[]:Y(e.review_comments),u=e.last_review_status||(i.length>0?(M=i[i.length-1])==null?void 0:M.status:null),h=u?`<span class="badge ${u==="approved"?"review-approved":"review-changes"}">${u==="approved"?"Approved":"Changes Req."}</span>`:e.status==="impl_review"?'<span class="badge review-pending">Awaiting Review</span>':"",m=e.last_plan_review_status?[]:Y(e.plan_review_comments),g=e.last_plan_review_status||(m.length>0?(l=m[m.length-1])==null?void 0:l.status:null),f=g?`<span class="badge ${g==="approved"?"review-approved":"review-changes"}">${g==="approved"?"Plan OK":"Plan Changes"}</span>`:e.status==="plan_review"?'<span class="badge review-pending">Plan Review</span>':"",$=Be(e.tags).map(p=>`<span class="tag">${p}</span>`).join(""),b=e.note_count??Y(e.notes).length,R=b>0?`<span class="badge notes-count" title="${b} note(s)">💬 ${b}</span>`:"",S=hn(e.level,e.status).map(p=>`<option value="${p}">${Ne(p)}</option>`).join(""),x=S?`
      <label class="mobile-card-move card-interactive">
        <span>Move</span>
        <select class="mobile-status-select" data-id="${e.id}" data-project="${e.project}" data-current-status="${e.status}">
          <option value="${e.status}">${Ne(e.status)}</option>
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
        ${s}
        <button class="card-copy-btn" data-copy="#${e.id} ${e.title}" title="Copy to clipboard">⎘</button>
      </div>
      <div class="card-title">${e.title}</div>
      <div class="card-footer">
        ${o}
        ${f}
        ${h}
        ${R}
        ${a}
      </div>
      ${x}
      ${$?`<div class="card-tags">${$}</div>`:""}
    </div>
  `}function yn(e,n,t,a,o=a.length){const r=mn(e),d=Rt(a,e).map(vn).join(""),c=e==="todo"?'<button class="add-card-btn" id="add-card-btn" title="Add card">+</button>':"",s=o!==a.length?`${a.length}/${o}`:`${o}`;return`
    <div class="column ${e}" data-column="${e}" data-mobile-expanded="${r}" data-total-count="${o}">
      <div class="column-header">
        <button class="column-toggle-btn" type="button" data-column-toggle="${e}" aria-expanded="${r}">
          <span class="column-toggle-label">${t} ${n}</span>
          <span class="column-toggle-meta">
            <span class="count">${s}</span>
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
  `}const bn=/```[\s\S]*?```/g,$n=/```\w*\n?/,vt=/```$/,yt=/^```mermaid\s*\n?/,wn=/\*\*(.+?)\*\*/g,En=/`([^`]+)`/g,Ln=/^\x00CB(\d+)\x00$/,In=/^### (.+)$/,Cn=/^## (.+)$/,Sn=/^# (.+)$/,jn=/^[-*]\s+(.+)$/,_n=/^\d+\.\s+(.+)$/,bt=/^\|(.+)\|$/,$t=/^\|[\s:-]+\|$/;let Bn=0;function Ie(e){const n=[];let t=e.replace(bn,i=>{if(yt.test(i)){const u=i.replace(yt,"").replace(vt,"").trim(),h=`mermaid-${++Bn}`;n.push(`<pre class="mermaid" id="${h}">${u}</pre>`)}else{const u=i.replace($n,"").replace(vt,"");n.push(`<pre><code>${u}</code></pre>`)}return`\0CB${n.length-1}\0`});t=t.replace(/</g,"&lt;"),t=t.replace(wn,"<strong>$1</strong>").replace(En,"<code>$1</code>");const a=t.split(`
`),o=[];let r=!1,d=!1;function c(){r&&(o.push("</ul>"),r=!1),d&&(o.push("</ol>"),d=!1)}let s=0;for(;s<a.length;){const i=a[s].trim(),u=i.match(Ln);if(u){c(),o.push(n[parseInt(u[1])]),s++;continue}if(bt.test(i)){c();const b=[];for(;s<a.length&&bt.test(a[s].trim());)b.push(a[s].trim()),s++;if(b.length>=2){const R=$t.test(b[1]),S=R?b[0]:null,x=R?2:0;let H='<table class="md-table">';if(S){const U=S.slice(1,-1).split("|").map(M=>M.trim());H+="<thead><tr>"+U.map(M=>`<th>${M}</th>`).join("")+"</tr></thead>"}H+="<tbody>";for(let U=x;U<b.length;U++){if($t.test(b[U]))continue;const M=b[U].slice(1,-1).split("|").map(l=>l.trim());H+="<tr>"+M.map(l=>`<td>${l}</td>`).join("")+"</tr>"}H+="</tbody></table>",o.push(H)}else o.push(`<p>${b[0]}</p>`);continue}const h=i.match(In);if(h){c(),o.push(`<h3>${h[1]}</h3>`),s++;continue}const m=i.match(Cn);if(m){c(),o.push(`<h2>${m[1]}</h2>`),s++;continue}const g=i.match(Sn);if(g){c(),o.push(`<h1>${g[1]}</h1>`),s++;continue}const f=i.match(jn);if(f){d&&(o.push("</ol>"),d=!1),r||(o.push("<ul>"),r=!0),o.push(`<li>${f[1]}</li>`),s++;continue}const $=i.match(_n);if($){r&&(o.push("</ul>"),r=!1),d||(o.push("<ol>"),d=!0),o.push(`<li>${$[1]}</li>`),s++;continue}c(),i===""?o.push(""):o.push(`<p>${i}</p>`),s++}return c(),o.join(`
`)}async function Tn(e){const n=window.__mermaid;if(!n)return;const t=e.querySelectorAll("pre.mermaid");if(t.length!==0)try{await n.run({nodes:t})}catch(a){console.warn("Mermaid render failed:",a)}}function Pe(e,n,t,a,o){if(!a&&!o)return"";const r=a?Ie(a):'<span class="phase-empty">Not yet documented</span>';return`
    <div class="lifecycle-phase ${t} ${o?"active":""}">
      <div class="phase-header">
        <span class="phase-icon">${n}</span>
        <span class="phase-label">${e}</span>
        <button class="phase-expand-btn" title="Expand to full screen">&#x26F6;</button>
      </div>
      <div class="phase-body">${r}</div>
    </div>
  `}function wt(e){return e.length===0?"":e.map(n=>{var t;return`
    <div class="review-entry ${n.status}">
      <div class="review-header">
        <span class="badge ${n.status==="approved"?"review-approved":"review-changes"}">
          ${n.status==="approved"?"Approved":"Changes Requested"}
        </span>
        <span class="review-meta">${n.reviewer||""} &middot; ${((t=n.timestamp)==null?void 0:t.slice(0,16))||""}</span>
      </div>
      <div class="review-comment">${Ie(n.comment||"")}</div>
    </div>
  `}).join("")}function An(e){return e.length===0?"":e.map(n=>{var t;return`
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
      ${n.comment?`<div class="review-comment">${Ie(n.comment)}</div>`:""}
    </div>
  `}).join("")}async function kn(e,n=1920,t=.82){return new Promise((a,o)=>{const r=new Image,d=URL.createObjectURL(e);r.onload=()=>{URL.revokeObjectURL(d);let{width:c,height:s}=r;(c>n||s>n)&&(c>s?(s=Math.round(s*n/c),c=n):(c=Math.round(c*n/s),s=n));const i=document.createElement("canvas");i.width=c,i.height=s,i.getContext("2d").drawImage(r,0,0,c,s),a(i.toDataURL("image/jpeg",t))},r.onerror=()=>{URL.revokeObjectURL(d),o(new Error("Image load failed"))},r.src=d})}async function Oe(e,n,t){var a,o;for(const r of Array.from(n)){if(!r.type.startsWith("image/"))continue;let d;try{d=await kn(r)}catch{d=await new Promise(u=>{const h=new FileReader;h.onload=()=>u(h.result),h.readAsDataURL(r)})}const c=(o=(a=r.name.match(/\.[^.]+$/))==null?void 0:a[0])==null?void 0:o.toLowerCase(),s=c===".jpg"||c===".jpeg"||c===".png"||c===".webp"||c===".gif"||c===".svg"?r.name:r.name.replace(/\.[^.]+$/,"")+".jpg",i=await _(`/api/task/${e}/attachment?project=${encodeURIComponent(t)}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({filename:s,data:d})});if(!i.ok){const u=await i.json().catch(()=>({}));Ae(u.error||`Upload failed (${i.status})`);return}}W(e,t)}async function W(e,n){var r;const t=document.getElementById("modal-overlay"),a=document.getElementById("modal-content");a.innerHTML='<div style="color:#94a3b8">Loading...</div>',t.classList.remove("hidden"),J();try{const d=n?`?project=${encodeURIComponent(n)}`:"",s=await(await _(`/api/task/${e}${d}`)).json(),i=document.querySelector(`.card[data-id="${s.id}"][data-project="${CSS.escape(s.project)}"]`);i&&i.dataset.status!==s.status&&(at(),k());const u=Be(s.tags),h=u.length?`<div class="modal-tags">${u.map(v=>`<span class="tag">${v}</span>`).join("")}</div>`:"",m=[`<strong>Project:</strong> ${s.project}`,`<strong>Status:</strong> ${s.status}`,`<strong>Priority:</strong> ${s.priority}`,`<strong>Created:</strong> ${((r=s.created_at)==null?void 0:r.slice(0,10))||"-"}`,s.started_at?`<strong>Started:</strong> ${s.started_at.slice(0,10)}`:"",s.planned_at?`<strong>Planned:</strong> ${s.planned_at.slice(0,10)}`:"",s.reviewed_at?`<strong>Reviewed:</strong> ${s.reviewed_at.slice(0,10)}`:"",s.tested_at?`<strong>Tested:</strong> ${s.tested_at.slice(0,10)}`:"",s.completed_at?`<strong>Completed:</strong> ${s.completed_at.slice(0,10)}`:""].filter(Boolean).join(" &nbsp;|&nbsp; "),g={1:{labels:["Req","Impl","Done"],statuses:["todo","impl","done"]},2:{labels:["Req","Plan","Impl","Review","Done"],statuses:["todo","plan","impl","impl_review","done"]},3:{labels:["Req","Plan","Plan Rev","Impl","Impl Rev","Test","Done"],statuses:["todo","plan","plan_review","impl","impl_review","test","done"]}},f=g[s.level]||g[3],$=Math.max(0,f.statuses.indexOf(s.status)),b=`
      <div class="lifecycle-progress">
        <span class="level-indicator">L${s.level}</span>
        ${f.labels.map((v,w)=>`
          <div class="progress-step ${w<$?"completed":""} ${w===$?"current":""}">
            <div class="step-dot"></div>
            <span class="step-label">${v}</span>
          </div>
        `).join('<div class="progress-line"></div>')}
      </div>
    `,R=Y(s.attachments),S=R.length>0?`<div class="attachments-grid">${R.map(v=>`<div class="attachment-thumb" data-stored="${v.storedName}">
            <img src="${v.url}" alt="${v.filename}" loading="lazy" />
            <button class="attachment-remove" data-id="${e}" data-name="${v.storedName}" title="Remove">&times;</button>
            <span class="attachment-name">${v.filename}</span>
          </div>`).join("")}</div>`:"",x=s.description?Ie(s.description):'<span class="phase-empty">Not yet documented</span>',H=[1,2,3].map(v=>`<option value="${v}" ${v===s.level?"selected":""}>L${v}</option>`).join(""),U=`
      <div class="lifecycle-phase phase-requirement ${$===0?"active":""}">
        <div class="phase-header">
          <span class="phase-icon">📋</span>
          <span class="phase-label">Requirements</span>
          <select class="level-select" id="level-select" title="Pipeline Level">${H}</select>
          <button class="phase-edit-btn" id="req-edit-btn" title="Edit">&#9998;</button>
          <button class="phase-expand-btn" title="Expand to full screen">&#x26F6;</button>
        </div>
        <div class="phase-body" id="req-body-view">
          ${x}
          ${S}
        </div>
        <div class="phase-body hidden" id="req-body-edit">
          <textarea id="req-textarea" rows="8">${(s.description||"").replace(/</g,"&lt;")}</textarea>
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
    `,M=Pe("Plan","🗺️","phase-plan",s.plan,$===1&&!s.plan);let l="";s.decision_log&&(l=Pe("Decision Log","🧭","phase-decision-log",s.decision_log,!1));let p="";s.done_when&&(p=Pe("Done When","🎯","phase-done-when",s.done_when,!1));const y=Y(s.plan_review_comments),L=wt(y);let P="";(L||$===2)&&(P=`
        <div class="lifecycle-phase phase-plan-review ${$===2?"active":""}">
          <div class="phase-header">
            <span class="phase-icon">🔍</span>
            <span class="phase-label">Plan Review</span>
            ${s.plan_review_count>0?`<span class="review-count">${s.plan_review_count} review(s)</span>`:""}
            <button class="phase-expand-btn" title="Expand to full screen">&#x26F6;</button>
          </div>
          <div class="phase-body">${L||'<span class="phase-empty">Awaiting plan review</span>'}</div>
        </div>
      `);const O=Pe("Implementation","🔨","phase-impl",s.implementation_notes,$===3&&!s.implementation_notes),q=Y(s.review_comments),Z=wt(q);let xe="";(Z||$===4)&&(xe=`
        <div class="lifecycle-phase phase-review ${$===4?"active":""}">
          <div class="phase-header">
            <span class="phase-icon">📝</span>
            <span class="phase-label">Implementation Review</span>
            ${s.impl_review_count>0?`<span class="review-count">${s.impl_review_count} review(s)</span>`:""}
            <button class="phase-expand-btn" title="Expand to full screen">&#x26F6;</button>
          </div>
          <div class="phase-body">${Z||'<span class="phase-empty">Awaiting implementation review</span>'}</div>
        </div>
      `);const Je=Y(s.test_results),he=An(Je);let ae="";(he||$===5)&&(ae=`
        <div class="lifecycle-phase phase-test ${$===5?"active":""}">
          <div class="phase-header">
            <span class="phase-icon">🧪</span>
            <span class="phase-label">Test Results</span>
            <button class="phase-expand-btn" title="Expand to full screen">&#x26F6;</button>
          </div>
          <div class="phase-body">${he||'<span class="phase-empty">Awaiting test execution</span>'}</div>
        </div>
      `);const se=Y(s.agent_log);let rt="";if(se.length>0){let v=function(I){if(!I)return{name:"",model:null};const ge=I.toLowerCase();for(const Ge of w){const oe=ge.lastIndexOf(Ge);if(oe>0){let ie=oe;for(;ie>0&&(I[ie-1]==="-"||I[ie-1]==="_");)ie--;return{name:I.slice(0,ie),model:I.slice(oe)}}}return{name:I,model:null}};var o=v;const w=["opus","sonnet","haiku","gemini","copilot","gpt"],j=se.map(I=>{var ht;const{name:ge,model:Ge}=v(I.agent||""),oe=I.model||Ge,ie=oe?`<span class="badge model-tag model-${oe.toLowerCase()}">${oe}</span>`:"";return`
          <div class="agent-log-entry">
            <span class="agent-log-time">${((ht=I.timestamp)==null?void 0:ht.slice(0,16))||""}</span>
            <span class="badge agent-tag">${ge||I.agent||""}</span>
            ${ie}
            <span class="agent-log-msg">${I.message||""}</span>
          </div>
        `}).join("");rt=`
        <details class="lifecycle-phase phase-agent-log">
          <summary class="phase-header">
            <span class="phase-icon">🤖</span>
            <span class="phase-label">Agent Log</span>
            <span class="review-count">${se.length} entries</span>
          </summary>
          <div class="phase-body agent-log-body">${j}</div>
        </details>
      `}const ct=Y(s.notes),Mt=ct.map(v=>{var w;return`
      <div class="note-entry">
        <div class="note-header">
          <span class="note-author">${v.author||"user"}</span>
          <span class="note-time">${((w=v.timestamp)==null?void 0:w.slice(0,16).replace("T"," "))||""}</span>
          <button class="note-delete" data-note-id="${v.id}" title="Delete">&times;</button>
        </div>
        <div class="note-text">${Ie(v.text||"")}</div>
      </div>
    `}).join(""),Dt=`
      <div class="notes-section">
        <div class="notes-header">
          <span>Notes</span>
          <span class="notes-count">${ct.length}</span>
        </div>
        <div class="notes-list">${Mt}</div>
        <form class="note-form" id="note-form">
          <textarea id="note-input" rows="2" placeholder="Add a note... (supports markdown)"></textarea>
          <button type="submit" class="note-submit">Add Note</button>
        </form>
      </div>
    `;a.innerHTML=`
      <h1>#${s.id} ${s.title}</h1>
      <div class="modal-meta">${m}</div>
      ${h}
      ${b}
      <div class="lifecycle-sections">
        ${U}
        ${M}
        ${l}
        ${p}
        ${P}
        ${O}
        ${xe}
        ${ae}
        ${rt}
      </div>
      ${Dt}
      <div class="modal-danger-zone">
        <button class="delete-task-btn" id="delete-task-btn">Delete Card</button>
      </div>
    `,Tn(a),a.querySelectorAll(".phase-expand-btn").forEach(v=>{v.addEventListener("click",w=>{w.stopPropagation();const j=v.closest(".lifecycle-phase");j==null||j.requestFullscreen().catch(()=>{})})});const lt=document.getElementById("level-select");lt.addEventListener("change",async()=>{const v=parseInt(lt.value);await _(`/api/task/${e}?project=${encodeURIComponent(s.project)}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({level:v})}),z(s.project),W(e,s.project)}),document.getElementById("delete-task-btn").addEventListener("click",async()=>{confirm(`Delete card #${s.id} "${s.title}"?`)&&(await _(`/api/task/${e}?project=${encodeURIComponent(s.project)}`,{method:"DELETE"}),z(s.project),document.getElementById("modal-overlay").classList.add("hidden"),k())});const Ht=document.getElementById("req-edit-btn"),dt=document.getElementById("req-body-view"),pt=document.getElementById("req-body-edit"),Ye=document.getElementById("req-textarea"),ut=document.getElementById("req-save-btn"),Ut=document.getElementById("req-cancel-btn");Ht.addEventListener("click",()=>{dt.classList.add("hidden"),pt.classList.remove("hidden"),Ye.focus()}),Ut.addEventListener("click",()=>{Ye.value=s.description||"",pt.classList.add("hidden"),dt.classList.remove("hidden")}),ut.addEventListener("click",async()=>{const v=Ye.value;ut.textContent="Saving...",await _(`/api/task/${e}?project=${encodeURIComponent(s.project)}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({description:v})}),z(s.project),W(e,s.project)});const X=document.getElementById("attachment-drop-zone"),fe=document.getElementById("attachment-input");X&&fe&&(X.addEventListener("click",()=>fe.click()),X.addEventListener("dragover",v=>{v.preventDefault(),X.classList.add("drop-active")}),X.addEventListener("dragleave",()=>{X.classList.remove("drop-active")}),X.addEventListener("drop",async v=>{var j;v.preventDefault(),X.classList.remove("drop-active");const w=(j=v.dataTransfer)==null?void 0:j.files;w&&await Oe(e,w,s.project)}),fe.addEventListener("change",async()=>{fe.files&&await Oe(e,fe.files,s.project)})),a.addEventListener("paste",async v=>{var j;const w=Array.from(((j=v.clipboardData)==null?void 0:j.files)??[]).filter(I=>I.type.startsWith("image/"));w.length!==0&&(v.preventDefault(),await Oe(e,w,s.project))}),a.querySelectorAll(".attachment-remove").forEach(v=>{v.addEventListener("click",async w=>{w.stopPropagation();const j=v,I=j.dataset.id,ge=j.dataset.name;await _(`/api/task/${I}/attachment/${encodeURIComponent(ge)}?project=${encodeURIComponent(s.project)}`,{method:"DELETE"}),W(e,s.project)})});const Nt=document.getElementById("note-form"),mt=document.getElementById("note-input");Nt.addEventListener("submit",async v=>{v.preventDefault();const w=mt.value.trim();w&&(mt.disabled=!0,await _(`/api/task/${e}/note?project=${encodeURIComponent(s.project)}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({text:w})}),z(s.project),W(e,s.project))}),a.querySelectorAll(".note-delete").forEach(v=>{v.addEventListener("click",async w=>{w.stopPropagation();const j=v.dataset.noteId;await _(`/api/task/${e}/note/${j}?project=${encodeURIComponent(s.project)}`,{method:"DELETE"}),z(s.project),W(e,s.project)})})}catch{a.innerHTML='<div style="color:#ef4444">Failed to load</div>'}}function xt(e){if(!e)return new Date(NaN);let n=e.replace(" ","T");return n.length===10?n+="T00:00:00Z":/Z$|[+-]\d{2}:\d{2}$/.test(n)||(n+="Z"),new Date(n)}function Rn(e){const n=xt(e);if(isNaN(n.getTime()))return"Unknown";const t=n.getUTCDay()||7;n.setUTCDate(n.getUTCDate()+4-t);const a=new Date(Date.UTC(n.getUTCFullYear(),0,1)),o=Math.ceil(((n.getTime()-a.getTime())/864e5+1)/7);return`${n.getUTCFullYear()}-W${String(o).padStart(2,"0")}`}function xn(e){const n=xt(e);if(isNaN(n.getTime()))return e.slice(0,10)||"—";const t=n.toLocaleDateString(void 0,{month:"short",day:"numeric",timeZone:"UTC"}),a=n.toLocaleTimeString(void 0,{hour:"2-digit",minute:"2-digit",timeZone:"UTC",hour12:!1});return`${t}
${a}`}function Pn(e){const n=Ve(e.priority),t=!E&&e.project?`<span class="badge project">${e.project}</span>`:"",a=n?`<span class="badge ${n}">${e.priority}</span>`:"",o=`<span class="badge status-${e.status}">${Ne(e.status)}</span>`;return`
    <div class="chronicle-event" data-id="${e.id}" data-project="${e.project}" data-completed-at="${e.completed_at||""}">
      <div class="chronicle-dot ev-completed"></div>
      <div class="chronicle-event-time">${xn(e.completed_at)}</div>
      <div class="chronicle-event-body">
        <button class="chronicle-task-link" data-id="${e.id}" data-project="${e.project}">
          #${e.id} ${e.title}
        </button>
        ${o}
        ${a}
        ${t}
      </div>
    </div>`}function qn(e){var u,h;const n=Ve(e.priority),t=n?`<span class="badge ${n}">${e.priority}</span>`:"",a=!E&&e.project?`<span class="badge project">${e.project}</span>`:"",o=`<span class="badge status-${e.status}">${Ne(e.status)}</span>`,r=`<span class="badge level-${e.level}">L${e.level}</span>`,d=((u=e.created_at)==null?void 0:u.slice(0,10))||"",c=((h=e.completed_at)==null?void 0:h.slice(0,10))||"—",i=Be(e.tags).map(m=>`<span class="tag">${m}</span>`).join("");return`
    <article class="list-card status-${e.status}" data-id="${e.id}" data-project="${e.project}" data-completed-at="${e.completed_at||""}">
      <div class="list-card-top">
        <div class="list-card-meta">
          <span class="list-card-id">#${e.id}</span>
          ${o}
          ${r}
          ${t}
        </div>
        ${a}
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
  `}async function Pt(){const e=document.getElementById("chronicle-view");try{const n=await me("full");Ke(n.projects),Ce();const t=[];for(const d of G)for(const c of n[d.key])t.push(c);const a=t.filter(d=>!!d.completed_at).sort((d,c)=>c.completed_at.localeCompare(d.completed_at)),o=new Map;for(const d of a){const c=Rn(d.completed_at);o.has(c)||o.set(c,[]),o.get(c).push(d)}if(o.size===0){e.innerHTML=`
        <div style="display:flex;align-items:center;justify-content:center;color:#64748b;font-size:0.9rem;padding:64px">
          No completed tasks yet
        </div>`;return}const r=[...o.entries()].map(([d,c])=>{const s=c.map(Pn).join("");return`
        <div class="chronicle-group">
          <div class="chronicle-week-header">${d}</div>
          <div class="chronicle-events">${s}</div>
        </div>`}).join("");e.innerHTML=`<div class="chronicle-timeline">${r}</div>`,e.querySelectorAll(".chronicle-task-link").forEach(d=>{d.addEventListener("click",c=>{c.stopPropagation();const s=parseInt(d.dataset.id),i=d.dataset.project||void 0;W(s,i)})}),ot()}catch(n){console.error("loadChronicleView failed:",n),e.innerHTML=`
      <div style="display:flex;align-items:center;justify-content:center;color:#ef4444;font-size:0.9rem;padding:48px">
        Failed to load chronicle
      </div>`}}async function We(){const e=document.getElementById("graph-view"),n=e.getBoundingClientRect().top;e.style.height=`${window.innerHeight-n}px`,e.innerHTML=`
    <div class="graph-placeholder">
      <div class="graph-spinner"></div>
      <p>Loading graph&hellip;</p>
    </div>`,re&&(re.pauseAnimation(),re=null),Q&&(Q.disconnect(),Q=null);const t={react:"#61dafb",nextjs:"#ffffff",typescript:"#3178c6",tailwind:"#38bdf8","react-query":"#ff4154",vite:"#a855f7",shadcn:"#f8fafc",zustand:"#764abc",hotwire:"#cc0000",css:"#264de4",fastapi:"#009688",rails:"#cc0000",python:"#3572a5",nodejs:"#68a063",ruby:"#cc342d",postgresql:"#336791",sqlite:"#003b57",neon:"#00e599",supabase:"#3ecf8e",timescaledb:"#fdb515",influxdb:"#22adf6",drizzle:"#c5f74f",prisma:"#5a67d8",sqlalchemy:"#d71f00",oracle:"#f80000",auth:"#f59e0b","auth.js":"#f59e0b",oauth:"#f97316",docker:"#2496ed","docker-compose":"#2496ed",vercel:"#ffffff",deploy:"#10b981",kamal:"#10b981",gcp:"#4285f4",azure:"#0078d4","ci-cd":"#f05032",mobile:"#a78bfa",capacitor:"#119eff",pwa:"#5a0fc8",api:"#64748b",modbus:"#e67e22",realtime:"#ef4444",webhook:"#6366f1",ai:"#f59e0b",testing:"#22c55e",storage:"#0ea5e9",s3:"#ff9900",r2:"#f38020",pdf:"#e53e3e",excel:"#217346",performance:"#f97316",cache:"#8b5cf6",migration:"#ec4899",maps:"#34a853",gps:"#34a853",visualization:"#06b6d4",dashboard:"#06b6d4",canvas:"#f59e0b",graph:"#06b6d4",chart:"#06b6d4",modal:"#94a3b8",refactor:"#a3a3a3",kanban:"#818cf8",obsidian:"#7c3aed","cycling-data":"#10b981",euv:"#e11d48",plc:"#e11d48",schema:"#64748b"},a=["react","nextjs","typescript","fastapi","rails","python","nodejs","postgresql","sqlite","neon","supabase","timescaledb","influxdb","drizzle","prisma","sqlalchemy","oracle","auth","auth.js","oauth","docker","docker-compose","vercel","deploy","kamal","gcp","azure","ci-cd","mobile","capacitor","pwa","api","modbus","realtime","webhook","ai","testing","storage","s3","r2","pdf","excel","performance","cache","migration","maps","gps","visualization","dashboard","canvas","graph","chart","modal","refactor","kanban","obsidian","cycling-data","euv","plc","schema"];function o(c){const s=c.map(i=>i.toLowerCase());for(const i of a)if(s.includes(i))return i;return s.find(i=>i in t)??null}const r={1:9,2:16,3:25},d={todo:"#475569",plan:"#3b82f6",impl:"#8b5cf6",impl_review:"#6366f1",plan_review:"#a855f7",test:"#f59e0b",done:"#22c55e"};try{const[{default:c},s]=await Promise.all([zt(()=>import("./force-graph-B6EEfo0M.js"),[]),me("full")]),i=[];for(const l of G){const p=s[l.key];for(const y of p)i.push({...y,_status:l.key})}let u=i,h="";i.length>300?(u=i.filter(l=>l._status!=="done"),h=`<div style="position:absolute;top:8px;left:50%;transform:translateX(-50%);z-index:10;background:#1e293b;color:#f59e0b;padding:4px 12px;border-radius:6px;font-size:0.8rem;border:1px solid #f59e0b40">${i.length} nodes — done tasks hidden for performance</div>`):N&&(u=i.filter(l=>!(l._status==="done"&&ve(l.completed_at||""))));const m=ue.toLowerCase().replace(/^#/,""),g=u.map(l=>({id:l.id,title:`#${l.id} ${l.title}`,status:l._status,level:l.level??1,tags:Be(l.tags),priority:l.priority||"medium",project:l.project})),f=new Map;for(const l of g)for(const p of l.tags){const y=p.toLowerCase();f.has(y)||f.set(y,[]),f.get(y).push(l.id)}const $=new Map;for(const[,l]of f)for(let p=0;p<l.length;p++)for(let y=p+1;y<l.length;y++){const L=Math.min(l[p],l[y]),P=Math.max(l[p],l[y]),O=`${L}-${P}`;$.set(O,($.get(O)||0)+1)}const b=new Set,R=[];for(const[l,p]of f)for(let y=0;y<p.length;y++)for(let L=y+1;L<p.length;L++){const P=Math.min(p[y],p[L]),O=Math.max(p[y],p[L]),q=`${P}-${O}`;b.has(q)||(b.add(q),R.push({source:P,target:O,tag:l,sharedCount:$.get(q)||1}))}e.innerHTML=h,e.style.position="relative",e.style.padding="0",e.style.overflow="hidden";const S=document.createElement("div");S.style.cssText="position:absolute;inset:0;width:100%;height:100%",e.appendChild(S);const x=document.createElement("div");x.className="graph-tooltip",e.appendChild(x),e.addEventListener("mousemove",l=>{const p=e.getBoundingClientRect();x.style.left=`${l.clientX-p.left+12}px`,x.style.top=`${l.clientY-p.top+12}px`});const H=c()(S).backgroundColor("#0f172a").nodeId("id").nodeLabel(()=>"").nodeVal(l=>r[l.level]||r[1]).nodeCanvasObject((l,p,y)=>{const L=Math.sqrt(r[l.level]||r[1])*2,P=l.x??0,O=l.y??0;let q=1;m?q=l.title.toLowerCase().includes(m)||l.tags.some(se=>se.toLowerCase().includes(m))?1:.15:l.status==="done"&&(q=.35),p.globalAlpha=q;const Z=o(l.tags),xe=Z?t[Z]??"#334155":"#334155";p.beginPath(),p.arc(P,O,L,0,2*Math.PI),p.fillStyle=xe,p.fill();const Je=d[l.status]??"#475569";p.beginPath(),p.arc(P,O,L+1.5/y,0,2*Math.PI),p.strokeStyle=Je,p.lineWidth=1.5/y,p.stroke();const he=Z??l.tags[0]??"";if(he){const ae=Math.max(2,10/y);p.font=`600 ${ae}px sans-serif`,p.fillStyle=q<.5?"rgba(148,163,184,0.15)":Z?t[Z]??"#94a3b8":"#94a3b8",p.textAlign="center",p.textBaseline="top",p.fillText(he,P,O+L+2/y)}if(y>2.5){const ae=l.title.replace(/^#\d+\s*/,"").slice(0,30),se=9/y;p.font=`${se}px sans-serif`,p.fillStyle=q<.5?"rgba(148,163,184,0.2)":"#64748b",p.textAlign="center",p.textBaseline="bottom",p.fillText(ae,P,O-L-2/y)}p.globalAlpha=1}).nodePointerAreaPaint((l,p,y)=>{const L=Math.sqrt(r[l.level]||r[1])*2+2;y.beginPath(),y.arc(l.x??0,l.y??0,L,0,2*Math.PI),y.fillStyle=p,y.fill()}).onNodeClick(l=>{W(l.id,l.project)}).onNodeHover(l=>{if(S.style.cursor=l?"pointer":"default",!l){x.style.display="none";return}const p=o(l.tags),y=p?t[p]??null:null,L=p?`<span style="background:${y};color:#0f172a;padding:1px 7px;border-radius:4px;font-weight:600">${p}</span>`:"",P=l.tags.filter(q=>q.toLowerCase()!==p).slice(0,3),O=P.length?`<div class="graph-tooltip-tags">${P.map(q=>`<span>${q}</span>`).join("")}</div>`:"";x.innerHTML=`
          <div class="graph-tooltip-title">${l.title}</div>
          <div class="graph-tooltip-meta" style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">
            ${L}
            <span>${l.status} &middot; ${l.priority} &middot; L${l.level}</span>
          </div>
          ${O}`,x.style.display="block"}).linkColor(l=>t[l.tag.toLowerCase()]??"#334155").linkWidth(l=>Math.min(1.5+(l.sharedCount-1)*.8,4)).d3AlphaDecay(.02).d3VelocityDecay(.3).warmupTicks(100).cooldownTime(5e3).width(e.offsetWidth||window.innerWidth).height(window.innerHeight-e.getBoundingClientRect().top).graphData({nodes:g,links:R});re=H;const U=new Set(g.flatMap(l=>l.tags.map(p=>p.toLowerCase()))),M=a.filter(l=>U.has(l)&&l in t).slice(0,16);if(M.length>0){const l=document.createElement("div");l.className="graph-legend",l.innerHTML=M.map(p=>`<div class="graph-legend-item"><span style="background:${t[p]}"></span>${p}</div>`).join(""),e.appendChild(l)}Q=new ResizeObserver(()=>{const l=e.offsetWidth,p=window.innerHeight-e.getBoundingClientRect().top;l>0&&p>0&&(e.style.height=`${p}px`,H.width(l).height(p))}),Q.observe(document.documentElement)}catch(c){console.error("loadGraphView failed:",c),e.innerHTML=`
      <div class="graph-placeholder">
        <p style="color:#ef4444;font-size:0.9rem">Failed to load graph</p>
      </div>`}}async function Te(){var n,t,a,o,r,d,c,s;const e=document.getElementById("board");try{const i=await me(Qe()?"full":"board");un(i),Ke(i.projects),gt?Ce():(gt=!0,Mn().then(()=>Ce())),e.innerHTML=G.map(g=>{var f;return yn(g.key,g.label,g.icon,i[g.key],((f=i.counts)==null?void 0:f[g.key])??i[g.key].length)}).join("");const u=((n=i.counts)==null?void 0:n.done)??i.done.length,h=i.total??(((t=i.counts)==null?void 0:t.todo)??i.todo.length)+(((a=i.counts)==null?void 0:a.plan)??i.plan.length)+(((o=i.counts)==null?void 0:o.plan_review)??i.plan_review.length)+(((r=i.counts)==null?void 0:r.impl)??i.impl.length)+(((d=i.counts)==null?void 0:d.impl_review)??i.impl_review.length)+(((c=i.counts)==null?void 0:c.test)??i.test.length)+(((s=i.counts)==null?void 0:s.done)??i.done.length);document.getElementById("count-summary").textContent=`${u}/${h} completed`,e.querySelectorAll(".card").forEach(g=>{g.addEventListener("click",f=>{if(f.target.closest(".card-interactive")){f.stopPropagation();return}const b=f.target.closest(".card-copy-btn");if(b){f.stopPropagation(),navigator.clipboard.writeText(b.dataset.copy).then(()=>{const x=b.textContent;b.textContent="✓",setTimeout(()=>{b.textContent=x},1e3)});return}const R=parseInt(g.dataset.id),S=g.dataset.project;W(R,S)})}),T||Hn(),On(),ze(),ot();const m=document.getElementById("add-card-btn");m&&m.addEventListener("click",g=>{g.stopPropagation(),document.getElementById("add-card-overlay").classList.remove("hidden"),J(),T||document.getElementById("add-title").focus()})}catch(i){console.error("loadBoard failed:",i),e.innerHTML=`
      <div style="grid-column:1/-1;display:flex;align-items:center;justify-content:center;color:#ef4444;font-size:0.9rem;padding:48px">
        Cannot find .claude/kanban.db
      </div>
    `}}function On(){document.querySelectorAll("[data-column-toggle]").forEach(e=>{e.addEventListener("click",n=>{if(!T)return;n.stopPropagation();const t=e.dataset.columnToggle;if(!t)return;te.has(t)?te.delete(t):te.add(t),kt();const a=e.closest(".column"),o=te.has(t)||!!ue.trim();a&&a.setAttribute("data-mobile-expanded",String(o)),e.setAttribute("aria-expanded",String(o));const r=e.querySelector(".column-toggle-icon");r&&(r.textContent=o?"−":"+")})}),document.querySelectorAll(".mobile-status-select").forEach(e=>{e.addEventListener("click",n=>n.stopPropagation()),e.addEventListener("change",async n=>{n.stopPropagation();const t=e.value,a=parseInt(e.dataset.id||"",10),o=e.dataset.project||"",r=e.dataset.currentStatus||"";!a||!o||await fn({id:a,project:o,status:r},t)})})}async function Fe(){const e=document.getElementById("list-view");try{const n=await me("full");Ke(n.projects),Ce();const t=[];for(const s of G)for(const i of n[s.key])t.push(i);const a=ee==="default"?[...t].sort((s,i)=>i.id-s.id):Rt(t),o=a.length,r=a.filter(s=>s.status==="done").length;document.getElementById("count-summary").textContent=`${r}/${o} completed`;const d=a.map(s=>{var m,g;const i=Ve(s.priority),h=Be(s.tags).map(f=>`<span class="tag">${f}</span>`).join("");return`
        <tr class="status-${s.status}" data-id="${s.id}" data-project="${s.project}" data-completed-at="${s.completed_at||""}">
          <td class="col-id">#${s.id}</td>
          <td class="col-title">${s.title}</td>
          <td>
            <select class="list-status-select" data-id="${s.id}" data-field="status">
              ${G.map(f=>`<option value="${f.key}" ${f.key===s.status?"selected":""}>${f.icon} ${f.label}</option>`).join("")}
            </select>
          </td>
          <td>
            <select class="list-level-select" data-id="${s.id}" data-field="level">
              ${[1,2,3].map(f=>`<option value="${f}" ${f===s.level?"selected":""}>L${f}</option>`).join("")}
            </select>
          </td>
          <td>
            <select class="list-priority-select ${i}" data-id="${s.id}" data-field="priority">
              ${["high","medium","low"].map(f=>`<option value="${f}" ${f===s.priority?"selected":""}>${f[0].toUpperCase()+f.slice(1)}</option>`).join("")}
            </select>
          </td>
          <td class="list-date">${s.project||""}</td>
          <td>${h}</td>
          <td class="list-date">${((m=s.created_at)==null?void 0:m.slice(0,10))||""}</td>
          <td class="list-date">${((g=s.completed_at)==null?void 0:g.slice(0,10))||""}</td>
        </tr>
      `}).join(""),c=a.map(qn).join("");e.innerHTML=`
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
    `,e.querySelectorAll("select").forEach(s=>{s.addEventListener("change",async i=>{i.stopPropagation();const u=s,h=u.dataset.id,m=u.dataset.field;let g=u.value;m==="level"&&(g=parseInt(g));const f=u.closest("tr"),$=(f==null?void 0:f.dataset.project)||"",b=await _(`/api/task/${h}?project=${encodeURIComponent($)}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({[m]:g})});if(!b.ok){const R=await b.json().catch(()=>({}));R.error&&Ae(R.error),Fe();return}z($),Fe()})}),e.querySelectorAll(".col-title").forEach(s=>{s.addEventListener("click",i=>{i.stopPropagation();const u=s.closest("[data-id]"),h=parseInt(u.dataset.id),m=u.dataset.project;W(h,m)})}),ze(),ot()}catch(n){console.error("loadListView failed:",n),e.innerHTML=`
      <div style="display:flex;align-items:center;justify-content:center;color:#ef4444;font-size:0.9rem;padding:48px">
        Failed to load task list
      </div>
    `}}async function Mn(){try{const e=await _("/api/projects");if(!e.ok)return;const n=await e.json();for(const t of n.projects??[])t.id&&t.category&&Ee.set(t.id,t.category)}catch{}}function Ce(){const e=document.getElementById("category-filter");if(!e)return;const n=[...new Set(Ee.values())].sort();if(n.length===0){e.innerHTML="";return}const t=[`<button class="cat-chip${D?"":" active"}" data-cat="">All</button>`,...n.map(a=>`<button class="cat-chip${D===a?" active":""}" data-cat="${a}">${a}</button>`)].join("");e.innerHTML=t,e.querySelectorAll(".cat-chip").forEach(a=>{a.addEventListener("click",()=>{D=a.dataset.cat||null,D?localStorage.setItem("kanban-category",D):localStorage.removeItem("kanban-category");const o=D?qe.filter(r=>Ee.get(r)===D):qe;D&&(o.length===1?(E=o[0],localStorage.setItem("kanban-project",E)):E&&!o.includes(E)&&(E=null,localStorage.removeItem("kanban-project"))),B=null,ne=null,Ce(),Ke(qe),k()})})}function ot(){if(!D||E)return;document.querySelectorAll(".card[data-project], .list-card[data-project], .chronicle-event[data-project]").forEach(n=>{const t=Ee.get(n.dataset.project||"");n.style.display=t===D?"":"none"})}function Ke(e){qe=e;const n=D?e.filter(o=>Ee.get(o)===D):e,t=document.getElementById("project-filter");if(n.length<=1){t.innerHTML=n[0]?`<span class="project-label">${n[0]}</span>`:"";return}const a=n.map(o=>`<option value="${o}" ${o===E?"selected":""}>${o}</option>`).join("");t.innerHTML=`
    <select id="project-select">
      <option value="">All Projects</option>
      ${a}
    </select>
  `,document.getElementById("project-select").addEventListener("change",o=>{E=o.target.value||null,E?localStorage.setItem("kanban-project",E):localStorage.removeItem("kanban-project"),B=null,ne=null,k()})}function Et(e,n){const t=[...e.querySelectorAll(".card:not(.dragging)")];for(const a of t){const o=a.getBoundingClientRect(),r=o.top+o.height/2;if(n<r)return a}return null}function Me(){document.querySelectorAll(".drop-indicator").forEach(e=>e.remove())}function Dn(e,n){Me();const t=document.createElement("div");t.className="drop-indicator",n?e.insertBefore(t,n):e.appendChild(t)}function Hn(){const e=document.querySelectorAll(".card"),n=document.querySelectorAll(".column-body");e.forEach(t=>{t.addEventListener("dragstart",a=>{const o=a,r=t;o.dataTransfer.setData("text/plain",`${r.dataset.project}:${r.dataset.id}`),r.classList.add("dragging"),He=!0}),t.addEventListener("dragend",()=>{t.classList.remove("dragging"),Me(),He=!1})}),n.forEach(t=>{t.addEventListener("dragover",a=>{a.preventDefault();const o=t;o.classList.add("drag-over");const r=Et(o,a.clientY);Dn(o,r)}),t.addEventListener("dragleave",a=>{const o=t;o.contains(a.relatedTarget)||(o.classList.remove("drag-over"),Me())}),t.addEventListener("drop",async a=>{a.preventDefault();const o=t;o.classList.remove("drag-over"),Me();const r=a,d=r.dataTransfer.getData("text/plain"),c=d.lastIndexOf(":"),s=c>=0?d.slice(0,c):"",i=parseInt(c>=0?d.slice(c+1):d),u=o.dataset.column,h=Et(o,r.clientY),m=[...o.querySelectorAll(".card:not(.dragging)")];let g=null,f=null;if(h){f=parseInt(h.dataset.id);const b=m.indexOf(h);b>0&&(g=parseInt(m[b-1].dataset.id))}else m.length>0&&(g=parseInt(m[m.length-1].dataset.id));const $=await _(`/api/task/${i}/reorder?project=${encodeURIComponent(s)}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({status:u,afterId:g,beforeId:f})});if(!$.ok){const b=await $.json().catch(()=>({}));b.error&&Ae(b.error)}z(s),Te()})})}function Ae(e){const n=document.querySelector(".toast");n&&n.remove();const t=document.createElement("div");t.className="toast",t.textContent=e,document.body.appendChild(t),setTimeout(()=>t.remove(),3e3)}async function qt(){try{const n=await(await _("/api/info")).json();n.projectName&&(document.title=`Kanban · ${n.projectName}`,document.querySelector("header h1").textContent=`Kanban · ${n.projectName}`)}catch{}}function ke(e){C=e,localStorage.setItem(Xe,C);const n=document.getElementById("board"),t=document.getElementById("list-view"),a=document.getElementById("chronicle-view"),o=document.getElementById("graph-view");e!=="graph"&&(Q&&(Q.disconnect(),Q=null),re&&(re.pauseAnimation(),re=null)),n.classList.add("hidden"),t.classList.add("hidden"),a.classList.add("hidden"),o.classList.add("hidden"),document.getElementById("tab-board").classList.remove("active"),document.getElementById("tab-list").classList.remove("active"),document.getElementById("tab-chronicle").classList.remove("active"),document.getElementById("tab-graph").classList.remove("active"),e==="board"?(n.classList.remove("hidden"),document.getElementById("tab-board").classList.add("active"),Te()):e==="list"?(t.classList.remove("hidden"),document.getElementById("tab-list").classList.add("active"),Fe()):e==="chronicle"?(a.classList.remove("hidden"),document.getElementById("tab-chronicle").classList.add("active"),Pt()):(o.classList.remove("hidden"),document.getElementById("tab-graph").classList.add("active"),We())}function k(){C==="board"?Te():C==="list"?Fe():C==="chronicle"?Pt():We()}document.getElementById("sort-select").value=ee;N&&document.getElementById("hide-done-btn").classList.add("active");je();et();document.getElementById("auth-btn").addEventListener("click",()=>{if(V&&A){ce("Shared token is stored on this device. Use Forget Token to reset it.","success");return}ce(V?"Enter the shared access token to load the board.":"This environment does not require a shared token.")});document.getElementById("auth-close").addEventListener("click",()=>{V&&!A||_e()});document.getElementById("auth-clear-btn").addEventListener("click",async()=>{await on(),V?ce("Stored token cleared. Enter a shared access token to continue."):(_e(),pe("Stored token cleared."))});document.getElementById("auth-form").addEventListener("submit",async e=>{e.preventDefault();const t=document.getElementById("auth-token-input").value.trim();if(!t){pe("Enter the shared access token.","error");return}pe("Unlocking board...","default");try{await Tt(t),pe("Board unlocked.","success"),await qt(),At(),k()}catch(a){pe(a instanceof Error?a.message:"Board authentication failed.","error")}});document.getElementById("tab-board").addEventListener("click",()=>ke("board"));document.getElementById("tab-list").addEventListener("click",()=>ke("list"));document.getElementById("tab-chronicle").addEventListener("click",()=>ke("chronicle"));document.getElementById("tab-graph").addEventListener("click",()=>ke("graph"));document.getElementById("toolbar-mobile-toggle").addEventListener("click",()=>{Le=!Le,et()});St.addEventListener("change",e=>{tn(e.matches)});document.addEventListener("visibilitychange",()=>{document.visibilityState!=="visible"||!A||(at(),k())});function Ot(){if(Ze)return;Ze=!0;const e=new EventSource("/api/events");e.onmessage=()=>{if(He)return;const n=!document.getElementById("modal-overlay").classList.contains("hidden"),t=!document.getElementById("add-card-overlay").classList.contains("hidden");!n&&!t&&k()},e.onerror=()=>{e.close(),Ze=!1,(!V||A)&&setTimeout(Ot,5e3)}}document.getElementById("refresh-btn").addEventListener("click",k);document.getElementById("search-input").addEventListener("input",e=>{if(ue=e.target.value.trim(),C==="board"){Te();return}if(C==="graph"){We();return}ze()});document.getElementById("sort-select").addEventListener("change",e=>{ee=e.target.value,localStorage.setItem("kanban-sort",ee),k()});document.getElementById("hide-done-btn").addEventListener("click",()=>{if(N=!N,localStorage.setItem("kanban-hide-old",String(N)),document.getElementById("hide-done-btn").classList.toggle("active",N),C==="graph"){We();return}ze()});document.getElementById("modal-close").addEventListener("click",()=>{document.getElementById("modal-overlay").classList.add("hidden"),J(),k()});document.getElementById("modal-overlay").addEventListener("click",e=>{e.target===e.currentTarget&&(document.getElementById("modal-overlay").classList.add("hidden"),J(),k())});document.addEventListener("keydown",e=>{if(e.key==="Escape"){const n=!document.getElementById("modal-overlay").classList.contains("hidden");document.getElementById("modal-overlay").classList.add("hidden"),document.getElementById("add-card-overlay").classList.add("hidden"),!document.getElementById("auth-overlay").classList.contains("hidden")&&A&&_e(),J(),n&&k()}});const Se=document.getElementById("add-card-overlay");let K=[];function Re(){const e=document.getElementById("add-attachment-preview");if(K.length===0){e.innerHTML="";return}e.innerHTML=K.map((n,t)=>`
    <div class="attachment-thumb">
      <img src="${URL.createObjectURL(n)}" alt="${n.name}" />
      <button class="attachment-remove" data-idx="${t}" title="Remove" type="button">&times;</button>
      <span class="attachment-name">${n.name}</span>
    </div>
  `).join(""),e.querySelectorAll(".attachment-remove").forEach(n=>{n.addEventListener("click",t=>{t.stopPropagation();const a=parseInt(n.dataset.idx);K.splice(a,1),Re()})})}function it(e){for(const n of Array.from(e))n.type.startsWith("image/")&&K.push(n);Re()}document.getElementById("add-card-close").addEventListener("click",()=>{Se.classList.add("hidden"),K=[],Re(),J()});Se.addEventListener("click",e=>{e.target===e.currentTarget&&(Se.classList.add("hidden"),K=[],Re(),J())});const le=document.getElementById("add-attachment-zone"),ye=document.getElementById("add-attachment-input");le.addEventListener("click",()=>ye.click());le.addEventListener("dragover",e=>{e.preventDefault(),le.classList.add("drop-active")});le.addEventListener("dragleave",()=>{le.classList.remove("drop-active")});le.addEventListener("drop",e=>{var t;e.preventDefault(),le.classList.remove("drop-active");const n=(t=e.dataTransfer)==null?void 0:t.files;n&&it(n)});ye.addEventListener("change",()=>{ye.files&&it(ye.files),ye.value=""});Se.addEventListener("paste",e=>{var t;const n=Array.from(((t=e.clipboardData)==null?void 0:t.files)??[]).filter(a=>a.type.startsWith("image/"));n.length!==0&&(e.preventDefault(),it(n))});document.getElementById("add-card-form").addEventListener("submit",async e=>{e.preventDefault();const n=document.getElementById("add-title").value.trim();if(!n)return;const t=document.getElementById("add-priority").value,a=parseInt(document.getElementById("add-level").value)||3,o=document.getElementById("add-description").value.trim()||null,r=document.getElementById("add-tags").value.trim(),d=r?r.split(",").map(h=>h.trim()).filter(Boolean):null,c=E;if(!c){Ae("Select a project first");return}const s=document.querySelector("#add-card-form .form-submit");s.textContent=K.length>0?"Creating...":"Add Card",s.disabled=!0;const u=await(await _("/api/task",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({title:n,priority:t,level:a,description:o,tags:d,project:c})})).json();K.length>0&&u.id&&await Oe(u.id,K,c),K=[],s.textContent="Add Card",s.disabled=!1,document.getElementById("add-card-form").reset(),Re(),Se.classList.add("hidden"),J(),z(c),k()});pn().then(async e=>{e&&(await qt(),ke(C),At())}).catch(()=>{ce("Unable to initialize board authentication.","error")});Zt();
