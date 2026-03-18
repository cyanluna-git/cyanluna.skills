import lt from"https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs";(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const o of document.querySelectorAll('link[rel="modulepreload"]'))a(o);new MutationObserver(o=>{for(const i of o)if(i.type==="childList")for(const c of i.addedNodes)c.tagName==="LINK"&&c.rel==="modulepreload"&&a(c)}).observe(document,{childList:!0,subtree:!0});function n(o){const i={};return o.integrity&&(i.integrity=o.integrity),o.referrerPolicy&&(i.referrerPolicy=o.referrerPolicy),o.crossOrigin==="use-credentials"?i.credentials="include":o.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function a(o){if(o.ep)return;o.ep=!0;const i=n(o);fetch(o.href,i)}})();lt.initialize({startOnLoad:!1,theme:"dark",themeVariables:{primaryColor:"#334155",primaryBorderColor:"#60a5fa",primaryTextColor:"#f1f5f9",lineColor:"#64748b",secondaryColor:"#1e293b",tertiaryColor:"#0f172a"}});window.__mermaid=lt;const K=[{key:"todo",label:"Requirements",icon:"📋"},{key:"plan",label:"Plan",icon:"🗺️"},{key:"plan_review",label:"Review Plan",icon:"🔍"},{key:"impl",label:"Implement",icon:"🔨"},{key:"impl_review",label:"Review Impl",icon:"📝"},{key:"test",label:"Test",icon:"🧪"},{key:"done",label:"Done",icon:"✅"}],xt={plan:"Planning",plan_review:"Plan Review",impl:"Implementing",impl_review:"Impl Review",test:"Testing"},we="kanban-auth-token",qe="kanban-current-view",dt="kanban-mobile-board-columns",qt=3e4,Ot=10,kt=10,pt="kanban-summary-cache",Pt={board:3e4,full:6e4},ut=window.matchMedia("(max-width: 768px)");function Dt(){!("serviceWorker"in navigator)||!(window.location.protocol==="https:"||window.location.hostname==="localhost"||window.location.hostname==="127.0.0.1")||window.addEventListener("load",()=>{navigator.serviceWorker.register("/sw.js").catch(t=>{console.warn("Service worker registration failed",t)})})}function Mt(e){return e==="board"||e==="list"||e==="chronicle"}function Ut(e){return K.some(t=>t.key===e)}function Nt(){try{const e=localStorage.getItem(dt);if(!e)return new Set;const t=JSON.parse(e);return Array.isArray(t)?new Set(t.filter(n=>typeof n=="string"&&Ut(n))):new Set}catch{return new Set}}let w=localStorage.getItem("kanban-project"),Ee=!1,E=ut.matches,C=Mt(localStorage.getItem(qe))?localStorage.getItem(qe):E?"list":"board",de="",F=localStorage.getItem("kanban-sort")||"default",x=localStorage.getItem("kanban-hide-old")==="true",T=localStorage.getItem(we)||"",A=!1,L=!1,xe=!1,re=!E,V=Nt(),S=null,se=null,Z=null;const oe=new Map,Q=new Map,ie=new Map;function ee(e,t="default"){const n=document.getElementById("auth-message");n.textContent=e,n.classList.remove("error","success"),t!=="default"&&n.classList.add(t)}function k(){const t=[document.getElementById("modal-overlay"),document.getElementById("add-card-overlay"),document.getElementById("auth-overlay")].some(n=>n&&!n.classList.contains("hidden"));document.body.classList.toggle("overlay-open",t)}function pe(){const e=document.getElementById("auth-btn");if(e){if(!A){e.textContent="Open",e.title="Board access is open in this environment";return}e.textContent=L?"Private":"Locked",e.title=L?"Shared token configured for this browser":"Shared token required"}}function X(e="Enter the shared access token to load the board.",t="default"){L=!1,document.getElementById("auth-overlay").classList.remove("hidden"),k();const n=document.getElementById("auth-token-input");n.value=T,ee(e,t),pe(),setTimeout(()=>n.focus(),0)}function ue(){document.getElementById("auth-overlay").classList.add("hidden"),k(),pe()}function mt(e){T=e.trim(),T?localStorage.setItem(we,T):localStorage.removeItem(we)}function ke(){document.body.classList.toggle("mobile-shell",E),document.body.classList.toggle("mobile-toolbar-open",!E||re);const e=document.getElementById("toolbar-mobile-toggle");if(e){const t=!E||re;e.hidden=!E,e.setAttribute("aria-expanded",String(t)),e.textContent=t?"Hide Filters":"Show Filters"}}function Ht(e){E=e,E||(re=!0),ke(),L&&C==="board"&&B()}function ht(){return window.location.hostname==="localhost"||window.location.hostname==="127.0.0.1"}function Pe(){se!==null&&(window.clearInterval(se),se=null)}function De(e=w,t="full"){return`${e||"__all__"}::${t}`}function Le(e=w,t="full"){return`${pt}::${De(e,t)}`}function Ft(e=w,t="full"){try{const n=localStorage.getItem(Le(e,t));if(!n)return null;const a=JSON.parse(n);return!a||typeof a.fetchedAt!="number"||!a.board?null:Date.now()-a.fetchedAt>Pt[t]?(localStorage.removeItem(Le(e,t)),null):a}catch{return null}}function Vt(e,t,n,a){try{const o={fetchedAt:Date.now(),etag:a,board:n};localStorage.setItem(Le(e,t),JSON.stringify(o))}catch{}}function q(e=w,t){const n=t?[t]:["board","full"];for(const a of n){const o=De(e,a);oe.delete(o),Q.delete(o),ie.delete(o);try{localStorage.removeItem(Le(e,a))}catch{}}e===w&&(S=null,Z=null)}function Me(e={}){if(oe.clear(),Q.clear(),ie.clear(),S=null,Z=null,e.persisted)try{const t=[];for(let n=0;n<localStorage.length;n+=1){const a=localStorage.key(n);a!=null&&a.startsWith(`${pt}::`)&&t.push(a)}t.forEach(n=>localStorage.removeItem(n))}catch{}}function gt(){T="",localStorage.removeItem(we);const e=document.getElementById("auth-token-input");e&&(e.value="")}async function Kt(){const e=new Headers;T&&e.set("X-Kanban-Auth",T);const n=await(await fetch("/api/auth/session",{method:"GET",headers:e,credentials:"same-origin"})).json().catch(()=>({}));return{authenticated:!!n.authenticated,authRequired:!!n.authRequired,mode:n.mode,source:n.source??null,reason:n.reason??null,error:n.error??null}}async function vt(e){const t=e.trim(),n=await fetch("/api/auth/session",{method:"POST",headers:{"X-Kanban-Auth":t},credentials:"same-origin"}),a=await n.json().catch(()=>({}));if(!n.ok){const o=a.reason==="invalid_token"?"Shared token is invalid.":a.reason==="token_hash_missing"?"Server auth is not configured yet.":"Board authentication failed.";throw new Error(o)}mt(t),A=!!a.authRequired,L=!0,ue(),pe()}async function Jt(){await fetch("/api/auth/session",{method:"DELETE",credentials:"same-origin"}).catch(()=>{}),Pe(),Me({persisted:!0}),gt(),L=!A,pe()}async function I(e,t={},n=!1){const a=new Headers(t.headers||{});T&&!a.has("X-Kanban-Auth")&&a.set("X-Kanban-Auth",T);const o=await fetch(e,{...t,headers:a,credentials:"same-origin"});if((o.status===401||o.status===403||o.status===503)&&!n){const i=await o.clone().json().catch(()=>({}));A=!0,L=!1,i.reason==="invalid_token"&&gt();const c=i.reason==="invalid_token"?"Stored token was rejected. Enter a valid shared token.":i.reason==="token_hash_missing"?"Server auth hash is not configured yet.":"Shared token is required for this board.";throw X(c,"error"),new Error(i.error||c)}return o}async function Ue(e=w){const t=e?`?project=${encodeURIComponent(e)}`:"",n=new Headers;Z&&n.set("If-None-Match",Z);const a=await I(`/api/board/version${t}`,{headers:n});return a.status===304?S?null:(Z=null,Ue()):(Z=a.headers.get("ETag"),a.json())}function Wt(e){return e==="board"?C==="board"&&!Oe():C==="list"||C==="chronicle"||C==="board"&&Oe()}function Oe(){return de.trim().length>0}function Yt(e,t,n,a){if(!L||ie.has(t))return;const o=(async()=>{try{const i=await Ue(a);if(!i)return;if(n&&i.version===n){S=i.version;return}q(a,e),await me(e,{bypassTtl:!0,projectOverride:a}),w===a&&Wt(e)&&B()}catch{}finally{ie.delete(t)}})();ie.set(t,o)}async function me(e="full",t={}){const n=t.projectOverride===void 0?w:t.projectOverride,a=["summary=true"];n&&a.unshift(`project=${encodeURIComponent(n)}`),e==="board"&&a.push("compact=board",`todo_limit=${Ot}`,`done_limit=${kt}`);const o=`?${a.join("&")}`,i=De(n,e);if(!t.bypassTtl){const p=Ft(n,e);if(p)return oe.set(i,p.board),p.etag&&Q.set(i,p.etag),S=p.board.version||S,Yt(e,i,p.board.version||null,n),p.board}const c=new Headers,l=Q.get(i);l&&c.set("If-None-Match",l);const s=await I(`/api/board${o}`,{headers:c});if(s.status===304){const p=oe.get(i);return p?(S=p.version||S,p):(Q.delete(i),me(e,{bypassTtl:!0}))}const r=await s.json(),d=s.headers.get("ETag");return d&&Q.set(i,d),oe.set(i,r),Vt(n,e,r,d),S=r.version||S,r}function zt(){ht()||se!==null||(se=window.setInterval(async()=>{if(!L||Ee)return;const e=!document.getElementById("modal-overlay").classList.contains("hidden"),t=!document.getElementById("add-card-overlay").classList.contains("hidden");if(!(e||t))try{const n=await Ue();if(!n)return;if(!S){S=n.version;return}n.version!==S&&(S=n.version,B())}catch{A&&!L&&Pe()}},qt))}function ft(){if(ht()){Pe(),Lt();return}zt()}function Zt(){const e=new URL(window.location.href),t=e.searchParams.get("auth")||e.searchParams.get("token");t&&(mt(t),e.searchParams.delete("auth"),e.searchParams.delete("token"),window.history.replaceState({},"",e.toString()))}async function Xt(){if(Zt(),T)try{return await vt(T),!0}catch(t){return X(t instanceof Error?t.message:"Board authentication failed.","error"),!1}const e=await Kt();return A=e.authRequired,L=e.authenticated||!e.authRequired,e.authRequired&&!e.authenticated?(X("Enter the shared access token to load the board."),!1):(ue(),!0)}function Ce(e){return e==="high"?"high":e==="medium"?"medium":e==="low"?"low":""}function yt(){localStorage.setItem(dt,JSON.stringify([...V]))}function Gt(e){if(!E||V.size>0)return;const t=K.filter(n=>n.key==="todo"||n.key==="impl"||n.key!=="done"&&e[n.key].length>0).map(n=>n.key);V=new Set(t.length>0?t:["todo"]),yt()}function Qt(e){return!E||de.trim()?!0:V.has(e)}function Ie(e){var t;return((t=K.find(n=>n.key===e))==null?void 0:t.label)||e}function en(e,t){return e===1?{todo:["impl"],impl:["done"],done:[]}[t]||[]:e===2?{todo:["plan"],plan:["impl","todo"],impl:["impl_review"],impl_review:["done","impl"],done:[]}[t]||[]:{todo:["plan"],plan:["plan_review","todo"],plan_review:["impl","plan"],impl:["impl_review"],impl_review:["test","impl"],test:["done","impl"],done:[]}[t]||[]}async function tn(e,t){if(!t||t===e.status)return;const n=await I(`/api/task/${e.id}?project=${encodeURIComponent(e.project)}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({status:t})});if(!n.ok){const a=await n.json().catch(()=>({}));ge(a.error||"Failed to move task");return}q(e.project),he()}function fe(e){return e?Date.now()-new Date(e).getTime()>4320*60*1e3:!1}function $t(e,t){return F==="default"?t==="done"?[...e].sort((n,a)=>{const o=(a.completed_at||"").localeCompare(n.completed_at||"");return o!==0?o:n.rank-a.rank||n.id-a.id}):[...e].sort((n,a)=>a.rank-n.rank||a.id-n.id):[...e].sort((n,a)=>F==="created_asc"?n.created_at.localeCompare(a.created_at):F==="created_desc"?a.created_at.localeCompare(n.created_at):F==="completed_desc"?(a.completed_at||"").localeCompare(n.completed_at||""):0)}function je(){const e=de.toLowerCase().replace(/^#/,""),t=e.length>0||x;document.body.classList.toggle("mobile-board-search",C==="board"&&E&&e.length>0),C==="board"?(document.querySelectorAll(".card").forEach(n=>{const a=!e||(()=>{var r,d,p,u;const i=n.dataset.id||"",c=((d=(r=n.querySelector(".card-title"))==null?void 0:r.textContent)==null?void 0:d.toLowerCase())||"",l=((u=(p=n.querySelector(".card-desc"))==null?void 0:p.textContent)==null?void 0:u.toLowerCase())||"",s=[...n.querySelectorAll(".tag")].map(g=>{var m;return((m=g.textContent)==null?void 0:m.toLowerCase())||""}).join(" ");return i===e||c.includes(e)||l.includes(e)||s.includes(e)})(),o=x&&n.dataset.status==="done"&&fe(n.dataset.completedAt||"");n.style.display=a&&!o?"":"none"}),document.querySelectorAll(".column").forEach(n=>{const a=n.querySelectorAll(".card"),o=[...a].filter(s=>s.style.display!=="none").length,i=a.length,c=Number.parseInt(n.dataset.totalCount||`${i}`,10)||i,l=n.querySelector(".count");l&&(l.textContent=t||c!==i?`${o}/${c}`:`${c}`)})):C==="list"?(document.querySelectorAll("#list-view tbody tr").forEach(n=>{const a=!e||(()=>{var r,d,p,u;const i=n.dataset.id||"",c=((d=(r=n.querySelector(".col-title"))==null?void 0:r.textContent)==null?void 0:d.toLowerCase())||"",l=((u=(p=n.cells[5])==null?void 0:p.textContent)==null?void 0:u.toLowerCase())||"",s=[...n.querySelectorAll(".tag")].map(g=>{var m;return((m=g.textContent)==null?void 0:m.toLowerCase())||""}).join(" ");return i===e||c.includes(e)||l.includes(e)||s.includes(e)})(),o=x&&n.classList.contains("status-done")&&fe(n.dataset.completedAt||"");n.style.display=a&&!o?"":"none"}),document.querySelectorAll("#list-view .list-card").forEach(n=>{const a=!e||(()=>{var r,d,p;const i=n.dataset.id||"",c=((d=(r=n.querySelector(".list-card-title"))==null?void 0:r.textContent)==null?void 0:d.toLowerCase())||"",l=((p=n.dataset.project)==null?void 0:p.toLowerCase())||"",s=[...n.querySelectorAll(".tag")].map(u=>{var g;return((g=u.textContent)==null?void 0:g.toLowerCase())||""}).join(" ");return i===e||c.includes(e)||l.includes(e)||s.includes(e)})(),o=x&&n.classList.contains("status-done")&&fe(n.dataset.completedAt||"");n.style.display=a&&!o?"":"none"})):(document.querySelectorAll("#chronicle-view .chronicle-event").forEach(n=>{const a=!e||(()=>{var s,r,d;const i=n.dataset.id||"",c=((r=(s=n.querySelector(".chronicle-task-link"))==null?void 0:s.textContent)==null?void 0:r.toLowerCase())||"",l=((d=n.dataset.project)==null?void 0:d.toLowerCase())||"";return i===e||c.includes(e)||l.includes(e)})(),o=x&&fe(n.dataset.completedAt||"");n.style.display=a&&!o?"":"none"}),document.querySelectorAll("#chronicle-view .chronicle-group").forEach(n=>{const a=[...n.querySelectorAll(".chronicle-event")].filter(o=>o.style.display!=="none").length;n.style.display=a>0?"":"none"}))}function Be(e){if(!e||e==="null")return[];try{const t=JSON.parse(e);return Array.isArray(t)?t:[]}catch{return[]}}function nn(e){const t=new Date(e+"Z"),a=new Date().getTime()-t.getTime(),o=Math.floor(a/864e5);return o===0?"today":o===1?"yesterday":o<7?`${o}d ago`:o<30?`${Math.floor(o/7)}w ago`:e.slice(0,10)}function M(e){if(!e||e==="null")return[];try{const t=JSON.parse(e);return Array.isArray(t)?t:[]}catch{return[]}}function an(e){var R,D;const t=Ce(e.priority),n=t?`<span class="badge ${t}">${e.priority}</span>`:"",a=e.completed_at?`<span class="badge date">${e.completed_at.slice(0,10)}</span>`:e.created_at?`<span class="badge created">${nn(e.created_at)}</span>`:"",o=!w&&e.project?`<span class="badge project">${e.project}</span>`:"",i=xt[e.status],c=i?`<span class="badge status-${e.status}">${i}</span>`:"",l=`<span class="badge level-${e.level}">L${e.level}</span>`,s=e.current_agent?`<span class="badge agent-tag">${e.current_agent}</span>`:"",r=e.last_review_status?[]:M(e.review_comments),d=e.last_review_status||(r.length>0?(R=r[r.length-1])==null?void 0:R.status:null),p=d?`<span class="badge ${d==="approved"?"review-approved":"review-changes"}">${d==="approved"?"Approved":"Changes Req."}</span>`:e.status==="impl_review"?'<span class="badge review-pending">Awaiting Review</span>':"",u=e.last_plan_review_status?[]:M(e.plan_review_comments),g=e.last_plan_review_status||(u.length>0?(D=u[u.length-1])==null?void 0:D.status:null),m=g?`<span class="badge ${g==="approved"?"review-approved":"review-changes"}">${g==="approved"?"Plan OK":"Plan Changes"}</span>`:e.status==="plan_review"?'<span class="badge review-pending">Plan Review</span>':"",f=Be(e.tags).map(W=>`<span class="tag">${W}</span>`).join(""),v=e.note_count??M(e.notes).length,j=v>0?`<span class="badge notes-count" title="${v} note(s)">💬 ${v}</span>`:"",_=en(e.level,e.status).map(W=>`<option value="${W}">${Ie(W)}</option>`).join(""),J=_?`
      <label class="mobile-card-move card-interactive">
        <span>Move</span>
        <select class="mobile-status-select" data-id="${e.id}" data-project="${e.project}" data-current-status="${e.status}">
          <option value="${e.status}">${Ie(e.status)}</option>
          ${_}
        </select>
      </label>
    `:"";return`
    <div class="${E?"card mobile-card":"card"}" ${E?'draggable="false"':'draggable="true"'} data-id="${e.id}" data-status="${e.status}" data-project="${e.project}" data-completed-at="${e.completed_at||""}">
      <div class="card-header">
        <span class="card-id">#${e.id}</span>
        ${l}
        ${n}
        ${c}
        ${s}
        <button class="card-copy-btn" data-copy="#${e.id} ${e.title}" title="Copy to clipboard">⎘</button>
      </div>
      <div class="card-title">${e.title}</div>
      <div class="card-footer">
        ${o}
        ${m}
        ${p}
        ${j}
        ${a}
      </div>
      ${J}
      ${f?`<div class="card-tags">${f}</div>`:""}
    </div>
  `}function sn(e,t,n,a,o=a.length){const i=Qt(e),c=$t(a,e).map(an).join(""),l=e==="todo"?'<button class="add-card-btn" id="add-card-btn" title="Add card">+</button>':"",s=o!==a.length?`${a.length}/${o}`:`${o}`;return`
    <div class="column ${e}" data-column="${e}" data-mobile-expanded="${i}" data-total-count="${o}">
      <div class="column-header">
        <button class="column-toggle-btn" type="button" data-column-toggle="${e}" aria-expanded="${i}">
          <span class="column-toggle-label">${n} ${t}</span>
          <span class="column-toggle-meta">
            <span class="count">${s}</span>
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
  `}const on=/```[\s\S]*?```/g,rn=/```\w*\n?/,at=/```$/,st=/^```mermaid\s*\n?/,cn=/\*\*(.+?)\*\*/g,ln=/`([^`]+)`/g,dn=/^\x00CB(\d+)\x00$/,pn=/^### (.+)$/,un=/^## (.+)$/,mn=/^# (.+)$/,hn=/^[-*]\s+(.+)$/,gn=/^\d+\.\s+(.+)$/,ot=/^\|(.+)\|$/,it=/^\|[\s:-]+\|$/;let vn=0;function ce(e){const t=[];let n=e.replace(on,r=>{if(st.test(r)){const d=r.replace(st,"").replace(at,"").trim(),p=`mermaid-${++vn}`;t.push(`<pre class="mermaid" id="${p}">${d}</pre>`)}else{const d=r.replace(rn,"").replace(at,"");t.push(`<pre><code>${d}</code></pre>`)}return`\0CB${t.length-1}\0`});n=n.replace(/</g,"&lt;"),n=n.replace(cn,"<strong>$1</strong>").replace(ln,"<code>$1</code>");const a=n.split(`
