'use strict';
var request = require('request');
var cheerio = require('cheerio');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var connection = mongoose.connect('mongodb://localhost/classCompare');


/*
  Save and Load Data from Mongo so you don't have to check in all the damn time ya dingus.
*/
var infoSchema = new Schema({
  lastUpdate: {type: Number, default: 0},
  name: {
    type: String,
    default: 'Bill'
  },
  specInfo: [Schema.Types.Mixed]
})

var Info = mongoose.model('Info', infoSchema);

/*
  Handle Scraper
*/
function ClassInfo(){
  this.classes = {
    deathKnight : {
      name: 'death-knight',
      specs: ['frost', 'unholy']
    },
    demonHunter : {
      name: 'demon-hunter',
      specs: ['havoc']
    },
    druid : {
      name: 'druid',
      specs: ['balance', 'feral']
    },
    hunter : {
      name: 'hunter',
      specs: ['beast-mastery', 'marksmanship', 'survival']
    },
    mage : {
      name: 'mage',
      specs: ['arcane', 'fire', 'frost']
    },
    monk : {
      name: 'monk',
      specs: ['windwalker']
    },
    paladin : {
      name: 'paladin',
      specs: ['retribution']
    },
    priest : {
      name: 'priest',
      specs: ['shadow']
    },
    rogue : {
      name: 'rogue',
      specs: ['assassination', 'outlaw', 'subtlety']
    },
    shaman : {
      name: 'shaman',
      specs: ['elemental', 'enhancement']
    },
    warlock : {
      name: 'warlock',
      specs: ['affliction', 'demonology', 'destruction']
    },
    warrior : {
      name: 'warrior',
      specs: ['arms', 'fury']
    }
  };
  
  this.checkLastSave();
};

ClassInfo.prototype.checkLastSave = function(){
  var now = Date.now();
  var time = 86400000;
  var yesterday = now - time;
  var self = this;
  Info.find({name: 'Bill'})
    .select('-_id -__v')
    .exec(function(err, found){
      if (found.length === 0){
        self.getAllSpecInfo()
          .then(function(result){
            var newData = new Info({lastUpdate: Date.now(), specInfo: result});
            Info.findOneAndUpdate({name: 'Bill'}, newData, {upsert:true}, function (err, doc){
              if (err) {
                console.log(err);
              }
              console.log('added');
              return self.classInfo = doc;
            })
          })
        .catch(function(err){
          console.log(err);
        })
      } else {
          self.getAllSpecInfo()
            .then(function(result){
            if (found.lastUpdate < yesterday) {
              found.specInfo = result;
              found.lastUpdate = Date.now();
              Info.findOneAndUpdate({name: 'Bill'}, found, {upsert:true}, function(err, doc){
                if (err) {
                  console.log(err);
                }
                console.log('updated')
                self.classInfo = doc;
              })
              .catch(function(err){
                console.log(err);
            });
          } else {
            self.classInfo = result;
          }
        })
      }
  });
}

ClassInfo.prototype.getAllSpecInfo = function(){
  var classArray = [];
  var self = this;
  for (var key in this.classes){
    for (var i = 0, len = this.classes[key].specs.length; i < len; i++){
      classArray.push({_class: this.classes[key].name, spec: this.classes[key].specs[i]})
    }
  }
  return Promise.all(classArray.map(self.getSpecInfo));
}

ClassInfo.prototype.getSpecInfo = function(item){
  var promise = new Promise(function(resolve, reject){
    request('http://www.icy-veins.com/wow/'+item.spec+'-'+item._class+'-pve-dps-guide', function (error, response, body) {
      if(error){
        reject({err: error});
      }
      var $ = cheerio.load(body);
      var pros = [];
      var cons = [];
      
      if ($('.page_content_container').find('.classes_list_strengths').length > 0){
        $('.classes_list_strengths').children().each(function(i, elem){
          pros.push($(this).text());
        });
        
        if ($('.page_content_container').find('.classes_list_weaknesses').length > 0){
          $('.classes_list_weaknesses').children().each(function(i, elem){
            cons.push($(this).text());
          }); 
        }
        
        return resolve({_class: item._class, spec: item.spec, strengths: pros, weaknesses: cons});
      } else {
        return resolve({_class: item._class, spec: item.spec, strengths: pros, weaknesses: cons});
      }
    })
  });
  return promise
}

module.exports = new ClassInfo();