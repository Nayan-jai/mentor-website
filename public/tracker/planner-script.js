'use strict';
/* ══════════════════════════════════════════
   CONSTANTS
══════════════════════════════════════════ */
const COLORS=[
  'var(--blue)', 'var(--red)', 'var(--green)', 'var(--orange)', 'var(--purple)', 'var(--teal)', 'var(--gold)',
  'linear-gradient(135deg, #ff5e62, #ff9966)',
  'linear-gradient(135deg, #00c6ff, #0072ff)',
  'linear-gradient(135deg, #f107a3, #7b2ff7)',
  'linear-gradient(135deg, #11998e, #38ef7d)',
  'linear-gradient(135deg, #8a2387, #e94057, #f27121)',
  'linear-gradient(135deg, #f12711, #f5af19)'
];
const COLOR_NAMES={
  'var(--blue)': 'Blue 🔵',
  'var(--red)': 'Red 🔴',
  'var(--green)': 'Green 🟢',
  'var(--orange)': 'Orange 🟠',
  'var(--purple)': 'Purple 🟣',
  'var(--teal)': 'Teal 💎',
  'var(--gold)': 'Gold 🟡',
  'linear-gradient(135deg, #ff5e62, #ff9966)': 'Sunset Glow 🌅',
  'linear-gradient(135deg, #00c6ff, #0072ff)': 'Ocean Breeze 🌊',
  'linear-gradient(135deg, #f107a3, #7b2ff7)': 'Neon Purple 🌌',
  'linear-gradient(135deg, #11998e, #38ef7d)': 'Forest Fresh 🌿',
  'linear-gradient(135deg, #8a2387, #e94057, #f27121)': 'Aurora Lights 🎆',
  'linear-gradient(135deg, #f12711, #f5af19)': 'Citrus Punch 🍊'
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
  if (days && days.length > 0) {
    if(!conf.startDate){conf.startDate=formatDateLocal(new Date());}
    for(let i=0;i<days.length;i++){if(isToday(getDd(i))){curDay=i;break;}}
  }
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

  if(!conf.startDate){conf.startDate=formatDateLocal(new Date());}
  for(let i=0;i<days.length;i++){if(isToday(getDd(i))){curDay=i;break;}}
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
function parseDateLocal(strOrDate) {
  if (!strOrDate) return new Date();
  if (strOrDate instanceof Date) return new Date(strOrDate);
  const parts = strOrDate.split('T')[0].split('-');
  if (parts.length === 3) {
    return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
  }
  return new Date(strOrDate);
}
function formatDateLocal(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const r = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${r}`;
}
function getDd(i){const d=days[i];if(d?.dateOverride)return parseDateLocal(d.dateOverride);const dt=parseDateLocal(conf.startDate);dt.setDate(dt.getDate()+i);return dt;}
function isToday(d){const t=new Date();return d.getFullYear()===t.getFullYear()&&d.getMonth()===t.getMonth()&&d.getDate()===t.getDate();}
function fd(d){return d.toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short'});}
function gid(){return 'b'+Date.now().toString(36)+Math.random().toString(36).slice(2,5);}
function getSolidColor(c) {
  if (!c) return 'var(--blue)';
  if (c.includes('gradient')) {
    const match = c.match(/#(?:[0-9a-fA-F]{3}){1,2}/);
    return match ? match[0] : 'var(--blue)';
  }
  return c;
}

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
  const s = parseDateLocal(start);
  const e = parseDateLocal(end);
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

  const dateRangeBtn = document.getElementById('dateRangeBtn');
  if (dateRangeBtn) {
    const startStr = conf.startDate ? fd(parseDateLocal(conf.startDate)) : fd(new Date());
    const endStr = conf.targetDate ? fd(parseDateLocal(conf.targetDate)) : 'Select date…';
    dateRangeBtn.textContent = `📅 ${startStr} → ${endStr}`;
  }

  if (!conf.targetDate) {
    textEl.textContent = '-';
    if (repeatBtn) repeatBtn.style.display = 'none';
    return;
  }
  const today = new Date();
  today.setHours(0,0,0,0);
  const exam = parseDateLocal(conf.targetDate);
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

function updateStartDate(val) {
  conf.startDate = val || null;
  sc();
  updateDaysRemaining();
  renderManage();
  renderAll();
}

function updateTargetDate(val) {
  conf.targetDate = val || null;
  sc();
  updateDaysRemaining();
  renderManage();
  renderAll();
}

let calCurrentMonth = new Date();
let rangeStartDate = null;
let rangeEndDate = null;

function openDateRangePicker() {
  rangeStartDate = conf.startDate ? parseDateLocal(conf.startDate) : new Date();
  rangeStartDate.setHours(0,0,0,0);
  
  rangeEndDate = conf.targetDate ? parseDateLocal(conf.targetDate) : null;
  if (rangeEndDate) rangeEndDate.setHours(0,0,0,0);

  calCurrentMonth = new Date(rangeStartDate);
  
  // Ensure calendar grid is visible and selector is hidden
  const table = document.getElementById('calendarTable');
  const selector = document.getElementById('monthYearSelector');
  if (table) table.style.display = 'table';
  if (selector) selector.style.display = 'none';

  openModal('dateRangeOverlay');
  renderCalendar();
}

function prevCalendarMonth() {
  calCurrentMonth.setMonth(calCurrentMonth.getMonth() - 1);
  renderCalendar();
}

function nextCalendarMonth() {
  calCurrentMonth.setMonth(calCurrentMonth.getMonth() + 1);
  renderCalendar();
}

function clickCalendarDay(dateStr) {
  const clickedDate = parseDateLocal(dateStr);
  clickedDate.setHours(0,0,0,0);

  if (!rangeStartDate || (rangeStartDate && rangeEndDate)) {
    rangeStartDate = clickedDate;
    rangeEndDate = null;
  } else if (rangeStartDate && !rangeEndDate) {
    if (clickedDate < rangeStartDate) {
      rangeStartDate = clickedDate;
    } else {
      rangeEndDate = clickedDate;
    }
  }
  renderCalendar();
}

function changeModalStartDate(val) {
  if (!val) return;
  rangeStartDate = parseDateLocal(val);
  rangeStartDate.setHours(0,0,0,0);
  calCurrentMonth = new Date(rangeStartDate);
  renderCalendar();
}

function changeModalEndDate(val) {
  if (!val) return;
  rangeEndDate = parseDateLocal(val);
  rangeEndDate.setHours(0,0,0,0);
  calCurrentMonth = new Date(rangeEndDate);
  renderCalendar();
}

let selectorSelMonth = null;

function toggleMonthYearSelector() {
  const table = document.getElementById('calendarTable');
  const selector = document.getElementById('monthYearSelector');
  if (!table || !selector) return;

  if (selector.style.display === 'block') {
    table.style.display = 'table';
    selector.style.display = 'none';
  } else {
    table.style.display = 'none';
    selector.style.display = 'block';

    const yearInput = document.getElementById('selectorYearInput');
    if (yearInput) yearInput.value = calCurrentMonth.getFullYear();

    selectorSelMonth = calCurrentMonth.getMonth();
    renderMonthsGrid();
  }
}

function renderMonthsGrid() {
  const grid = document.getElementById('monthsGrid');
  if (!grid) return;
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  grid.innerHTML = monthNames.map((name, i) => {
    const isSelected = i === selectorSelMonth;
    const style = isSelected 
      ? 'background:var(--blue);color:#fff;border-color:var(--blue);'
      : 'background:var(--bg2);color:var(--ink);border:1px solid var(--border);';
    return `<button onclick="selectSelectorMonth(${i})" style="${style}padding:6px;border-radius:4px;cursor:pointer;font-size:11px;font-weight:600;outline:none;">${name}</button>`;
  }).join('');
}

function selectSelectorMonth(idx) {
  selectorSelMonth = idx;
  renderMonthsGrid();
}

function applyMonthYearSelector() {
  const yearInput = document.getElementById('selectorYearInput');
  const year = parseInt(yearInput.value) || new Date().getFullYear();
  calCurrentMonth.setFullYear(year);
  if (selectorSelMonth !== null) {
    calCurrentMonth.setMonth(selectorSelMonth);
  }
  
  document.getElementById('calendarTable').style.display = 'table';
  document.getElementById('monthYearSelector').style.display = 'none';
  
  renderCalendar();
}

function hoverCalendarDay(dateStr) {
  if (!rangeStartDate || rangeEndDate) return;
  const targetDate = parseDateLocal(dateStr);
  targetDate.setHours(0,0,0,0);
  if (targetDate < rangeStartDate) return;
  
  const cells = document.querySelectorAll('#calendarGridBody td');
  cells.forEach(td => {
    const el = td.querySelector('.cal-day:not(.empty)');
    if (!el) return;
    
    const dt = parseDateLocal(el.getAttribute('data-date'));
    dt.setHours(0,0,0,0);
    const isStart = dt.getTime() === rangeStartDate.getTime();
    const isHover = dt.getTime() === targetDate.getTime();
    const inBetween = dt > rangeStartDate && dt < targetDate;

    // Reset classes
    td.className = '';
    el.className = 'cal-day';
    
    if (isStart) {
      el.className += ' sel-endpoint';
      td.className = 'range-start';
    } else if (isHover) {
      el.className += ' sel-endpoint';
      td.className = 'range-end';
    } else if (inBetween) {
      td.className = 'in-range';
    }
  });

  const totalDays = Math.ceil((targetDate.getTime() - rangeStartDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const btn = document.getElementById('selectRangeBtn');
  if (btn) {
    btn.disabled = false;
    btn.textContent = `Select ${totalDays} days`;
  }
}

function updateSelectRangeButton() {
  const btn = document.getElementById('selectRangeBtn');
  if (!btn) return;

  if (rangeStartDate && rangeEndDate) {
    const totalDays = Math.ceil((rangeEndDate.getTime() - rangeStartDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    btn.disabled = false;
    btn.textContent = `Select ${totalDays} days`;
  } else if (rangeStartDate) {
    btn.disabled = true;
    btn.textContent = 'Select target date';
  } else {
    btn.disabled = true;
    btn.textContent = 'Select date range';
  }
}

function renderCalendar() {
  const container = document.getElementById('calendarGridBody');
  const monthYearEl = document.getElementById('calMonthYear');
  if (!container || !monthYearEl) return;

  // Sync manual date inputs in the modal
  const mStartInput = document.getElementById('modalStartDate');
  if (mStartInput) {
    mStartInput.value = rangeStartDate ? formatDateLocal(rangeStartDate) : '';
  }
  const mEndInput = document.getElementById('modalEndDate');
  if (mEndInput) {
    mEndInput.value = rangeEndDate ? formatDateLocal(rangeEndDate) : '';
  }

  const year = calCurrentMonth.getFullYear();
  const month = calCurrentMonth.getMonth();

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  monthYearEl.textContent = `${monthNames[month]} ${year}`;

  const firstDay = new Date(year, month, 1).getDay();
  const numDays = new Date(year, month + 1, 0).getDate();

  container.innerHTML = '';
  let row = document.createElement('tr');
  
  for (let i = 0; i < firstDay; i++) {
    const td = document.createElement('td');
    td.innerHTML = '<div class="cal-day empty"></div>';
    row.appendChild(td);
  }

  for (let day = 1; day <= numDays; day++) {
    if (row.children.length === 7) {
      container.appendChild(row);
      row = document.createElement('tr');
    }

    const td = document.createElement('td');
    const dayDate = new Date(year, month, day);
    dayDate.setHours(0,0,0,0);

    const isStart = rangeStartDate && dayDate.getTime() === rangeStartDate.getTime();
    const isEnd = rangeEndDate && dayDate.getTime() === rangeEndDate.getTime();
    
    let inRange = false;
    if (rangeStartDate && rangeEndDate) {
      inRange = dayDate > rangeStartDate && dayDate < rangeEndDate;
    }

    let tdClass = '';
    let dayClass = 'cal-day';

    if (isStart) {
      dayClass += ' sel-endpoint';
      if (rangeEndDate) tdClass = 'range-start';
    } else if (isEnd) {
      dayClass += ' sel-endpoint';
      if (rangeStartDate) tdClass = 'range-end';
    } else if (inRange) {
      tdClass = 'in-range';
    }

    const dateStr = formatDateLocal(dayDate);
    td.className = tdClass;
    td.innerHTML = `<div class="${dayClass}" data-date="${dateStr}" onclick="clickCalendarDay('${dateStr}')" onmouseenter="hoverCalendarDay('${dateStr}')">${day}</div>`;
    row.appendChild(td);
  }

  while (row.children.length < 7) {
    const td = document.createElement('td');
    td.innerHTML = '<div class="cal-day empty"></div>';
    row.appendChild(td);
  }
  container.appendChild(row);

  updateSelectRangeButton();
}

function applySelectedDateRange() {
  if (!rangeStartDate || !rangeEndDate) return;
  conf.startDate = formatDateLocal(rangeStartDate);
  conf.targetDate = formatDateLocal(rangeEndDate);
  sc();
  
  updateDaysRemaining();
  closeModal('dateRangeOverlay');
  renderAll();
  renderManage();
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

  const statsRow = document.getElementById('statsRow');
  if (statsRow) {
    if (conf.trackerMode === 'easy') {
      statsRow.style.display = 'none';
    } else {
      statsRow.style.display = 'grid';
    }
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
  const hoursBar = document.getElementById('hoursBar');
  if (hoursBar && conf.trackerMode === 'easy') {
    hoursBar.style.display = 'none';
    return;
  } else if (hoursBar) {
    hoursBar.style.display = 'block';
  }
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
   EASY MODE & TRACKER VIEW MODE FUNCTIONS
══════════════════════════════════════════ */
function setTrackerMode(mode) {
  conf.trackerMode = mode;
  if (mode === 'easy') {
    document.body.setAttribute('data-tracker-mode', 'easy');
  } else {
    document.body.removeAttribute('data-tracker-mode');
  }
  sc();
  renderAll();
  renderManage();
}

function toggleTrackerMode() {
  const nextMode = conf.trackerMode === 'easy' ? 'advanced' : 'easy';
  setTrackerMode(nextMode);
}

function toggleEasySubjectTimer(subjectId) {
  const runningBid = Object.keys(timers).find(bid => timers[bid]?.running);
  if (runningBid) {
    const runningBlock = (days[curDay]?.blocks || []).find(b => b.id === runningBid);
    if (runningBlock && runningBlock.subjectId === subjectId) {
      toggleTimer(runningBid, days[curDay].id);
      renderDaily();
      return;
    }
  }

  const curDayObj = days[curDay] || days[0];
  if (!curDayObj) return;

  let targetBlock = (curDayObj.blocks || []).find(b => b.subjectId === subjectId);
  if (!targetBlock) {
    const s = sj(subjectId);
    targetBlock = {
      id: gid(),
      subjectId: subjectId,
      targetHrs: s.defaultHrs || 2,
      topic: (s.name || 'Study') + ' Session',
      subtopics: []
    };
    curDayObj.blocks.push(targetBlock);
    sd();
  }

  toggleTimer(targetBlock.id, curDayObj.id);
  renderDaily();
}

let lastCheckedDateStr = new Date().toDateString();

function checkDailyRollover() {
  const todayStr = new Date().toDateString();
  if (todayStr !== lastCheckedDateStr) {
    lastCheckedDateStr = todayStr;
    const ti = days.findIndex((_, i) => isToday(getDd(i)));
    if (ti >= 0) {
      curDay = ti;
    }
    renderDaily();
    renderStats();
    renderHoursBar();
  }
}

function renderEasyModeTick() {
  checkDailyRollover();
  if (conf.trackerMode !== 'easy') return;
  const bigTimerEl = document.getElementById('easyBigTimerDisplay');
  const bigTimerSubEl = document.getElementById('easyBigTimerSub');
  if (!bigTimerEl) return;

  const curDayObj = days[curDay] || days[0];
  const runningBid = Object.keys(timers).find(bid => timers[bid]?.running);
  let totalSec = (curDayObj?.blocks || []).reduce((ss,b) => ss + (gp(b.id).timeSpent || 0), 0);

  if (runningBid) {
    const elapsed = Math.floor((Date.now() - timers[runningBid].start) / 1000);
    const activeSec = (gp(runningBid).timeSpent || 0) + elapsed;
    const ah = Math.floor(activeSec / 3600), am = Math.floor((activeSec % 3600) / 60), as = activeSec % 60;
    bigTimerEl.textContent = `${String(ah).padStart(1,'0')}:${String(am).padStart(2,'0')}:${String(as).padStart(2,'0')}`;
    bigTimerEl.classList.add('active');

    const totalActiveSec = totalSec + elapsed;
    const totalH = Math.floor(totalActiveSec / 3600), totalM = Math.floor((totalActiveSec % 3600) / 60);
    if (bigTimerSubEl) bigTimerSubEl.textContent = `${totalH}h ${totalM}m total study today`;

    const activeBlock = (days[curDay]?.blocks || []).find(b => b.id === runningBid);
    if (activeBlock) {
      const activeRowTimeEl = document.getElementById('easySubjTime-' + activeBlock.subjectId);
      if (activeRowTimeEl) {
        let subjTotalSec = 0;
        (days[curDay]?.blocks || []).forEach(b => {
          if (b.subjectId === activeBlock.subjectId) {
            subjTotalSec += (gp(b.id).timeSpent || 0);
            if (timers[b.id]?.running) {
              subjTotalSec += Math.floor((Date.now() - timers[b.id].start) / 1000);
            }
          }
        });
        const sh = Math.floor(subjTotalSec / 3600), sm = Math.floor((subjTotalSec % 3600) / 60), ss = subjTotalSec % 60;
        activeRowTimeEl.textContent = `${String(sh).padStart(1,'0')}:${String(sm).padStart(2,'0')}:${String(ss).padStart(2,'0')}`;
      }
    }
  } else {
    const totalH = Math.floor(totalSec / 3600), totalM = Math.floor((totalSec % 3600) / 60);
    bigTimerEl.textContent = `${totalH}h ${totalM}m`;
    bigTimerEl.classList.remove('active');
    if (bigTimerSubEl) bigTimerSubEl.textContent = '';
  }
}

function renderEasyModeView() {
  const container = document.getElementById('dayContent');
  if (!container) return;

  const curDayObj = days[curDay] || days[0];

  const dayDate = getDd(curDay);
  const fullDateStr = dayDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  const runningBid = Object.keys(timers).find(bid => timers[bid]?.running);
  const runningBlock = runningBid ? (days[curDay]?.blocks || []).find(b => b.id === runningBid) : null;

  let totalSec = (curDayObj?.blocks || []).reduce((ss,b) => ss + (gp(b.id).timeSpent || 0), 0);
  if (runningBid) {
    totalSec += Math.floor((Date.now() - timers[runningBid].start) / 1000);
  }
  const totalH = Math.floor(totalSec / 3600), totalM = Math.floor((totalSec % 3600) / 60);

  let bigTimerText = `${totalH}h ${totalM}m`;
  if (runningBid) {
    const elapsed = Math.floor((Date.now() - timers[runningBid].start) / 1000);
    const activeSec = (gp(runningBid).timeSpent || 0) + elapsed;
    const ah = Math.floor(activeSec / 3600), am = Math.floor((activeSec % 3600) / 60), as = activeSec % 60;
    bigTimerText = `${String(ah).padStart(1,'0')}:${String(am).padStart(2,'0')}:${String(as).padStart(2,'0')}`;
  }

  const subjectsHtml = subj.map(s => {
    let subjSec = 0;
    if (curDayObj && curDayObj.blocks) {
      curDayObj.blocks.forEach(b => {
        if (b.subjectId === s.id) {
          subjSec += (gp(b.id).timeSpent || 0);
          if (timers[b.id]?.running) {
            subjSec += Math.floor((Date.now() - timers[b.id].start) / 1000);
          }
        }
      });
    }

    const isSubjRunning = runningBlock && runningBlock.subjectId === s.id;
    const sh = Math.floor(subjSec / 3600), sm = Math.floor((subjSec % 3600) / 60), ss = subjSec % 60;
    const timeStr = `${String(sh).padStart(1,'0')}:${String(sm).padStart(2,'0')}:${String(ss).padStart(2,'0')}`;

    return `
      <div class="easy-subj-card ${isSubjRunning ? 'running' : ''}" onclick="toggleEasySubjectTimer('${s.id}')">
        <button class="easy-play-btn ${isSubjRunning ? 'running' : ''}" style="background:${getSolidColor(s.color)}" onclick="event.stopPropagation(); toggleEasySubjectTimer('${s.id}')">
          ${isSubjRunning ? '⏸' : '▶'}
        </button>
        <div class="easy-subj-name">${esc(s.name)}</div>
        <div class="easy-subj-time" id="easySubjTime-${s.id}">${timeStr}</div>
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <div class="easy-mode-container">
      <!-- Centered Top Header -->
      <div class="easy-header">
        <div class="easy-main-timer ${runningBid ? 'active' : ''}" id="easyBigTimerDisplay">${bigTimerText}</div>
        <div class="easy-date-title">${fullDateStr}</div>
        <div class="easy-sub-text" id="easyBigTimerSub">${runningBid ? `${totalH}h ${totalM}m total study today` : ''}</div>
      </div>

      <!-- Centered Sub-Nav -->
      <div class="easy-nav-bar">
        <button class="easy-nav-item active">Timer</button>
        <button class="easy-nav-item" onclick="switchView('syllabus')">Syllabus</button>
        <button class="easy-nav-item" onclick="showStatsDetail('today')">Statistics</button>
        <button class="easy-nav-item" onclick="switchView('manage')">Planner</button>
      </div>

      <!-- 2-Column Grid for Subject Cards -->
      <div class="easy-subjects-grid" id="easySubjectList">
        ${subjectsHtml || '<div style="grid-column:1/-1;padding:30px;text-align:center;color:var(--ink3);font-size:14px">No subjects found. Go to Planner to add subjects!</div>'}
      </div>
    </div>
  `;
}

/* ══════════════════════════════════════════
   DAILY VIEW
══════════════════════════════════════════ */
function renderDaily(){
  const statsRow = document.getElementById('statsRow');
  const hoursBar = document.getElementById('hoursBar') || document.querySelector('.hours-bar-card');
  const todayBanner = document.getElementById('todayBanner');
  const dayNav = document.querySelector('.day-nav');
  const dayDots = document.getElementById('dayDots');

  if (conf.trackerMode === 'easy') {
    document.body.setAttribute('data-tracker-mode', 'easy');
    if (statsRow) statsRow.style.display = 'none';
    if (hoursBar) hoursBar.style.display = 'none';
    if (todayBanner) todayBanner.style.display = 'none';
    if (dayNav) dayNav.style.display = 'none';
    if (dayDots) dayDots.style.display = 'none';
    renderEasyModeView();
  } else {
    document.body.removeAttribute('data-tracker-mode');
    if (statsRow) statsRow.style.display = 'grid';
    if (hoursBar) hoursBar.style.display = 'block';
    if (dayNav) dayNav.style.display = 'flex';
    if (dayDots) dayDots.style.display = 'flex';
    renderTodayBanner();
    renderNavLabel();
    renderDots();
    renderDayContent();
  }
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
  const dotsEl = document.getElementById('dayDots');
  if (!dotsEl) return;
  dotsEl.innerHTML = days.map((_,i)=>{
    const p=dPct(i);
    let c='dot';
    if(p===100)c+=' done';else if(p>0)c+=' partial';
    if(isToday(getDd(i)))c+=' today';
    if(i===curDay)c+=' active';
    return `<div class="${c}" onclick="jumpTo(${i})" title="Day ${i+1} — ${p}%">${i+1}</div>`;
  }).join('');

  const activeDot = dotsEl.querySelector('.dot.active');
  if (activeDot) {
    const containerWidth = dotsEl.clientWidth;
    const dotLeft = activeDot.offsetLeft;
    const dotWidth = activeDot.offsetWidth;
    dotsEl.scrollTo({ left: dotLeft - containerWidth / 2 + dotWidth / 2, behavior: 'smooth' });
  }
}

function renderDayContent(){
  if(!days.length){
    document.getElementById('dayContent').innerHTML=`<div class="empty-state"><div class="es-icon">📋</div><p>No days yet. Go to <strong>Manage</strong> to build your plan.</p></div>`;
    return;
  }

  // Preserve open block cards, subtopic scroll positions, and window scroll position
  const openBlockIds = Array.from(document.querySelectorAll('.block-body.open')).map(el => el.id.replace('sbb-', ''));
  const stListScrolls = {};
  document.querySelectorAll('.st-list').forEach(el => {
    if (el.id) stListScrolls[el.id] = el.scrollTop;
  });
  const windowScrollY = window.scrollY;

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

  // Restore open block card state
  openBlockIds.forEach(bid => {
    document.getElementById('sbb-' + bid)?.classList.add('open');
    document.getElementById('chev-' + bid)?.classList.add('open');
  });

  // Restore subtopic list internal scroll positions
  Object.keys(stListScrolls).forEach(id => {
    const el = document.getElementById(id);
    if (el) el.scrollTop = stListScrolls[id];
  });

  // Restore window scroll position
  if (windowScrollY > 0) {
    window.scrollTo({ top: windowScrollY, behavior: 'instant' });
  }
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
  return `<div class="block-card" id="sb-${block.id}" style="border-left-color:${s.color}; box-shadow:0 4px 14px ${s.color}15; animation-delay:${bi*0.05}s; --subj-color-solid:${getSolidColor(s.color)}; --subj-color-bg:${s.color}">
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
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;gap:8px;flex-wrap:wrap">
        <div class="sect-label" style="margin:0">📌 Topic</div>
        <button class="hbtn" style="height:28px;padding:0 10px;font-size:11px;font-weight:700;background:var(--bg2);color:var(--ink);border:1px solid var(--border);border-radius:6px;display:inline-flex;align-items:center;gap:4px;cursor:pointer" onclick="migrateUnfinishedSubtopics('${dayId}','${block.id}')" title="Move unfinished subtopics to tomorrow's plan">
          ➡️ Migrate Unfinished to Tomorrow
        </button>
      </div>
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

function migrateUnfinishedSubtopics(dayId, blockId) {
  const dayIndex = days.findIndex(d => d.id === dayId);
  if (dayIndex < 0) return;
  const day = days[dayIndex];
  const block = day.blocks.find(b => b.id === blockId);
  if (!block) return;

  const s = sj(block.subjectId);
  const p = gp(blockId);

  // Find incomplete subtopics
  const incompleteSubtopics = [];
  const keptSubtopics = [];
  const newSubtopicProgress = {};

  (block.subtopics || []).forEach((st, idx) => {
    if (p.subtopics && p.subtopics[idx]) {
      keptSubtopics.push(st);
      newSubtopicProgress[keptSubtopics.length - 1] = true;
    } else {
      incompleteSubtopics.push(st);
    }
  });

  // Find incomplete custom tasks
  const incompleteCustomTasks = [];
  const keptCustomTasks = [];

  (p.customTasks || []).forEach((ct) => {
    if (ct.done) {
      keptCustomTasks.push(ct);
    } else {
      incompleteCustomTasks.push(ct);
    }
  });

  const totalMigrating = incompleteSubtopics.length + incompleteCustomTasks.length;

  if (totalMigrating === 0) {
    alert("🎉 Great job! All subtopics and tasks in this block are already completed. Nothing to migrate.");
    return;
  }

  const confirmMsg = `Migrate ${totalMigrating} incomplete item(s) (${incompleteSubtopics.length} subtopic(s), ${incompleteCustomTasks.length} task(s)) of "${s.name}" to tomorrow (Day ${dayIndex + 2})?`;
  if (!confirm(confirmMsg)) return;

  // Ensure tomorrow's day exists
  let nextDayIndex = dayIndex + 1;
  if (nextDayIndex >= days.length) {
    const nextDayObj = {
      id: gid(),
      targetHrs: day.targetHrs || 9,
      title: `Day ${nextDayIndex + 1}`,
      blocks: []
    };
    days.push(nextDayObj);
  }

  const nextDay = days[nextDayIndex];

  // Find or create block for the same subject on nextDay
  let nextBlock = (nextDay.blocks || []).find(b => b.subjectId === block.subjectId);
  if (!nextBlock) {
    nextBlock = {
      id: gid(),
      subjectId: block.subjectId,
      targetHrs: block.targetHrs || 2,
      topic: block.topic ? `${block.topic} (Carried Over)` : `${s.name} (Carried Over)`,
      subtopics: []
    };
    nextDay.blocks.push(nextBlock);
  }

  // Append incomplete subtopics to nextBlock
  nextBlock.subtopics = nextBlock.subtopics || [];
  nextBlock.subtopics.push(...incompleteSubtopics);

  // Append incomplete custom tasks to nextBlock progress
  if (incompleteCustomTasks.length > 0) {
    const nextP = gp(nextBlock.id);
    nextP.customTasks = nextP.customTasks || [];
    nextP.customTasks.push(...incompleteCustomTasks.map(ct => ({ text: ct.text, done: false })));
  }

  // Update current block subtopics and progress
  block.subtopics = keptSubtopics;
  p.subtopics = newSubtopicProgress;
  p.customTasks = keptCustomTasks;

  sd();
  sp();
  renderAll();

  alert(`Successfully migrated ${totalMigrating} item(s) to Day ${nextDayIndex + 1} (${s.name})! 🚀`);
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
  return `<div class="block-card" id="sb-${block.id}" style="border-left-color:${s.color}; box-shadow:0 4px 14px ${s.color}15; animation-delay:${bi*0.05}s; --subj-color-solid:${getSolidColor(s.color)}; --subj-color-bg:${s.color}">
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
function toggleST(bid,j,dayId){
  const currentScrollY = window.scrollY;
  const p=gp(bid);
  p.subtopics[j]=!p.subtopics[j];
  sp();

  const d=days.find(x=>x.id===dayId);
  const b=d?.blocks.find(x=>x.id===bid);

  if(b){
    const stRow=document.querySelector(`#stl-${bid} .st-row:nth-child(${j+1})`);
    if(stRow){
      const isDone=!!p.subtopics[j];
      stRow.classList.toggle('done', isDone);
      const chk=stRow.querySelector('.st-check');
      if(chk){
        chk.classList.toggle('on', isDone);
        chk.textContent=isDone?'✓':'';
      }
    }

    const pct=bPct(bid,b.subtopics);
    const circ=2*Math.PI*15;
    const offset=circ-(pct/100)*circ;

    const card=document.getElementById('sb-'+bid);
    if(card){
      const subTitle=card.querySelector('.block-subtitle');
      if(subTitle){
        const sec=(p.timeSpent||0)+(timers[bid]?.running?Math.floor((Date.now()-timers[bid].start)/1000):0);
        subTitle.textContent=`${pct}% · ${Math.round(sec/360)/10}/${b.targetHrs}h · ${esc(b.topic||'No topic set')}`;
      }
      const mrFg=card.querySelector('.mr-fg');
      if(mrFg) mrFg.setAttribute('stroke-dashoffset', offset);
      const mrLbl=card.querySelector('.mr-label');
      if(mrLbl) mrLbl.textContent=`${pct}%`;
    }

    renderHoursBar();
    renderStats();
    renderDots();

    if (currentScrollY > 0) {
      window.scrollTo({ top: currentScrollY, behavior: 'instant' });
    }
    return;
  }

  refreshAllViews();
}
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
    gp(bid).lastEnd=new Date().toISOString();
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
        gp(id).lastEnd=new Date().toISOString();
        timers[id]={running:false};
        const otherDay = days.find(d => d.blocks.some(b => b.id === id));
        if (otherDay) { refreshBlock(otherDay.id, id); }
      }
    });
    timers[bid]={running:true,start:Date.now(),interval:null,ticks:0};
    if(!gp(bid).startTime) gp(bid).startTime = new Date(timers[bid].start).toISOString();
    gp(bid).lastStart = new Date(timers[bid].start).toISOString();
    sp();
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
      renderStats();renderHoursBar();renderEasyModeTick();
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
    days.forEach(d=>d.blocks.filter(b=>b.subjectId===s.id).forEach(b=>{
      const hasTopic=b.topic&&b.topic.trim()!=='';
      const hasSub=b.subtopics&&b.subtopics.length>0;
      const hasTasks=gp(b.id).customTasks&&gp(b.id).customTasks.length>0;
      if(hasTopic||hasSub||hasTasks) {
        blocks.push({...b,dayId:d.id,dayIdx:days.indexOf(d)});
      }
    }));
    const stT=blocks.reduce((a,b)=>a+b.subtopics.length+(gp(b.id).customTasks?.length||0),0);
    const stD=blocks.reduce((a,b)=>{const p=gp(b.id);return a+b.subtopics.filter((_,j)=>p.subtopics[j]).length+(p.customTasks||[]).filter(t=>t.done).length;},0);
    const pct=stT?Math.round(stD/stT*100):0;
    html+=`<div class="syl-card" style="animation-delay:${si*.04}s; --subj-color-solid:${getSolidColor(s.color)}; --subj-color-bg:${s.color}">
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
    const res = await fetch("/api/syllabus?_t=" + Date.now());
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
  conf.startDate = formatDateLocal(new Date());
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
  conf.startDate = formatDateLocal(new Date());
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

  const btnAdv = document.getElementById('btnModeAdvanced');
  const btnEasy = document.getElementById('btnModeEasy');
  if (btnAdv && btnEasy) {
    const isEasy = conf.trackerMode === 'easy';
    btnAdv.style.background = !isEasy ? 'var(--blue)' : 'var(--bg2)';
    btnAdv.style.color = !isEasy ? '#fff' : 'var(--ink)';
    btnAdv.style.borderColor = !isEasy ? 'var(--blue)' : 'var(--border)';

    btnEasy.style.background = isEasy ? 'var(--blue)' : 'var(--bg2)';
    btnEasy.style.color = isEasy ? '#fff' : 'var(--ink)';
    btnEasy.style.borderColor = isEasy ? 'var(--blue)' : 'var(--border)';
  }

  document.getElementById('subjListEl').innerHTML=subj.map(s=>`
    <div class="subj-row" onclick="openSubjModal('${s.id}')" style="--subj-color-solid:${getSolidColor(s.color)}; --subj-color-bg:${s.color}">
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

