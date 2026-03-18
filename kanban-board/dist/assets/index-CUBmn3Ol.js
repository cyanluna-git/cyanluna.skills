import ft from"https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs";(function(){const n=document.createElement("link").relList;if(n&&n.supports&&n.supports("modulepreload"))return;for(const o of document.querySelectorAll('link[rel="modulepreload"]'))s(o);new MutationObserver(o=>{for(const i of o)if(i.type==="childList")for(const c of i.addedNodes)c.tagName==="LINK"&&c.rel==="modulepreload"&&s(c)}).observe(document,{childList:!0,subtree:!0});function t(o){const i={};return o.integrity&&(i.integrity=o.integrity),o.referrerPolicy&&(i.referrerPolicy=o.referrerPolicy),o.crossOrigin==="use-credentials"?i.credentials="include":o.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function s(o){if(o.ep)return;o.ep=!0;const i=t(o);fetch(o.href,i)}})();ft.initialize({startOnLoad:!1,theme:"dark",themeVariables:{primaryColor:"#334155",primaryBorderColor:"#60a5fa",primaryTextColor:"#f1f5f9",lineColor:"#64748b",secondaryColor:"#1e293b",tertiaryColor:"#0f172a"}});window.__mermaid=ft;const qt="modulepreload",Mt=function(e){return"/"+e},ct={},Dt=function(n,t,s){let o=Promise.resolve();if(t&&t.length>0){let c=function(r){return Promise.all(r.map(p=>Promise.resolve(p).then(u=>({status:"fulfilled",value:u}),u=>({status:"rejected",reason:u}))))};document.getElementsByTagName("link");const l=document.querySelector("meta[property=csp-nonce]"),a=(l==null?void 0:l.nonce)||(l==null?void 0:l.getAttribute("nonce"));o=c(t.map(r=>{if(r=Mt(r),r in ct)return;ct[r]=!0;const p=r.endsWith(".css"),u=p?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${r}"]${u}`))return;const m=document.createElement("link");if(m.rel=p?"stylesheet":qt,p||(m.as="script"),m.crossOrigin="",m.href=r,a&&m.setAttribute("nonce",a),document.head.appendChild(m),p)return new Promise((f,g)=>{m.addEventListener("load",f),m.addEventListener("error",()=>g(new Error(`Unable to preload CSS for ${r}`)))})}))}function i(c){const l=new Event("vite:preloadError",{cancelable:!0});if(l.payload=c,window.dispatchEvent(l),!l.defaultPrevented)throw c}return o.then(c=>{for(const l of c||[])l.status==="rejected"&&i(l.reason);return n().catch(i)})},W=[{key:"todo",label:"Requirements",icon:"📋"},{key:"plan",label:"Plan",icon:"🗺️"},{key:"plan_review",label:"Review Plan",icon:"🔍"},{key:"impl",label:"Implement",icon:"🔨"},{key:"impl_review",label:"Review Impl",icon:"📝"},{key:"test",label:"Test",icon:"🧪"},{key:"done",label:"Done",icon:"✅"}],Ut={plan:"Planning",plan_review:"Plan Review",impl:"Implementing",impl_review:"Impl Review",test:"Testing"},Be="kanban-auth-token",Ne="kanban-current-view",vt="kanban-mobile-board-columns",Ht=3e4,Nt=10,Ft=10,yt="kanban-summary-cache",Vt={board:3e4,full:6e4},$t=window.matchMedia("(max-width: 768px)");function Wt(){!("serviceWorker"in navigator)||!(window.location.protocol==="https:"||window.location.hostname==="localhost"||window.location.hostname==="127.0.0.1")||window.addEventListener("load",()=>{navigator.serviceWorker.register("/sw.js").catch(n=>{console.warn("Service worker registration failed",n)})})}function Kt(e){return e==="board"||e==="list"||e==="chronicle"||e==="graph"}function zt(e){return W.some(n=>n.key===e)}function Jt(){try{const e=localStorage.getItem(vt);if(!e)return new Set;const n=JSON.parse(e);return Array.isArray(n)?new Set(n.filter(t=>typeof t=="string"&&zt(t))):new Set}catch{return new Set}}let j=localStorage.getItem("kanban-project"),Te=!1,B=$t.matches,C=Kt(localStorage.getItem(Ne))?localStorage.getItem(Ne):B?"list":"board",oe="",J=localStorage.getItem("kanban-sort")||"default",O=localStorage.getItem("kanban-hide-old")==="true",q=localStorage.getItem(Be)||"",M=!1,T=!1,He=!1,he=!B,Y=Jt(),x=null,pe=null,X=null;const ue=new Map,ae=new Map,me=new Map;let z=null,Q=null;function se(e,n="default"){const t=document.getElementById("auth-message");t.textContent=e,t.classList.remove("error","success"),n!=="default"&&t.classList.add(n)}function F(){const n=[document.getElementById("modal-overlay"),document.getElementById("add-card-overlay"),document.getElementById("auth-overlay")].some(t=>t&&!t.classList.contains("hidden"));document.body.classList.toggle("overlay-open",n)}function ve(){const e=document.getElementById("auth-btn");if(e){if(!M){e.textContent="Open",e.title="Board access is open in this environment";return}e.textContent=T?"Private":"Locked",e.title=T?"Shared token configured for this browser":"Shared token required"}}function ee(e="Enter the shared access token to load the board.",n="default"){T=!1,document.getElementById("auth-overlay").classList.remove("hidden"),F();const t=document.getElementById("auth-token-input");t.value=q,se(e,n),ve(),setTimeout(()=>t.focus(),0)}function ye(){document.getElementById("auth-overlay").classList.add("hidden"),F(),ve()}function bt(e){q=e.trim(),q?localStorage.setItem(Be,q):localStorage.removeItem(Be)}function Ve(){document.body.classList.toggle("mobile-shell",B),document.body.classList.toggle("mobile-toolbar-open",!B||he);const e=document.getElementById("toolbar-mobile-toggle");if(e){const n=!B||he;e.hidden=!B,e.setAttribute("aria-expanded",String(n)),e.textContent=n?"Hide Filters":"Show Filters"}}function Yt(e){B=e,B||(he=!0),Ve(),T&&C==="board"&&P()}function wt(){return window.location.hostname==="localhost"||window.location.hostname==="127.0.0.1"}function We(){pe!==null&&(window.clearInterval(pe),pe=null)}function Ke(e=j,n="full"){return`${e||"__all__"}::${n}`}function Ae(e=j,n="full"){return`${yt}::${Ke(e,n)}`}function Zt(e=j,n="full"){try{const t=localStorage.getItem(Ae(e,n));if(!t)return null;const s=JSON.parse(t);return!s||typeof s.fetchedAt!="number"||!s.board?null:Date.now()-s.fetchedAt>Vt[n]?(localStorage.removeItem(Ae(e,n)),null):s}catch{return null}}function Gt(e,n,t,s){try{const o={fetchedAt:Date.now(),etag:s,board:t};localStorage.setItem(Ae(e,n),JSON.stringify(o))}catch{}}function U(e=j,n){const t=n?[n]:["board","full"];for(const s of t){const o=Ke(e,s);ue.delete(o),ae.delete(o),me.delete(o);try{localStorage.removeItem(Ae(e,s))}catch{}}e===j&&(x=null,X=null)}function ze(e={}){if(ue.clear(),ae.clear(),me.clear(),x=null,X=null,e.persisted)try{const n=[];for(let t=0;t<localStorage.length;t+=1){const s=localStorage.key(t);s!=null&&s.startsWith(`${yt}::`)&&n.push(s)}n.forEach(t=>localStorage.removeItem(t))}catch{}}function Et(){q="",localStorage.removeItem(Be);const e=document.getElementById("auth-token-input");e&&(e.value="")}async function Xt(){const e=new Headers;q&&e.set("X-Kanban-Auth",q);const t=await(await fetch("/api/auth/session",{method:"GET",headers:e,credentials:"same-origin"})).json().catch(()=>({}));return{authenticated:!!t.authenticated,authRequired:!!t.authRequired,mode:t.mode,source:t.source??null,reason:t.reason??null,error:t.error??null}}async function Lt(e){const n=e.trim(),t=await fetch("/api/auth/session",{method:"POST",headers:{"X-Kanban-Auth":n},credentials:"same-origin"}),s=await t.json().catch(()=>({}));if(!t.ok){const o=s.reason==="invalid_token"?"Shared token is invalid.":s.reason==="token_hash_missing"?"Server auth is not configured yet.":"Board authentication failed.";throw new Error(o)}bt(n),M=!!s.authRequired,T=!0,ye(),ve()}async function Qt(){await fetch("/api/auth/session",{method:"DELETE",credentials:"same-origin"}).catch(()=>{}),We(),ze({persisted:!0}),Et(),T=!M,ve()}async function k(e,n={},t=!1){const s=new Headers(n.headers||{});q&&!s.has("X-Kanban-Auth")&&s.set("X-Kanban-Auth",q);const o=await fetch(e,{...n,headers:s,credentials:"same-origin"});if((o.status===401||o.status===403||o.status===503)&&!t){const i=await o.clone().json().catch(()=>({}));M=!0,T=!1,i.reason==="invalid_token"&&Et();const c=i.reason==="invalid_token"?"Stored token was rejected. Enter a valid shared token.":i.reason==="token_hash_missing"?"Server auth hash is not configured yet.":"Shared token is required for this board.";throw ee(c,"error"),new Error(i.error||c)}return o}async function Je(e=j){const n=e?`?project=${encodeURIComponent(e)}`:"",t=new Headers;X&&t.set("If-None-Match",X);const s=await k(`/api/board/version${n}`,{headers:t});return s.status===304?x?null:(X=null,Je()):(X=s.headers.get("ETag"),s.json())}function en(e){return e==="board"?C==="board"&&!Fe():C==="list"||C==="chronicle"||C==="board"&&Fe()}function Fe(){return oe.trim().length>0}function tn(e,n,t,s){if(!T||me.has(n))return;const o=(async()=>{try{const i=await Je(s);if(!i)return;if(t&&i.version===t){x=i.version;return}U(s,e),await ie(e,{bypassTtl:!0,projectOverride:s}),j===s&&en(e)&&P()}catch{}finally{me.delete(n)}})();me.set(n,o)}async function ie(e="full",n={}){const t=n.projectOverride===void 0?j:n.projectOverride,s=["summary=true"];t&&s.unshift(`project=${encodeURIComponent(t)}`),e==="board"&&s.push("compact=board",`todo_limit=${Nt}`,`done_limit=${Ft}`);const o=`?${s.join("&")}`,i=Ke(t,e);if(!n.bypassTtl){const u=Zt(t,e);if(u)return ue.set(i,u.board),u.etag&&ae.set(i,u.etag),x=u.board.version||x,tn(e,i,u.board.version||null,t),u.board}const c=new Headers,l=ae.get(i);l&&c.set("If-None-Match",l);const a=await k(`/api/board${o}`,{headers:c});if(a.status===304){const u=ue.get(i);return u?(x=u.version||x,u):(ae.delete(i),ie(e,{bypassTtl:!0}))}const r=await a.json(),p=a.headers.get("ETag");return p&&ae.set(i,p),ue.set(i,r),Gt(t,e,r,p),x=r.version||x,r}function nn(){wt()||pe!==null||(pe=window.setInterval(async()=>{if(!T||Te)return;const e=!document.getElementById("modal-overlay").classList.contains("hidden"),n=!document.getElementById("add-card-overlay").classList.contains("hidden");if(!(e||n))try{const t=await Je();if(!t)return;if(!x){x=t.version;return}t.version!==x&&(x=t.version,P())}catch{M&&!T&&We()}},Ht))}function It(){if(wt()){We(),Tt();return}nn()}function an(){const e=new URL(window.location.href),n=e.searchParams.get("auth")||e.searchParams.get("token");n&&(bt(n),e.searchParams.delete("auth"),e.searchParams.delete("token"),window.history.replaceState({},"",e.toString()))}async function sn(){if(an(),q)try{return await Lt(q),!0}catch(n){return ee(n instanceof Error?n.message:"Board authentication failed.","error"),!1}const e=await Xt();return M=e.authRequired,T=e.authenticated||!e.authRequired,e.authRequired&&!e.authenticated?(ee("Enter the shared access token to load the board."),!1):(ye(),!0)}function xe(e){return e==="high"?"high":e==="medium"?"medium":e==="low"?"low":""}function St(){localStorage.setItem(vt,JSON.stringify([...Y]))}function on(e){if(!B||Y.size>0)return;const n=W.filter(t=>t.key==="todo"||t.key==="impl"||t.key!=="done"&&e[t.key].length>0).map(t=>t.key);Y=new Set(n.length>0?n:["todo"]),St()}function rn(e){return!B||oe.trim()?!0:Y.has(e)}function Re(e){var n;return((n=W.find(t=>t.key===e))==null?void 0:n.label)||e}function ln(e,n){return e===1?{todo:["impl"],impl:["done"],done:[]}[n]||[]:e===2?{todo:["plan"],plan:["impl","todo"],impl:["impl_review"],impl_review:["done","impl"],done:[]}[n]||[]:{todo:["plan"],plan:["plan_review","todo"],plan_review:["impl","plan"],impl:["impl_review"],impl_review:["test","impl"],test:["done","impl"],done:[]}[n]||[]}async function cn(e,n){if(!n||n===e.status)return;const t=await k(`/api/task/${e.id}?project=${encodeURIComponent(e.project)}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({status:n})});if(!t.ok){const s=await t.json().catch(()=>({}));we(s.error||"Failed to move task");return}U(e.project),be()}function ce(e){return e?Date.now()-new Date(e).getTime()>4320*60*1e3:!1}function Ct(e,n){return J==="default"?n==="done"?[...e].sort((t,s)=>{const o=(s.completed_at||"").localeCompare(t.completed_at||"");return o!==0?o:t.rank-s.rank||t.id-s.id}):[...e].sort((t,s)=>s.rank-t.rank||s.id-t.id):[...e].sort((t,s)=>J==="created_asc"?t.created_at.localeCompare(s.created_at):J==="created_desc"?s.created_at.localeCompare(t.created_at):J==="completed_desc"?(s.completed_at||"").localeCompare(t.completed_at||""):0)}function Pe(){const e=oe.toLowerCase().replace(/^#/,""),n=e.length>0||O;document.body.classList.toggle("mobile-board-search",C==="board"&&B&&e.length>0),C==="board"?(document.querySelectorAll(".card").forEach(t=>{const s=!e||(()=>{var r,p,u,m;const i=t.dataset.id||"",c=((p=(r=t.querySelector(".card-title"))==null?void 0:r.textContent)==null?void 0:p.toLowerCase())||"",l=((m=(u=t.querySelector(".card-desc"))==null?void 0:u.textContent)==null?void 0:m.toLowerCase())||"",a=[...t.querySelectorAll(".tag")].map(f=>{var g;return((g=f.textContent)==null?void 0:g.toLowerCase())||""}).join(" ");return i===e||c.includes(e)||l.includes(e)||a.includes(e)})(),o=O&&t.dataset.status==="done"&&ce(t.dataset.completedAt||"");t.style.display=s&&!o?"":"none"}),document.querySelectorAll(".column").forEach(t=>{const s=t.querySelectorAll(".card"),o=[...s].filter(a=>a.style.display!=="none").length,i=s.length,c=Number.parseInt(t.dataset.totalCount||`${i}`,10)||i,l=t.querySelector(".count");l&&(l.textContent=n||c!==i?`${o}/${c}`:`${c}`)})):C==="list"?(document.querySelectorAll("#list-view tbody tr").forEach(t=>{const s=!e||(()=>{var r,p,u,m;const i=t.dataset.id||"",c=((p=(r=t.querySelector(".col-title"))==null?void 0:r.textContent)==null?void 0:p.toLowerCase())||"",l=((m=(u=t.cells[5])==null?void 0:u.textContent)==null?void 0:m.toLowerCase())||"",a=[...t.querySelectorAll(".tag")].map(f=>{var g;return((g=f.textContent)==null?void 0:g.toLowerCase())||""}).join(" ");return i===e||c.includes(e)||l.includes(e)||a.includes(e)})(),o=O&&t.classList.contains("status-done")&&ce(t.dataset.completedAt||"");t.style.display=s&&!o?"":"none"}),document.querySelectorAll("#list-view .list-card").forEach(t=>{const s=!e||(()=>{var r,p,u;const i=t.dataset.id||"",c=((p=(r=t.querySelector(".list-card-title"))==null?void 0:r.textContent)==null?void 0:p.toLowerCase())||"",l=((u=t.dataset.project)==null?void 0:u.toLowerCase())||"",a=[...t.querySelectorAll(".tag")].map(m=>{var f;return((f=m.textContent)==null?void 0:f.toLowerCase())||""}).join(" ");return i===e||c.includes(e)||l.includes(e)||a.includes(e)})(),o=O&&t.classList.contains("status-done")&&ce(t.dataset.completedAt||"");t.style.display=s&&!o?"":"none"})):(document.querySelectorAll("#chronicle-view .chronicle-event").forEach(t=>{const s=!e||(()=>{var a,r,p;const i=t.dataset.id||"",c=((r=(a=t.querySelector(".chronicle-task-link"))==null?void 0:a.textContent)==null?void 0:r.toLowerCase())||"",l=((p=t.dataset.project)==null?void 0:p.toLowerCase())||"";return i===e||c.includes(e)||l.includes(e)})(),o=O&&ce(t.dataset.completedAt||"");t.style.display=s&&!o?"":"none"}),document.querySelectorAll("#chronicle-view .chronicle-group").forEach(t=>{const s=[...t.querySelectorAll(".chronicle-event")].filter(o=>o.style.display!=="none").length;t.style.display=s>0?"":"none"}))}function $e(e){if(!e||e==="null")return[];try{const n=JSON.parse(e);return Array.isArray(n)?n:[]}catch{return[]}}function dn(e){const n=new Date(e+"Z"),s=new Date().getTime()-n.getTime(),o=Math.floor(s/864e5);return o===0?"today":o===1?"yesterday":o<7?`${o}d ago`:o<30?`${Math.floor(o/7)}w ago`:e.slice(0,10)}function V(e){if(!e||e==="null")return[];try{const n=JSON.parse(e);return Array.isArray(n)?n:[]}catch{return[]}}function pn(e){var w,L;const n=xe(e.priority),t=n?`<span class="badge ${n}">${e.priority}</span>`:"",s=e.completed_at?`<span class="badge date">${e.completed_at.slice(0,10)}</span>`:e.created_at?`<span class="badge created">${dn(e.created_at)}</span>`:"",o=!j&&e.project?`<span class="badge project">${e.project}</span>`:"",i=Ut[e.status],c=i?`<span class="badge status-${e.status}">${i}</span>`:"",l=`<span class="badge level-${e.level}">L${e.level}</span>`,a=e.current_agent?`<span class="badge agent-tag">${e.current_agent}</span>`:"",r=e.last_review_status?[]:V(e.review_comments),p=e.last_review_status||(r.length>0?(w=r[r.length-1])==null?void 0:w.status:null),u=p?`<span class="badge ${p==="approved"?"review-approved":"review-changes"}">${p==="approved"?"Approved":"Changes Req."}</span>`:e.status==="impl_review"?'<span class="badge review-pending">Awaiting Review</span>':"",m=e.last_plan_review_status?[]:V(e.plan_review_comments),f=e.last_plan_review_status||(m.length>0?(L=m[m.length-1])==null?void 0:L.status:null),g=f?`<span class="badge ${f==="approved"?"review-approved":"review-changes"}">${f==="approved"?"Plan OK":"Plan Changes"}</span>`:e.status==="plan_review"?'<span class="badge review-pending">Plan Review</span>':"",b=$e(e.tags).map(I=>`<span class="tag">${I}</span>`).join(""),$=e.note_count??V(e.notes).length,A=$>0?`<span class="badge notes-count" title="${$} note(s)">💬 ${$}</span>`:"",R=ln(e.level,e.status).map(I=>`<option value="${I}">${Re(I)}</option>`).join(""),d=R?`
      <label class="mobile-card-move card-interactive">
        <span>Move</span>
        <select class="mobile-status-select" data-id="${e.id}" data-project="${e.project}" data-current-status="${e.status}">
          <option value="${e.status}">${Re(e.status)}</option>
          ${R}
        </select>
      </label>
    `:"";return`
    <div class="${B?"card mobile-card":"card"}" ${B?'draggable="false"':'draggable="true"'} data-id="${e.id}" data-status="${e.status}" data-project="${e.project}" data-completed-at="${e.completed_at||""}">
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
        ${g}
        ${u}
        ${A}
        ${s}
      </div>
      ${d}
      ${b?`<div class="card-tags">${b}</div>`:""}
    </div>
  `}function un(e,n,t,s,o=s.length){const i=rn(e),c=Ct(s,e).map(pn).join(""),l=e==="todo"?'<button class="add-card-btn" id="add-card-btn" title="Add card">+</button>':"",a=o!==s.length?`${s.length}/${o}`:`${o}`;return`
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
  `}const mn=/```[\s\S]*?```/g,hn=/```\w*\n?/,dt=/```$/,pt=/^```mermaid\s*\n?/,gn=/\*\*(.+?)\*\*/g,fn=/`([^`]+)`/g,vn=/^\x00CB(\d+)\x00$/,yn=/^### (.+)$/,$n=/^## (.+)$/,bn=/^# (.+)$/,wn=/^[-*]\s+(.+)$/,En=/^\d+\.\s+(.+)$/,ut=/^\|(.+)\|$/,mt=/^\|[\s:-]+\|$/;let Ln=0;function ge(e){const n=[];let t=e.replace(mn,r=>{if(pt.test(r)){const p=r.replace(pt,"").replace(dt,"").trim(),u=`mermaid-${++Ln}`;n.push(`<pre class="mermaid" id="${u}">${p}</pre>`)}else{const p=r.replace(hn,"").replace(dt,"");n.push(`<pre><code>${p}</code></pre>`)}return`\0CB${n.length-1}\0`});t=t.replace(/</g,"&lt;"),t=t.replace(gn,"<strong>$1</strong>").replace(fn,"<code>$1</code>");const s=t.split(`
`),o=[];let i=!1,c=!1;function l(){i&&(o.push("</ul>"),i=!1),c&&(o.push("</ol>"),c=!1)}let a=0;for(;a<s.length;){const r=s[a].trim(),p=r.match(vn);if(p){l(),o.push(n[parseInt(p[1])]),a++;continue}if(ut.test(r)){l();const $=[];for(;a<s.length&&ut.test(s[a].trim());)$.push(s[a].trim()),a++;if($.length>=2){const A=mt.test($[1]),R=A?$[0]:null,d=A?2:0;let h='<table class="md-table">';if(R){const y=R.slice(1,-1).split("|").map(w=>w.trim());h+="<thead><tr>"+y.map(w=>`<th>${w}</th>`).join("")+"</tr></thead>"}h+="<tbody>";for(let y=d;y<$.length;y++){if(mt.test($[y]))continue;const w=$[y].slice(1,-1).split("|").map(L=>L.trim());h+="<tr>"+w.map(L=>`<td>${L}</td>`).join("")+"</tr>"}h+="</tbody></table>",o.push(h)}else o.push(`<p>${$[0]}</p>`);continue}const u=r.match(yn);if(u){l(),o.push(`<h3>${u[1]}</h3>`),a++;continue}const m=r.match($n);if(m){l(),o.push(`<h2>${m[1]}</h2>`),a++;continue}const f=r.match(bn);if(f){l(),o.push(`<h1>${f[1]}</h1>`),a++;continue}const g=r.match(wn);if(g){c&&(o.push("</ol>"),c=!1),i||(o.push("<ul>"),i=!0),o.push(`<li>${g[1]}</li>`),a++;continue}const b=r.match(En);if(b){i&&(o.push("</ul>"),i=!1),c||(o.push("<ol>"),c=!0),o.push(`<li>${b[1]}</li>`),a++;continue}l(),r===""?o.push(""):o.push(`<p>${r}</p>`),a++}return l(),o.join(`
`)}async function In(e){const n=window.__mermaid;if(!n)return;const t=e.querySelectorAll("pre.mermaid");if(t.length!==0)try{await n.run({nodes:t})}catch(s){console.warn("Mermaid render failed:",s)}}function Ce(e,n,t,s,o){if(!s&&!o)return"";const i=s?ge(s):'<span class="phase-empty">Not yet documented</span>';return`
    <div class="lifecycle-phase ${t} ${o?"active":""}">
      <div class="phase-header">
        <span class="phase-icon">${n}</span>
        <span class="phase-label">${e}</span>
        <button class="phase-expand-btn" title="Expand to full screen">&#x26F6;</button>
      </div>
      <div class="phase-body">${i}</div>
    </div>
  `}function ht(e){return e.length===0?"":e.map(n=>{var t;return`
    <div class="review-entry ${n.status}">
      <div class="review-header">
        <span class="badge ${n.status==="approved"?"review-approved":"review-changes"}">
          ${n.status==="approved"?"Approved":"Changes Requested"}
        </span>
        <span class="review-meta">${n.reviewer||""} &middot; ${((t=n.timestamp)==null?void 0:t.slice(0,16))||""}</span>
      </div>
      <div class="review-comment">${ge(n.comment||"")}</div>
    </div>
  `}).join("")}function Sn(e){return e.length===0?"":e.map(n=>{var t;return`
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
      ${n.comment?`<div class="review-comment">${ge(n.comment)}</div>`:""}
    </div>
  `}).join("")}async function Cn(e,n=1920,t=.82){return new Promise((s,o)=>{const i=new Image,c=URL.createObjectURL(e);i.onload=()=>{URL.revokeObjectURL(c);let{width:l,height:a}=i;(l>n||a>n)&&(l>a?(a=Math.round(a*n/l),l=n):(l=Math.round(l*n/a),a=n));const r=document.createElement("canvas");r.width=l,r.height=a,r.getContext("2d").drawImage(i,0,0,l,a),s(r.toDataURL("image/jpeg",t))},i.onerror=()=>{URL.revokeObjectURL(c),o(new Error("Image load failed"))},i.src=c})}async function _e(e,n,t){var s,o;for(const i of Array.from(n)){if(!i.type.startsWith("image/"))continue;let c;try{c=await Cn(i)}catch{c=await new Promise(p=>{const u=new FileReader;u.onload=()=>p(u.result),u.readAsDataURL(i)})}const l=(o=(s=i.name.match(/\.[^.]+$/))==null?void 0:s[0])==null?void 0:o.toLowerCase(),a=l===".jpg"||l===".jpeg"||l===".png"||l===".webp"||l===".gif"||l===".svg"?i.name:i.name.replace(/\.[^.]+$/,"")+".jpg",r=await k(`/api/task/${e}/attachment?project=${encodeURIComponent(t)}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({filename:a,data:c})});if(!r.ok){const p=await r.json().catch(()=>({}));we(p.error||`Upload failed (${r.status})`);return}}H(e,t)}async function H(e,n){var i;const t=document.getElementById("modal-overlay"),s=document.getElementById("modal-content");s.innerHTML='<div style="color:#94a3b8">Loading...</div>',t.classList.remove("hidden"),F();try{const c=n?`?project=${encodeURIComponent(n)}`:"",a=await(await k(`/api/task/${e}${c}`)).json(),r=document.querySelector(`.card[data-id="${a.id}"][data-project="${CSS.escape(a.project)}"]`);r&&r.dataset.status!==a.status&&(ze(),P());const p=$e(a.tags),u=p.length?`<div class="modal-tags">${p.map(v=>`<span class="tag">${v}</span>`).join("")}</div>`:"",m=[`<strong>Project:</strong> ${a.project}`,`<strong>Status:</strong> ${a.status}`,`<strong>Priority:</strong> ${a.priority}`,`<strong>Created:</strong> ${((i=a.created_at)==null?void 0:i.slice(0,10))||"-"}`,a.started_at?`<strong>Started:</strong> ${a.started_at.slice(0,10)}`:"",a.planned_at?`<strong>Planned:</strong> ${a.planned_at.slice(0,10)}`:"",a.reviewed_at?`<strong>Reviewed:</strong> ${a.reviewed_at.slice(0,10)}`:"",a.tested_at?`<strong>Tested:</strong> ${a.tested_at.slice(0,10)}`:"",a.completed_at?`<strong>Completed:</strong> ${a.completed_at.slice(0,10)}`:""].filter(Boolean).join(" &nbsp;|&nbsp; "),f={1:{labels:["Req","Impl","Done"],statuses:["todo","impl","done"]},2:{labels:["Req","Plan","Impl","Review","Done"],statuses:["todo","plan","impl","impl_review","done"]},3:{labels:["Req","Plan","Plan Rev","Impl","Impl Rev","Test","Done"],statuses:["todo","plan","plan_review","impl","impl_review","test","done"]}},g=f[a.level]||f[3],b=Math.max(0,g.statuses.indexOf(a.status)),$=`
      <div class="lifecycle-progress">
        <span class="level-indicator">L${a.level}</span>
        ${g.labels.map((v,E)=>`
          <div class="progress-step ${E<b?"completed":""} ${E===b?"current":""}">
            <div class="step-dot"></div>
            <span class="step-label">${v}</span>
          </div>
        `).join('<div class="progress-line"></div>')}
      </div>
    `,A=V(a.attachments),R=A.length>0?`<div class="attachments-grid">${A.map(v=>`<div class="attachment-thumb" data-stored="${v.storedName}">
            <img src="${v.url}" alt="${v.filename}" loading="lazy" />
            <button class="attachment-remove" data-id="${e}" data-name="${v.storedName}" title="Remove">&times;</button>
            <span class="attachment-name">${v.filename}</span>
          </div>`).join("")}</div>`:"",d=a.description?ge(a.description):'<span class="phase-empty">Not yet documented</span>',h=[1,2,3].map(v=>`<option value="${v}" ${v===a.level?"selected":""}>L${v}</option>`).join(""),y=`
      <div class="lifecycle-phase phase-requirement ${b===0?"active":""}">
        <div class="phase-header">
          <span class="phase-icon">📋</span>
          <span class="phase-label">Requirements</span>
          <select class="level-select" id="level-select" title="Pipeline Level">${h}</select>
          <button class="phase-edit-btn" id="req-edit-btn" title="Edit">&#9998;</button>
          <button class="phase-expand-btn" title="Expand to full screen">&#x26F6;</button>
        </div>
        <div class="phase-body" id="req-body-view">
          ${d}
          ${R}
        </div>
        <div class="phase-body hidden" id="req-body-edit">
          <textarea id="req-textarea" rows="8">${(a.description||"").replace(/</g,"&lt;")}</textarea>
          <div class="attachment-drop-zone" id="attachment-drop-zone">
            <span>📎 Drop images, paste (⌘V), or click to attach</span>
            <input type="file" id="attachment-input" accept="image/*" multiple hidden />
          </div>
          ${R?`<div id="edit-attachments">${R}</div>`:""}
          <div class="phase-edit-actions">
            <button class="phase-save-btn" id="req-save-btn">Save</button>
            <button class="phase-cancel-btn" id="req-cancel-btn">Cancel</button>
          </div>
        </div>
      </div>
    `,w=Ce("Plan","🗺️","phase-plan",a.plan,b===1&&!a.plan);let L="";a.decision_log&&(L=Ce("Decision Log","🧭","phase-decision-log",a.decision_log,!1));let I="";a.done_when&&(I=Ce("Done When","🎯","phase-done-when",a.done_when,!1));const D=V(a.plan_review_comments),ne=ht(D);let Ie="";(ne||b===2)&&(Ie=`
        <div class="lifecycle-phase phase-plan-review ${b===2?"active":""}">
          <div class="phase-header">
            <span class="phase-icon">🔍</span>
            <span class="phase-label">Plan Review</span>
            ${a.plan_review_count>0?`<span class="review-count">${a.plan_review_count} review(s)</span>`:""}
            <button class="phase-expand-btn" title="Expand to full screen">&#x26F6;</button>
          </div>
          <div class="phase-body">${ne||'<span class="phase-empty">Awaiting plan review</span>'}</div>
        </div>
      `);const qe=Ce("Implementation","🔨","phase-impl",a.implementation_notes,b===3&&!a.implementation_notes),Ge=V(a.review_comments),Se=ht(Ge);let Xe="";(Se||b===4)&&(Xe=`
        <div class="lifecycle-phase phase-review ${b===4?"active":""}">
          <div class="phase-header">
            <span class="phase-icon">📝</span>
            <span class="phase-label">Implementation Review</span>
            ${a.impl_review_count>0?`<span class="review-count">${a.impl_review_count} review(s)</span>`:""}
            <button class="phase-expand-btn" title="Expand to full screen">&#x26F6;</button>
          </div>
          <div class="phase-body">${Se||'<span class="phase-empty">Awaiting implementation review</span>'}</div>
        </div>
      `);const At=V(a.test_results),Qe=Sn(At);let et="";(Qe||b===5)&&(et=`
        <div class="lifecycle-phase phase-test ${b===5?"active":""}">
          <div class="phase-header">
            <span class="phase-icon">🧪</span>
            <span class="phase-label">Test Results</span>
            <button class="phase-expand-btn" title="Expand to full screen">&#x26F6;</button>
          </div>
          <div class="phase-body">${Qe||'<span class="phase-empty">Awaiting test execution</span>'}</div>
        </div>
      `);const Me=V(a.agent_log);let tt="";if(Me.length>0){let v=function(S){if(!S)return{name:"",model:null};const le=S.toLowerCase();for(const Ue of E){const Z=le.lastIndexOf(Ue);if(Z>0){let G=Z;for(;G>0&&(S[G-1]==="-"||S[G-1]==="_");)G--;return{name:S.slice(0,G),model:S.slice(Z)}}}return{name:S,model:null}};var o=v;const E=["opus","sonnet","haiku","gemini","copilot","gpt"],_=Me.map(S=>{var lt;const{name:le,model:Ue}=v(S.agent||""),Z=S.model||Ue,G=Z?`<span class="badge model-tag model-${Z.toLowerCase()}">${Z}</span>`:"";return`
          <div class="agent-log-entry">
            <span class="agent-log-time">${((lt=S.timestamp)==null?void 0:lt.slice(0,16))||""}</span>
            <span class="badge agent-tag">${le||S.agent||""}</span>
            ${G}
            <span class="agent-log-msg">${S.message||""}</span>
          </div>
        `}).join("");tt=`
        <details class="lifecycle-phase phase-agent-log">
          <summary class="phase-header">
            <span class="phase-icon">🤖</span>
            <span class="phase-label">Agent Log</span>
            <span class="review-count">${Me.length} entries</span>
          </summary>
          <div class="phase-body agent-log-body">${_}</div>
        </details>
      `}const nt=V(a.notes),Rt=nt.map(v=>{var E;return`
      <div class="note-entry">
        <div class="note-header">
          <span class="note-author">${v.author||"user"}</span>
          <span class="note-time">${((E=v.timestamp)==null?void 0:E.slice(0,16).replace("T"," "))||""}</span>
          <button class="note-delete" data-note-id="${v.id}" title="Delete">&times;</button>
        </div>
        <div class="note-text">${ge(v.text||"")}</div>
      </div>
    `}).join(""),kt=`
      <div class="notes-section">
        <div class="notes-header">
          <span>Notes</span>
          <span class="notes-count">${nt.length}</span>
        </div>
        <div class="notes-list">${Rt}</div>
        <form class="note-form" id="note-form">
          <textarea id="note-input" rows="2" placeholder="Add a note... (supports markdown)"></textarea>
          <button type="submit" class="note-submit">Add Note</button>
        </form>
      </div>
    `;s.innerHTML=`
      <h1>#${a.id} ${a.title}</h1>
      <div class="modal-meta">${m}</div>
      ${u}
      ${$}
      <div class="lifecycle-sections">
        ${y}
        ${w}
        ${L}
        ${I}
        ${Ie}
        ${qe}
        ${Xe}
        ${et}
        ${tt}
      </div>
      ${kt}
      <div class="modal-danger-zone">
        <button class="delete-task-btn" id="delete-task-btn">Delete Card</button>
      </div>
    `,In(s),s.querySelectorAll(".phase-expand-btn").forEach(v=>{v.addEventListener("click",E=>{E.stopPropagation();const _=v.closest(".lifecycle-phase");_==null||_.requestFullscreen().catch(()=>{})})});const at=document.getElementById("level-select");at.addEventListener("change",async()=>{const v=parseInt(at.value);await k(`/api/task/${e}?project=${encodeURIComponent(a.project)}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({level:v})}),U(a.project),H(e,a.project)}),document.getElementById("delete-task-btn").addEventListener("click",async()=>{confirm(`Delete card #${a.id} "${a.title}"?`)&&(await k(`/api/task/${e}?project=${encodeURIComponent(a.project)}`,{method:"DELETE"}),U(a.project),document.getElementById("modal-overlay").classList.add("hidden"),P())});const xt=document.getElementById("req-edit-btn"),st=document.getElementById("req-body-view"),ot=document.getElementById("req-body-edit"),De=document.getElementById("req-textarea"),it=document.getElementById("req-save-btn"),Pt=document.getElementById("req-cancel-btn");xt.addEventListener("click",()=>{st.classList.add("hidden"),ot.classList.remove("hidden"),De.focus()}),Pt.addEventListener("click",()=>{De.value=a.description||"",ot.classList.add("hidden"),st.classList.remove("hidden")}),it.addEventListener("click",async()=>{const v=De.value;it.textContent="Saving...",await k(`/api/task/${e}?project=${encodeURIComponent(a.project)}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({description:v})}),U(a.project),H(e,a.project)});const K=document.getElementById("attachment-drop-zone"),re=document.getElementById("attachment-input");K&&re&&(K.addEventListener("click",()=>re.click()),K.addEventListener("dragover",v=>{v.preventDefault(),K.classList.add("drop-active")}),K.addEventListener("dragleave",()=>{K.classList.remove("drop-active")}),K.addEventListener("drop",async v=>{var _;v.preventDefault(),K.classList.remove("drop-active");const E=(_=v.dataTransfer)==null?void 0:_.files;E&&await _e(e,E,a.project)}),re.addEventListener("change",async()=>{re.files&&await _e(e,re.files,a.project)})),s.addEventListener("paste",async v=>{var _;const E=Array.from(((_=v.clipboardData)==null?void 0:_.files)??[]).filter(S=>S.type.startsWith("image/"));E.length!==0&&(v.preventDefault(),await _e(e,E,a.project))}),s.querySelectorAll(".attachment-remove").forEach(v=>{v.addEventListener("click",async E=>{E.stopPropagation();const _=v,S=_.dataset.id,le=_.dataset.name;await k(`/api/task/${S}/attachment/${encodeURIComponent(le)}?project=${encodeURIComponent(a.project)}`,{method:"DELETE"}),H(e,a.project)})});const Ot=document.getElementById("note-form"),rt=document.getElementById("note-input");Ot.addEventListener("submit",async v=>{v.preventDefault();const E=rt.value.trim();E&&(rt.disabled=!0,await k(`/api/task/${e}/note?project=${encodeURIComponent(a.project)}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({text:E})}),U(a.project),H(e,a.project))}),s.querySelectorAll(".note-delete").forEach(v=>{v.addEventListener("click",async E=>{E.stopPropagation();const _=v.dataset.noteId;await k(`/api/task/${e}/note/${_}?project=${encodeURIComponent(a.project)}`,{method:"DELETE"}),U(a.project),H(e,a.project)})})}catch{s.innerHTML='<div style="color:#ef4444">Failed to load</div>'}}function _t(e){if(!e)return new Date(NaN);let n=e.replace(" ","T");return n.length===10?n+="T00:00:00Z":/Z$|[+-]\d{2}:\d{2}$/.test(n)||(n+="Z"),new Date(n)}function _n(e){const n=_t(e);if(isNaN(n.getTime()))return"Unknown";const t=n.getUTCDay()||7;n.setUTCDate(n.getUTCDate()+4-t);const s=new Date(Date.UTC(n.getUTCFullYear(),0,1)),o=Math.ceil(((n.getTime()-s.getTime())/864e5+1)/7);return`${n.getUTCFullYear()}-W${String(o).padStart(2,"0")}`}function jn(e){const n=_t(e);if(isNaN(n.getTime()))return e.slice(0,10)||"—";const t=n.toLocaleDateString(void 0,{month:"short",day:"numeric",timeZone:"UTC"}),s=n.toLocaleTimeString(void 0,{hour:"2-digit",minute:"2-digit",timeZone:"UTC",hour12:!1});return`${t}
${s}`}function Bn(e){const n=xe(e.priority),t=!j&&e.project?`<span class="badge project">${e.project}</span>`:"",s=n?`<span class="badge ${n}">${e.priority}</span>`:"",o=`<span class="badge status-${e.status}">${Re(e.status)}</span>`;return`
    <div class="chronicle-event" data-id="${e.id}" data-project="${e.project}" data-completed-at="${e.completed_at||""}">
      <div class="chronicle-dot ev-completed"></div>
      <div class="chronicle-event-time">${jn(e.completed_at)}</div>
      <div class="chronicle-event-body">
        <button class="chronicle-task-link" data-id="${e.id}" data-project="${e.project}">
          #${e.id} ${e.title}
        </button>
        ${o}
        ${s}
        ${t}
      </div>
    </div>`}function Tn(e){var p,u;const n=xe(e.priority),t=n?`<span class="badge ${n}">${e.priority}</span>`:"",s=!j&&e.project?`<span class="badge project">${e.project}</span>`:"",o=`<span class="badge status-${e.status}">${Re(e.status)}</span>`,i=`<span class="badge level-${e.level}">L${e.level}</span>`,c=((p=e.created_at)==null?void 0:p.slice(0,10))||"",l=((u=e.completed_at)==null?void 0:u.slice(0,10))||"—",r=$e(e.tags).map(m=>`<span class="tag">${m}</span>`).join("");return`
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
            ${W.map(m=>`<option value="${m.key}" ${m.key===e.status?"selected":""}>${m.label}</option>`).join("")}
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
      ${r?`<div class="list-card-tags">${r}</div>`:""}
    </article>
  `}async function jt(){const e=document.getElementById("chronicle-view");try{const n=await ie("full");Ye(n.projects);const t=[];for(const c of W)for(const l of n[c.key])t.push(l);const s=t.filter(c=>!!c.completed_at).sort((c,l)=>l.completed_at.localeCompare(c.completed_at)),o=new Map;for(const c of s){const l=_n(c.completed_at);o.has(l)||o.set(l,[]),o.get(l).push(c)}if(o.size===0){e.innerHTML=`
        <div style="display:flex;align-items:center;justify-content:center;color:#64748b;font-size:0.9rem;padding:64px">
          No completed tasks yet
        </div>`;return}const i=[...o.entries()].map(([c,l])=>{const a=l.map(Bn).join("");return`
        <div class="chronicle-group">
          <div class="chronicle-week-header">${c}</div>
          <div class="chronicle-events">${a}</div>
        </div>`}).join("");e.innerHTML=`<div class="chronicle-timeline">${i}</div>`,e.querySelectorAll(".chronicle-task-link").forEach(c=>{c.addEventListener("click",l=>{l.stopPropagation();const a=parseInt(c.dataset.id),r=c.dataset.project||void 0;H(a,r)})})}catch(n){console.error("loadChronicleView failed:",n),e.innerHTML=`
      <div style="display:flex;align-items:center;justify-content:center;color:#ef4444;font-size:0.9rem;padding:48px">
        Failed to load chronicle
      </div>`}}async function Oe(){const e=document.getElementById("graph-view");e.innerHTML=`
    <div class="graph-placeholder">
      <div class="graph-spinner"></div>
      <p>Loading graph&hellip;</p>
    </div>`,Q&&(Q.pauseAnimation(),Q=null),z&&(z.disconnect(),z=null);const n={todo:"#475569",plan:"#3b82f6",impl:"#8b5cf6",impl_review:"#6366f1",plan_review:"#a855f7",test:"#f59e0b",done:"#22c55e"},t={1:4,2:7,3:10},s={high:{width:3,color:"#ef4444"},medium:{width:2,color:"#f59e0b"},low:{width:1,color:"#64748b"}};try{const[{default:o},i]=await Promise.all([Dt(()=>import("./force-graph-B6EEfo0M.js"),[]),ie("full")]),c=[];for(const d of W){const h=i[d.key];for(const y of h)c.push({...y,_status:d.key})}let l=c,a="";c.length>300?(l=c.filter(d=>d._status!=="done"),a=`<div style="position:absolute;top:8px;left:50%;transform:translateX(-50%);z-index:10;background:#1e293b;color:#f59e0b;padding:4px 12px;border-radius:6px;font-size:0.8rem;border:1px solid #f59e0b40">${c.length} nodes — done tasks hidden for performance</div>`):O&&(l=c.filter(d=>!(d._status==="done"&&ce(d.completed_at||""))));const r=oe.toLowerCase().replace(/^#/,""),p=l.map(d=>({id:d.id,title:`#${d.id} ${d.title}`,status:d._status,level:d.level??1,tags:$e(d.tags),priority:d.priority||"medium",project:d.project})),u=new Map;for(const d of p)for(const h of d.tags){const y=h.toLowerCase();u.has(y)||u.set(y,[]),u.get(y).push(d.id)}const m=new Map;for(const[,d]of u)for(let h=0;h<d.length;h++)for(let y=h+1;y<d.length;y++){const w=Math.min(d[h],d[y]),L=Math.max(d[h],d[y]),I=`${w}-${L}`;m.set(I,(m.get(I)||0)+1)}const f=new Set,g=[];for(const[d,h]of u)for(let y=0;y<h.length;y++)for(let w=y+1;w<h.length;w++){const L=Math.min(h[y],h[w]),I=Math.max(h[y],h[w]),D=`${L}-${I}`;f.has(D)||(f.add(D),g.push({source:L,target:I,tag:d,sharedCount:m.get(D)||1}))}e.innerHTML=a,e.style.position="relative",e.style.padding="0",e.style.overflow="hidden";const b=document.createElement("div");b.style.cssText="position:absolute;inset:0;width:100%;height:100%",e.appendChild(b);const $=document.createElement("div");$.className="graph-tooltip",e.appendChild($),e.addEventListener("mousemove",d=>{const h=e.getBoundingClientRect();$.style.left=`${d.clientX-h.left+12}px`,$.style.top=`${d.clientY-h.top+12}px`});const A=o()(b).backgroundColor("#0f172a").nodeId("id").nodeLabel(()=>"").nodeVal(d=>t[d.level]||t[1]).nodeCanvasObject((d,h,y)=>{const w=Math.sqrt(t[d.level]||t[1])*2,L=d.x??0,I=d.y??0;let D=1;r?D=d.title.toLowerCase().includes(r)||d.tags.some(Se=>Se.toLowerCase().includes(r))?1:.15:d.status==="done"&&(D=.35),h.globalAlpha=D,h.beginPath(),h.arc(L,I,w,0,2*Math.PI),h.fillStyle=n[d.status]||"#475569",h.fill();const ne=s[d.priority]||s.medium;h.beginPath(),h.arc(L,I,w+ne.width/2,0,2*Math.PI),h.strokeStyle=ne.color,h.lineWidth=ne.width/y,h.stroke();const Ie=d.title.replace(/^#\d+\s*/,"").slice(0,40),qe=Math.max(3,11/y);h.font=`${qe}px sans-serif`,h.fillStyle=D<.5?"rgba(148,163,184,0.25)":"#cbd5e1",h.textAlign="left",h.textBaseline="middle",h.fillText(Ie,L+w+3/y,I),h.globalAlpha=1}).nodePointerAreaPaint((d,h,y)=>{const w=Math.sqrt(t[d.level]||t[1])*2+2;y.beginPath(),y.arc(d.x??0,d.y??0,w,0,2*Math.PI),y.fillStyle=h,y.fill()}).onNodeClick(d=>{H(d.id,d.project)}).onNodeHover(d=>{if(b.style.cursor=d?"pointer":"default",!d){$.style.display="none";return}const h=d.tags.slice(0,3),y=h.length?`<div class="graph-tooltip-tags">${h.map(w=>`<span>${w}</span>`).join("")}</div>`:"";$.innerHTML=`
          <div class="graph-tooltip-title">${d.title}</div>
          <div class="graph-tooltip-meta">${d.status} &middot; ${d.priority} &middot; L${d.level}</div>
          ${y}`,$.style.display="block"}).linkColor(()=>"#475569").linkWidth(d=>Math.min(1.5+(d.sharedCount-1)*.8,4)).d3AlphaDecay(.02).d3VelocityDecay(.3).warmupTicks(100).cooldownTime(5e3).width(e.offsetWidth||window.innerWidth).height(e.offsetHeight||window.innerHeight-112).graphData({nodes:p,links:g});Q=A;const R=document.createElement("div");R.className="graph-legend",R.innerHTML=Object.entries(n).map(([d,h])=>`<div class="graph-legend-item"><span style="background:${h}"></span>${d.replace("_"," ")}</div>`).join(""),e.appendChild(R),z=new ResizeObserver(d=>{for(const h of d){const{width:y,height:w}=h.contentRect;y>0&&w>0&&A.width(y).height(w)}}),z.observe(e)}catch(o){console.error("loadGraphView failed:",o),e.innerHTML=`
      <div class="graph-placeholder">
        <p style="color:#ef4444;font-size:0.9rem">Failed to load graph</p>
      </div>`}}async function be(){var n,t,s,o,i,c,l,a;const e=document.getElementById("board");try{const r=await ie(Fe()?"full":"board");on(r),Ye(r.projects),e.innerHTML=W.map(f=>{var g;return un(f.key,f.label,f.icon,r[f.key],((g=r.counts)==null?void 0:g[f.key])??r[f.key].length)}).join("");const p=((n=r.counts)==null?void 0:n.done)??r.done.length,u=r.total??(((t=r.counts)==null?void 0:t.todo)??r.todo.length)+(((s=r.counts)==null?void 0:s.plan)??r.plan.length)+(((o=r.counts)==null?void 0:o.plan_review)??r.plan_review.length)+(((i=r.counts)==null?void 0:i.impl)??r.impl.length)+(((c=r.counts)==null?void 0:c.impl_review)??r.impl_review.length)+(((l=r.counts)==null?void 0:l.test)??r.test.length)+(((a=r.counts)==null?void 0:a.done)??r.done.length);document.getElementById("count-summary").textContent=`${p}/${u} completed`,e.querySelectorAll(".card").forEach(f=>{f.addEventListener("click",g=>{if(g.target.closest(".card-interactive")){g.stopPropagation();return}const $=g.target.closest(".card-copy-btn");if($){g.stopPropagation(),navigator.clipboard.writeText($.dataset.copy).then(()=>{const d=$.textContent;$.textContent="✓",setTimeout(()=>{$.textContent=d},1e3)});return}const A=parseInt(f.dataset.id),R=f.dataset.project;H(A,R)})}),B||kn(),An(),Pe();const m=document.getElementById("add-card-btn");m&&m.addEventListener("click",f=>{f.stopPropagation(),document.getElementById("add-card-overlay").classList.remove("hidden"),F(),B||document.getElementById("add-title").focus()})}catch(r){console.error("loadBoard failed:",r),e.innerHTML=`
      <div style="grid-column:1/-1;display:flex;align-items:center;justify-content:center;color:#ef4444;font-size:0.9rem;padding:48px">
        Cannot find .claude/kanban.db
      </div>
    `}}function An(){document.querySelectorAll("[data-column-toggle]").forEach(e=>{e.addEventListener("click",n=>{if(!B)return;n.stopPropagation();const t=e.dataset.columnToggle;if(!t)return;Y.has(t)?Y.delete(t):Y.add(t),St();const s=e.closest(".column"),o=Y.has(t)||!!oe.trim();s&&s.setAttribute("data-mobile-expanded",String(o)),e.setAttribute("aria-expanded",String(o));const i=e.querySelector(".column-toggle-icon");i&&(i.textContent=o?"−":"+")})}),document.querySelectorAll(".mobile-status-select").forEach(e=>{e.addEventListener("click",n=>n.stopPropagation()),e.addEventListener("change",async n=>{n.stopPropagation();const t=e.value,s=parseInt(e.dataset.id||"",10),o=e.dataset.project||"",i=e.dataset.currentStatus||"";!s||!o||await cn({id:s,project:o,status:i},t)})})}async function ke(){const e=document.getElementById("list-view");try{const n=await ie("full");Ye(n.projects);const t=[];for(const a of W)for(const r of n[a.key])t.push(r);const s=J==="default"?[...t].sort((a,r)=>r.id-a.id):Ct(t),o=s.length,i=s.filter(a=>a.status==="done").length;document.getElementById("count-summary").textContent=`${i}/${o} completed`;const c=s.map(a=>{var m,f;const r=xe(a.priority),u=$e(a.tags).map(g=>`<span class="tag">${g}</span>`).join("");return`
        <tr class="status-${a.status}" data-id="${a.id}" data-project="${a.project}" data-completed-at="${a.completed_at||""}">
          <td class="col-id">#${a.id}</td>
          <td class="col-title">${a.title}</td>
          <td>
            <select class="list-status-select" data-id="${a.id}" data-field="status">
              ${W.map(g=>`<option value="${g.key}" ${g.key===a.status?"selected":""}>${g.icon} ${g.label}</option>`).join("")}
            </select>
          </td>
          <td>
            <select class="list-level-select" data-id="${a.id}" data-field="level">
              ${[1,2,3].map(g=>`<option value="${g}" ${g===a.level?"selected":""}>L${g}</option>`).join("")}
            </select>
          </td>
          <td>
            <select class="list-priority-select ${r}" data-id="${a.id}" data-field="priority">
              ${["high","medium","low"].map(g=>`<option value="${g}" ${g===a.priority?"selected":""}>${g[0].toUpperCase()+g.slice(1)}</option>`).join("")}
            </select>
          </td>
          <td class="list-date">${a.project||""}</td>
          <td>${u}</td>
          <td class="list-date">${((m=a.created_at)==null?void 0:m.slice(0,10))||""}</td>
          <td class="list-date">${((f=a.completed_at)==null?void 0:f.slice(0,10))||""}</td>
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
          <tbody>${c}</tbody>
        </table>
      </div>
    `,e.querySelectorAll("select").forEach(a=>{a.addEventListener("change",async r=>{r.stopPropagation();const p=a,u=p.dataset.id,m=p.dataset.field;let f=p.value;m==="level"&&(f=parseInt(f));const g=p.closest("tr"),b=(g==null?void 0:g.dataset.project)||"",$=await k(`/api/task/${u}?project=${encodeURIComponent(b)}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({[m]:f})});if(!$.ok){const A=await $.json().catch(()=>({}));A.error&&we(A.error),ke();return}U(b),ke()})}),e.querySelectorAll(".col-title").forEach(a=>{a.addEventListener("click",r=>{r.stopPropagation();const p=a.closest("[data-id]"),u=parseInt(p.dataset.id),m=p.dataset.project;H(u,m)})}),Pe()}catch(n){console.error("loadListView failed:",n),e.innerHTML=`
      <div style="display:flex;align-items:center;justify-content:center;color:#ef4444;font-size:0.9rem;padding:48px">
        Failed to load task list
      </div>
    `}}function Ye(e){const n=document.getElementById("project-filter");if(e.length<=1){n.innerHTML=e[0]?`<span class="project-label">${e[0]}</span>`:"";return}const t=e.map(s=>`<option value="${s}" ${s===j?"selected":""}>${s}</option>`).join("");n.innerHTML=`
    <select id="project-select">
      <option value="">All Projects</option>
      ${t}
    </select>
  `,document.getElementById("project-select").addEventListener("change",s=>{j=s.target.value||null,j?localStorage.setItem("kanban-project",j):localStorage.removeItem("kanban-project"),x=null,X=null,P()})}function gt(e,n){const t=[...e.querySelectorAll(".card:not(.dragging)")];for(const s of t){const o=s.getBoundingClientRect(),i=o.top+o.height/2;if(n<i)return s}return null}function je(){document.querySelectorAll(".drop-indicator").forEach(e=>e.remove())}function Rn(e,n){je();const t=document.createElement("div");t.className="drop-indicator",n?e.insertBefore(t,n):e.appendChild(t)}function kn(){const e=document.querySelectorAll(".card"),n=document.querySelectorAll(".column-body");e.forEach(t=>{t.addEventListener("dragstart",s=>{const o=s,i=t;o.dataTransfer.setData("text/plain",`${i.dataset.project}:${i.dataset.id}`),i.classList.add("dragging"),Te=!0}),t.addEventListener("dragend",()=>{t.classList.remove("dragging"),je(),Te=!1})}),n.forEach(t=>{t.addEventListener("dragover",s=>{s.preventDefault();const o=t;o.classList.add("drag-over");const i=gt(o,s.clientY);Rn(o,i)}),t.addEventListener("dragleave",s=>{const o=t;o.contains(s.relatedTarget)||(o.classList.remove("drag-over"),je())}),t.addEventListener("drop",async s=>{s.preventDefault();const o=t;o.classList.remove("drag-over"),je();const i=s,c=i.dataTransfer.getData("text/plain"),l=c.lastIndexOf(":"),a=l>=0?c.slice(0,l):"",r=parseInt(l>=0?c.slice(l+1):c),p=o.dataset.column,u=gt(o,i.clientY),m=[...o.querySelectorAll(".card:not(.dragging)")];let f=null,g=null;if(u){g=parseInt(u.dataset.id);const $=m.indexOf(u);$>0&&(f=parseInt(m[$-1].dataset.id))}else m.length>0&&(f=parseInt(m[m.length-1].dataset.id));const b=await k(`/api/task/${r}/reorder?project=${encodeURIComponent(a)}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({status:p,afterId:f,beforeId:g})});if(!b.ok){const $=await b.json().catch(()=>({}));$.error&&we($.error)}U(a),be()})})}function we(e){const n=document.querySelector(".toast");n&&n.remove();const t=document.createElement("div");t.className="toast",t.textContent=e,document.body.appendChild(t),setTimeout(()=>t.remove(),3e3)}async function Bt(){try{const n=await(await k("/api/info")).json();n.projectName&&(document.title=`Kanban · ${n.projectName}`,document.querySelector("header h1").textContent=`Kanban · ${n.projectName}`)}catch{}}function Ee(e){C=e,localStorage.setItem(Ne,C);const n=document.getElementById("board"),t=document.getElementById("list-view"),s=document.getElementById("chronicle-view"),o=document.getElementById("graph-view");e!=="graph"&&(z&&(z.disconnect(),z=null),Q&&(Q.pauseAnimation(),Q=null)),n.classList.add("hidden"),t.classList.add("hidden"),s.classList.add("hidden"),o.classList.add("hidden"),document.getElementById("tab-board").classList.remove("active"),document.getElementById("tab-list").classList.remove("active"),document.getElementById("tab-chronicle").classList.remove("active"),document.getElementById("tab-graph").classList.remove("active"),e==="board"?(n.classList.remove("hidden"),document.getElementById("tab-board").classList.add("active"),be()):e==="list"?(t.classList.remove("hidden"),document.getElementById("tab-list").classList.add("active"),ke()):e==="chronicle"?(s.classList.remove("hidden"),document.getElementById("tab-chronicle").classList.add("active"),jt()):(o.classList.remove("hidden"),document.getElementById("tab-graph").classList.add("active"),Oe())}function P(){C==="board"?be():C==="list"?ke():C==="chronicle"?jt():Oe()}document.getElementById("sort-select").value=J;O&&document.getElementById("hide-done-btn").classList.add("active");ve();Ve();document.getElementById("auth-btn").addEventListener("click",()=>{if(M&&T){ee("Shared token is stored on this device. Use Forget Token to reset it.","success");return}ee(M?"Enter the shared access token to load the board.":"This environment does not require a shared token.")});document.getElementById("auth-close").addEventListener("click",()=>{M&&!T||ye()});document.getElementById("auth-clear-btn").addEventListener("click",async()=>{await Qt(),M?ee("Stored token cleared. Enter a shared access token to continue."):(ye(),se("Stored token cleared."))});document.getElementById("auth-form").addEventListener("submit",async e=>{e.preventDefault();const t=document.getElementById("auth-token-input").value.trim();if(!t){se("Enter the shared access token.","error");return}se("Unlocking board...","default");try{await Lt(t),se("Board unlocked.","success"),await Bt(),It(),P()}catch(s){se(s instanceof Error?s.message:"Board authentication failed.","error")}});document.getElementById("tab-board").addEventListener("click",()=>Ee("board"));document.getElementById("tab-list").addEventListener("click",()=>Ee("list"));document.getElementById("tab-chronicle").addEventListener("click",()=>Ee("chronicle"));document.getElementById("tab-graph").addEventListener("click",()=>Ee("graph"));document.getElementById("toolbar-mobile-toggle").addEventListener("click",()=>{he=!he,Ve()});$t.addEventListener("change",e=>{Yt(e.matches)});document.addEventListener("visibilitychange",()=>{document.visibilityState!=="visible"||!T||(ze(),P())});function Tt(){if(He)return;He=!0;const e=new EventSource("/api/events");e.onmessage=()=>{if(Te)return;const n=!document.getElementById("modal-overlay").classList.contains("hidden"),t=!document.getElementById("add-card-overlay").classList.contains("hidden");!n&&!t&&P()},e.onerror=()=>{e.close(),He=!1,(!M||T)&&setTimeout(Tt,5e3)}}document.getElementById("refresh-btn").addEventListener("click",P);document.getElementById("search-input").addEventListener("input",e=>{if(oe=e.target.value.trim(),C==="board"){be();return}if(C==="graph"){Oe();return}Pe()});document.getElementById("sort-select").addEventListener("change",e=>{J=e.target.value,localStorage.setItem("kanban-sort",J),P()});document.getElementById("hide-done-btn").addEventListener("click",()=>{if(O=!O,localStorage.setItem("kanban-hide-old",String(O)),document.getElementById("hide-done-btn").classList.toggle("active",O),C==="graph"){Oe();return}Pe()});document.getElementById("modal-close").addEventListener("click",()=>{document.getElementById("modal-overlay").classList.add("hidden"),F(),P()});document.getElementById("modal-overlay").addEventListener("click",e=>{e.target===e.currentTarget&&(document.getElementById("modal-overlay").classList.add("hidden"),F(),P())});document.addEventListener("keydown",e=>{if(e.key==="Escape"){const n=!document.getElementById("modal-overlay").classList.contains("hidden");document.getElementById("modal-overlay").classList.add("hidden"),document.getElementById("add-card-overlay").classList.add("hidden"),!document.getElementById("auth-overlay").classList.contains("hidden")&&T&&ye(),F(),n&&P()}});const fe=document.getElementById("add-card-overlay");let N=[];function Le(){const e=document.getElementById("add-attachment-preview");if(N.length===0){e.innerHTML="";return}e.innerHTML=N.map((n,t)=>`
    <div class="attachment-thumb">
      <img src="${URL.createObjectURL(n)}" alt="${n.name}" />
      <button class="attachment-remove" data-idx="${t}" title="Remove" type="button">&times;</button>
      <span class="attachment-name">${n.name}</span>
    </div>
  `).join(""),e.querySelectorAll(".attachment-remove").forEach(n=>{n.addEventListener("click",t=>{t.stopPropagation();const s=parseInt(n.dataset.idx);N.splice(s,1),Le()})})}function Ze(e){for(const n of Array.from(e))n.type.startsWith("image/")&&N.push(n);Le()}document.getElementById("add-card-close").addEventListener("click",()=>{fe.classList.add("hidden"),N=[],Le(),F()});fe.addEventListener("click",e=>{e.target===e.currentTarget&&(fe.classList.add("hidden"),N=[],Le(),F())});const te=document.getElementById("add-attachment-zone"),de=document.getElementById("add-attachment-input");te.addEventListener("click",()=>de.click());te.addEventListener("dragover",e=>{e.preventDefault(),te.classList.add("drop-active")});te.addEventListener("dragleave",()=>{te.classList.remove("drop-active")});te.addEventListener("drop",e=>{var t;e.preventDefault(),te.classList.remove("drop-active");const n=(t=e.dataTransfer)==null?void 0:t.files;n&&Ze(n)});de.addEventListener("change",()=>{de.files&&Ze(de.files),de.value=""});fe.addEventListener("paste",e=>{var t;const n=Array.from(((t=e.clipboardData)==null?void 0:t.files)??[]).filter(s=>s.type.startsWith("image/"));n.length!==0&&(e.preventDefault(),Ze(n))});document.getElementById("add-card-form").addEventListener("submit",async e=>{e.preventDefault();const n=document.getElementById("add-title").value.trim();if(!n)return;const t=document.getElementById("add-priority").value,s=parseInt(document.getElementById("add-level").value)||3,o=document.getElementById("add-description").value.trim()||null,i=document.getElementById("add-tags").value.trim(),c=i?i.split(",").map(u=>u.trim()).filter(Boolean):null,l=j;if(!l){we("Select a project first");return}const a=document.querySelector("#add-card-form .form-submit");a.textContent=N.length>0?"Creating...":"Add Card",a.disabled=!0;const p=await(await k("/api/task",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({title:n,priority:t,level:s,description:o,tags:c,project:l})})).json();N.length>0&&p.id&&await _e(p.id,N,l),N=[],a.textContent="Add Card",a.disabled=!1,document.getElementById("add-card-form").reset(),Le(),fe.classList.add("hidden"),F(),U(l),P()});sn().then(async e=>{e&&(await Bt(),Ee(C),It())}).catch(()=>{ee("Unable to initialize board authentication.","error")});Wt();
