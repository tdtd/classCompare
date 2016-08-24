var app = angular.module('app', []);

app.controller('MainCtrl', function($scope, $http){
  //Variables
  
  //Scope Variables
  $scope.info = [];
  $scope.empty = [];
  $scope.currentFilters = [];
  $scope.parsed;
  //$scope functions Capitalize First Letter, convert dashes to spaces
  $scope.clean = function(str){
    var a = str.split('-');
    var b = a.map(function(word){
      return word.charAt(0).toUpperCase() + word.slice(1);
    });
    return b.join(' ');
  }
  
  //Check if word is in current filters and return whether active or not
  $scope.active = function(word){
    if ($scope.currentFilters.indexOf(word) != -1){
      return 'btn-primary';
    }
    return 'btn-outline-primary';
  }
  
  //Toggle words into and out of $scope.currentFilters List
  $scope.toggle = function(word){
    var ind = $scope.currentFilters.indexOf(word);
    if (ind != -1){
      return $scope.currentFilters.splice(ind, 1);
    }
    return $scope.currentFilters.push(word);
  }
  
  //Add highlight-negative if filter word is present
  $scope.highlightNegative = function(str){
    var arr = str.replace(/[.,\/#!$%\^&\*;:{}=\-_`~\n\r()]/g,"").toLowerCase().split(' ');
    var found = '';
    for(var word in $scope.currentFilters){
      if (arr.indexOf($scope.currentFilters[word]) != -1){
        found = 'highlight-negative';
      }
    }
    return found;
  }
  
  //Add highlight-positive if filter word is present
  $scope.highlightPositive = function(str){
    var arr = str.replace(/[.,\/#!$%\^&\*;:{}=\-_`~\n\r()]/g,"").toLowerCase().split(' ');
    var found = '';
    for(var word in $scope.currentFilters){
      if (arr.indexOf($scope.currentFilters[word]) != -1){
        found = 'highlight-positive';
      }
    }
    return found;
  }
  
  //Functions
  function getClassInfo(){
    $http.get('/classInfo')
      .then(function(res){
        var arrays = seperateEmpty(res.data);
        $scope.info = parseForCommon(arrays.listed);
        $scope.empty = arrays.empty;
      })
      .catch(function(err){
        console.log(err);
      });
  };

  function seperateEmpty(check){
    var info = {
        listed: [],
        empty: []
    };
    for (var key in check){
      if(check[key].strengths.length > 0){
        info.listed.push(check[key]);
      } else {
        info.empty.push(check[key]);
      }
    }
    return info;
  };
  //Parse to count words, set $scope.parsed to top 15 and return a list of all specs with a keyword key added
  function parseForCommon(array){
    var words = {}, sortable = [], newClassArray = [], sorted, top10;
    array.forEach(function(spec, key){
      spec.keywords = [];
      spec.strengths.forEach(function(str){
        var strArr = str.replace(/[.,\/#!$%\^&\*;:{}=\-_`~\n\r()]/g,"").toLowerCase().split(' ');
        strArr.forEach(function(word){
          word = word.replace(/^[a-z]{4,}([.s])$/, "");
          spec.keywords.push(word);
          if ('_'+word in words){
            words['_'+word].number++;
          } else {
            words['_'+word] = {word: word, number: 1};
          }
        });
      });
      spec.weaknesses.forEach(function(str){
        var strArr = str.replace(/[.,\/#!$%\^&\*;:{}=\-_`~\n\r()]/g,"").toLowerCase().split(' ');
        strArr.forEach(function(word){
          word = word.replace(/^[a-z]{4,}([.s])$/, "");
          spec.keywords.push(word);
          if ('_'+word in words){
            words['_'+word].number++;
          } else {
            words['_'+word] = {word: word, number: 1};
          }
        });
      });
      spec
      newClassArray.push(spec);
    });
    for (var key in words){
      sortable.push([words[key].word, words[key].number]);
    }
    sortable = sortable.filter(filterOutCommons);
    sorted = sortable.sort(sortByNumber);
    $scope.parsed = sorted.slice(0,44);
    return newClassArray;
  }
  
  function filterOutCommons(word){
    var commonWords =  [ "target", "targets", "good", "great", "without", "high", "well", "very", "exceptional", "", "mediocre", "i", "cannot", "any", "making", "due", "able", "compared", "unholy", "the","of","and","a","to","in","is","you","that","it","he","was","for","on","are","as","with","his","they","I","at","be","this","have","from","or","one","had","by","word","but","not","what","all","were","we","when","your","can","said","there","use","an","each","which","she","do","how","their","if","will","up","other","about","out","many","then","them","these","so","some","her","would","make","like","him","into","time","has","look","two","more","write","go","see","number","no","way","could","people","my","than","first","water","been","call","who","oil","its","now","find","long","down","day","did","get","come","made","may","part"];
    if (commonWords.indexOf(word[0]) >= 0){
      return false;
    }
    return true;
  }
  
  function sortByNumber(a, b){
    return b[1] - a[1];
  }
  
  getClassInfo();
});

app.filter('wordFilter', function(){
  return function(input, filterObj){
    if (filterObj.length == 0){
      return input;
    }
		var list = [], len = filterObj.length, alreadyAdded = [];
		input.map(function(spec){
      for (var i = 0; i < len; i++){
        if (alreadyAdded.indexOf(spec.spec) === -1){
          if (spec.keywords.indexOf(filterObj[i]) != -1){
            list.push(spec);
            alreadyAdded.push(spec.spec);
          }
        }
      }
		})
    return list;
	}
})