async function pollGroupTimers() {
  if (!window.isInGroup || !window.activeGroup) return;
  try {
    const res = await fetch("/api/study-group");
    if (res.ok) {
      const data = await res.json();
      if (data.joined && data.group) {
        window.activeGroup = data.group;
        updateMemberGridDOM();
      }
    }
  } catch (e) {}
}

function startGroupTimerTicks() {
  if (groupTickInterval) clearInterval(groupTickInterval);
  groupTickInterval = setInterval(() => {
    if (window.isInGroup && window.activeGroup) {
      updateMemberGridDOM();
    }
  }, 1000);
}

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
    <div class="group-landing-grid">
      <!-- Create Group Box -->
      <div class="group-split-card">
        <div class="group-split-graphic">
          <svg width="110" height="110" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M60 100C60 100 50 115 35 115M60 100C60 100 70 115 85 115M60 100V65" stroke="#78350f" stroke-width="6" stroke-linecap="round"/>
            <path d="M60 65C60 45 35 40 30 25M60 65C60 45 85 40 90 25M60 65C60 40 60 20 60 15" stroke="#0284c7" stroke-width="4" stroke-linecap="round"/>
            <circle cx="60" cy="45" r="35" fill="#065f46" fill-opacity="0.6"/>
            <circle cx="42" cy="50" r="25" fill="#047857" fill-opacity="0.7"/>
            <circle cx="78" cy="50" r="25" fill="#10b981" fill-opacity="0.7"/>
            <circle cx="60" cy="30" r="25" fill="#34d399" fill-opacity="0.8"/>
            <g transform="translate(30,20)"><circle cx="10" cy="10" r="9" fill="#fbbf24"/><text x="10" y="13" font-size="5.5" font-weight="900" text-anchor="middle" fill="#78350f">UPSC</text></g>
            <g transform="translate(68,20)"><circle cx="10" cy="10" r="9" fill="#60a5fa"/><text x="10" y="13" font-size="5.5" font-weight="900" text-anchor="middle" fill="#1e3a8a">NEET</text></g>
            <g transform="translate(20,48)"><circle cx="10" cy="10" r="9" fill="#f472b6"/><text x="10" y="13" font-size="5.5" font-weight="900" text-anchor="middle" fill="#831843">JEE</text></g>
            <g transform="translate(80,48)"><circle cx="10" cy="10" r="9" fill="#a7f3d0"/><text x="10" y="13" font-size="5.5" font-weight="900" text-anchor="middle" fill="#064e3b">CA</text></g>
          </svg>
        </div>
        <div class="group-split-content">
          <div class="group-split-title">
            <span>🛠️</span>
            <span>Create a Study Group</span>
          </div>
          <div class="group-split-desc">
            Create a new study group, get an invite code, and invite your friends. You can see each other's live timers.
          </div>
          <input type="text" id="newGroupName" class="group-split-inp" placeholder="e.g. UPSC Prelims Mission 2026" />
          <button class="group-split-btn-create" onclick="handleCreateGroup()">Create Group</button>
        </div>
      </div>

      <!-- Join Group Box -->
      <div class="group-split-card">
        <div class="group-split-graphic">
          <svg width="110" height="110" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M45 25L55 20L65 25L75 22L80 30L88 35L92 48L85 55L75 60L78 72L70 82L60 95L55 85L48 70L40 60L35 48L40 35Z" fill="#ea580c" fill-opacity="0.2" stroke="#f97316" stroke-width="2" stroke-linejoin="round"/>
            <circle cx="60" cy="48" r="10" fill="#ffffff" stroke="#1e40af" stroke-width="1.5"/>
            <circle cx="60" cy="48" r="2.5" fill="#1e40af"/>
            <circle cx="45" cy="38" r="4" fill="#0ea5e9"/>
            <circle cx="75" cy="40" r="4" fill="#0ea5e9"/>
            <circle cx="60" cy="75" r="4" fill="#10b981"/>
            <path d="M45 38L60 48M75 40L60 48M60 75L60 48" stroke="#38bdf8" stroke-width="1.5" stroke-dasharray="3 3"/>
            <g transform="translate(72, 68)">
              <rect width="18" height="18" rx="4" fill="#0ea5e9"/>
              <path d="M9 4V7M9 11V14M4 9H7M11 9H14" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>
            </g>
          </svg>
        </div>
        <div class="group-split-content">
          <div class="group-split-title">
            <span>👥</span>
            <span>Join a Study Group</span>
          </div>
          <div class="group-split-desc">
            Enter a 6-character study group invite code shared by your friend to join their group and study together.
          </div>
          <input type="text" id="groupInviteCode" class="group-split-inp" placeholder="E.G. AB12CD" style="text-transform:uppercase" maxLength="6" />
          <button class="group-split-btn-join" onclick="handleJoinGroup()">Join Group</button>
        </div>
      </div>
    </div>
  `;
}

function parseMemberTrackerData(m) {
  if (!m) return { subj: [], days: [], prog: {}, conf: {} };
  if (m.studyTracker) {
    if (typeof m.studyTracker === 'string') {
      try { return JSON.parse(m.studyTracker); } catch (e) {}
    } else if (typeof m.studyTracker === 'object') {
      return m.studyTracker;
    }
  }
  return { subj: [], days: [], prog: {}, conf: {} };
}

function getMemberDayTotalSec(m, targetDateObj = new Date()) {
  if (!m) return 0;
  let totalSec = 0;
  try {
    const data = parseMemberTrackerData(m);
    const targetY = targetDateObj.getFullYear();
    const targetM = targetDateObj.getMonth();
    const targetD = targetDateObj.getDate();

    (data.days || []).forEach(d => {
      let dDate = d.dateOverride ? parseDateLocal(d.dateOverride) : null;
      if (dDate && dDate.getFullYear() === targetY && dDate.getMonth() === targetM && dDate.getDate() === targetD) {
        (d.blocks || []).forEach(b => {
          const p = (data.prog || {})[b.id] || {};
          if (p.timeSpent && p.timeSpent > 0) {
            totalSec += p.timeSpent;
          } else if (p.completed || p.done) {
            totalSec += (b.targetHrs || 3) * 3600;
          }
        });
      }
    });

    if (m.timerBid && m.timerStart) {
      const start = new Date(m.timerStart).getTime();
      const elapsed = Math.max(0, Math.floor((Date.now() - start) / 1000));
      const liveSec = (m.timerBase || 0) + elapsed;
      totalSec = Math.max(totalSec, liveSec);
    }
  } catch (e) {
    console.error("Error computing member day total sec:", e);
  }
  return totalSec;
}

function renderOwnedGroupsUI(ownedGroups = []) {
  window.latestOwnedGroups = ownedGroups;
  const container = document.getElementById('ownedGroupsContent');
  if (!container) return;

  if (ownedGroups.length === 0) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = `
    <div style="margin-top:24px;">
      <div style="font-size:12px;font-weight:800;color:var(--ink3);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:12px;display:flex;align-items:center;gap:6px">
        <span>🔑</span>
        <span>YOUR CREATED GROUPS</span>
      </div>

      <div style="display:flex;flex-direction:column;gap:12px;">
        ${ownedGroups.map(og => {
          const membersCount = og._count?.members || (og.members ? og.members.length : 1);
          const activeCount = og.members ? og.members.filter(m => !!m.timerBid).length : 0;
          
          let totalGroupSec = 0;
          if (og.members && og.members.length > 0) {
            og.members.forEach(m => {
              totalGroupSec += getMemberDayTotalSec(m, new Date());
            });
          }

          const currentHrs = Math.round((totalGroupSec / 3600) * 10) / 10;
          const targetHrs = Math.max(6, membersCount * 6);
          const progressPct = Math.min(100, Math.round((currentHrs / targetHrs) * 100));

          return `
            <div class="created-group-row">
              <!-- Left: Emblem & Name -->
              <div style="display:flex;align-items:center;gap:14px;min-width:200px">
                <div class="group-emblem-box">🔥</div>
                <div>
                  <div style="font-size:15px;font-weight:800;color:var(--ink);display:flex;align-items:center;gap:6px">
                    <span>${esc(og.name)}</span>
                    <span style="font-size:10px;background:rgba(200,149,32,0.15);color:var(--gold);border:1px solid var(--gold);padding:1px 6px;border-radius:6px;font-weight:800">👑 Admin</span>
                  </div>
                  <div style="font-size:11px;color:var(--ink3);margin-top:2px">
                    Members: <strong>${membersCount}</strong>
                    <span style="color:var(--blue);margin-left:4px;cursor:pointer;font-weight:700" onclick="openGroupManagementModal('${og.id}')">(see list)</span>
                  </div>
                </div>
              </div>

              <!-- Middle: Study Hour Goal Tracker -->
              <div style="flex:1;min-width:180px;max-width:260px">
                <div style="display:flex;justify-content:space-between;align-items:center;font-size:11px;font-weight:700;color:var(--ink2);margin-bottom:4px">
                  <span>Study Hour Goal Tracker</span>
                  <span style="color:var(--ink3);font-family:monospace">${currentHrs} hr / ${targetHrs} hr</span>
                </div>
                <div style="width:100%;height:6px;background:var(--bg2);border-radius:3px;overflow:hidden">
                  <div style="width:${progressPct}%;height:100%;background:linear-gradient(90deg, #10b981, #34d399);border-radius:3px"></div>
                </div>
              </div>

              <!-- Right Middle: Live Status -->
              <div style="display:flex;align-items:center;gap:10px;min-width:130px">
                <div>
                  <div style="font-size:10px;font-weight:700;color:var(--ink3);text-transform:uppercase">Live Status</div>
                  <div style="font-size:13px;font-weight:800;color:var(--green);display:flex;align-items:center;gap:6px;margin-top:2px">
                    <span style="width:8px;height:8px;border-radius:50%;background:var(--green);box-shadow:0 0 8px var(--green)"></span>
                    <span>${activeCount}/${membersCount} Active</span>
                  </div>
                </div>
              </div>

              <!-- Right: Buttons -->
              <div style="display:flex;align-items:center;gap:8px">
                <button class="created-group-btn-enter" onclick="quickJoinOwnedGroup('${og.code}')">Enter Group</button>
                <button class="created-group-btn-enter" style="background:var(--bg2);color:var(--ink);border-color:var(--border)" onclick="openGroupManagementModal('${og.id}')">⚙️ Settings</button>
                <button class="created-group-btn-delete" onclick="handleDeleteGroup('${og.id}')">Delete</button>
              </div>
            </div>
          `;
        }).join('')}
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

