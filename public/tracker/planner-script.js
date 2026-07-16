'use strict';
/* ══════════════════════════════════════════
   CONSTANTS
══════════════════════════════════════════ */
const COLORS=['var(--blue)','var(--red)','var(--green)','var(--orange)','var(--purple)','var(--teal)','var(--gold)'];
const COLOR_NAMES={
  'var(--blue)': 'Blue 🔵',
  'var(--red)': 'Red 🔴',
  'var(--green)': 'Green 🟢',
  'var(--orange)': 'Orange 🟠',
  'var(--purple)': 'Purple 🟣',
  'var(--teal)': 'Teal 💎',
  'var(--gold)': 'Gold 🟡'
};
const ICONS=['⚖️','📈','🗺️','🔁','📝','🧮','💡','📖','🏛️','🎯','📊','✏️','🏆','🔬','💰','🌍','⚡','🎓','📋','🗞️'];
const SK='ias6_data', SP='ias6_prog', SC='ias6_conf';

// Page detection: set dynamically by each HTML file
let isManagePage = false;

/* ══════════════════════════════════════════
   DEFAULT DATA
══════════════════════════════════════════ */
const DEF_SUBJ=[
  {id:'s1',  name:'Subject 1',  color:'var(--red)', icon:'📚',  defaultHrs:3},
  {id:'s2',  name:'Subject 2',  color:'var(--green)', icon:'📖',  defaultHrs:3},
  {id:'s3',  name:'Subject 3',  color:'var(--blue)', icon:'📝',  defaultHrs:3},
  {id:'s4',  name:'Subject 4',  color:'var(--orange)', icon:'✏️',  defaultHrs:2},
];
const DEF_DAYS=[
  {id:'d1',title:'Day 1',dateOverride:null,targetHrs:8,blocks:[
    {id:'b1a',subjectId:'s1', targetHrs:3,  topic:'Topic 1',subtopics:['Subtopic 1','Subtopic 2','Subtopic 3']},
    {id:'b1b',subjectId:'s2', targetHrs:3,  topic:'Topic 1',subtopics:['Subtopic 1','Subtopic 2']},
    {id:'b1c',subjectId:'s3', targetHrs:2,  topic:'Topic 1',subtopics:['Subtopic 1']},
  ]},
  {id:'d2',title:'Day 2',dateOverride:null,targetHrs:8,blocks:[
    {id:'b2a',subjectId:'s1', targetHrs:3,  topic:'Topic 2',subtopics:['Subtopic 4','Subtopic 5']},
    {id:'b2b',subjectId:'s2', targetHrs:3,  topic:'Topic 2',subtopics:['Subtopic 3','Subtopic 4']},
    {id:'b2c',subjectId:'s4', targetHrs:2,  topic:'Topic 1',subtopics:['Subtopic 1']},
  ]},
  {id:'d3',title:'Day 3',dateOverride:null,targetHrs:8,blocks:[
    {id:'b3a',subjectId:'s1', targetHrs:3,  topic:'Topic 3',subtopics:['Subtopic 6']},
    {id:'b3b',subjectId:'s2', targetHrs:3,  topic:'Topic 3',subtopics:['Subtopic 5']},
    {id:'b3c',subjectId:'s3', targetHrs:2,  topic:'Topic 2',subtopics:['Subtopic 2']},
  ]}
];
let PREMADE_SYLLABI = {};

/* ══════════════════════════════════════════
   STATE
══════════════════════════════════════════ */
let subj=[], days=[], prog={}, conf={startDate:null,dark:false,targetDate:null,revisionActive:false,activeTab:'daily'};
let curDay=0;
let timers={};
let editSubjId=null, editDayId=null, bpDayId=null, bpSelSubjId=null;
let modalBlocks=[];
let selColor=COLORS[0], selIcon=ICONS[0];

function loadLocalSync() {
  try{const d=JSON.parse(localStorage.getItem(SK));if(d&&d.subj&&d.days){subj=d.subj;days=d.days;}else defReset();}catch{defReset();}
  try{prog=JSON.parse(localStorage.getItem(SP))||{};}catch{prog={};}
  try{const c=JSON.parse(localStorage.getItem(SC));if(c)conf={...conf,...c};}catch{}
}

async function load() {
  try {
    const res = await fetch("/api/student/study-tracker");
    if (res.ok) {
      const serverData = await res.json();
      if (serverData && serverData.subj && serverData.days) {
        subj = serverData.subj;
        days = serverData.days;
        prog = serverData.prog || {};
        conf = { ...conf, ...(serverData.conf || {}) };
        
        localStorage.setItem(SK, JSON.stringify({ subj, days }));
        localStorage.setItem(SP, JSON.stringify(prog));
        localStorage.setItem(SC, JSON.stringify(conf));
      }
    }
  } catch (err) {
    console.error("Error loading study tracker from server:", err);
  }

  if(!conf.startDate){const n=new Date();n.setHours(0,0,0,0);conf.startDate=n.toISOString();}
  const today=new Date();today.setHours(0,0,0,0);
  for(let i=0;i<days.length;i++){if(getDd(i).getTime()===today.getTime()){curDay=i;break;}}
}

function defReset(){
  subj=JSON.parse(JSON.stringify(DEF_SUBJ));
  days=JSON.parse(JSON.stringify(DEF_DAYS));
  if (!conf) conf = {};
  conf.syllabusType = 'custom';
  conf.examName = 'My Study Plan';
}

let syncTimeout = null;
function syncToServer() {
  localStorage.setItem(SK, JSON.stringify({ subj, days }));
  localStorage.setItem(SP, JSON.stringify(prog));
  localStorage.setItem(SC, JSON.stringify(conf));

  if (syncTimeout) clearTimeout(syncTimeout);
  syncTimeout = setTimeout(async () => {
    try {
      await fetch("/api/student/study-tracker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subj, days, prog, conf }),
      });
    } catch (err) {
      console.error("Error syncing study tracker data to server:", err);
    }
  }, 1000);
}

function sd(){ syncToServer(); }
function sp(){ syncToServer(); }
function sc(){ syncToServer(); }
function gp(bid){if(!prog[bid])prog[bid]={subtopics:{},customTasks:[],notes:'',timeSpent:0};return prog[bid];}
function getDd(i){const d=days[i];if(d?.dateOverride)return new Date(d.dateOverride);const dt=new Date(conf.startDate);dt.setDate(dt.getDate()+i);return dt;}
function isToday(d){const t=new Date();t.setHours(0,0,0,0);return d.getTime()===t.getTime();}
function fd(d){return d.toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short'});}
function gid(){return 'b'+Date.now().toString(36)+Math.random().toString(36).slice(2,5);}
function getVibrantColor(c) {
  const mapping = {
    '#3b7dd8': 'var(--blue)',
    '#d94f3d': 'var(--red)',
    '#2e9e5b': 'var(--green)',
    '#e07a2a': 'var(--orange)',
    '#7c5cbf': 'var(--purple)',
    '#1e9b8a': 'var(--teal)',
    '#c89520': 'var(--gold)',
    '#e84393': 'var(--purple)',
    '#5a7fbf': 'var(--blue)',
    '#8b6914': 'var(--gold)'
  };
  return mapping[c] || c;
}

function sj(id){
  const s = subj.find(s=>s.id===id);
  if (!s) return {name:'?',color:'var(--border2)',icon:'❓',defaultHrs:2};
  return {
    ...s,
    color: getVibrantColor(s.color)
  };
}
function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}

/* Target date calculation functions */
function getDaysCount(start, end) {
  const s = new Date(start);
  const e = new Date(end);
  s.setHours(0,0,0,0);
  e.setHours(0,0,0,0);
  return Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
}

function updateTargetName(val) {
  conf.examName = val ? val.trim() : null;
  sc();
  updateDaysRemaining();
  renderManage();
  renderAll();
}

