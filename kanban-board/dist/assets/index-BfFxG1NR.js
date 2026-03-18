import vt from"https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs";(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const o of document.querySelectorAll('link[rel="modulepreload"]'))s(o);new MutationObserver(o=>{for(const i of o)if(i.type==="childList")for(const d of i.addedNodes)d.tagName==="LINK"&&d.rel==="modulepreload"&&s(d)}).observe(document,{childList:!0,subtree:!0});function n(o){const i={};return o.integrity&&(i.integrity=o.integrity),o.referrerPolicy&&(i.referrerPolicy=o.referrerPolicy),o.crossOrigin==="use-credentials"?i.credentials="include":o.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function s(o){if(o.ep)return;o.ep=!0;const i=n(o);fetch(o.href,i)}})();vt.initialize({startOnLoad:!1,theme:"dark",themeVariables:{primaryColor:"#334155",primaryBorderColor:"#60a5fa",primaryTextColor:"#f1f5f9",lineColor:"#64748b",secondaryColor:"#1e293b",tertiaryColor:"#0f172a"}});window.__mermaid=vt;const Ot="modulepreload",Mt=function(e){return"/"+e},dt={},Dt=function(t,n,s){let o=Promise.resolve();if(n&&n.length>0){let d=function(r){return Promise.all(r.map(p=>Promise.resolve(p).then(h=>({status:"fulfilled",value:h}),h=>({status:"rejected",reason:h}))))};document.getElementsByTagName("link");const l=document.querySelector("meta[property=csp-nonce]"),a=(l==null?void 0:l.nonce)||(l==null?void 0:l.getAttribute("nonce"));o=d(n.map(r=>{if(r=Mt(r),r in dt)return;dt[r]=!0;const p=r.endsWith(".css"),h=p?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${r}"]${h}`))return;const u=document.createElement("link");if(u.rel=p?"stylesheet":Ot,p||(u.as="script"),u.crossOrigin="",u.href=r,a&&u.setAttribute("nonce",a),document.head.appendChild(u),p)return new Promise((g,f)=>{u.addEventListener("load",g),u.addEventListener("error",()=>f(new Error(`Unable to preload CSS for ${r}`)))})}))}function i(d){const l=new Event("vite:preloadError",{cancelable:!0});if(l.payload=d,window.dispatchEvent(l),!l.defaultPrevented)throw d}return o.then(d=>{for(const l of d||[])l.status==="rejected"&&i(l.reason);return t().catch(i)})},J=[{key:"todo",label:"Requirements",icon:"📋"},{key:"plan",label:"Plan",icon:"🗺️"},{key:"plan_review",label:"Review Plan",icon:"🔍"},{key:"impl",label:"Implement",icon:"🔨"},{key:"impl_review",label:"Review Impl",icon:"📝"},{key:"test",label:"Test",icon:"🧪"},{key:"done",label:"Done",icon:"✅"}],Ut={plan:"Planning",plan_review:"Plan Review",impl:"Implementing",impl_review:"Impl Review",test:"Testing"},xe="kanban-auth-token",Ke="kanban-current-view",yt="kanban-mobile-board-columns",Ht=3e4,Nt=10,Ft=10,bt="kanban-summary-cache",Vt={board:3e4,full:6e4},$t=window.matchMedia("(max-width: 768px)");function zt(){!("serviceWorker"in navigator)||!(window.location.protocol==="https:"||window.location.hostname==="localhost"||window.location.hostname==="127.0.0.1")||window.addEventListener("load",()=>{navigator.serviceWorker.register("/sw.js").catch(t=>{console.warn("Service worker registration failed",t)})})}function Wt(e){return e==="board"||e==="list"||e==="chronicle"||e==="graph"}function Kt(e){return J.some(t=>t.key===e)}function Jt(){try{const e=localStorage.getItem(yt);if(!e)return new Set;const t=JSON.parse(e);return Array.isArray(t)?new Set(t.filter(n=>typeof n=="string"&&Kt(n))):new Set}catch{return new Set}}let _=localStorage.getItem("kanban-project"),Pe=!1,B=$t.matches,S=Wt(localStorage.getItem(Ke))?localStorage.getItem(Ke):B?"list":"board",re="",Z=localStorage.getItem("kanban-sort")||"default",M=localStorage.getItem("kanban-hide-old")==="true",D=localStorage.getItem(xe)||"",U=!1,T=!1,We=!1,ve=!B,X=Jt(),k=null,he=null,te=null;const fe=new Map,oe=new Map,ge=new Map;let G=null,ne=null;function ie(e,t="default"){const n=document.getElementById("auth-message");n.textContent=e,n.classList.remove("error","success"),t!=="default"&&n.classList.add(t)}function W(){const t=[document.getElementById("modal-overlay"),document.getElementById("add-card-overlay"),document.getElementById("auth-overlay")].some(n=>n&&!n.classList.contains("hidden"));document.body.classList.toggle("overlay-open",t)}function $e(){const e=document.getElementById("auth-btn");if(e){if(!U){e.textContent="Open",e.title="Board access is open in this environment";return}e.textContent=T?"Private":"Locked",e.title=T?"Shared token configured for this browser":"Shared token required"}}function ae(e="Enter the shared access token to load the board.",t="default"){T=!1,document.getElementById("auth-overlay").classList.remove("hidden"),W();const n=document.getElementById("auth-token-input");n.value=D,ie(e,t),$e(),setTimeout(()=>n.focus(),0)}function we(){document.getElementById("auth-overlay").classList.add("hidden"),W(),$e()}function wt(e){D=e.trim(),D?localStorage.setItem(xe,D):localStorage.removeItem(xe)}function Ye(){document.body.classList.toggle("mobile-shell",B),document.body.classList.toggle("mobile-toolbar-open",!B||ve);const e=document.getElementById("toolbar-mobile-toggle");if(e){const t=!B||ve;e.hidden=!B,e.setAttribute("aria-expanded",String(t)),e.textContent=t?"Hide Filters":"Show Filters"}}function Yt(e){B=e,B||(ve=!0),Ye(),T&&S==="board"&&R()}function Et(){return window.location.hostname==="localhost"||window.location.hostname==="127.0.0.1"}function Ge(){he!==null&&(window.clearInterval(he),he=null)}function Ze(e=_,t="full"){return`${e||"__all__"}::${t}`}function qe(e=_,t="full"){return`${bt}::${Ze(e,t)}`}function Gt(e=_,t="full"){try{const n=localStorage.getItem(qe(e,t));if(!n)return null;const s=JSON.parse(n);return!s||typeof s.fetchedAt!="number"||!s.board?null:Date.now()-s.fetchedAt>Vt[t]?(localStorage.removeItem(qe(e,t)),null):s}catch{return null}}function Zt(e,t,n,s){try{const o={fetchedAt:Date.now(),etag:s,board:n};localStorage.setItem(qe(e,t),JSON.stringify(o))}catch{}}function F(e=_,t){const n=t?[t]:["board","full"];for(const s of n){const o=Ze(e,s);fe.delete(o),oe.delete(o),ge.delete(o);try{localStorage.removeItem(qe(e,s))}catch{}}e===_&&(k=null,te=null)}function Xe(e={}){if(fe.clear(),oe.clear(),ge.clear(),k=null,te=null,e.persisted)try{const t=[];for(let n=0;n<localStorage.length;n+=1){const s=localStorage.key(n);s!=null&&s.startsWith(`${bt}::`)&&t.push(s)}t.forEach(n=>localStorage.removeItem(n))}catch{}}function Lt(){D="",localStorage.removeItem(xe);const e=document.getElementById("auth-token-input");e&&(e.value="")}async function Xt(){const e=new Headers;D&&e.set("X-Kanban-Auth",D);const n=await(await fetch("/api/auth/session",{method:"GET",headers:e,credentials:"same-origin"})).json().catch(()=>({}));return{authenticated:!!n.authenticated,authRequired:!!n.authRequired,mode:n.mode,source:n.source??null,reason:n.reason??null,error:n.error??null}}async function It(e){const t=e.trim(),n=await fetch("/api/auth/session",{method:"POST",headers:{"X-Kanban-Auth":t},credentials:"same-origin"}),s=await n.json().catch(()=>({}));if(!n.ok){const o=s.reason==="invalid_token"?"Shared token is invalid.":s.reason==="token_hash_missing"?"Server auth is not configured yet.":"Board authentication failed.";throw new Error(o)}wt(t),U=!!s.authRequired,T=!0,we(),$e()}async function Qt(){await fetch("/api/auth/session",{method:"DELETE",credentials:"same-origin"}).catch(()=>{}),Ge(),Xe({persisted:!0}),Lt(),T=!U,$e()}async function A(e,t={},n=!1){const s=new Headers(t.headers||{});D&&!s.has("X-Kanban-Auth")&&s.set("X-Kanban-Auth",D);const o=await fetch(e,{...t,headers:s,credentials:"same-origin"});if((o.status===401||o.status===403||o.status===503)&&!n){const i=await o.clone().json().catch(()=>({}));U=!0,T=!1,i.reason==="invalid_token"&&Lt();const d=i.reason==="invalid_token"?"Stored token was rejected. Enter a valid shared token.":i.reason==="token_hash_missing"?"Server auth hash is not configured yet.":"Shared token is required for this board.";throw ae(d,"error"),new Error(i.error||d)}return o}async function Qe(e=_){const t=e?`?project=${encodeURIComponent(e)}`:"",n=new Headers;te&&n.set("If-None-Match",te);const s=await A(`/api/board/version${t}`,{headers:n});return s.status===304?k?null:(te=null,Qe()):(te=s.headers.get("ETag"),s.json())}function en(e){return e==="board"?S==="board"&&!Je():S==="list"||S==="chronicle"||S==="board"&&Je()}function Je(){return re.trim().length>0}function tn(e,t,n,s){if(!T||ge.has(t))return;const o=(async()=>{try{const i=await Qe(s);if(!i)return;if(n&&i.version===n){k=i.version;return}F(s,e),await le(e,{bypassTtl:!0,projectOverride:s}),_===s&&en(e)&&R()}catch{}finally{ge.delete(t)}})();ge.set(t,o)}async function le(e="full",t={}){const n=t.projectOverride===void 0?_:t.projectOverride,s=["summary=true"];n&&s.unshift(`project=${encodeURIComponent(n)}`),e==="board"&&s.push("compact=board",`todo_limit=${Nt}`,`done_limit=${Ft}`);const o=`?${s.join("&")}`,i=Ze(n,e);if(!t.bypassTtl){const h=Gt(n,e);if(h)return fe.set(i,h.board),h.etag&&oe.set(i,h.etag),k=h.board.version||k,tn(e,i,h.board.version||null,n),h.board}const d=new Headers,l=oe.get(i);l&&d.set("If-None-Match",l);const a=await A(`/api/board${o}`,{headers:d});if(a.status===304){const h=fe.get(i);return h?(k=h.version||k,h):(oe.delete(i),le(e,{bypassTtl:!0}))}const r=await a.json(),p=a.headers.get("ETag");return p&&oe.set(i,p),fe.set(i,r),Zt(n,e,r,p),k=r.version||k,r}function nn(){Et()||he!==null||(he=window.setInterval(async()=>{if(!T||Pe)return;const e=!document.getElementById("modal-overlay").classList.contains("hidden"),t=!document.getElementById("add-card-overlay").classList.contains("hidden");if(!(e||t))try{const n=await Qe();if(!n)return;if(!k){k=n.version;return}n.version!==k&&(k=n.version,R())}catch{U&&!T&&Ge()}},Ht))}function Ct(){if(Et()){Ge(),At();return}nn()}function an(){const e=new URL(window.location.href),t=e.searchParams.get("auth")||e.searchParams.get("token");t&&(wt(t),e.searchParams.delete("auth"),e.searchParams.delete("token"),window.history.replaceState({},"",e.toString()))}async function sn(){if(an(),D)try{return await It(D),!0}catch(t){return ae(t instanceof Error?t.message:"Board authentication failed.","error"),!1}const e=await Xt();return U=e.authRequired,T=e.authenticated||!e.authRequired,e.authRequired&&!e.authenticated?(ae("Enter the shared access token to load the board."),!1):(we(),!0)}function De(e){return e==="high"?"high":e==="medium"?"medium":e==="low"?"low":""}function St(){localStorage.setItem(yt,JSON.stringify([...X]))}function on(e){if(!B||X.size>0)return;const t=J.filter(n=>n.key==="todo"||n.key==="impl"||n.key!=="done"&&e[n.key].length>0).map(n=>n.key);X=new Set(t.length>0?t:["todo"]),St()}function rn(e){return!B||re.trim()?!0:X.has(e)}function Oe(e){var t;return((t=J.find(n=>n.key===e))==null?void 0:t.label)||e}function ln(e,t){return e===1?{todo:["impl"],impl:["done"],done:[]}[t]||[]:e===2?{todo:["plan"],plan:["impl","todo"],impl:["impl_review"],impl_review:["done","impl"],done:[]}[t]||[]:{todo:["plan"],plan:["plan_review","todo"],plan_review:["impl","plan"],impl:["impl_review"],impl_review:["test","impl"],test:["done","impl"],done:[]}[t]||[]}async function cn(e,t){if(!t||t===e.status)return;const n=await A(`/api/task/${e.id}?project=${encodeURIComponent(e.project)}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({status:t})});if(!n.ok){const s=await n.json().catch(()=>({}));Ie(s.error||"Failed to move task");return}F(e.project),Le()}function ue(e){return e?Date.now()-new Date(e).getTime()>4320*60*1e3:!1}function jt(e,t){return Z==="default"?t==="done"?[...e].sort((n,s)=>{const o=(s.completed_at||"").localeCompare(n.completed_at||"");return o!==0?o:n.rank-s.rank||n.id-s.id}):[...e].sort((n,s)=>s.rank-n.rank||s.id-n.id):[...e].sort((n,s)=>Z==="created_asc"?n.created_at.localeCompare(s.created_at):Z==="created_desc"?s.created_at.localeCompare(n.created_at):Z==="completed_desc"?(s.completed_at||"").localeCompare(n.completed_at||""):0)}function Ue(){const e=re.toLowerCase().replace(/^#/,""),t=e.length>0||M;document.body.classList.toggle("mobile-board-search",S==="board"&&B&&e.length>0),S==="board"?(document.querySelectorAll(".card").forEach(n=>{const s=!e||(()=>{var r,p,h,u;const i=n.dataset.id||"",d=((p=(r=n.querySelector(".card-title"))==null?void 0:r.textContent)==null?void 0:p.toLowerCase())||"",l=((u=(h=n.querySelector(".card-desc"))==null?void 0:h.textContent)==null?void 0:u.toLowerCase())||"",a=[...n.querySelectorAll(".tag")].map(g=>{var f;return((f=g.textContent)==null?void 0:f.toLowerCase())||""}).join(" ");return i===e||d.includes(e)||l.includes(e)||a.includes(e)})(),o=M&&n.dataset.status==="done"&&ue(n.dataset.completedAt||"");n.style.display=s&&!o?"":"none"}),document.querySelectorAll(".column").forEach(n=>{const s=n.querySelectorAll(".card"),o=[...s].filter(a=>a.style.display!=="none").length,i=s.length,d=Number.parseInt(n.dataset.totalCount||`${i}`,10)||i,l=n.querySelector(".count");l&&(l.textContent=t||d!==i?`${o}/${d}`:`${d}`)})):S==="list"?(document.querySelectorAll("#list-view tbody tr").forEach(n=>{const s=!e||(()=>{var r,p,h,u;const i=n.dataset.id||"",d=((p=(r=n.querySelector(".col-title"))==null?void 0:r.textContent)==null?void 0:p.toLowerCase())||"",l=((u=(h=n.cells[5])==null?void 0:h.textContent)==null?void 0:u.toLowerCase())||"",a=[...n.querySelectorAll(".tag")].map(g=>{var f;return((f=g.textContent)==null?void 0:f.toLowerCase())||""}).join(" ");return i===e||d.includes(e)||l.includes(e)||a.includes(e)})(),o=M&&n.classList.contains("status-done")&&ue(n.dataset.completedAt||"");n.style.display=s&&!o?"":"none"}),document.querySelectorAll("#list-view .list-card").forEach(n=>{const s=!e||(()=>{var r,p,h;const i=n.dataset.id||"",d=((p=(r=n.querySelector(".list-card-title"))==null?void 0:r.textContent)==null?void 0:p.toLowerCase())||"",l=((h=n.dataset.project)==null?void 0:h.toLowerCase())||"",a=[...n.querySelectorAll(".tag")].map(u=>{var g;return((g=u.textContent)==null?void 0:g.toLowerCase())||""}).join(" ");return i===e||d.includes(e)||l.includes(e)||a.includes(e)})(),o=M&&n.classList.contains("status-done")&&ue(n.dataset.completedAt||"");n.style.display=s&&!o?"":"none"})):(document.querySelectorAll("#chronicle-view .chronicle-event").forEach(n=>{const s=!e||(()=>{var a,r,p;const i=n.dataset.id||"",d=((r=(a=n.querySelector(".chronicle-task-link"))==null?void 0:a.textContent)==null?void 0:r.toLowerCase())||"",l=((p=n.dataset.project)==null?void 0:p.toLowerCase())||"";return i===e||d.includes(e)||l.includes(e)})(),o=M&&ue(n.dataset.completedAt||"");n.style.display=s&&!o?"":"none"}),document.querySelectorAll("#chronicle-view .chronicle-group").forEach(n=>{const s=[...n.querySelectorAll(".chronicle-event")].filter(o=>o.style.display!=="none").length;n.style.display=s>0?"":"none"}))}function Ee(e){if(!e||e==="null")return[];try{const t=JSON.parse(e);return Array.isArray(t)?t:[]}catch{return[]}}function dn(e){const t=new Date(e+"Z"),s=new Date().getTime()-t.getTime(),o=Math.floor(s/864e5);return o===0?"today":o===1?"yesterday":o<7?`${o}d ago`:o<30?`${Math.floor(o/7)}w ago`:e.slice(0,10)}function K(e){if(!e||e==="null")return[];try{const t=JSON.parse(e);return Array.isArray(t)?t:[]}catch{return[]}}function pn(e){var c,m;const t=De(e.priority),n=t?`<span class="badge ${t}">${e.priority}</span>`:"",s=e.completed_at?`<span class="badge date">${e.completed_at.slice(0,10)}</span>`:e.created_at?`<span class="badge created">${dn(e.created_at)}</span>`:"",o=!_&&e.project?`<span class="badge project">${e.project}</span>`:"",i=Ut[e.status],d=i?`<span class="badge status-${e.status}">${i}</span>`:"",l=`<span class="badge level-${e.level}">L${e.level}</span>`,a=e.current_agent?`<span class="badge agent-tag">${e.current_agent}</span>`:"",r=e.last_review_status?[]:K(e.review_comments),p=e.last_review_status||(r.length>0?(c=r[r.length-1])==null?void 0:c.status:null),h=p?`<span class="badge ${p==="approved"?"review-approved":"review-changes"}">${p==="approved"?"Approved":"Changes Req."}</span>`:e.status==="impl_review"?'<span class="badge review-pending">Awaiting Review</span>':"",u=e.last_plan_review_status?[]:K(e.plan_review_comments),g=e.last_plan_review_status||(u.length>0?(m=u[u.length-1])==null?void 0:m.status:null),f=g?`<span class="badge ${g==="approved"?"review-approved":"review-changes"}">${g==="approved"?"Plan OK":"Plan Changes"}</span>`:e.status==="plan_review"?'<span class="badge review-pending">Plan Review</span>':"",$=Ee(e.tags).map(y=>`<span class="tag">${y}</span>`).join(""),b=e.note_count??K(e.notes).length,I=b>0?`<span class="badge notes-count" title="${b} note(s)">💬 ${b}</span>`:"",E=ln(e.level,e.status).map(y=>`<option value="${y}">${Oe(y)}</option>`).join(""),H=E?`
      <label class="mobile-card-move card-interactive">
        <span>Move</span>
        <select class="mobile-status-select" data-id="${e.id}" data-project="${e.project}" data-current-status="${e.status}">
          <option value="${e.status}">${Oe(e.status)}</option>
          ${E}
        </select>
      </label>
    `:"";return`
    <div class="${B?"card mobile-card":"card"}" ${B?'draggable="false"':'draggable="true"'} data-id="${e.id}" data-status="${e.status}" data-project="${e.project}" data-completed-at="${e.completed_at||""}">
      <div class="card-header">
        <span class="card-id">#${e.id}</span>
        ${l}
        ${n}
        ${d}
        ${a}
        <button class="card-copy-btn" data-copy="#${e.id} ${e.title}" title="Copy to clipboard">⎘</button>
      </div>
      <div class="card-title">${e.title}</div>
      <div class="card-footer">
        ${o}
        ${f}
        ${h}
        ${I}
        ${s}
      </div>
      ${H}
      ${$?`<div class="card-tags">${$}</div>`:""}
    </div>
  `}function un(e,t,n,s,o=s.length){const i=rn(e),d=jt(s,e).map(pn).join(""),l=e==="todo"?'<button class="add-card-btn" id="add-card-btn" title="Add card">+</button>':"",a=o!==s.length?`${s.length}/${o}`:`${o}`;return`
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
          ${l}
        </div>
      </div>
      <div class="column-body" data-column="${e}">
        ${d||'<div class="empty">No items</div>'}
      </div>
    </div>
  `}const mn=/```[\s\S]*?```/g,hn=/```\w*\n?/,pt=/```$/,ut=/^```mermaid\s*\n?/,fn=/\*\*(.+?)\*\*/g,gn=/`([^`]+)`/g,vn=/^\x00CB(\d+)\x00$/,yn=/^### (.+)$/,bn=/^## (.+)$/,$n=/^# (.+)$/,wn=/^[-*]\s+(.+)$/,En=/^\d+\.\s+(.+)$/,mt=/^\|(.+)\|$/,ht=/^\|[\s:-]+\|$/;let Ln=0;function ye(e){const t=[];let n=e.replace(mn,r=>{if(ut.test(r)){const p=r.replace(ut,"").replace(pt,"").trim(),h=`mermaid-${++Ln}`;t.push(`<pre class="mermaid" id="${h}">${p}</pre>`)}else{const p=r.replace(hn,"").replace(pt,"");t.push(`<pre><code>${p}</code></pre>`)}return`\0CB${t.length-1}\0`});n=n.replace(/</g,"&lt;"),n=n.replace(fn,"<strong>$1</strong>").replace(gn,"<code>$1</code>");const s=n.split(`
`),o=[];let i=!1,d=!1;function l(){i&&(o.push("</ul>"),i=!1),d&&(o.push("</ol>"),d=!1)}let a=0;for(;a<s.length;){const r=s[a].trim(),p=r.match(vn);if(p){l(),o.push(t[parseInt(p[1])]),a++;continue}if(mt.test(r)){l();const b=[];for(;a<s.length&&mt.test(s[a].trim());)b.push(s[a].trim()),a++;if(b.length>=2){const I=ht.test(b[1]),E=I?b[0]:null,H=I?2:0;let N='<table class="md-table">';if(E){const O=E.slice(1,-1).split("|").map(c=>c.trim());N+="<thead><tr>"+O.map(c=>`<th>${c}</th>`).join("")+"</tr></thead>"}N+="<tbody>";for(let O=H;O<b.length;O++){if(ht.test(b[O]))continue;const c=b[O].slice(1,-1).split("|").map(m=>m.trim());N+="<tr>"+c.map(m=>`<td>${m}</td>`).join("")+"</tr>"}N+="</tbody></table>",o.push(N)}else o.push(`<p>${b[0]}</p>`);continue}const h=r.match(yn);if(h){l(),o.push(`<h3>${h[1]}</h3>`),a++;continue}const u=r.match(bn);if(u){l(),o.push(`<h2>${u[1]}</h2>`),a++;continue}const g=r.match($n);if(g){l(),o.push(`<h1>${g[1]}</h1>`),a++;continue}const f=r.match(wn);if(f){d&&(o.push("</ol>"),d=!1),i||(o.push("<ul>"),i=!0),o.push(`<li>${f[1]}</li>`),a++;continue}const $=r.match(En);if($){i&&(o.push("</ul>"),i=!1),d||(o.push("<ol>"),d=!0),o.push(`<li>${$[1]}</li>`),a++;continue}l(),r===""?o.push(""):o.push(`<p>${r}</p>`),a++}return l(),o.join(`
`)}async function In(e){const t=window.__mermaid;if(!t)return;const n=e.querySelectorAll("pre.mermaid");if(n.length!==0)try{await t.run({nodes:n})}catch(s){console.warn("Mermaid render failed:",s)}}function Ae(e,t,n,s,o){if(!s&&!o)return"";const i=s?ye(s):'<span class="phase-empty">Not yet documented</span>';return`
    <div class="lifecycle-phase ${n} ${o?"active":""}">
      <div class="phase-header">
        <span class="phase-icon">${t}</span>
        <span class="phase-label">${e}</span>
        <button class="phase-expand-btn" title="Expand to full screen">&#x26F6;</button>
      </div>
      <div class="phase-body">${i}</div>
    </div>
  `}function ft(e){return e.length===0?"":e.map(t=>{var n;return`
    <div class="review-entry ${t.status}">
      <div class="review-header">
        <span class="badge ${t.status==="approved"?"review-approved":"review-changes"}">
          ${t.status==="approved"?"Approved":"Changes Requested"}
        </span>
        <span class="review-meta">${t.reviewer||""} &middot; ${((n=t.timestamp)==null?void 0:n.slice(0,16))||""}</span>
      </div>
      <div class="review-comment">${ye(t.comment||"")}</div>
    </div>
  `}).join("")}function Cn(e){return e.length===0?"":e.map(t=>{var n;return`
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
      ${t.comment?`<div class="review-comment">${ye(t.comment)}</div>`:""}
    </div>
  `}).join("")}async function Sn(e,t=1920,n=.82){return new Promise((s,o)=>{const i=new Image,d=URL.createObjectURL(e);i.onload=()=>{URL.revokeObjectURL(d);let{width:l,height:a}=i;(l>t||a>t)&&(l>a?(a=Math.round(a*t/l),l=t):(l=Math.round(l*t/a),a=t));const r=document.createElement("canvas");r.width=l,r.height=a,r.getContext("2d").drawImage(i,0,0,l,a),s(r.toDataURL("image/jpeg",n))},i.onerror=()=>{URL.revokeObjectURL(d),o(new Error("Image load failed"))},i.src=d})}async function ke(e,t,n){var s,o;for(const i of Array.from(t)){if(!i.type.startsWith("image/"))continue;let d;try{d=await Sn(i)}catch{d=await new Promise(p=>{const h=new FileReader;h.onload=()=>p(h.result),h.readAsDataURL(i)})}const l=(o=(s=i.name.match(/\.[^.]+$/))==null?void 0:s[0])==null?void 0:o.toLowerCase(),a=l===".jpg"||l===".jpeg"||l===".png"||l===".webp"||l===".gif"||l===".svg"?i.name:i.name.replace(/\.[^.]+$/,"")+".jpg",r=await A(`/api/task/${e}/attachment?project=${encodeURIComponent(n)}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({filename:a,data:d})});if(!r.ok){const p=await r.json().catch(()=>({}));Ie(p.error||`Upload failed (${r.status})`);return}}V(e,n)}async function V(e,t){var i;const n=document.getElementById("modal-overlay"),s=document.getElementById("modal-content");s.innerHTML='<div style="color:#94a3b8">Loading...</div>',n.classList.remove("hidden"),W();try{const d=t?`?project=${encodeURIComponent(t)}`:"",a=await(await A(`/api/task/${e}${d}`)).json(),r=document.querySelector(`.card[data-id="${a.id}"][data-project="${CSS.escape(a.project)}"]`);r&&r.dataset.status!==a.status&&(Xe(),R());const p=Ee(a.tags),h=p.length?`<div class="modal-tags">${p.map(v=>`<span class="tag">${v}</span>`).join("")}</div>`:"",u=[`<strong>Project:</strong> ${a.project}`,`<strong>Status:</strong> ${a.status}`,`<strong>Priority:</strong> ${a.priority}`,`<strong>Created:</strong> ${((i=a.created_at)==null?void 0:i.slice(0,10))||"-"}`,a.started_at?`<strong>Started:</strong> ${a.started_at.slice(0,10)}`:"",a.planned_at?`<strong>Planned:</strong> ${a.planned_at.slice(0,10)}`:"",a.reviewed_at?`<strong>Reviewed:</strong> ${a.reviewed_at.slice(0,10)}`:"",a.tested_at?`<strong>Tested:</strong> ${a.tested_at.slice(0,10)}`:"",a.completed_at?`<strong>Completed:</strong> ${a.completed_at.slice(0,10)}`:""].filter(Boolean).join(" &nbsp;|&nbsp; "),g={1:{labels:["Req","Impl","Done"],statuses:["todo","impl","done"]},2:{labels:["Req","Plan","Impl","Review","Done"],statuses:["todo","plan","impl","impl_review","done"]},3:{labels:["Req","Plan","Plan Rev","Impl","Impl Rev","Test","Done"],statuses:["todo","plan","plan_review","impl","impl_review","test","done"]}},f=g[a.level]||g[3],$=Math.max(0,f.statuses.indexOf(a.status)),b=`
      <div class="lifecycle-progress">
        <span class="level-indicator">L${a.level}</span>
        ${f.labels.map((v,w)=>`
          <div class="progress-step ${w<$?"completed":""} ${w===$?"current":""}">
            <div class="step-dot"></div>
            <span class="step-label">${v}</span>
          </div>
        `).join('<div class="progress-line"></div>')}
      </div>
    `,I=K(a.attachments),E=I.length>0?`<div class="attachments-grid">${I.map(v=>`<div class="attachment-thumb" data-stored="${v.storedName}">
            <img src="${v.url}" alt="${v.filename}" loading="lazy" />
            <button class="attachment-remove" data-id="${e}" data-name="${v.storedName}" title="Remove">&times;</button>
            <span class="attachment-name">${v.filename}</span>
          </div>`).join("")}</div>`:"",H=a.description?ye(a.description):'<span class="phase-empty">Not yet documented</span>',N=[1,2,3].map(v=>`<option value="${v}" ${v===a.level?"selected":""}>L${v}</option>`).join(""),O=`
      <div class="lifecycle-phase phase-requirement ${$===0?"active":""}">
        <div class="phase-header">
          <span class="phase-icon">📋</span>
          <span class="phase-label">Requirements</span>
          <select class="level-select" id="level-select" title="Pipeline Level">${N}</select>
          <button class="phase-edit-btn" id="req-edit-btn" title="Edit">&#9998;</button>
          <button class="phase-expand-btn" title="Expand to full screen">&#x26F6;</button>
        </div>
        <div class="phase-body" id="req-body-view">
          ${H}
          ${E}
        </div>
        <div class="phase-body hidden" id="req-body-edit">
          <textarea id="req-textarea" rows="8">${(a.description||"").replace(/</g,"&lt;")}</textarea>
          <div class="attachment-drop-zone" id="attachment-drop-zone">
            <span>📎 Drop images, paste (⌘V), or click to attach</span>
            <input type="file" id="attachment-input" accept="image/*" multiple hidden />
          </div>
          ${E?`<div id="edit-attachments">${E}</div>`:""}
          <div class="phase-edit-actions">
            <button class="phase-save-btn" id="req-save-btn">Save</button>
            <button class="phase-cancel-btn" id="req-cancel-btn">Cancel</button>
          </div>
        </div>
      </div>
    `,c=Ae("Plan","🗺️","phase-plan",a.plan,$===1&&!a.plan);let m="";a.decision_log&&(m=Ae("Decision Log","🧭","phase-decision-log",a.decision_log,!1));let y="";a.done_when&&(y=Ae("Done When","🎯","phase-done-when",a.done_when,!1));const L=K(a.plan_review_comments),x=ft(L);let P="";(x||$===2)&&(P=`
        <div class="lifecycle-phase phase-plan-review ${$===2?"active":""}">
          <div class="phase-header">
            <span class="phase-icon">🔍</span>
            <span class="phase-label">Plan Review</span>
            ${a.plan_review_count>0?`<span class="review-count">${a.plan_review_count} review(s)</span>`:""}
            <button class="phase-expand-btn" title="Expand to full screen">&#x26F6;</button>
          </div>
          <div class="phase-body">${x||'<span class="phase-empty">Awaiting plan review</span>'}</div>
        </div>
      `);const q=Ae("Implementation","🔨","phase-impl",a.implementation_notes,$===3&&!a.implementation_notes),je=K(a.review_comments),_e=ft(je);let Be="";(_e||$===4)&&(Be=`
        <div class="lifecycle-phase phase-review ${$===4?"active":""}">
          <div class="phase-header">
            <span class="phase-icon">📝</span>
            <span class="phase-label">Implementation Review</span>
            ${a.impl_review_count>0?`<span class="review-count">${a.impl_review_count} review(s)</span>`:""}
            <button class="phase-expand-btn" title="Expand to full screen">&#x26F6;</button>
          </div>
          <div class="phase-body">${_e||'<span class="phase-empty">Awaiting implementation review</span>'}</div>
        </div>
      `);const Ne=K(a.test_results),Te=Cn(Ne);let Fe="";(Te||$===5)&&(Fe=`
        <div class="lifecycle-phase phase-test ${$===5?"active":""}">
          <div class="phase-header">
            <span class="phase-icon">🧪</span>
            <span class="phase-label">Test Results</span>
            <button class="phase-expand-btn" title="Expand to full screen">&#x26F6;</button>
          </div>
          <div class="phase-body">${Te||'<span class="phase-empty">Awaiting test execution</span>'}</div>
        </div>
      `);const ce=K(a.agent_log);let nt="";if(ce.length>0){let v=function(C){if(!C)return{name:"",model:null};const pe=C.toLowerCase();for(const ze of w){const Q=pe.lastIndexOf(ze);if(Q>0){let ee=Q;for(;ee>0&&(C[ee-1]==="-"||C[ee-1]==="_");)ee--;return{name:C.slice(0,ee),model:C.slice(Q)}}}return{name:C,model:null}};var o=v;const w=["opus","sonnet","haiku","gemini","copilot","gpt"],j=ce.map(C=>{var ct;const{name:pe,model:ze}=v(C.agent||""),Q=C.model||ze,ee=Q?`<span class="badge model-tag model-${Q.toLowerCase()}">${Q}</span>`:"";return`
          <div class="agent-log-entry">
            <span class="agent-log-time">${((ct=C.timestamp)==null?void 0:ct.slice(0,16))||""}</span>
            <span class="badge agent-tag">${pe||C.agent||""}</span>
            ${ee}
            <span class="agent-log-msg">${C.message||""}</span>
          </div>
        `}).join("");nt=`
        <details class="lifecycle-phase phase-agent-log">
          <summary class="phase-header">
            <span class="phase-icon">🤖</span>
            <span class="phase-label">Agent Log</span>
            <span class="review-count">${ce.length} entries</span>
          </summary>
          <div class="phase-body agent-log-body">${j}</div>
        </details>
      `}const at=K(a.notes),kt=at.map(v=>{var w;return`
      <div class="note-entry">
        <div class="note-header">
          <span class="note-author">${v.author||"user"}</span>
          <span class="note-time">${((w=v.timestamp)==null?void 0:w.slice(0,16).replace("T"," "))||""}</span>
          <button class="note-delete" data-note-id="${v.id}" title="Delete">&times;</button>
        </div>
        <div class="note-text">${ye(v.text||"")}</div>
      </div>
    `}).join(""),Rt=`
      <div class="notes-section">
        <div class="notes-header">
          <span>Notes</span>
          <span class="notes-count">${at.length}</span>
        </div>
        <div class="notes-list">${kt}</div>
        <form class="note-form" id="note-form">
          <textarea id="note-input" rows="2" placeholder="Add a note... (supports markdown)"></textarea>
          <button type="submit" class="note-submit">Add Note</button>
        </form>
      </div>
    `;s.innerHTML=`
      <h1>#${a.id} ${a.title}</h1>
      <div class="modal-meta">${u}</div>
      ${h}
      ${b}
      <div class="lifecycle-sections">
        ${O}
        ${c}
        ${m}
        ${y}
        ${P}
        ${q}
        ${Be}
        ${Fe}
        ${nt}
      </div>
      ${Rt}
      <div class="modal-danger-zone">
        <button class="delete-task-btn" id="delete-task-btn">Delete Card</button>
      </div>
    `,In(s),s.querySelectorAll(".phase-expand-btn").forEach(v=>{v.addEventListener("click",w=>{w.stopPropagation();const j=v.closest(".lifecycle-phase");j==null||j.requestFullscreen().catch(()=>{})})});const st=document.getElementById("level-select");st.addEventListener("change",async()=>{const v=parseInt(st.value);await A(`/api/task/${e}?project=${encodeURIComponent(a.project)}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({level:v})}),F(a.project),V(e,a.project)}),document.getElementById("delete-task-btn").addEventListener("click",async()=>{confirm(`Delete card #${a.id} "${a.title}"?`)&&(await A(`/api/task/${e}?project=${encodeURIComponent(a.project)}`,{method:"DELETE"}),F(a.project),document.getElementById("modal-overlay").classList.add("hidden"),R())});const xt=document.getElementById("req-edit-btn"),ot=document.getElementById("req-body-view"),it=document.getElementById("req-body-edit"),Ve=document.getElementById("req-textarea"),rt=document.getElementById("req-save-btn"),Pt=document.getElementById("req-cancel-btn");xt.addEventListener("click",()=>{ot.classList.add("hidden"),it.classList.remove("hidden"),Ve.focus()}),Pt.addEventListener("click",()=>{Ve.value=a.description||"",it.classList.add("hidden"),ot.classList.remove("hidden")}),rt.addEventListener("click",async()=>{const v=Ve.value;rt.textContent="Saving...",await A(`/api/task/${e}?project=${encodeURIComponent(a.project)}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({description:v})}),F(a.project),V(e,a.project)});const Y=document.getElementById("attachment-drop-zone"),de=document.getElementById("attachment-input");Y&&de&&(Y.addEventListener("click",()=>de.click()),Y.addEventListener("dragover",v=>{v.preventDefault(),Y.classList.add("drop-active")}),Y.addEventListener("dragleave",()=>{Y.classList.remove("drop-active")}),Y.addEventListener("drop",async v=>{var j;v.preventDefault(),Y.classList.remove("drop-active");const w=(j=v.dataTransfer)==null?void 0:j.files;w&&await ke(e,w,a.project)}),de.addEventListener("change",async()=>{de.files&&await ke(e,de.files,a.project)})),s.addEventListener("paste",async v=>{var j;const w=Array.from(((j=v.clipboardData)==null?void 0:j.files)??[]).filter(C=>C.type.startsWith("image/"));w.length!==0&&(v.preventDefault(),await ke(e,w,a.project))}),s.querySelectorAll(".attachment-remove").forEach(v=>{v.addEventListener("click",async w=>{w.stopPropagation();const j=v,C=j.dataset.id,pe=j.dataset.name;await A(`/api/task/${C}/attachment/${encodeURIComponent(pe)}?project=${encodeURIComponent(a.project)}`,{method:"DELETE"}),V(e,a.project)})});const qt=document.getElementById("note-form"),lt=document.getElementById("note-input");qt.addEventListener("submit",async v=>{v.preventDefault();const w=lt.value.trim();w&&(lt.disabled=!0,await A(`/api/task/${e}/note?project=${encodeURIComponent(a.project)}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({text:w})}),F(a.project),V(e,a.project))}),s.querySelectorAll(".note-delete").forEach(v=>{v.addEventListener("click",async w=>{w.stopPropagation();const j=v.dataset.noteId;await A(`/api/task/${e}/note/${j}?project=${encodeURIComponent(a.project)}`,{method:"DELETE"}),F(a.project),V(e,a.project)})})}catch{s.innerHTML='<div style="color:#ef4444">Failed to load</div>'}}function _t(e){if(!e)return new Date(NaN);let t=e.replace(" ","T");return t.length===10?t+="T00:00:00Z":/Z$|[+-]\d{2}:\d{2}$/.test(t)||(t+="Z"),new Date(t)}function jn(e){const t=_t(e);if(isNaN(t.getTime()))return"Unknown";const n=t.getUTCDay()||7;t.setUTCDate(t.getUTCDate()+4-n);const s=new Date(Date.UTC(t.getUTCFullYear(),0,1)),o=Math.ceil(((t.getTime()-s.getTime())/864e5+1)/7);return`${t.getUTCFullYear()}-W${String(o).padStart(2,"0")}`}function _n(e){const t=_t(e);if(isNaN(t.getTime()))return e.slice(0,10)||"—";const n=t.toLocaleDateString(void 0,{month:"short",day:"numeric",timeZone:"UTC"}),s=t.toLocaleTimeString(void 0,{hour:"2-digit",minute:"2-digit",timeZone:"UTC",hour12:!1});return`${n}
${s}`}function Bn(e){const t=De(e.priority),n=!_&&e.project?`<span class="badge project">${e.project}</span>`:"",s=t?`<span class="badge ${t}">${e.priority}</span>`:"",o=`<span class="badge status-${e.status}">${Oe(e.status)}</span>`;return`
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
    </div>`}function Tn(e){var p,h;const t=De(e.priority),n=t?`<span class="badge ${t}">${e.priority}</span>`:"",s=!_&&e.project?`<span class="badge project">${e.project}</span>`:"",o=`<span class="badge status-${e.status}">${Oe(e.status)}</span>`,i=`<span class="badge level-${e.level}">L${e.level}</span>`,d=((p=e.created_at)==null?void 0:p.slice(0,10))||"",l=((h=e.completed_at)==null?void 0:h.slice(0,10))||"—",r=Ee(e.tags).map(u=>`<span class="tag">${u}</span>`).join("");return`
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
        <span>Created ${d||"—"}</span>
        <span>Done ${l}</span>
      </div>
      <div class="list-card-controls">
        <label>
          <span>Status</span>
          <select class="list-status-select" data-id="${e.id}" data-field="status">
            ${J.map(u=>`<option value="${u.key}" ${u.key===e.status?"selected":""}>${u.label}</option>`).join("")}
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
  `}async function Bt(){const e=document.getElementById("chronicle-view");try{const t=await le("full");et(t.projects);const n=[];for(const d of J)for(const l of t[d.key])n.push(l);const s=n.filter(d=>!!d.completed_at).sort((d,l)=>l.completed_at.localeCompare(d.completed_at)),o=new Map;for(const d of s){const l=jn(d.completed_at);o.has(l)||o.set(l,[]),o.get(l).push(d)}if(o.size===0){e.innerHTML=`
        <div style="display:flex;align-items:center;justify-content:center;color:#64748b;font-size:0.9rem;padding:64px">
          No completed tasks yet
        </div>`;return}const i=[...o.entries()].map(([d,l])=>{const a=l.map(Bn).join("");return`
        <div class="chronicle-group">
          <div class="chronicle-week-header">${d}</div>
          <div class="chronicle-events">${a}</div>
        </div>`}).join("");e.innerHTML=`<div class="chronicle-timeline">${i}</div>`,e.querySelectorAll(".chronicle-task-link").forEach(d=>{d.addEventListener("click",l=>{l.stopPropagation();const a=parseInt(d.dataset.id),r=d.dataset.project||void 0;V(a,r)})})}catch(t){console.error("loadChronicleView failed:",t),e.innerHTML=`
      <div style="display:flex;align-items:center;justify-content:center;color:#ef4444;font-size:0.9rem;padding:48px">
        Failed to load chronicle
      </div>`}}async function He(){const e=document.getElementById("graph-view");e.innerHTML=`
    <div class="graph-placeholder">
      <div class="graph-spinner"></div>
      <p>Loading graph&hellip;</p>
    </div>`,ne&&(ne.pauseAnimation(),ne=null),G&&(G.disconnect(),G=null);const t={react:"#61dafb",nextjs:"#ffffff",typescript:"#3178c6",tailwind:"#38bdf8","react-query":"#ff4154",vite:"#a855f7",shadcn:"#f8fafc",zustand:"#764abc",hotwire:"#cc0000",css:"#264de4",fastapi:"#009688",rails:"#cc0000",python:"#3572a5",nodejs:"#68a063",ruby:"#cc342d",postgresql:"#336791",sqlite:"#003b57",neon:"#00e599",supabase:"#3ecf8e",timescaledb:"#fdb515",influxdb:"#22adf6",drizzle:"#c5f74f",prisma:"#5a67d8",sqlalchemy:"#d71f00",oracle:"#f80000",auth:"#f59e0b","auth.js":"#f59e0b",oauth:"#f97316",docker:"#2496ed","docker-compose":"#2496ed",vercel:"#ffffff",deploy:"#10b981",kamal:"#10b981",gcp:"#4285f4",azure:"#0078d4","ci-cd":"#f05032",mobile:"#a78bfa",capacitor:"#119eff",pwa:"#5a0fc8",api:"#64748b",modbus:"#e67e22",realtime:"#ef4444",webhook:"#6366f1",ai:"#f59e0b",testing:"#22c55e",storage:"#0ea5e9",s3:"#ff9900",r2:"#f38020",pdf:"#e53e3e",excel:"#217346",performance:"#f97316",cache:"#8b5cf6",migration:"#ec4899",maps:"#34a853",gps:"#34a853",visualization:"#06b6d4",dashboard:"#06b6d4",canvas:"#f59e0b",graph:"#06b6d4",chart:"#06b6d4",modal:"#94a3b8",refactor:"#a3a3a3",kanban:"#818cf8",obsidian:"#7c3aed","cycling-data":"#10b981",euv:"#e11d48",plc:"#e11d48",schema:"#64748b"},n=["react","nextjs","typescript","fastapi","rails","python","nodejs","postgresql","sqlite","neon","supabase","timescaledb","influxdb","drizzle","prisma","sqlalchemy","oracle","auth","auth.js","oauth","docker","docker-compose","vercel","deploy","kamal","gcp","azure","ci-cd","mobile","capacitor","pwa","api","modbus","realtime","webhook","ai","testing","storage","s3","r2","pdf","excel","performance","cache","migration","maps","gps","visualization","dashboard","canvas","graph","chart","modal","refactor","kanban","obsidian","cycling-data","euv","plc","schema"];function s(d){const l=d.map(a=>a.toLowerCase());for(const a of n)if(l.includes(a))return a;return l.find(a=>a in t)??null}const o={1:4,2:7,3:10},i={todo:"#475569",plan:"#3b82f6",impl:"#8b5cf6",impl_review:"#6366f1",plan_review:"#a855f7",test:"#f59e0b",done:"#22c55e"};try{const[{default:d},l]=await Promise.all([Dt(()=>import("./force-graph-B6EEfo0M.js"),[]),le("full")]),a=[];for(const c of J){const m=l[c.key];for(const y of m)a.push({...y,_status:c.key})}let r=a,p="";a.length>300?(r=a.filter(c=>c._status!=="done"),p=`<div style="position:absolute;top:8px;left:50%;transform:translateX(-50%);z-index:10;background:#1e293b;color:#f59e0b;padding:4px 12px;border-radius:6px;font-size:0.8rem;border:1px solid #f59e0b40">${a.length} nodes — done tasks hidden for performance</div>`):M&&(r=a.filter(c=>!(c._status==="done"&&ue(c.completed_at||""))));const h=re.toLowerCase().replace(/^#/,""),u=r.map(c=>({id:c.id,title:`#${c.id} ${c.title}`,status:c._status,level:c.level??1,tags:Ee(c.tags),priority:c.priority||"medium",project:c.project})),g=new Map;for(const c of u)for(const m of c.tags){const y=m.toLowerCase();g.has(y)||g.set(y,[]),g.get(y).push(c.id)}const f=new Map;for(const[,c]of g)for(let m=0;m<c.length;m++)for(let y=m+1;y<c.length;y++){const L=Math.min(c[m],c[y]),x=Math.max(c[m],c[y]),P=`${L}-${x}`;f.set(P,(f.get(P)||0)+1)}const $=new Set,b=[];for(const[c,m]of g)for(let y=0;y<m.length;y++)for(let L=y+1;L<m.length;L++){const x=Math.min(m[y],m[L]),P=Math.max(m[y],m[L]),q=`${x}-${P}`;$.has(q)||($.add(q),b.push({source:x,target:P,tag:c,sharedCount:f.get(q)||1}))}e.innerHTML=p,e.style.position="relative",e.style.padding="0",e.style.overflow="hidden";const I=document.createElement("div");I.style.cssText="position:absolute;inset:0;width:100%;height:100%",e.appendChild(I);const E=document.createElement("div");E.className="graph-tooltip",e.appendChild(E),e.addEventListener("mousemove",c=>{const m=e.getBoundingClientRect();E.style.left=`${c.clientX-m.left+12}px`,E.style.top=`${c.clientY-m.top+12}px`});const H=d()(I).backgroundColor("#0f172a").nodeId("id").nodeLabel(()=>"").nodeVal(c=>o[c.level]||o[1]).nodeCanvasObject((c,m,y)=>{const L=Math.sqrt(o[c.level]||o[1])*2,x=c.x??0,P=c.y??0;let q=1;h?q=c.title.toLowerCase().includes(h)||c.tags.some(ce=>ce.toLowerCase().includes(h))?1:.15:c.status==="done"&&(q=.35),m.globalAlpha=q;const je=s(c.tags),_e=je?t[je]??"#334155":"#334155";m.beginPath(),m.arc(x,P,L,0,2*Math.PI),m.fillStyle=_e,m.fill();const Be=i[c.status]??"#475569";m.beginPath(),m.arc(x,P,L+1.5/y,0,2*Math.PI),m.strokeStyle=Be,m.lineWidth=1.5/y,m.stroke();const Ne=c.title.replace(/^#\d+\s*/,"").slice(0,40),Te=Math.max(3,11/y);m.font=`${Te}px sans-serif`,m.fillStyle=q<.5?"rgba(148,163,184,0.2)":"#cbd5e1",m.textAlign="left",m.textBaseline="middle",m.fillText(Ne,x+L+3/y,P),m.globalAlpha=1}).nodePointerAreaPaint((c,m,y)=>{const L=Math.sqrt(o[c.level]||o[1])*2+2;y.beginPath(),y.arc(c.x??0,c.y??0,L,0,2*Math.PI),y.fillStyle=m,y.fill()}).onNodeClick(c=>{V(c.id,c.project)}).onNodeHover(c=>{if(I.style.cursor=c?"pointer":"default",!c){E.style.display="none";return}const m=s(c.tags),y=m?t[m]??null:null,L=m?`<span style="background:${y};color:#0f172a;padding:1px 7px;border-radius:4px;font-weight:600">${m}</span>`:"",x=c.tags.filter(q=>q.toLowerCase()!==m).slice(0,3),P=x.length?`<div class="graph-tooltip-tags">${x.map(q=>`<span>${q}</span>`).join("")}</div>`:"";E.innerHTML=`
          <div class="graph-tooltip-title">${c.title}</div>
          <div class="graph-tooltip-meta" style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">
            ${L}
            <span>${c.status} &middot; ${c.priority} &middot; L${c.level}</span>
          </div>
          ${P}`,E.style.display="block"}).linkColor(c=>t[c.tag.toLowerCase()]??"#334155").linkWidth(c=>Math.min(1.5+(c.sharedCount-1)*.8,4)).d3AlphaDecay(.02).d3VelocityDecay(.3).warmupTicks(100).cooldownTime(5e3).width(e.offsetWidth||window.innerWidth).height(e.offsetHeight||window.innerHeight-112).graphData({nodes:u,links:b});ne=H;const N=new Set(u.flatMap(c=>c.tags.map(m=>m.toLowerCase()))),O=n.filter(c=>N.has(c)&&c in t).slice(0,16);if(O.length>0){const c=document.createElement("div");c.className="graph-legend",c.innerHTML=O.map(m=>`<div class="graph-legend-item"><span style="background:${t[m]}"></span>${m}</div>`).join(""),e.appendChild(c)}G=new ResizeObserver(c=>{for(const m of c){const{width:y,height:L}=m.contentRect;y>0&&L>0&&H.width(y).height(L)}}),G.observe(e)}catch(d){console.error("loadGraphView failed:",d),e.innerHTML=`
      <div class="graph-placeholder">
        <p style="color:#ef4444;font-size:0.9rem">Failed to load graph</p>
      </div>`}}async function Le(){var t,n,s,o,i,d,l,a;const e=document.getElementById("board");try{const r=await le(Je()?"full":"board");on(r),et(r.projects),e.innerHTML=J.map(g=>{var f;return un(g.key,g.label,g.icon,r[g.key],((f=r.counts)==null?void 0:f[g.key])??r[g.key].length)}).join("");const p=((t=r.counts)==null?void 0:t.done)??r.done.length,h=r.total??(((n=r.counts)==null?void 0:n.todo)??r.todo.length)+(((s=r.counts)==null?void 0:s.plan)??r.plan.length)+(((o=r.counts)==null?void 0:o.plan_review)??r.plan_review.length)+(((i=r.counts)==null?void 0:i.impl)??r.impl.length)+(((d=r.counts)==null?void 0:d.impl_review)??r.impl_review.length)+(((l=r.counts)==null?void 0:l.test)??r.test.length)+(((a=r.counts)==null?void 0:a.done)??r.done.length);document.getElementById("count-summary").textContent=`${p}/${h} completed`,e.querySelectorAll(".card").forEach(g=>{g.addEventListener("click",f=>{if(f.target.closest(".card-interactive")){f.stopPropagation();return}const b=f.target.closest(".card-copy-btn");if(b){f.stopPropagation(),navigator.clipboard.writeText(b.dataset.copy).then(()=>{const H=b.textContent;b.textContent="✓",setTimeout(()=>{b.textContent=H},1e3)});return}const I=parseInt(g.dataset.id),E=g.dataset.project;V(I,E)})}),B||Rn(),An(),Ue();const u=document.getElementById("add-card-btn");u&&u.addEventListener("click",g=>{g.stopPropagation(),document.getElementById("add-card-overlay").classList.remove("hidden"),W(),B||document.getElementById("add-title").focus()})}catch(r){console.error("loadBoard failed:",r),e.innerHTML=`
      <div style="grid-column:1/-1;display:flex;align-items:center;justify-content:center;color:#ef4444;font-size:0.9rem;padding:48px">
        Cannot find .claude/kanban.db
      </div>
    `}}function An(){document.querySelectorAll("[data-column-toggle]").forEach(e=>{e.addEventListener("click",t=>{if(!B)return;t.stopPropagation();const n=e.dataset.columnToggle;if(!n)return;X.has(n)?X.delete(n):X.add(n),St();const s=e.closest(".column"),o=X.has(n)||!!re.trim();s&&s.setAttribute("data-mobile-expanded",String(o)),e.setAttribute("aria-expanded",String(o));const i=e.querySelector(".column-toggle-icon");i&&(i.textContent=o?"−":"+")})}),document.querySelectorAll(".mobile-status-select").forEach(e=>{e.addEventListener("click",t=>t.stopPropagation()),e.addEventListener("change",async t=>{t.stopPropagation();const n=e.value,s=parseInt(e.dataset.id||"",10),o=e.dataset.project||"",i=e.dataset.currentStatus||"";!s||!o||await cn({id:s,project:o,status:i},n)})})}async function Me(){const e=document.getElementById("list-view");try{const t=await le("full");et(t.projects);const n=[];for(const a of J)for(const r of t[a.key])n.push(r);const s=Z==="default"?[...n].sort((a,r)=>r.id-a.id):jt(n),o=s.length,i=s.filter(a=>a.status==="done").length;document.getElementById("count-summary").textContent=`${i}/${o} completed`;const d=s.map(a=>{var u,g;const r=De(a.priority),h=Ee(a.tags).map(f=>`<span class="tag">${f}</span>`).join("");return`
        <tr class="status-${a.status}" data-id="${a.id}" data-project="${a.project}" data-completed-at="${a.completed_at||""}">
          <td class="col-id">#${a.id}</td>
          <td class="col-title">${a.title}</td>
          <td>
            <select class="list-status-select" data-id="${a.id}" data-field="status">
              ${J.map(f=>`<option value="${f.key}" ${f.key===a.status?"selected":""}>${f.icon} ${f.label}</option>`).join("")}
            </select>
          </td>
          <td>
            <select class="list-level-select" data-id="${a.id}" data-field="level">
              ${[1,2,3].map(f=>`<option value="${f}" ${f===a.level?"selected":""}>L${f}</option>`).join("")}
            </select>
          </td>
          <td>
            <select class="list-priority-select ${r}" data-id="${a.id}" data-field="priority">
              ${["high","medium","low"].map(f=>`<option value="${f}" ${f===a.priority?"selected":""}>${f[0].toUpperCase()+f.slice(1)}</option>`).join("")}
            </select>
          </td>
          <td class="list-date">${a.project||""}</td>
          <td>${h}</td>
          <td class="list-date">${((u=a.created_at)==null?void 0:u.slice(0,10))||""}</td>
          <td class="list-date">${((g=a.completed_at)==null?void 0:g.slice(0,10))||""}</td>
        </tr>
      `}).join(""),l=s.map(Tn).join("");e.innerHTML=`
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
          <tbody>${d}</tbody>
        </table>
      </div>
    `,e.querySelectorAll("select").forEach(a=>{a.addEventListener("change",async r=>{r.stopPropagation();const p=a,h=p.dataset.id,u=p.dataset.field;let g=p.value;u==="level"&&(g=parseInt(g));const f=p.closest("tr"),$=(f==null?void 0:f.dataset.project)||"",b=await A(`/api/task/${h}?project=${encodeURIComponent($)}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({[u]:g})});if(!b.ok){const I=await b.json().catch(()=>({}));I.error&&Ie(I.error),Me();return}F($),Me()})}),e.querySelectorAll(".col-title").forEach(a=>{a.addEventListener("click",r=>{r.stopPropagation();const p=a.closest("[data-id]"),h=parseInt(p.dataset.id),u=p.dataset.project;V(h,u)})}),Ue()}catch(t){console.error("loadListView failed:",t),e.innerHTML=`
      <div style="display:flex;align-items:center;justify-content:center;color:#ef4444;font-size:0.9rem;padding:48px">
        Failed to load task list
      </div>
    `}}function et(e){const t=document.getElementById("project-filter");if(e.length<=1){t.innerHTML=e[0]?`<span class="project-label">${e[0]}</span>`:"";return}const n=e.map(s=>`<option value="${s}" ${s===_?"selected":""}>${s}</option>`).join("");t.innerHTML=`
    <select id="project-select">
      <option value="">All Projects</option>
      ${n}
    </select>
  `,document.getElementById("project-select").addEventListener("change",s=>{_=s.target.value||null,_?localStorage.setItem("kanban-project",_):localStorage.removeItem("kanban-project"),k=null,te=null,R()})}function gt(e,t){const n=[...e.querySelectorAll(".card:not(.dragging)")];for(const s of n){const o=s.getBoundingClientRect(),i=o.top+o.height/2;if(t<i)return s}return null}function Re(){document.querySelectorAll(".drop-indicator").forEach(e=>e.remove())}function kn(e,t){Re();const n=document.createElement("div");n.className="drop-indicator",t?e.insertBefore(n,t):e.appendChild(n)}function Rn(){const e=document.querySelectorAll(".card"),t=document.querySelectorAll(".column-body");e.forEach(n=>{n.addEventListener("dragstart",s=>{const o=s,i=n;o.dataTransfer.setData("text/plain",`${i.dataset.project}:${i.dataset.id}`),i.classList.add("dragging"),Pe=!0}),n.addEventListener("dragend",()=>{n.classList.remove("dragging"),Re(),Pe=!1})}),t.forEach(n=>{n.addEventListener("dragover",s=>{s.preventDefault();const o=n;o.classList.add("drag-over");const i=gt(o,s.clientY);kn(o,i)}),n.addEventListener("dragleave",s=>{const o=n;o.contains(s.relatedTarget)||(o.classList.remove("drag-over"),Re())}),n.addEventListener("drop",async s=>{s.preventDefault();const o=n;o.classList.remove("drag-over"),Re();const i=s,d=i.dataTransfer.getData("text/plain"),l=d.lastIndexOf(":"),a=l>=0?d.slice(0,l):"",r=parseInt(l>=0?d.slice(l+1):d),p=o.dataset.column,h=gt(o,i.clientY),u=[...o.querySelectorAll(".card:not(.dragging)")];let g=null,f=null;if(h){f=parseInt(h.dataset.id);const b=u.indexOf(h);b>0&&(g=parseInt(u[b-1].dataset.id))}else u.length>0&&(g=parseInt(u[u.length-1].dataset.id));const $=await A(`/api/task/${r}/reorder?project=${encodeURIComponent(a)}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({status:p,afterId:g,beforeId:f})});if(!$.ok){const b=await $.json().catch(()=>({}));b.error&&Ie(b.error)}F(a),Le()})})}function Ie(e){const t=document.querySelector(".toast");t&&t.remove();const n=document.createElement("div");n.className="toast",n.textContent=e,document.body.appendChild(n),setTimeout(()=>n.remove(),3e3)}async function Tt(){try{const t=await(await A("/api/info")).json();t.projectName&&(document.title=`Kanban · ${t.projectName}`,document.querySelector("header h1").textContent=`Kanban · ${t.projectName}`)}catch{}}function Ce(e){S=e,localStorage.setItem(Ke,S);const t=document.getElementById("board"),n=document.getElementById("list-view"),s=document.getElementById("chronicle-view"),o=document.getElementById("graph-view");e!=="graph"&&(G&&(G.disconnect(),G=null),ne&&(ne.pauseAnimation(),ne=null)),t.classList.add("hidden"),n.classList.add("hidden"),s.classList.add("hidden"),o.classList.add("hidden"),document.getElementById("tab-board").classList.remove("active"),document.getElementById("tab-list").classList.remove("active"),document.getElementById("tab-chronicle").classList.remove("active"),document.getElementById("tab-graph").classList.remove("active"),e==="board"?(t.classList.remove("hidden"),document.getElementById("tab-board").classList.add("active"),Le()):e==="list"?(n.classList.remove("hidden"),document.getElementById("tab-list").classList.add("active"),Me()):e==="chronicle"?(s.classList.remove("hidden"),document.getElementById("tab-chronicle").classList.add("active"),Bt()):(o.classList.remove("hidden"),document.getElementById("tab-graph").classList.add("active"),He())}function R(){S==="board"?Le():S==="list"?Me():S==="chronicle"?Bt():He()}document.getElementById("sort-select").value=Z;M&&document.getElementById("hide-done-btn").classList.add("active");$e();Ye();document.getElementById("auth-btn").addEventListener("click",()=>{if(U&&T){ae("Shared token is stored on this device. Use Forget Token to reset it.","success");return}ae(U?"Enter the shared access token to load the board.":"This environment does not require a shared token.")});document.getElementById("auth-close").addEventListener("click",()=>{U&&!T||we()});document.getElementById("auth-clear-btn").addEventListener("click",async()=>{await Qt(),U?ae("Stored token cleared. Enter a shared access token to continue."):(we(),ie("Stored token cleared."))});document.getElementById("auth-form").addEventListener("submit",async e=>{e.preventDefault();const n=document.getElementById("auth-token-input").value.trim();if(!n){ie("Enter the shared access token.","error");return}ie("Unlocking board...","default");try{await It(n),ie("Board unlocked.","success"),await Tt(),Ct(),R()}catch(s){ie(s instanceof Error?s.message:"Board authentication failed.","error")}});document.getElementById("tab-board").addEventListener("click",()=>Ce("board"));document.getElementById("tab-list").addEventListener("click",()=>Ce("list"));document.getElementById("tab-chronicle").addEventListener("click",()=>Ce("chronicle"));document.getElementById("tab-graph").addEventListener("click",()=>Ce("graph"));document.getElementById("toolbar-mobile-toggle").addEventListener("click",()=>{ve=!ve,Ye()});$t.addEventListener("change",e=>{Yt(e.matches)});document.addEventListener("visibilitychange",()=>{document.visibilityState!=="visible"||!T||(Xe(),R())});function At(){if(We)return;We=!0;const e=new EventSource("/api/events");e.onmessage=()=>{if(Pe)return;const t=!document.getElementById("modal-overlay").classList.contains("hidden"),n=!document.getElementById("add-card-overlay").classList.contains("hidden");!t&&!n&&R()},e.onerror=()=>{e.close(),We=!1,(!U||T)&&setTimeout(At,5e3)}}document.getElementById("refresh-btn").addEventListener("click",R);document.getElementById("search-input").addEventListener("input",e=>{if(re=e.target.value.trim(),S==="board"){Le();return}if(S==="graph"){He();return}Ue()});document.getElementById("sort-select").addEventListener("change",e=>{Z=e.target.value,localStorage.setItem("kanban-sort",Z),R()});document.getElementById("hide-done-btn").addEventListener("click",()=>{if(M=!M,localStorage.setItem("kanban-hide-old",String(M)),document.getElementById("hide-done-btn").classList.toggle("active",M),S==="graph"){He();return}Ue()});document.getElementById("modal-close").addEventListener("click",()=>{document.getElementById("modal-overlay").classList.add("hidden"),W(),R()});document.getElementById("modal-overlay").addEventListener("click",e=>{e.target===e.currentTarget&&(document.getElementById("modal-overlay").classList.add("hidden"),W(),R())});document.addEventListener("keydown",e=>{if(e.key==="Escape"){const t=!document.getElementById("modal-overlay").classList.contains("hidden");document.getElementById("modal-overlay").classList.add("hidden"),document.getElementById("add-card-overlay").classList.add("hidden"),!document.getElementById("auth-overlay").classList.contains("hidden")&&T&&we(),W(),t&&R()}});const be=document.getElementById("add-card-overlay");let z=[];function Se(){const e=document.getElementById("add-attachment-preview");if(z.length===0){e.innerHTML="";return}e.innerHTML=z.map((t,n)=>`
    <div class="attachment-thumb">
      <img src="${URL.createObjectURL(t)}" alt="${t.name}" />
      <button class="attachment-remove" data-idx="${n}" title="Remove" type="button">&times;</button>
      <span class="attachment-name">${t.name}</span>
    </div>
  `).join(""),e.querySelectorAll(".attachment-remove").forEach(t=>{t.addEventListener("click",n=>{n.stopPropagation();const s=parseInt(t.dataset.idx);z.splice(s,1),Se()})})}function tt(e){for(const t of Array.from(e))t.type.startsWith("image/")&&z.push(t);Se()}document.getElementById("add-card-close").addEventListener("click",()=>{be.classList.add("hidden"),z=[],Se(),W()});be.addEventListener("click",e=>{e.target===e.currentTarget&&(be.classList.add("hidden"),z=[],Se(),W())});const se=document.getElementById("add-attachment-zone"),me=document.getElementById("add-attachment-input");se.addEventListener("click",()=>me.click());se.addEventListener("dragover",e=>{e.preventDefault(),se.classList.add("drop-active")});se.addEventListener("dragleave",()=>{se.classList.remove("drop-active")});se.addEventListener("drop",e=>{var n;e.preventDefault(),se.classList.remove("drop-active");const t=(n=e.dataTransfer)==null?void 0:n.files;t&&tt(t)});me.addEventListener("change",()=>{me.files&&tt(me.files),me.value=""});be.addEventListener("paste",e=>{var n;const t=Array.from(((n=e.clipboardData)==null?void 0:n.files)??[]).filter(s=>s.type.startsWith("image/"));t.length!==0&&(e.preventDefault(),tt(t))});document.getElementById("add-card-form").addEventListener("submit",async e=>{e.preventDefault();const t=document.getElementById("add-title").value.trim();if(!t)return;const n=document.getElementById("add-priority").value,s=parseInt(document.getElementById("add-level").value)||3,o=document.getElementById("add-description").value.trim()||null,i=document.getElementById("add-tags").value.trim(),d=i?i.split(",").map(h=>h.trim()).filter(Boolean):null,l=_;if(!l){Ie("Select a project first");return}const a=document.querySelector("#add-card-form .form-submit");a.textContent=z.length>0?"Creating...":"Add Card",a.disabled=!0;const p=await(await A("/api/task",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({title:t,priority:n,level:s,description:o,tags:d,project:l})})).json();z.length>0&&p.id&&await ke(p.id,z,l),z=[],a.textContent="Add Card",a.disabled=!1,document.getElementById("add-card-form").reset(),Se(),be.classList.add("hidden"),W(),F(l),R()});sn().then(async e=>{e&&(await Tt(),Ce(S),Ct())}).catch(()=>{ae("Unable to initialize board authentication.","error")});zt();