async function pushGroupTimerState(bid) {
  if (!window.activeGroup) return;
  try {
    let subject = null;
    let topic = null;
    if (bid) {
      for (let d of (days || [])) {
        const b = (d.blocks || []).find(blk => blk.id === bid);
        if (b) {
          const s = sj(b.subjectId);
          subject = s.name;
          topic = b.topic || '';
          break;
        }
      }
    }
    fetch("/api/study-group", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "update_timer",
        timerBid: bid || null,
        timerStart: bid ? new Date().toISOString() : null,
        timerBase: bid ? (gp(bid).timeSpent || 0) : 0,
        subject,
        topic
      })
    }).catch(() => {});
  } catch (e) {}
}

function updateMemberGridDOM() {
  const g = window.activeGroup;
  if (!g || !g.members) return;
  const grid = document.getElementById("memberGridEl");
  if (!grid) return;

  const existingCards = grid.querySelectorAll(".member-card");
  if (existingCards.length !== g.members.length) {
    grid.innerHTML = renderMemberGridHtml();
    return;
  }

  g.members.forEach(m => {
    const card = grid.querySelector(`.member-card[data-user-id="${m.userId}"]`);
    if (!card) {
      grid.innerHTML = renderMemberGridHtml();
      return;
    }

    const isStudying = !!m.timerBid;
    let timerText = '00:00:00';
    let subjectText = isStudying ? (m.subject || 'Study Block') : 'Idle';
    let topicText = isStudying ? (m.topic || 'General study') : 'Tap to view member details';

    if (isStudying && m.timerStart) {
      const start = new Date(m.timerStart).getTime();
      const elapsed = Math.max(0, Math.floor((Date.now() - start) / 1000));
      const total = (m.timerBase || 0) + elapsed;
      const th = Math.floor(total / 3600), tm = Math.floor((total % 3600) / 60), ts = total % 60;
      timerText = `${String(th).padStart(2,'0')}:${String(tm).padStart(2,'0')}:${String(ts).padStart(2,'0')}`;
    }

    card.className = isStudying ? 'member-card studying' : 'member-card';

    const timerDisplay = card.querySelector('.member-timer-display');
    if (timerDisplay) {
      if (timerDisplay.textContent !== timerText) timerDisplay.textContent = timerText;
      timerDisplay.style.color = isStudying ? '#c084fc' : 'var(--ink3)';
    }

    const statusLbl = card.querySelector('.member-status-lbl');
    if (statusLbl) {
      statusLbl.className = isStudying ? 'member-status-lbl studying' : 'member-status-lbl idle';
      statusLbl.innerHTML = isStudying ? `<span class="pulse-dot"></span>Studying` : 'Idle';
    }

    const subjEl = card.querySelector('.member-subj-text');
    if (subjEl && subjEl.textContent !== subjectText) {
      subjEl.textContent = subjectText;
    }

    const topicEl = card.querySelector('.member-topic-text');
    if (topicEl && topicEl.textContent !== topicText) {
      topicEl.textContent = topicText;
      topicEl.title = topicText;
    }

    const btn = card.querySelector('.member-session-btn');
    if (btn) {
      btn.style.background = isStudying ? '#d94f3d' : '#c084fc';
      btn.style.borderColor = isStudying ? '#d94f3d' : '#c084fc';
      btn.innerHTML = `<span>${isStudying ? '⏸️' : '▶️'}</span><span>${isStudying ? 'Pause Session' : 'Start Session'}</span>`;
    }

    let flame = card.querySelector('.member-card-flame');
    if (isStudying && !flame) {
      flame = document.createElement('span');
      flame.className = 'member-card-flame';
      flame.title = 'Active Focus!';
      flame.textContent = '🔥';
      card.insertBefore(flame, card.firstChild);
    } else if (!isStudying && flame) {
      flame.remove();
    }
  });
}

