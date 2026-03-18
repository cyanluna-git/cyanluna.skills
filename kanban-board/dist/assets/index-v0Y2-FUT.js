import ct from"https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs";(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const o of document.querySelectorAll('link[rel="modulepreload"]'))s(o);new MutationObserver(o=>{for(const i of o)if(i.type==="childList")for(const c of i.addedNodes)c.tagName==="LINK"&&c.rel==="modulepreload"&&s(c)}).observe(document,{childList:!0,subtree:!0});function n(o){const i={};return o.integrity&&(i.integrity=o.integrity),o.referrerPolicy&&(i.referrerPolicy=o.referrerPolicy),o.crossOrigin==="use-credentials"?i.credentials="include":o.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function s(o){if(o.ep)return;o.ep=!0;const i=n(o);fetch(o.href,i)}})();ct.initialize({startOnLoad:!1,theme:"dark",themeVariables:{primaryColor:"#334155",primaryBorderColor:"#60a5fa",primaryTextColor:"#f1f5f9",lineColor:"#64748b",secondaryColor:"#1e293b",tertiaryColor:"#0f172a"}});window.__mermaid=ct;const K=[{key:"todo",label:"Requirements",icon:"📋"},{key:"plan",label:"Plan",icon:"🗺️"},{key:"plan_review",label:"Review Plan",icon:"🔍"},{key:"impl",label:"Implement",icon:"🔨"},{key:"impl_review",label:"Review Impl",icon:"📝"},{key:"test",label:"Test",icon:"🧪"},{key:"done",label:"Done",icon:"✅"}],xt={plan:"Planning",plan_review:"Plan Review",impl:"Implementing",impl_review:"Impl Review",test:"Testing"},$e="kanban-auth-token",xe="kanban-current-view",lt="kanban-mobile-board-columns",qt=3e4,Ot=10,kt=10,dt="kanban-summary-cache",Pt={board:3e4,full:6e4},pt=window.matchMedia("(max-width: 768px)");function Dt(){!("serviceWorker"in navigator)||!(window.location.protocol==="https:"||window.location.hostname==="localhost"||window.location.hostname==="127.0.0.1")||window.addEventListener("load",()=>{navigator.serviceWorker.register("/sw.js").catch(t=>{console.warn("Service worker registration failed",t)})})}function Mt(e){return e==="board"||e==="list"||e==="chronicle"}function Ut(e){return K.some(t=>t.key===e)}function Nt(){try{const e=localStorage.getItem(lt);if(!e)return new Set;const t=JSON.parse(e);return Array.isArray(t)?new Set(t.filter(n=>typeof n=="string"&&Ut(n))):new Set}catch{return new Set}}let $=localStorage.getItem("kanban-project"),be=!1,b=pt.matches,S=Mt(localStorage.getItem(xe))?localStorage.getItem(xe):b?"list":"board",le="",F=localStorage.getItem("kanban-sort")||"default",x=localStorage.getItem("kanban-hide-old")==="true",T=localStorage.getItem($e)||"",A=!1,w=!1,Re=!1,re=!b,V=Nt(),I=null,se=null,Z=null;const oe=new Map,Q=new Map,ie=new Map;function ee(e,t="default"){const n=document.getElementById("auth-message");n.textContent=e,n.classList.remove("error","success"),t!=="default"&&n.classList.add(t)}function k(){const t=[document.getElementById("modal-overlay"),document.getElementById("add-card-overlay"),document.getElementById("auth-overlay")].some(n=>n&&!n.classList.contains("hidden"));document.body.classList.toggle("overlay-open",t)}function de(){const e=document.getElementById("auth-btn");if(e){if(!A){e.textContent="Open",e.title="Board access is open in this environment";return}e.textContent=w?"Private":"Locked",e.title=w?"Shared token configured for this browser":"Shared token required"}}function X(e="Enter the shared access token to load the board.",t="default"){w=!1,document.getElementById("auth-overlay").classList.remove("hidden"),k();const n=document.getElementById("auth-token-input");n.value=T,ee(e,t),de(),setTimeout(()=>n.focus(),0)}function pe(){document.getElementById("auth-overlay").classList.add("hidden"),k(),de()}function ut(e){T=e.trim(),T?localStorage.setItem($e,T):localStorage.removeItem($e)}function ke(){document.body.classList.toggle("mobile-shell",b),document.body.classList.toggle("mobile-toolbar-open",!b||re);const e=document.getElementById("toolbar-mobile-toggle");if(e){const t=!b||re;e.hidden=!b,e.setAttribute("aria-expanded",String(t)),e.textContent=t?"Hide Filters":"Show Filters"}}function Ht(e){b=e,b||(re=!0),ke(),w&&S==="board"&&B()}function mt(){return window.location.hostname==="localhost"||window.location.hostname==="127.0.0.1"}function Pe(){se!==null&&(window.clearInterval(se),se=null)}function De(e=$,t="full"){return`${e||"__all__"}::${t}`}function we(e=$,t="full"){return`${dt}::${De(e,t)}`}function Ft(e=$,t="full"){try{const n=localStorage.getItem(we(e,t));if(!n)return null;const s=JSON.parse(n);return!s||typeof s.fetchedAt!="number"||!s.board?null:Date.now()-s.fetchedAt>Pt[t]?(localStorage.removeItem(we(e,t)),null):s}catch{return null}}function Vt(e,t,n,s){try{const o={fetchedAt:Date.now(),etag:s,board:n};localStorage.setItem(we(e,t),JSON.stringify(o))}catch{}}function q(e=$,t){const n=t?[t]:["board","full"];for(const s of n){const o=De(e,s);oe.delete(o),Q.delete(o),ie.delete(o);try{localStorage.removeItem(we(e,s))}catch{}}e===$&&(I=null,Z=null)}function Me(e={}){if(oe.clear(),Q.clear(),ie.clear(),I=null,Z=null,e.persisted)try{const t=[];for(let n=0;n<localStorage.length;n+=1){const s=localStorage.key(n);s!=null&&s.startsWith(`${dt}::`)&&t.push(s)}t.forEach(n=>localStorage.removeItem(n))}catch{}}function ht(){T="",localStorage.removeItem($e);const e=document.getElementById("auth-token-input");e&&(e.value="")}async function Kt(){const e=new Headers;T&&e.set("X-Kanban-Auth",T);const n=await(await fetch("/api/auth/session",{method:"GET",headers:e,credentials:"same-origin"})).json().catch(()=>({}));return{authenticated:!!n.authenticated,authRequired:!!n.authRequired,mode:n.mode,source:n.source??null,reason:n.reason??null,error:n.error??null}}async function gt(e){const t=e.trim(),n=await fetch("/api/auth/session",{method:"POST",headers:{"X-Kanban-Auth":t},credentials:"same-origin"}),s=await n.json().catch(()=>({}));if(!n.ok){const o=s.reason==="invalid_token"?"Shared token is invalid.":s.reason==="token_hash_missing"?"Server auth is not configured yet.":"Board authentication failed.";throw new Error(o)}ut(t),A=!!s.authRequired,w=!0,pe(),de()}async function Jt(){await fetch("/api/auth/session",{method:"DELETE",credentials:"same-origin"}).catch(()=>{}),Pe(),Me({persisted:!0}),ht(),w=!A,de()}async function L(e,t={},n=!1){const s=new Headers(t.headers||{});T&&!s.has("X-Kanban-Auth")&&s.set("X-Kanban-Auth",T);const o=await fetch(e,{...t,headers:s,credentials:"same-origin"});if((o.status===401||o.status===403||o.status===503)&&!n){const i=await o.clone().json().catch(()=>({}));A=!0,w=!1,i.reason==="invalid_token"&&ht();const c=i.reason==="invalid_token"?"Stored token was rejected. Enter a valid shared token.":i.reason==="token_hash_missing"?"Server auth hash is not configured yet.":"Shared token is required for this board.";throw X(c,"error"),new Error(i.error||c)}return o}async function Ue(e=$){const t=e?`?project=${encodeURIComponent(e)}`:"",n=new Headers;Z&&n.set("If-None-Match",Z);const s=await L(`/api/board/version${t}`,{headers:n});return s.status===304?I?null:(Z=null,Ue()):(Z=s.headers.get("ETag"),s.json())}function Wt(e){return e==="board"?S==="board"&&!qe():S==="list"||S==="chronicle"||S==="board"&&qe()}function qe(){return le.trim().length>0}function Yt(e,t,n,s){if(!w||ie.has(t))return;const o=(async()=>{try{const i=await Ue(s);if(!i)return;if(n&&i.version===n){I=i.version;return}q(s,e),await ue(e,{bypassTtl:!0,projectOverride:s}),$===s&&Wt(e)&&B()}catch{}finally{ie.delete(t)}})();ie.set(t,o)}async function ue(e="full",t={}){const n=t.projectOverride===void 0?$:t.projectOverride,s=["summary=true"];n&&s.unshift(`project=${encodeURIComponent(n)}`),e==="board"&&s.push("compact=board",`todo_limit=${Ot}`,`done_limit=${kt}`);const o=`?${s.join("&")}`,i=De(n,e);if(!t.bypassTtl){const p=Ft(n,e);if(p)return oe.set(i,p.board),p.etag&&Q.set(i,p.etag),I=p.board.version||I,Yt(e,i,p.board.version||null,n),p.board}const c=new Headers,l=Q.get(i);l&&c.set("If-None-Match",l);const a=await L(`/api/board${o}`,{headers:c});if(a.status===304){const p=oe.get(i);return p?(I=p.version||I,p):(Q.delete(i),ue(e,{bypassTtl:!0}))}const r=await a.json(),d=a.headers.get("ETag");return d&&Q.set(i,d),oe.set(i,r),Vt(n,e,r,d),I=r.version||I,r}function zt(){mt()||se!==null||(se=window.setInterval(async()=>{if(!w||be)return;const e=!document.getElementById("modal-overlay").classList.contains("hidden"),t=!document.getElementById("add-card-overlay").classList.contains("hidden");if(!(e||t))try{const n=await Ue();if(!n)return;if(!I){I=n.version;return}n.version!==I&&(I=n.version,B())}catch{A&&!w&&Pe()}},qt))}function vt(){if(mt()){Pe(),Et();return}zt()}function Zt(){const e=new URL(window.location.href),t=e.searchParams.get("auth")||e.searchParams.get("token");t&&(ut(t),e.searchParams.delete("auth"),e.searchParams.delete("token"),window.history.replaceState({},"",e.toString()))}async function Xt(){if(Zt(),T)try{return await gt(T),!0}catch(t){return X(t instanceof Error?t.message:"Board authentication failed.","error"),!1}const e=await Kt();return A=e.authRequired,w=e.authenticated||!e.authRequired,e.authRequired&&!e.authenticated?(X("Enter the shared access token to load the board."),!1):(pe(),!0)}function Se(e){return e==="high"?"high":e==="medium"?"medium":e==="low"?"low":""}function ft(){localStorage.setItem(lt,JSON.stringify([...V]))}function Gt(e){if(!b||V.size>0)return;const t=K.filter(n=>n.key==="todo"||n.key==="impl"||n.key!=="done"&&e[n.key].length>0).map(n=>n.key);V=new Set(t.length>0?t:["todo"]),ft()}function Qt(e){return!b||le.trim()?!0:V.has(e)}function Ee(e){var t;return((t=K.find(n=>n.key===e))==null?void 0:t.label)||e}function en(e,t){return e===1?{todo:["impl"],impl:["done"],done:[]}[t]||[]:e===2?{todo:["plan"],plan:["impl","todo"],impl:["impl_review"],impl_review:["done","impl"],done:[]}[t]||[]:{todo:["plan"],plan:["plan_review","todo"],plan_review:["impl","plan"],impl:["impl_review"],impl_review:["test","impl"],test:["done","impl"],done:[]}[t]||[]}async function tn(e,t){if(!t||t===e.status)return;const n=await L(`/api/task/${e.id}?project=${encodeURIComponent(e.project)}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({status:t})});if(!n.ok){const s=await n.json().catch(()=>({}));he(s.error||"Failed to move task");return}q(e.project),me()}function ve(e){return e?Date.now()-new Date(e).getTime()>4320*60*1e3:!1}function yt(e,t){return F==="default"?t==="done"?[...e].sort((n,s)=>{const o=(s.completed_at||"").localeCompare(n.completed_at||"");return o!==0?o:n.rank-s.rank||n.id-s.id}):[...e].sort((n,s)=>s.rank-n.rank||s.id-n.id):[...e].sort((n,s)=>F==="created_asc"?n.created_at.localeCompare(s.created_at):F==="created_desc"?s.created_at.localeCompare(n.created_at):F==="completed_desc"?(s.completed_at||"").localeCompare(n.completed_at||""):0)}function Ce(){const e=le.toLowerCase().replace(/^#/,""),t=e.length>0||x;document.body.classList.toggle("mobile-board-search",S==="board"&&b&&e.length>0),S==="board"?(document.querySelectorAll(".card").forEach(n=>{const s=!e||(()=>{var r,d,p,u;const i=n.dataset.id||"",c=((d=(r=n.querySelector(".card-title"))==null?void 0:r.textContent)==null?void 0:d.toLowerCase())||"",l=((u=(p=n.querySelector(".card-desc"))==null?void 0:p.textContent)==null?void 0:u.toLowerCase())||"",a=[...n.querySelectorAll(".tag")].map(g=>{var m;return((m=g.textContent)==null?void 0:m.toLowerCase())||""}).join(" ");return i===e||c.includes(e)||l.includes(e)||a.includes(e)})(),o=x&&n.dataset.status==="done"&&ve(n.dataset.completedAt||"");n.style.display=s&&!o?"":"none"}),document.querySelectorAll(".column").forEach(n=>{const s=n.querySelectorAll(".card"),o=[...s].filter(a=>a.style.display!=="none").length,i=s.length,c=Number.parseInt(n.dataset.totalCount||`${i}`,10)||i,l=n.querySelector(".count");l&&(l.textContent=t||c!==i?`${o}/${c}`:`${c}`)})):S==="list"?(document.querySelectorAll("#list-view tbody tr").forEach(n=>{const s=!e||(()=>{var r,d,p,u;const i=n.dataset.id||"",c=((d=(r=n.querySelector(".col-title"))==null?void 0:r.textContent)==null?void 0:d.toLowerCase())||"",l=((u=(p=n.cells[5])==null?void 0:p.textContent)==null?void 0:u.toLowerCase())||"",a=[...n.querySelectorAll(".tag")].map(g=>{var m;return((m=g.textContent)==null?void 0:m.toLowerCase())||""}).join(" ");return i===e||c.includes(e)||l.includes(e)||a.includes(e)})(),o=x&&n.classList.contains("status-done")&&ve(n.dataset.completedAt||"");n.style.display=s&&!o?"":"none"}),document.querySelectorAll("#list-view .list-card").forEach(n=>{const s=!e||(()=>{var r,d,p;const i=n.dataset.id||"",c=((d=(r=n.querySelector(".list-card-title"))==null?void 0:r.textContent)==null?void 0:d.toLowerCase())||"",l=((p=n.dataset.project)==null?void 0:p.toLowerCase())||"",a=[...n.querySelectorAll(".tag")].map(u=>{var g;return((g=u.textContent)==null?void 0:g.toLowerCase())||""}).join(" ");return i===e||c.includes(e)||l.includes(e)||a.includes(e)})(),o=x&&n.classList.contains("status-done")&&ve(n.dataset.completedAt||"");n.style.display=s&&!o?"":"none"})):(document.querySelectorAll("#chronicle-view .chronicle-event").forEach(n=>{const s=!e||(()=>{var a,r,d;const i=n.dataset.id||"",c=((r=(a=n.querySelector(".chronicle-task-link"))==null?void 0:a.textContent)==null?void 0:r.toLowerCase())||"",l=((d=n.dataset.project)==null?void 0:d.toLowerCase())||"";return i===e||c.includes(e)||l.includes(e)})(),o=x&&ve(n.dataset.completedAt||"");n.style.display=s&&!o?"":"none"}),document.querySelectorAll("#chronicle-view .chronicle-group").forEach(n=>{const s=[...n.querySelectorAll(".chronicle-event")].filter(o=>o.style.display!=="none").length;n.style.display=s>0?"":"none"}))}function je(e){if(!e||e==="null")return[];try{const t=JSON.parse(e);return Array.isArray(t)?t:[]}catch{return[]}}function nn(e){const t=new Date(e+"Z"),s=new Date().getTime()-t.getTime(),o=Math.floor(s/864e5);return o===0?"today":o===1?"yesterday":o<7?`${o}d ago`:o<30?`${Math.floor(o/7)}w ago`:e.slice(0,10)}function M(e){if(!e||e==="null")return[];try{const t=JSON.parse(e);return Array.isArray(t)?t:[]}catch{return[]}}function an(e){var R,D;const t=Se(e.priority),n=t?`<span class="badge ${t}">${e.priority}</span>`:"",s=e.completed_at?`<span class="badge date">${e.completed_at.slice(0,10)}</span>`:e.created_at?`<span class="badge created">${nn(e.created_at)}</span>`:"",o=!$&&e.project?`<span class="badge project">${e.project}</span>`:"",i=xt[e.status],c=i?`<span class="badge status-${e.status}">${i}</span>`:"",l=`<span class="badge level-${e.level}">L${e.level}</span>`,a=e.current_agent?`<span class="badge agent-tag">${e.current_agent}</span>`:"",r=e.last_review_status?[]:M(e.review_comments),d=e.last_review_status||(r.length>0?(R=r[r.length-1])==null?void 0:R.status:null),p=d?`<span class="badge ${d==="approved"?"review-approved":"review-changes"}">${d==="approved"?"Approved":"Changes Req."}</span>`:e.status==="impl_review"?'<span class="badge review-pending">Awaiting Review</span>':"",u=e.last_plan_review_status?[]:M(e.plan_review_comments),g=e.last_plan_review_status||(u.length>0?(D=u[u.length-1])==null?void 0:D.status:null),m=g?`<span class="badge ${g==="approved"?"review-approved":"review-changes"}">${g==="approved"?"Plan OK":"Plan Changes"}</span>`:e.status==="plan_review"?'<span class="badge review-pending">Plan Review</span>':"",f=je(e.tags).map(W=>`<span class="tag">${W}</span>`).join(""),v=e.note_count??M(e.notes).length,j=v>0?`<span class="badge notes-count" title="${v} note(s)">💬 ${v}</span>`:"",_=en(e.level,e.status).map(W=>`<option value="${W}">${Ee(W)}</option>`).join(""),J=_?`
      <label class="mobile-card-move card-interactive">
        <span>Move</span>
        <select class="mobile-status-select" data-id="${e.id}" data-project="${e.project}" data-current-status="${e.status}">
          <option value="${e.status}">${Ee(e.status)}</option>
          ${_}
        </select>
      </label>
    `:"";return`
    <div class="${b?"card mobile-card":"card"}" ${b?'draggable="false"':'draggable="true"'} data-id="${e.id}" data-status="${e.status}" data-project="${e.project}" data-completed-at="${e.completed_at||""}">
      <div class="card-header">
        <span class="card-id">#${e.id}</span>
        ${l}
        ${n}
        ${c}
        ${a}
        <button class="card-copy-btn" data-copy="#${e.id} ${e.title}" title="Copy to clipboard">⎘</button>
      </div>
      <div class="card-title">${e.title}</div>
      <div class="card-footer">
        ${o}
        ${m}
        ${p}
        ${j}
        ${s}
      </div>
      ${J}
      ${f?`<div class="card-tags">${f}</div>`:""}
    </div>
  `}function sn(e,t,n,s,o=s.length){const i=Qt(e),c=yt(s,e).map(an).join(""),l=e==="todo"?'<button class="add-card-btn" id="add-card-btn" title="Add card">+</button>':"",a=o!==s.length?`${s.length}/${o}`:`${o}`;return`
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
        ${c||'<div class="empty">No items</div>'}
      </div>
    </div>
  `}const on=/```[\s\S]*?```/g,rn=/```\w*\n?/,nt=/```$/,at=/^```mermaid\s*\n?/,cn=/\*\*(.+?)\*\*/g,ln=/`([^`]+)`/g,dn=/^\x00CB(\d+)\x00$/,pn=/^### (.+)$/,un=/^## (.+)$/,mn=/^# (.+)$/,hn=/^[-*]\s+(.+)$/,gn=/^\d+\.\s+(.+)$/,st=/^\|(.+)\|$/,ot=/^\|[\s:-]+\|$/;let vn=0;function ce(e){const t=[];let n=e.replace(on,r=>{if(at.test(r)){const d=r.replace(at,"").replace(nt,"").trim(),p=`mermaid-${++vn}`;t.push(`<pre class="mermaid" id="${p}">${d}</pre>`)}else{const d=r.replace(rn,"").replace(nt,"");t.push(`<pre><code>${d}</code></pre>`)}return`\0CB${t.length-1}\0`});n=n.replace(/</g,"&lt;"),n=n.replace(cn,"<strong>$1</strong>").replace(ln,"<code>$1</code>");const s=n.split(`
