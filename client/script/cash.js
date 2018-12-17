AFRAME.registerSystem('cash', {
  schema: {
    faction:{
      type: 'string',
      default: 'A',
      oneOf: ['A', 'B']
    }
  },  // System schema. Parses into `this.data`.

  init: function () {
    this.updatemoney=this.updatemoney.bind(this);
    this.moneyA=0;
    this.moneyB=0;
    this.cashrateA=1;
    this.cashrateB=1;
    this.timecounter=0;
    this.el.addEventListener('buildtower', this.updatemoney)
    this.el.addEventListener('wavecost',this.updatemoney )
    this.el.addEventListener('enemydestroy', this.updatemoney)
    console.log("cash init");
    // Called on scene initialization.
  },
  tick:function(time, timedelta){
    this.timecounter+=timedelta;
    if(this.timecounter>=1000)
    {
      this.moneyA+=this.cashrateA;
      this.moneyB+=this.cashrateB;
      this.timecounter-=1000;
      console.log("MoneyA: "+this.moneyA);
      console.log("MoneyB: "+this.moneyB);
    }
  },
  remove:function(){
    this.updatemoney=this.updatemoney.bind(this);
    delete this.moneyA;
    delete this.moneyB;
    delete this.cashrateA;
    delete this.cashrateB;
    delete this.timeCounter;
    delete this.el.addEventListener('buildtower', this.updatemoney)
    delete this.el.addEventListener('wavecost',this.updatemoney )
    delete this.el.addEventListener('enemydestroy', this.updatemoney)
  },
  updatemoney:function(event){
    let team=event.detail.faction;
    if(team=='A'){
      this.moneyB+=event.detail.cost;
      console.log("updatemoneyB: "+this.moneyB);
    }else {
      this.moneyA+=event.detail.cost;
      console.log("updatemoneyA: "+this.moneyA);
    }
  }
  // Other handlers and methods.
});