function toggleGroupStudySession() {
  let runningBid = null;
  let runningDayId = null;

  if (typeof days !== 'undefined' && days && days.length > 0) {
    for (let d of days) {
      for (let b of (d.blocks || [])) {
        if (timers[b.id]?.running) {
          runningBid = b.id;
          runningDayId = d.id;
          break;
        }
      }
      if (runningBid) break;
    }
  }

  if (runningBid && runningDayId) {
    // Pause currently running session instantly
    toggleTimer(runningBid, runningDayId);
    if (window.activeGroup && window.activeGroup.members) {
      const selfMem = window.activeGroup.members.find(m => m.isSelf);
      if (selfMem) {
        selfMem.timerBid = null;
        selfMem.timerStart = null;
        selfMem.timerBase = 0;
      }
      updateMemberGridDOM();
    }
  } else {
    // Start session on active day's first incomplete block
    const targetDayIndex = (typeof curDay !== 'undefined' && curDay >= 0 && curDay < days.length) ? curDay : 0;
    const targetDay = days[targetDayIndex] || days[0];

    if (!targetDay || !targetDay.blocks || targetDay.blocks.length === 0) {
      alert("Please add at least one subject block in your study planner first!");
      return;
    }

    const incompleteBlock = targetDay.blocks.find(b => !prog[b.id]?.completed) || targetDay.blocks[0];
    toggleTimer(incompleteBlock.id, targetDay.id);

    if (window.activeGroup && window.activeGroup.members) {
      const selfMem = window.activeGroup.members.find(m => m.isSelf);
      if (selfMem) {
        const s = sj(incompleteBlock.subjectId);
        selfMem.timerBid = incompleteBlock.id;
        selfMem.timerStart = new Date().toISOString();
        selfMem.timerBase = (gp(incompleteBlock.id).timeSpent || 0);
        selfMem.subject = s.name;
        selfMem.topic = incompleteBlock.topic || '';
      }
      updateMemberGridDOM();
    }
  }
}

