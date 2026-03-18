import vt from"https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs";(function(){const n=document.createElement("link").relList;if(n&&n.supports&&n.supports("modulepreload"))return;for(const o of document.querySelectorAll('link[rel="modulepreload"]'))s(o);new MutationObserver(o=>{for(const r of o)if(r.type==="childList")for(const d of r.addedNodes)d.tagName==="LINK"&&d.rel==="modulepreload"&&s(d)}).observe(document,{childList:!0,subtree:!0});function t(o){const r={};return o.integrity&&(r.integrity=o.integrity),o.referrerPolicy&&(r.referrerPolicy=o.referrerPolicy),o.crossOrigin==="use-credentials"?r.credentials="include":o.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function s(o){if(o.ep)return;o.ep=!0;const r=t(o);fetch(o.href,r)}})();vt.initialize({startOnLoad:!1,theme:"dark",themeVariables:{primaryColor:"#334155",primaryBorderColor:"#60a5fa",primaryTextColor:"#f1f5f9",lineColor:"#64748b",secondaryColor:"#1e293b",tertiaryColor:"#0f172a"}});window.__mermaid=vt;const Ot="modulepreload",Mt=function(e){return"/"+e},dt={},Dt=function(n,t,s){let o=Promise.resolve();if(t&&t.length>0){let d=function(i){return Promise.all(i.map(u=>Promise.resolve(u).then(h=>({status:"fulfilled",value:h}),h=>({status:"rejected",reason:h}))))};document.getElementsByTagName("link");const l=document.querySelector("meta[property=csp-nonce]"),a=(l==null?void 0:l.nonce)||(l==null?void 0:l.getAttribute("nonce"));o=d(t.map(i=>{if(i=Mt(i),i in dt)return;dt[i]=!0;const u=i.endsWith(".css"),h=u?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${i}"]${h}`))return;const m=document.createElement("link");if(m.rel=u?"stylesheet":Ot,u||(m.as="script"),m.crossOrigin="",m.href=i,a&&m.setAttribute("nonce",a),document.head.appendChild(m),u)return new Promise((g,f)=>{m.addEventListener("load",g),m.addEventListener("error",()=>f(new Error(`Unable to preload CSS for ${i}`)))})}))}function r(d){const l=new Event("vite:preloadError",{cancelable:!0});if(l.payload=d,window.dispatchEvent(l),!l.defaultPrevented)throw d}return o.then(d=>{for(const l of d||[])l.status==="rejected"&&r(l.reason);return n().catch(r)})},Y=[{key:"todo",label:"Requirements",icon:"📋"},{key:"plan",label:"Plan",icon:"🗺️"},{key:"plan_review",label:"Review Plan",icon:"🔍"},{key:"impl",label:"Implement",icon:"🔨"},{key:"impl_review",label:"Review Impl",icon:"📝"},{key:"test",label:"Test",icon:"🧪"},{key:"done",label:"Done",icon:"✅"}],Ut={plan:"Planning",plan_review:"Plan Review",impl:"Implementing",impl_review:"Impl Review",test:"Testing"},Pe="kanban-auth-token",Ke="kanban-current-view",yt="kanban-mobile-board-columns",Ht=3e4,Nt=10,Ft=10,bt="kanban-summary-cache",Vt={board:3e4,full:6e4},$t=window.matchMedia("(max-width: 768px)");function zt(){!("serviceWorker"in navigator)||!(window.location.protocol==="https:"||window.location.hostname==="localhost"||window.location.hostname==="127.0.0.1")||window.addEventListener("load",()=>{navigator.serviceWorker.register("/sw.js").catch(n=>{console.warn("Service worker registration failed",n)})})}function Wt(e){return e==="board"||e==="list"||e==="chronicle"||e==="graph"}function Kt(e){return Y.some(n=>n.key===e)}function Jt(){try{const e=localStorage.getItem(yt);if(!e)return new Set;const n=JSON.parse(e);return Array.isArray(n)?new Set(n.filter(t=>typeof t=="string"&&Kt(t))):new Set}catch{return new Set}}let j=localStorage.getItem("kanban-project"),qe=!1,_=$t.matches,I=Wt(localStorage.getItem(Ke))?localStorage.getItem(Ke):_?"list":"board",pe="",Q=localStorage.getItem("kanban-sort")||"default",H=localStorage.getItem("kanban-hide-old")==="true",N=localStorage.getItem(Pe)||"",F=!1,B=!1,We=!1,we=!_,ee=Jt(),P=null,ye=null,oe=null;const be=new Map,ce=new Map,$e=new Map;let X=null,ie=null;function de(e,n="default"){const t=document.getElementById("auth-message");t.textContent=e,t.classList.remove("error","success"),n!=="default"&&t.classList.add(n)}function K(){const n=[document.getElementById("modal-overlay"),document.getElementById("add-card-overlay"),document.getElementById("auth-overlay")].some(t=>t&&!t.classList.contains("hidden"));document.body.classList.toggle("overlay-open",n)}function Ie(){const e=document.getElementById("auth-btn");if(e){if(!F){e.textContent="Open",e.title="Board access is open in this environment";return}e.textContent=B?"Private":"Locked",e.title=B?"Shared token configured for this browser":"Shared token required"}}function re(e="Enter the shared access token to load the board.",n="default"){B=!1,document.getElementById("auth-overlay").classList.remove("hidden"),K();const t=document.getElementById("auth-token-input");t.value=N,de(e,n),Ie(),setTimeout(()=>t.focus(),0)}function Ce(){document.getElementById("auth-overlay").classList.add("hidden"),K(),Ie()}function wt(e){N=e.trim(),N?localStorage.setItem(Pe,N):localStorage.removeItem(Pe)}function Ye(){document.body.classList.toggle("mobile-shell",_),document.body.classList.toggle("mobile-toolbar-open",!_||we);const e=document.getElementById("toolbar-mobile-toggle");if(e){const n=!_||we;e.hidden=!_,e.setAttribute("aria-expanded",String(n)),e.textContent=n?"Hide Filters":"Show Filters"}}function Yt(e){_=e,_||(we=!0),Ye(),B&&I==="board"&&q()}function Et(){return window.location.hostname==="localhost"||window.location.hostname==="127.0.0.1"}function Ge(){ye!==null&&(window.clearInterval(ye),ye=null)}function Ze(e=j,n="full"){return`${e||"__all__"}::${n}`}function Oe(e=j,n="full"){return`${bt}::${Ze(e,n)}`}function Gt(e=j,n="full"){try{const t=localStorage.getItem(Oe(e,n));if(!t)return null;const s=JSON.parse(t);return!s||typeof s.fetchedAt!="number"||!s.board?null:Date.now()-s.fetchedAt>Vt[n]?(localStorage.removeItem(Oe(e,n)),null):s}catch{return null}}function Zt(e,n,t,s){try{const o={fetchedAt:Date.now(),etag:s,board:t};localStorage.setItem(Oe(e,n),JSON.stringify(o))}catch{}}function V(e=j,n){const t=n?[n]:["board","full"];for(const s of t){const o=Ze(e,s);be.delete(o),ce.delete(o),$e.delete(o);try{localStorage.removeItem(Oe(e,s))}catch{}}e===j&&(P=null,oe=null)}function Xe(e={}){if(be.clear(),ce.clear(),$e.clear(),P=null,oe=null,e.persisted)try{const n=[];for(let t=0;t<localStorage.length;t+=1){const s=localStorage.key(t);s!=null&&s.startsWith(`${bt}::`)&&n.push(s)}n.forEach(t=>localStorage.removeItem(t))}catch{}}function Lt(){N="",localStorage.removeItem(Pe);const e=document.getElementById("auth-token-input");e&&(e.value="")}async function Xt(){const e=new Headers;N&&e.set("X-Kanban-Auth",N);const t=await(await fetch("/api/auth/session",{method:"GET",headers:e,credentials:"same-origin"})).json().catch(()=>({}));return{authenticated:!!t.authenticated,authRequired:!!t.authRequired,mode:t.mode,source:t.source??null,reason:t.reason??null,error:t.error??null}}async function It(e){const n=e.trim(),t=await fetch("/api/auth/session",{method:"POST",headers:{"X-Kanban-Auth":n},credentials:"same-origin"}),s=await t.json().catch(()=>({}));if(!t.ok){const o=s.reason==="invalid_token"?"Shared token is invalid.":s.reason==="token_hash_missing"?"Server auth is not configured yet.":"Board authentication failed.";throw new Error(o)}wt(n),F=!!s.authRequired,B=!0,Ce(),Ie()}async function Qt(){await fetch("/api/auth/session",{method:"DELETE",credentials:"same-origin"}).catch(()=>{}),Ge(),Xe({persisted:!0}),Lt(),B=!F,Ie()}async function x(e,n={},t=!1){const s=new Headers(n.headers||{});N&&!s.has("X-Kanban-Auth")&&s.set("X-Kanban-Auth",N);const o=await fetch(e,{...n,headers:s,credentials:"same-origin"});if((o.status===401||o.status===403||o.status===503)&&!t){const r=await o.clone().json().catch(()=>({}));F=!0,B=!1,r.reason==="invalid_token"&&Lt();const d=r.reason==="invalid_token"?"Stored token was rejected. Enter a valid shared token.":r.reason==="token_hash_missing"?"Server auth hash is not configured yet.":"Shared token is required for this board.";throw re(d,"error"),new Error(r.error||d)}return o}async function Qe(e=j){const n=e?`?project=${encodeURIComponent(e)}`:"",t=new Headers;oe&&t.set("If-None-Match",oe);const s=await x(`/api/board/version${n}`,{headers:t});return s.status===304?P?null:(oe=null,Qe()):(oe=s.headers.get("ETag"),s.json())}function en(e){return e==="board"?I==="board"&&!Je():I==="list"||I==="chronicle"||I==="board"&&Je()}function Je(){return pe.trim().length>0}function tn(e,n,t,s){if(!B||$e.has(n))return;const o=(async()=>{try{const r=await Qe(s);if(!r)return;if(t&&r.version===t){P=r.version;return}V(s,e),await ue(e,{bypassTtl:!0,projectOverride:s}),j===s&&en(e)&&q()}catch{}finally{$e.delete(n)}})();$e.set(n,o)}async function ue(e="full",n={}){const t=n.projectOverride===void 0?j:n.projectOverride,s=["summary=true"];t&&s.unshift(`project=${encodeURIComponent(t)}`),e==="board"&&s.push("compact=board",`todo_limit=${Nt}`,`done_limit=${Ft}`);const o=`?${s.join("&")}`,r=Ze(t,e);if(!n.bypassTtl){const h=Gt(t,e);if(h)return be.set(r,h.board),h.etag&&ce.set(r,h.etag),P=h.board.version||P,tn(e,r,h.board.version||null,t),h.board}const d=new Headers,l=ce.get(r);l&&d.set("If-None-Match",l);const a=await x(`/api/board${o}`,{headers:d});if(a.status===304){const h=be.get(r);return h?(P=h.version||P,h):(ce.delete(r),ue(e,{bypassTtl:!0}))}const i=await a.json(),u=a.headers.get("ETag");return u&&ce.set(r,u),be.set(r,i),Zt(t,e,i,u),P=i.version||P,i}function nn(){Et()||ye!==null||(ye=window.setInterval(async()=>{if(!B||qe)return;const e=!document.getElementById("modal-overlay").classList.contains("hidden"),n=!document.getElementById("add-card-overlay").classList.contains("hidden");if(!(e||n))try{const t=await Qe();if(!t)return;if(!P){P=t.version;return}t.version!==P&&(P=t.version,q())}catch{F&&!B&&Ge()}},Ht))}function Ct(){if(Et()){Ge(),At();return}nn()}function an(){const e=new URL(window.location.href),n=e.searchParams.get("auth")||e.searchParams.get("token");n&&(wt(n),e.searchParams.delete("auth"),e.searchParams.delete("token"),window.history.replaceState({},"",e.toString()))}async function sn(){if(an(),N)try{return await It(N),!0}catch(n){return re(n instanceof Error?n.message:"Board authentication failed.","error"),!1}const e=await Xt();return F=e.authRequired,B=e.authenticated||!e.authRequired,e.authRequired&&!e.authenticated?(re("Enter the shared access token to load the board."),!1):(Ce(),!0)}function Ue(e){return e==="high"?"high":e==="medium"?"medium":e==="low"?"low":""}function St(){localStorage.setItem(yt,JSON.stringify([...ee]))}function on(e){if(!_||ee.size>0)return;const n=Y.filter(t=>t.key==="todo"||t.key==="impl"||t.key!=="done"&&e[t.key].length>0).map(t=>t.key);ee=new Set(n.length>0?n:["todo"]),St()}function rn(e){return!_||pe.trim()?!0:ee.has(e)}function Me(e){var n;return((n=Y.find(t=>t.key===e))==null?void 0:n.label)||e}function ln(e,n){return e===1?{todo:["impl"],impl:["done"],done:[]}[n]||[]:e===2?{todo:["plan"],plan:["impl","todo"],impl:["impl_review"],impl_review:["done","impl"],done:[]}[n]||[]:{todo:["plan"],plan:["plan_review","todo"],plan_review:["impl","plan"],impl:["impl_review"],impl_review:["test","impl"],test:["done","impl"],done:[]}[n]||[]}async function cn(e,n){if(!n||n===e.status)return;const t=await x(`/api/task/${e.id}?project=${encodeURIComponent(e.project)}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({status:n})});if(!t.ok){const s=await t.json().catch(()=>({}));_e(s.error||"Failed to move task");return}V(e.project),je()}function ge(e){return e?Date.now()-new Date(e).getTime()>4320*60*1e3:!1}function jt(e,n){return Q==="default"?n==="done"?[...e].sort((t,s)=>{const o=(s.completed_at||"").localeCompare(t.completed_at||"");return o!==0?o:t.rank-s.rank||t.id-s.id}):[...e].sort((t,s)=>s.rank-t.rank||s.id-t.id):[...e].sort((t,s)=>Q==="created_asc"?t.created_at.localeCompare(s.created_at):Q==="created_desc"?s.created_at.localeCompare(t.created_at):Q==="completed_desc"?(s.completed_at||"").localeCompare(t.completed_at||""):0)}function He(){const e=pe.toLowerCase().replace(/^#/,""),n=e.length>0||H;document.body.classList.toggle("mobile-board-search",I==="board"&&_&&e.length>0),I==="board"?(document.querySelectorAll(".card").forEach(t=>{const s=!e||(()=>{var i,u,h,m;const r=t.dataset.id||"",d=((u=(i=t.querySelector(".card-title"))==null?void 0:i.textContent)==null?void 0:u.toLowerCase())||"",l=((m=(h=t.querySelector(".card-desc"))==null?void 0:h.textContent)==null?void 0:m.toLowerCase())||"",a=[...t.querySelectorAll(".tag")].map(g=>{var f;return((f=g.textContent)==null?void 0:f.toLowerCase())||""}).join(" ");return r===e||d.includes(e)||l.includes(e)||a.includes(e)})(),o=H&&t.dataset.status==="done"&&ge(t.dataset.completedAt||"");t.style.display=s&&!o?"":"none"}),document.querySelectorAll(".column").forEach(t=>{const s=t.querySelectorAll(".card"),o=[...s].filter(a=>a.style.display!=="none").length,r=s.length,d=Number.parseInt(t.dataset.totalCount||`${r}`,10)||r,l=t.querySelector(".count");l&&(l.textContent=n||d!==r?`${o}/${d}`:`${d}`)})):I==="list"?(document.querySelectorAll("#list-view tbody tr").forEach(t=>{const s=!e||(()=>{var i,u,h,m;const r=t.dataset.id||"",d=((u=(i=t.querySelector(".col-title"))==null?void 0:i.textContent)==null?void 0:u.toLowerCase())||"",l=((m=(h=t.cells[5])==null?void 0:h.textContent)==null?void 0:m.toLowerCase())||"",a=[...t.querySelectorAll(".tag")].map(g=>{var f;return((f=g.textContent)==null?void 0:f.toLowerCase())||""}).join(" ");return r===e||d.includes(e)||l.includes(e)||a.includes(e)})(),o=H&&t.classList.contains("status-done")&&ge(t.dataset.completedAt||"");t.style.display=s&&!o?"":"none"}),document.querySelectorAll("#list-view .list-card").forEach(t=>{const s=!e||(()=>{var i,u,h;const r=t.dataset.id||"",d=((u=(i=t.querySelector(".list-card-title"))==null?void 0:i.textContent)==null?void 0:u.toLowerCase())||"",l=((h=t.dataset.project)==null?void 0:h.toLowerCase())||"",a=[...t.querySelectorAll(".tag")].map(m=>{var g;return((g=m.textContent)==null?void 0:g.toLowerCase())||""}).join(" ");return r===e||d.includes(e)||l.includes(e)||a.includes(e)})(),o=H&&t.classList.contains("status-done")&&ge(t.dataset.completedAt||"");t.style.display=s&&!o?"":"none"})):(document.querySelectorAll("#chronicle-view .chronicle-event").forEach(t=>{const s=!e||(()=>{var a,i,u;const r=t.dataset.id||"",d=((i=(a=t.querySelector(".chronicle-task-link"))==null?void 0:a.textContent)==null?void 0:i.toLowerCase())||"",l=((u=t.dataset.project)==null?void 0:u.toLowerCase())||"";return r===e||d.includes(e)||l.includes(e)})(),o=H&&ge(t.dataset.completedAt||"");t.style.display=s&&!o?"":"none"}),document.querySelectorAll("#chronicle-view .chronicle-group").forEach(t=>{const s=[...t.querySelectorAll(".chronicle-event")].filter(o=>o.style.display!=="none").length;t.style.display=s>0?"":"none"}))}function Se(e){if(!e||e==="null")return[];try{const n=JSON.parse(e);return Array.isArray(n)?n:[]}catch{return[]}}function dn(e){const n=new Date(e+"Z"),s=new Date().getTime()-n.getTime(),o=Math.floor(s/864e5);return o===0?"today":o===1?"yesterday":o<7?`${o}d ago`:o<30?`${Math.floor(o/7)}w ago`:e.slice(0,10)}function J(e){if(!e||e==="null")return[];try{const n=JSON.parse(e);return Array.isArray(n)?n:[]}catch{return[]}}function pn(e){var M,c;const n=Ue(e.priority),t=n?`<span class="badge ${n}">${e.priority}</span>`:"",s=e.completed_at?`<span class="badge date">${e.completed_at.slice(0,10)}</span>`:e.created_at?`<span class="badge created">${dn(e.created_at)}</span>`:"",o=!j&&e.project?`<span class="badge project">${e.project}</span>`:"",r=Ut[e.status],d=r?`<span class="badge status-${e.status}">${r}</span>`:"",l=`<span class="badge level-${e.level}">L${e.level}</span>`,a=e.current_agent?`<span class="badge agent-tag">${e.current_agent}</span>`:"",i=e.last_review_status?[]:J(e.review_comments),u=e.last_review_status||(i.length>0?(M=i[i.length-1])==null?void 0:M.status:null),h=u?`<span class="badge ${u==="approved"?"review-approved":"review-changes"}">${u==="approved"?"Approved":"Changes Req."}</span>`:e.status==="impl_review"?'<span class="badge review-pending">Awaiting Review</span>':"",m=e.last_plan_review_status?[]:J(e.plan_review_comments),g=e.last_plan_review_status||(m.length>0?(c=m[m.length-1])==null?void 0:c.status:null),f=g?`<span class="badge ${g==="approved"?"review-approved":"review-changes"}">${g==="approved"?"Plan OK":"Plan Changes"}</span>`:e.status==="plan_review"?'<span class="badge review-pending">Plan Review</span>':"",$=Se(e.tags).map(p=>`<span class="tag">${p}</span>`).join(""),b=e.note_count??J(e.notes).length,T=b>0?`<span class="badge notes-count" title="${b} note(s)">💬 ${b}</span>`:"",C=ln(e.level,e.status).map(p=>`<option value="${p}">${Me(p)}</option>`).join(""),A=C?`
      <label class="mobile-card-move card-interactive">
        <span>Move</span>
        <select class="mobile-status-select" data-id="${e.id}" data-project="${e.project}" data-current-status="${e.status}">
          <option value="${e.status}">${Me(e.status)}</option>
          ${C}
        </select>
      </label>
    `:"";return`
    <div class="${_?"card mobile-card":"card"}" ${_?'draggable="false"':'draggable="true"'} data-id="${e.id}" data-status="${e.status}" data-project="${e.project}" data-completed-at="${e.completed_at||""}">
      <div class="card-header">
        <span class="card-id">#${e.id}</span>
        ${l}
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
        ${T}
        ${s}
      </div>
      ${A}
      ${$?`<div class="card-tags">${$}</div>`:""}
    </div>
  `}function un(e,n,t,s,o=s.length){const r=rn(e),d=jt(s,e).map(pn).join(""),l=e==="todo"?'<button class="add-card-btn" id="add-card-btn" title="Add card">+</button>':"",a=o!==s.length?`${s.length}/${o}`:`${o}`;return`
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
          ${l}
        </div>
      </div>
      <div class="column-body" data-column="${e}">
        ${d||'<div class="empty">No items</div>'}
      </div>
    </div>
  `}const mn=/```[\s\S]*?```/g,hn=/```\w*\n?/,pt=/```$/,ut=/^```mermaid\s*\n?/,fn=/\*\*(.+?)\*\*/g,gn=/`([^`]+)`/g,vn=/^\x00CB(\d+)\x00$/,yn=/^### (.+)$/,bn=/^## (.+)$/,$n=/^# (.+)$/,wn=/^[-*]\s+(.+)$/,En=/^\d+\.\s+(.+)$/,mt=/^\|(.+)\|$/,ht=/^\|[\s:-]+\|$/;let Ln=0;function Ee(e){const n=[];let t=e.replace(mn,i=>{if(ut.test(i)){const u=i.replace(ut,"").replace(pt,"").trim(),h=`mermaid-${++Ln}`;n.push(`<pre class="mermaid" id="${h}">${u}</pre>`)}else{const u=i.replace(hn,"").replace(pt,"");n.push(`<pre><code>${u}</code></pre>`)}return`\0CB${n.length-1}\0`});t=t.replace(/</g,"&lt;"),t=t.replace(fn,"<strong>$1</strong>").replace(gn,"<code>$1</code>");const s=t.split(`
`),o=[];let r=!1,d=!1;function l(){r&&(o.push("</ul>"),r=!1),d&&(o.push("</ol>"),d=!1)}let a=0;for(;a<s.length;){const i=s[a].trim(),u=i.match(vn);if(u){l(),o.push(n[parseInt(u[1])]),a++;continue}if(mt.test(i)){l();const b=[];for(;a<s.length&&mt.test(s[a].trim());)b.push(s[a].trim()),a++;if(b.length>=2){const T=ht.test(b[1]),C=T?b[0]:null,A=T?2:0;let D='<table class="md-table">';if(C){const U=C.slice(1,-1).split("|").map(M=>M.trim());D+="<thead><tr>"+U.map(M=>`<th>${M}</th>`).join("")+"</tr></thead>"}D+="<tbody>";for(let U=A;U<b.length;U++){if(ht.test(b[U]))continue;const M=b[U].slice(1,-1).split("|").map(c=>c.trim());D+="<tr>"+M.map(c=>`<td>${c}</td>`).join("")+"</tr>"}D+="</tbody></table>",o.push(D)}else o.push(`<p>${b[0]}</p>`);continue}const h=i.match(yn);if(h){l(),o.push(`<h3>${h[1]}</h3>`),a++;continue}const m=i.match(bn);if(m){l(),o.push(`<h2>${m[1]}</h2>`),a++;continue}const g=i.match($n);if(g){l(),o.push(`<h1>${g[1]}</h1>`),a++;continue}const f=i.match(wn);if(f){d&&(o.push("</ol>"),d=!1),r||(o.push("<ul>"),r=!0),o.push(`<li>${f[1]}</li>`),a++;continue}const $=i.match(En);if($){r&&(o.push("</ul>"),r=!1),d||(o.push("<ol>"),d=!0),o.push(`<li>${$[1]}</li>`),a++;continue}l(),i===""?o.push(""):o.push(`<p>${i}</p>`),a++}return l(),o.join(`
`)}async function In(e){const n=window.__mermaid;if(!n)return;const t=e.querySelectorAll("pre.mermaid");if(t.length!==0)try{await n.run({nodes:t})}catch(s){console.warn("Mermaid render failed:",s)}}function ke(e,n,t,s,o){if(!s&&!o)return"";const r=s?Ee(s):'<span class="phase-empty">Not yet documented</span>';return`
    <div class="lifecycle-phase ${t} ${o?"active":""}">
      <div class="phase-header">
        <span class="phase-icon">${n}</span>
        <span class="phase-label">${e}</span>
        <button class="phase-expand-btn" title="Expand to full screen">&#x26F6;</button>
      </div>
      <div class="phase-body">${r}</div>
    </div>
  `}function ft(e){return e.length===0?"":e.map(n=>{var t;return`
    <div class="review-entry ${n.status}">
      <div class="review-header">
        <span class="badge ${n.status==="approved"?"review-approved":"review-changes"}">
          ${n.status==="approved"?"Approved":"Changes Requested"}
        </span>
        <span class="review-meta">${n.reviewer||""} &middot; ${((t=n.timestamp)==null?void 0:t.slice(0,16))||""}</span>
      </div>
      <div class="review-comment">${Ee(n.comment||"")}</div>
    </div>
  `}).join("")}function Cn(e){return e.length===0?"":e.map(n=>{var t;return`
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
      ${n.comment?`<div class="review-comment">${Ee(n.comment)}</div>`:""}
    </div>
  `}).join("")}async function Sn(e,n=1920,t=.82){return new Promise((s,o)=>{const r=new Image,d=URL.createObjectURL(e);r.onload=()=>{URL.revokeObjectURL(d);let{width:l,height:a}=r;(l>n||a>n)&&(l>a?(a=Math.round(a*n/l),l=n):(l=Math.round(l*n/a),a=n));const i=document.createElement("canvas");i.width=l,i.height=a,i.getContext("2d").drawImage(r,0,0,l,a),s(i.toDataURL("image/jpeg",t))},r.onerror=()=>{URL.revokeObjectURL(d),o(new Error("Image load failed"))},r.src=d})}async function Re(e,n,t){var s,o;for(const r of Array.from(n)){if(!r.type.startsWith("image/"))continue;let d;try{d=await Sn(r)}catch{d=await new Promise(u=>{const h=new FileReader;h.onload=()=>u(h.result),h.readAsDataURL(r)})}const l=(o=(s=r.name.match(/\.[^.]+$/))==null?void 0:s[0])==null?void 0:o.toLowerCase(),a=l===".jpg"||l===".jpeg"||l===".png"||l===".webp"||l===".gif"||l===".svg"?r.name:r.name.replace(/\.[^.]+$/,"")+".jpg",i=await x(`/api/task/${e}/attachment?project=${encodeURIComponent(t)}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({filename:a,data:d})});if(!i.ok){const u=await i.json().catch(()=>({}));_e(u.error||`Upload failed (${i.status})`);return}}z(e,t)}async function z(e,n){var r;const t=document.getElementById("modal-overlay"),s=document.getElementById("modal-content");s.innerHTML='<div style="color:#94a3b8">Loading...</div>',t.classList.remove("hidden"),K();try{const d=n?`?project=${encodeURIComponent(n)}`:"",a=await(await x(`/api/task/${e}${d}`)).json(),i=document.querySelector(`.card[data-id="${a.id}"][data-project="${CSS.escape(a.project)}"]`);i&&i.dataset.status!==a.status&&(Xe(),q());const u=Se(a.tags),h=u.length?`<div class="modal-tags">${u.map(v=>`<span class="tag">${v}</span>`).join("")}</div>`:"",m=[`<strong>Project:</strong> ${a.project}`,`<strong>Status:</strong> ${a.status}`,`<strong>Priority:</strong> ${a.priority}`,`<strong>Created:</strong> ${((r=a.created_at)==null?void 0:r.slice(0,10))||"-"}`,a.started_at?`<strong>Started:</strong> ${a.started_at.slice(0,10)}`:"",a.planned_at?`<strong>Planned:</strong> ${a.planned_at.slice(0,10)}`:"",a.reviewed_at?`<strong>Reviewed:</strong> ${a.reviewed_at.slice(0,10)}`:"",a.tested_at?`<strong>Tested:</strong> ${a.tested_at.slice(0,10)}`:"",a.completed_at?`<strong>Completed:</strong> ${a.completed_at.slice(0,10)}`:""].filter(Boolean).join(" &nbsp;|&nbsp; "),g={1:{labels:["Req","Impl","Done"],statuses:["todo","impl","done"]},2:{labels:["Req","Plan","Impl","Review","Done"],statuses:["todo","plan","impl","impl_review","done"]},3:{labels:["Req","Plan","Plan Rev","Impl","Impl Rev","Test","Done"],statuses:["todo","plan","plan_review","impl","impl_review","test","done"]}},f=g[a.level]||g[3],$=Math.max(0,f.statuses.indexOf(a.status)),b=`
      <div class="lifecycle-progress">
        <span class="level-indicator">L${a.level}</span>
        ${f.labels.map((v,w)=>`
          <div class="progress-step ${w<$?"completed":""} ${w===$?"current":""}">
            <div class="step-dot"></div>
            <span class="step-label">${v}</span>
          </div>
        `).join('<div class="progress-line"></div>')}
      </div>
    `,T=J(a.attachments),C=T.length>0?`<div class="attachments-grid">${T.map(v=>`<div class="attachment-thumb" data-stored="${v.storedName}">
            <img src="${v.url}" alt="${v.filename}" loading="lazy" />
            <button class="attachment-remove" data-id="${e}" data-name="${v.storedName}" title="Remove">&times;</button>
            <span class="attachment-name">${v.filename}</span>
          </div>`).join("")}</div>`:"",A=a.description?Ee(a.description):'<span class="phase-empty">Not yet documented</span>',D=[1,2,3].map(v=>`<option value="${v}" ${v===a.level?"selected":""}>L${v}</option>`).join(""),U=`
      <div class="lifecycle-phase phase-requirement ${$===0?"active":""}">
        <div class="phase-header">
          <span class="phase-icon">📋</span>
          <span class="phase-label">Requirements</span>
          <select class="level-select" id="level-select" title="Pipeline Level">${D}</select>
          <button class="phase-edit-btn" id="req-edit-btn" title="Edit">&#9998;</button>
          <button class="phase-expand-btn" title="Expand to full screen">&#x26F6;</button>
        </div>
        <div class="phase-body" id="req-body-view">
          ${A}
          ${C}
        </div>
        <div class="phase-body hidden" id="req-body-edit">
          <textarea id="req-textarea" rows="8">${(a.description||"").replace(/</g,"&lt;")}</textarea>
          <div class="attachment-drop-zone" id="attachment-drop-zone">
            <span>📎 Drop images, paste (⌘V), or click to attach</span>
            <input type="file" id="attachment-input" accept="image/*" multiple hidden />
          </div>
          ${C?`<div id="edit-attachments">${C}</div>`:""}
          <div class="phase-edit-actions">
            <button class="phase-save-btn" id="req-save-btn">Save</button>
            <button class="phase-cancel-btn" id="req-cancel-btn">Cancel</button>
          </div>
        </div>
      </div>
    `,M=ke("Plan","🗺️","phase-plan",a.plan,$===1&&!a.plan);let c="";a.decision_log&&(c=ke("Decision Log","🧭","phase-decision-log",a.decision_log,!1));let p="";a.done_when&&(p=ke("Done When","🎯","phase-done-when",a.done_when,!1));const y=J(a.plan_review_comments),E=ft(y);let k="";(E||$===2)&&(k=`
        <div class="lifecycle-phase phase-plan-review ${$===2?"active":""}">
          <div class="phase-header">
            <span class="phase-icon">🔍</span>
            <span class="phase-label">Plan Review</span>
            ${a.plan_review_count>0?`<span class="review-count">${a.plan_review_count} review(s)</span>`:""}
            <button class="phase-expand-btn" title="Expand to full screen">&#x26F6;</button>
          </div>
          <div class="phase-body">${E||'<span class="phase-empty">Awaiting plan review</span>'}</div>
        </div>
      `);const O=ke("Implementation","🔨","phase-impl",a.implementation_notes,$===3&&!a.implementation_notes),R=J(a.review_comments),G=ft(R);let Ae="";(G||$===4)&&(Ae=`
        <div class="lifecycle-phase phase-review ${$===4?"active":""}">
          <div class="phase-header">
            <span class="phase-icon">📝</span>
            <span class="phase-label">Implementation Review</span>
            ${a.impl_review_count>0?`<span class="review-count">${a.impl_review_count} review(s)</span>`:""}
            <button class="phase-expand-btn" title="Expand to full screen">&#x26F6;</button>
          </div>
          <div class="phase-body">${G||'<span class="phase-empty">Awaiting implementation review</span>'}</div>
        </div>
      `);const Fe=J(a.test_results),me=Cn(Fe);let te="";(me||$===5)&&(te=`
        <div class="lifecycle-phase phase-test ${$===5?"active":""}">
          <div class="phase-header">
            <span class="phase-icon">🧪</span>
            <span class="phase-label">Test Results</span>
            <button class="phase-expand-btn" title="Expand to full screen">&#x26F6;</button>
          </div>
          <div class="phase-body">${me||'<span class="phase-empty">Awaiting test execution</span>'}</div>
        </div>
      `);const ne=J(a.agent_log);let nt="";if(ne.length>0){let v=function(L){if(!L)return{name:"",model:null};const fe=L.toLowerCase();for(const ze of w){const ae=fe.lastIndexOf(ze);if(ae>0){let se=ae;for(;se>0&&(L[se-1]==="-"||L[se-1]==="_");)se--;return{name:L.slice(0,se),model:L.slice(ae)}}}return{name:L,model:null}};var o=v;const w=["opus","sonnet","haiku","gemini","copilot","gpt"],S=ne.map(L=>{var ct;const{name:fe,model:ze}=v(L.agent||""),ae=L.model||ze,se=ae?`<span class="badge model-tag model-${ae.toLowerCase()}">${ae}</span>`:"";return`
          <div class="agent-log-entry">
            <span class="agent-log-time">${((ct=L.timestamp)==null?void 0:ct.slice(0,16))||""}</span>
            <span class="badge agent-tag">${fe||L.agent||""}</span>
            ${se}
            <span class="agent-log-msg">${L.message||""}</span>
          </div>
        `}).join("");nt=`
        <details class="lifecycle-phase phase-agent-log">
          <summary class="phase-header">
            <span class="phase-icon">🤖</span>
            <span class="phase-label">Agent Log</span>
            <span class="review-count">${ne.length} entries</span>
          </summary>
          <div class="phase-body agent-log-body">${S}</div>
        </details>
      `}const at=J(a.notes),kt=at.map(v=>{var w;return`
      <div class="note-entry">
        <div class="note-header">
          <span class="note-author">${v.author||"user"}</span>
          <span class="note-time">${((w=v.timestamp)==null?void 0:w.slice(0,16).replace("T"," "))||""}</span>
          <button class="note-delete" data-note-id="${v.id}" title="Delete">&times;</button>
        </div>
        <div class="note-text">${Ee(v.text||"")}</div>
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
      <div class="modal-meta">${m}</div>
      ${h}
      ${b}
      <div class="lifecycle-sections">
        ${U}
        ${M}
        ${c}
        ${p}
        ${k}
        ${O}
        ${Ae}
        ${te}
        ${nt}
      </div>
      ${Rt}
      <div class="modal-danger-zone">
        <button class="delete-task-btn" id="delete-task-btn">Delete Card</button>
      </div>
    `,In(s),s.querySelectorAll(".phase-expand-btn").forEach(v=>{v.addEventListener("click",w=>{w.stopPropagation();const S=v.closest(".lifecycle-phase");S==null||S.requestFullscreen().catch(()=>{})})});const st=document.getElementById("level-select");st.addEventListener("change",async()=>{const v=parseInt(st.value);await x(`/api/task/${e}?project=${encodeURIComponent(a.project)}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({level:v})}),V(a.project),z(e,a.project)}),document.getElementById("delete-task-btn").addEventListener("click",async()=>{confirm(`Delete card #${a.id} "${a.title}"?`)&&(await x(`/api/task/${e}?project=${encodeURIComponent(a.project)}`,{method:"DELETE"}),V(a.project),document.getElementById("modal-overlay").classList.add("hidden"),q())});const xt=document.getElementById("req-edit-btn"),ot=document.getElementById("req-body-view"),it=document.getElementById("req-body-edit"),Ve=document.getElementById("req-textarea"),rt=document.getElementById("req-save-btn"),Pt=document.getElementById("req-cancel-btn");xt.addEventListener("click",()=>{ot.classList.add("hidden"),it.classList.remove("hidden"),Ve.focus()}),Pt.addEventListener("click",()=>{Ve.value=a.description||"",it.classList.add("hidden"),ot.classList.remove("hidden")}),rt.addEventListener("click",async()=>{const v=Ve.value;rt.textContent="Saving...",await x(`/api/task/${e}?project=${encodeURIComponent(a.project)}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({description:v})}),V(a.project),z(e,a.project)});const Z=document.getElementById("attachment-drop-zone"),he=document.getElementById("attachment-input");Z&&he&&(Z.addEventListener("click",()=>he.click()),Z.addEventListener("dragover",v=>{v.preventDefault(),Z.classList.add("drop-active")}),Z.addEventListener("dragleave",()=>{Z.classList.remove("drop-active")}),Z.addEventListener("drop",async v=>{var S;v.preventDefault(),Z.classList.remove("drop-active");const w=(S=v.dataTransfer)==null?void 0:S.files;w&&await Re(e,w,a.project)}),he.addEventListener("change",async()=>{he.files&&await Re(e,he.files,a.project)})),s.addEventListener("paste",async v=>{var S;const w=Array.from(((S=v.clipboardData)==null?void 0:S.files)??[]).filter(L=>L.type.startsWith("image/"));w.length!==0&&(v.preventDefault(),await Re(e,w,a.project))}),s.querySelectorAll(".attachment-remove").forEach(v=>{v.addEventListener("click",async w=>{w.stopPropagation();const S=v,L=S.dataset.id,fe=S.dataset.name;await x(`/api/task/${L}/attachment/${encodeURIComponent(fe)}?project=${encodeURIComponent(a.project)}`,{method:"DELETE"}),z(e,a.project)})});const qt=document.getElementById("note-form"),lt=document.getElementById("note-input");qt.addEventListener("submit",async v=>{v.preventDefault();const w=lt.value.trim();w&&(lt.disabled=!0,await x(`/api/task/${e}/note?project=${encodeURIComponent(a.project)}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({text:w})}),V(a.project),z(e,a.project))}),s.querySelectorAll(".note-delete").forEach(v=>{v.addEventListener("click",async w=>{w.stopPropagation();const S=v.dataset.noteId;await x(`/api/task/${e}/note/${S}?project=${encodeURIComponent(a.project)}`,{method:"DELETE"}),V(a.project),z(e,a.project)})})}catch{s.innerHTML='<div style="color:#ef4444">Failed to load</div>'}}function _t(e){if(!e)return new Date(NaN);let n=e.replace(" ","T");return n.length===10?n+="T00:00:00Z":/Z$|[+-]\d{2}:\d{2}$/.test(n)||(n+="Z"),new Date(n)}function jn(e){const n=_t(e);if(isNaN(n.getTime()))return"Unknown";const t=n.getUTCDay()||7;n.setUTCDate(n.getUTCDate()+4-t);const s=new Date(Date.UTC(n.getUTCFullYear(),0,1)),o=Math.ceil(((n.getTime()-s.getTime())/864e5+1)/7);return`${n.getUTCFullYear()}-W${String(o).padStart(2,"0")}`}function _n(e){const n=_t(e);if(isNaN(n.getTime()))return e.slice(0,10)||"—";const t=n.toLocaleDateString(void 0,{month:"short",day:"numeric",timeZone:"UTC"}),s=n.toLocaleTimeString(void 0,{hour:"2-digit",minute:"2-digit",timeZone:"UTC",hour12:!1});return`${t}
${s}`}function Bn(e){const n=Ue(e.priority),t=!j&&e.project?`<span class="badge project">${e.project}</span>`:"",s=n?`<span class="badge ${n}">${e.priority}</span>`:"",o=`<span class="badge status-${e.status}">${Me(e.status)}</span>`;return`
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
    </div>`}function Tn(e){var u,h;const n=Ue(e.priority),t=n?`<span class="badge ${n}">${e.priority}</span>`:"",s=!j&&e.project?`<span class="badge project">${e.project}</span>`:"",o=`<span class="badge status-${e.status}">${Me(e.status)}</span>`,r=`<span class="badge level-${e.level}">L${e.level}</span>`,d=((u=e.created_at)==null?void 0:u.slice(0,10))||"",l=((h=e.completed_at)==null?void 0:h.slice(0,10))||"—",i=Se(e.tags).map(m=>`<span class="tag">${m}</span>`).join("");return`
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
        <span>Done ${l}</span>
      </div>
      <div class="list-card-controls">
        <label>
          <span>Status</span>
          <select class="list-status-select" data-id="${e.id}" data-field="status">
            ${Y.map(m=>`<option value="${m.key}" ${m.key===e.status?"selected":""}>${m.label}</option>`).join("")}
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
  `}async function Bt(){const e=document.getElementById("chronicle-view");try{const n=await ue("full");et(n.projects);const t=[];for(const d of Y)for(const l of n[d.key])t.push(l);const s=t.filter(d=>!!d.completed_at).sort((d,l)=>l.completed_at.localeCompare(d.completed_at)),o=new Map;for(const d of s){const l=jn(d.completed_at);o.has(l)||o.set(l,[]),o.get(l).push(d)}if(o.size===0){e.innerHTML=`
        <div style="display:flex;align-items:center;justify-content:center;color:#64748b;font-size:0.9rem;padding:64px">
          No completed tasks yet
        </div>`;return}const r=[...o.entries()].map(([d,l])=>{const a=l.map(Bn).join("");return`
        <div class="chronicle-group">
          <div class="chronicle-week-header">${d}</div>
          <div class="chronicle-events">${a}</div>
        </div>`}).join("");e.innerHTML=`<div class="chronicle-timeline">${r}</div>`,e.querySelectorAll(".chronicle-task-link").forEach(d=>{d.addEventListener("click",l=>{l.stopPropagation();const a=parseInt(d.dataset.id),i=d.dataset.project||void 0;z(a,i)})})}catch(n){console.error("loadChronicleView failed:",n),e.innerHTML=`
      <div style="display:flex;align-items:center;justify-content:center;color:#ef4444;font-size:0.9rem;padding:48px">
        Failed to load chronicle
      </div>`}}async function Ne(){const e=document.getElementById("graph-view"),n=e.getBoundingClientRect().top;e.style.height=`${window.innerHeight-n}px`,e.innerHTML=`
    <div class="graph-placeholder">
      <div class="graph-spinner"></div>
      <p>Loading graph&hellip;</p>
    </div>`,ie&&(ie.pauseAnimation(),ie=null),X&&(X.disconnect(),X=null);const t={react:"#61dafb",nextjs:"#ffffff",typescript:"#3178c6",tailwind:"#38bdf8","react-query":"#ff4154",vite:"#a855f7",shadcn:"#f8fafc",zustand:"#764abc",hotwire:"#cc0000",css:"#264de4",fastapi:"#009688",rails:"#cc0000",python:"#3572a5",nodejs:"#68a063",ruby:"#cc342d",postgresql:"#336791",sqlite:"#003b57",neon:"#00e599",supabase:"#3ecf8e",timescaledb:"#fdb515",influxdb:"#22adf6",drizzle:"#c5f74f",prisma:"#5a67d8",sqlalchemy:"#d71f00",oracle:"#f80000",auth:"#f59e0b","auth.js":"#f59e0b",oauth:"#f97316",docker:"#2496ed","docker-compose":"#2496ed",vercel:"#ffffff",deploy:"#10b981",kamal:"#10b981",gcp:"#4285f4",azure:"#0078d4","ci-cd":"#f05032",mobile:"#a78bfa",capacitor:"#119eff",pwa:"#5a0fc8",api:"#64748b",modbus:"#e67e22",realtime:"#ef4444",webhook:"#6366f1",ai:"#f59e0b",testing:"#22c55e",storage:"#0ea5e9",s3:"#ff9900",r2:"#f38020",pdf:"#e53e3e",excel:"#217346",performance:"#f97316",cache:"#8b5cf6",migration:"#ec4899",maps:"#34a853",gps:"#34a853",visualization:"#06b6d4",dashboard:"#06b6d4",canvas:"#f59e0b",graph:"#06b6d4",chart:"#06b6d4",modal:"#94a3b8",refactor:"#a3a3a3",kanban:"#818cf8",obsidian:"#7c3aed","cycling-data":"#10b981",euv:"#e11d48",plc:"#e11d48",schema:"#64748b"},s=["react","nextjs","typescript","fastapi","rails","python","nodejs","postgresql","sqlite","neon","supabase","timescaledb","influxdb","drizzle","prisma","sqlalchemy","oracle","auth","auth.js","oauth","docker","docker-compose","vercel","deploy","kamal","gcp","azure","ci-cd","mobile","capacitor","pwa","api","modbus","realtime","webhook","ai","testing","storage","s3","r2","pdf","excel","performance","cache","migration","maps","gps","visualization","dashboard","canvas","graph","chart","modal","refactor","kanban","obsidian","cycling-data","euv","plc","schema"];function o(l){const a=l.map(i=>i.toLowerCase());for(const i of s)if(a.includes(i))return i;return a.find(i=>i in t)??null}const r={1:9,2:16,3:25},d={todo:"#475569",plan:"#3b82f6",impl:"#8b5cf6",impl_review:"#6366f1",plan_review:"#a855f7",test:"#f59e0b",done:"#22c55e"};try{const[{default:l},a]=await Promise.all([Dt(()=>import("./force-graph-B6EEfo0M.js"),[]),ue("full")]),i=[];for(const c of Y){const p=a[c.key];for(const y of p)i.push({...y,_status:c.key})}let u=i,h="";i.length>300?(u=i.filter(c=>c._status!=="done"),h=`<div style="position:absolute;top:8px;left:50%;transform:translateX(-50%);z-index:10;background:#1e293b;color:#f59e0b;padding:4px 12px;border-radius:6px;font-size:0.8rem;border:1px solid #f59e0b40">${i.length} nodes — done tasks hidden for performance</div>`):H&&(u=i.filter(c=>!(c._status==="done"&&ge(c.completed_at||""))));const m=pe.toLowerCase().replace(/^#/,""),g=u.map(c=>({id:c.id,title:`#${c.id} ${c.title}`,status:c._status,level:c.level??1,tags:Se(c.tags),priority:c.priority||"medium",project:c.project})),f=new Map;for(const c of g)for(const p of c.tags){const y=p.toLowerCase();f.has(y)||f.set(y,[]),f.get(y).push(c.id)}const $=new Map;for(const[,c]of f)for(let p=0;p<c.length;p++)for(let y=p+1;y<c.length;y++){const E=Math.min(c[p],c[y]),k=Math.max(c[p],c[y]),O=`${E}-${k}`;$.set(O,($.get(O)||0)+1)}const b=new Set,T=[];for(const[c,p]of f)for(let y=0;y<p.length;y++)for(let E=y+1;E<p.length;E++){const k=Math.min(p[y],p[E]),O=Math.max(p[y],p[E]),R=`${k}-${O}`;b.has(R)||(b.add(R),T.push({source:k,target:O,tag:c,sharedCount:$.get(R)||1}))}e.innerHTML=h,e.style.position="relative",e.style.padding="0",e.style.overflow="hidden";const C=document.createElement("div");C.style.cssText="position:absolute;inset:0;width:100%;height:100%",e.appendChild(C);const A=document.createElement("div");A.className="graph-tooltip",e.appendChild(A),e.addEventListener("mousemove",c=>{const p=e.getBoundingClientRect();A.style.left=`${c.clientX-p.left+12}px`,A.style.top=`${c.clientY-p.top+12}px`});const D=l()(C).backgroundColor("#0f172a").nodeId("id").nodeLabel(()=>"").nodeVal(c=>r[c.level]||r[1]).nodeCanvasObject((c,p,y)=>{const E=Math.sqrt(r[c.level]||r[1])*2,k=c.x??0,O=c.y??0;let R=1;m?R=c.title.toLowerCase().includes(m)||c.tags.some(ne=>ne.toLowerCase().includes(m))?1:.15:c.status==="done"&&(R=.35),p.globalAlpha=R;const G=o(c.tags),Ae=G?t[G]??"#334155":"#334155";p.beginPath(),p.arc(k,O,E,0,2*Math.PI),p.fillStyle=Ae,p.fill();const Fe=d[c.status]??"#475569";p.beginPath(),p.arc(k,O,E+1.5/y,0,2*Math.PI),p.strokeStyle=Fe,p.lineWidth=1.5/y,p.stroke();const me=G??c.tags[0]??"";if(me){const te=Math.max(2,10/y);p.font=`600 ${te}px sans-serif`,p.fillStyle=R<.5?"rgba(148,163,184,0.15)":G?t[G]??"#94a3b8":"#94a3b8",p.textAlign="center",p.textBaseline="top",p.fillText(me,k,O+E+2/y)}if(y>2.5){const te=c.title.replace(/^#\d+\s*/,"").slice(0,30),ne=9/y;p.font=`${ne}px sans-serif`,p.fillStyle=R<.5?"rgba(148,163,184,0.2)":"#64748b",p.textAlign="center",p.textBaseline="bottom",p.fillText(te,k,O-E-2/y)}p.globalAlpha=1}).nodePointerAreaPaint((c,p,y)=>{const E=Math.sqrt(r[c.level]||r[1])*2+2;y.beginPath(),y.arc(c.x??0,c.y??0,E,0,2*Math.PI),y.fillStyle=p,y.fill()}).onNodeClick(c=>{z(c.id,c.project)}).onNodeHover(c=>{if(C.style.cursor=c?"pointer":"default",!c){A.style.display="none";return}const p=o(c.tags),y=p?t[p]??null:null,E=p?`<span style="background:${y};color:#0f172a;padding:1px 7px;border-radius:4px;font-weight:600">${p}</span>`:"",k=c.tags.filter(R=>R.toLowerCase()!==p).slice(0,3),O=k.length?`<div class="graph-tooltip-tags">${k.map(R=>`<span>${R}</span>`).join("")}</div>`:"";A.innerHTML=`
          <div class="graph-tooltip-title">${c.title}</div>
          <div class="graph-tooltip-meta" style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">
            ${E}
            <span>${c.status} &middot; ${c.priority} &middot; L${c.level}</span>
          </div>
          ${O}`,A.style.display="block"}).linkColor(c=>t[c.tag.toLowerCase()]??"#334155").linkWidth(c=>Math.min(1.5+(c.sharedCount-1)*.8,4)).d3AlphaDecay(.02).d3VelocityDecay(.3).warmupTicks(100).cooldownTime(5e3).width(e.offsetWidth||window.innerWidth).height(window.innerHeight-e.getBoundingClientRect().top).graphData({nodes:g,links:T});ie=D;const U=new Set(g.flatMap(c=>c.tags.map(p=>p.toLowerCase()))),M=s.filter(c=>U.has(c)&&c in t).slice(0,16);if(M.length>0){const c=document.createElement("div");c.className="graph-legend",c.innerHTML=M.map(p=>`<div class="graph-legend-item"><span style="background:${t[p]}"></span>${p}</div>`).join(""),e.appendChild(c)}X=new ResizeObserver(()=>{const c=e.offsetWidth,p=window.innerHeight-e.getBoundingClientRect().top;c>0&&p>0&&(e.style.height=`${p}px`,D.width(c).height(p))}),X.observe(document.documentElement)}catch(l){console.error("loadGraphView failed:",l),e.innerHTML=`
      <div class="graph-placeholder">
        <p style="color:#ef4444;font-size:0.9rem">Failed to load graph</p>
      </div>`}}async function je(){var n,t,s,o,r,d,l,a;const e=document.getElementById("board");try{const i=await ue(Je()?"full":"board");on(i),et(i.projects),e.innerHTML=Y.map(g=>{var f;return un(g.key,g.label,g.icon,i[g.key],((f=i.counts)==null?void 0:f[g.key])??i[g.key].length)}).join("");const u=((n=i.counts)==null?void 0:n.done)??i.done.length,h=i.total??(((t=i.counts)==null?void 0:t.todo)??i.todo.length)+(((s=i.counts)==null?void 0:s.plan)??i.plan.length)+(((o=i.counts)==null?void 0:o.plan_review)??i.plan_review.length)+(((r=i.counts)==null?void 0:r.impl)??i.impl.length)+(((d=i.counts)==null?void 0:d.impl_review)??i.impl_review.length)+(((l=i.counts)==null?void 0:l.test)??i.test.length)+(((a=i.counts)==null?void 0:a.done)??i.done.length);document.getElementById("count-summary").textContent=`${u}/${h} completed`,e.querySelectorAll(".card").forEach(g=>{g.addEventListener("click",f=>{if(f.target.closest(".card-interactive")){f.stopPropagation();return}const b=f.target.closest(".card-copy-btn");if(b){f.stopPropagation(),navigator.clipboard.writeText(b.dataset.copy).then(()=>{const A=b.textContent;b.textContent="✓",setTimeout(()=>{b.textContent=A},1e3)});return}const T=parseInt(g.dataset.id),C=g.dataset.project;z(T,C)})}),_||Rn(),An(),He();const m=document.getElementById("add-card-btn");m&&m.addEventListener("click",g=>{g.stopPropagation(),document.getElementById("add-card-overlay").classList.remove("hidden"),K(),_||document.getElementById("add-title").focus()})}catch(i){console.error("loadBoard failed:",i),e.innerHTML=`
      <div style="grid-column:1/-1;display:flex;align-items:center;justify-content:center;color:#ef4444;font-size:0.9rem;padding:48px">
        Cannot find .claude/kanban.db
      </div>
    `}}function An(){document.querySelectorAll("[data-column-toggle]").forEach(e=>{e.addEventListener("click",n=>{if(!_)return;n.stopPropagation();const t=e.dataset.columnToggle;if(!t)return;ee.has(t)?ee.delete(t):ee.add(t),St();const s=e.closest(".column"),o=ee.has(t)||!!pe.trim();s&&s.setAttribute("data-mobile-expanded",String(o)),e.setAttribute("aria-expanded",String(o));const r=e.querySelector(".column-toggle-icon");r&&(r.textContent=o?"−":"+")})}),document.querySelectorAll(".mobile-status-select").forEach(e=>{e.addEventListener("click",n=>n.stopPropagation()),e.addEventListener("change",async n=>{n.stopPropagation();const t=e.value,s=parseInt(e.dataset.id||"",10),o=e.dataset.project||"",r=e.dataset.currentStatus||"";!s||!o||await cn({id:s,project:o,status:r},t)})})}async function De(){const e=document.getElementById("list-view");try{const n=await ue("full");et(n.projects);const t=[];for(const a of Y)for(const i of n[a.key])t.push(i);const s=Q==="default"?[...t].sort((a,i)=>i.id-a.id):jt(t),o=s.length,r=s.filter(a=>a.status==="done").length;document.getElementById("count-summary").textContent=`${r}/${o} completed`;const d=s.map(a=>{var m,g;const i=Ue(a.priority),h=Se(a.tags).map(f=>`<span class="tag">${f}</span>`).join("");return`
        <tr class="status-${a.status}" data-id="${a.id}" data-project="${a.project}" data-completed-at="${a.completed_at||""}">
          <td class="col-id">#${a.id}</td>
          <td class="col-title">${a.title}</td>
          <td>
            <select class="list-status-select" data-id="${a.id}" data-field="status">
              ${Y.map(f=>`<option value="${f.key}" ${f.key===a.status?"selected":""}>${f.icon} ${f.label}</option>`).join("")}
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
    `,e.querySelectorAll("select").forEach(a=>{a.addEventListener("change",async i=>{i.stopPropagation();const u=a,h=u.dataset.id,m=u.dataset.field;let g=u.value;m==="level"&&(g=parseInt(g));const f=u.closest("tr"),$=(f==null?void 0:f.dataset.project)||"",b=await x(`/api/task/${h}?project=${encodeURIComponent($)}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({[m]:g})});if(!b.ok){const T=await b.json().catch(()=>({}));T.error&&_e(T.error),De();return}V($),De()})}),e.querySelectorAll(".col-title").forEach(a=>{a.addEventListener("click",i=>{i.stopPropagation();const u=a.closest("[data-id]"),h=parseInt(u.dataset.id),m=u.dataset.project;z(h,m)})}),He()}catch(n){console.error("loadListView failed:",n),e.innerHTML=`
      <div style="display:flex;align-items:center;justify-content:center;color:#ef4444;font-size:0.9rem;padding:48px">
        Failed to load task list
      </div>
    `}}function et(e){const n=document.getElementById("project-filter");if(e.length<=1){n.innerHTML=e[0]?`<span class="project-label">${e[0]}</span>`:"";return}const t=e.map(s=>`<option value="${s}" ${s===j?"selected":""}>${s}</option>`).join("");n.innerHTML=`
    <select id="project-select">
      <option value="">All Projects</option>
      ${t}
    </select>
  `,document.getElementById("project-select").addEventListener("change",s=>{j=s.target.value||null,j?localStorage.setItem("kanban-project",j):localStorage.removeItem("kanban-project"),P=null,oe=null,q()})}function gt(e,n){const t=[...e.querySelectorAll(".card:not(.dragging)")];for(const s of t){const o=s.getBoundingClientRect(),r=o.top+o.height/2;if(n<r)return s}return null}function xe(){document.querySelectorAll(".drop-indicator").forEach(e=>e.remove())}function kn(e,n){xe();const t=document.createElement("div");t.className="drop-indicator",n?e.insertBefore(t,n):e.appendChild(t)}function Rn(){const e=document.querySelectorAll(".card"),n=document.querySelectorAll(".column-body");e.forEach(t=>{t.addEventListener("dragstart",s=>{const o=s,r=t;o.dataTransfer.setData("text/plain",`${r.dataset.project}:${r.dataset.id}`),r.classList.add("dragging"),qe=!0}),t.addEventListener("dragend",()=>{t.classList.remove("dragging"),xe(),qe=!1})}),n.forEach(t=>{t.addEventListener("dragover",s=>{s.preventDefault();const o=t;o.classList.add("drag-over");const r=gt(o,s.clientY);kn(o,r)}),t.addEventListener("dragleave",s=>{const o=t;o.contains(s.relatedTarget)||(o.classList.remove("drag-over"),xe())}),t.addEventListener("drop",async s=>{s.preventDefault();const o=t;o.classList.remove("drag-over"),xe();const r=s,d=r.dataTransfer.getData("text/plain"),l=d.lastIndexOf(":"),a=l>=0?d.slice(0,l):"",i=parseInt(l>=0?d.slice(l+1):d),u=o.dataset.column,h=gt(o,r.clientY),m=[...o.querySelectorAll(".card:not(.dragging)")];let g=null,f=null;if(h){f=parseInt(h.dataset.id);const b=m.indexOf(h);b>0&&(g=parseInt(m[b-1].dataset.id))}else m.length>0&&(g=parseInt(m[m.length-1].dataset.id));const $=await x(`/api/task/${i}/reorder?project=${encodeURIComponent(a)}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({status:u,afterId:g,beforeId:f})});if(!$.ok){const b=await $.json().catch(()=>({}));b.error&&_e(b.error)}V(a),je()})})}function _e(e){const n=document.querySelector(".toast");n&&n.remove();const t=document.createElement("div");t.className="toast",t.textContent=e,document.body.appendChild(t),setTimeout(()=>t.remove(),3e3)}async function Tt(){try{const n=await(await x("/api/info")).json();n.projectName&&(document.title=`Kanban · ${n.projectName}`,document.querySelector("header h1").textContent=`Kanban · ${n.projectName}`)}catch{}}function Be(e){I=e,localStorage.setItem(Ke,I);const n=document.getElementById("board"),t=document.getElementById("list-view"),s=document.getElementById("chronicle-view"),o=document.getElementById("graph-view");e!=="graph"&&(X&&(X.disconnect(),X=null),ie&&(ie.pauseAnimation(),ie=null)),n.classList.add("hidden"),t.classList.add("hidden"),s.classList.add("hidden"),o.classList.add("hidden"),document.getElementById("tab-board").classList.remove("active"),document.getElementById("tab-list").classList.remove("active"),document.getElementById("tab-chronicle").classList.remove("active"),document.getElementById("tab-graph").classList.remove("active"),e==="board"?(n.classList.remove("hidden"),document.getElementById("tab-board").classList.add("active"),je()):e==="list"?(t.classList.remove("hidden"),document.getElementById("tab-list").classList.add("active"),De()):e==="chronicle"?(s.classList.remove("hidden"),document.getElementById("tab-chronicle").classList.add("active"),Bt()):(o.classList.remove("hidden"),document.getElementById("tab-graph").classList.add("active"),Ne())}function q(){I==="board"?je():I==="list"?De():I==="chronicle"?Bt():Ne()}document.getElementById("sort-select").value=Q;H&&document.getElementById("hide-done-btn").classList.add("active");Ie();Ye();document.getElementById("auth-btn").addEventListener("click",()=>{if(F&&B){re("Shared token is stored on this device. Use Forget Token to reset it.","success");return}re(F?"Enter the shared access token to load the board.":"This environment does not require a shared token.")});document.getElementById("auth-close").addEventListener("click",()=>{F&&!B||Ce()});document.getElementById("auth-clear-btn").addEventListener("click",async()=>{await Qt(),F?re("Stored token cleared. Enter a shared access token to continue."):(Ce(),de("Stored token cleared."))});document.getElementById("auth-form").addEventListener("submit",async e=>{e.preventDefault();const t=document.getElementById("auth-token-input").value.trim();if(!t){de("Enter the shared access token.","error");return}de("Unlocking board...","default");try{await It(t),de("Board unlocked.","success"),await Tt(),Ct(),q()}catch(s){de(s instanceof Error?s.message:"Board authentication failed.","error")}});document.getElementById("tab-board").addEventListener("click",()=>Be("board"));document.getElementById("tab-list").addEventListener("click",()=>Be("list"));document.getElementById("tab-chronicle").addEventListener("click",()=>Be("chronicle"));document.getElementById("tab-graph").addEventListener("click",()=>Be("graph"));document.getElementById("toolbar-mobile-toggle").addEventListener("click",()=>{we=!we,Ye()});$t.addEventListener("change",e=>{Yt(e.matches)});document.addEventListener("visibilitychange",()=>{document.visibilityState!=="visible"||!B||(Xe(),q())});function At(){if(We)return;We=!0;const e=new EventSource("/api/events");e.onmessage=()=>{if(qe)return;const n=!document.getElementById("modal-overlay").classList.contains("hidden"),t=!document.getElementById("add-card-overlay").classList.contains("hidden");!n&&!t&&q()},e.onerror=()=>{e.close(),We=!1,(!F||B)&&setTimeout(At,5e3)}}document.getElementById("refresh-btn").addEventListener("click",q);document.getElementById("search-input").addEventListener("input",e=>{if(pe=e.target.value.trim(),I==="board"){je();return}if(I==="graph"){Ne();return}He()});document.getElementById("sort-select").addEventListener("change",e=>{Q=e.target.value,localStorage.setItem("kanban-sort",Q),q()});document.getElementById("hide-done-btn").addEventListener("click",()=>{if(H=!H,localStorage.setItem("kanban-hide-old",String(H)),document.getElementById("hide-done-btn").classList.toggle("active",H),I==="graph"){Ne();return}He()});document.getElementById("modal-close").addEventListener("click",()=>{document.getElementById("modal-overlay").classList.add("hidden"),K(),q()});document.getElementById("modal-overlay").addEventListener("click",e=>{e.target===e.currentTarget&&(document.getElementById("modal-overlay").classList.add("hidden"),K(),q())});document.addEventListener("keydown",e=>{if(e.key==="Escape"){const n=!document.getElementById("modal-overlay").classList.contains("hidden");document.getElementById("modal-overlay").classList.add("hidden"),document.getElementById("add-card-overlay").classList.add("hidden"),!document.getElementById("auth-overlay").classList.contains("hidden")&&B&&Ce(),K(),n&&q()}});const Le=document.getElementById("add-card-overlay");let W=[];function Te(){const e=document.getElementById("add-attachment-preview");if(W.length===0){e.innerHTML="";return}e.innerHTML=W.map((n,t)=>`
    <div class="attachment-thumb">
      <img src="${URL.createObjectURL(n)}" alt="${n.name}" />
      <button class="attachment-remove" data-idx="${t}" title="Remove" type="button">&times;</button>
      <span class="attachment-name">${n.name}</span>
    </div>
  `).join(""),e.querySelectorAll(".attachment-remove").forEach(n=>{n.addEventListener("click",t=>{t.stopPropagation();const s=parseInt(n.dataset.idx);W.splice(s,1),Te()})})}function tt(e){for(const n of Array.from(e))n.type.startsWith("image/")&&W.push(n);Te()}document.getElementById("add-card-close").addEventListener("click",()=>{Le.classList.add("hidden"),W=[],Te(),K()});Le.addEventListener("click",e=>{e.target===e.currentTarget&&(Le.classList.add("hidden"),W=[],Te(),K())});const le=document.getElementById("add-attachment-zone"),ve=document.getElementById("add-attachment-input");le.addEventListener("click",()=>ve.click());le.addEventListener("dragover",e=>{e.preventDefault(),le.classList.add("drop-active")});le.addEventListener("dragleave",()=>{le.classList.remove("drop-active")});le.addEventListener("drop",e=>{var t;e.preventDefault(),le.classList.remove("drop-active");const n=(t=e.dataTransfer)==null?void 0:t.files;n&&tt(n)});ve.addEventListener("change",()=>{ve.files&&tt(ve.files),ve.value=""});Le.addEventListener("paste",e=>{var t;const n=Array.from(((t=e.clipboardData)==null?void 0:t.files)??[]).filter(s=>s.type.startsWith("image/"));n.length!==0&&(e.preventDefault(),tt(n))});document.getElementById("add-card-form").addEventListener("submit",async e=>{e.preventDefault();const n=document.getElementById("add-title").value.trim();if(!n)return;const t=document.getElementById("add-priority").value,s=parseInt(document.getElementById("add-level").value)||3,o=document.getElementById("add-description").value.trim()||null,r=document.getElementById("add-tags").value.trim(),d=r?r.split(",").map(h=>h.trim()).filter(Boolean):null,l=j;if(!l){_e("Select a project first");return}const a=document.querySelector("#add-card-form .form-submit");a.textContent=W.length>0?"Creating...":"Add Card",a.disabled=!0;const u=await(await x("/api/task",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({title:n,priority:t,level:s,description:o,tags:d,project:l})})).json();W.length>0&&u.id&&await Re(u.id,W,l),W=[],a.textContent="Add Card",a.disabled=!1,document.getElementById("add-card-form").reset(),Te(),Le.classList.add("hidden"),K(),V(l),q()});sn().then(async e=>{e&&(await Tt(),Be(I),Ct())}).catch(()=>{re("Unable to initialize board authentication.","error")});zt();