`),o=[];let i=!1,c=!1;function l(){i&&(o.push("</ul>"),i=!1),c&&(o.push("</ol>"),c=!1)}let a=0;for(;a<s.length;){const r=s[a].trim(),d=r.match(dn);if(d){l(),o.push(t[parseInt(d[1])]),a++;continue}if(st.test(r)){l();const v=[];for(;a<s.length&&st.test(s[a].trim());)v.push(s[a].trim()),a++;if(v.length>=2){const j=ot.test(v[1]),_=j?v[0]:null,J=j?2:0;let N='<table class="md-table">';if(_){const P=_.slice(1,-1).split("|").map(R=>R.trim());N+="<thead><tr>"+P.map(R=>`<th>${R}</th>`).join("")+"</tr></thead>"}N+="<tbody>";for(let P=J;P<v.length;P++){if(ot.test(v[P]))continue;const R=v[P].slice(1,-1).split("|").map(D=>D.trim());N+="<tr>"+R.map(D=>`<td>${D}</td>`).join("")+"</tr>"}N+="</tbody></table>",o.push(N)}else o.push(`<p>${v[0]}</p>`);continue}const p=r.match(pn);if(p){l(),o.push(`<h3>${p[1]}</h3>`),a++;continue}const u=r.match(un);if(u){l(),o.push(`<h2>${u[1]}</h2>`),a++;continue}const g=r.match(mn);if(g){l(),o.push(`<h1>${g[1]}</h1>`),a++;continue}const m=r.match(hn);if(m){c&&(o.push("</ol>"),c=!1),i||(o.push("<ul>"),i=!0),o.push(`<li>${m[1]}</li>`),a++;continue}const f=r.match(gn);if(f){i&&(o.push("</ul>"),i=!1),c||(o.push("<ol>"),c=!0),o.push(`<li>${f[1]}</li>`),a++;continue}l(),r===""?o.push(""):o.push(`<p>${r}</p>`),a++}return l(),o.join(`
`)}async function fn(e){const t=window.__mermaid;if(!t)return;const n=e.querySelectorAll("pre.mermaid");if(n.length!==0)try{await t.run({nodes:n})}catch(s){console.warn("Mermaid render failed:",s)}}function fe(e,t,n,s,o){if(!s&&!o)return"";const i=s?ce(s):'<span class="phase-empty">Not yet documented</span>';return`
    <div class="lifecycle-phase ${n} ${o?"active":""}">
      <div class="phase-header">
        <span class="phase-icon">${t}</span>
        <span class="phase-label">${e}</span>
        <button class="phase-expand-btn" title="Expand to full screen">&#x26F6;</button>
      </div>
      <div class="phase-body">${i}</div>
    </div>
  `}function it(e){return e.length===0?"":e.map(t=>{var n;return`
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
  `}).join("")}async function $n(e,t=1920,n=.82){return new Promise((s,o)=>{const i=new Image,c=URL.createObjectURL(e);i.onload=()=>{URL.revokeObjectURL(c);let{width:l,height:a}=i;(l>t||a>t)&&(l>a?(a=Math.round(a*t/l),l=t):(l=Math.round(l*t/a),a=t));const r=document.createElement("canvas");r.width=l,r.height=a,r.getContext("2d").drawImage(i,0,0,l,a),s(r.toDataURL("image/jpeg",n))},i.onerror=()=>{URL.revokeObjectURL(c),o(new Error("Image load failed"))},i.src=c})}async function Oe(e,t,n){var s,o;for(const i of Array.from(t)){if(!i.type.startsWith("image/"))continue;let c;try{c=await $n(i)}catch{c=await new Promise(d=>{const p=new FileReader;p.onload=()=>d(p.result),p.readAsDataURL(i)})}const l=(o=(s=i.name.match(/\.[^.]+$/))==null?void 0:s[0])==null?void 0:o.toLowerCase(),a=l===".jpg"||l===".jpeg"||l===".png"||l===".webp"||l===".gif"||l===".svg"?i.name:i.name.replace(/\.[^.]+$/,"")+".jpg",r=await L(`/api/task/${e}/attachment?project=${encodeURIComponent(n)}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({filename:a,data:c})});if(!r.ok){const d=await r.json().catch(()=>({}));he(d.error||`Upload failed (${r.status})`);return}}U(e,n)}async function U(e,t){var i;const n=document.getElementById("modal-overlay"),s=document.getElementById("modal-content");s.innerHTML='<div style="color:#94a3b8">Loading...</div>',n.classList.remove("hidden"),k();try{const c=t?`?project=${encodeURIComponent(t)}`:"",a=await(await L(`/api/task/${e}${c}`)).json(),r=document.querySelector(`.card[data-id="${a.id}"][data-project="${CSS.escape(a.project)}"]`);r&&r.dataset.status!==a.status&&(Me(),B());const d=je(a.tags),p=d.length?`<div class="modal-tags">${d.map(h=>`<span class="tag">${h}</span>`).join("")}</div>`:"",u=[`<strong>Project:</strong> ${a.project}`,`<strong>Status:</strong> ${a.status}`,`<strong>Priority:</strong> ${a.priority}`,`<strong>Created:</strong> ${((i=a.created_at)==null?void 0:i.slice(0,10))||"-"}`,a.started_at?`<strong>Started:</strong> ${a.started_at.slice(0,10)}`:"",a.planned_at?`<strong>Planned:</strong> ${a.planned_at.slice(0,10)}`:"",a.reviewed_at?`<strong>Reviewed:</strong> ${a.reviewed_at.slice(0,10)}`:"",a.tested_at?`<strong>Tested:</strong> ${a.tested_at.slice(0,10)}`:"",a.completed_at?`<strong>Completed:</strong> ${a.completed_at.slice(0,10)}`:""].filter(Boolean).join(" &nbsp;|&nbsp; "),g={1:{labels:["Req","Impl","Done"],statuses:["todo","impl","done"]},2:{labels:["Req","Plan","Impl","Review","Done"],statuses:["todo","plan","impl","impl_review","done"]},3:{labels:["Req","Plan","Plan Rev","Impl","Impl Rev","Test","Done"],statuses:["todo","plan","plan_review","impl","impl_review","test","done"]}},m=g[a.level]||g[3],f=Math.max(0,m.statuses.indexOf(a.status)),v=`
      <div class="lifecycle-progress">
        <span class="level-indicator">L${a.level}</span>
        ${m.labels.map((h,y)=>`
          <div class="progress-step ${y<f?"completed":""} ${y===f?"current":""}">
            <div class="step-dot"></div>
            <span class="step-label">${h}</span>
          </div>
        `).join('<div class="progress-line"></div>')}
      </div>
    `,j=M(a.attachments),_=j.length>0?`<div class="attachments-grid">${j.map(h=>`<div class="attachment-thumb" data-stored="${h.storedName}">
            <img src="${h.url}" alt="${h.filename}" loading="lazy" />
            <button class="attachment-remove" data-id="${e}" data-name="${h.storedName}" title="Remove">&times;</button>
            <span class="attachment-name">${h.filename}</span>
          </div>`).join("")}</div>`:"",J=a.description?ce(a.description):'<span class="phase-empty">Not yet documented</span>',N=[1,2,3].map(h=>`<option value="${h}" ${h===a.level?"selected":""}>L${h}</option>`).join(""),P=`
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
          <textarea id="req-textarea" rows="8">${(a.description||"").replace(/</g,"&lt;")}</textarea>
          <div class="attachment-drop-zone" id="attachment-drop-zone">
            <span>📎 Drop images here or click to attach</span>
            <input type="file" id="attachment-input" accept="image/*" multiple hidden />
          </div>
          ${_?`<div id="edit-attachments">${_}</div>`:""}
          <div class="phase-edit-actions">
            <button class="phase-save-btn" id="req-save-btn">Save</button>
            <button class="phase-cancel-btn" id="req-cancel-btn">Cancel</button>
          </div>
        </div>
      </div>
    `,R=fe("Plan","🗺️","phase-plan",a.plan,f===1&&!a.plan);let D="";a.decision_log&&(D=fe("Decision Log","🧭","phase-decision-log",a.decision_log,!1));let W="";a.done_when&&(W=fe("Done When","🎯","phase-done-when",a.done_when,!1));const It=M(a.plan_review_comments),He=it(It);let Fe="";(He||f===2)&&(Fe=`
        <div class="lifecycle-phase phase-plan-review ${f===2?"active":""}">
          <div class="phase-header">
            <span class="phase-icon">🔍</span>
            <span class="phase-label">Plan Review</span>
            ${a.plan_review_count>0?`<span class="review-count">${a.plan_review_count} review(s)</span>`:""}
            <button class="phase-expand-btn" title="Expand to full screen">&#x26F6;</button>
          </div>
          <div class="phase-body">${He||'<span class="phase-empty">Awaiting plan review</span>'}</div>
        </div>
      `);const St=fe("Implementation","🔨","phase-impl",a.implementation_notes,f===3&&!a.implementation_notes),Ct=M(a.review_comments),Ve=it(Ct);let Ke="";(Ve||f===4)&&(Ke=`
        <div class="lifecycle-phase phase-review ${f===4?"active":""}">
          <div class="phase-header">
            <span class="phase-icon">📝</span>
            <span class="phase-label">Implementation Review</span>
            ${a.impl_review_count>0?`<span class="review-count">${a.impl_review_count} review(s)</span>`:""}
            <button class="phase-expand-btn" title="Expand to full screen">&#x26F6;</button>
          </div>
          <div class="phase-body">${Ve||'<span class="phase-empty">Awaiting implementation review</span>'}</div>
        </div>
      `);const jt=M(a.test_results),Je=yn(jt);let We="";(Je||f===5)&&(We=`
        <div class="lifecycle-phase phase-test ${f===5?"active":""}">
          <div class="phase-header">
            <span class="phase-icon">🧪</span>
            <span class="phase-label">Test Results</span>
            <button class="phase-expand-btn" title="Expand to full screen">&#x26F6;</button>
          </div>
          <div class="phase-body">${Je||'<span class="phase-empty">Awaiting test execution</span>'}</div>
        </div>
      `);const _e=M(a.agent_log);let Ye="";if(_e.length>0){let h=function(E){if(!E)return{name:"",model:null};const ne=E.toLowerCase();for(const Ae of y){const Y=ne.lastIndexOf(Ae);if(Y>0){let z=Y;for(;z>0&&(E[z-1]==="-"||E[z-1]==="_");)z--;return{name:E.slice(0,z),model:E.slice(Y)}}}return{name:E,model:null}};var o=h;const y=["opus","sonnet","haiku","gemini","copilot","gpt"],C=_e.map(E=>{var tt;const{name:ne,model:Ae}=h(E.agent||""),Y=E.model||Ae,z=Y?`<span class="badge model-tag model-${Y.toLowerCase()}">${Y}</span>`:"";return`
          <div class="agent-log-entry">
            <span class="agent-log-time">${((tt=E.timestamp)==null?void 0:tt.slice(0,16))||""}</span>
            <span class="badge agent-tag">${ne||E.agent||""}</span>
            ${z}
            <span class="agent-log-msg">${E.message||""}</span>
          </div>
        `}).join("");Ye=`
        <details class="lifecycle-phase phase-agent-log">
          <summary class="phase-header">
            <span class="phase-icon">🤖</span>
            <span class="phase-label">Agent Log</span>
            <span class="review-count">${_e.length} entries</span>
          </summary>
          <div class="phase-body agent-log-body">${C}</div>
        </details>
      `}const ze=M(a.notes),Bt=ze.map(h=>{var y;return`
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
          <span class="notes-count">${ze.length}</span>
        </div>
        <div class="notes-list">${Bt}</div>
        <form class="note-form" id="note-form">
          <textarea id="note-input" rows="2" placeholder="Add a note... (supports markdown)"></textarea>
          <button type="submit" class="note-submit">Add Note</button>
        </form>
      </div>
    `;s.innerHTML=`
      <h1>#${a.id} ${a.title}</h1>
      <div class="modal-meta">${u}</div>
      ${p}
      ${v}
      <div class="lifecycle-sections">
        ${P}
        ${R}
        ${D}
        ${W}
        ${Fe}
        ${St}
        ${Ke}
        ${We}
        ${Ye}
      </div>
      ${_t}
      <div class="modal-danger-zone">
        <button class="delete-task-btn" id="delete-task-btn">Delete Card</button>
      </div>
    `,fn(s),s.querySelectorAll(".phase-expand-btn").forEach(h=>{h.addEventListener("click",y=>{y.stopPropagation();const C=h.closest(".lifecycle-phase");C==null||C.requestFullscreen().catch(()=>{})})});const Ze=document.getElementById("level-select");Ze.addEventListener("change",async()=>{const h=parseInt(Ze.value);await L(`/api/task/${e}?project=${encodeURIComponent(a.project)}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({level:h})}),q(a.project),U(e,a.project)}),document.getElementById("delete-task-btn").addEventListener("click",async()=>{confirm(`Delete card #${a.id} "${a.title}"?`)&&(await L(`/api/task/${e}?project=${encodeURIComponent(a.project)}`,{method:"DELETE"}),q(a.project),document.getElementById("modal-overlay").classList.add("hidden"),B())});const Tt=document.getElementById("req-edit-btn"),Xe=document.getElementById("req-body-view"),Ge=document.getElementById("req-body-edit"),Te=document.getElementById("req-textarea"),Qe=document.getElementById("req-save-btn"),At=document.getElementById("req-cancel-btn");Tt.addEventListener("click",()=>{Xe.classList.add("hidden"),Ge.classList.remove("hidden"),Te.focus()}),At.addEventListener("click",()=>{Te.value=a.description||"",Ge.classList.add("hidden"),Xe.classList.remove("hidden")}),Qe.addEventListener("click",async()=>{const h=Te.value;Qe.textContent="Saving...",await L(`/api/task/${e}?project=${encodeURIComponent(a.project)}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({description:h})}),q(a.project),U(e,a.project)});const H=document.getElementById("attachment-drop-zone"),te=document.getElementById("attachment-input");H&&te&&(H.addEventListener("click",()=>te.click()),H.addEventListener("dragover",h=>{h.preventDefault(),H.classList.add("drop-active")}),H.addEventListener("dragleave",()=>{H.classList.remove("drop-active")}),H.addEventListener("drop",async h=>{var C;h.preventDefault(),H.classList.remove("drop-active");const y=(C=h.dataTransfer)==null?void 0:C.files;y&&await Oe(e,y,a.project)}),te.addEventListener("change",async()=>{te.files&&await Oe(e,te.files,a.project)})),s.querySelectorAll(".attachment-remove").forEach(h=>{h.addEventListener("click",async y=>{y.stopPropagation();const C=h,E=C.dataset.id,ne=C.dataset.name;await L(`/api/task/${E}/attachment/${encodeURIComponent(ne)}?project=${encodeURIComponent(a.project)}`,{method:"DELETE"}),U(e,a.project)})});const Rt=document.getElementById("note-form"),et=document.getElementById("note-input");Rt.addEventListener("submit",async h=>{h.preventDefault();const y=et.value.trim();y&&(et.disabled=!0,await L(`/api/task/${e}/note?project=${encodeURIComponent(a.project)}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({text:y})}),q(a.project),U(e,a.project))}),s.querySelectorAll(".note-delete").forEach(h=>{h.addEventListener("click",async y=>{y.stopPropagation();const C=h.dataset.noteId;await L(`/api/task/${e}/note/${C}?project=${encodeURIComponent(a.project)}`,{method:"DELETE"}),q(a.project),U(e,a.project)})})}catch{s.innerHTML='<div style="color:#ef4444">Failed to load</div>'}}function $t(e){if(!e)return new Date(NaN);let t=e.replace(" ","T");return t.length===10?t+="T00:00:00Z":/Z$|[+-]\d{2}:\d{2}$/.test(t)||(t+="Z"),new Date(t)}function bn(e){const t=$t(e);if(isNaN(t.getTime()))return"Unknown";const n=t.getUTCDay()||7;t.setUTCDate(t.getUTCDate()+4-n);const s=new Date(Date.UTC(t.getUTCFullYear(),0,1)),o=Math.ceil(((t.getTime()-s.getTime())/864e5+1)/7);return`${t.getUTCFullYear()}-W${String(o).padStart(2,"0")}`}function wn(e){const t=$t(e);if(isNaN(t.getTime()))return e.slice(0,10)||"—";const n=t.toLocaleDateString(void 0,{month:"short",day:"numeric",timeZone:"UTC"}),s=t.toLocaleTimeString(void 0,{hour:"2-digit",minute:"2-digit",timeZone:"UTC",hour12:!1});return`${n}
${s}`}function En(e){const t=Se(e.priority),n=!$&&e.project?`<span class="badge project">${e.project}</span>`:"",s=t?`<span class="badge ${t}">${e.priority}</span>`:"",o=`<span class="badge status-${e.status}">${Ee(e.status)}</span>`;return`
    <div class="chronicle-event" data-id="${e.id}" data-project="${e.project}" data-completed-at="${e.completed_at||""}">
      <div class="chronicle-dot ev-completed"></div>
      <div class="chronicle-event-time">${wn(e.completed_at)}</div>
      <div class="chronicle-event-body">
        <button class="chronicle-task-link" data-id="${e.id}" data-project="${e.project}">
          #${e.id} ${e.title}
        </button>
        ${o}
        ${s}
        ${n}
      </div>
    </div>`}function Ln(e){var d,p;const t=Se(e.priority),n=t?`<span class="badge ${t}">${e.priority}</span>`:"",s=!$&&e.project?`<span class="badge project">${e.project}</span>`:"",o=`<span class="badge status-${e.status}">${Ee(e.status)}</span>`,i=`<span class="badge level-${e.level}">L${e.level}</span>`,c=((d=e.created_at)==null?void 0:d.slice(0,10))||"",l=((p=e.completed_at)==null?void 0:p.slice(0,10))||"—",r=je(e.tags).map(u=>`<span class="tag">${u}</span>`).join("");return`
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
  `}async function bt(){const e=document.getElementById("chronicle-view");try{const t=await ue("full");Ne(t.projects);const n=[];for(const c of K)for(const l of t[c.key])n.push(l);const s=n.filter(c=>!!c.completed_at).sort((c,l)=>l.completed_at.localeCompare(c.completed_at)),o=new Map;for(const c of s){const l=bn(c.completed_at);o.has(l)||o.set(l,[]),o.get(l).push(c)}if(o.size===0){e.innerHTML=`
        <div style="display:flex;align-items:center;justify-content:center;color:#64748b;font-size:0.9rem;padding:64px">
          No completed tasks yet
        </div>`;return}const i=[...o.entries()].map(([c,l])=>{const a=l.map(En).join("");return`
        <div class="chronicle-group">
          <div class="chronicle-week-header">${c}</div>
          <div class="chronicle-events">${a}</div>
        </div>`}).join("");e.innerHTML=`<div class="chronicle-timeline">${i}</div>`,e.querySelectorAll(".chronicle-task-link").forEach(c=>{c.addEventListener("click",l=>{l.stopPropagation();const a=parseInt(c.dataset.id),r=c.dataset.project||void 0;U(a,r)})})}catch(t){console.error("loadChronicleView failed:",t),e.innerHTML=`
      <div style="display:flex;align-items:center;justify-content:center;color:#ef4444;font-size:0.9rem;padding:48px">
        Failed to load chronicle
      </div>`}}async function me(){var t,n,s,o,i,c,l,a;const e=document.getElementById("board");try{const r=await ue(qe()?"full":"board");Gt(r),Ne(r.projects),e.innerHTML=K.map(g=>{var m;return sn(g.key,g.label,g.icon,r[g.key],((m=r.counts)==null?void 0:m[g.key])??r[g.key].length)}).join("");const d=((t=r.counts)==null?void 0:t.done)??r.done.length,p=r.total??(((n=r.counts)==null?void 0:n.todo)??r.todo.length)+(((s=r.counts)==null?void 0:s.plan)??r.plan.length)+(((o=r.counts)==null?void 0:o.plan_review)??r.plan_review.length)+(((i=r.counts)==null?void 0:i.impl)??r.impl.length)+(((c=r.counts)==null?void 0:c.impl_review)??r.impl_review.length)+(((l=r.counts)==null?void 0:l.test)??r.test.length)+(((a=r.counts)==null?void 0:a.done)??r.done.length);document.getElementById("count-summary").textContent=`${d}/${p} completed`,e.querySelectorAll(".card").forEach(g=>{g.addEventListener("click",m=>{if(m.target.closest(".card-interactive")){m.stopPropagation();return}const v=m.target.closest(".card-copy-btn");if(v){m.stopPropagation(),navigator.clipboard.writeText(v.dataset.copy).then(()=>{const J=v.textContent;v.textContent="✓",setTimeout(()=>{v.textContent=J},1e3)});return}const j=parseInt(g.dataset.id),_=g.dataset.project;U(j,_)})}),b||Cn(),In(),Ce();const u=document.getElementById("add-card-btn");u&&u.addEventListener("click",g=>{g.stopPropagation(),document.getElementById("add-card-overlay").classList.remove("hidden"),k(),b||document.getElementById("add-title").focus()})}catch(r){console.error("loadBoard failed:",r),e.innerHTML=`
      <div style="grid-column:1/-1;display:flex;align-items:center;justify-content:center;color:#ef4444;font-size:0.9rem;padding:48px">
        Cannot find .claude/kanban.db
      </div>
    `}}function In(){document.querySelectorAll("[data-column-toggle]").forEach(e=>{e.addEventListener("click",t=>{if(!b)return;t.stopPropagation();const n=e.dataset.columnToggle;if(!n)return;V.has(n)?V.delete(n):V.add(n),ft();const s=e.closest(".column"),o=V.has(n)||!!le.trim();s&&s.setAttribute("data-mobile-expanded",String(o)),e.setAttribute("aria-expanded",String(o));const i=e.querySelector(".column-toggle-icon");i&&(i.textContent=o?"−":"+")})}),document.querySelectorAll(".mobile-status-select").forEach(e=>{e.addEventListener("click",t=>t.stopPropagation()),e.addEventListener("change",async t=>{t.stopPropagation();const n=e.value,s=parseInt(e.dataset.id||"",10),o=e.dataset.project||"",i=e.dataset.currentStatus||"";!s||!o||await tn({id:s,project:o,status:i},n)})})}async function Le(){const e=document.getElementById("list-view");try{const t=await ue("full");Ne(t.projects);const n=[];for(const a of K)for(const r of t[a.key])n.push(r);const s=F==="default"?[...n].sort((a,r)=>r.id-a.id):yt(n),o=s.length,i=s.filter(a=>a.status==="done").length;document.getElementById("count-summary").textContent=`${i}/${o} completed`;const c=s.map(a=>{var u,g;const r=Se(a.priority),p=je(a.tags).map(m=>`<span class="tag">${m}</span>`).join("");return`
        <tr class="status-${a.status}" data-id="${a.id}" data-project="${a.project}" data-completed-at="${a.completed_at||""}">
          <td class="col-id">#${a.id}</td>
          <td class="col-title">${a.title}</td>
          <td>
            <select class="list-status-select" data-id="${a.id}" data-field="status">
              ${K.map(m=>`<option value="${m.key}" ${m.key===a.status?"selected":""}>${m.icon} ${m.label}</option>`).join("")}
            </select>
          </td>
          <td>
            <select class="list-level-select" data-id="${a.id}" data-field="level">
              ${[1,2,3].map(m=>`<option value="${m}" ${m===a.level?"selected":""}>L${m}</option>`).join("")}
            </select>
          </td>
          <td>
            <select class="list-priority-select ${r}" data-id="${a.id}" data-field="priority">
              ${["high","medium","low"].map(m=>`<option value="${m}" ${m===a.priority?"selected":""}>${m[0].toUpperCase()+m.slice(1)}</option>`).join("")}
            </select>
          </td>
          <td class="list-date">${a.project||""}</td>
          <td>${p}</td>
          <td class="list-date">${((u=a.created_at)==null?void 0:u.slice(0,10))||""}</td>
          <td class="list-date">${((g=a.completed_at)==null?void 0:g.slice(0,10))||""}</td>
        </tr>
      `}).join(""),l=s.map(Ln).join("");e.innerHTML=`
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
    `,e.querySelectorAll("select").forEach(a=>{a.addEventListener("change",async r=>{r.stopPropagation();const d=a,p=d.dataset.id,u=d.dataset.field;let g=d.value;u==="level"&&(g=parseInt(g));const m=d.closest("tr"),f=(m==null?void 0:m.dataset.project)||"",v=await L(`/api/task/${p}?project=${encodeURIComponent(f)}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({[u]:g})});if(!v.ok){const j=await v.json().catch(()=>({}));j.error&&he(j.error),Le();return}q(f),Le()})}),e.querySelectorAll(".col-title").forEach(a=>{a.addEventListener("click",r=>{r.stopPropagation();const d=a.closest("[data-id]"),p=parseInt(d.dataset.id),u=d.dataset.project;U(p,u)})}),Ce()}catch(t){console.error("loadListView failed:",t),e.innerHTML=`
      <div style="display:flex;align-items:center;justify-content:center;color:#ef4444;font-size:0.9rem;padding:48px">
        Failed to load task list
      </div>
    `}}function Ne(e){const t=document.getElementById("project-filter");if(e.length<=1){t.innerHTML=e[0]?`<span class="project-label">${e[0]}</span>`:"";return}const n=e.map(s=>`<option value="${s}" ${s===$?"selected":""}>${s}</option>`).join("");t.innerHTML=`
    <select id="project-select">
      <option value="">All Projects</option>
      ${n}
    </select>
  `,document.getElementById("project-select").addEventListener("change",s=>{$=s.target.value||null,$?localStorage.setItem("kanban-project",$):localStorage.removeItem("kanban-project"),I=null,Z=null,B()})}function rt(e,t){const n=[...e.querySelectorAll(".card:not(.dragging)")];for(const s of n){const o=s.getBoundingClientRect(),i=o.top+o.height/2;if(t<i)return s}return null}function ye(){document.querySelectorAll(".drop-indicator").forEach(e=>e.remove())}function Sn(e,t){ye();const n=document.createElement("div");n.className="drop-indicator",t?e.insertBefore(n,t):e.appendChild(n)}function Cn(){const e=document.querySelectorAll(".card"),t=document.querySelectorAll(".column-body");e.forEach(n=>{n.addEventListener("dragstart",s=>{const o=s,i=n;o.dataTransfer.setData("text/plain",`${i.dataset.project}:${i.dataset.id}`),i.classList.add("dragging"),be=!0}),n.addEventListener("dragend",()=>{n.classList.remove("dragging"),ye(),be=!1})}),t.forEach(n=>{n.addEventListener("dragover",s=>{s.preventDefault();const o=n;o.classList.add("drag-over");const i=rt(o,s.clientY);Sn(o,i)}),n.addEventListener("dragleave",s=>{const o=n;o.contains(s.relatedTarget)||(o.classList.remove("drag-over"),ye())}),n.addEventListener("drop",async s=>{s.preventDefault();const o=n;o.classList.remove("drag-over"),ye();const i=s,c=i.dataTransfer.getData("text/plain"),l=c.lastIndexOf(":"),a=l>=0?c.slice(0,l):"",r=parseInt(l>=0?c.slice(l+1):c),d=o.dataset.column,p=rt(o,i.clientY),u=[...o.querySelectorAll(".card:not(.dragging)")];let g=null,m=null;if(p){m=parseInt(p.dataset.id);const v=u.indexOf(p);v>0&&(g=parseInt(u[v-1].dataset.id))}else u.length>0&&(g=parseInt(u[u.length-1].dataset.id));const f=await L(`/api/task/${r}/reorder?project=${encodeURIComponent(a)}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({status:d,afterId:g,beforeId:m})});if(!f.ok){const v=await f.json().catch(()=>({}));v.error&&he(v.error)}q(a),me()})})}function he(e){const t=document.querySelector(".toast");t&&t.remove();const n=document.createElement("div");n.className="toast",n.textContent=e,document.body.appendChild(n),setTimeout(()=>n.remove(),3e3)}async function wt(){try{const t=await(await L("/api/info")).json();t.projectName&&(document.title=`Kanban · ${t.projectName}`,document.querySelector("header h1").textContent=`Kanban · ${t.projectName}`)}catch{}}function Be(e){S=e,localStorage.setItem(xe,S);const t=document.getElementById("board"),n=document.getElementById("list-view"),s=document.getElementById("chronicle-view");t.classList.add("hidden"),n.classList.add("hidden"),s.classList.add("hidden"),document.getElementById("tab-board").classList.remove("active"),document.getElementById("tab-list").classList.remove("active"),document.getElementById("tab-chronicle").classList.remove("active"),e==="board"?(t.classList.remove("hidden"),document.getElementById("tab-board").classList.add("active"),me()):e==="list"?(n.classList.remove("hidden"),document.getElementById("tab-list").classList.add("active"),Le()):(s.classList.remove("hidden"),document.getElementById("tab-chronicle").classList.add("active"),bt())}function B(){S==="board"?me():S==="list"?Le():bt()}document.getElementById("sort-select").value=F;x&&document.getElementById("hide-done-btn").classList.add("active");de();ke();document.getElementById("auth-btn").addEventListener("click",()=>{if(A&&w){X("Shared token is stored on this device. Use Forget Token to reset it.","success");return}X(A?"Enter the shared access token to load the board.":"This environment does not require a shared token.")});document.getElementById("auth-close").addEventListener("click",()=>{A&&!w||pe()});document.getElementById("auth-clear-btn").addEventListener("click",async()=>{await Jt(),A?X("Stored token cleared. Enter a shared access token to continue."):(pe(),ee("Stored token cleared."))});document.getElementById("auth-form").addEventListener("submit",async e=>{e.preventDefault();const n=document.getElementById("auth-token-input").value.trim();if(!n){ee("Enter the shared access token.","error");return}ee("Unlocking board...","default");try{await gt(n),ee("Board unlocked.","success"),await wt(),vt(),B()}catch(s){ee(s instanceof Error?s.message:"Board authentication failed.","error")}});document.getElementById("tab-board").addEventListener("click",()=>Be("board"));document.getElementById("tab-list").addEventListener("click",()=>Be("list"));document.getElementById("tab-chronicle").addEventListener("click",()=>Be("chronicle"));document.getElementById("toolbar-mobile-toggle").addEventListener("click",()=>{re=!re,ke()});pt.addEventListener("change",e=>{Ht(e.matches)});document.addEventListener("visibilitychange",()=>{document.visibilityState!=="visible"||!w||(Me(),B())});function Et(){if(Re)return;Re=!0;const e=new EventSource("/api/events");e.onmessage=()=>{if(be)return;const t=!document.getElementById("modal-overlay").classList.contains("hidden"),n=!document.getElementById("add-card-overlay").classList.contains("hidden");!t&&!n&&B()},e.onerror=()=>{e.close(),Re=!1,(!A||w)&&setTimeout(Et,5e3)}}document.getElementById("refresh-btn").addEventListener("click",B);document.getElementById("search-input").addEventListener("input",e=>{if(le=e.target.value.trim(),S==="board"){me();return}Ce()});document.getElementById("sort-select").addEventListener("change",e=>{F=e.target.value,localStorage.setItem("kanban-sort",F),B()});document.getElementById("hide-done-btn").addEventListener("click",()=>{x=!x,localStorage.setItem("kanban-hide-old",String(x)),document.getElementById("hide-done-btn").classList.toggle("active",x),Ce()});document.getElementById("modal-close").addEventListener("click",()=>{document.getElementById("modal-overlay").classList.add("hidden"),k()});document.getElementById("modal-overlay").addEventListener("click",e=>{e.target===e.currentTarget&&(document.getElementById("modal-overlay").classList.add("hidden"),k())});document.addEventListener("keydown",e=>{e.key==="Escape"&&(document.getElementById("modal-overlay").classList.add("hidden"),document.getElementById("add-card-overlay").classList.add("hidden"),!document.getElementById("auth-overlay").classList.contains("hidden")&&w&&pe(),k())});const Ie=document.getElementById("add-card-overlay");let O=[];function ge(){const e=document.getElementById("add-attachment-preview");if(O.length===0){e.innerHTML="";return}e.innerHTML=O.map((t,n)=>`
    <div class="attachment-thumb">
      <img src="${URL.createObjectURL(t)}" alt="${t.name}" />
      <button class="attachment-remove" data-idx="${n}" title="Remove" type="button">&times;</button>
      <span class="attachment-name">${t.name}</span>
    </div>
  `).join(""),e.querySelectorAll(".attachment-remove").forEach(t=>{t.addEventListener("click",n=>{n.stopPropagation();const s=parseInt(t.dataset.idx);O.splice(s,1),ge()})})}function Lt(e){for(const t of Array.from(e))t.type.startsWith("image/")&&O.push(t);ge()}document.getElementById("add-card-close").addEventListener("click",()=>{Ie.classList.add("hidden"),O=[],ge(),k()});Ie.addEventListener("click",e=>{e.target===e.currentTarget&&(Ie.classList.add("hidden"),O=[],ge(),k())});const G=document.getElementById("add-attachment-zone"),ae=document.getElementById("add-attachment-input");G.addEventListener("click",()=>ae.click());G.addEventListener("dragover",e=>{e.preventDefault(),G.classList.add("drop-active")});G.addEventListener("dragleave",()=>{G.classList.remove("drop-active")});G.addEventListener("drop",e=>{var n;e.preventDefault(),G.classList.remove("drop-active");const t=(n=e.dataTransfer)==null?void 0:n.files;t&&Lt(t)});ae.addEventListener("change",()=>{ae.files&&Lt(ae.files),ae.value=""});document.getElementById("add-card-form").addEventListener("submit",async e=>{e.preventDefault();const t=document.getElementById("add-title").value.trim();if(!t)return;const n=document.getElementById("add-priority").value,s=parseInt(document.getElementById("add-level").value)||3,o=document.getElementById("add-description").value.trim()||null,i=document.getElementById("add-tags").value.trim(),c=i?i.split(",").map(p=>p.trim()).filter(Boolean):null,l=$;if(!l){he("Select a project first");return}const a=document.querySelector("#add-card-form .form-submit");a.textContent=O.length>0?"Creating...":"Add Card",a.disabled=!0;const d=await(await L("/api/task",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({title:t,priority:n,level:s,description:o,tags:c,project:l})})).json();O.length>0&&d.id&&await Oe(d.id,O,l),O=[],a.textContent="Add Card",a.disabled=!1,document.getElementById("add-card-form").reset(),ge(),Ie.classList.add("hidden"),k(),q(l),B()});Xt().then(async e=>{e&&(await wt(),Be(S),vt())}).catch(()=>{X("Unable to initialize board authentication.","error")});Dt();