function renderActiveGroupUI(container) {
  const g = window.activeGroup;
  if (!g) return;

  const selfMember = g.members.find(m => m.isSelf);
  const userIsOwner = g.ownerId && selfMember && g.ownerId === selfMember.userId;
  const selfIsStudying = selfMember && !!selfMember.timerBid;
  const studyingCount = g.members.filter(m => !!m.timerBid).length;
  const totalCount = g.members.length;

  const actionButtons = userIsOwner 
    ? `<button class="hbtn" style="background:var(--bg2);color:var(--ink);border-color:var(--border)" onclick="openGroupManagementModal('${g.id}')">⚙️ Group Settings</button>
       <button class="hbtn" style="background:var(--bg2);color:var(--ink);border-color:var(--border)" onclick="handleLeaveGroup()">🚪 Leave Group</button>
       <button class="hbtn" style="background:#d94f3d;color:#fff;border-color:#d94f3d" onclick="handleDeleteGroup('${g.id}')">🗑️ Delete Group</button>`
    : `<button class="hbtn" style="background:var(--bg2);color:var(--ink);border-color:var(--border)" onclick="openGroupManagementModal('${g.id}')">👥 Members</button>
       <button class="hbtn" style="background:var(--bg2);color:var(--ink);border-color:var(--border)" onclick="handleLeaveGroup()">🚪 Leave Group</button>`;

  container.innerHTML = `
    <div class="group-card">
      <div class="group-header-row">
        <div>
          <div class="group-title-label">${esc(g.name)} ${userIsOwner ? '<span style="font-size:10px;background:rgba(200,149,32,0.15);color:var(--gold);border:1px solid var(--gold);padding:2px 8px;border-radius:6px;font-weight:800;vertical-align:middle;margin-left:6px">👑 Admin</span>' : ''}</div>
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

      <!-- Image 1 Top Header Summary: Active & Inactive member counter -->
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:8px">
        <div style="font-size:15px;font-weight:800;color:var(--ink)">
          <span style="color:#c084fc">${studyingCount} members</span> Studying
          <span style="font-size:12px;color:var(--ink3);font-weight:600;margin-left:6px">• ${totalCount - studyingCount} Idle</span>
        </div>
        <div style="font-size:11px;font-weight:700;color:var(--ink3);background:var(--bg2);padding:4px 10px;border-radius:8px;border:1px solid var(--border)">
          💡 Click any member card to view details & statistics
        </div>
      </div>

      <div class="member-grid" id="memberGridEl">
        ${renderMemberGridHtml()}
      </div>
    </div>
  `;
}

