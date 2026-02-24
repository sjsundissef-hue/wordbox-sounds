const SoundFX = {
    ctx:null, _init(){ if(!this.ctx) this.ctx=new(window.AudioContext||window.webkitAudioContext)(); },
    play(type){ try{ this._init(); const ctx=this.ctx;
        if(type==='correct'){ const o=ctx.createOscillator(),g=ctx.createGain(); o.connect(g);g.connect(ctx.destination); o.frequency.setValueAtTime(523.25,ctx.currentTime); o.frequency.setValueAtTime(783.99,ctx.currentTime+0.12); g.gain.setValueAtTime(0.25,ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.45); o.start();o.stop(ctx.currentTime+0.45); }
        else if(type==='wrong'){ const o=ctx.createOscillator(),g=ctx.createGain(); o.connect(g);g.connect(ctx.destination); o.type='sawtooth'; o.frequency.setValueAtTime(220,ctx.currentTime); g.gain.setValueAtTime(0.15,ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.3); o.start();o.stop(ctx.currentTime+0.3); }
        else if(type==='complete'){ [523.25,659.25,783.99,1046.5].forEach((f,i)=>{ const o=ctx.createOscillator(),g=ctx.createGain(); o.connect(g);g.connect(ctx.destination); o.frequency.value=f; const t=ctx.currentTime+i*0.13; g.gain.setValueAtTime(0.2,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.4); o.start(t);o.stop(t+0.4); }); }
    }catch(e){} }
};
const quiz={lesson:null,questions:[],currentIndex:0,score:0,streak:0,maxStreak:0,skipped:0,state:"typing",soundEnabled:true};
function normalizeText(t){ return t.toLowerCase().replace(/[.,?!]/g,'').replace(/\s+/g,' ').trim(); }
function shuffleArray(a){ const r=a.slice(); for(let i=r.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [r[i],r[j]]=[r[j],r[i]]; } return r; }
function escapeChar(c){ return c==='<'?'&lt;':c==='>'?'&gt;':c==='&'?'&amp;':c; }
function initQuiz(lesson){
    quiz.lesson=lesson; quiz.questions=shuffleArray(lesson.questions);
    quiz.currentIndex=0;quiz.score=0;quiz.streak=0;quiz.maxStreak=0;quiz.skipped=0;quiz.state="typing";
    document.getElementById('total-display').textContent=quiz.questions.length;
    document.getElementById('total-q').textContent=quiz.questions.length;
    document.getElementById('quiz-container').style.display='block';
    document.getElementById('end-screen').style.display='none';
    updateScore(); loadQuestion();
}
function loadQuestion(){
    quiz.state="typing"; const q=quiz.questions[quiz.currentIndex];
    document.getElementById('current-q').textContent=quiz.currentIndex+1;
    document.getElementById('progress-bar-fill').style.width=(quiz.currentIndex/quiz.questions.length*100)+'%';
    const sn={1:"Volonté",2:"Politesse",3:"Regret"}, sc={1:"#3b82f6",2:"#8b5cf6",3:"#f59e0b"};
    const badge=document.getElementById('structure-badge');
    if(q.structure){badge.textContent='Structure '+q.structure+' — '+sn[q.structure];badge.style.background=sc[q.structure]+'18';badge.style.color=sc[q.structure];badge.style.display='inline-block';}else{badge.style.display='none';}
    const qEl=document.getElementById('question-text');
    qEl.style.opacity='0';qEl.style.transform='translateY(12px)';
    setTimeout(()=>{qEl.textContent=q.fr;qEl.style.transition='opacity 0.3s ease,transform 0.3s ease';qEl.style.opacity='1';qEl.style.transform='translateY(0)';},50);
    const inp=document.getElementById('answer-input');inp.value='';inp.disabled=false;inp.className='answer-input';
    const lb=document.getElementById('live-feedback');lb.style.display='none';lb.innerHTML='';
    document.getElementById('submit-btn').textContent='Vérifier ✓';document.getElementById('submit-btn').className='action-btn';
    document.getElementById('skip-btn').style.display='inline-flex';
    const fb=document.getElementById('feedback-box');fb.style.display='none';fb.className='feedback';
    updateStreakDisplay(); setTimeout(()=>inp.focus(),80);
}
function checkAnswer(){
    if(quiz.state==="feedback"){nextQuestion();return;}
    const inp=document.getElementById('answer-input'); const ua=inp.value.trim(); if(!ua)return;
    const q=quiz.questions[quiz.currentIndex]; const ok=q.en.some(a=>normalizeText(a)===normalizeText(ua));
    const fb=document.getElementById('feedback-box'),fbM=document.getElementById('feedback-msg'),fbC=document.getElementById('feedback-correction');
    const btn=document.getElementById('submit-btn'),lb=document.getElementById('live-feedback');
    if(ok){
        quiz.score++;quiz.streak++;if(quiz.streak>quiz.maxStreak)quiz.maxStreak=quiz.streak;
        if(quiz.soundEnabled)SoundFX.play('correct');
        quiz.state="feedback";inp.disabled=true;btn.textContent='Continuer →';
        document.getElementById('skip-btn').style.display='none';lb.style.display='none';
        fb.className='feedback correct';fbM.textContent='✅ Parfait!'+(quiz.streak>=3?' 🔥 Combo ×'+quiz.streak+' !':'');fbC.textContent='';
    }else{
        quiz.streak=0;if(quiz.soundEnabled)SoundFX.play('wrong');
        inp.classList.add('shake');setTimeout(()=>inp.classList.remove('shake'),400);
        fb.className='feedback incorrect';fbM.textContent='❌ Pas tout à fait, essaie encore !';fbC.textContent='';inp.focus();
    }
    fb.style.display='block';updateScore();updateStreakDisplay();
}
function showAnswer(){
    if(quiz.state==="feedback")return; const q=quiz.questions[quiz.currentIndex];
    const inp=document.getElementById('answer-input');
    quiz.streak=0;quiz.skipped++;quiz.state="feedback";inp.value=q.en[0];inp.disabled=true;
    document.getElementById('submit-btn').textContent='Continuer →';
    document.getElementById('skip-btn').style.display='none';document.getElementById('live-feedback').style.display='none';
    const fb=document.getElementById('feedback-box');fb.className='feedback incorrect';
    document.getElementById('feedback-msg').textContent='⏭️ Question passée.';
    document.getElementById('feedback-correction').textContent='Réponse : '+q.en[0];
    fb.style.display='block';updateScore();updateStreakDisplay();
}
function nextQuestion(){ quiz.currentIndex++; if(quiz.currentIndex<quiz.questions.length)loadQuestion();else showEndScreen(); }
function showEndScreen(){
    if(quiz.soundEnabled)SoundFX.play('complete');
    document.getElementById('quiz-container').style.display='none';document.getElementById('end-screen').style.display='block';
    document.getElementById('progress-bar-fill').style.width='100%';
    const tot=quiz.questions.length,pct=Math.round(quiz.score/tot*100);
    const grade=pct===100?'🏆 PARFAIT !':pct>=90?'⭐⭐⭐ Excellent !':pct>=70?'⭐⭐ Bien joué !':pct>=50?'⭐ Continue !':'📚 Révise encore.';
    document.getElementById('final-grade').textContent=grade;
    document.getElementById('final-score').textContent=quiz.score+' / '+tot;
    document.getElementById('final-pct').textContent=pct+'%';
    document.getElementById('final-streak').textContent=quiz.maxStreak;
    document.getElementById('final-skipped').textContent=quiz.skipped;
    if(typeof updateLessonStat==='function')updateLessonStat(quiz.lesson.id,quiz.score,tot);
}
function updateScore(){document.getElementById('score-display').textContent=quiz.score;}
function updateStreakDisplay(){
    const el=document.getElementById('streak-display');if(!el)return;
    if(quiz.streak>=2){el.textContent='🔥 ×'+quiz.streak;el.style.display='inline-block';el.className='streak-badge';void el.offsetWidth;el.className='streak-badge active';}else{el.style.display='none';}
}
function openHelp(){document.getElementById('help-modal').style.display='flex';}
function closeHelp(e){if(e)e.stopPropagation();document.getElementById('help-modal').style.display='none';if(quiz.state==="typing")setTimeout(()=>document.getElementById('answer-input')?.focus(),80);}
function toggleSound(){quiz.soundEnabled=!quiz.soundEnabled;const b=document.getElementById('sound-btn');b.textContent=quiz.soundEnabled?'🔊':'🔇';b.style.opacity=quiz.soundEnabled?'1':'0.45';}
(function(){
    const inp=document.getElementById('answer-input');if(!inp)return;
    inp.addEventListener('input',function(){
        if(quiz.state!=="typing")return; const ut=this.value; const q=quiz.questions[quiz.currentIndex]; const lb=document.getElementById('live-feedback');
        if(!q||!ut){lb.style.display='none';lb.innerHTML='';return;} lb.style.display='block';
        let best=q.en[0],max=-1;
        for(const t of q.en){let m=0;for(let i=0;i<Math.min(ut.length,t.length);i++){if(ut[i].toLowerCase()===t[i].toLowerCase())m++;else break;}if(m>max){max=m;best=t;}}
        let html='';for(let i=0;i<ut.length;i++){const ch=ut[i]===' '?'&nbsp;':escapeChar(ut[i]);const ok=i<best.length&&ut[i].toLowerCase()===best[i].toLowerCase();html+=ok?'<span class="char-correct">'+ch+'</span>':'<span class="char-incorrect">'+ch+'</span>';}
        lb.innerHTML=html;
    });
    inp.addEventListener('keypress',e=>{if(e.key==='Enter')checkAnswer();});
})();