`),o=[];let i=!1,c=!1;function l(){i&&(o.push("</ul>"),i=!1),c&&(o.push("</ol>"),c=!1)}let s=0;for(;s<a.length;){const r=a[s].trim(),d=r.match(dn);if(d){l(),o.push(t[parseInt(d[1])]),s++;continue}if(ot.test(r)){l();const v=[];for(;s<a.length&&ot.test(a[s].trim());)v.push(a[s].trim()),s++;if(v.length>=2){const j=it.test(v[1]),_=j?v[0]:null,J=j?2:0;let N='<table class="md-table">';if(_){const P=_.slice(1,-1).split("|").map(R=>R.trim());N+="<thead><tr>"+P.map(R=>`<th>${R}</th>`).join("")+"</tr></thead>"}N+="<tbody>";for(let P=J;P<v.length;P++){if(it.test(v[P]))continue;const R=v[P].slice(1,-1).split("|").map(D=>D.trim());N+="<tr>"+R.map(D=>`<td>${D}</td>`).join("")+"</tr>"}N+="</tbody></table>",o.push(N)}else o.push(`<p>${v[0]}</p>`);continue}const p=r.match(pn);if(p){l(),o.push(`<h3>${p[1]}</h3>`),s++;continue}const u=r.match(un);if(u){l(),o.push(`<h2>${u[1]}</h2>`),s++;continue}const g=r.match(mn);if(g){l(),o.push(`<h1>${g[1]}</h1>`),s++;continue}const m=r.match(hn);if(m){c&&(o.push("</ol>"),c=!1),i||(o.push("<ul>"),i=!0),o.push(`<li>${m[1]}</li>`),s++;continue}const f=r.match(gn);if(f){i&&(o.push("</ul>"),i=!1),c||(o.push("<ol>"),c=!0),o.push(`<li>${f[1]}</li>`),s++;continue}l(),r===""?o.push(""):o.push(`<p>${r}</p>`),s++}return l(),o.join(`
`)}async function fn(e){const t=window.__mermaid;if(!t)return;const n=e.querySelectorAll("pre.mermaid");if(n.length!==0)try{await t.run({nodes:n})}catch(a){console.warn("Mermaid render failed:",a)}}function ye(e,t,n,a,o){if(!a&&!o)return"";const i=a?ce(a):'<span class="phase-empty">Not yet documented</span>';return`
    <div class="lifecycle-phase ${n} ${o?"active":""}">
      <div class="phase-header">
        <span class="phase-icon">${t}</span>
        <span class="phase-label">${e}</span>
        <button class="phase-expand-btn" title="Expand to full screen">&#x26F6;</button>
      </div>
      <div class="phase-body">${i}</div>
    </div>
  `}function rt(e){return e.length===0?"":e.map(t=>{var n;return`
    <div class="review-entry ${t.status}">
      <div class="review-header">
        <span class="badge ${t.status==="approved"?"review-approved":"review-changes"}">
          ${t.status==="approved"?"Approved":"Changes Requested"}
        </span>
        <span class="review-meta">${t.reviewer||""} &middot; ${((n=t.timestamp)==null?void 0:n.slice(0,16))||""}</span>
      </div>
      <div class="review-comment">${ce(t.comment||"")}</div>
    </div>
  `}).join("")}function yn(e){return e.length===0?"":e.map(t=>{var n;return`
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
      ${t.comment?`<div class="review-comment">${ce(t.comment)}</div>`:""}
    </div>
  `}).join("")}async function $n(e,t=1920,n=.82){return new Promise((a,o)=>{const i=new Image,c=URL.createObjectURL(e);i.onload=()=>{URL.revokeObjectURL(c);let{width:l,height:s}=i;(l>t||s>t)&&(l>s?(s=Math.round(s*t/l),l=t):(l=Math.round(l*t/s),s=t));const r=document.createElement("canvas");r.width=l,r.height=s,r.getContext("2d").drawImage(i,0,0,l,s),a(r.toDataURL("image/jpeg",n))},i.onerror=()=>{URL.revokeObjectURL(c),o(new Error("Image load failed"))},i.src=c})}async function $e(e,t,n){var a,o;for(const i of Array.from(t)){if(!i.type.startsWith("image/"))continue;let c;try{c=await $n(i)}catch{c=await new Promise(d=>{const p=new FileReader;p.onload=()=>d(p.result),p.readAsDataURL(i)})}const l=(o=(a=i.name.match(/\.[^.]+$/))==null?void 0:a[0])==null?void 0:o.toLowerCase(),s=l===".jpg"||l===".jpeg"||l===".png"||l===".webp"||l===".gif"||l===".svg"?i.name:i.name.replace(/\.[^.]+$/,"")+".jpg",r=await I(`/api/task/${e}/attachment?project=${encodeURIComponent(n)}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({filename:s,data:c})});if(!r.ok){const d=await r.json().catch(()=>({}));ge(d.error||`Upload failed (${r.status})`);return}}U(e,n)}async function U(e,t){var i;const n=document.getElementById("modal-overlay"),a=document.getElementById("modal-content");a.innerHTML='<div style="color:#94a3b8">Loading...</div>',n.classList.remove("hidden"),k();try{const c=t?`?project=${encodeURIComponent(t)}`:"",s=await(await I(`/api/task/${e}${c}`)).json(),r=document.querySelector(`.card[data-id="${s.id}"][data-project="${CSS.escape(s.project)}"]`);r&&r.dataset.status!==s.status&&(Me(),B());const d=Be(s.tags),p=d.length?`<div class="modal-tags">${d.map(h=>`<span class="tag">${h}</span>`).join("")}</div>`:"",u=[`<strong>Project:</strong> ${s.project}`,`<strong>Status:</strong> ${s.status}`,`<strong>Priority:</strong> ${s.priority}`,`<strong>Created:</strong> ${((i=s.created_at)==null?void 0:i.slice(0,10))||"-"}`,s.started_at?`<strong>Started:</strong> ${s.started_at.slice(0,10)}`:"",s.planned_at?`<strong>Planned:</strong> ${s.planned_at.slice(0,10)}`:"",s.reviewed_at?`<strong>Reviewed:</strong> ${s.reviewed_at.slice(0,10)}`:"",s.tested_at?`<strong>Tested:</strong> ${s.tested_at.slice(0,10)}`:"",s.completed_at?`<strong>Completed:</strong> ${s.completed_at.slice(0,10)}`:""].filter(Boolean).join(" &nbsp;|&nbsp; "),g={1:{labels:["Req","Impl","Done"],statuses:["todo","impl","done"]},2:{labels:["Req","Plan","Impl","Review","Done"],statuses:["todo","plan","impl","impl_review","done"]},3:{labels:["Req","Plan","Plan Rev","Impl","Impl Rev","Test","Done"],statuses:["todo","plan","plan_review","impl","impl_review","test","done"]}},m=g[s.level]||g[3],f=Math.max(0,m.statuses.indexOf(s.status)),v=`
      <div class="lifecycle-progress">
        <span class="level-indicator">L${s.level}</span>
        ${m.labels.map((h,y)=>`
          <div class="progress-step ${y<f?"completed":""} ${y===f?"current":""}">
            <div class="step-dot"></div>
            <span class="step-label">${h}</span>
          </div>
        `).join('<div class="progress-line"></div>')}
      </div>
    `,j=M(s.attachments),_=j.length>0?`<div class="attachments-grid">${j.map(h=>`<div class="attachment-thumb" data-stored="${h.storedName}">
            <img src="${h.url}" alt="${h.filename}" loading="lazy" />
            <button class="attachment-remove" data-id="${e}" data-name="${h.storedName}" title="Remove">&times;</button>
            <span class="attachment-name">${h.filename}</span>
          </div>`).join("")}</div>`:"",J=s.description?ce(s.description):'<span class="phase-empty">Not yet documented</span>',N=[1,2,3].map(h=>`<option value="${h}" ${h===s.level?"selected":""}>L${h}</option>`).join(""),P=`
      <div class="lifecycle-phase phase-requirement ${f===0?"active":""}">
        <div class="phase-header">
          <span class="phase-icon">📋</span>
          <span class="phase-label">Requirements</span>
          <select class="level-select" id="level-select" title="Pipeline Level">${N}</select>
          <button class="phase-edit-btn" id="req-edit-btn" title="Edit">&#9998;</button>
          <button class="phase-expand-btn" title="Expand to full screen">&#x26F6;</button>
        </div>
        <div class="phase-body" id="req-body-view">
          ${J}
          ${_}
        </div>
        <div class="phase-body hidden" id="req-body-edit">
          <textarea id="req-textarea" rows="8">${(s.description||"").replace(/</g,"&lt;")}</textarea>
          <div class="attachment-drop-zone" id="attachment-drop-zone">
            <span>📎 Drop images, paste (⌘V), or click to attach</span>
            <input type="file" id="attachment-input" accept="image/*" multiple hidden />
          </div>
          ${_?`<div id="edit-attachments">${_}</div>`:""}
          <div class="phase-edit-actions">
            <button class="phase-save-btn" id="req-save-btn">Save</button>
            <button class="phase-cancel-btn" id="req-cancel-btn">Cancel</button>
          </div>
        </div>
      </div>
    `,R=ye("Plan","🗺️","phase-plan",s.plan,f===1&&!s.plan);let D="";s.decision_log&&(D=ye("Decision Log","🧭","phase-decision-log",s.decision_log,!1));let W="";s.done_when&&(W=ye("Done When","🎯","phase-done-when",s.done_when,!1));const It=M(s.plan_review_comments),Fe=rt(It);let Ve="";(Fe||f===2)&&(Ve=`
        <div class="lifecycle-phase phase-plan-review ${f===2?"active":""}">
          <div class="phase-header">
            <span class="phase-icon">🔍</span>
            <span class="phase-label">Plan Review</span>
            ${s.plan_review_count>0?`<span class="review-count">${s.plan_review_count} review(s)</span>`:""}
            <button class="phase-expand-btn" title="Expand to full screen">&#x26F6;</button>
          </div>
          <div class="phase-body">${Fe||'<span class="phase-empty">Awaiting plan review</span>'}</div>
        </div>
      `);const St=ye("Implementation","🔨","phase-impl",s.implementation_notes,f===3&&!s.implementation_notes),Ct=M(s.review_comments),Ke=rt(Ct);let Je="";(Ke||f===4)&&(Je=`
        <div class="lifecycle-phase phase-review ${f===4?"active":""}">
          <div class="phase-header">
            <span class="phase-icon">📝</span>
            <span class="phase-label">Implementation Review</span>
            ${s.impl_review_count>0?`<span class="review-count">${s.impl_review_count} review(s)</span>`:""}
            <button class="phase-expand-btn" title="Expand to full screen">&#x26F6;</button>
          </div>
          <div class="phase-body">${Ke||'<span class="phase-empty">Awaiting implementation review</span>'}</div>
        </div>
      `);const jt=M(s.test_results),We=yn(jt);let Ye="";(We||f===5)&&(Ye=`
        <div class="lifecycle-phase phase-test ${f===5?"active":""}">
          <div class="phase-header">
            <span class="phase-icon">🧪</span>
            <span class="phase-label">Test Results</span>
            <button class="phase-expand-btn" title="Expand to full screen">&#x26F6;</button>
          </div>
          <div class="phase-body">${We||'<span class="phase-empty">Awaiting test execution</span>'}</div>
        </div>
      `);const Te=M(s.agent_log);let ze="";if(Te.length>0){let h=function($){if(!$)return{name:"",model:null};const ne=$.toLowerCase();for(const Re of y){const Y=ne.lastIndexOf(Re);if(Y>0){let z=Y;for(;z>0&&($[z-1]==="-"||$[z-1]==="_");)z--;return{name:$.slice(0,z),model:$.slice(Y)}}}return{name:$,model:null}};var o=h;const y=["opus","sonnet","haiku","gemini","copilot","gpt"],b=Te.map($=>{var nt;const{name:ne,model:Re}=h($.agent||""),Y=$.model||Re,z=Y?`<span class="badge model-tag model-${Y.toLowerCase()}">${Y}</span>`:"";return`
          <div class="agent-log-entry">
            <span class="agent-log-time">${((nt=$.timestamp)==null?void 0:nt.slice(0,16))||""}</span>
            <span class="badge agent-tag">${ne||$.agent||""}</span>
            ${z}
            <span class="agent-log-msg">${$.message||""}</span>
          </div>
        `}).join("");ze=`
        <details class="lifecycle-phase phase-agent-log">
          <summary class="phase-header">
            <span class="phase-icon">🤖</span>
            <span class="phase-label">Agent Log</span>
            <span class="review-count">${Te.length} entries</span>
          </summary>
          <div class="phase-body agent-log-body">${b}</div>
        </details>
      `}const Ze=M(s.notes),Bt=Ze.map(h=>{var y;return`
      <div class="note-entry">
        <div class="note-header">
          <span class="note-author">${h.author||"user"}</span>
          <span class="note-time">${((y=h.timestamp)==null?void 0:y.slice(0,16).replace("T"," "))||""}</span>
          <button class="note-delete" data-note-id="${h.id}" title="Delete">&times;</button>
        </div>
        <div class="note-text">${ce(h.text||"")}</div>
      </div>
    `}).join(""),_t=`
      <div class="notes-section">
        <div class="notes-header">
          <span>Notes</span>
          <span class="notes-count">${Ze.length}</span>
        </div>
        <div class="notes-list">${Bt}</div>
        <form class="note-form" id="note-form">
          <textarea id="note-input" rows="2" placeholder="Add a note... (supports markdown)"></textarea>
          <button type="submit" class="note-submit">Add Note</button>
        </form>
      </div>
    `;a.innerHTML=`
      <h1>#${s.id} ${s.title}</h1>
      <div class="modal-meta">${u}</div>
      ${p}
      ${v}
      <div class="lifecycle-sections">
        ${P}
        ${R}
        ${D}
        ${W}
        ${Ve}
        ${St}
        ${Je}
        ${Ye}
        ${ze}
      </div>
      ${_t}
      <div class="modal-danger-zone">
        <button class="delete-task-btn" id="delete-task-btn">Delete Card</button>
      </div>
    `,fn(a),a.querySelectorAll(".phase-expand-btn").forEach(h=>{h.addEventListener("click",y=>{y.stopPropagation();const b=h.closest(".lifecycle-phase");b==null||b.requestFullscreen().catch(()=>{})})});const Xe=document.getElementById("level-select");Xe.addEventListener("change",async()=>{const h=parseInt(Xe.value);await I(`/api/task/${e}?project=${encodeURIComponent(s.project)}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({level:h})}),q(s.project),U(e,s.project)}),document.getElementById("delete-task-btn").addEventListener("click",async()=>{confirm(`Delete card #${s.id} "${s.title}"?`)&&(await I(`/api/task/${e}?project=${encodeURIComponent(s.project)}`,{method:"DELETE"}),q(s.project),document.getElementById("modal-overlay").classList.add("hidden"),B())});const Tt=document.getElementById("req-edit-btn"),Ge=document.getElementById("req-body-view"),Qe=document.getElementById("req-body-edit"),Ae=document.getElementById("req-textarea"),et=document.getElementById("req-save-btn"),At=document.getElementById("req-cancel-btn");Tt.addEventListener("click",()=>{Ge.classList.add("hidden"),Qe.classList.remove("hidden"),Ae.focus()}),At.addEventListener("click",()=>{Ae.value=s.description||"",Qe.classList.add("hidden"),Ge.classList.remove("hidden")}),et.addEventListener("click",async()=>{const h=Ae.value;et.textContent="Saving...",await I(`/api/task/${e}?project=${encodeURIComponent(s.project)}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({description:h})}),q(s.project),U(e,s.project)});const H=document.getElementById("attachment-drop-zone"),te=document.getElementById("attachment-input");H&&te&&(H.addEventListener("click",()=>te.click()),H.addEventListener("dragover",h=>{h.preventDefault(),H.classList.add("drop-active")}),H.addEventListener("dragleave",()=>{H.classList.remove("drop-active")}),H.addEventListener("drop",async h=>{var b;h.preventDefault(),H.classList.remove("drop-active");const y=(b=h.dataTransfer)==null?void 0:b.files;y&&await $e(e,y,s.project)}),te.addEventListener("change",async()=>{te.files&&await $e(e,te.files,s.project)})),a.addEventListener("paste",async h=>{var b;const y=Array.from(((b=h.clipboardData)==null?void 0:b.files)??[]).filter($=>$.type.startsWith("image/"));y.length!==0&&(h.preventDefault(),await $e(e,y,s.project))}),a.querySelectorAll(".attachment-remove").forEach(h=>{h.addEventListener("click",async y=>{y.stopPropagation();const b=h,$=b.dataset.id,ne=b.dataset.name;await I(`/api/task/${$}/attachment/${encodeURIComponent(ne)}?project=${encodeURIComponent(s.project)}`,{method:"DELETE"}),U(e,s.project)})});const Rt=document.getElementById("note-form"),tt=document.getElementById("note-input");Rt.addEventListener("submit",async h=>{h.preventDefault();const y=tt.value.trim();y&&(tt.disabled=!0,await I(`/api/task/${e}/note?project=${encodeURIComponent(s.project)}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({text:y})}),q(s.project),U(e,s.project))}),a.querySelectorAll(".note-delete").forEach(h=>{h.addEventListener("click",async y=>{y.stopPropagation();const b=h.dataset.noteId;await I(`/api/task/${e}/note/${b}?project=${encodeURIComponent(s.project)}`,{method:"DELETE"}),q(s.project),U(e,s.project)})})}catch{a.innerHTML='<div style="color:#ef4444">Failed to load</div>'}}function bt(e){if(!e)return new Date(NaN);let t=e.replace(" ","T");return t.length===10?t+="T00:00:00Z":/Z$|[+-]\d{2}:\d{2}$/.test(t)||(t+="Z"),new Date(t)}function bn(e){const t=bt(e);if(isNaN(t.getTime()))return"Unknown";const n=t.getUTCDay()||7;t.setUTCDate(t.getUTCDate()+4-n);const a=new Date(Date.UTC(t.getUTCFullYear(),0,1)),o=Math.ceil(((t.getTime()-a.getTime())/864e5+1)/7);return`${t.getUTCFullYear()}-W${String(o).padStart(2,"0")}`}function wn(e){const t=bt(e);if(isNaN(t.getTime()))return e.slice(0,10)||"—";const n=t.toLocaleDateString(void 0,{month:"short",day:"numeric",timeZone:"UTC"}),a=t.toLocaleTimeString(void 0,{hour:"2-digit",minute:"2-digit",timeZone:"UTC",hour12:!1});return`${n}
${a}`}function En(e){const t=Ce(e.priority),n=!w&&e.project?`<span class="badge project">${e.project}</span>`:"",a=t?`<span class="badge ${t}">${e.priority}</span>`:"",o=`<span class="badge status-${e.status}">${Ie(e.status)}</span>`;return`
    <div class="chronicle-event" data-id="${e.id}" data-project="${e.project}" data-completed-at="${e.completed_at||""}">
      <div class="chronicle-dot ev-completed"></div>
      <div class="chronicle-event-time">${wn(e.completed_at)}</div>
      <div class="chronicle-event-body">
        <button class="chronicle-task-link" data-id="${e.id}" data-project="${e.project}">
          #${e.id} ${e.title}
        </button>
        ${o}
        ${a}
        ${n}
      </div>
    </div>`}function Ln(e){var d,p;const t=Ce(e.priority),n=t?`<span class="badge ${t}">${e.priority}</span>`:"",a=!w&&e.project?`<span class="badge project">${e.project}</span>`:"",o=`<span class="badge status-${e.status}">${Ie(e.status)}</span>`,i=`<span class="badge level-${e.level}">L${e.level}</span>`,c=((d=e.created_at)==null?void 0:d.slice(0,10))||"",l=((p=e.completed_at)==null?void 0:p.slice(0,10))||"—",r=Be(e.tags).map(u=>`<span class="tag">${u}</span>`).join("");return`
    <article class="list-card status-${e.status}" data-id="${e.id}" data-project="${e.project}" data-completed-at="${e.completed_at||""}">
      <div class="list-card-top">
        <div class="list-card-meta">
          <span class="list-card-id">#${e.id}</span>
          ${o}
          ${i}
          ${n}
        </div>
        ${a}
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
            ${K.map(u=>`<option value="${u.key}" ${u.key===e.status?"selected":""}>${u.label}</option>`).join("")}
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
  `}async function wt(){const e=document.getElementById("chronicle-view");try{const t=await me("full");Ne(t.projects);const n=[];for(const c of K)for(const l of t[c.key])n.push(l);const a=n.filter(c=>!!c.completed_at).sort((c,l)=>l.completed_at.localeCompare(c.completed_at)),o=new Map;for(const c of a){const l=bn(c.completed_at);o.has(l)||o.set(l,[]),o.get(l).push(c)}if(o.size===0){e.innerHTML=`
        <div style="display:flex;align-items:center;justify-content:center;color:#64748b;font-size:0.9rem;padding:64px">
          No completed tasks yet
        </div>`;return}const i=[...o.entries()].map(([c,l])=>{const s=l.map(En).join("");return`
        <div class="chronicle-group">
          <div class="chronicle-week-header">${c}</div>
          <div class="chronicle-events">${s}</div>
        </div>`}).join("");e.innerHTML=`<div class="chronicle-timeline">${i}</div>`,e.querySelectorAll(".chronicle-task-link").forEach(c=>{c.addEventListener("click",l=>{l.stopPropagation();const s=parseInt(c.dataset.id),r=c.dataset.project||void 0;U(s,r)})})}catch(t){console.error("loadChronicleView failed:",t),e.innerHTML=`
      <div style="display:flex;align-items:center;justify-content:center;color:#ef4444;font-size:0.9rem;padding:48px">
        Failed to load chronicle
      </div>`}}async function he(){var t,n,a,o,i,c,l,s;const e=document.getElementById("board");try{const r=await me(Oe()?"full":"board");Gt(r),Ne(r.projects),e.innerHTML=K.map(g=>{var m;return sn(g.key,g.label,g.icon,r[g.key],((m=r.counts)==null?void 0:m[g.key])??r[g.key].length)}).join("");const d=((t=r.counts)==null?void 0:t.done)??r.done.length,p=r.total??(((n=r.counts)==null?void 0:n.todo)??r.todo.length)+(((a=r.counts)==null?void 0:a.plan)??r.plan.length)+(((o=r.counts)==null?void 0:o.plan_review)??r.plan_review.length)+(((i=r.counts)==null?void 0:i.impl)??r.impl.length)+(((c=r.counts)==null?void 0:c.impl_review)??r.impl_review.length)+(((l=r.counts)==null?void 0:l.test)??r.test.length)+(((s=r.counts)==null?void 0:s.done)??r.done.length);document.getElementById("count-summary").textContent=`${d}/${p} completed`,e.querySelectorAll(".card").forEach(g=>{g.addEventListener("click",m=>{if(m.target.closest(".card-interactive")){m.stopPropagation();return}const v=m.target.closest(".card-copy-btn");if(v){m.stopPropagation(),navigator.clipboard.writeText(v.dataset.copy).then(()=>{const J=v.textContent;v.textContent="✓",setTimeout(()=>{v.textContent=J},1e3)});return}const j=parseInt(g.dataset.id),_=g.dataset.project;U(j,_)})}),E||Cn(),In(),je();const u=document.getElementById("add-card-btn");u&&u.addEventListener("click",g=>{g.stopPropagation(),document.getElementById("add-card-overlay").classList.remove("hidden"),k(),E||document.getElementById("add-title").focus()})}catch(r){console.error("loadBoard failed:",r),e.innerHTML=`
      <div style="grid-column:1/-1;display:flex;align-items:center;justify-content:center;color:#ef4444;font-size:0.9rem;padding:48px">
        Cannot find .claude/kanban.db
      </div>
    `}}function In(){document.querySelectorAll("[data-column-toggle]").forEach(e=>{e.addEventListener("click",t=>{if(!E)return;t.stopPropagation();const n=e.dataset.columnToggle;if(!n)return;V.has(n)?V.delete(n):V.add(n),yt();const a=e.closest(".column"),o=V.has(n)||!!de.trim();a&&a.setAttribute("data-mobile-expanded",String(o)),e.setAttribute("aria-expanded",String(o));const i=e.querySelector(".column-toggle-icon");i&&(i.textContent=o?"−":"+")})}),document.querySelectorAll(".mobile-status-select").forEach(e=>{e.addEventListener("click",t=>t.stopPropagation()),e.addEventListener("change",async t=>{t.stopPropagation();const n=e.value,a=parseInt(e.dataset.id||"",10),o=e.dataset.project||"",i=e.dataset.currentStatus||"";!a||!o||await tn({id:a,project:o,status:i},n)})})}async function Se(){const e=document.getElementById("list-view");try{const t=await me("full");Ne(t.projects);const n=[];for(const s of K)for(const r of t[s.key])n.push(r);const a=F==="default"?[...n].sort((s,r)=>r.id-s.id):$t(n),o=a.length,i=a.filter(s=>s.status==="done").length;document.getElementById("count-summary").textContent=`${i}/${o} completed`;const c=a.map(s=>{var u,g;const r=Ce(s.priority),p=Be(s.tags).map(m=>`<span class="tag">${m}</span>`).join("");return`
        <tr class="status-${s.status}" data-id="${s.id}" data-project="${s.project}" data-completed-at="${s.completed_at||""}">
          <td class="col-id">#${s.id}</td>
          <td class="col-title">${s.title}</td>
          <td>
            <select class="list-status-select" data-id="${s.id}" data-field="status">
              ${K.map(m=>`<option value="${m.key}" ${m.key===s.status?"selected":""}>${m.icon} ${m.label}</option>`).join("")}
            </select>
          </td>
          <td>
            <select class="list-level-select" data-id="${s.id}" data-field="level">
              ${[1,2,3].map(m=>`<option value="${m}" ${m===s.level?"selected":""}>L${m}</option>`).join("")}
            </select>
          </td>
          <td>
            <select class="list-priority-select ${r}" data-id="${s.id}" data-field="priority">
              ${["high","medium","low"].map(m=>`<option value="${m}" ${m===s.priority?"selected":""}>${m[0].toUpperCase()+m.slice(1)}</option>`).join("")}
            </select>
          </td>
          <td class="list-date">${s.project||""}</td>
          <td>${p}</td>
          <td class="list-date">${((u=s.created_at)==null?void 0:u.slice(0,10))||""}</td>
          <td class="list-date">${((g=s.completed_at)==null?void 0:g.slice(0,10))||""}</td>
        </tr>
      `}).join(""),l=a.map(Ln).join("");e.innerHTML=`
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
    `,e.querySelectorAll("select").forEach(s=>{s.addEventListener("change",async r=>{r.stopPropagation();const d=s,p=d.dataset.id,u=d.dataset.field;let g=d.value;u==="level"&&(g=parseInt(g));const m=d.closest("tr"),f=(m==null?void 0:m.dataset.project)||"",v=await I(`/api/task/${p}?project=${encodeURIComponent(f)}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({[u]:g})});if(!v.ok){const j=await v.json().catch(()=>({}));j.error&&ge(j.error),Se();return}q(f),Se()})}),e.querySelectorAll(".col-title").forEach(s=>{s.addEventListener("click",r=>{r.stopPropagation();const d=s.closest("[data-id]"),p=parseInt(d.dataset.id),u=d.dataset.project;U(p,u)})}),je()}catch(t){console.error("loadListView failed:",t),e.innerHTML=`
      <div style="display:flex;align-items:center;justify-content:center;color:#ef4444;font-size:0.9rem;padding:48px">
        Failed to load task list
      </div>
    `}}function Ne(e){const t=document.getElementById("project-filter");if(e.length<=1){t.innerHTML=e[0]?`<span class="project-label">${e[0]}</span>`:"";return}const n=e.map(a=>`<option value="${a}" ${a===w?"selected":""}>${a}</option>`).join("");t.innerHTML=`
    <select id="project-select">
      <option value="">All Projects</option>
      ${n}
    </select>
  `,document.getElementById("project-select").addEventListener("change",a=>{w=a.target.value||null,w?localStorage.setItem("kanban-project",w):localStorage.removeItem("kanban-project"),S=null,Z=null,B()})}function ct(e,t){const n=[...e.querySelectorAll(".card:not(.dragging)")];for(const a of n){const o=a.getBoundingClientRect(),i=o.top+o.height/2;if(t<i)return a}return null}function be(){document.querySelectorAll(".drop-indicator").forEach(e=>e.remove())}function Sn(e,t){be();const n=document.createElement("div");n.className="drop-indicator",t?e.insertBefore(n,t):e.appendChild(n)}function Cn(){const e=document.querySelectorAll(".card"),t=document.querySelectorAll(".column-body");e.forEach(n=>{n.addEventListener("dragstart",a=>{const o=a,i=n;o.dataTransfer.setData("text/plain",`${i.dataset.project}:${i.dataset.id}`),i.classList.add("dragging"),Ee=!0}),n.addEventListener("dragend",()=>{n.classList.remove("dragging"),be(),Ee=!1})}),t.forEach(n=>{n.addEventListener("dragover",a=>{a.preventDefault();const o=n;o.classList.add("drag-over");const i=ct(o,a.clientY);Sn(o,i)}),n.addEventListener("dragleave",a=>{const o=n;o.contains(a.relatedTarget)||(o.classList.remove("drag-over"),be())}),n.addEventListener("drop",async a=>{a.preventDefault();const o=n;o.classList.remove("drag-over"),be();const i=a,c=i.dataTransfer.getData("text/plain"),l=c.lastIndexOf(":"),s=l>=0?c.slice(0,l):"",r=parseInt(l>=0?c.slice(l+1):c),d=o.dataset.column,p=ct(o,i.clientY),u=[...o.querySelectorAll(".card:not(.dragging)")];let g=null,m=null;if(p){m=parseInt(p.dataset.id);const v=u.indexOf(p);v>0&&(g=parseInt(u[v-1].dataset.id))}else u.length>0&&(g=parseInt(u[u.length-1].dataset.id));const f=await I(`/api/task/${r}/reorder?project=${encodeURIComponent(s)}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({status:d,afterId:g,beforeId:m})});if(!f.ok){const v=await f.json().catch(()=>({}));v.error&&ge(v.error)}q(s),he()})})}function ge(e){const t=document.querySelector(".toast");t&&t.remove();const n=document.createElement("div");n.className="toast",n.textContent=e,document.body.appendChild(n),setTimeout(()=>n.remove(),3e3)}async function Et(){try{const t=await(await I("/api/info")).json();t.projectName&&(document.title=`Kanban · ${t.projectName}`,document.querySelector("header h1").textContent=`Kanban · ${t.projectName}`)}catch{}}function _e(e){C=e,localStorage.setItem(qe,C);const t=document.getElementById("board"),n=document.getElementById("list-view"),a=document.getElementById("chronicle-view");t.classList.add("hidden"),n.classList.add("hidden"),a.classList.add("hidden"),document.getElementById("tab-board").classList.remove("active"),document.getElementById("tab-list").classList.remove("active"),document.getElementById("tab-chronicle").classList.remove("active"),e==="board"?(t.classList.remove("hidden"),document.getElementById("tab-board").classList.add("active"),he()):e==="list"?(n.classList.remove("hidden"),document.getElementById("tab-list").classList.add("active"),Se()):(a.classList.remove("hidden"),document.getElementById("tab-chronicle").classList.add("active"),wt())}function B(){C==="board"?he():C==="list"?Se():wt()}document.getElementById("sort-select").value=F;x&&document.getElementById("hide-done-btn").classList.add("active");pe();ke();document.getElementById("auth-btn").addEventListener("click",()=>{if(A&&L){X("Shared token is stored on this device. Use Forget Token to reset it.","success");return}X(A?"Enter the shared access token to load the board.":"This environment does not require a shared token.")});document.getElementById("auth-close").addEventListener("click",()=>{A&&!L||ue()});document.getElementById("auth-clear-btn").addEventListener("click",async()=>{await Jt(),A?X("Stored token cleared. Enter a shared access token to continue."):(ue(),ee("Stored token cleared."))});document.getElementById("auth-form").addEventListener("submit",async e=>{e.preventDefault();const n=document.getElementById("auth-token-input").value.trim();if(!n){ee("Enter the shared access token.","error");return}ee("Unlocking board...","default");try{await vt(n),ee("Board unlocked.","success"),await Et(),ft(),B()}catch(a){ee(a instanceof Error?a.message:"Board authentication failed.","error")}});document.getElementById("tab-board").addEventListener("click",()=>_e("board"));document.getElementById("tab-list").addEventListener("click",()=>_e("list"));document.getElementById("tab-chronicle").addEventListener("click",()=>_e("chronicle"));document.getElementById("toolbar-mobile-toggle").addEventListener("click",()=>{re=!re,ke()});ut.addEventListener("change",e=>{Ht(e.matches)});document.addEventListener("visibilitychange",()=>{document.visibilityState!=="visible"||!L||(Me(),B())});function Lt(){if(xe)return;xe=!0;const e=new EventSource("/api/events");e.onmessage=()=>{if(Ee)return;const t=!document.getElementById("modal-overlay").classList.contains("hidden"),n=!document.getElementById("add-card-overlay").classList.contains("hidden");!t&&!n&&B()},e.onerror=()=>{e.close(),xe=!1,(!A||L)&&setTimeout(Lt,5e3)}}document.getElementById("refresh-btn").addEventListener("click",B);document.getElementById("search-input").addEventListener("input",e=>{if(de=e.target.value.trim(),C==="board"){he();return}je()});document.getElementById("sort-select").addEventListener("change",e=>{F=e.target.value,localStorage.setItem("kanban-sort",F),B()});document.getElementById("hide-done-btn").addEventListener("click",()=>{x=!x,localStorage.setItem("kanban-hide-old",String(x)),document.getElementById("hide-done-btn").classList.toggle("active",x),je()});document.getElementById("modal-close").addEventListener("click",()=>{document.getElementById("modal-overlay").classList.add("hidden"),k()});document.getElementById("modal-overlay").addEventListener("click",e=>{e.target===e.currentTarget&&(document.getElementById("modal-overlay").classList.add("hidden"),k())});document.addEventListener("keydown",e=>{e.key==="Escape"&&(document.getElementById("modal-overlay").classList.add("hidden"),document.getElementById("add-card-overlay").classList.add("hidden"),!document.getElementById("auth-overlay").classList.contains("hidden")&&L&&ue(),k())});const le=document.getElementById("add-card-overlay");let O=[];function ve(){const e=document.getElementById("add-attachment-preview");if(O.length===0){e.innerHTML="";return}e.innerHTML=O.map((t,n)=>`
    <div class="attachment-thumb">
      <img src="${URL.createObjectURL(t)}" alt="${t.name}" />
      <button class="attachment-remove" data-idx="${n}" title="Remove" type="button">&times;</button>
      <span class="attachment-name">${t.name}</span>
    </div>
  `).join(""),e.querySelectorAll(".attachment-remove").forEach(t=>{t.addEventListener("click",n=>{n.stopPropagation();const a=parseInt(t.dataset.idx);O.splice(a,1),ve()})})}function He(e){for(const t of Array.from(e))t.type.startsWith("image/")&&O.push(t);ve()}document.getElementById("add-card-close").addEventListener("click",()=>{le.classList.add("hidden"),O=[],ve(),k()});le.addEventListener("click",e=>{e.target===e.currentTarget&&(le.classList.add("hidden"),O=[],ve(),k())});const G=document.getElementById("add-attachment-zone"),ae=document.getElementById("add-attachment-input");G.addEventListener("click",()=>ae.click());G.addEventListener("dragover",e=>{e.preventDefault(),G.classList.add("drop-active")});G.addEventListener("dragleave",()=>{G.classList.remove("drop-active")});G.addEventListener("drop",e=>{var n;e.preventDefault(),G.classList.remove("drop-active");const t=(n=e.dataTransfer)==null?void 0:n.files;t&&He(t)});ae.addEventListener("change",()=>{ae.files&&He(ae.files),ae.value=""});le.addEventListener("paste",e=>{var n;const t=Array.from(((n=e.clipboardData)==null?void 0:n.files)??[]).filter(a=>a.type.startsWith("image/"));t.length!==0&&(e.preventDefault(),He(t))});document.getElementById("add-card-form").addEventListener("submit",async e=>{e.preventDefault();const t=document.getElementById("add-title").value.trim();if(!t)return;const n=document.getElementById("add-priority").value,a=parseInt(document.getElementById("add-level").value)||3,o=document.getElementById("add-description").value.trim()||null,i=document.getElementById("add-tags").value.trim(),c=i?i.split(",").map(p=>p.trim()).filter(Boolean):null,l=w;if(!l){ge("Select a project first");return}const s=document.querySelector("#add-card-form .form-submit");s.textContent=O.length>0?"Creating...":"Add Card",s.disabled=!0;const d=await(await I("/api/task",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({title:t,priority:n,level:a,description:o,tags:c,project:l})})).json();O.length>0&&d.id&&await $e(d.id,O,l),O=[],s.textContent="Add Card",s.disabled=!1,document.getElementById("add-card-form").reset(),ve(),le.classList.add("hidden"),k(),q(l),B()});Xt().then(async e=>{e&&(await Et(),_e(C),ft())}).catch(()=>{X("Unable to initialize board authentication.","error")});Dt();
