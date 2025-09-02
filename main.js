const carCanvas=document.getElementById("carCanvas");
carCanvas.width=200;
const networkCanvas=document.getElementById("networkCanvas");
networkCanvas.width=300;

const carCtx = carCanvas.getContext("2d");
const networkCtx = networkCanvas.getContext("2d");

const road=new Road(carCanvas.width/2,carCanvas.width*0.9);

// Evolution settings (tweakable via UI)
let POP_SIZE=150;               // population size
let GENERATION_MS=15000;        // 15s per generation or earlier if all crash
const ELITES=5;
let MUTATION=0.2;

let generation=1;
let genStart=Date.now();
let bestFitness=-Infinity;

let cars=createPopulation(POP_SIZE);
let bestCar=cars[0];

let traffic=generateTraffic(road);

animate();

function save(){
    localStorage.setItem("bestBrain",
        JSON.stringify(bestCar.brain));
}

function discard(){
    localStorage.removeItem("bestBrain");
}

function isCompatibleBrain(brain, inputCount, hiddenCount, outputCount){
    try{
        if(!brain || !brain.levels || brain.levels.length!==2) return false;
        const L0=brain.levels[0];
        const L1=brain.levels[1];
        return (
            Array.isArray(L0.weights) && L0.weights.length===inputCount &&
            Array.isArray(L0.weights[0]) && L0.weights[0].length===hiddenCount &&
            Array.isArray(L1.weights) && L1.weights.length===hiddenCount &&
            Array.isArray(L1.weights[0]) && L1.weights[0].length===outputCount
        );
    }catch(e){ return false; }
}

function createPopulation(N){
    const arr=[];
    let saved=localStorage.getItem("bestBrain");
    for(let i=0;i<N;i++){
        const c=new Car(road.getLaneCenter(1),100,30,50,"AI");
        if(saved){
            const parsed=JSON.parse(saved);
            if(!isCompatibleBrain(parsed, c.sensor.rayCount, 12, 3)){
                // Incompatible with new architecture; ignore saved brain
                saved=null;
            }
        }
        if(saved){
            c.brain=JSON.parse(saved);
            if(i!==0){
                NeuralNetwork.mutate(c.brain,MUTATION);
            }
        }
        arr.push(c);
    }
    return arr;
}

function generateTraffic(road){
    const arr=[];
    const lanes=[0,1,2];
    let y=-100;
    for(let i=0;i<12;i++){
        // Random slow/medium cars, random lanes with spacing
        const lane=lanes[Math.floor(Math.random()*lanes.length)];
        arr.push(new Car(road.getLaneCenter(lane), y, 30, 50, "DUMMY", 2+Math.random()*0.5, getRandomColor()));
        y-=150+Math.random()*150;
    }
    return arr;
}

function animate(time){
    for(let i=0;i<traffic.length;i++){
        traffic[i].update(road.borders,[]);
    }
    for(let i=0;i<cars.length;i++){
        cars[i].update(road.borders,traffic);
    }
    bestCar=cars.find(
        c=>c.y==Math.min(
            ...cars.map(c=>c.y)
        ));

    carCanvas.height=window.innerHeight;
    networkCanvas.height=window.innerHeight;

    carCtx.save();
    carCtx.translate(0,-bestCar.y+carCanvas.height*0.7);

    road.draw(carCtx);
    for(let i=0;i<traffic.length;i++){
        traffic[i].draw(carCtx);
    }
    carCtx.globalAlpha=0.2;
    for(let i=0;i<cars.length;i++){
        cars[i].draw(carCtx);
    }
    carCtx.globalAlpha=1;
    bestCar.draw(carCtx,true);

    carCtx.restore();

    networkCtx.lineDashOffset=-time/50;
    Visualizer.drawNetwork(networkCtx,bestCar.brain);

    // HUD for best car: lane offset and front gap
    drawBestCarOverlay();

    // Generation handling
    const alive=cars.filter(c=>!c.damaged).length;
    updateStats(alive);
    const genElapsed=Date.now()-genStart;
    if(alive<=Math.max(2,Math.floor(POP_SIZE*0.05)) || genElapsed>GENERATION_MS){
        nextGeneration();
    }
    requestAnimationFrame(animate);
}

function fitness(car){
    // Progress forward (smaller y is better), reward speed
    return -car.y + car.speed*50;
}