function openGroupManagementModal(groupId) {
  let g = null;
  if (window.activeGroup && (!groupId || String(window.activeGroup.id) === String(groupId))) {
    g = window.activeGroup;
  }
  if (!g && window.latestOwnedGroups && window.latestOwnedGroups.length > 0) {
    g = groupId ? window.latestOwnedGroups.find(og => String(og.id) === String(groupId)) : window.latestOwnedGroups[0];
    if (!g) g = window.latestOwnedGroups[0];
  }
  if (!g && window.activeGroup) {
    g = window.activeGroup;
  }

  if (!g) {
    alert("Group settings unavailable. Please join or create a study group first.");
    return;
  }

  window.selectedGroupForManage = g;

  const modalTitle = document.getElementById('gmModalTitle');
  if (modalTitle) modalTitle.textContent = `👥 ${g.name} — Settings & Members`;

  const inviteCodeEl = document.getElementById('gmInviteCodeLabel');
  if (inviteCodeEl) inviteCodeEl.textContent = g.code;

  const copyBtn = document.getElementById('gmCopyCodeBtn');
  if (copyBtn) copyBtn.onclick = () => copyGroupCode(g.code);

  const isOwnedGroup = window.latestOwnedGroups && window.latestOwnedGroups.some(og => String(og.id) === String(g.id));
  const selfMember = (g.members || []).find(m => m.isSelf);
  const isOwner = isOwnedGroup || (g.ownerId && selfMember && g.ownerId === selfMember.userId);

  const adminNameSection = document.getElementById('gmAdminNameSection');
  const groupNameInp = document.getElementById('gmGroupNameInp');
  if (adminNameSection && groupNameInp) {
    if (isOwner) {
      adminNameSection.style.display = 'block';
      groupNameInp.value = g.name;
    } else {
      adminNameSection.style.display = 'none';
    }
  }

  const membersListEl = document.getElementById('gmMembersList');
  const countLabel = document.getElementById('gmMembersCountLabel');
  const members = g.members || [];
  if (countLabel) countLabel.textContent = `${members.length} members`;

  if (membersListEl) {
    if (members.length === 0) {
      membersListEl.innerHTML = `<div style="text-align:center;color:var(--ink3);font-size:13px;padding:16px">No members found.</div>`;
    } else {
      membersListEl.innerHTML = members.map(m => {
        const isMemOwner = g.ownerId ? m.userId === g.ownerId : m.isSelf;
        const isStudying = !!m.timerBid;
        const totalSec = getMemberDayTotalSec(m, new Date());
        const hrsStr = `${Math.floor(totalSec / 3600)}h ${Math.floor((totalSec % 3600) / 60)}m`;

        return `
          <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:var(--bg2);border:1px solid var(--border);border-radius:10px;gap:10px">
            <div style="display:flex;align-items:center;gap:10px;flex:1;min-width:0">
              <div style="width:34px;height:34px;border-radius:50%;background:var(--card);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:14px;color:var(--ink);flex-shrink:0">
                ${m.image ? `<img src="${esc(m.image)}" style="width:100%;height:100%;border-radius:50%;object-fit:cover" />` : (m.name ? m.name.charAt(0).toUpperCase() : '👤')}
              </div>
              <div style="min-width:0">
                <div style="font-size:13px;font-weight:700;color:var(--ink);display:flex;align-items:center;gap:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
                  <span>${esc(m.name)}</span>
                  ${m.isSelf ? '<span style="font-size:10px;color:var(--ink3)">(You)</span>' : ''}
                  ${isMemOwner ? '<span style="font-size:10px;background:rgba(200,149,32,0.15);color:var(--gold);border:1px solid var(--gold);padding:1px 6px;border-radius:6px;font-weight:800">👑 Admin</span>' : ''}
                </div>
                <div style="font-size:11px;color:var(--ink3);margin-top:2px">
                  Today: <strong>${hrsStr}</strong> • <span style="color:${isStudying ? 'var(--green)' : 'var(--ink3)'}">${isStudying ? '🔥 Studying' : '⏸️ Idle'}</span>
                </div>
              </div>
            </div>

            ${isOwner && !m.isSelf ? `
              <button onclick="handleRemoveGroupMember('${g.id}', '${m.userId}', '${esc(m.name)}')" class="hbtn" style="background:rgba(217,79,61,0.12);color:#d94f3d;border:1px solid #d94f3d;font-weight:700;height:28px;font-size:11px;padding:0 10px;border-radius:6px">
                Remove
              </button>
            ` : ''}
          </div>
        `;
      }).join('');
    }
  }

  openModal('groupManageOverlay');
}

async function saveGroupNameFromModal() {
  const g = window.selectedGroupForManage;
  const inp = document.getElementById('gmGroupNameInp');
  if (!g || !inp) return;

  const newName = inp.value.trim();
  if (!newName) {
    alert("Please enter a valid group name.");
    return;
  }

  try {
    const res = await fetch("/api/study-group", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update_group", groupId: g.id, name: newName })
    });
    if (res.ok) {
      closeModal('groupManageOverlay');
      renderGroup();
      alert("Group name updated successfully! 🎉");
    } else {
      const data = await res.json();
      alert(data.message || "Failed to update group name");
    }
  } catch (err) {
    alert("Error updating group name");
  }
}

async function handleRemoveGroupMember(groupId, targetUserId, memberName) {
  if (!confirm(`Are you sure you want to remove ${memberName || 'this member'} from the group?`)) return;

  try {
    const res = await fetch("/api/study-group", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "remove_member", groupId, targetUserId })
    });
    if (res.ok) {
      closeModal('groupManageOverlay');
      renderGroup();
      alert(`Member removed from group.`);
    } else {
      const data = await res.json();
      alert(data.message || "Failed to remove member");
    }
  } catch (err) {
    alert("Error removing member");
  }
}