function updateDaysRemaining() {
  const textEl = document.getElementById('daysRemainingText');
  const repeatBtn = document.getElementById('repeatPatternBtn');
  if (!textEl) return;
  if (!conf.targetDate) {
    textEl.textContent = '-';
    if (repeatBtn) repeatBtn.style.display = 'none';
    return;
  }
  const today = new Date();
  today.setHours(0,0,0,0);
  const exam = new Date(conf.targetDate);
  exam.setHours(0,0,0,0);
  const prefix = conf.examName ? `${conf.examName}: ` : '';
  if (exam < today) {
    textEl.innerHTML = `${prefix}<span style="color:var(--red)">Passed</span>`;
    if (repeatBtn) repeatBtn.style.display = 'none';
  } else {
    const diff = Math.ceil((exam.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    textEl.textContent = `${prefix}${diff} days`;
    if (repeatBtn) repeatBtn.style.display = days.length >= 7 ? 'inline-block' : 'none';
  }
}

function updateTargetDate(val) {
  conf.targetDate = val ? new Date(val).toISOString().split('T')[0] : null;
  sc();
  updateDaysRemaining();
  renderManage();
  renderAll();
}

function generatePlanTillTargetDate() {
  if (!conf.targetDate) { alert('Please select a target exam date first.'); return; }
  const total = getDaysCount(conf.startDate, conf.targetDate);
  if (total <= 0) { alert('Target date must be after the start date.'); return; }
  if (days.length === total) { alert('Plan is already correct length.'); return; }
  if (days.length > total) {
    if (!confirm(`Truncate plan from ${days.length} to ${total} days?`)) return;
    days = days.slice(0, total);
  } else {
    const originalLen = days.length;
    for (let i = originalLen; i < total; i++) {
      const source = days[i % 7] || { title: 'Study Day', targetHrs: 9, blocks: [] };
      days.push({
        id: 'day_' + i + '_' + Date.now(),
        title: source.title || `Day ${i + 1}`,
        dateOverride: null,
        targetHrs: source.targetHrs || 9,
        blocks: (source.blocks || []).map(b => ({
          id: gid(),
          subjectId: b.subjectId,
          targetHrs: b.targetHrs,
          topic: '',
          subtopics: []
        }))
      });
    }
  }
  sd();
  renderAll();
  renderManage();
  updateDaysRemaining();
  alert(`Plan set to ${total} days.`);
}

function repeatCurrentPattern() {
  if (days.length < 7) { alert('Please configure a 7-day study table first.'); return; }
  if (!conf.targetDate) { alert('Please select a target exam date first.'); return; }
  const total = getDaysCount(conf.startDate, conf.targetDate);
  if (total <= 7) { alert('Target date must be at least 7 days after the start date.'); return; }
  const newDays = days.slice(0, 7);
  for (let i = 7; i < total; i++) {
    const source = days[i % 7] || days[0];
    newDays.push({
      id: 'day_' + i + '_' + Date.now(),
      title: source.title,
      dateOverride: null,
      targetHrs: source.targetHrs,
      blocks: source.blocks.map(b => ({
        id: gid(),
        subjectId: b.subjectId,
        targetHrs: b.targetHrs,
        topic: '',
        subtopics: []
      }))
    });
  }
  days = newDays;
  sd();
  renderAll();
  renderManage();
  alert(`Timetable repeated for all ${total - 7} upcoming days.`);
}

function getExistingTopicsForSubject(subjectId) {
  const topicsMap = new Map();
  days.forEach(d => {
    d.blocks.forEach(b => {
      if (b.subjectId === subjectId && b.topic && b.topic.trim()) {
        const name = b.topic.trim();
        if (!topicsMap.has(name) || (b.subtopics && b.subtopics.length > (topicsMap.get(name)?.length || 0))) {
          topicsMap.set(name, b.subtopics || []);
        }
      }
    });
  });
  return Array.from(topicsMap.entries()).map(([topic, subtopics]) => ({ topic, subtopics }));
}

function bPct(bid,sts){
  const p=gp(bid);
  const tot=sts.length+(p.customTasks?.length||0);
  if(!tot)return 100;
  return Math.round((sts.filter((_,j)=>p.subtopics[j]).length+(p.customTasks||[]).filter(t=>t.done).length)/tot*100);
}
function dPct(i){
  const d=days[i];if(!d||!d.blocks.length)return 0;
  return Math.round(d.blocks.reduce((s,b)=>s+bPct(b.id,b.subtopics),0)/d.blocks.length);
}
function dLogHrs(i){
  return days[i]?.blocks.reduce((s,b)=>{
    const p=gp(b.id);let sec=p.timeSpent||0;
    if(timers[b.id]?.running)sec+=Math.floor((Date.now()-timers[b.id].start)/1000);
    return s+sec;
  },0)/3600||0;
}
function dPlannedHrs(i){return days[i]?.blocks.reduce((s,b)=>s+(b.targetHrs||0),0)||0;}

/* ══════════════════════════════════════════
   STATS
══════════════════════════════════════════ */
function renderStats(){
  const tot=days.length, done=days.filter((_,i)=>dPct(i)===100).length;
  let streak=0;const today=new Date();today.setHours(0,0,0,0);
  for(let i=0;i<days.length;i++){const dd=getDd(i);if(dd>today)break;if(dPct(i)===100)streak++;else streak=0;}
  const totalSec=days.reduce((s,d)=>s+d.blocks.reduce((ss,b)=>ss+(gp(b.id).timeSpent||0),0),0);
  const th=Math.floor(totalSec/3600),tm=Math.floor((totalSec%3600)/60);
  const todayI=days.findIndex((_,i)=>isToday(getDd(i)));
  const todayLog=todayI>=0?dLogHrs(todayI).toFixed(1):0;
  const todayTgt=todayI>=0?(days[todayI].targetHrs||9):9;

  const activeBid = Object.keys(timers).find(bid => timers[bid]?.running);
  let todayCardHtml = '';
  if (activeBid) {
    let activeBlock = null;
    for (let d of days) {
      activeBlock = d.blocks.find(b => b.id === activeBid);
      if (activeBlock) break;
    }
    if (activeBlock) {
      const s = sj(activeBlock.subjectId);
      const elapsed = (gp(activeBid).timeSpent || 0) + Math.floor((Date.now() - timers[activeBid].start) / 1000);
      const ah = Math.floor(elapsed / 3600), am = Math.floor((elapsed % 3600) / 60), as = elapsed % 60;
      const elapsedStr = `${String(ah).padStart(2,'0')}:${String(am).padStart(2,'0')}:${String(as).padStart(2,'0')}`;
      
      todayCardHtml = `
        <div class="stat-card active-working clickable" onclick="showStatsDetail('today')" style="position:relative;cursor:pointer">
          <div style="position:absolute;top:10px;right:10px;width:7px;height:7px;border-radius:50%;background:var(--green);animation:pulse 1.5s infinite"></div>
          <div class="stat-label" style="color:var(--green)">⚡ Studying</div>
          <div class="stat-value" style="font-size:20px;display:flex;align-items:center;gap:6px">${s.icon} ${elapsedStr}</div>
          <div class="stat-sub" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(activeBlock.topic || s.name)}</div>
        </div>
      `;
    }
  }
  if (!todayCardHtml) {
    todayCardHtml = `<div class="stat-card clickable" onclick="showStatsDetail('today')" style="cursor:pointer"><div class="stat-label">📅 Today</div><div class="stat-value" style="color:var(--purple)">${todayLog}h</div><div class="stat-sub">of ${todayTgt}h target</div></div>`;
  }

  document.getElementById('statsRow').innerHTML=`
    <div class="stat-card clickable" onclick="showStatsDetail('progress')" style="cursor:pointer"><div class="stat-label">Progress</div><div class="stat-value">${tot?Math.round(done/tot*100):0}%</div><div class="stat-sub">${done}/${tot} days done</div></div>
    <div class="stat-card clickable" onclick="showStatsDetail('streak')" style="cursor:pointer"><div class="stat-label">🔥 Streak</div><div class="stat-value" style="color:var(--orange)">${streak}</div><div class="stat-sub">days in a row</div></div>
    <div class="stat-card clickable" onclick="showStatsDetail('time')" style="cursor:pointer"><div class="stat-label">⏱ Time</div><div class="stat-value" style="color:var(--green)">${th?th+'h '+tm+'m':tm+'m'}</div><div class="stat-sub">total logged</div></div>
    ${todayCardHtml}`;
  renderHoursBar();
}

function showStatsDetail(type) {
  const titleEl = document.getElementById('sdTitle');
  const bodyEl = document.getElementById('sdBody');
  if (!titleEl || !bodyEl) return;

  if (type === 'progress') {
    titleEl.textContent = '📈 Study Plan Progress';
    const tot = days.length;
    const done = days.filter((_, i) => dPct(i) === 100).length;
    const ip = days.filter((_, i) => { const p = dPct(i); return p > 0 && p < 100; }).length;
    const un = tot - done - ip;
    const pct = tot ? Math.round(done / tot * 100) : 0;
    
    const completedList = days.map((d, i) => ({ title: d.title || `Day ${i+1}`, pct: dPct(i), i }))
      .filter(x => x.pct > 0)
      .map(x => `
        <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border);font-size:12px">
          <span style="color:var(--ink)">Day ${x.i + 1}: ${esc(x.title)}</span>
          <span style="font-weight:700;color:${x.pct === 100 ? 'var(--green)' : 'var(--blue)'}">${x.pct}%</span>
        </div>
      `).join('') || '<div style="padding:10px 0;color:var(--ink3);font-size:12px;text-align:center">No study activity yet. Complete some topics to see them here!</div>';

    bodyEl.innerHTML = `
      <div style="padding:0 16px">
        <div style="margin-bottom:16px;text-align:center">
          <div style="font-size:32px;font-weight:800;color:var(--blue);margin-bottom:4px">${pct}%</div>
          <div style="font-size:12px;color:var(--ink3)">Overall completion rate</div>
        </div>
        <div style="display:flex;height:8px;border-radius:4px;overflow:hidden;background:var(--bg2);margin-bottom:20px">
          <div style="width:${pct}%;background:var(--green)"></div>
          <div style="width:${tot ? Math.round(ip/tot*100) : 0}%;background:var(--blue)"></div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:20px;text-align:center">
          <div style="background:var(--bg2);padding:10px;border-radius:8px">
            <div style="font-size:16px;font-weight:700;color:var(--green)">${done}</div>
            <div style="font-size:10px;color:var(--ink3);text-transform:uppercase;font-weight:600;margin-top:2px">Done</div>
          </div>
          <div style="background:var(--bg2);padding:10px;border-radius:8px">
            <div style="font-size:16px;font-weight:700;color:var(--blue)">${ip}</div>
            <div style="font-size:10px;color:var(--ink3);text-transform:uppercase;font-weight:600;margin-top:2px">In Progress</div>
          </div>
          <div style="background:var(--bg2);padding:10px;border-radius:8px">
            <div style="font-size:16px;font-weight:700;color:var(--ink2)">${un}</div>
            <div style="font-size:10px;color:var(--ink3);text-transform:uppercase;font-weight:600;margin-top:2px">Unstarted</div>
          </div>
        </div>
        <div style="font-size:12px;font-weight:700;text-transform:uppercase;color:var(--ink3);margin-bottom:8px">Activity Log</div>
        <div style="max-height:160px;overflow-y:auto;background:var(--bg2);padding:4px 12px;border-radius:8px;border:1px solid var(--border)">
          ${completedList}
        </div>
      </div>
    `;
  }
  else if (type === 'streak') {
    titleEl.textContent = '🔥 Study Streak Analytics';
    let currentStreak = 0;
    const today = new Date();
    today.setHours(0,0,0,0);
    for (let i = 0; i < days.length; i++) {
      const dd = getDd(i);
      if (dd > today) break;
      if (dPct(i) === 100) currentStreak++;
      else currentStreak = 0;
    }

    let bestStreak = 0;
    let tempStreak = 0;
    for (let i = 0; i < days.length; i++) {
      if (dPct(i) === 100) {
        tempStreak++;
        if (tempStreak > bestStreak) bestStreak = tempStreak;
      } else {
        tempStreak = 0;
      }
    }

    bodyEl.innerHTML = `
      <div style="padding:0 16px">
        <div style="display:flex;justify-content:space-around;margin-bottom:20px;text-align:center">
          <div>
            <div style="font-size:36px;font-weight:800;color:var(--orange)">🔥 ${currentStreak}</div>
            <div style="font-size:11px;color:var(--ink3);text-transform:uppercase;font-weight:600;margin-top:2px">Current Streak</div>
          </div>
          <div>
            <div style="font-size:36px;font-weight:800;color:var(--blue)">🏆 ${bestStreak}</div>
            <div style="font-size:11px;color:var(--ink3);text-transform:uppercase;font-weight:600;margin-top:2px">Best Streak</div>
          </div>
        </div>
        <div style="background:var(--bg2);padding:14px;border-radius:8px;border:1px solid var(--border);margin-bottom:12px;font-size:13px;line-height:1.6;color:var(--ink2)">
          <strong>Keep the momentum going!</strong><br>
          Your study streak increases every day you complete 100% of your scheduled subject blocks. Missing a single block resets your current streak. Make it a habit to check off subtopics daily!
        </div>
      </div>
    `;
  }
  else if (type === 'time') {
    titleEl.textContent = '⏱️ Study Time Breakdown';
    const totalSec = days.reduce((s,d) => s + d.blocks.reduce((ss,b) => ss + (gp(b.id).timeSpent || 0), 0), 0);
    const th = Math.floor(totalSec / 3600);
    const tm = Math.floor((totalSec % 3600) / 60);

    const subjectTime = {};
    days.forEach(d => {
      d.blocks.forEach(b => {
        const time = gp(b.id).timeSpent || 0;
        if (time > 0) {
          subjectTime[b.subjectId] = (subjectTime[b.subjectId] || 0) + time;
        }
      });
    });

    const breakdownHtml = Object.keys(subjectTime).map(sid => {
      const s = sj(sid);
      const sec = subjectTime[sid];
      const hours = (sec / 3600).toFixed(1);
      const percent = totalSec ? Math.round(sec / totalSec * 100) : 0;
      return `
        <div style="margin-bottom:12px">
          <div style="display:flex;justify-content:space-between;font-size:12px;font-weight:600;margin-bottom:4px;color:var(--ink)">
            <span>${s.icon} ${s.name}</span>
            <span>${hours}h (${percent}%)</span>
          </div>
          <div style="height:6px;background:var(--bg2);border-radius:3px;overflow:hidden">
            <div style="height:100%;width:${percent}%;background:${s.color}"></div>
          </div>
        </div>
      `;
    }).join('') || '<div style="padding:10px 0;color:var(--ink3);font-size:12px;text-align:center">No logged study time yet. Start the timers to log time!</div>';

    bodyEl.innerHTML = `
      <div style="padding:0 16px">
        <div style="text-align:center;margin-bottom:20px">
          <div style="font-size:32px;font-weight:800;color:var(--green)">${th}h ${tm}m</div>
          <div style="font-size:12px;color:var(--ink3)">Total focus time logged</div>
        </div>
        <div style="font-size:12px;font-weight:700;text-transform:uppercase;color:var(--ink3);margin-bottom:12px">Time Distribution</div>
        <div style="background:var(--bg2);padding:16px;border-radius:8px;border:1px solid var(--border)">
          ${breakdownHtml}
        </div>
      </div>
    `;
  }
  else if (type === 'today') {
    titleEl.textContent = '📅 Today\'s Study Targets';
    const todayI = days.findIndex((_, i) => isToday(getDd(i)));
    if (todayI < 0) {
      bodyEl.innerHTML = '<div style="padding:20px;text-align:center;color:var(--ink3);font-size:13px">Today is not in your current plan range. Make sure to adjust your plan days!</div>';
    } else {
      const d = days[todayI];
      const target = d.targetHrs || 9;
      const logged = dLogHrs(todayI);
      const planned = dPlannedHrs(todayI);
      const pct = dPct(todayI);

      const blocksHtml = d.blocks.map(b => {
        const s = sj(b.subjectId);
        const sec = gp(b.id).timeSpent || 0;
        const hr = (sec / 3600).toFixed(1);
        const bp = bPct(b.id, b.subtopics);
        return `
          <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)">
            <div>
              <div style="font-size:13px;font-weight:700;color:var(--ink)">${s.icon} ${s.name}</div>
              <div style="font-size:11px;color:var(--ink3);margin-top:2px">${esc(b.topic || 'No topic')}</div>
            </div>
            <div style="text-align:right">
              <div style="font-size:12px;font-weight:700;color:var(--ink)">${hr}h / ${b.targetHrs}h</div>
              <div style="font-size:10px;color:var(--ink3);margin-top:2px">${bp}% complete</div>
            </div>
          </div>
        `;
      }).join('') || '<div style="padding:10px 0;color:var(--ink3);font-size:12px">No blocks scheduled for today.</div>';

      bodyEl.innerHTML = `
        <div style="padding:0 16px">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
            <div>
              <div style="font-size:18px;font-weight:800;color:var(--ink)">Day ${todayI + 1}</div>
              <div style="font-size:12px;color:var(--ink3);margin-top:2px">${fd(getDd(todayI))}</div>
            </div>
            <div style="text-align:right">
              <div style="font-size:24px;font-weight:800;color:var(--purple)">${logged.toFixed(1)}h</div>
              <div style="font-size:11px;color:var(--ink3)">of ${target}h target (${pct}%)</div>
            </div>
          </div>
          
          <div style="font-size:12px;font-weight:700;text-transform:uppercase;color:var(--ink3);margin-bottom:8px">Scheduled Blocks</div>
          <div style="background:var(--bg2);padding:4px 14px;border-radius:8px;border:1px solid var(--border)">
            ${blocksHtml}
          </div>
        </div>
      `;
    }
  }

  openModal('statsDetailOverlay');
}

function renderHoursBar(){
  const d=days[curDay];
  if(!d){document.getElementById('hoursBar').innerHTML='<div style="font-size:13px;color:var(--ink3)">No day selected</div>';return;}
  const target=d.targetHrs||9;
  const planned=dPlannedHrs(curDay);
  const logged=dLogHrs(curDay);
  const logH=Math.floor(logged),logM=Math.round((logged-logH)*60);
  const logStr=`${logH}h ${String(logM).padStart(2,'0')}m`;
  let st='low',stTxt=`↑ Keep going (${logStr} / ${target}h)`;
  if(logged>=target){st='done';stTxt=`🎯 Target met! (${logStr})`;}
  else if(logged>=target*.5){st='ok';stTxt=`✓ On track (${logStr} / ${target}h)`;}
  const segs=d.blocks.map(b=>{
    const s=sj(b.subjectId);
    const pct=Math.min((b.targetHrs/target)*100,100);
    const fillOpacity=0.45+Math.min((gp(b.id).timeSpent||0)/3600/b.targetHrs,.55)*.55;
    const lbl=pct>10?`${s.icon} ${b.targetHrs}h`:'';
    return `<div class="hb-seg" style="width:${pct}%;background:${s.color};opacity:${fillOpacity}" title="${s.name}: ${b.targetHrs}h">${lbl}</div>`;
  }).join('');
  const legend=d.blocks.map(b=>{const s=sj(b.subjectId);return `<div class="hb-leg-item"><div class="hb-leg-dot" style="background:${s.color}"></div>${s.icon} ${s.name}: <strong>${b.targetHrs}h</strong></div>`;}).join('');
  document.getElementById('hoursBar').innerHTML=`
    <div class="hb-top">
      <div class="hb-title">Day ${curDay+1} Hours Plan</div>
      <span class="hb-status ${st}">${stTxt}</span>
      <div class="hb-meta">Planned: <strong>${planned}h</strong> · Target: <strong>${target}h</strong></div>
    </div>
    <div class="hb-track">${segs||'<div style="padding:4px 10px;font-size:11px;color:var(--ink3)">No subjects</div>'}</div>
    <div class="hb-legend">${legend}</div>`;
}

/* ══════════════════════════════════════════
   DAILY VIEW
══════════════════════════════════════════ */
function renderDaily(){
  renderTodayBanner();
  renderNavLabel();
  renderDots();
  renderDayContent();
}

function renderTodayBanner(){
  const ti=days.findIndex((_,i)=>isToday(getDd(i)));
  const el=document.getElementById('todayBanner');
  if(ti<0){el.style.display='none';return;}
  el.style.display='flex';
  const d=days[ti],s=sj(d.blocks[0]?.subjectId||'');
  el.innerHTML=`<div style="font-size:22px">${s.icon}</div>
    <div class="tb-text"><div class="tb-title">Today — Day ${ti+1}${d.title?' · '+esc(d.title):''}</div><div class="tb-sub">${fd(getDd(ti))} · ${dPct(ti)}% complete · ${dPlannedHrs(ti)}h planned</div></div>
    <button class="goto-btn" onclick="jumpTo(${ti})">Go ›</button>`;
}

function renderNavLabel(){
  if(!days.length){document.getElementById('navLabel').textContent='No days';return;}
  const d=days[curDay];
  document.getElementById('navLabel').innerHTML=`Day ${curDay+1}${d.title?' — '+esc(d.title):''}<span class="nav-date">${fd(getDd(curDay))}</span>`;
}

function renderDots(){
  document.getElementById('dayDots').innerHTML=days.map((_,i)=>{
    const p=dPct(i);
    let c='dot';
    if(p===100)c+=' done';else if(p>0)c+=' partial';
    if(isToday(getDd(i)))c+=' today';
    if(i===curDay)c+=' active';
    return `<div class="${c}" onclick="jumpTo(${i})" title="Day ${i+1} — ${p}%">${i+1}</div>`;
  }).join('');
}

function renderDayContent(){
  if(!days.length){
    document.getElementById('dayContent').innerHTML=`<div class="empty-state"><div class="es-icon">📋</div><p>No days yet. Go to <strong>Manage</strong> to build your plan.</p></div>`;
    return;
  }
  const day=days[curDay];
  let html=`<div class="day-meta">
    <div class="day-badge" style="background:${sj(day.blocks[0]?.subjectId).color||'var(--blue)'}">${curDay+1}</div>
    <div class="day-meta-info">
      <div class="day-title-input" style="font-size:15px;font-weight:700;color:var(--ink);border:none;background:transparent;padding:0;margin:0">${esc(day.title||'Untitled Day')}</div>
      <div class="day-meta-row">
        <div style="font-size:12px;color:var(--ink3);padding:3px 0">${fd(getDd(curDay))}</div>
        <div class="target-ctrl">Target: <strong id="tgt-${day.id}">${day.targetHrs||9}h</strong></div>
      </div>
    </div>

    <button class="add-block-btn" style="background:#3b7dd820;color:var(--blue)" onclick="switchView('manage')">⚙️ Manage Plan</button>
   </div>
  <div class="day-blocks">`;
  day.blocks.forEach((b,bi)=>{ html+=buildBlockReadOnly(day.id,b,bi); });
  html+='</div>';
  document.getElementById('dayContent').innerHTML=html;
}

function buildBlockReadOnly(dayId,block,bi){
  const s=sj(block.subjectId);
  const p=gp(block.id);
  const pct=bPct(block.id,block.subtopics);
  const circ=2*Math.PI*15;
  const offset=circ-(pct/100)*circ;
  const sec=p.timeSpent||0;
  const extra=timers[block.id]?.running?Math.floor((Date.now()-timers[block.id].start)/1000):0;
  const tot=sec+extra;
  const th=Math.floor(tot/3600),tm=Math.floor((tot%3600)/60),ts=tot%60;
  const tStr=`${String(th).padStart(2,'0')}:${String(tm).padStart(2,'0')}:${String(ts).padStart(2,'0')}`;
  const isRun=!!timers[block.id]?.running;
  const barW=Math.min((tot/3600/block.targetHrs)*100,100);
  const stHtml=block.subtopics.map((st,j)=>{
    const done=!!p.subtopics[j];
    return `<div class="st-row ${done?'done':''}">
      <div class="st-check ${done?'on':''}" onclick="toggleST('${block.id}',${j},'${dayId}')">${done?'✓':''}</div>
      <input class="st-text" value="${esc(st)}" onchange="editST('${dayId}','${block.id}',${j},this.value)">
      <button class="st-del" onclick="delST('${dayId}','${block.id}',${j})">✕</button>
    </div>`;
  }).join('');
  const ctHtml=(p.customTasks||[]).map((ct,j)=>`
    <div class="st-row ${ct.done?'done':''}">
      <div class="st-check ${ct.done?'on':''}" onclick="toggleCT('${block.id}',${j},'${dayId}')">${ct.done?'✓':''}</div>
      <input class="st-text" value="${esc(ct.text)}" onchange="editCT('${block.id}',${j},this.value)">
      <button class="st-del" onclick="delCT('${block.id}',${j},'${dayId}')">✕</button>
    </div>`).join('');
  return `<div class="block-card" id="sb-${block.id}" style="border-left-color:${s.color}; box-shadow:0 4px 14px ${s.color}15">
    <div class="block-head" onclick="toggleBlock('${block.id}')">
      <div class="block-icon" style="background:${s.color}20">${s.icon}</div>
      <div class="block-info">
        <div class="block-name" style="color:${s.color}">${s.name}</div>
        <div class="block-subtitle">${pct}% · ${Math.round(tot/360)/10}/${block.targetHrs}h · ${esc(block.topic||'No topic set')}</div>
      </div>
      <div class="block-right">
        <div class="hrs-widget">
          <div style="text-align:center">
            <div class="hw-val" style="color:${s.color}" id="bhv-${block.id}">${block.targetHrs}h</div>
            <div class="hw-lbl">target</div>
          </div>
        </div>
        <div class="mini-ring">
          <svg class="mr-svg" width="36" height="36" viewBox="0 0 36 36">
            <circle class="mr-bg" cx="18" cy="18" r="15"/>
            <circle class="mr-fg" cx="18" cy="18" r="15" stroke="${s.color}"
              stroke-dasharray="${circ}" stroke-dashoffset="${offset}"/>
          </svg>
          <div class="mr-label">${pct}%</div>
        </div>
        <div class="chevron" id="chev-${block.id}">▼</div>
      </div>
    </div>
    <div class="block-timer">
      <span style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--ink3)">⏱</span>
      <div class="timer-display" id="td-${block.id}">${tStr}</div>
      <button class="timer-start ${isRun?'running':'idle'}" id="tbtn-${block.id}" onclick="toggleTimer('${block.id}','${dayId}')">${isRun?'⏸ Pause':'▶ Start'}</button>
      <div class="manual-add">
        <input class="manual-inp" type="number" id="mi-${block.id}" placeholder="min" min="1">
        <button class="manual-btn" onclick="addManTime('${block.id}','${dayId}')">+Add</button>
      </div>
      <div class="target-badge">Target: <strong>${block.targetHrs}h</strong></div>
      <div class="timer-bar-wrap"><div class="timer-bar-fill" id="tbar-${block.id}" style="background:${s.color};width:${barW}%"></div></div>
    </div>
    <div class="block-body" id="sbb-${block.id}">
      <div class="sect-label">📌 Topic</div>
      <div style="font-size:13px;color:var(--ink);padding:9px 12px;background:var(--bg2);border-radius:var(--radius-sm);margin-bottom:12px">${esc(block.topic||'No topic set')}</div>
      <div class="sect-label">📋 Sub-topics</div>
      <div class="st-list" id="stl-${block.id}">${stHtml||'<div style="font-size:12px;color:var(--ink3);padding:4px 0">No sub-topics yet.</div>'}</div>
      <div class="add-row">
        <input class="add-inp" id="nst-${block.id}" placeholder="Add sub-topic…" onkeydown="if(event.key==='Enter')addST('${dayId}','${block.id}')">
        <button class="add-btn" onclick="addST('${dayId}','${block.id}')">Add</button>
      </div>
      <div class="sect-label" style="margin-top:10px">✏️ Custom Tasks</div>
      <div class="st-list">${ctHtml||'<div style="font-size:12px;color:var(--ink3);padding:4px 0">No tasks yet.</div>'}</div>
      <div class="add-row">
        <input class="add-inp" id="nct-${block.id}" placeholder="Add custom task…" onkeydown="if(event.key==='Enter')addCT('${block.id}','${dayId}')">
        <button class="add-btn" onclick="addCT('${block.id}','${dayId}')">Add</button>
      </div>
      <div class="sect-label" style="margin-top:10px">📝 Notes</div>
      <textarea class="notes-area" placeholder="Key points, doubts, next steps…" onblur="gp('${block.id}').notes=this.value;sp()">${esc(p.notes||'')}</textarea>
    </div>
  </div>`;
}

function buildBlock(dayId,block,bi){
  const s=sj(block.subjectId);
  const p=gp(block.id);
  const pct=bPct(block.id,block.subtopics);
  const circ=2*Math.PI*15;
  const offset=circ-(pct/100)*circ;
  const sec=p.timeSpent||0;
  const extra=timers[block.id]?.running?Math.floor((Date.now()-timers[block.id].start)/1000):0;
  const tot=sec+extra;
  const th=Math.floor(tot/3600),tm=Math.floor((tot%3600)/60),ts=tot%60;
  const tStr=`${String(th).padStart(2,'0')}:${String(tm).padStart(2,'0')}:${String(ts).padStart(2,'0')}`;
  const isRun=!!timers[block.id]?.running;
  const barW=Math.min((tot/3600/block.targetHrs)*100,100);
  const stHtml=block.subtopics.map((st,j)=>{
    const done=!!p.subtopics[j];
    return `<div class="st-row ${done?'done':''}">
      <div class="st-check ${done?'on':''}" onclick="toggleST('${block.id}',${j},'${dayId}')">${done?'✓':''}</div>
      <input class="st-text" value="${esc(st)}" onchange="editST('${dayId}','${block.id}',${j},this.value)">
      <button class="st-del" onclick="delST('${dayId}','${block.id}',${j})">✕</button>
    </div>`;
  }).join('');
  const ctHtml=(p.customTasks||[]).map((ct,j)=>`
    <div class="st-row ${ct.done?'done':''}">
      <div class="st-check ${ct.done?'on':''}" onclick="toggleCT('${block.id}',${j},'${dayId}')">${ct.done?'✓':''}</div>
      <input class="st-text" value="${esc(ct.text)}" onchange="editCT('${block.id}',${j},this.value)">
      <button class="st-del" onclick="delCT('${block.id}',${j},'${dayId}')">✕</button>
    </div>`).join('');
  return `<div class="block-card" id="sb-${block.id}" style="border-left-color:${s.color}; box-shadow:0 4px 14px ${s.color}15">
    <div class="block-head" onclick="toggleBlock('${block.id}')">
      <div class="block-icon" style="background:${s.color}20">${s.icon}</div>
      <div class="block-info">
        <div class="block-name" style="color:${s.color}">${s.name}</div>
        <div class="block-subtitle">${pct}% · ${Math.round(tot/360)/10}/${block.targetHrs}h · ${esc(block.topic||'No topic set')}</div>
      </div>
      <div class="block-right">
        <div class="hrs-widget">
          <button class="ctrl-btn" onclick="event.stopPropagation();chBlkHrs('${dayId}','${block.id}',-0.5)">−</button>
          <div style="text-align:center">
            <div class="hw-val" style="color:${s.color}" id="bhv-${block.id}">${block.targetHrs}h</div>
            <div class="hw-lbl">target</div>
          </div>
          <button class="ctrl-btn" onclick="event.stopPropagation();chBlkHrs('${dayId}','${block.id}',0.5)">+</button>
        </div>
        <div class="mini-ring">
          <svg class="mr-svg" width="36" height="36" viewBox="0 0 36 36">
            <circle class="mr-bg" cx="18" cy="18" r="15"/>
            <circle class="mr-fg" cx="18" cy="18" r="15" stroke="${s.color}"
              stroke-dasharray="${circ}" stroke-dashoffset="${offset}"/>
          </svg>
          <div class="mr-label">${pct}%</div>
        </div>
        <div class="chevron" id="chev-${block.id}">▼</div>
      </div>
    </div>
    <div class="block-timer">
      <span style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--ink3)">⏱</span>
      <div class="timer-display" id="td-${block.id}">${tStr}</div>
      <button class="timer-start ${isRun?'running':'idle'}" id="tbtn-${block.id}" onclick="toggleTimer('${block.id}','${dayId}')">${isRun?'⏸ Pause':'▶ Start'}</button>
      <div class="manual-add">
        <input class="manual-inp" type="number" id="mi-${block.id}" placeholder="min" min="1">
        <button class="manual-btn" onclick="addManTime('${block.id}','${dayId}')">+Add</button>
      </div>
      <div class="target-badge">Target: <strong>${block.targetHrs}h</strong></div>
      <div class="timer-bar-wrap"><div class="timer-bar-fill" id="tbar-${block.id}" style="background:${s.color};width:${barW}%"></div></div>
    </div>
    <div class="block-body" id="sbb-${block.id}">
      <div class="sect-subj-sel">
        <select class="subj-sel" onchange="chBlkSubj('${dayId}','${block.id}',this.value)">
          ${subj.map(sx=>`<option value="${sx.id}"${sx.id===block.subjectId?' selected':''}>${sx.icon} ${sx.name}</option>`).join('')}
        </select>
      </div>
      <div class="sect-label">📌 Topic <button class="sl-btn" onclick="markAll('${block.id}','${dayId}')">Mark All ✓</button></div>
      <input class="topic-inp" value="${esc(block.topic||'')}" placeholder="Today's topic…" onchange="chBlkTopic('${dayId}','${block.id}',this.value)">
      <div class="sect-label">📋 Sub-topics</div>
      <div class="st-list" id="stl-${block.id}">${stHtml||'<div style="font-size:12px;color:var(--ink3);padding:4px 0">No sub-topics yet.</div>'}</div>
      <div class="add-row">
        <input class="add-inp" id="nst-${block.id}" placeholder="Add sub-topic…" onkeydown="if(event.key==='Enter')addST('${dayId}','${block.id}')">
        <button class="add-btn" onclick="addST('${dayId}','${block.id}')">Add</button>
      </div>
      <div class="sect-label">✏️ Custom Tasks</div>
      <div class="st-list">${ctHtml||'<div style="font-size:12px;color:var(--ink3);padding:4px 0">No tasks yet.</div>'}</div>
      <div class="add-row">
        <input class="add-inp" id="nct-${block.id}" placeholder="Add custom task…" onkeydown="if(event.key==='Enter')addCT('${block.id}','${dayId}')">
        <button class="add-btn" onclick="addCT('${block.id}','${dayId}')">Add</button>
      </div>
      <div class="sect-label" style="margin-top:10px">📝 Notes</div>
      <textarea class="notes-area" placeholder="Key points, doubts, next steps…" onblur="gp('${block.id}').notes=this.value;sp()">${esc(p.notes||'')}</textarea>
    </div>
  </div>`;
}

function toggleBlock(bid){
  document.getElementById('sbb-'+bid)?.classList.toggle('open');
  document.getElementById('chev-'+bid)?.classList.toggle('open');
}
function jumpTo(i){stopAllTimers();curDay=i;renderDaily();renderStats();window.scrollTo({top:0,behavior:'smooth'});}

/* Day edits */
function saveDayDate(id,v){const d=days.find(x=>x.id===id);if(d)d.dateOverride=v?new Date(v).toISOString():null;sd();renderNavLabel();renderDots();}
function changeTgt(id,delta){const d=days.find(x=>x.id===id);if(!d)return;d.targetHrs=+(Math.max(1,Math.min(16,(d.targetHrs||9)+delta)).toFixed(1));sd();const el=document.getElementById('tgt-'+id);if(el)el.textContent=d.targetHrs+'h';renderHoursBar();renderStats();}

/* Block edits */
function chBlkHrs(dayId,bid,delta){
  const d=days.find(x=>x.id===dayId),b=d?.blocks.find(x=>x.id===bid);if(!b)return;
  b.targetHrs=+(Math.max(.5,Math.min(12,b.targetHrs+delta)).toFixed(1));sd();
  refreshAllViews();
}
function chBlkSubj(dayId,bid,sid){const d=days.find(x=>x.id===dayId),b=d?.blocks.find(x=>x.id===bid);if(b){b.subjectId=sid;sd();}refreshAllViews();}
function chBlkTopic(dayId,bid,v){const d=days.find(x=>x.id===dayId),b=d?.blocks.find(x=>x.id===bid);if(b){b.topic=v.trim();sd();}refreshAllViews();}
function delBlock(dayId,bid){if(!confirm('Remove this subject block?'))return;const d=days.find(x=>x.id===dayId);if(!d)return;d.blocks=d.blocks.filter(b=>b.id!==bid);delete prog[bid];sd();sp();refreshAllViews();}
function markAll(bid,dayId){const d=days.find(x=>x.id===dayId),b=d?.blocks.find(x=>x.id===bid);if(!b)return;b.subtopics.forEach((_,j)=>gp(bid).subtopics[j]=true);sp();refreshAllViews();}

/* Subtopics */
function toggleST(bid,j,dayId){const p=gp(bid);p.subtopics[j]=!p.subtopics[j];sp();refreshAllViews();}
function editST(dayId,bid,j,v){const d=days.find(x=>x.id===dayId),b=d?.blocks.find(x=>x.id===bid);if(b){b.subtopics[j]=v;sd();}refreshAllViews();}
function delST(dayId,bid,j){
  const d=days.find(x=>x.id===dayId),b=d?.blocks.find(x=>x.id===bid);if(!b)return;
  b.subtopics.splice(j,1);const p=gp(bid);
  const ns={};Object.keys(p.subtopics).forEach(k=>{const ki=+k;if(ki<j)ns[ki]=p.subtopics[ki];else if(ki>j)ns[ki-1]=p.subtopics[ki];});
  p.subtopics=ns;sd();sp();refreshAllViews();
}
function addST(dayId,bid){
  const inp=document.getElementById('nst-'+bid);const txt=inp?.value?.trim();if(!txt)return;
  const d=days.find(x=>x.id===dayId),b=d?.blocks.find(x=>x.id===bid);if(!b)return;
  b.subtopics.push(txt);inp.value='';sd();refreshAllViews();
}
/* Custom tasks */
function toggleCT(bid,j,dayId){const p=gp(bid);p.customTasks[j].done=!p.customTasks[j].done;sp();refreshAllViews();}
function editCT(bid,j,v){gp(bid).customTasks[j].text=v;sp();refreshAllViews();}
function delCT(bid,j,dayId){gp(bid).customTasks.splice(j,1);sp();refreshAllViews();}
function addCT(bid,dayId){const inp=document.getElementById('nct-'+bid);const txt=inp?.value?.trim();if(!txt)return;gp(bid).customTasks.push({text:txt,done:false});inp.value='';sp();refreshAllViews();}

function refreshBlock(dayId,bid){
  const d=days.find(x=>x.id===dayId);if(!d)return;
  const bi=d.blocks.findIndex(x=>x.id===bid);if(bi<0)return;
  const wrap=document.getElementById('sb-'+bid);if(!wrap)return;
  const wasOpen=document.getElementById('sbb-'+bid)?.classList.contains('open');
  wrap.outerHTML=buildBlock(dayId,d.blocks[bi],bi);
  if(wasOpen){document.getElementById('sbb-'+bid)?.classList.add('open');document.getElementById('chev-'+bid)?.classList.add('open');}
  renderHoursBar();
}

/* Timer */
function toggleTimer(bid,dayId){
  if(timers[bid]?.running){
    const el=Math.floor((Date.now()-timers[bid].start)/1000);
    clearInterval(timers[bid].interval);
    gp(bid).timeSpent=(gp(bid).timeSpent||0)+el;
    timers[bid]={running:false};sp();
    localStorage.removeItem('_runningTimer'); // clear on manual pause
    try{pushGroupTimerState(null);}catch{}
    refreshBlock(dayId,bid);renderStats();renderHoursBar();
  } else {
    // stop any other running timer first
    Object.keys(timers).forEach(id=>{
      if(id!==bid&&timers[id]?.running){
        const el=Math.floor((Date.now()-timers[id].start)/1000);
        clearInterval(timers[id].interval);
        gp(id).timeSpent=(gp(id).timeSpent||0)+el;
        timers[id]={running:false};
        const otherDay = days.find(d => d.blocks.some(b => b.id === id));
        if (otherDay) { refreshBlock(otherDay.id, id); }
      }
    });
    timers[bid]={running:true,start:Date.now(),interval:null,ticks:0};
    // Save absolute start so page refresh can resume without beforeunload
    localStorage.setItem('_runningTimer',JSON.stringify({bid,start:timers[bid].start,base:gp(bid).timeSpent||0}));
    try{pushGroupTimerState(bid);}catch{}
    const d=days.find(x=>x.id===dayId),b=d?.blocks.find(x=>x.id===bid);
    timers[bid].interval=setInterval(()=>{
      const ex=Math.floor((Date.now()-timers[bid].start)/1000);
      const tot=(gp(bid).timeSpent||0)+ex;
      const th=Math.floor(tot/3600),tm=Math.floor((tot%3600)/60),ts=tot%60;
      const el=document.getElementById('td-'+bid);
      if(el)el.textContent=`${String(th).padStart(2,'0')}:${String(tm).padStart(2,'0')}:${String(ts).padStart(2,'0')}`;
      if(b){const w=Math.min((tot/3600/b.targetHrs)*100,100);const tbar=document.getElementById('tbar-'+bid);if(tbar)tbar.style.width=w+'%';}
      renderStats();renderHoursBar();
      // Sync to server every 30 seconds while timer is running
      timers[bid].ticks=(timers[bid].ticks||0)+1;
      if(timers[bid].ticks%5===0){
        try{pushGroupTimerState(bid);}catch{}
      }
      if(timers[bid].ticks%30===0){
        const snapSecs=Math.floor((Date.now()-timers[bid].start)/1000);
        const snapProg=JSON.parse(JSON.stringify(prog));
        if(!snapProg[bid])snapProg[bid]={subtopics:{},customTasks:[],notes:'',timeSpent:0};
        snapProg[bid].timeSpent=(snapProg[bid].timeSpent||0)+snapSecs;
        fetch('/api/student/study-tracker',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({subj,days,prog:snapProg,conf})}).catch(()=>{});
      }
    },1000);
    const btn=document.getElementById('tbtn-'+bid);if(btn){btn.textContent='⏸ Pause';btn.className='timer-start running';}
  }
}
function stopAllTimers(){
  Object.keys(timers).forEach(bid=>{
    if(timers[bid]?.running){
      clearInterval(timers[bid].interval);
      const el=Math.floor((Date.now()-timers[bid].start)/1000);
      gp(bid).timeSpent=(gp(bid).timeSpent||0)+el;
      timers[bid]={running:false};
      const day = days.find(d => d.blocks.some(b => b.id === bid));
      if (day) { refreshBlock(day.id, bid); }
    }
  });
  localStorage.removeItem('_runningTimer');
  try{pushGroupTimerState(null);}catch{}
  sp();
}
function addManTime(bid,dayId){
  const inp=document.getElementById('mi-'+bid);const m=parseInt(inp?.value)||0;if(m<=0)return;
  gp(bid).timeSpent=(gp(bid).timeSpent||0)+m*60;inp.value='';sp();refreshBlock(dayId,bid);renderStats();renderHoursBar();
}

/* ══════════════════════════════════════════
   SYLLABUS VIEW
══════════════════════════════════════════ */
function renderSyllabus(){
  let html='';
  html+=`<div class="syl-subj-mgmt">

    <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;">
      <div>
        <div style="font-size:13px;font-weight:800;color:var(--ink);margin-bottom:6px">Subject Management</div>
        <div style="font-size:12px;color:var(--ink3)">Add / Delete subjects (affects plan blocks)</div>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <input id="addSylSubjName" placeholder="Subject name" style="padding:6px 8px;background:var(--bg);color:var(--ink);border:1px solid var(--border);border-radius:6px;outline:none;font-size:12px;min-width:180px" />
        <input id="addSylSubjHrs" type="number" placeholder="Default hrs" min="0.5" step="0.5" value="3" style="padding:6px 8px;background:var(--bg);color:var(--ink);border:1px solid var(--border);border-radius:6px;outline:none;font-size:12px;width:110px" />
        <select id="addSylSubjIcon" style="padding:6px 8px;background:var(--bg);color:var(--ink);border:1px solid var(--border);border-radius:6px;outline:none;font-size:12px;width:130px">
          ${ICONS.map(ic=>`<option value="${ic}">${ic}</option>`).join('')}
        </select>
        <select id="addSylSubjColor" style="padding:6px 8px;background:var(--bg);color:var(--ink);border:1px solid var(--border);border-radius:6px;outline:none;font-size:12px;width:170px">
          ${COLORS.map(c=>`<option value="${c}">${COLOR_NAMES[c]||c}</option>`).join('')}
        </select>
        <button class="add-btn" onclick="addSylSubject()" style="padding:7px 10px;background:var(--green);color:#fff;border:none;border-radius:6px;font-size:12px;cursor:pointer;font-weight:800">+ Add Subject</button>
      </div>
    </div>
    <div style="margin-top:12px;display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px;">
      ${subj.map((s, idx)=>`
        <div style="display:flex;flex-direction:column;gap:8px;padding:12px;background:var(--bg);border:1px solid var(--border);border-radius:8px;">
          <!-- Line 1: Icon, Name and Hours -->
          <div style="display:flex;align-items:center;gap:8px;">
            <div style="width:24px;height:24px;border-radius:5px;background:${s.color}20;display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;">${s.icon}</div>
            <div style="flex:1;min-width:0;font-size:13px;font-weight:800;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(s.name)}</div>
            <div style="font-size:11px;color:var(--ink3);flex-shrink:0;">${s.defaultHrs}h default</div>
          </div>
          <!-- Line 2: Actions -->
          <div style="display:flex;align-items:center;justify-content:space-between;border-top:1px solid var(--border);padding-top:8px;margin-top:2px;">
            <div style="display:flex;gap:3px;align-items:center;">
              <button onclick="moveSylSubject('${s.id}',-1)" style="width:20px;height:20px;background:var(--bg2);color:var(--ink);border:none;border-radius:4px;font-size:9px;cursor:pointer;display:flex;align-items:center;justify-content:center;" title="Move Left">◀</button>
              <button onclick="moveSylSubject('${s.id}',1)" style="width:20px;height:20px;background:var(--bg2);color:var(--ink);border:none;border-radius:4px;font-size:9px;cursor:pointer;display:flex;align-items:center;justify-content:center;" title="Move Right">▶</button>
            </div>
            <div style="display:flex;gap:4px;align-items:center;">
              <button onclick="openSubjModal('${s.id}')" style="padding:4px 8px;background:var(--blue);color:#fff;border:none;border-radius:4px;font-size:10px;cursor:pointer;font-weight:800;">Edit</button>
              <button onclick="delSylSubject('${s.id}')" style="padding:4px 8px;background:#f44336;color:#fff;border:none;border-radius:4px;font-size:10px;cursor:pointer;font-weight:800;">Delete</button>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  </div>`;
  subj.forEach((s,si)=>{
    const blocks=[];
    days.forEach(d=>d.blocks.filter(b=>b.subjectId===s.id).forEach(b=>blocks.push({...b,dayId:d.id,dayIdx:days.indexOf(d)})));
    const stT=blocks.reduce((a,b)=>a+b.subtopics.length+(gp(b.id).customTasks?.length||0),0);
    const stD=blocks.reduce((a,b)=>{const p=gp(b.id);return a+b.subtopics.filter((_,j)=>p.subtopics[j]).length+(p.customTasks||[]).filter(t=>t.done).length;},0);
    const pct=stT?Math.round(stD/stT*100):0;
    html+=`<div class="syl-card" style="animation-delay:${si*.04}s">
      <div class="syl-head">
        <div class="syl-icon" style="background:${s.color}20">${s.icon}</div>
        <div class="syl-name">${esc(s.name)}</div>
        <div class="syl-pct" style="color:${s.color}">${pct}%</div>
      </div>
      <div class="syl-prog"><div class="syl-prog-fill" style="background:${s.color};width:${pct}%"></div></div>
      <div class="syl-body">
        ${blocks.length ? blocks.map(b=>{
          const p=gp(b.id);
          const bD=b.subtopics.filter((_,j)=>p.subtopics[j]).length+(p.customTasks||[]).filter(t=>t.done).length;
          const bT=b.subtopics.length+(p.customTasks?.length||0);
          const full=bD===bT&&bT>0,part=bD>0&&!full;
          const stRows=[
            ...b.subtopics.map((st,j)=>{const done=!!p.subtopics[j];return `<div class="syl-st" style="display:flex;align-items:center;gap:6px;"><div class="syl-stck${done?' on':''}" onclick="toggleST('${b.id}',${j},'${b.dayId}')">${done?'✓':''}</div><input class="syl-st-inp" value="${esc(st)}" onclick="event.stopPropagation()" onchange="editSylSt('${b.dayId}','${b.id}',${j},this.value)" style="flex:1;" /><div style="display:flex;align-items:center;gap:2px;"><button onclick="event.stopPropagation();moveSylSubtopic('${b.dayId}','${b.id}',${j},-1)" style="width:18px;height:18px;border-radius:3px;border:1px solid var(--border);background:var(--card);color:var(--ink3);cursor:pointer;font-size:7px;display:flex;align-items:center;justify-content:center;" title="Move Up">▲</button><button onclick="event.stopPropagation();moveSylSubtopic('${b.dayId}','${b.id}',${j},1)" style="width:18px;height:18px;border-radius:3px;border:1px solid var(--border);background:var(--card);color:var(--ink3);cursor:pointer;font-size:7px;display:flex;align-items:center;justify-content:center;" title="Move Down">▼</button></div><button onclick="event.stopPropagation();delSylSt('${b.dayId}','${b.id}',${j})" class="syl-del-btn">✕</button></div>`;}),
            ...(p.customTasks||[]).map((ct,j)=>`<div class="syl-st" style="display:flex;align-items:center;gap:6px;"><div class="syl-stck${ct.done?' on':''}" onclick="toggleCT('${b.id}',${j},'${b.dayId}')">${ct.done?'✓':''}</div><span style="padding:0 4px">★</span><input class="syl-st-inp" value="${esc(ct.text)}" onclick="event.stopPropagation()" onchange="editSylCt('${b.dayId}','${b.id}',${j},this.value)" style="flex:1;" /><button onclick="event.stopPropagation();delSylCt('${b.dayId}','${b.id}',${j})" class="syl-del-btn">✕</button></div>`)
          ].join('');
          const isOpen = window.expandedTopics && window.expandedTopics.has(b.id);
          return `<div class="syl-day${isOpen ? ' open' : ''}" onclick="sylToggle(this,'${b.id}')">
            <div class="syl-day-row">
              <span class="syl-arr" style="margin-right:2px;">▶</span>
              <div class="syl-ck${full?' full':part?' part':''}">${full?'✓':part?'~':''}</div>
              <input class="syl-topic-inp" value="${esc(b.topic||'')}" onclick="event.stopPropagation()" onchange="editSylTopic('${b.dayId}','${b.id}',this.value)" placeholder="Topic…" style="flex:1;" />
              <span class="syl-day-meta">${bD}/${bT}</span>
              <div style="display:flex;align-items:center;gap:2px;margin-left:8px;flex-shrink:0;">
                <button onclick="event.stopPropagation();moveSylTopic('${s.id}','${b.id}',-1)" style="width:20px;height:20px;border-radius:4px;border:1px solid var(--border);background:var(--card);color:var(--ink2);cursor:pointer;font-size:8px;display:flex;align-items:center;justify-content:center;" title="Move Up">▲</button>
                <button onclick="event.stopPropagation();moveSylTopic('${s.id}','${b.id}',1)" style="width:20px;height:20px;border-radius:4px;border:1px solid var(--border);background:var(--card);color:var(--ink2);cursor:pointer;font-size:8px;display:flex;align-items:center;justify-content:center;" title="Move Down">▼</button>
              </div>
            </div>
          </div>
          <div class="syl-sts${isOpen ? ' open' : ''}" id="sst-${b.id}">${stRows}<div style="padding:6px;display:flex;gap:5px"><input id="sylst-${b.id}" class="syl-st-inp" placeholder="Add subtopic…" style="font-size:11px" /><button onclick="addSylSt('${b.dayId}','${b.id}')" class="syl-add-btn">Add</button></div></div>`;
        }).join('') : `<div style="padding: 24px 16px; text-align: center; color: var(--ink3); background: var(--bg2); display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 120px; gap: 8px; border-radius: 8px; margin-bottom: 8px;">
          <div style="font-size: 24px;">📅</div>
          <div style="font-weight: 700; font-size: 12px; color: var(--ink2);">No topics scheduled yet</div>
        </div>`}
        
        <div style="padding: 10px; border-top: 1px dashed var(--border); display: flex; flex-direction: column; gap: 8px; margin-top: 8px;">
          <div style="font-size: 10px; font-weight: 700; color: var(--ink3); text-transform: uppercase; letter-spacing: 0.05em;">＋ Add New Topic to Plan</div>
          <div style="display: flex; gap: 4px; flex-wrap: wrap;">
            <input id="sylAddTopicName-${s.id}" placeholder="Topic (e.g. Chapter 1)" style="padding: 5px 8px; border-radius: 6px; border: 1px solid var(--border); background: var(--bg); color: var(--ink); font-size: 11px; flex: 2; min-width: 140px; outline: none;" />
            <button onclick="addTopicToDay('${s.id}')" style="padding: 5px 12px; background: var(--blue); color: #fff; border: none; border-radius: 6px; font-size: 11px; font-weight: bold; cursor: pointer; transition: opacity 0.15s;" onmouseover="this.style.opacity=0.9" onmouseout="this.style.opacity=1">Add</button>
          </div>
        </div>
      </div>
    </div>`;
  });
  document.getElementById('sylGrid').innerHTML=html||'<div class="empty-state"><div class="es-icon">📚</div><p>No subjects yet.</p></div>';
}
function sylToggle(el,bid){
  if (!window.expandedTopics) window.expandedTopics = new Set();
  const isOpen = el.classList.toggle('open');
  document.getElementById('sst-'+bid)?.classList.toggle('open', isOpen);
  if (isOpen) {
    window.expandedTopics.add(bid);
  } else {
    window.expandedTopics.delete(bid);
  }
}

/* Syllabus subject add/delete */
function addSylSubject(){
  const name=(document.getElementById('addSylSubjName')?.value||'').trim();
  const hrs=parseFloat(document.getElementById('addSylSubjHrs')?.value||'3');
  const icon=document.getElementById('addSylSubjIcon')?.value||ICONS[0];
  const color=document.getElementById('addSylSubjColor')?.value||COLORS[0];
  if(!name){alert('Enter subject name');return;}
  const newId='s'+Date.now();
  subj.push({id:newId,name,color,icon,defaultHrs:isNaN(hrs)||hrs<=0?3:hrs});
  sd();
  renderSyllabus();
  renderManage();
  renderAll();
}

function delSylSubject(sid){
  const cnt=days.reduce((c,d)=>c+d.blocks.filter(b=>b.subjectId===sid).length,0);
  if(cnt>0&&!confirm(`Delete subject? ${cnt} block(s) will be removed.`))return;
  subj=subj.filter(s=>s.id!==sid);
  days.forEach(d=>{d.blocks=d.blocks.filter(b=>b.subjectId!==sid)});
  sd();
  renderSyllabus();
  renderManage();
  renderDaily();
  renderStats();
}

function addTopicToDay(sid){
  const nameInput=document.getElementById(`sylAddTopicName-${sid}`);
  const topicName=nameInput?.value?.trim();
  if(!topicName){alert('Please enter a topic name.');return;}
  const s=subj.find(x=>x.id===sid);
  if(!s)return;
  const newBlock={
    id:'b'+Date.now()+Math.random().toString(36).slice(2,5),
    subjectId:sid,
    targetHrs:s.defaultHrs||3,
    topic:topicName,
    subtopics:[]
  };
  if(days.length===0){
    const newDay={
      id:'d'+Date.now(),
      title:'Day 1',
      dateOverride:null,
      targetHrs:8,
      blocks:[newBlock]
    };
    days.push(newDay);
  }else{
    days[0].blocks.push(newBlock);
  }
  
  if(!window.expandedTopics) window.expandedTopics=new Set();
  window.expandedTopics.add(newBlock.id);

  sd();
  renderSyllabus();
  renderManage();
  renderDots();
  renderNavLabel();
}

function toggleSyllabusModeView(val) {
  const btn = document.getElementById('loadSyllabusBtn');
  if (!btn) return;
  if (val === 'custom') {
    btn.textContent = 'Create New Syllabus/Time Table';
    btn.style.background = 'var(--green)';
    btn.style.borderColor = 'var(--green)';
  } else {
    btn.textContent = 'Load Exam Syllabus';
    btn.style.background = 'var(--blue)';
    btn.style.borderColor = 'var(--blue)';
  }
}

async function loadSyllabusTemplates() {
  try {
    const res = await fetch("/tracker/premade-syllabi.json");
    if (res.ok) {
      PREMADE_SYLLABI = await res.json();
      rebuildSyllabusDropdown();
    }
  } catch (err) {
    console.error("Error loading syllabus templates:", err);
  }
}

function rebuildSyllabusDropdown() {
  const select = document.getElementById('sylModeSelect');
  if (!select) return;
  
  select.innerHTML = '<option value="custom">🛠️ Create My Own Syllabus</option>';
  for (const key in PREMADE_SYLLABI) {
    const option = document.createElement('option');
    option.value = key;
    option.textContent = `📚 ${PREMADE_SYLLABI[key].examName}`;
    select.appendChild(option);
  }
  
  select.value = conf.syllabusType || 'custom';
  toggleSyllabusModeView(select.value);
}

function handleSyllabusLoadAction() {
  const val = document.getElementById('sylModeSelect')?.value || 'custom';
  if (val === 'custom') {
    loadCustomSyllabusDefaults();
  } else {
    loadSelectedPremadeSyllabus(val);
  }
}

function loadCustomSyllabusDefaults() {
  const confirmMsg = "Warning: Resetting to custom syllabus defaults will completely clear your current subjects, study day schedules, and checklist progress.\n\nDo you wish to proceed?";
  if (!confirm(confirmMsg)) return;

  subj = JSON.parse(JSON.stringify(DEF_SUBJ));
  days = JSON.parse(JSON.stringify(DEF_DAYS));
  prog = {};
  stopAllTimers();
  timers = {};
  
  conf.examName = "My Study Plan";
  conf.startDate = new Date().toISOString();
  conf.syllabusType = "custom";
  
  sd();
  curDay = 0;
  
  const examNameInp = document.getElementById('targetExamName');
  if (examNameInp) examNameInp.value = conf.examName;
  updateDaysRemaining();
  
  renderAll();
  renderSyllabus();
  renderManage();
  renderDots();
  renderNavLabel();
  
  alert('Custom syllabus defaults loaded successfully!');
}

function loadSelectedPremadeSyllabus(templateKey) {
  if (!templateKey || !PREMADE_SYLLABI[templateKey]) {
    alert('Please select a valid exam syllabus template.');
    return;
  }
  
  const template = PREMADE_SYLLABI[templateKey];
  const confirmMsg = `Warning: Loading the "${template.examName}" syllabus will completely reset your current subjects, study day schedules, and checklist progress.\n\nDo you wish to proceed?`;
  if (!confirm(confirmMsg)) {
    const selectEl = document.getElementById('sylModeSelect');
    if (selectEl) {
      selectEl.value = conf.syllabusType || 'custom';
      toggleSyllabusModeView(selectEl.value);
    }
    return;
  }

  // Overwrite subjects and days
  subj = JSON.parse(JSON.stringify(template.subj));
  days = JSON.parse(JSON.stringify(template.days));
  
  // Reset progress and timers
  prog = {};
  stopAllTimers();
  timers = {};
  
  // Set default configurations
  conf.examName = template.examName;
  conf.startDate = new Date().toISOString();
  conf.syllabusType = templateKey;
  
  // Save to localStorage and API
  sd();
  
  // Reset current day back to first day
  curDay = 0;
  
  // Update name and date in the Manage panel UI
  const examNameInp = document.getElementById('targetExamName');
  if (examNameInp) examNameInp.value = conf.examName;
  updateDaysRemaining();
  
  // Refresh views
  renderAll();
  renderSyllabus();
  renderManage();
  renderDots();
  renderNavLabel();
  
  alert(`"${template.examName}" syllabus loaded successfully!`);
}

/* Arrange / Reorder items functions */
function moveSylSubject(sid, dir) {
  const idx = subj.findIndex(s => s.id === sid);
  const targetIdx = idx + dir;
  if (targetIdx < 0 || targetIdx >= subj.length) return;

  const temp = subj[idx];
  subj[idx] = subj[targetIdx];
  subj[targetIdx] = temp;

  sd();
  renderSyllabus();
  renderManage();
  renderAll();
}

function moveSylTopic(sid, bid, dir) {
  const list = [];
  days.forEach(d => {
    d.blocks.forEach((b, bIdx) => {
      if (b.subjectId === sid) {
        list.push({ dayId: d.id, blockIdx: bIdx, block: b });
      }
    });
  });

  const idx = list.findIndex(x => x.block.id === bid);
  const targetIdx = idx + dir;
  if (targetIdx < 0 || targetIdx >= list.length) return;

  const currItem = list[idx];
  const targItem = list[targetIdx];

  const currDay = days.find(d => d.id === currItem.dayId);
  const targDay = days.find(d => d.id === targItem.dayId);
  if (!currDay || !targDay) return;

  const currBlock = currDay.blocks[currItem.blockIdx];
  const targBlock = targDay.blocks[targItem.blockIdx];

  const temp = {
    id: currBlock.id,
    topic: currBlock.topic,
    subtopics: currBlock.subtopics,
    customTasks: currBlock.customTasks
  };

  currBlock.id = targBlock.id;
  currBlock.topic = targBlock.topic;
  currBlock.subtopics = targBlock.subtopics;
  currBlock.customTasks = targBlock.customTasks;

  targBlock.id = temp.id;
  targBlock.topic = temp.topic;
  targBlock.subtopics = temp.subtopics;
  targBlock.customTasks = temp.customTasks;

  const tempProg = prog[currBlock.id] || {};
  prog[currBlock.id] = prog[targBlock.id] || {};
  prog[targBlock.id] = tempProg;

  if (window.expandedTopics) {
    const currOpen = window.expandedTopics.has(currBlock.id);
    const targOpen = window.expandedTopics.has(targBlock.id);
    
    if (currOpen) window.expandedTopics.add(targBlock.id);
    else window.expandedTopics.delete(targBlock.id);
    
    if (targOpen) window.expandedTopics.add(currBlock.id);
    else window.expandedTopics.delete(currBlock.id);
  }

  sd();
  sp();
  refreshAllViews();
}

function moveSylSubtopic(dayId, blockId, idx, dir) {
  const day = days.find(d => d.id === dayId);
  if (!day) return;
  const block = day.blocks.find(b => b.id === blockId);
  if (!block) return;

  const targetIdx = idx + dir;
  if (targetIdx < 0 || targetIdx >= block.subtopics.length) return;

  const temp = block.subtopics[idx];
  block.subtopics[idx] = block.subtopics[targetIdx];
  block.subtopics[targetIdx] = temp;

  const p = gp(blockId);
  const tempDone = p.subtopics[idx] || false;
  p.subtopics[idx] = p.subtopics[targetIdx] || false;
  p.subtopics[targetIdx] = tempDone;

  sd();
  sp();
  refreshAllViews();
}

/* Syllabus editing functions */
function editSylTopic(dayId,blockId,newTopic){
  const day=days.find(d=>d.id===dayId);
  if(day){
    const block=day.blocks.find(b=>b.id===blockId);
    if(block){
      block.topic=newTopic.trim();
      sd();
      refreshAllViews();
    }
  }
}

function editSylSt(dayId,blockId,idx,newText){
  const day=days.find(d=>d.id===dayId);
  if(day){
    const block=day.blocks.find(b=>b.id===blockId);
    if(block){
      block.subtopics[idx]=newText.trim();
      sd();
      refreshAllViews();
    }
  }
}

function delSylSt(dayId,blockId,idx){
  if(confirm('Delete this subtopic?')){
    const day=days.find(d=>d.id===dayId);
    if(day){
      const block=day.blocks.find(b=>b.id===blockId);
      if(block){
        block.subtopics.splice(idx,1);
        delete gp(blockId).subtopics[idx];
        sd();sp();refreshAllViews();
      }
    }
  }
}

// Add Syllabus subtopic
function addSylSt(dayId,blockId){
  const inp=document.getElementById('sylst-'+blockId);
  const txt=inp?.value?.trim();
  if(!txt)return;
  const day=days.find(d=>d.id===dayId);
  if(day){
    const block=day.blocks.find(b=>b.id===blockId);
    if(block){
      block.subtopics.push(txt);
      inp.value='';
      sd();refreshAllViews();
    }
  }
}

function editSylCt(dayId,blockId,idx,newText){
  const day=days.find(d=>d.id===dayId);
  if(day){
    const block=day.blocks.find(b=>b.id===blockId);
    if(block&&block.customTasks){
      block.customTasks[idx].text=newText.trim();
      sd();
      refreshAllViews();
    }
  }
}

function delSylCt(dayId,blockId,idx){
  if(confirm('Delete this task?')){
    const day=days.find(d=>d.id===dayId);
    if(day){
      const block=day.blocks.find(b=>b.id===blockId);
      if(block&&block.customTasks){
        block.customTasks.splice(idx,1);
        sd();sp();refreshAllViews();
      }
    }
  }
}

/* ══════════════════════════════════════════
   MANAGE VIEW
══════════════════════════════════════════ */
function renderManage(){
  const isFirstTime = subj.some(s => ['subject 1', 'subject 2', 'subject 3'].includes(s.name.toLowerCase()));
  const alertEl = document.getElementById('subjSuggestionAlert');
  if (alertEl) {
    alertEl.style.display = isFirstTime ? 'block' : 'none';
  }

  document.getElementById('subjListEl').innerHTML=subj.map(s=>`
    <div class="subj-row" onclick="openSubjModal('${s.id}')">
      <div class="sdot" style="background:${s.color}"></div>
      <span style="font-size:15px">${s.icon}</span>
      <span class="srow-name">${esc(s.name)}</span>
      <span class="srow-meta">${s.defaultHrs}h</span>
    </div>`).join('')||'<div style="padding:14px;font-size:13px;color:var(--ink3)">No subjects.</div>';
  renderDayListM();populateDFilter();
}
function renderDayListM(){
  const search=(document.getElementById('dSearch')?.value||'').toLowerCase();
  const fs=document.getElementById('dFilter')?.value||'';
  let list=days.map((d,i)=>({...d,i}));
  if(fs)list=list.filter(d=>d.blocks.some(b=>b.subjectId===fs));
  if(search)list=list.filter(d=>(d.title||d.blocks.map(b=>b.topic).join(' ')).toLowerCase().includes(search));
  
  const container = document.getElementById('dayListEl');
  if(!container) return;
  
  if(!list.length){container.innerHTML='<div style="padding:16px;text-align:center;font-size:13px;color:var(--ink3)">No days found.</div>';return;}
  
  // Flat list for search or filters
  if (search || fs) {
    container.innerHTML = list.map(d => renderDayRowHTML(d)).join('');
    return;
  }
  
  // Weekly grouping collapsible layout
  const curWeek = Math.floor(curDay / 7);
  if (!window.collapsedWeeks) {
    window.collapsedWeeks = new Set();
    const numWeeks = Math.ceil(days.length / 7);
    for (let w = 0; w < numWeeks; w++) {
      if (w !== curWeek) window.collapsedWeeks.add(w);
    }
  }
  
  const weeks = [];
  const numWeeks = Math.ceil(list.length / 7);
  for (let w = 0; w < numWeeks; w++) {
    weeks.push({
      index: w,
      days: list.slice(w * 7, (w + 1) * 7)
    });
  }
  
  container.innerHTML = weeks.map(w => {
    const isCollapsed = window.collapsedWeeks.has(w.index);
    const dayRowsHTML = w.days.map(d => renderDayRowHTML(d)).join('');
    const weekStart = w.index * 7 + 1;
    const weekEnd = Math.min(days.length, (w.index + 1) * 7);
    
    return `
      <div class="week-group">
        <div class="week-header${isCollapsed ? ' collapsed' : ''}" id="week-hdr-${w.index}" onclick="toggleWeek(${w.index})">
          <span>📅 Week ${w.index + 1} <span style="font-size:11px;color:var(--ink3);font-weight:normal;margin-left:4px">(Days ${weekStart}–${weekEnd})</span></span>
          <span class="week-arrow">${isCollapsed ? '◀' : '▼'}</span>
        </div>
        <div class="week-content${isCollapsed ? ' collapsed' : ''}" id="week-cnt-${w.index}">
          ${dayRowsHTML}
        </div>
      </div>
    `;
  }).join('');
}

function renderDayRowHTML(d) {
  const mc=sj(d.blocks[0]?.subjectId).color||'#888';
  return `<div class="day-row-m">
    <div class="drm-num" style="background:${mc}">${d.i+1}</div>
    <div class="drm-info">
      <div class="drm-title">${esc(d.title)||d.blocks.map(b=>sj(b.subjectId).name).join(' + ')||'Untitled'}</div>
      <div class="drm-meta">${fd(getDd(d.i))} · ${dPlannedHrs(d.i)}h · ${d.blocks.length} subject(s)</div>
    </div>
    <div class="drm-actions">
      <button class="ic-btn" onclick="jumpTo(${d.i}); switchView('daily');" title="View">👁</button>
      <button class="ic-btn" onclick="openDayModal('${d.id}')" title="Edit">✏️</button>
      <button class="ic-btn" onclick="moveDay('${d.id}',-1)" title="Up">↑</button>
      <button class="ic-btn" onclick="moveDay('${d.id}',1)" title="Down">↓</button>
      <button class="ic-btn del" onclick="delDay('${d.id}')" title="Delete">🗑</button>
    </div>
  </div>`;
}

function toggleWeek(wIdx) {
  const header = document.getElementById(`week-hdr-${wIdx}`);
  const content = document.getElementById(`week-cnt-${wIdx}`);
  if (header && content) {
    const isCollapsed = content.classList.toggle('collapsed');
    header.classList.toggle('collapsed', isCollapsed);
    const arrow = header.querySelector('.week-arrow');
    if (arrow) arrow.textContent = isCollapsed ? '◀' : '▼';
    
    if (!window.collapsedWeeks) window.collapsedWeeks = new Set();
    if (isCollapsed) {
      window.collapsedWeeks.add(wIdx);
    } else {
      window.collapsedWeeks.delete(wIdx);
    }
  }
}
function populateDFilter(){
  const sel=document.getElementById('dFilter');if(!sel)return;
  const cur=sel.value;
  sel.innerHTML='<option value="">All Subjects</option>'+subj.map(s=>`<option value="${s.id}"${s.id===cur?' selected':''}>${s.icon} ${s.name}</option>`).join('');
}
function moveDay(id,dir){const i=days.findIndex(d=>d.id===id);const ni=i+dir;if(ni<0||ni>=days.length)return;[days[i],days[ni]]=[days[ni],days[i]];sd();renderManage();renderDots();renderNavLabel();}
function delDay(id){if(!confirm('Delete this day?'))return;days=days.filter(d=>d.id!==id);if(curDay>=days.length)curDay=Math.max(0,days.length-1);sd();renderManage();renderAll();}
function delSubj(id){
  const cnt=days.reduce((c,d)=>c+d.blocks.filter(b=>b.subjectId===id).length,0);
  if(cnt>0&&!confirm(`Delete subject? ${cnt} block(s) will be removed.`))return;
  subj=subj.filter(s=>s.id!==id);
  days.forEach(d=>d.blocks=d.blocks.filter(b=>b.subjectId!==id));
  sd();renderManage();renderAll();
}

/* ══════════════════════════════════════════
   MODALS
══════════════════════════════════════════ */
function openModal(id){document.getElementById(id).classList.add('open');}
function closeModal(id){document.getElementById(id).classList.remove('open');}

function openSubjModal(id){
  editSubjId=id;const s=id?subj.find(x=>x.id===id):null;
  document.getElementById('smTitle').textContent=id?'Edit Subject':'Add Subject';
  document.getElementById('smName').value=s?.name||'';
  document.getElementById('smHrs').value=s?.defaultHrs||3;
  selColor=s?.color||COLORS[0];selIcon=s?.icon||ICONS[0];
  document.getElementById('colorRow').innerHTML=COLORS.map(c=>`<div class="c-opt${c===selColor?' sel':''}" style="background:${c}" onclick="selColor='${c}';document.querySelectorAll('.c-opt').forEach(x=>{x.classList.toggle('sel',x.style.background===selColor)})"></div>`).join('');
  document.getElementById('iconRow').innerHTML=ICONS.map(ic=>`<div class="i-opt${ic===selIcon?' sel':''}" onclick="selIcon='${ic}';document.querySelectorAll('.i-opt').forEach(x=>{x.classList.toggle('sel',x.textContent===selIcon)})">${ic}</div>`).join('');
  openModal('subjOverlay');setTimeout(()=>document.getElementById('smName').focus(),100);
}
function saveSubject(){
  const name=document.getElementById('smName').value.trim();
  const hrs=parseFloat(document.getElementById('smHrs').value)||3;
  if(!name){alert('Enter subject name');return;}
  if(editSubjId){const s=subj.find(x=>x.id===editSubjId);if(s){s.name=name;s.color=selColor;s.icon=selIcon;s.defaultHrs=hrs;}}
  else subj.push({id:'s'+Date.now(),name,color:selColor,icon:selIcon,defaultHrs:hrs});
  sd();closeModal('subjOverlay');renderAll();renderSyllabus();renderManage();
}

function openDayModal(id){
  editDayId=id;const d=id?days.find(x=>x.id===id):null;
  document.getElementById('dmTitle').textContent=id?'Edit Day':'Add Day';
  document.getElementById('dmName').value=d?.title||'';
  document.getElementById('dmDate').value=d?.dateOverride?new Date(d.dateOverride).toISOString().split('T')[0]:'';
  document.getElementById('dmTarget').value=d?.targetHrs||9;
  modalBlocks=d?JSON.parse(JSON.stringify(d.blocks)):[];
  renderModalBlocks();openModal('dayOverlay');
}
function renderModalBlocks(){
  document.getElementById('dmBlocksEl').innerHTML=modalBlocks.map((b,i)=>{
    const s=sj(b.subjectId);
    const stHtml=b.subtopics.map((st,j)=>`<div style="padding:4px 8px;background:var(--border);border-radius:5px;margin-right:5px;margin-bottom:5px;font-size:12px;display:inline-block">${esc(st)}<button onclick="modalBlocks[${i}].subtopics.splice(${j},1);renderModalBlocks()" style="background:none;border:none;color:var(--ink3);margin-left:5px;cursor:pointer;font-size:10px">✕</button></div>`).join('');
    const ctHtml=(b.customTasks||[]).map((ct,j)=>`<div style="padding:4px 8px;background:#ff9800a8;border-radius:5px;margin-right:5px;margin-bottom:5px;font-size:12px;display:inline-block">★ ${esc(ct.text)}<button onclick="modalBlocks[${i}].customTasks.splice(${j},1);renderModalBlocks()" style="background:none;border:none;color:#fff;margin-left:5px;cursor:pointer;font-size:10px">✕</button></div>`).join('');
    
    // Quick populate dropdown logic
    const existing = getExistingTopicsForSubject(b.subjectId);
    let quickPopulateHtml = '';
    if (existing.length > 0) {
      if (!window.sylTopicCache) window.sylTopicCache = {};
      window.sylTopicCache[b.subjectId] = existing;
      quickPopulateHtml = `<select style="padding:4px 6px;border-radius:4px;border:1px solid color-mix(in srgb, ${s.color} 30%, transparent);background:var(--card);color:var(--ink);font-size:11px;outline:none;max-width:180px;" onchange="if(this.value!==''){ const item=window.sylTopicCache['${b.subjectId}'][this.value]; modalBlocks[${i}].topic=item.topic; modalBlocks[${i}].subtopics=[...item.subtopics]; renderModalBlocks(); }">
        <option value="">📋 Select Existing Topic...</option>
        ${existing.map((item, idx) => `<option value="${idx}">${esc(item.topic)} (${item.subtopics.length} st)</option>`).join('')}
      </select>`;
    }

    return `<div class="mblk-row" style="background: color-mix(in srgb, ${s.color} 5%, transparent); border-color: color-mix(in srgb, ${s.color} 25%, transparent); flex-direction:column; align-items:stretch; gap:12px;">
      <!-- Line 1: Header Info & Controls -->
      <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;">
        <div style="display:flex;align-items:center;gap:8px;">
          <div style="width:28px;height:28px;border-radius:6px;background:color-mix(in srgb, ${s.color} 15%, transparent);display:flex;align-items:center;justify-content:center;font-size:15px">${s.icon}</div>
          <div class="mblk-name" style="color:${s.color};font-weight:800;font-size:14px;">${s.name}</div>
        </div>
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-left:auto;">
          <select style="padding:5px 8px;border-radius:6px;border:1px solid color-mix(in srgb, ${s.color} 30%, transparent);background:var(--card);color:var(--ink);font-size:12px;outline:none;" onchange="modalBlocks[${i}].subjectId=this.value;renderModalBlocks()">
            ${subj.map(sx=>`<option value="${sx.id}"${sx.id===b.subjectId?' selected':''}>${sx.icon} ${sx.name}</option>`).join('')}
          </select>
          <div class="mblk-hrs" style="background:var(--card);border:1px solid color-mix(in srgb, ${s.color} 20%, transparent);padding:2px;border-radius:6px;display:flex;align-items:center;">
            <button class="ctrl-btn" style="border:none;background:transparent;cursor:pointer;" onclick="modalBlocks[${i}].targetHrs=+(Math.max(.5,modalBlocks[${i}].targetHrs-.5).toFixed(1));renderModalBlocks()">−</button>
            <div class="mblk-hr-val" style="color:${s.color};font-weight:800;min-width:32px;text-align:center;font-size:13px;">${b.targetHrs}h</div>
            <button class="ctrl-btn" style="border:none;background:transparent;cursor:pointer;" onclick="modalBlocks[${i}].targetHrs=+(Math.min(12,modalBlocks[${i}].targetHrs+.5).toFixed(1));renderModalBlocks()">+</button>
          </div>
          <button onclick="modalBlocks.splice(${i},1);renderModalBlocks()" style="width:26px;height:26px;border-radius:6px;border:1px solid color-mix(in srgb, ${s.color} 30%, transparent);background:var(--card);color:#d94f3d;cursor:pointer;font-size:11px;display:flex;align-items:center;justify-content:center;transition:all .15s;" onmouseover="this.style.background='#d94f3d15'" onmouseout="this.style.background='var(--card)'">✕</button>
        </div>
      </div>
      <!-- Line 2: Topic Input & Quick Populate -->
      <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:2px;">
        <input class="mblk-topic" value="${esc(b.topic||'')}" placeholder="Topic name…" onchange="modalBlocks[${i}].topic=this.value" style="flex:2;min-width:180px;margin:0;">
        ${quickPopulateHtml ? `<div style="flex:1;min-width:160px;display:flex;justify-content:flex-end;">${quickPopulateHtml}</div>` : ''}
      </div>
      <!-- Sub-topics Section -->
      <div style="border-top:1px solid color-mix(in srgb, ${s.color} 15%, transparent);padding-top:8px">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--ink3);margin-bottom:6px">📋 Sub-topics</div>
        <div style="margin-bottom:8px">${stHtml}</div>
        <div style="display:flex;gap:5px;margin-bottom:12px">
          <input id="mst-${i}" placeholder="Add sub-topic" style="flex:1;padding:6px 8px;border:1px solid var(--border);border-radius:5px;background:var(--card);font-size:12px;color:var(--ink);outline:none;">
          <button onclick="const txt=document.getElementById('mst-${i}').value.trim();if(txt){modalBlocks[${i}].subtopics.push(txt);document.getElementById('mst-${i}').value='';renderModalBlocks()}" style="padding:6px 10px;background:var(--green);color:#fff;border:none;border-radius:5px;font-size:11px;font-weight:700;cursor:pointer;">Add</button>
        </div>
      </div>
      <!-- Custom Tasks Section -->
      <div style="border-top:1px solid color-mix(in srgb, ${s.color} 15%, transparent);padding-top:8px">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--ink3);margin-bottom:6px">✏️ Custom Tasks</div>
        <div style="margin-bottom:8px">${ctHtml}</div>
        <div style="display:flex;gap:5px">
          <input id="mct-${i}" placeholder="Add custom task" style="flex:1;padding:6px 8px;border:1px solid var(--border);border-radius:5px;background:var(--card);font-size:12px;color:var(--ink);outline:none;">
          <button onclick="const txt=document.getElementById('mct-${i}').value.trim();if(txt){if(!modalBlocks[${i}].customTasks)modalBlocks[${i}].customTasks=[];modalBlocks[${i}].customTasks.push({text:txt,done:false});document.getElementById('mct-${i}').value='';renderModalBlocks()}" style="padding:6px 10px;background:var(--blue);color:#fff;border:none;border-radius:5px;font-size:11px;font-weight:700;cursor:pointer;">Add</button>
        </div>
      </div>
    </div>`;
  }).join('');
}
function addModalBlock(){const s=subj[0];if(!s)return;modalBlocks.push({id:gid(),subjectId:s.id,targetHrs:s.defaultHrs||2,topic:'',subtopics:[]});renderModalBlocks();}
function saveDay(){
  const title=document.getElementById('dmName').value.trim();
  const dv=document.getElementById('dmDate').value;
  const target=parseFloat(document.getElementById('dmTarget').value)||9;
  if(!modalBlocks.length&&!confirm('No subject blocks. Save empty day?'))return;
  if(editDayId){
    const d=days.find(x=>x.id===editDayId);
    if(d){d.title=title;d.dateOverride=dv?new Date(dv).toISOString():null;d.targetHrs=target;
      d.blocks=modalBlocks.map(mb=>{const ex=d.blocks.find(e=>e.id===mb.id);return ex?{...ex,...mb}:mb;});}
  } else {
    days.push({id:'day'+Date.now(),title,dateOverride:dv?new Date(dv).toISOString():null,targetHrs:target,blocks:modalBlocks});
  }
  sd();closeModal('dayOverlay');refreshAllViews();
}

/* Block picker */
function openBpModal(dayId){
  bpDayId=dayId;bpSelSubjId=subj[0]?.id||null;
  document.getElementById('bpList').innerHTML=subj.map(s=>`
    <div class="sp-row${s.id===bpSelSubjId?' sel':''}" onclick="bpSelSubjId='${s.id}';document.querySelectorAll('.sp-row').forEach(r=>r.classList.remove('sel'));this.classList.add('sel');document.getElementById('bpHrs').value=${s.defaultHrs}">
      <div class="hb-leg-dot" style="background:${s.color};width:12px;height:12px;border-radius:3px"></div>
      <span style="font-size:16px">${s.icon}</span>
      <span class="sp-name">${esc(s.name)}</span>
      <span class="sp-hrs">${s.defaultHrs}h</span>
    </div>`).join('');
  document.getElementById('bpHrs').value=subj[0]?.defaultHrs||2;
  openModal('bpOverlay');
}
function confirmAddBlock(){
  if(!bpDayId||!bpSelSubjId)return;
  const d=days.find(x=>x.id===bpDayId);if(!d)return;
  const s=sj(bpSelSubjId);
  d.blocks.push({id:gid(),subjectId:bpSelSubjId,targetHrs:parseFloat(document.getElementById('bpHrs').value)||s.defaultHrs||2,topic:'',subtopics:[]});
  sd();closeModal('bpOverlay');refreshAllViews();
}

/* Bulk */
function openBulkModal(){document.getElementById('bulkInput').value='';openModal('bulkOverlay');}
function saveBulk(){
  const lines=document.getElementById('bulkInput').value.split('\n');
  let added=0,cur=null,curBlocks=[];
  function flush(){if(cur!==null){days.push({id:'day'+Date.now()+added,title:cur,dateOverride:null,targetHrs:9,blocks:curBlocks});added++;cur=null;curBlocks=[];}}
  lines.forEach(l=>{
    if(!l.trim())return;
    if(l.startsWith('  -')||l.startsWith('\t-')){const txt=l.replace(/^\s*-\s*/,'').trim();if(curBlocks.length&&txt)curBlocks[curBlocks.length-1].subtopics.push(txt);}
    else if(l.includes('|')){flush();const parts=l.split('|').map(p=>p.trim());cur=parts[0];curBlocks=parts.slice(1).map(p=>{const[nm,hrs]=p.split(':');const s=subj.find(x=>x.name.toLowerCase()===nm.trim().toLowerCase());if(!s)return null;return{id:gid(),subjectId:s.id,targetHrs:parseFloat(hrs)||s.defaultHrs||2,topic:'',subtopics:[]};}).filter(Boolean);}
  });flush();
  if(added){sd();closeModal('bulkOverlay');refreshAllViews();alert(`${added} day(s) added!`);}
  else alert('No days added. Check subject names match exactly.');
}

/* ══════════════════════════════════════════
   TABS & NAV
══════════════════════════════════════════ */
function switchView(v){
  document.querySelectorAll('.tab').forEach(b=>b.classList.toggle('active',b.dataset.view===v));
  document.querySelectorAll('.view').forEach(x=>x.classList.toggle('active',x.id==='view-'+v));
  
  const statsEl = document.getElementById('statsRow');
  const hoursEl = document.getElementById('hoursBar');
  if (statsEl) statsEl.style.display = (v === 'daily') ? '' : 'none';
  if (hoursEl) hoursEl.style.display = (v === 'daily') ? '' : 'none';

  if(v==='syllabus')renderSyllabus();
  if(v==='manage'){renderManage();updateDaysRemaining();}
  if(v==='daily')renderDaily();
  if(v==='revision')renderRevision();
  if(v==='group')renderGroup();

  conf.activeTab = v;
  sc();
}

function renderRevision() {
  const container = document.getElementById('revisionTableBody');
  if (!container) return;

  if (!prog.revision) {
    prog.revision = {};
  }

  if (subj.length === 0) {
    container.innerHTML = `<tr><td colspan="7" style="text-align:center;color:var(--ink3);padding:24px;">No subjects defined yet. Add subjects in the Manage or Syllabus tabs.</td></tr>`;
    return;
  }

  let html = '';
  subj.forEach(s => {
    const revs = prog.revision[s.id] || [false, false, false, false, false];
    while (revs.length < 5) {
      revs.push(false);
    }
    prog.revision[s.id] = revs;

    const completed = revs.filter(Boolean).length;
    const pct = Math.round((completed / 5) * 100);

    html += `
      <tr style="border-bottom:1px solid var(--border)">
        <td style="padding:12px;display:flex;align-items:center;gap:8px">
          <div style="width:12px;height:12px;border-radius:3px;background:${s.color}"></div>
          <span style="font-size:15px;margin-right:4px">${s.icon}</span>
          <span class="rev-row-name">${esc(s.name)}</span>
        </td>
        ${revs.map((done, idx) => `
          <td style="padding:12px;text-align:center">
            <div class="rev-box${done ? ' done' : ''}" onclick="toggleRevisionCheck('${s.id}', ${idx})">
              ${done ? '✓' : ''}
            </div>
          </td>
        `).join('')}
        <td style="padding:12px;">
          <div style="display:flex;align-items:center;gap:8px;justify-content:center">
            <div style="flex:1;min-width:60px;height:6px;background:var(--bg2);border-radius:3px;overflow:hidden">
              <div style="height:100%;width:${pct}%;background:var(--green)"></div>
            </div>
            <span class="rev-progress-cell" style="color:${pct === 100 ? 'var(--green)' : 'var(--ink)'}">${completed}/5</span>
          </div>
        </td>
      </tr>
    `;
  });

  container.innerHTML = html;
}

function toggleRevisionCheck(subjId, idx) {
  if (!prog.revision) {
    prog.revision = {};
  }
  const revs = prog.revision[subjId] || [false, false, false, false, false];
  while (revs.length < 5) {
    revs.push(false);
  }
  revs[idx] = !revs[idx];
  prog.revision[subjId] = revs;
  sp();
  renderRevision();
}

function toggleRevisionTracker() {
  conf.revisionActive = !conf.revisionActive;
  sc();
  updateRevisionTabVisibility();
  if (conf.revisionActive) {
    switchView('revision');
  }
}

function updateRevisionTabVisibility() {
  const tab = document.getElementById('tab-revision');
  const btn = document.getElementById('toggleRevisionBtn');
  if (!tab || !btn) return;

  if (conf.revisionActive) {
    tab.style.display = 'inline-block';
    btn.textContent = 'Deactivate Revision Tracker';
    btn.style.background = '#f44336';
    btn.style.borderColor = '#f44336';
  } else {
    tab.style.display = 'none';
    btn.textContent = 'Activate Revision Tracker';
    btn.style.background = 'var(--green)';
    btn.style.borderColor = 'var(--green)';
    
    // Redirect away from revision tab if it's currently selected
    const activeTab = document.querySelector('.tab.active');
    if (activeTab && activeTab.dataset.view === 'revision') {
      switchView('daily');
    }
  }
}
document.addEventListener('DOMContentLoaded',()=>{
  const tabs=document.querySelectorAll('.tab[data-view]');
  tabs.forEach(b=>b.addEventListener('click',()=>switchView(b.dataset.view)));

  const prevBtn=document.getElementById('prevBtn');
  const nextBtn=document.getElementById('nextBtn');
  if(prevBtn)prevBtn.addEventListener('click',()=>{if(curDay>0)jumpTo(curDay-1);});
  if(nextBtn)nextBtn.addEventListener('click',()=>{if(curDay<days.length-1)jumpTo(curDay+1);});
});

document.addEventListener('keydown',e=>{
  if(['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName))return;
  if(e.key==='ArrowLeft'&&curDay>0)jumpTo(curDay-1);
  if(e.key==='ArrowRight'&&curDay<days.length-1)jumpTo(curDay+1);
  if(e.key==='Escape')document.querySelectorAll('.overlay.open').forEach(o=>o.classList.remove('open'));
});

// Theme & Menu
function toggleTheme(){
  conf.dark=!conf.dark;
  sc();
  applyTheme();
  closeHeaderMenu();
}
/* ══════════════════════════════════════════
   TUTORIAL
══════════════════════════════════════════ */
const TUTORIAL_STEPS = [
  {
    title: 'Welcome to Study Planner 📚',
    content: `
      <div style="text-align:center;padding:12px 0 20px">
        <div style="font-size:48px;margin-bottom:12px">🎓</div>
        <p style="font-size:15px;color:var(--ink2);line-height:1.7;margin-bottom:12px">
          Your personal study companion — plan your schedule, track your syllabus, and stay consistent every day.
        </p>
        <p style="font-size:13px;color:var(--ink3);line-height:1.6">
          This quick tour will walk you through the <strong>3 main tabs</strong> and key features. You can skip at any time and re-open using the 💡 button in the top bar.
        </p>
      </div>
    `
  },
  {
    title: '📅 Daily Tab — Track Your Day',
    content: `
      <div style="padding:4px 0">
        <div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:14px">
          <span style="font-size:24px;flex-shrink:0">📊</span>
          <div>
            <div style="font-weight:700;color:var(--ink);margin-bottom:4px">Progress Stats</div>
            <p style="font-size:13px;color:var(--ink2);line-height:1.6">View your overall progress, current streak, and total hours logged across all subjects at a glance.</p>
          </div>
        </div>
        <div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:14px">
          <span style="font-size:24px;flex-shrink:0">⏱️</span>
          <div>
            <div style="font-weight:700;color:var(--ink);margin-bottom:4px">Study Timer</div>
            <p style="font-size:13px;color:var(--ink2);line-height:1.6">Start a live timer for each subject block. Or use the <strong>minutes bar</strong> to manually add study time in minutes.</p>
          </div>
        </div>
        <div style="display:flex;align-items:flex-start;gap:12px">
          <span style="font-size:24px;flex-shrink:0">✅</span>
          <div>
            <div style="font-weight:700;color:var(--ink);margin-bottom:4px">Subtopic Checklist</div>
            <p style="font-size:13px;color:var(--ink2);line-height:1.6">Tick off subtopics as you complete them. Each subject block shows your completion percentage.</p>
          </div>
        </div>
      </div>
    `
  },
  {
    title: '📚 Syllabus Tab — Build Your Plan',
    content: `
      <div style="padding:4px 0">
        <div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:14px">
          <span style="font-size:24px;flex-shrink:0">🛠️</span>
          <div>
            <div style="font-weight:700;color:var(--ink);margin-bottom:4px">Create Your Own Syllabus</div>
            <p style="font-size:13px;color:var(--ink2);line-height:1.6">Add custom subjects, topics, and subtopics. Organize exactly what you want to study.</p>
          </div>
        </div>
        <div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:14px">
          <span style="font-size:24px;flex-shrink:0">📋</span>
          <div>
            <div style="font-weight:700;color:var(--ink);margin-bottom:4px">Premade Syllabi</div>
            <p style="font-size:13px;color:var(--ink2);line-height:1.6">Select from curated syllabi for <strong>UPSC, UPPSC, BPSC</strong> and more — complete with subjects and their subtopics already filled in.</p>
          </div>
        </div>
        <div style="display:flex;align-items:flex-start;gap:12px">
          <span style="font-size:24px;flex-shrink:0">➕</span>
          <div>
            <div style="font-weight:700;color:var(--ink);margin-bottom:4px">Add / Remove Freely</div>
            <p style="font-size:13px;color:var(--ink2);line-height:1.6">Add or remove subjects anytime. Inside each subject, add topics and subtopics to track granular progress.</p>
          </div>
        </div>
      </div>
    `
  },
  {
    title: '⚙️ Manage Tab — Your Study Calendar',
    content: `
      <div style="padding:4px 0">
        <div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:14px">
          <span style="font-size:24px;flex-shrink:0">🎯</span>
          <div>
            <div style="font-weight:700;color:var(--ink);margin-bottom:4px">Set Target Exam</div>
            <p style="font-size:13px;color:var(--ink2);line-height:1.6">Enter your exam name and date. The planner will auto-generate a full daily schedule from today until your exam day.</p>
          </div>
        </div>
        <div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:14px">
          <span style="font-size:24px;flex-shrink:0">📆</span>
          <div>
            <div style="font-weight:700;color:var(--ink);margin-bottom:4px">Manage Daily Schedule</div>
            <p style="font-size:13px;color:var(--ink2);line-height:1.6">See and edit each day's study blocks — which subjects to study, for how many hours, and on which date.</p>
          </div>
        </div>
        <div style="display:flex;align-items:flex-start;gap:12px">
          <span style="font-size:24px;flex-shrink:0">🔄</span>
          <div>
            <div style="font-weight:700;color:var(--ink);margin-bottom:4px">Revision Tracker (Optional)</div>
            <p style="font-size:13px;color:var(--ink2);line-height:1.6">Activate the Revision Tracker button here to unlock a dedicated tab where you can tick off revision rounds (1st–5th) for each subject.</p>
          </div>
        </div>
      </div>
    `
  },
  {
    title: "You're All Set! 🚀",
    content: `
      <div style="text-align:center;padding:16px 0 20px">
        <div style="font-size:52px;margin-bottom:12px">🚀</div>
        <p style="font-size:15px;color:var(--ink2);line-height:1.7;margin-bottom:16px">
          Start by setting your exam date in <strong>Manage</strong>, choosing a syllabus in <strong>Syllabus</strong>, then track every day in <strong>Daily</strong>.
        </p>
        <p style="font-size:13px;color:var(--ink3);line-height:1.6">
          Anytime you need this guide again, tap the <strong>💡 bulb icon</strong> in the header.
        </p>
        <div style="margin-top:20px;padding:12px 16px;background:var(--bg2);border-radius:8px;font-size:13px;color:var(--ink2)">
          🔥 Consistency beats intensity. Show up every day!
        </div>
      </div>
    `
  }
];

let tutorialStep = 0;

function openTutorial() {
  tutorialStep = 0;
  renderTutorialStep();
  openModal('tutorialOverlay');
}

function closeTutorial() {
  closeModal('tutorialOverlay');
  conf.tutorialDone = true;
  sc();
}

function renderTutorialStep() {
  const step = TUTORIAL_STEPS[tutorialStep];
  document.getElementById('tutorialStepTitle').textContent = step.title;
  document.getElementById('tutorialStepBody').innerHTML = step.content;

  // Dots
  const dots = TUTORIAL_STEPS.map((_, i) => `
    <div onclick="jumpTutorialStep(${i})" style="width:8px;height:8px;border-radius:50%;background:${i === tutorialStep ? 'var(--blue)' : 'var(--border)'};cursor:pointer;transition:background .2s"></div>
  `).join('');
  document.getElementById('tutorialDots').innerHTML = dots;

  // Buttons
  const prevBtn = document.getElementById('tutorialPrevBtn');
  const nextBtn = document.getElementById('tutorialNextBtn');
  prevBtn.style.display = tutorialStep > 0 ? 'inline-block' : 'none';
  const isLast = tutorialStep === TUTORIAL_STEPS.length - 1;
  nextBtn.textContent = isLast ? '✓ Done' : 'Next →';
  nextBtn.style.background = isLast ? 'var(--green)' : 'var(--blue)';
  nextBtn.style.borderColor = isLast ? 'var(--green)' : 'var(--blue)';
}

function tutorialNext() {
  if (tutorialStep < TUTORIAL_STEPS.length - 1) {
    tutorialStep++;
    renderTutorialStep();
  } else {
    closeTutorial();
  }
}

function tutorialPrev() {
  if (tutorialStep > 0) {
    tutorialStep--;
    renderTutorialStep();
  }
}

function jumpTutorialStep(i) {
  tutorialStep = i;
  renderTutorialStep();
}

function maybeShowTutorial() {
  if (!conf.tutorialDone) {
    openTutorial();
  }
}



function showResetModal(){
  const existing=document.getElementById('_resetModal');
  if(existing) existing.remove();
  const el=document.createElement('div');
  el.id='_resetModal';
  el.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:99999;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(8px)';
  el.innerHTML=`
    <div style="background:var(--card,#1e1e2e);border-radius:16px;padding:28px 24px;max-width:420px;width:92%;box-shadow:0 20px 56px rgba(0,0,0,.55);border:1.5px solid #d94f3d66">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px">
        <span style="font-size:28px">⚠️</span>
        <div style="font-size:17px;font-weight:800;color:#d94f3d">Reset All Progress?</div>
      </div>
      <div style="font-size:12px;color:var(--ink3,#999);line-height:1.7;margin-bottom:16px">
        <p style="margin:0 0 10px">This action <strong style="color:#d94f3d">cannot be undone</strong>. The following will be permanently cleared:</p>
        <ul style="margin:0 0 10px;padding-left:18px">
          <li>All subtopic &amp; custom task checkmarks</li>
          <li>All logged study time (timers)</li>
          <li>All block notes</li>
        </ul>
        <p style="margin:0;padding:10px 12px;background:#d94f3d18;border-radius:8px;border-left:3px solid #d94f3d;color:var(--ink,#fff)">
          ✅ Your <strong>plan structure</strong> (subjects, days, topics) is <strong>kept intact</strong> — only progress is wiped.
        </p>
      </div>
      <div style="display:flex;gap:10px;justify-content:flex-end">
        <button onclick="document.getElementById('_resetModal').remove()" style="padding:9px 18px;background:var(--bg2,#2a2a3e);color:var(--ink,#fff);border:1px solid var(--border,#444);border-radius:8px;font-size:13px;font-weight:600;cursor:pointer">Cancel</button>
        <button onclick="_confirmReset()" style="padding:9px 18px;background:#d94f3d;color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer">↺ Yes, Reset Everything</button>
      </div>
    </div>`;
  document.body.appendChild(el);
}

function _confirmReset(){
  document.getElementById('_resetModal')?.remove();
  resetPlan();
}

function resetPlan(){
  stopAllTimers();
  prog={};
  timers={};
  localStorage.removeItem('_runningTimer');
  sp();
  refreshAllViews();
}

function toggleHeaderMenu(){
  const menu=document.getElementById('headerMenu');
  if(menu)menu.classList.toggle('active');
}

function closeHeaderMenu(){
  const menu=document.getElementById('headerMenu');
  if(menu)menu.classList.remove('active');
}

function applyTheme(){
  document.body.classList.toggle('dark',conf.dark);
  const themeBtn=document.getElementById('themeBtn');
  const menuTheme=document.getElementById('menuTheme');
  const icon=conf.dark?'☀️':'🌙';
  if(themeBtn)themeBtn.textContent=icon;
  if(menuTheme)menuTheme.textContent=icon+' '+(conf.dark?'Light Mode':'Dark Mode');
}

document.addEventListener('DOMContentLoaded',()=>{
  const themeBtn=document.getElementById('themeBtn');
  if(themeBtn)themeBtn.addEventListener('click',toggleTheme);
  
  // Close menu when clicking outside
  document.addEventListener('click',(e)=>{
    const headerMenu=document.getElementById('headerMenu');
    const menuBtn=document.getElementById('menuBtn');
    if(headerMenu&&menuBtn&&!headerMenu.contains(e.target)&&!menuBtn.contains(e.target)){
      closeHeaderMenu();
    }
  });
});

function renderAll(){renderStats();renderDaily();}
function refreshAllViews(){renderAll();renderSyllabus();renderManage();}

/* ══════════════════════════════════════════
   INIT
══════════════════════════════════════════ */
function flushRunningTimersToStorage(){
  // Persist elapsed seconds for all running timers before refresh/close.
  Object.keys(timers).forEach(bid=>{
    if(timers[bid]?.running){
      clearInterval(timers[bid].interval);
      const el=Math.floor((Date.now()-timers[bid].start)/1000);
      if(el>0){
        gp(bid).timeSpent=(gp(bid).timeSpent||0)+el;
      }
      timers[bid]={running:false};
    }
  });
  sp();
}

// ── Focus-mode: warn when user leaves while timer is running ──────────────
let _leftAt=null;

function showAwayWarning(awayMs){
  document.getElementById('_awayWarning')?.remove();
  const m=Math.floor(awayMs/60000),s=Math.floor((awayMs%60000)/1000);
  const awayStr=m>0?`${m}m ${s}s`:`${s}s`;
  const el=document.createElement('div');
  el.id='_awayWarning';
  el.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.88);z-index:99999;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(10px)';
  el.innerHTML=`
    <div style="background:var(--card,#1e1e2e);border-radius:18px;padding:36px 28px;max-width:380px;width:90%;text-align:center;box-shadow:0 24px 64px rgba(0,0,0,.6);border:1px solid var(--border,#333)">
      <div style="font-size:52px;margin-bottom:14px">⚠️</div>
      <div style="font-size:19px;font-weight:800;color:var(--ink,#fff);margin-bottom:8px">You left your study session!</div>
      <div style="font-size:13px;color:var(--ink3,#999);margin-bottom:26px">The timer kept running. You were away for <strong style="color:var(--orange,#e07a2a)">${awayStr}</strong>.</div>
      <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
        <button onclick="document.getElementById('_awayWarning').remove()" style="padding:11px 22px;background:var(--green,#2e9e5b);color:#fff;border:none;border-radius:9px;font-size:13px;font-weight:700;cursor:pointer">✅ Keep Timer Running</button>
        <button onclick="_pauseFromWarning()" style="padding:11px 22px;background:var(--red,#d94f3d);color:#fff;border:none;border-radius:9px;font-size:13px;font-weight:700;cursor:pointer">⏸ Pause Timer</button>
      </div>
    </div>`;
  document.body.appendChild(el);
}

function _pauseFromWarning(){
  document.getElementById('_awayWarning')?.remove();
  const runningBid=Object.keys(timers).find(bid=>timers[bid]?.running);
  if(runningBid){const day=days.find(d=>d.blocks.some(b=>b.id===runningBid));if(day)toggleTimer(runningBid,day.id);}
}

// Show overlay when user returns after switching away while timer was running
document.addEventListener('visibilitychange',()=>{
  const runningBid=Object.keys(timers).find(bid=>timers[bid]?.running);
  if(document.hidden){
    if(runningBid) _leftAt=Date.now();
  } else {
    if(_leftAt&&runningBid){
      const away=Date.now()-_leftAt;
      if(away>2000) showAwayWarning(away); // ignore instant flickers < 2s
    }
    _leftAt=null;
  }
});

window.addEventListener('beforeunload',(e)=>{
  _navigating=true;
  const runningBid=Object.keys(timers).find(bid=>timers[bid]?.running);
  if(runningBid){
    // Block navigation with native browser confirm when timer is running
    e.preventDefault();
    e.returnValue='';
    // Save state in case user confirms leaving
    const inFlight=Math.floor((Date.now()-timers[runningBid].start)/1000);
    const totalSpent=(gp(runningBid).timeSpent||0)+inFlight;
    sessionStorage.setItem('_resumeTimer',JSON.stringify({bid:runningBid,timeSpent:totalSpent}));
  } else {
    sessionStorage.removeItem('_resumeTimer');
  }
  try{flushRunningTimersToStorage();}catch{}
});

// Safety net for mobile (pagehide may fire without beforeunload)
window.addEventListener('pagehide',()=>{
  if(!_navigating){
    _navigating=true;
    const runningBid=Object.keys(timers).find(bid=>timers[bid]?.running);
    if(runningBid){
      const inFlight=Math.floor((Date.now()-timers[runningBid].start)/1000);
      const totalSpent=(gp(runningBid).timeSpent||0)+inFlight;
      sessionStorage.setItem('_resumeTimer',JSON.stringify({bid:runningBid,timeSpent:totalSpent}));
    } else {
      sessionStorage.removeItem('_resumeTimer');
    }
    try{flushRunningTimersToStorage();}catch{}
  }
});

/* ══════════════════════════════════════════
   👥 GROUP STUDY MODULE
   ══════════════════════════════════════════ */
window.isInGroup = false;
window.activeGroup = null;
let groupPollInterval = null;
let groupTickInterval = null;

async function renderGroup() {
  const container = document.getElementById('groupContent');
  if (!container) return;

  if (groupPollInterval) { clearInterval(groupPollInterval); groupPollInterval = null; }
  if (groupTickInterval) { clearInterval(groupTickInterval); groupTickInterval = null; }

  container.innerHTML = `
    <div style="display:flex;justify-content:center;padding:40px 0;">
      <div style="font-size:14px;color:var(--ink3);">Loading Group Study...</div>
    </div>`;

  try {
    const res = await fetch("/api/study-group");
    if (!res.ok) throw new Error("Failed to load group");
    const data = await res.json();

    window.isInGroup = data.joined;
    
    const ownedContainer = document.getElementById('ownedGroupsContent');
    if (data.joined) {
      window.activeGroup = data.group;
      renderActiveGroupUI(container);
      if (ownedContainer) ownedContainer.innerHTML = '';
      
      groupPollInterval = setInterval(pollGroupTimers, 4000);
      startGroupTimerTicks();
    } else {
      window.activeGroup = null;
      renderGroupLandingUI(container);
      renderOwnedGroupsUI(data.ownedGroups || []);
    }
  } catch (err) {
    container.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;padding:40px 20px;text-align:center;gap:12px">
        <span style="font-size:32px">❌</span>
        <div style="font-size:14px;font-weight:700;color:var(--ink)">Failed to load study group</div>
        <button class="hbtn" style="background:var(--blue);color:#fff;border-color:var(--blue)" onclick="renderGroup()">Retry</button>
      </div>`;
    const ownedContainer = document.getElementById('ownedGroupsContent');
    if (ownedContainer) ownedContainer.innerHTML = '';
  }
}

