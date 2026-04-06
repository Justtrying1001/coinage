import { readFileSync, writeFileSync } from 'node:fs';

interface Report {
  perceptualPairMatrix: Array<{
    a: string;
    aArch: string;
    b: string;
    bArch: string;
    galaxyMad96: number;
    largeMad96: number;
  }>;
}

function run(){
  const report = JSON.parse(readFileSync('analysis/reconciliation-report.json','utf8')) as Report;
  const entries = report.perceptualPairMatrix.map((item) => ({
    a: item.a,
    aArch: item.aArch,
    b: item.b,
    bArch: item.bArch,
    galaxyMad: item.galaxyMad96,
    largeMad: item.largeMad96,
  }));

  const galaxyVals=entries.map(e=>e.galaxyMad).sort((x,y)=>x-y);
  const largeVals=entries.map(e=>e.largeMad).sort((x,y)=>x-y);
  const q=(arr:number[],p:number)=>arr[Math.floor((arr.length-1)*p)] ?? 0;
  const summary={
    pairCount:entries.length,
    galaxy:{min:galaxyVals[0],p25:q(galaxyVals,0.25),median:q(galaxyVals,0.5),p75:q(galaxyVals,0.75),max:galaxyVals[galaxyVals.length-1]},
    large:{min:largeVals[0],p25:q(largeVals,0.25),median:q(largeVals,0.5),p75:q(largeVals,0.75),max:largeVals[largeVals.length-1]},
  };
  const out={summary,entries};
  writeFileSync('analysis/perceptual-metrics.json',JSON.stringify(out,null,2)+'\n');
  console.log('Wrote analysis/perceptual-metrics.json');
}
run();