function renderMemberGridHtml() {
  const g = window.activeGroup;
  if (!g || !g.members) return '';

  return g.members.map(m => {
    const isStudying = !!m.timerBid;
    let timerText = '00:00:00';
    let subjectText = isStudying ? (m.subject || 'Study Block') : 'Idle';
    let topicText = isStudying ? (m.topic || 'General study') : 'Tap to view member details';

    if (isStudying && m.timerStart) {
      const start = new Date(m.timerStart).getTime();
      const elapsed = Math.floor((Date.now() - start) / 1000);
      const total = Math.max(0, (m.timerBase || 0) + elapsed);
      const th = Math.floor(total / 3600), tm = Math.floor((total % 3600) / 60), ts = total % 60;
      timerText = `${String(th).padStart(2,'0')}:${String(tm).padStart(2,'0')}:${String(ts).padStart(2,'0')}`;
    }

    const cardClass = isStudying ? 'member-card studying' : 'member-card';
    const statusClass = isStudying ? 'member-status-lbl studying' : 'member-status-lbl idle';
    const statusText = isStudying ? `<span class="pulse-dot"></span>Studying` : 'Idle';
    const flameBadge = isStudying ? `<span class="member-card-flame" title="Active Focus!">🔥</span>` : '';

    // Avatar
    let avatarMarkup = '';
    if (m.image) {
      avatarMarkup = `<img src="${esc(m.image)}" class="member-avatar-img ${isStudying ? 'studying' : ''}" alt="${esc(m.name)}" />`;
    } else {
      const initial = m.name ? m.name.charAt(0).toUpperCase() : '👤';
      avatarMarkup = `<div class="member-avatar-img ${isStudying ? 'studying' : ''}" style="background:var(--bg2);display:flex;align-items:center;justify-content:center;font-weight:800;color:var(--ink)">${initial}</div>`;
    }

    return `
      <div class="${cardClass}" onclick="openMemberDetails('${m.userId}')" data-user-id="${m.userId}" data-timer-start="${m.timerStart || ''}" data-timer-base="${m.timerBase || 0}">
        ${flameBadge}
        <div class="member-card-header" style="border-bottom:none;padding-bottom:0">
          <div style="display:flex;align-items:center;gap:10px;overflow:hidden">
            ${avatarMarkup}
            <div>
              <div class="member-name">${esc(m.name)}${m.isSelf ? ' <span style="font-size:11px;color:var(--blue);font-weight:600">(You)</span>' : ''}</div>
              <div class="${statusClass}" style="margin-top:2px;display:inline-block">${statusText}</div>
            </div>
          </div>
        </div>

        <div style="margin-top:6px;padding-top:8px;border-top:1px solid var(--border)">
          <div style="font-size:12px;color:var(--ink2);font-weight:700;display:flex;align-items:center;gap:6px">
            <span>📚</span>
            <span class="member-subj-text" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(subjectText)}</span>
          </div>
          <div class="member-topic-text" style="font-size:11px;color:var(--ink3);margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="${esc(topicText)}">
            ${esc(topicText)}
          </div>
        </div>

        <div style="font-size:22px;font-weight:800;font-family:monospace;letter-spacing:-0.02em;margin-top:8px;color:${isStudying ? '#c084fc' : 'var(--ink3)'};display:flex;justify-content:space-between;align-items:center" class="member-timer-val">
          <span class="member-timer-display">${timerText}</span>
          <span style="font-size:11px;font-weight:700;color:var(--ink3);font-family:sans-serif">Stats ➔</span>
        </div>

        ${m.isSelf ? `
          <button onclick="event.stopPropagation(); toggleGroupStudySession();" class="hbtn member-session-btn" style="width:100%;margin-top:8px;background:${isStudying ? '#d94f3d' : '#c084fc'};color:#fff;border-color:${isStudying ? '#d94f3d' : '#c084fc'};font-weight:800;height:30px;font-size:12px;border-radius:8px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:4px;flex-shrink:0">
            <span>${isStudying ? '⏸️' : '▶️'}</span>
            <span>${isStudying ? 'Pause Session' : 'Start Session'}</span>
          </button>
        ` : ''}
      </div>
    `;
  }).join('');
}

window.selectedGroupMember = null;
window.statsCurrentDate = new Date();

function getMemberTrackerData(m) {
  if (m && m.isSelf && typeof days !== 'undefined' && days.length > 0) {
    return {
      subj: subj || [],
      days: days || [],
      prog: prog || {},
      conf: conf || {},
      profileInfo: m.studyTracker?.profileInfo || {}
    };
  }
  const t = (m && m.studyTracker) || {};
  return {
    subj: t.subj || [],
    days: t.days || [],
    prog: t.prog || {},
    conf: t.conf || {},
    profileInfo: t.profileInfo || {}
  };
}

function getMemberDayStats(m, targetDateObj) {
  const data = getMemberTrackerData(m);
  const targetY = targetDateObj.getFullYear();
  const targetM = targetDateObj.getMonth();
  const targetD = targetDateObj.getDate();

  const startDate = data.conf.startDate ? parseDateLocal(data.conf.startDate) : new Date();
  
  let dayTotalSec = 0;
  let maxBlockSec = 0;
  let subjectSecMap = {}; // subjectId -> seconds
  let completedBlocks = 0;
  let earliestStart = null;
  let latestEnd = null;

  (data.days || []).forEach((d, idx) => {
    let dDate = d.dateOverride ? parseDateLocal(d.dateOverride) : new Date(startDate.getTime() + idx * 86400000);
    
    if (dDate.getFullYear() === targetY && dDate.getMonth() === targetM && dDate.getDate() === targetD) {
      (d.blocks || []).forEach(b => {
        const p = data.prog[b.id] || {};
        
        if (p.startTime || p.lastStart) {
          const t = new Date(p.startTime || p.lastStart).getTime();
          if (!earliestStart || t < earliestStart) earliestStart = t;
        }
        if (p.lastEnd) {
          const t = new Date(p.lastEnd).getTime();
          if (!latestEnd || t > latestEnd) latestEnd = t;
        }

        let blockSec = 0;

        if (p.timeSpent && p.timeSpent > 0) {
          blockSec = p.timeSpent;
        } else if (p.completed || p.done) {
          blockSec = (b.targetHrs || 3) * 3600;
        } else if (p.subtopics) {
          const totalSub = (b.subtopics || []).length;
          const doneSub = Object.values(p.subtopics).filter(Boolean).length;
          if (totalSub > 0 && doneSub > 0) {
            blockSec = Math.round(((b.targetHrs || 3) * 3600) * (doneSub / totalSub));
          }
        }

        if (blockSec > 0) {
          dayTotalSec += blockSec;
          if (blockSec > maxBlockSec) maxBlockSec = blockSec;
          completedBlocks++;

          const sId = b.subjectId || (data.subj[0]?.id || 's1');
          subjectSecMap[sId] = (subjectSecMap[sId] || 0) + blockSec;
        }
      });
    }
  });

  // If member is currently studying today
  const isStudying = !!m.timerBid;
  const isToday = (new Date().getFullYear() === targetY && new Date().getMonth() === targetM && new Date().getDate() === targetD);
  if (isStudying && isToday && m.timerStart) {
    const start = new Date(m.timerStart).getTime();
    if (!earliestStart || start < earliestStart) earliestStart = start;
    const elapsed = Math.floor((Date.now() - start) / 1000);
    const liveSec = Math.max(0, (m.timerBase || 0) + elapsed);
    dayTotalSec = Math.max(dayTotalSec, liveSec);
    if (liveSec > maxBlockSec) maxBlockSec = liveSec;

    if (m.subject) {
      const matchingSubj = (data.subj || []).find(s => s.name === m.subject);
      const sId = matchingSubj ? matchingSubj.id : (data.subj[0]?.id || 's1');
      subjectSecMap[sId] = Math.max(subjectSecMap[sId] || 0, liveSec);
    }
  }

  return {
    dayTotalSec,
    maxBlockSec,
    subjectSecMap,
    completedBlocks,
    earliestStart,
    latestEnd
  };
}