function renderGroupLandingUI(container) {
  container.innerHTML = `
    <div class="group-actions-panel" style="margin-top:16px;">
      <!-- Create Group Box -->
      <div class="group-action-box">
        <h3 style="margin-bottom:12px;font-size:16px;color:var(--ink)">🛠️ Create a Study Group</h3>
        <p style="font-size:12px;color:var(--ink3);line-height:1.6;margin-bottom:16px">
          Create a new study group, get an invite code, and invite your friends. You can see each other's live timers.
        </p>
        <input type="text" id="newGroupName" class="group-inp" placeholder="e.g. UPSC Aspirants 2026" />
        <button class="hbtn" style="width:100%;background:var(--green);color:#fff;border-color:var(--green);font-weight:800;height:36px;border-radius:8px;" onclick="handleCreateGroup()">Create Group</button>
      </div>

      <!-- Join Group Box -->
      <div class="group-action-box">
        <h3 style="margin-bottom:12px;font-size:16px;color:var(--ink)">👥 Join a Study Group</h3>
        <p style="font-size:12px;color:var(--ink3);line-height:1.6;margin-bottom:16px">
          Enter a 6-character study group invite code shared by your friend to join their group and study together.
        </p>
        <input type="text" id="groupInviteCode" class="group-inp" placeholder="e.g. AB12CD" style="text-transform:uppercase" maxLength="6" />
        <button class="hbtn" style="width:100%;background:var(--blue);color:#fff;border-color:var(--blue);font-weight:800;height:36px;border-radius:8px;" onclick="handleJoinGroup()">Join Group</button>
      </div>
    </div>
  `;
}

