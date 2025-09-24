function ranksToLexScore(ranks) {
  let base = 1e6; let score = 0;
  for (let i = 0; i < ranks.length; i++) { score += ranks[i] * base; base /= 1e3; }
  return score;
}

export function evaluateBestHand(cards) {
  if (!cards?.length) return { score: -1, name: "No Hand", kickerRanks: [], bestFive: [] };
  const byRank = [...cards].sort((a,b) => b.rVal - a.rVal);
  const rankCounts = new Map();
  const suitBuckets = new Map();
  for (const c of byRank) {
    if (!rankCounts.has(c.rVal)) rankCounts.set(c.rVal, []);
    rankCounts.get(c.rVal).push(c);
    if (!suitBuckets.has(c.suitKey)) suitBuckets.set(c.suitKey, []);
    suitBuckets.get(c.suitKey).push(c);
  }

  function getStraight(sub) {
    if (sub.length < 5) return null;
    const uniq = []; const seen = new Set();
    for (const c of sub.slice().sort((a,b)=>b.rVal-a.rVal)) { if (!seen.has(c.rVal)) { uniq.push(c); seen.add(c.rVal); } }
    const withWheel = uniq.slice();
    if (uniq.some(c=>c.rVal===14)) { const ace = uniq.find(c=>c.rVal===14); withWheel.push({ ...ace, rVal: 1, _wheel:true }); }
    withWheel.sort((a,b)=>b.rVal-a.rVal);
    let run=[withWheel[0]];
    for (let i=1;i<withWheel.length;i++) {
      const prev=withWheel[i-1].rVal, cur=withWheel[i].rVal;
      if (cur===prev-1) run.push(withWheel[i]);
      else if (cur!==prev) run=[withWheel[i]];
      if (run.length>=5) {
        const top5=run.slice(0,5).map(c=>c._wheel?{...c,rVal:14}:c).sort((a,b)=>b.rVal-a.rVal);
        return top5;
      }
    }
    return null;
  } 
  // Straight Flush
  let bestSF=null;
  for (const [, suited] of suitBuckets) { 
    if (suited.length>=5) {
      const sf=getStraight(suited); 
      if (sf && (!bestSF || sf[0].rVal>bestSF[0].rVal)) bestSF=sf; 
    }
  }

  if (bestSF) return { score: 8e9 + bestSF[0].rVal*1e6, name:"Straight Flush", kickerRanks: bestSF.map(c=>c.rVal), bestFive: bestSF };
  
  // Quads
  const quads=[...rankCounts.entries()].filter(([,arr])=>arr.length>=4).sort((a,b)=>b[0]-a[0]);
  if (quads.length){ const q=quads[0][0]; const quad=rankCounts.get(q).slice(0,4); const k=byRank.find(c=>c.rVal!==q);
  return { score: 7e9+q*1e6+(k?.rVal||0)*1e3, name:"Four of a Kind", kickerRanks:[q,q,q,q,k?.rVal||0], bestFive:[...quad,k] };
  }

  // Full House
  const trips=[...rankCounts.entries()].filter(([,a])=>a.length>=3).sort((a,b)=>b[0]-a[0]);
  const pairs=[...rankCounts.entries()].filter(([,a])=>a.length>=2).sort((a,b)=>b[0]-a[0]);
  if (trips.length){ 
    const t=trips[0][0]; 
    let p=null;
    for (const [r] of pairs){ if (r!==t){ p=r; break; }} 
    if (!p && trips.length>=2) p=trips[1][0];
    if (p) {
      return { score: 6e9+t*1e6+p*1e3, name:"Full House", kickerRanks:[t,t,t,p,p], bestFive:[...rankCounts.get(t).slice(0,3), ...rankCounts.get(p).slice(0,2)] };
    }
  }

  // Flush
  let bestFlush=null;
  for (const [, suited] of suitBuckets) {
    if (suited.length>=5) {
      const top5=suited.slice().sort((a,b)=>b.rVal-a.rVal).slice(0,5);
      if (!bestFlush || ranksToLexScore(top5.map(c=>c.rVal))>ranksToLexScore(bestFlush.map(c=>c.rVal))) bestFlush=top5;
    }
  }
  if (bestFlush) return { score: 5e9+ranksToLexScore(bestFlush.map(c=>c.rVal)), name:"Flush", kickerRanks:bestFlush.map(c=>c.rVal), bestFive:bestFlush };
  
  // Straight
  const st=getStraight(byRank); if (st) return { score: 4e9+st[0].rVal*1e6, name:"Straight", kickerRanks: st.map(c=>c.rVal), bestFive: st };
  
  // Trips
  if (trips.length){
    const t=trips[0][0];
    const tCards=rankCounts.get(t).slice(0,3);
    const ks=byRank.filter(c=>c.rVal!==t).slice(0,2);
    return { score: 3e9+t*1e6+ranksToLexScore(ks.map(c=>c.rVal)), name:"Three of a Kind", kickerRanks:[t,t,t,...ks.map(c=>c.rVal)], bestFive:[...tCards,...ks] };
  }
  
  // Two Pair
  if (pairs.length>=2) {
    const [p1,p2]=pairs.slice(0,2).map(x=>x[0]).sort((a,b)=>b-a);
    const k=byRank.find(c=>c.rVal!==p1 && c.rVal!==p2);
    return { score: 2e9+p1*1e6+p2*1e4+(k?.rVal||0)*1e2, name:"Two Pair", kickerRanks:[p1,p1,p2,p2,k?.rVal||0], bestFive:[...rankCounts.get(p1).slice(0,2), ...rankCounts.get(p2).slice(0,2), k] };
  }

  // One Pair
  if (pairs.length===1) {
    const p=pairs[0][0];
    const pCards=rankCounts.get(p).slice(0,2);
    const ks=byRank.filter(c=>c.rVal!==p).slice(0,3);
    return { score: 1e9+p*1e6+ranksToLexScore(ks.map(c=>c.rVal)), name:"One Pair", kickerRanks:[p,p,...ks.map(c=>c.rVal)], bestFive:[...pCards,...ks] };
  }
  
  // High Card
  const top5=byRank.slice(0,5);
  return { score: ranksToLexScore(top5.map(c=>c.rVal)), name:"High Card", kickerRanks:top5.map(c=>c.rVal), bestFive:top5 };
  
}

export function compareHands(hA, hB) { return hA.score - hB.score; }