function openMemberDetails(userId) {
  const g = window.activeGroup;
  if (!g || !g.members) return;
  const m = g.members.find(mem => mem.userId === userId);
  if (!m) return;

  window.selectedGroupMember = m;

  // Set Avatar & Name & Bio
  const avatarEl = document.getElementById('mdAvatar');
  if (avatarEl) {
    if (m.image) {
      avatarEl.innerHTML = `<img src="${esc(m.image)}" alt="${esc(m.name)}" />`;
    } else {
      avatarEl.textContent = m.name ? m.name.charAt(0).toUpperCase() : '👤';
    }
  }

  const nameEl = document.getElementById('mdName');
  if (nameEl) nameEl.textContent = m.name + (m.isSelf ? ' (You)' : '');

  const trackerData = getMemberTrackerData(m);
  const bioEl = document.getElementById('mdBio');
  const userBio = trackerData.profileInfo?.bio || 'Dedicated Aspirant | Focused on daily targets 🎯';
  if (bioEl) bioEl.textContent = `💬 "${userBio}"`;

  // Get REAL today stats from tracker
  const todayStats = getMemberDayStats(m, new Date());

  // Compute live session stats
  const isStudying = !!m.timerBid;
  let timerText = '00:00:00';
  let startTimeText = '---';
  let endTimeText = isStudying ? 'Studying' : (todayStats.dayTotalSec > 0 ? 'Finished' : 'Idle');

  if (isStudying && m.timerStart) {
    const start = new Date(m.timerStart);
    startTimeText = start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const elapsed = Math.floor((Date.now() - start.getTime()) / 1000);
    const total = Math.max(0, (m.timerBase || 0) + elapsed);
    const th = Math.floor(total / 3600), tm = Math.floor((total % 3600) / 60), ts = total % 60;
    timerText = `${String(th).padStart(2,'0')}:${String(tm).padStart(2,'0')}:${String(ts).padStart(2,'0')}`;
  } else if (todayStats.earliestStart) {
    startTimeText = new Date(todayStats.earliestStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (todayStats.dayTotalSec > 0) {
    const computedStart = new Date(Date.now() - todayStats.dayTotalSec * 1000);
    startTimeText = computedStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  if (!isStudying && todayStats.latestEnd) {
    endTimeText = new Date(todayStats.latestEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  
  const maxFocusSec = todayStats.maxBlockSec;
  const maxFocusHrs = maxFocusSec > 0
    ? `${Math.floor(maxFocusSec / 3600)}:${String(Math.floor((maxFocusSec % 3600) / 60)).padStart(2,'0')}:${String(maxFocusSec % 60).padStart(2,'0')}`
    : "0:00:00";

  const targetSubject = m.subject || trackerData.profileInfo?.optionalSubject || (trackerData.subj?.[0]?.name || "General Studies");

  const sessionCard = document.getElementById('mdSessionCard');
  if (sessionCard) {
    sessionCard.innerHTML = `
      <div style="text-align:center;padding:8px 0;border-bottom:1px solid var(--border)">
        <div style="font-size:32px;font-weight:900;font-family:monospace;letter-spacing:-0.03em;color:${isStudying ? '#c084fc' : 'var(--ink)'}">
          ${timerText}
        </div>
        <div style="font-size:11px;font-weight:700;color:var(--ink3);text-transform:uppercase;margin-top:2px">
          ${isStudying ? '🔥 Active Focus Session' : '⏸️ Session Paused / Idle'}
        </div>
      </div>

      <div class="session-grid-2x2">
        <div class="session-grid-cell">
          <div class="session-grid-label">Start Time</div>
          <div class="session-grid-val">${startTimeText}</div>
        </div>
        <div class="session-grid-cell">
          <div class="session-grid-label">End Time</div>
          <div class="session-grid-val" style="color:${isStudying ? 'var(--green)' : 'var(--ink)'}">${endTimeText}</div>
        </div>
        <div class="session-grid-cell">
          <div class="session-grid-label">Max Focus</div>
          <div class="session-grid-val">${maxFocusHrs}</div>
        </div>
      </div>

      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:4px;padding-top:8px;border-top:1px solid var(--border);font-size:12px">
        <span style="color:var(--ink3)">Target Subject</span>
        <span style="font-weight:700;color:#c084fc">📚 ${esc(targetSubject)}</span>
      </div>

      ${m.isSelf ? `
        <button onclick="toggleGroupStudySession(); closeModal('memberDetailOverlay');" class="hbtn" style="width:100%;margin-top:10px;background:${isStudying ? '#d94f3d' : '#c084fc'};color:#fff;border-color:${isStudying ? '#d94f3d' : '#c084fc'};font-weight:800;height:36px;border-radius:10px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px">
          <span>${isStudying ? '⏸️' : '▶️'}</span>
          <span>${isStudying ? 'Pause Study Session' : 'Start Study Session'}</span>
        </button>
      ` : ''}
    `;
  }

  openModal('memberDetailOverlay');
}

function triggerMemberNudge() {
  const m = window.selectedGroupMember;
  if (!m) return;
  alert(`⚡ Nudge sent to ${m.name}! "Keep pushing hard! 💪"`);
}

function openSelectedMemberStats() {
  closeModal('memberDetailOverlay');
  const m = window.selectedGroupMember;
  if (!m) return;
  
  window.statsCurrentDate = new Date();
  renderMemberStats(m);
  openModal('memberStatsOverlay');
}

function changeStatsMonth(delta) {
  window.statsCurrentDate.setMonth(window.statsCurrentDate.getMonth() + delta);
  if (window.selectedGroupMember) {
    renderMemberStats(window.selectedGroupMember);
  }
}

function switchStatsPeriod(period) {
  ['stTabDay', 'stTabWeek', 'stTabMonth'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('active');
  });
  const activeEl = document.getElementById('stTab' + period.charAt(0).toUpperCase() + period.slice(1));
  if (activeEl) activeEl.classList.add('active');

  if (window.selectedGroupMember) {
    renderMemberStats(window.selectedGroupMember);
  }
}

function selectStatsDay(day) {
  const cells = document.querySelectorAll('.stats-heatmap-cell');
  cells.forEach(c => c.classList.remove('selected'));
  if (event && event.currentTarget) {
    event.currentTarget.classList.add('selected');
  }
  
  window.statsCurrentDate.setDate(day);
  if (window.selectedGroupMember) {
    renderMemberStats(window.selectedGroupMember);
  }
}

function renderMemberStats(m) {
  const trackerData = getMemberTrackerData(m);
  const selectedDate = new Date(window.statsCurrentDate.getTime());
  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth(); // 0-11
  
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthLabelEl = document.getElementById('msMonthLabel');
  if (monthLabelEl) monthLabelEl.textContent = `${monthNames[month]} ${year}`;

  // 1. Render REAL Heatmap Grid for the Month
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const heatmapGridEl = document.getElementById('msHeatmapGrid');
  
  if (heatmapGridEl) {
    let html = '';
    // Day of week headers (Mon-Sun)
    ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].forEach(d => {
      html += `<div style="font-size:10px;font-weight:700;color:var(--ink3);text-align:center;margin-bottom:4px">${d}</div>`;
    });

    // Blank cells before day 1
    const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7; // Mon = 0
    for (let i = 0; i < firstDayIndex; i++) {
      html += `<div></div>`;
    }

    // Generate cell for each day of the month using REAL tracker data
    for (let day = 1; day <= daysInMonth; day++) {
      const cellDate = new Date(year, month, day);
      const stats = getMemberDayStats(m, cellDate);
      const totalSec = stats.dayTotalSec;
      const hours = Math.floor(totalSec / 3600);
      const mins = Math.floor((totalSec % 3600) / 60);

      let lvl = 'lvl-0';
      if (hours >= 8) lvl = 'lvl-4';
      else if (hours >= 5) lvl = 'lvl-3';
      else if (hours >= 2) lvl = 'lvl-2';
      else if (totalSec > 0) lvl = 'lvl-1';

      const isSelected = (selectedDate.getDate() === day && selectedDate.getMonth() === month);

      html += `
        <div class="stats-heatmap-cell ${lvl} ${isSelected ? 'selected' : ''}" onclick="selectStatsDay(${day})">
          <span>${day}</span>
          ${totalSec > 0 ? `<span class="cell-hours">${hours}:${String(mins).padStart(2,'0')}</span>` : ''}
        </div>
      `;
    }
    heatmapGridEl.innerHTML = html;
  }

  // 2. Render REAL Day Stats for Selected Date
  const selectedHeader = document.getElementById('msSelectedDateHeader');
  if (selectedHeader) {
    const dayName = selectedDate.toLocaleDateString('en-US', { weekday: 'short' });
    selectedHeader.textContent = `${dayName}, ${monthNames[month]} ${selectedDate.getDate()}`;
  }

  const selectedStats = getMemberDayStats(m, selectedDate);
  const totalSec = selectedStats.dayTotalSec;
  const th = Math.floor(totalSec / 3600), tm = Math.floor((totalSec % 3600) / 60), ts = totalSec % 60;
  const totalStr = `${th}:${String(tm).padStart(2,'0')}:${String(ts).padStart(2,'0')}`;

  const maxSec = selectedStats.maxBlockSec;
  const mh = Math.floor(maxSec / 3600), mm = Math.floor((maxSec % 3600) / 60), ms = maxSec % 60;
  const maxStr = maxSec > 0 ? `${mh}:${String(mm).padStart(2,'0')}:${String(ms).padStart(2,'0')}` : "0:00:00";

  const isStudying = !!m.timerBid;
  const isToday = (new Date().getFullYear() === selectedDate.getFullYear() && new Date().getMonth() === selectedDate.getMonth() && new Date().getDate() === selectedDate.getDate());

  let startStr = "---";
  if (isStudying && isToday && m.timerStart) {
    startStr = new Date(m.timerStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (selectedStats.earliestStart) {
    startStr = new Date(selectedStats.earliestStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (totalSec > 0) {
    const computedStart = new Date(Date.now() - totalSec * 1000);
    startStr = computedStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  let endStr = "---";
  if (isStudying && isToday) {
    endStr = `<span style="color:var(--green)">Studying</span>`;
  } else if (selectedStats.latestEnd) {
    endStr = new Date(selectedStats.latestEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (totalSec > 0) {
    endStr = "Finished";
  }

  const dayBox = document.getElementById('msDayBox');
  if (dayBox) {
    dayBox.innerHTML = `
      <div class="session-grid-2x2">
        <div class="session-grid-cell">
          <div class="session-grid-label">Total study time</div>
          <div class="session-grid-val" style="color:#c084fc">${totalStr}</div>
        </div>
        <div class="session-grid-cell">
          <div class="session-grid-label">Max focus time</div>
          <div class="session-grid-val">${maxStr}</div>
        </div>
        <div class="session-grid-cell">
          <div class="session-grid-label">Start time</div>
          <div class="session-grid-val">${startStr}</div>
        </div>
        <div class="session-grid-cell">
          <div class="session-grid-label">End time</div>
          <div class="session-grid-val">${endStr}</div>
        </div>
      </div>
    `;
  }

  // 3. Render REAL Subject Breakdown from Tracker Subjects
  const subjSection = document.getElementById('msSubjectsSection');
  if (subjSection) {
    const subjects = trackerData.subj || [];
    const secMap = selectedStats.subjectSecMap || {};

    let html = `
      <div style="font-size:12px;font-weight:800;color:var(--ink3);text-transform:uppercase;margin-bottom:10px;letter-spacing:0.04em">
        📚 Daily Subject Breakdown
      </div>
    `;

    if (subjects.length === 0) {
      html += `<div style="font-size:12px;color:var(--ink3)">No subjects logged for this day</div>`;
    } else {
      subjects.forEach(s => {
        const sec = secMap[s.id] || 0;
        const pct = totalSec > 0 ? Math.round((sec / totalSec) * 100) : 0;
        const sh = Math.floor(sec / 3600);
        const sm = Math.floor((sec % 3600) / 60);
        const hrsStr = sec > 0 ? `${sh}h ${sm}m` : '0h 0m';
        const color = getSolidColor(s.color || 'var(--purple)');

        html += `
          <div class="stat-subject-item">
            <div class="stat-subject-header">
              <span>${s.icon || '📚'} ${esc(s.name)}</span>
              <span style="color:${color}">${hrsStr}</span>
            </div>
            <div class="stat-subject-bar-bg">
              <div class="stat-subject-bar-fill" style="width:${pct}%;background:${color}"></div>
            </div>
          </div>
        `;
      });
    }

    subjSection.innerHTML = html;
  }
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
        updateMemberGridDOM();
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
  const startDateInput=document.getElementById('planStartDate');
  if(startDateInput)startDateInput.value=conf.startDate||formatDateLocal(new Date());
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
  if(startDateInput)startDateInput.value=conf.startDate||formatDateLocal(new Date());
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

  // Sync days with current day when page becomes visible or focused (minimizing/restoring window, switching tabs)
  const syncToCurrentDay = () => {
    if (!days || days.length === 0) return;
    if (!conf.startDate) {
      conf.startDate = formatDateLocal(new Date());
    }
    for (let i = 0; i < days.length; i++) {
      if (isToday(getDd(i))) {
        if (curDay !== i) {
          curDay = i;
          refreshAllViews();
        }
        break;
      }
    }
  };
  window.addEventListener('focus', syncToCurrentDay);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      syncToCurrentDay();
    }
  });
});