function renderOwnedGroupsUI(ownedGroups = []) {
  const container = document.getElementById('ownedGroupsContent');
  if (!container) return;

  if (ownedGroups.length === 0) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = `
    <div class="group-card" style="width:100%">
      <h3 style="margin-bottom:14px;font-size:14px;color:var(--ink);font-weight:800;text-transform:uppercase;letter-spacing:0.04em">🔑 Your Created Groups</h3>
      <div style="display:flex;flex-direction:column;gap:10px;">
        ${ownedGroups.map(og => `
          <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:var(--bg2);border:1px solid var(--border);border-radius:10px;flex-wrap:wrap;gap:12px;">
            <div style="flex:1;min-width:180px">
              <strong style="color:var(--ink);font-size:13px;">${esc(og.name)}</strong>
              <div style="font-size:11px;color:var(--ink3);margin-top:2px;">Invite Code: <code style="font-weight:700;color:var(--blue);font-family:monospace">${og.code}</code></div>
            </div>
            <div style="display:flex;gap:8px;">
              <button class="hbtn" style="background:var(--green);color:#fff;border-color:var(--green);font-weight:700;height:28px;" onclick="quickJoinOwnedGroup('${og.code}')">Enter Group</button>
              <button class="hbtn" style="background:#d94f3d;color:#fff;border-color:#d94f3d;font-weight:700;height:28px;" onclick="handleDeleteGroup('${og.id}')">Delete</button>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

async function quickJoinOwnedGroup(code) {
  try {
    const res = await fetch("/api/study-group", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "join", code })
    });
    if (res.ok) {
      renderGroup();
    } else {
      const data = await res.json();
      alert(data.message || "Failed to enter group");
    }
  } catch (err) {
    alert("Error entering group");
  }
}