function nextGeneration(){
    // Rank by fitness
    const ranked=[...cars].sort((a,b)=>fitness(b)-fitness(a));
    const elites=ranked.slice(0,ELITES);

    // Track best
    const best=elites[0];
    const fit=fitness(best);
    if(fit>bestFitness){
        bestFitness=fit;
        try{
            localStorage.setItem("bestBrain", JSON.stringify(best.brain));
        }catch(e){}
    }

    // Rebuild population
    const next=[];
    for(let i=0;i<ELITES;i++){
        const c=new Car(road.getLaneCenter(1),100,30,50,"AI");
        c.brain=JSON.parse(JSON.stringify(elites[i].brain));
        next.push(c);
    }
    while(next.length<POP_SIZE){
        const parent=elites[Math.floor(Math.random()*ELITES)];
        const child=new Car(road.getLaneCenter(1),100,30,50,"AI");
        child.brain=JSON.parse(JSON.stringify(parent.brain));
        NeuralNetwork.mutate(child.brain, MUTATION + Math.random()*0.15);
        next.push(child);
    }
    cars=next;
    bestCar=cars[0];
    traffic=generateTraffic(road);
    generation++;
    genStart=Date.now();
}

// UI: apply settings and restart
function applySettingsFromUI(){
    const popEl=document.getElementById('popSize');
    const genEl=document.getElementById('genSeconds');
    const mutEl=document.getElementById('mutation');
    const newPop=Math.max(10, Math.min(1000, parseInt(popEl.value||POP_SIZE)));
    const newGenMs=Math.max(5000, Math.min(120000, Math.round(parseFloat(genEl.value|| (GENERATION_MS/1000)) * 1000)));
    const newMut=Math.max(0, Math.min(1, parseFloat(mutEl.value||MUTATION)));

    POP_SIZE=newPop;
    GENERATION_MS=newGenMs;
    MUTATION=newMut;

    // Restart population using saved best brain if compatible
    cars=createPopulation(POP_SIZE);
    bestCar=cars[0];
    traffic=generateTraffic(road);
    generation=1;
    genStart=Date.now();
    bestFitness=-Infinity;
}

// Initialize control panel with defaults
window.addEventListener('DOMContentLoaded',()=>{
    const popEl=document.getElementById('popSize');
    const genEl=document.getElementById('genSeconds');
    const mutEl=document.getElementById('mutation');
    if(popEl){ popEl.value=POP_SIZE; }
    if(genEl){ genEl.value=Math.round(GENERATION_MS/1000); }
    if(mutEl){ mutEl.value=MUTATION.toFixed(2); }
});

// Expose for inline onclick
window.applySettingsFromUI=applySettingsFromUI;
window.nextGeneration=nextGeneration;

function updateStats(alive){
    const gEl=document.getElementById('statGeneration');
    const aEl=document.getElementById('statAlive');
    const bEl=document.getElementById('statBest');
    if(gEl) gEl.textContent=String(generation);
    if(aEl) aEl.textContent=String(alive)+"/"+String(POP_SIZE);
    if(bEl) bEl.textContent=Number.isFinite(bestFitness)?Math.round(bestFitness):'n/a';
}

function drawBestCarOverlay(){
    if(!bestCar || !bestCar.sensor) return;
    // Lane offset
    let nearestLane=0;
    let nearestDist=Infinity;
    for(let li=0; li<road.laneCount; li++){
        const cx=road.getLaneCenter(li);
        const d=Math.abs(bestCar.x - cx);
        if(d<nearestDist){ nearestDist=d; nearestLane=li; }
    }
    const centerX=road.getLaneCenter(nearestLane);
    const laneOffsetPx = Math.round(bestCar.x - centerX);

    // Front gap from center ray
    const mid = Math.floor(bestCar.sensor.rayCount/2);
    const reading = bestCar.sensor.readings[mid];
    const gapPx = reading ? Math.round(reading.offset * bestCar.sensor.rayLength) : Infinity;

    // Draw box top-left of car canvas
    const pad=8;
    const lineH=14;
    const w=170, h=pad*2 + lineH*2;
    carCtx.save();
    carCtx.globalAlpha=0.85;
    carCtx.fillStyle='rgba(0,0,0,0.6)';
    carCtx.strokeStyle='rgba(255,255,255,0.7)';
    carCtx.lineWidth=1;
    carCtx.beginPath();
    carCtx.rect(10,10,w,h);
    carCtx.fill();
    carCtx.stroke();
    carCtx.globalAlpha=1;
    carCtx.fillStyle='#fff';
    carCtx.font='12px Arial';
    carCtx.fillText('Lane offset: '+laneOffsetPx+' px', 18, 10+pad+10);
    carCtx.fillText('Front gap: '+(gapPx===Infinity?'inf':gapPx+' px'), 18, 10+pad+10+lineH);
    carCtx.restore();
}
