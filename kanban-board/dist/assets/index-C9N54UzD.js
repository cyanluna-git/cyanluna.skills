import ct from"https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs";(function(){const n=document.createElement("link").relList;if(n&&n.supports&&n.supports("modulepreload"))return;for(const o of document.querySelectorAll('link[rel="modulepreload"]'))a(o);new MutationObserver(o=>{for(const i of o)if(i.type==="childList")for(const c of i.addedNodes)c.tagName==="LINK"&&c.rel==="modulepreload"&&a(c)}).observe(document,{childList:!0,subtree:!0});function t(o){const i={};return o.integrity&&(i.integrity=o.integrity),o.referrerPolicy&&(i.referrerPolicy=o.referrerPolicy),o.crossOrigin==="use-credentials"?i.credentials="include":o.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function a(o){if(o.ep)return;o.ep=!0;const i=t(o);fetch(o.href,i)}})();ct.initialize({startOnLoad:!1,theme:"dark",themeVariables:{primaryColor:"#334155",primaryBorderColor:"#60a5fa",primaryTextColor:"#f1f5f9",lineColor:"#64748b",secondaryColor:"#1e293b",tertiaryColor:"#0f172a"}});window.__mermaid=ct;const K=[{key:"todo",label:"Requirements",icon:"📋"},{key:"plan",label:"Plan",icon:"🗺️"},{key:"plan_review",label:"Review Plan",icon:"🔍"},{key:"impl",label:"Implement",icon:"🔨"},{key:"impl_review",label:"Review Impl",icon:"📝"},{key:"test",label:"Test",icon:"🧪"},{key:"done",label:"Done",icon:"✅"}],Rt={plan:"Planning",plan_review:"Plan Review",impl:"Implementing",impl_review:"Impl Review",test:"Testing"},ye="kanban-auth-token",Re="kanban-current-view",lt="kanban-mobile-board-columns",qt=3e4,Ot=10,kt=10,dt="kanban-summary-cache",Pt={board:3e4,full:6e4},pt=window.matchMedia("(max-width: 768px)");function Dt(){!("serviceWorker"in navigator)||!(window.location.protocol==="https:"||window.location.hostname==="localhost"||window.location.hostname==="127.0.0.1")||window.addEventListener("load",()=>{navigator.serviceWorker.register("/sw.js").catch(n=>{console.warn("Service worker registration failed",n)})})}function Mt(e){return e==="board"||e==="list"||e==="chronicle"}function Nt(e){return K.some(n=>n.key===e)}function Ht(){try{const e=localStorage.getItem(lt);if(!e)return new Set;const n=JSON.parse(e);return Array.isArray(n)?new Set(n.filter(t=>typeof t=="string"&&Nt(t))):new Set}catch{return new Set}}let $=localStorage.getItem("kanban-project"),$e=!1,b=pt.matches,I=Mt(localStorage.getItem(Re))?localStorage.getItem(Re):b?"list":"board",le="",F=localStorage.getItem("kanban-sort")||"default",R=localStorage.getItem("kanban-hide-old")==="true",T=localStorage.getItem(ye)||"",A=!1,w=!1,xe=!1,re=!b,V=Ht(),S=null,se=null,Z=null;const oe=new Map,Q=new Map,ie=new Map;function ee(e,n="default"){const t=document.getElementById("auth-message");t.textContent=e,t.classList.remove("error","success"),n!=="default"&&t.classList.add(n)}function k(){const n=[document.getElementById("modal-overlay"),document.getElementById("add-card-overlay"),document.getElementById("auth-overlay")].some(t=>t&&!t.classList.contains("hidden"));document.body.classList.toggle("overlay-open",n)}function de(){const e=document.getElementById("auth-btn");if(e){if(!A){e.textContent="Open",e.title="Board access is open in this environment";return}e.textContent=w?"Private":"Locked",e.title=w?"Shared token configured for this browser":"Shared token required"}}function X(e="Enter the shared access token to load the board.",n="default"){w=!1,document.getElementById("auth-overlay").classList.remove("hidden"),k();const t=document.getElementById("auth-token-input");t.value=T,ee(e,n),de(),setTimeout(()=>t.focus(),0)}function pe(){document.getElementById("auth-overlay").classList.add("hidden"),k(),de()}function ut(e){T=e.trim(),T?localStorage.setItem(ye,T):localStorage.removeItem(ye)}function ke(){document.body.classList.toggle("mobile-shell",b),document.body.classList.toggle("mobile-toolbar-open",!b||re);const e=document.getElementById("toolbar-mobile-toggle");if(e){const n=!b||re;e.hidden=!b,e.setAttribute("aria-expanded",String(n)),e.textContent=n?"Hide Filters":"Show Filters"}}function Ut(e){b=e,b||(re=!0),ke(),w&&I==="board"&&_()}function mt(){return window.location.hostname==="localhost"||window.location.hostname==="127.0.0.1"}function Pe(){se!==null&&(window.clearInterval(se),se=null)}function De(e=$,n="full"){return`${e||"__all__"}::${n}`}function be(e=$,n="full"){return`${dt}::${De(e,n)}`}function Ft(e=$,n="full"){try{const t=localStorage.getItem(be(e,n));if(!t)return null;const a=JSON.parse(t);return!a||typeof a.fetchedAt!="number"||!a.board?null:Date.now()-a.fetchedAt>Pt[n]?(localStorage.removeItem(be(e,n)),null):a}catch{return null}}function Vt(e,n,t,a){try{const o={fetchedAt:Date.now(),etag:a,board:t};localStorage.setItem(be(e,n),JSON.stringify(o))}catch{}}function q(e=$,n){const t=n?[n]:["board","full"];for(const a of t){const o=De(e,a);oe.delete(o),Q.delete(o),ie.delete(o);try{localStorage.removeItem(be(e,a))}catch{}}e===$&&(S=null,Z=null)}function Me(e={}){if(oe.clear(),Q.clear(),ie.clear(),S=null,Z=null,e.persisted)try{const n=[];for(let t=0;t<localStorage.length;t+=1){const a=localStorage.key(t);a!=null&&a.startsWith(`${dt}::`)&&n.push(a)}n.forEach(t=>localStorage.removeItem(t))}catch{}}function ht(){T="",localStorage.removeItem(ye);const e=document.getElementById("auth-token-input");e&&(e.value="")}async function Kt(){const e=new Headers;T&&e.set("X-Kanban-Auth",T);const t=await(await fetch("/api/auth/session",{method:"GET",headers:e,credentials:"same-origin"})).json().catch(()=>({}));return{authenticated:!!t.authenticated,authRequired:!!t.authRequired,mode:t.mode,source:t.source??null,reason:t.reason??null,error:t.error??null}}async function vt(e){const n=e.trim(),t=await fetch("/api/auth/session",{method:"POST",headers:{"X-Kanban-Auth":n},credentials:"same-origin"}),a=await t.json().catch(()=>({}));if(!t.ok){const o=a.reason==="invalid_token"?"Shared token is invalid.":a.reason==="token_hash_missing"?"Server auth is not configured yet.":"Board authentication failed.";throw new Error(o)}ut(n),A=!!a.authRequired,w=!0,pe(),de()}async function Jt(){await fetch("/api/auth/session",{method:"DELETE",credentials:"same-origin"}).catch(()=>{}),Pe(),Me({persisted:!0}),ht(),w=!A,de()}async function L(e,n={},t=!1){const a=new Headers(n.headers||{});T&&!a.has("X-Kanban-Auth")&&a.set("X-Kanban-Auth",T);const o=await fetch(e,{...n,headers:a,credentials:"same-origin"});if((o.status===401||o.status===403||o.status===503)&&!t){const i=await o.clone().json().catch(()=>({}));A=!0,w=!1,i.reason==="invalid_token"&&ht();const c=i.reason==="invalid_token"?"Stored token was rejected. Enter a valid shared token.":i.reason==="token_hash_missing"?"Server auth hash is not configured yet.":"Shared token is required for this board.";throw X(c,"error"),new Error(i.error||c)}return o}async function Ne(e=$){const n=e?`?project=${encodeURIComponent(e)}`:"",t=new Headers;Z&&t.set("If-None-Match",Z);const a=await L(`/api/board/version${n}`,{headers:t});return a.status===304?S?null:(Z=null,Ne()):(Z=a.headers.get("ETag"),a.json())}function zt(e){return e==="board"?I==="board"&&!qe():I==="list"||I==="chronicle"||I==="board"&&qe()}function qe(){return le.trim().length>0}function Wt(e,n,t,a){if(!w||ie.has(n))return;const o=(async()=>{try{const i=await Ne(a);if(!i)return;if(t&&i.version===t){S=i.version;return}q(a,e),await ue(e,{bypassTtl:!0,projectOverride:a}),$===a&&zt(e)&&_()}catch{}finally{ie.delete(n)}})();ie.set(n,o)}async function ue(e="full",n={}){const t=n.projectOverride===void 0?$:n.projectOverride,a=["summary=true"];t&&a.unshift(`project=${encodeURIComponent(t)}`),e==="board"&&a.push("compact=board",`todo_limit=${Ot}`,`done_limit=${kt}`);const o=`?${a.join("&")}`,i=De(t,e);if(!n.bypassTtl){const u=Ft(t,e);if(u)return oe.set(i,u.board),u.etag&&Q.set(i,u.etag),S=u.board.version||S,Wt(e,i,u.board.version||null,t),u.board}const c=new Headers,l=Q.get(i);l&&c.set("If-None-Match",l);const s=await L(`/api/board${o}`,{headers:c});if(s.status===304){const u=oe.get(i);return u?(S=u.version||S,u):(Q.delete(i),ue(e,{bypassTtl:!0}))}const r=await s.json(),d=s.headers.get("ETag");return d&&Q.set(i,d),oe.set(i,r),Vt(t,e,r,d),S=r.version||S,r}function Yt(){mt()||se!==null||(se=window.setInterval(async()=>{if(!w||$e)return;const e=!document.getElementById("modal-overlay").classList.contains("hidden"),n=!document.getElementById("add-card-overlay").classList.contains("hidden");if(!(e||n))try{const t=await Ne();if(!t)return;if(!S){S=t.version;return}t.version!==S&&(S=t.version,_())}catch{A&&!w&&Pe()}},qt))}function gt(){if(mt()){Pe(),Et();return}Yt()}function Zt(){const e=new URL(window.location.href),n=e.searchParams.get("auth")||e.searchParams.get("token");n&&(ut(n),e.searchParams.delete("auth"),e.searchParams.delete("token"),window.history.replaceState({},"",e.toString()))}async function Xt(){if(Zt(),T)try{return await vt(T),!0}catch(n){return X(n instanceof Error?n.message:"Board authentication failed.","error"),!1}const e=await Kt();return A=e.authRequired,w=e.authenticated||!e.authRequired,e.authRequired&&!e.authenticated?(X("Enter the shared access token to load the board."),!1):(pe(),!0)}function Se(e){return e==="high"?"high":e==="medium"?"medium":e==="low"?"low":""}function ft(){localStorage.setItem(lt,JSON.stringify([...V]))}function Gt(e){if(!b||V.size>0)return;const n=K.filter(t=>t.key==="todo"||t.key==="impl"||t.key!=="done"&&e[t.key].length>0).map(t=>t.key);V=new Set(n.length>0?n:["todo"]),ft()}function Qt(e){return!b||le.trim()?!0:V.has(e)}function we(e){var n;return((n=K.find(t=>t.key===e))==null?void 0:n.label)||e}function en(e,n){return e===1?{todo:["impl"],impl:["done"],done:[]}[n]||[]:e===2?{todo:["plan"],plan:["impl","todo"],impl:["impl_review"],impl_review:["done","impl"],done:[]}[n]||[]:{todo:["plan"],plan:["plan_review","todo"],plan_review:["impl","plan"],impl:["impl_review"],impl_review:["test","impl"],test:["done","impl"],done:[]}[n]||[]}async function tn(e,n){if(!n||n===e.status)return;const t=await L(`/api/task/${e.id}?project=${encodeURIComponent(e.project)}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({status:n})});if(!t.ok){const a=await t.json().catch(()=>({}));Be(a.error||"Failed to move task");return}q(e.project),me()}function ve(e){return e?Date.now()-new Date(e).getTime()>4320*60*1e3:!1}function yt(e,n){return F==="default"?n==="done"?[...e].sort((t,a)=>{const o=(a.completed_at||"").localeCompare(t.completed_at||"");return o!==0?o:t.rank-a.rank||t.id-a.id}):[...e].sort((t,a)=>a.rank-t.rank||a.id-t.id):[...e].sort((t,a)=>F==="created_asc"?t.created_at.localeCompare(a.created_at):F==="created_desc"?a.created_at.localeCompare(t.created_at):F==="completed_desc"?(a.completed_at||"").localeCompare(t.completed_at||""):0)}function Ie(){const e=le.toLowerCase().replace(/^#/,""),n=e.length>0||R;document.body.classList.toggle("mobile-board-search",I==="board"&&b&&e.length>0),I==="board"?(document.querySelectorAll(".card").forEach(t=>{const a=!e||(()=>{var r,d,u,p;const i=t.dataset.id||"",c=((d=(r=t.querySelector(".card-title"))==null?void 0:r.textContent)==null?void 0:d.toLowerCase())||"",l=((p=(u=t.querySelector(".card-desc"))==null?void 0:u.textContent)==null?void 0:p.toLowerCase())||"",s=[...t.querySelectorAll(".tag")].map(v=>{var m;return((m=v.textContent)==null?void 0:m.toLowerCase())||""}).join(" ");return i===e||c.includes(e)||l.includes(e)||s.includes(e)})(),o=R&&t.dataset.status==="done"&&ve(t.dataset.completedAt||"");t.style.display=a&&!o?"":"none"}),document.querySelectorAll(".column").forEach(t=>{const a=t.querySelectorAll(".card"),o=[...a].filter(s=>s.style.display!=="none").length,i=a.length,c=Number.parseInt(t.dataset.totalCount||`${i}`,10)||i,l=t.querySelector(".count");l&&(l.textContent=n||c!==i?`${o}/${c}`:`${c}`)})):I==="list"?(document.querySelectorAll("#list-view tbody tr").forEach(t=>{const a=!e||(()=>{var r,d,u,p;const i=t.dataset.id||"",c=((d=(r=t.querySelector(".col-title"))==null?void 0:r.textContent)==null?void 0:d.toLowerCase())||"",l=((p=(u=t.cells[5])==null?void 0:u.textContent)==null?void 0:p.toLowerCase())||"",s=[...t.querySelectorAll(".tag")].map(v=>{var m;return((m=v.textContent)==null?void 0:m.toLowerCase())||""}).join(" ");return i===e||c.includes(e)||l.includes(e)||s.includes(e)})(),o=R&&t.classList.contains("status-done")&&ve(t.dataset.completedAt||"");t.style.display=a&&!o?"":"none"}),document.querySelectorAll("#list-view .list-card").forEach(t=>{const a=!e||(()=>{var r,d,u;const i=t.dataset.id||"",c=((d=(r=t.querySelector(".list-card-title"))==null?void 0:r.textContent)==null?void 0:d.toLowerCase())||"",l=((u=t.dataset.project)==null?void 0:u.toLowerCase())||"",s=[...t.querySelectorAll(".tag")].map(p=>{var v;return((v=p.textContent)==null?void 0:v.toLowerCase())||""}).join(" ");return i===e||c.includes(e)||l.includes(e)||s.includes(e)})(),o=R&&t.classList.contains("status-done")&&ve(t.dataset.completedAt||"");t.style.display=a&&!o?"":"none"})):(document.querySelectorAll("#chronicle-view .chronicle-event").forEach(t=>{const a=!e||(()=>{var s,r,d;const i=t.dataset.id||"",c=((r=(s=t.querySelector(".chronicle-task-link"))==null?void 0:s.textContent)==null?void 0:r.toLowerCase())||"",l=((d=t.dataset.project)==null?void 0:d.toLowerCase())||"";return i===e||c.includes(e)||l.includes(e)})(),o=R&&ve(t.dataset.completedAt||"");t.style.display=a&&!o?"":"none"}),document.querySelectorAll("#chronicle-view .chronicle-group").forEach(t=>{const a=[...t.querySelectorAll(".chronicle-event")].filter(o=>o.style.display!=="none").length;t.style.display=a>0?"":"none"}))}function Ce(e){if(!e||e==="null")return[];try{const n=JSON.parse(e);return Array.isArray(n)?n:[]}catch{return[]}}function nn(e){const n=new Date(e+"Z"),a=new Date().getTime()-n.getTime(),o=Math.floor(a/864e5);return o===0?"today":o===1?"yesterday":o<7?`${o}d ago`:o<30?`${Math.floor(o/7)}w ago`:e.slice(0,10)}function M(e){if(!e||e==="null")return[];try{const n=JSON.parse(e);return Array.isArray(n)?n:[]}catch{return[]}}function an(e){var x,D;const n=Se(e.priority),t=n?`<span class="badge ${n}">${e.priority}</span>`:"",a=e.completed_at?`<span class="badge date">${e.completed_at.slice(0,10)}</span>`:e.created_at?`<span class="badge created">${nn(e.created_at)}</span>`:"",o=!$&&e.project?`<span class="badge project">${e.project}</span>`:"",i=Rt[e.status],c=i?`<span class="badge status-${e.status}">${i}</span>`:"",l=`<span class="badge level-${e.level}">L${e.level}</span>`,s=e.current_agent?`<span class="badge agent-tag">${e.current_agent}</span>`:"",r=e.last_review_status?[]:M(e.review_comments),d=e.last_review_status||(r.length>0?(x=r[r.length-1])==null?void 0:x.status:null),u=d?`<span class="badge ${d==="approved"?"review-approved":"review-changes"}">${d==="approved"?"Approved":"Changes Req."}</span>`:e.status==="impl_review"?'<span class="badge review-pending">Awaiting Review</span>':"",p=e.last_plan_review_status?[]:M(e.plan_review_comments),v=e.last_plan_review_status||(p.length>0?(D=p[p.length-1])==null?void 0:D.status:null),m=v?`<span class="badge ${v==="approved"?"review-approved":"review-changes"}">${v==="approved"?"Plan OK":"Plan Changes"}</span>`:e.status==="plan_review"?'<span class="badge review-pending">Plan Review</span>':"",f=Ce(e.tags).map(z=>`<span class="tag">${z}</span>`).join(""),g=e.note_count??M(e.notes).length,B=g>0?`<span class="badge notes-count" title="${g} note(s)">💬 ${g}</span>`:"",j=en(e.level,e.status).map(z=>`<option value="${z}">${we(z)}</option>`).join(""),J=j?`
      <label class="mobile-card-move card-interactive">
        <span>Move</span>
        <select class="mobile-status-select" data-id="${e.id}" data-project="${e.project}" data-current-status="${e.status}">
          <option value="${e.status}">${we(e.status)}</option>
          ${j}
        </select>
      </label>
    `:"";return`
    <div class="${b?"card mobile-card":"card"}" ${b?'draggable="false"':'draggable="true"'} data-id="${e.id}" data-status="${e.status}" data-project="${e.project}" data-completed-at="${e.completed_at||""}">
      <div class="card-header">
        <span class="card-id">#${e.id}</span>
        ${l}
        ${t}
        ${c}
        ${s}
        <button class="card-copy-btn" data-copy="#${e.id} ${e.title}" title="Copy to clipboard">⎘</button>
      </div>
      <div class="card-title">${e.title}</div>
      <div class="card-footer">
        ${o}
        ${m}
        ${u}
        ${B}
        ${a}
      </div>
      ${J}
      ${f?`<div class="card-tags">${f}</div>`:""}
    </div>
  `}function sn(e,n,t,a,o=a.length){const i=Qt(e),c=yt(a,e).map(an).join(""),l=e==="todo"?'<button class="add-card-btn" id="add-card-btn" title="Add card">+</button>':"",s=o!==a.length?`${a.length}/${o}`:`${o}`;return`
    <div class="column ${e}" data-column="${e}" data-mobile-expanded="${i}" data-total-count="${o}">
      <div class="column-header">
        <button class="column-toggle-btn" type="button" data-column-toggle="${e}" aria-expanded="${i}">
          <span class="column-toggle-label">${t} ${n}</span>
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
  `}const on=/```[\s\S]*?```/g,rn=/```\w*\n?/,nt=/```$/,at=/^```mermaid\s*\n?/,cn=/\*\*(.+?)\*\*/g,ln=/`([^`]+)`/g,dn=/^\x00CB(\d+)\x00$/,pn=/^### (.+)$/,un=/^## (.+)$/,mn=/^# (.+)$/,hn=/^[-*]\s+(.+)$/,vn=/^\d+\.\s+(.+)$/,st=/^\|(.+)\|$/,ot=/^\|[\s:-]+\|$/;let gn=0;function ce(e){const n=[];let t=e.replace(on,r=>{if(at.test(r)){const d=r.replace(at,"").replace(nt,"").trim(),u=`mermaid-${++gn}`;n.push(`<pre class="mermaid" id="${u}">${d}</pre>`)}else{const d=r.replace(rn,"").replace(nt,"");n.push(`<pre><code>${d}</code></pre>`)}return`\0CB${n.length-1}\0`});t=t.replace(/</g,"&lt;"),t=t.replace(cn,"<strong>$1</strong>").replace(ln,"<code>$1</code>");const a=t.split(`
`),o=[];let i=!1,c=!1;function l(){i&&(o.push("</ul>"),i=!1),c&&(o.push("</ol>"),c=!1)}let s=0;for(;s<a.length;){const r=a[s].trim(),d=r.match(dn);if(d){l(),o.push(n[parseInt(d[1])]),s++;continue}if(st.test(r)){l();const g=[];for(;s<a.length&&st.test(a[s].trim());)g.push(a[s].trim()),s++;if(g.length>=2){const B=ot.test(g[1]),j=B?g[0]:null,J=B?2:0;let H='<table class="md-table">';if(j){const P=j.slice(1,-1).split("|").map(x=>x.trim());H+="<thead><tr>"+P.map(x=>`<th>${x}</th>`).join("")+"</tr></thead>"}H+="<tbody>";for(let P=J;P<g.length;P++){if(ot.test(g[P]))continue;const x=g[P].slice(1,-1).split("|").map(D=>D.trim());H+="<tr>"+x.map(D=>`<td>${D}</td>`).join("")+"</tr>"}H+="</tbody></table>",o.push(H)}else o.push(`<p>${g[0]}</p>`);continue}const u=r.match(pn);if(u){l(),o.push(`<h3>${u[1]}</h3>`),s++;continue}const p=r.match(un);if(p){l(),o.push(`<h2>${p[1]}</h2>`),s++;continue}const v=r.match(mn);if(v){l(),o.push(`<h1>${v[1]}</h1>`),s++;continue}const m=r.match(hn);if(m){c&&(o.push("</ol>"),c=!1),i||(o.push("<ul>"),i=!0),o.push(`<li>${m[1]}</li>`),s++;continue}const f=r.match(vn);if(f){i&&(o.push("</ul>"),i=!1),c||(o.push("<ol>"),c=!0),o.push(`<li>${f[1]}</li>`),s++;continue}l(),r===""?o.push(""):o.push(`<p>${r}</p>`),s++}return l(),o.join(`
`)}async function fn(e){const n=window.__mermaid;if(!n)return;const t=e.querySelectorAll("pre.mermaid");if(t.length!==0)try{await n.run({nodes:t})}catch(a){console.warn("Mermaid render failed:",a)}}function ge(e,n,t,a,o){if(!a&&!o)return"";const i=a?ce(a):'<span class="phase-empty">Not yet documented</span>';return`
    <div class="lifecycle-phase ${t} ${o?"active":""}">
      <div class="phase-header">
        <span class="phase-icon">${n}</span>
        <span class="phase-label">${e}</span>
        <button class="phase-expand-btn" title="Expand to full screen">&#x26F6;</button>
      </div>
      <div class="phase-body">${i}</div>
    </div>
  `}function it(e){return e.length===0?"":e.map(n=>{var t;return`
    <div class="review-entry ${n.status}">
      <div class="review-header">
        <span class="badge ${n.status==="approved"?"review-approved":"review-changes"}">
          ${n.status==="approved"?"Approved":"Changes Requested"}
        </span>
        <span class="review-meta">${n.reviewer||""} &middot; ${((t=n.timestamp)==null?void 0:t.slice(0,16))||""}</span>
      </div>
      <div class="review-comment">${ce(n.comment||"")}</div>
    </div>
  `}).join("")}function yn(e){return e.length===0?"":e.map(n=>{var t;return`
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
      ${n.comment?`<div class="review-comment">${ce(n.comment)}</div>`:""}
    </div>
  `}).join("")}async function Oe(e,n,t){for(const a of Array.from(n)){if(!a.type.startsWith("image/"))continue;const o=new FileReader,i=await new Promise(c=>{o.onload=()=>c(o.result),o.readAsDataURL(a)});await L(`/api/task/${e}/attachment?project=${encodeURIComponent(t)}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({filename:a.name,data:i})})}N(e,t)}async function N(e,n){var i;const t=document.getElementById("modal-overlay"),a=document.getElementById("modal-content");a.innerHTML='<div style="color:#94a3b8">Loading...</div>',t.classList.remove("hidden"),k();try{const c=n?`?project=${encodeURIComponent(n)}`:"",s=await(await L(`/api/task/${e}${c}`)).json(),r=document.querySelector(`.card[data-id="${s.id}"][data-project="${CSS.escape(s.project)}"]`);r&&r.dataset.status!==s.status&&(Me(),_());const d=Ce(s.tags),u=d.length?`<div class="modal-tags">${d.map(h=>`<span class="tag">${h}</span>`).join("")}</div>`:"",p=[`<strong>Project:</strong> ${s.project}`,`<strong>Status:</strong> ${s.status}`,`<strong>Priority:</strong> ${s.priority}`,`<strong>Created:</strong> ${((i=s.created_at)==null?void 0:i.slice(0,10))||"-"}`,s.started_at?`<strong>Started:</strong> ${s.started_at.slice(0,10)}`:"",s.planned_at?`<strong>Planned:</strong> ${s.planned_at.slice(0,10)}`:"",s.reviewed_at?`<strong>Reviewed:</strong> ${s.reviewed_at.slice(0,10)}`:"",s.tested_at?`<strong>Tested:</strong> ${s.tested_at.slice(0,10)}`:"",s.completed_at?`<strong>Completed:</strong> ${s.completed_at.slice(0,10)}`:""].filter(Boolean).join(" &nbsp;|&nbsp; "),v={1:{labels:["Req","Impl","Done"],statuses:["todo","impl","done"]},2:{labels:["Req","Plan","Impl","Review","Done"],statuses:["todo","plan","impl","impl_review","done"]},3:{labels:["Req","Plan","Plan Rev","Impl","Impl Rev","Test","Done"],statuses:["todo","plan","plan_review","impl","impl_review","test","done"]}},m=v[s.level]||v[3],f=Math.max(0,m.statuses.indexOf(s.status)),g=`
      <div class="lifecycle-progress">
        <span class="level-indicator">L${s.level}</span>
        ${m.labels.map((h,y)=>`
          <div class="progress-step ${y<f?"completed":""} ${y===f?"current":""}">
            <div class="step-dot"></div>
            <span class="step-label">${h}</span>
          </div>
        `).join('<div class="progress-line"></div>')}
      </div>
    `,B=M(s.attachments),j=B.length>0?`<div class="attachments-grid">${B.map(h=>`<div class="attachment-thumb" data-stored="${h.storedName}">
            <img src="${h.url}" alt="${h.filename}" loading="lazy" />
            <button class="attachment-remove" data-id="${e}" data-name="${h.storedName}" title="Remove">&times;</button>
            <span class="attachment-name">${h.filename}</span>
          </div>`).join("")}</div>`:"",J=s.description?ce(s.description):'<span class="phase-empty">Not yet documented</span>',H=[1,2,3].map(h=>`<option value="${h}" ${h===s.level?"selected":""}>L${h}</option>`).join(""),P=`
      <div class="lifecycle-phase phase-requirement ${f===0?"active":""}">
        <div class="phase-header">
          <span class="phase-icon">📋</span>
          <span class="phase-label">Requirements</span>
          <select class="level-select" id="level-select" title="Pipeline Level">${H}</select>
          <button class="phase-edit-btn" id="req-edit-btn" title="Edit">&#9998;</button>
          <button class="phase-expand-btn" title="Expand to full screen">&#x26F6;</button>
        </div>
        <div class="phase-body" id="req-body-view">
          ${J}
          ${j}
        </div>
        <div class="phase-body hidden" id="req-body-edit">
          <textarea id="req-textarea" rows="8">${(s.description||"").replace(/</g,"&lt;")}</textarea>
          <div class="attachment-drop-zone" id="attachment-drop-zone">
            <span>📎 Drop images here or click to attach</span>
            <input type="file" id="attachment-input" accept="image/*" multiple hidden />
          </div>
          ${j?`<div id="edit-attachments">${j}</div>`:""}
          <div class="phase-edit-actions">
            <button class="phase-save-btn" id="req-save-btn">Save</button>
            <button class="phase-cancel-btn" id="req-cancel-btn">Cancel</button>
          </div>
        </div>
      </div>
    `,x=ge("Plan","🗺️","phase-plan",s.plan,f===1&&!s.plan);let D="";s.decision_log&&(D=ge("Decision Log","🧭","phase-decision-log",s.decision_log,!1));let z="";s.done_when&&(z=ge("Done When","🎯","phase-done-when",s.done_when,!1));const St=M(s.plan_review_comments),Ue=it(St);let Fe="";(Ue||f===2)&&(Fe=`
        <div class="lifecycle-phase phase-plan-review ${f===2?"active":""}">
          <div class="phase-header">
            <span class="phase-icon">🔍</span>
            <span class="phase-label">Plan Review</span>
            ${s.plan_review_count>0?`<span class="review-count">${s.plan_review_count} review(s)</span>`:""}
            <button class="phase-expand-btn" title="Expand to full screen">&#x26F6;</button>
          </div>
          <div class="phase-body">${Ue||'<span class="phase-empty">Awaiting plan review</span>'}</div>
        </div>
      `);const It=ge("Implementation","🔨","phase-impl",s.implementation_notes,f===3&&!s.implementation_notes),Ct=M(s.review_comments),Ve=it(Ct);let Ke="";(Ve||f===4)&&(Ke=`
        <div class="lifecycle-phase phase-review ${f===4?"active":""}">
          <div class="phase-header">
            <span class="phase-icon">📝</span>
            <span class="phase-label">Implementation Review</span>
            ${s.impl_review_count>0?`<span class="review-count">${s.impl_review_count} review(s)</span>`:""}
            <button class="phase-expand-btn" title="Expand to full screen">&#x26F6;</button>
          </div>
          <div class="phase-body">${Ve||'<span class="phase-empty">Awaiting implementation review</span>'}</div>
        </div>
      `);const Bt=M(s.test_results),Je=yn(Bt);let ze="";(Je||f===5)&&(ze=`
        <div class="lifecycle-phase phase-test ${f===5?"active":""}">
          <div class="phase-header">
            <span class="phase-icon">🧪</span>
            <span class="phase-label">Test Results</span>
            <button class="phase-expand-btn" title="Expand to full screen">&#x26F6;</button>
          </div>
          <div class="phase-body">${Je||'<span class="phase-empty">Awaiting test execution</span>'}</div>
        </div>
      `);const je=M(s.agent_log);let We="";if(je.length>0){let h=function(E){if(!E)return{name:"",model:null};const ne=E.toLowerCase();for(const Ae of y){const W=ne.lastIndexOf(Ae);if(W>0){let Y=W;for(;Y>0&&(E[Y-1]==="-"||E[Y-1]==="_");)Y--;return{name:E.slice(0,Y),model:E.slice(W)}}}return{name:E,model:null}};var o=h;const y=["opus","sonnet","haiku","gemini","copilot","gpt"],C=je.map(E=>{var tt;const{name:ne,model:Ae}=h(E.agent||""),W=E.model||Ae,Y=W?`<span class="badge model-tag model-${W.toLowerCase()}">${W}</span>`:"";return`
          <div class="agent-log-entry">
            <span class="agent-log-time">${((tt=E.timestamp)==null?void 0:tt.slice(0,16))||""}</span>
            <span class="badge agent-tag">${ne||E.agent||""}</span>
            ${Y}
            <span class="agent-log-msg">${E.message||""}</span>
          </div>
        `}).join("");We=`
        <details class="lifecycle-phase phase-agent-log">
          <summary class="phase-header">
            <span class="phase-icon">🤖</span>
            <span class="phase-label">Agent Log</span>
            <span class="review-count">${je.length} entries</span>
          </summary>
          <div class="phase-body agent-log-body">${C}</div>
        </details>
      `}const Ye=M(s.notes),_t=Ye.map(h=>{var y;return`
      <div class="note-entry">
        <div class="note-header">
          <span class="note-author">${h.author||"user"}</span>
          <span class="note-time">${((y=h.timestamp)==null?void 0:y.slice(0,16).replace("T"," "))||""}</span>
          <button class="note-delete" data-note-id="${h.id}" title="Delete">&times;</button>
        </div>
        <div class="note-text">${ce(h.text||"")}</div>
      </div>
    `}).join(""),jt=`
      <div class="notes-section">
        <div class="notes-header">
          <span>Notes</span>
          <span class="notes-count">${Ye.length}</span>
        </div>
        <div class="notes-list">${_t}</div>
        <form class="note-form" id="note-form">
          <textarea id="note-input" rows="2" placeholder="Add a note... (supports markdown)"></textarea>
          <button type="submit" class="note-submit">Add Note</button>
        </form>
      </div>
    `;a.innerHTML=`
      <h1>#${s.id} ${s.title}</h1>
      <div class="modal-meta">${p}</div>
      ${u}
      ${g}
      <div class="lifecycle-sections">
        ${P}
        ${x}
        ${D}
        ${z}
        ${Fe}
        ${It}
        ${Ke}
        ${ze}
        ${We}
      </div>
      ${jt}
      <div class="modal-danger-zone">
        <button class="delete-task-btn" id="delete-task-btn">Delete Card</button>
      </div>
    `,fn(a),a.querySelectorAll(".phase-expand-btn").forEach(h=>{h.addEventListener("click",y=>{y.stopPropagation();const C=h.closest(".lifecycle-phase");C==null||C.requestFullscreen().catch(()=>{})})});const Ze=document.getElementById("level-select");Ze.addEventListener("change",async()=>{const h=parseInt(Ze.value);await L(`/api/task/${e}?project=${encodeURIComponent(s.project)}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({level:h})}),q(s.project),N(e,s.project)}),document.getElementById("delete-task-btn").addEventListener("click",async()=>{confirm(`Delete card #${s.id} "${s.title}"?`)&&(await L(`/api/task/${e}?project=${encodeURIComponent(s.project)}`,{method:"DELETE"}),q(s.project),document.getElementById("modal-overlay").classList.add("hidden"),_())});const Tt=document.getElementById("req-edit-btn"),Xe=document.getElementById("req-body-view"),Ge=document.getElementById("req-body-edit"),Te=document.getElementById("req-textarea"),Qe=document.getElementById("req-save-btn"),At=document.getElementById("req-cancel-btn");Tt.addEventListener("click",()=>{Xe.classList.add("hidden"),Ge.classList.remove("hidden"),Te.focus()}),At.addEventListener("click",()=>{Te.value=s.description||"",Ge.classList.add("hidden"),Xe.classList.remove("hidden")}),Qe.addEventListener("click",async()=>{const h=Te.value;Qe.textContent="Saving...",await L(`/api/task/${e}?project=${encodeURIComponent(s.project)}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({description:h})}),q(s.project),N(e,s.project)});const U=document.getElementById("attachment-drop-zone"),te=document.getElementById("attachment-input");U&&te&&(U.addEventListener("click",()=>te.click()),U.addEventListener("dragover",h=>{h.preventDefault(),U.classList.add("drop-active")}),U.addEventListener("dragleave",()=>{U.classList.remove("drop-active")}),U.addEventListener("drop",async h=>{var C;h.preventDefault(),U.classList.remove("drop-active");const y=(C=h.dataTransfer)==null?void 0:C.files;y&&await Oe(e,y,s.project)}),te.addEventListener("change",async()=>{te.files&&await Oe(e,te.files,s.project)})),a.querySelectorAll(".attachment-remove").forEach(h=>{h.addEventListener("click",async y=>{y.stopPropagation();const C=h,E=C.dataset.id,ne=C.dataset.name;await L(`/api/task/${E}/attachment/${encodeURIComponent(ne)}?project=${encodeURIComponent(s.project)}`,{method:"DELETE"}),N(e,s.project)})});const xt=document.getElementById("note-form"),et=document.getElementById("note-input");xt.addEventListener("submit",async h=>{h.preventDefault();const y=et.value.trim();y&&(et.disabled=!0,await L(`/api/task/${e}/note?project=${encodeURIComponent(s.project)}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({text:y})}),q(s.project),N(e,s.project))}),a.querySelectorAll(".note-delete").forEach(h=>{h.addEventListener("click",async y=>{y.stopPropagation();const C=h.dataset.noteId;await L(`/api/task/${e}/note/${C}?project=${encodeURIComponent(s.project)}`,{method:"DELETE"}),q(s.project),N(e,s.project)})})}catch{a.innerHTML='<div style="color:#ef4444">Failed to load</div>'}}function $t(e){if(!e)return new Date(NaN);let n=e.replace(" ","T");return n.length===10?n+="T00:00:00Z":/Z$|[+-]\d{2}:\d{2}$/.test(n)||(n+="Z"),new Date(n)}function $n(e){const n=$t(e);if(isNaN(n.getTime()))return"Unknown";const t=n.getUTCDay()||7;n.setUTCDate(n.getUTCDate()+4-t);const a=new Date(Date.UTC(n.getUTCFullYear(),0,1)),o=Math.ceil(((n.getTime()-a.getTime())/864e5+1)/7);return`${n.getUTCFullYear()}-W${String(o).padStart(2,"0")}`}function bn(e){const n=$t(e);if(isNaN(n.getTime()))return e.slice(0,10)||"—";const t=n.toLocaleDateString(void 0,{month:"short",day:"numeric",timeZone:"UTC"}),a=n.toLocaleTimeString(void 0,{hour:"2-digit",minute:"2-digit",timeZone:"UTC",hour12:!1});return`${t}
${a}`}function wn(e){const n=Se(e.priority),t=!$&&e.project?`<span class="badge project">${e.project}</span>`:"",a=n?`<span class="badge ${n}">${e.priority}</span>`:"",o=`<span class="badge status-${e.status}">${we(e.status)}</span>`;return`
    <div class="chronicle-event" data-id="${e.id}" data-project="${e.project}" data-completed-at="${e.completed_at||""}">
      <div class="chronicle-dot ev-completed"></div>
      <div class="chronicle-event-time">${bn(e.completed_at)}</div>
      <div class="chronicle-event-body">
        <button class="chronicle-task-link" data-id="${e.id}" data-project="${e.project}">
          #${e.id} ${e.title}
        </button>
        ${o}
        ${a}
        ${t}
      </div>
    </div>`}function En(e){var d,u;const n=Se(e.priority),t=n?`<span class="badge ${n}">${e.priority}</span>`:"",a=!$&&e.project?`<span class="badge project">${e.project}</span>`:"",o=`<span class="badge status-${e.status}">${we(e.status)}</span>`,i=`<span class="badge level-${e.level}">L${e.level}</span>`,c=((d=e.created_at)==null?void 0:d.slice(0,10))||"",l=((u=e.completed_at)==null?void 0:u.slice(0,10))||"—",r=Ce(e.tags).map(p=>`<span class="tag">${p}</span>`).join("");return`
    <article class="list-card status-${e.status}" data-id="${e.id}" data-project="${e.project}" data-completed-at="${e.completed_at||""}">
      <div class="list-card-top">
        <div class="list-card-meta">
          <span class="list-card-id">#${e.id}</span>
          ${o}
          ${i}
          ${t}
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
            ${K.map(p=>`<option value="${p.key}" ${p.key===e.status?"selected":""}>${p.label}</option>`).join("")}
          </select>
        </label>
        <label>
          <span>Level</span>
          <select class="list-level-select" data-id="${e.id}" data-field="level">
            ${[1,2,3].map(p=>`<option value="${p}" ${p===e.level?"selected":""}>L${p}</option>`).join("")}
          </select>
        </label>
        <label>
          <span>Priority</span>
          <select class="list-priority-select ${n}" data-id="${e.id}" data-field="priority">
            ${["high","medium","low"].map(p=>`<option value="${p}" ${p===e.priority?"selected":""}>${p[0].toUpperCase()+p.slice(1)}</option>`).join("")}
          </select>
        </label>
      </div>
      ${r?`<div class="list-card-tags">${r}</div>`:""}
    </article>
  `}async function bt(){const e=document.getElementById("chronicle-view");try{const n=await ue("full");He(n.projects);const t=[];for(const c of K)for(const l of n[c.key])t.push(l);const a=t.filter(c=>!!c.completed_at).sort((c,l)=>l.completed_at.localeCompare(c.completed_at)),o=new Map;for(const c of a){const l=$n(c.completed_at);o.has(l)||o.set(l,[]),o.get(l).push(c)}if(o.size===0){e.innerHTML=`
        <div style="display:flex;align-items:center;justify-content:center;color:#64748b;font-size:0.9rem;padding:64px">
          No completed tasks yet
        </div>`;return}const i=[...o.entries()].map(([c,l])=>{const s=l.map(wn).join("");return`
        <div class="chronicle-group">
          <div class="chronicle-week-header">${c}</div>
          <div class="chronicle-events">${s}</div>
        </div>`}).join("");e.innerHTML=`<div class="chronicle-timeline">${i}</div>`,e.querySelectorAll(".chronicle-task-link").forEach(c=>{c.addEventListener("click",l=>{l.stopPropagation();const s=parseInt(c.dataset.id),r=c.dataset.project||void 0;N(s,r)})})}catch(n){console.error("loadChronicleView failed:",n),e.innerHTML=`
      <div style="display:flex;align-items:center;justify-content:center;color:#ef4444;font-size:0.9rem;padding:48px">
        Failed to load chronicle
      </div>`}}async function me(){var n,t,a,o,i,c,l,s;const e=document.getElementById("board");try{const r=await ue(qe()?"full":"board");Gt(r),He(r.projects),e.innerHTML=K.map(v=>{var m;return sn(v.key,v.label,v.icon,r[v.key],((m=r.counts)==null?void 0:m[v.key])??r[v.key].length)}).join("");const d=((n=r.counts)==null?void 0:n.done)??r.done.length,u=r.total??(((t=r.counts)==null?void 0:t.todo)??r.todo.length)+(((a=r.counts)==null?void 0:a.plan)??r.plan.length)+(((o=r.counts)==null?void 0:o.plan_review)??r.plan_review.length)+(((i=r.counts)==null?void 0:i.impl)??r.impl.length)+(((c=r.counts)==null?void 0:c.impl_review)??r.impl_review.length)+(((l=r.counts)==null?void 0:l.test)??r.test.length)+(((s=r.counts)==null?void 0:s.done)??r.done.length);document.getElementById("count-summary").textContent=`${d}/${u} completed`,e.querySelectorAll(".card").forEach(v=>{v.addEventListener("click",m=>{if(m.target.closest(".card-interactive")){m.stopPropagation();return}const g=m.target.closest(".card-copy-btn");if(g){m.stopPropagation(),navigator.clipboard.writeText(g.dataset.copy).then(()=>{const J=g.textContent;g.textContent="✓",setTimeout(()=>{g.textContent=J},1e3)});return}const B=parseInt(v.dataset.id),j=v.dataset.project;N(B,j)})}),b||In(),Ln(),Ie();const p=document.getElementById("add-card-btn");p&&p.addEventListener("click",v=>{v.stopPropagation(),document.getElementById("add-card-overlay").classList.remove("hidden"),k(),b||document.getElementById("add-title").focus()})}catch(r){console.error("loadBoard failed:",r),e.innerHTML=`
      <div style="grid-column:1/-1;display:flex;align-items:center;justify-content:center;color:#ef4444;font-size:0.9rem;padding:48px">
        Cannot find .claude/kanban.db
      </div>
    `}}function Ln(){document.querySelectorAll("[data-column-toggle]").forEach(e=>{e.addEventListener("click",n=>{if(!b)return;n.stopPropagation();const t=e.dataset.columnToggle;if(!t)return;V.has(t)?V.delete(t):V.add(t),ft();const a=e.closest(".column"),o=V.has(t)||!!le.trim();a&&a.setAttribute("data-mobile-expanded",String(o)),e.setAttribute("aria-expanded",String(o));const i=e.querySelector(".column-toggle-icon");i&&(i.textContent=o?"−":"+")})}),document.querySelectorAll(".mobile-status-select").forEach(e=>{e.addEventListener("click",n=>n.stopPropagation()),e.addEventListener("change",async n=>{n.stopPropagation();const t=e.value,a=parseInt(e.dataset.id||"",10),o=e.dataset.project||"",i=e.dataset.currentStatus||"";!a||!o||await tn({id:a,project:o,status:i},t)})})}async function Ee(){const e=document.getElementById("list-view");try{const n=await ue("full");He(n.projects);const t=[];for(const s of K)for(const r of n[s.key])t.push(r);const a=F==="default"?[...t].sort((s,r)=>r.id-s.id):yt(t),o=a.length,i=a.filter(s=>s.status==="done").length;document.getElementById("count-summary").textContent=`${i}/${o} completed`;const c=a.map(s=>{var p,v;const r=Se(s.priority),u=Ce(s.tags).map(m=>`<span class="tag">${m}</span>`).join("");return`
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
          <td>${u}</td>
          <td class="list-date">${((p=s.created_at)==null?void 0:p.slice(0,10))||""}</td>
          <td class="list-date">${((v=s.completed_at)==null?void 0:v.slice(0,10))||""}</td>
        </tr>
      `}).join(""),l=a.map(En).join("");e.innerHTML=`
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
    `,e.querySelectorAll("select").forEach(s=>{s.addEventListener("change",async r=>{r.stopPropagation();const d=s,u=d.dataset.id,p=d.dataset.field;let v=d.value;p==="level"&&(v=parseInt(v));const m=d.closest("tr"),f=(m==null?void 0:m.dataset.project)||"",g=await L(`/api/task/${u}?project=${encodeURIComponent(f)}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({[p]:v})});if(!g.ok){const B=await g.json().catch(()=>({}));B.error&&Be(B.error),Ee();return}q(f),Ee()})}),e.querySelectorAll(".col-title").forEach(s=>{s.addEventListener("click",r=>{r.stopPropagation();const d=s.closest("[data-id]"),u=parseInt(d.dataset.id),p=d.dataset.project;N(u,p)})}),Ie()}catch(n){console.error("loadListView failed:",n),e.innerHTML=`
      <div style="display:flex;align-items:center;justify-content:center;color:#ef4444;font-size:0.9rem;padding:48px">
        Failed to load task list
      </div>
    `}}function He(e){const n=document.getElementById("project-filter");if(e.length<=1){n.innerHTML=e[0]?`<span class="project-label">${e[0]}</span>`:"";return}const t=e.map(a=>`<option value="${a}" ${a===$?"selected":""}>${a}</option>`).join("");n.innerHTML=`
    <select id="project-select">
      <option value="">All Projects</option>
      ${t}
    </select>
  `,document.getElementById("project-select").addEventListener("change",a=>{$=a.target.value||null,$?localStorage.setItem("kanban-project",$):localStorage.removeItem("kanban-project"),S=null,Z=null,_()})}function rt(e,n){const t=[...e.querySelectorAll(".card:not(.dragging)")];for(const a of t){const o=a.getBoundingClientRect(),i=o.top+o.height/2;if(n<i)return a}return null}function fe(){document.querySelectorAll(".drop-indicator").forEach(e=>e.remove())}function Sn(e,n){fe();const t=document.createElement("div");t.className="drop-indicator",n?e.insertBefore(t,n):e.appendChild(t)}function In(){const e=document.querySelectorAll(".card"),n=document.querySelectorAll(".column-body");e.forEach(t=>{t.addEventListener("dragstart",a=>{const o=a,i=t;o.dataTransfer.setData("text/plain",`${i.dataset.project}:${i.dataset.id}`),i.classList.add("dragging"),$e=!0}),t.addEventListener("dragend",()=>{t.classList.remove("dragging"),fe(),$e=!1})}),n.forEach(t=>{t.addEventListener("dragover",a=>{a.preventDefault();const o=t;o.classList.add("drag-over");const i=rt(o,a.clientY);Sn(o,i)}),t.addEventListener("dragleave",a=>{const o=t;o.contains(a.relatedTarget)||(o.classList.remove("drag-over"),fe())}),t.addEventListener("drop",async a=>{a.preventDefault();const o=t;o.classList.remove("drag-over"),fe();const i=a,c=i.dataTransfer.getData("text/plain"),l=c.lastIndexOf(":"),s=l>=0?c.slice(0,l):"",r=parseInt(l>=0?c.slice(l+1):c),d=o.dataset.column,u=rt(o,i.clientY),p=[...o.querySelectorAll(".card:not(.dragging)")];let v=null,m=null;if(u){m=parseInt(u.dataset.id);const g=p.indexOf(u);g>0&&(v=parseInt(p[g-1].dataset.id))}else p.length>0&&(v=parseInt(p[p.length-1].dataset.id));const f=await L(`/api/task/${r}/reorder?project=${encodeURIComponent(s)}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({status:d,afterId:v,beforeId:m})});if(!f.ok){const g=await f.json().catch(()=>({}));g.error&&Be(g.error)}q(s),me()})})}function Be(e){const n=document.querySelector(".toast");n&&n.remove();const t=document.createElement("div");t.className="toast",t.textContent=e,document.body.appendChild(t),setTimeout(()=>t.remove(),3e3)}async function wt(){try{const n=await(await L("/api/info")).json();n.projectName&&(document.title=`Kanban · ${n.projectName}`,document.querySelector("header h1").textContent=`Kanban · ${n.projectName}`)}catch{}}function _e(e){I=e,localStorage.setItem(Re,I);const n=document.getElementById("board"),t=document.getElementById("list-view"),a=document.getElementById("chronicle-view");n.classList.add("hidden"),t.classList.add("hidden"),a.classList.add("hidden"),document.getElementById("tab-board").classList.remove("active"),document.getElementById("tab-list").classList.remove("active"),document.getElementById("tab-chronicle").classList.remove("active"),e==="board"?(n.classList.remove("hidden"),document.getElementById("tab-board").classList.add("active"),me()):e==="list"?(t.classList.remove("hidden"),document.getElementById("tab-list").classList.add("active"),Ee()):(a.classList.remove("hidden"),document.getElementById("tab-chronicle").classList.add("active"),bt())}function _(){I==="board"?me():I==="list"?Ee():bt()}document.getElementById("sort-select").value=F;R&&document.getElementById("hide-done-btn").classList.add("active");de();ke();document.getElementById("auth-btn").addEventListener("click",()=>{if(A&&w){X("Shared token is stored on this device. Use Forget Token to reset it.","success");return}X(A?"Enter the shared access token to load the board.":"This environment does not require a shared token.")});document.getElementById("auth-close").addEventListener("click",()=>{A&&!w||pe()});document.getElementById("auth-clear-btn").addEventListener("click",async()=>{await Jt(),A?X("Stored token cleared. Enter a shared access token to continue."):(pe(),ee("Stored token cleared."))});document.getElementById("auth-form").addEventListener("submit",async e=>{e.preventDefault();const t=document.getElementById("auth-token-input").value.trim();if(!t){ee("Enter the shared access token.","error");return}ee("Unlocking board...","default");try{await vt(t),ee("Board unlocked.","success"),await wt(),gt(),_()}catch(a){ee(a instanceof Error?a.message:"Board authentication failed.","error")}});document.getElementById("tab-board").addEventListener("click",()=>_e("board"));document.getElementById("tab-list").addEventListener("click",()=>_e("list"));document.getElementById("tab-chronicle").addEventListener("click",()=>_e("chronicle"));document.getElementById("toolbar-mobile-toggle").addEventListener("click",()=>{re=!re,ke()});pt.addEventListener("change",e=>{Ut(e.matches)});document.addEventListener("visibilitychange",()=>{document.visibilityState!=="visible"||!w||(Me(),_())});function Et(){if(xe)return;xe=!0;const e=new EventSource("/api/events");e.onmessage=()=>{if($e)return;const n=!document.getElementById("modal-overlay").classList.contains("hidden"),t=!document.getElementById("add-card-overlay").classList.contains("hidden");!n&&!t&&_()},e.onerror=()=>{e.close(),xe=!1,(!A||w)&&setTimeout(Et,5e3)}}document.getElementById("refresh-btn").addEventListener("click",_);document.getElementById("search-input").addEventListener("input",e=>{if(le=e.target.value.trim(),I==="board"){me();return}Ie()});document.getElementById("sort-select").addEventListener("change",e=>{F=e.target.value,localStorage.setItem("kanban-sort",F),_()});document.getElementById("hide-done-btn").addEventListener("click",()=>{R=!R,localStorage.setItem("kanban-hide-old",String(R)),document.getElementById("hide-done-btn").classList.toggle("active",R),Ie()});document.getElementById("modal-close").addEventListener("click",()=>{document.getElementById("modal-overlay").classList.add("hidden"),k()});document.getElementById("modal-overlay").addEventListener("click",e=>{e.target===e.currentTarget&&(document.getElementById("modal-overlay").classList.add("hidden"),k())});document.addEventListener("keydown",e=>{e.key==="Escape"&&(document.getElementById("modal-overlay").classList.add("hidden"),document.getElementById("add-card-overlay").classList.add("hidden"),!document.getElementById("auth-overlay").classList.contains("hidden")&&w&&pe(),k())});const Le=document.getElementById("add-card-overlay");let O=[];function he(){const e=document.getElementById("add-attachment-preview");if(O.length===0){e.innerHTML="";return}e.innerHTML=O.map((n,t)=>`
    <div class="attachment-thumb">
      <img src="${URL.createObjectURL(n)}" alt="${n.name}" />
      <button class="attachment-remove" data-idx="${t}" title="Remove" type="button">&times;</button>
      <span class="attachment-name">${n.name}</span>
    </div>
  `).join(""),e.querySelectorAll(".attachment-remove").forEach(n=>{n.addEventListener("click",t=>{t.stopPropagation();const a=parseInt(n.dataset.idx);O.splice(a,1),he()})})}function Lt(e){for(const n of Array.from(e))n.type.startsWith("image/")&&O.push(n);he()}document.getElementById("add-card-close").addEventListener("click",()=>{Le.classList.add("hidden"),O=[],he(),k()});Le.addEventListener("click",e=>{e.target===e.currentTarget&&(Le.classList.add("hidden"),O=[],he(),k())});const G=document.getElementById("add-attachment-zone"),ae=document.getElementById("add-attachment-input");G.addEventListener("click",()=>ae.click());G.addEventListener("dragover",e=>{e.preventDefault(),G.classList.add("drop-active")});G.addEventListener("dragleave",()=>{G.classList.remove("drop-active")});G.addEventListener("drop",e=>{var t;e.preventDefault(),G.classList.remove("drop-active");const n=(t=e.dataTransfer)==null?void 0:t.files;n&&Lt(n)});ae.addEventListener("change",()=>{ae.files&&Lt(ae.files),ae.value=""});document.getElementById("add-card-form").addEventListener("submit",async e=>{e.preventDefault();const n=document.getElementById("add-title").value.trim();if(!n)return;const t=document.getElementById("add-priority").value,a=parseInt(document.getElementById("add-level").value)||3,o=document.getElementById("add-description").value.trim()||null,i=document.getElementById("add-tags").value.trim(),c=i?i.split(",").map(u=>u.trim()).filter(Boolean):null,l=$;if(!l){Be("Select a project first");return}const s=document.querySelector("#add-card-form .form-submit");s.textContent=O.length>0?"Creating...":"Add Card",s.disabled=!0;const d=await(await L("/api/task",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({title:n,priority:t,level:a,description:o,tags:c,project:l})})).json();O.length>0&&d.id&&await Oe(d.id,O,l),O=[],s.textContent="Add Card",s.disabled=!1,document.getElementById("add-card-form").reset(),he(),Le.classList.add("hidden"),k(),q(l),_()});Xt().then(async e=>{e&&(await wt(),_e(I),gt())}).catch(()=>{X("Unable to initialize board authentication.","error")});Dt();