function renderActiveGroupUI(container) {
  const g = window.activeGroup;
  if (!g) return;

  const selfMember = g.members.find(m => m.isSelf);
  const userIsOwner = g.ownerId && selfMember && g.ownerId === selfMember.userId;

  const actionButtons = userIsOwner 
    ? `<button class="hbtn" style="background:var(--bg2);color:var(--ink);border-color:var(--border)" onclick="handleLeaveGroup()">🚪 Leave Group</button>
       <button class="hbtn" style="background:#d94f3d;color:#fff;border-color:#d94f3d" onclick="handleDeleteGroup('${g.id}')">🗑️ Delete Group</button>`
    : `<button class="hbtn" style="background:var(--bg2);color:var(--ink);border-color:var(--border)" onclick="handleLeaveGroup()">🚪 Leave Group</button>`;

  container.innerHTML = `
    <div class="group-card">
      <div class="group-header-row">
        <div>
          <div class="group-title-label">${esc(g.name)}</div>
          <div style="font-size:11px;color:var(--ink3);margin-top:4px">Created by ${userIsOwner ? 'you' : 'group admin'}</div>
        </div>
        <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
          <div class="group-code-badge" title="Share this code with friends to join">
            Invite Code: <strong style="margin-left:4px">${g.code}</strong>
            <button onclick="copyGroupCode('${g.code}')" style="background:none;border:none;color:var(--blue);cursor:pointer;font-size:12px;padding:0;font-weight:700;margin-left:8px">📋 Copy</button>
          </div>
          ${actionButtons}
        </div>
      </div>

      <div style="font-size:11px;font-weight:800;color:var(--ink3);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:12px">📚 Live Study Session</div>
      <div class="member-grid" id="memberGridEl">
        ${renderMemberGridHtml()}
      </div>
    </div>
  `;
}

function renderMemberGridHtml() {
  const g = window.activeGroup;
  if (!g || !g.members) return '';

  return g.members.map(m => {
    const isStudying = !!m.timerBid;
    let timerText = '00:00:00';
    let subjectText = 'Idle';
    let topicText = 'Not studying right now';

    if (isStudying) {
      subjectText = m.subject || 'Study Block';
      topicText = m.topic || 'General study';
      
      if (m.timerStart) {
        const start = new Date(m.timerStart).getTime();
        const elapsed = Math.floor((Date.now() - start) / 1000);
        const total = Math.max(0, (m.timerBase || 0) + elapsed);
        const th = Math.floor(total / 3600), tm = Math.floor((total % 3600) / 60), ts = total % 60;
        timerText = `${String(th).padStart(2,'0')}:${String(tm).padStart(2,'0')}:${String(ts).padStart(2,'0')}`;
      }
    }

    const cardClass = isStudying ? 'member-card studying' : 'member-card';
    const statusClass = isStudying ? 'member-status-lbl studying' : 'member-status-lbl idle';
    const statusText = isStudying ? `<span class="pulse-dot"></span>Studying` : 'Idle';

    return `
      <div class="${cardClass}" data-user-id="${m.userId}" data-timer-start="${m.timerStart || ''}" data-timer-base="${m.timerBase || 0}">
        <div class="member-card-header">
          <div class="member-name">${esc(m.name)}${m.isSelf ? ' <span style="font-size:11px;color:var(--blue);font-weight:600">(You)</span>' : ''}</div>
          <div class="${statusClass}">${statusText}</div>
        </div>
        <div style="font-size:12px;color:var(--ink2);font-weight:700;display:flex;align-items:center;gap:6px">
          <span>📚</span>
          <span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(subjectText)}</span>
        </div>
        <div style="font-size:11px;color:var(--ink3);margin-top:-2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="${esc(topicText)}">
          ${esc(topicText)}
        </div>
        <div style="font-size:24px;font-weight:800;font-family:monospace;letter-spacing:-0.02em;margin-top:8px;color:${isStudying ? 'var(--green)' : 'var(--ink3)'}" class="member-timer-val">
          ${timerText}
        </div>
      </div>
    `;
  }).join('');
}

async function pollGroupTimers() {
  if (!window.isInGroup) return;
  try {
    const res = await fetch("/api/study-group/timer");
    if (res.ok) {
      const data = await res.json();
      if (data.joined && data.members) {
        window.activeGroup.members = data.members;
        const grid = document.getElementById("memberGridEl");
        if (grid) grid.innerHTML = renderMemberGridHtml();
      }
    }
  } catch (err) {
    console.error("Group timer polling failed:", err);
  }
}

function startGroupTimerTicks() {
  if (groupTickInterval) clearInterval(groupTickInterval);
  groupTickInterval = setInterval(() => {
    const cards = document.querySelectorAll(".member-card");
    cards.forEach(card => {
      const startStr = card.dataset.timerStart;
      if (!startStr) return;
      
      const start = new Date(startStr).getTime();
      const base = parseInt(card.dataset.timerBase) || 0;
      const elapsed = Math.floor((Date.now() - start) / 1000);
      const total = Math.max(0, base + elapsed);
      
      const th = Math.floor(total / 3600), tm = Math.floor((total % 3600) / 60), ts = total % 60;
      const tStr = `${String(th).padStart(2,'0')}:${String(tm).padStart(2,'0')}:${String(ts).padStart(2,'0')}`;
      
      const el = card.querySelector(".member-timer-val");
      if (el) el.textContent = tStr;
    });
  }, 1000);
}

async function handleCreateGroup() {
  const name = document.getElementById("newGroupName")?.value?.trim();
  if (!name) { alert("Please enter a group name"); return; }
  try {
    const res = await fetch("/api/study-group", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create", name })
    });
    const data = await res.json();
    if (res.ok) {
      renderGroup();
    } else {
      alert(data.message || "Failed to create group");
    }
  } catch (err) {
    alert("Error creating group");
  }
}

async function handleJoinGroup() {
  const code = document.getElementById("groupInviteCode")?.value?.trim()?.toUpperCase();
  if (!code || code.length !== 6) { alert("Please enter a valid 6-character code"); return; }
  try {
    const res = await fetch("/api/study-group", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "join", code })
    });
    const data = await res.json();
    if (res.ok) {
      renderGroup();
    } else {
      alert(data.message || "Failed to join group");
    }
  } catch (err) {
    alert("Error joining group");
  }
}

async function handleLeaveGroup() {
  if (!confirm("Are you sure you want to leave this study group?")) return;
  try {
    const res = await fetch("/api/study-group", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "leave" })
    });
    if (res.ok) {
      renderGroup();
    }
  } catch (err) {
    alert("Error leaving group");
  }
}

async function handleDeleteGroup(groupId) {
  if (!confirm("Are you sure you want to delete this study group? All members will be removed.")) return;
  try {
    const res = await fetch("/api/study-group", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", groupId })
    });
    if (res.ok) {
      renderGroup();
    }
  } catch (err) {
    alert("Error deleting group");
  }
}

function copyGroupCode(code) {
  navigator.clipboard.writeText(code).then(() => {
    alert("Invite code copied to clipboard!");
  }).catch(() => {
    alert("Failed to copy code. Code is: " + code);
  });
}

async function pushGroupTimerState(bid) {
  if (!window.isInGroup) return;
  try {
    let payload = {};
    if (bid) {
      const runningTimer = timers[bid];
      if (runningTimer && runningTimer.running) {
        let block = null;
        for (let d of days) {
          block = d.blocks.find(b => b.id === bid);
          if (block) break;
        }
        if (block) {
          const s = sj(block.subjectId);
          payload = {
            timerBid: bid,
            timerStart: new Date(runningTimer.start).toISOString(),
            timerBase: gp(bid).timeSpent || 0,
            subject: s.name,
            topic: block.topic || 'No topic set'
          };
        }
      }
    } else {
      payload = { timerBid: null };
    }

    const res = await fetch('/api/study-group/timer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      const data = await res.json();
      if (data.joined && data.members) {
        window.activeGroup.members = data.members;
        const grid = document.getElementById("memberGridEl");
        if (grid) grid.innerHTML = renderMemberGridHtml();
      }
    }
  } catch (err) {
    console.error("Failed to sync group timer:", err);
  }
}

document.addEventListener('DOMContentLoaded', async ()=>{
  loadLocalSync();
  applyTheme();
  await loadSyllabusTemplates();
  updateRevisionTabVisibility();
  renderAll();
  const nameInput=document.getElementById('targetExamName');
  if(nameInput&&conf.examName)nameInput.value=conf.examName;
  const dateInput=document.getElementById('targetExamDate');
  if(dateInput&&conf.targetDate)dateInput.value=conf.targetDate;
  updateDaysRemaining();
  switchView(conf.activeTab || 'daily');

  await load();
  
  // Fetch active study group status on load
  try {
    const groupRes = await fetch("/api/study-group");
    if (groupRes.ok) {
      const groupData = await groupRes.json();
      window.isInGroup = groupData.joined;
      if (groupData.joined) {
        window.activeGroup = groupData.group;
      }
    }
  } catch (err) {
    console.error("Error fetching group status on load:", err);
  }
  // ── Restore running timer after refresh ────────────────────────────────
  // Read BEFORE any render/sync so stale server data gets corrected first.
  const rtRaw=localStorage.getItem('_runningTimer');
  let _resumeData=null;
  if(rtRaw){
    try{
      const {bid:rtBid,start,base}=JSON.parse(rtRaw);
      const elapsed=Math.floor((Date.now()-start)/1000);
      const p=gp(rtBid);
      // Use whichever is larger: server's saved value or computed real elapsed
      p.timeSpent=Math.max(p.timeSpent||0, base+elapsed);
      _resumeData={bid:rtBid};
    }catch{}
  }
  // Also clear stale sessionStorage key from old approach
  sessionStorage.removeItem('_resumeTimer');
  applyTheme();
  await loadSyllabusTemplates();
  updateRevisionTabVisibility();
  renderAll();
  if(nameInput&&conf.examName)nameInput.value=conf.examName;
  if(dateInput&&conf.targetDate)dateInput.value=conf.targetDate;
  updateDaysRemaining();
  switchView(conf.activeTab || 'daily');
  syncToServer();
  if(_resumeData){
    const resumeDay=days.find(d=>d.blocks.some(b=>b.id===_resumeData.bid));
    if(resumeDay) toggleTimer(_resumeData.bid,resumeDay.id);
  }
  // Show tutorial on first visit only
  maybeShowTutorial();
});
