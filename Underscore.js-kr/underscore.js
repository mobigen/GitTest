//     Underscore.js 1.4.3
//     http://underscorejs.org
//     (c) 2009-2012 Jeremy Ashkenas, DocumentCloud Inc.
//     Underscore may be freely distributed under the MIT license.
//     원문서: https://github.com/documentcloud/underscore/blob/78887cffb53ed372811b5cc1239e0ecdf701a5c8/underscore.js
//     원日本語문서: https://github.com/enja-oss/Underscore/blob/master/underscore.js
//     한글번역 : Seung-Hyun PAEK(http://tipjs.com)
(function() {

  // Baseline setup
  // --------------

  // root object 를 정한다. 브라우저에서는 `window`을 의미하며, 서버 환경에서는`global`을 가리킨다.
  var root = this;

  // 기존 `_`변수를 저장한다.
  var previousUnderscore = root._;

  // 루프의 반복에서 벗어날 때 반환되는 객체를 정한다.
  var breaker = {};

  // 미니파이 후 (그러나 Gizp되지 않은) 버전의 바이트 수를 잡아 놓는다.
  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

  // 코어 한 프로토타입 메서드에 빠르게 액세스하기 위해 단순참조용 변수를 만든다.
  var push             = ArrayProto.push,
      slice            = ArrayProto.slice,
      concat           = ArrayProto.concat,
      toString         = ObjProto.toString,
      hasOwnProperty   = ObjProto.hasOwnProperty;

  // 사용할 것으로 예상되는 모든 ** ECMAScript 5 ** 네이티브 함수 구현을 여기에서 선언한다.
  var
    nativeForEach      = ArrayProto.forEach,
    nativeMap          = ArrayProto.map,
    nativeReduce       = ArrayProto.reduce,
    nativeReduceRight  = ArrayProto.reduceRight,
    nativeFilter       = ArrayProto.filter,
    nativeEvery        = ArrayProto.every,
    nativeSome         = ArrayProto.some,
    nativeIndexOf      = ArrayProto.indexOf,
    nativeLastIndexOf  = ArrayProto.lastIndexOf,
    nativeIsArray      = Array.isArray,
    nativeKeys         = Object.keys,
    nativeBind         = FuncProto.bind;

  // 이후에 사용하기위한 Underscore object 에 대한 안전한 참조를 만든다.
  var _ = function(obj) {
    if (obj instanceof _) return obj;
    if (!(this instanceof _)) return new _(obj);
    this._wrapped = obj;
  };

  // ** Node.js **용으로 오래된`require ()`API에 대한 호환성을 갖게하고, Undesrscore object를
  // export 한다. 브라우저라면 Closure Compiler의 Advanced 모드를 위해 문자 식별자를
  // 사용하고 글로벌 object 로 `_`을 추가한다.
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = _;
    }
    exports._ = _;
  } else {
    root._ = _;
  }

  // 현재 버전.
  _.VERSION = '1.4.3';

  // Collection Functions
  // --------------------

  // 기본이 되는 `each`(별칭`forEach`)의 구현.
  // Array 나 Object 등의 객체를 빌트인된`forEach`에 의해 제어한다.
  // 사용 가능한 경우, ECMAScript5 네이티브`forEach`에 위임한다.
  var each = _.each = _.forEach = function(obj, iterator, context) {
    if (obj == null) return;
    if (nativeForEach && obj.forEach === nativeForEach) {
      obj.forEach(iterator, context);
    } else if (obj.length === +obj.length) {
      for (var i = 0, l = obj.length; i < l; i++) {
        if (iterator.call(context, obj[i], i, obj) === breaker) return;
      }
    } else {
      for (var key in obj) {
        if (_.has(obj, key)) {
          if (iterator.call(context, obj[key], key, obj) === breaker) return;
        }
      }
    }
  };

  // 각 요소에 Iterator 를 적용한 결과를 돌려 준다.
  // 사용 가능한 경우, ECMAScript5 네이티브`map`에 위임한다.
  _.map = _.collect = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeMap && obj.map === nativeMap) return obj.map(iterator, context);
    each(obj, function(value, index, list) {
      results[results.length] = iterator.call(context, value, index, list);
    });
    return results;
  };

  var reduceError = 'Reduce of empty array with no initial value';

  // ** reduce ** (별칭`inject`또는`foldl`)은 값의 리스트로부터의 하나의 결과를 작성한다.
  // 사용 가능한 경우, ECMAScript5 네이티브`reduce`에 위임한다.
  _.reduce = _.foldl = _.inject = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduce && obj.reduce === nativeReduce) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduce(iterator, memo) : obj.reduce(iterator);
    }
    each(obj, function(value, index, list) {
      if (!initial) {
        memo = value;
        initial = true;
      } else {
        memo = iterator.call(context, memo, value, index, list);
      }
    });
    if (!initial) throw new TypeError(reduceError);
    return memo;
  };

  // reduceRight 버전의 reduce이며, 별칭`foldr`.
  // 사용 가능한 경우, ECMAScript5 네이티브`reduceRight`에 위임한다.
  _.reduceRight = _.foldr = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduceRight && obj.reduceRight === nativeReduceRight) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduceRight(iterator, memo) : obj.reduceRight(iterator);
    }
    var length = obj.length;
    if (length !== +length) {
      var keys = _.keys(obj);
      length = keys.length;
    }
    each(obj, function(value, index, list) {
      index = keys ? keys[--length] : --length;
      if (!initial) {
        memo = obj[index];
        initial = true;
      } else {
        memo = iterator.call(context, memo, obj[index], index, list);
      }
    });
    if (!initial) throw new TypeError(reduceError);
    return memo;
  };

  // truth test를 통과한 최초의 값을 돌려 준다. 별칭`detect`.
  _.find = _.detect = function(obj, iterator, context) {
    var result;
    any(obj, function(value, index, list) {
      if (iterator.call(context, value, index, list)) {
        result = value;
        return true;
      }
    });
    return result;
  };

  // truth test를 통과한 모든 요소를 돌려준다.
  // 사용 가능한 경우, ECMAScript5 네이티브`filter`에 위임한다.
  // 별칭`select`.
  _.filter = _.select = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeFilter && obj.filter === nativeFilter) return obj.filter(iterator, context);
    each(obj, function(value, index, list) {
      if (iterator.call(context, value, index, list)) results[results.length] = value;
    });
    return results;
  };

  // truth test를 통과하지 못한 모든 요소를 돌려준다.
  _.reject = function(obj, iterator, context) {
    return _.filter(obj, function(value, index, list) {
      return !iterator.call(context, value, index, list);
    }, context);
  };

  // 모든 요소가 truth test와 일치하는지 확인한다.
  // 사용 가능한 경우, ECMAScript5 네이티브`filter`에 위임한다.
  // 별칭`all`.
  _.every = _.all = function(obj, iterator, context) {
    iterator || (iterator = _.identity);
    var result = true;
    if (obj == null) return result;
    if (nativeEvery && obj.every === nativeEvery) return obj.every(iterator, context);
    each(obj, function(value, index, list) {
      if (!(result = result && iterator.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // 객체내의 적어도 하나의 요소가 truth test 와 일치 하는지를 확인한다.
  // 사용 가능한 경우, ECMAScript5 네이티브`some`에 위임한다.
  // 별칭`any`.
  var any = _.some = _.any = function(obj, iterator, context) {
    iterator || (iterator = _.identity);
    var result = false;
    if (obj == null) return result;
    if (nativeSome && obj.some === nativeSome) return obj.some(iterator, context);
    each(obj, function(value, index, list) {
      if (result || (result = iterator.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // 배열이나 객체가 지정된 값을 포함하는지 (`===`를 사용하여) 확인한다.
  // 별칭`include`.
  _.contains = _.include = function(obj, target) {
    if (obj == null) return false;
    if (nativeIndexOf && obj.indexOf === nativeIndexOf) return obj.indexOf(target) != -1;
    return any(obj, function(value) {
      return value === target;
    });
  };

  // 컬렉션내의 각 항목의 메서드를 (인수를 붙여) 호출.
  _.invoke = function(obj, method) {
    var args = slice.call(arguments, 2);
    return _.map(obj, function(value) {
      return (_.isFunction(method) ? method : value[method]).apply(value, args);
    });
  };

  // 컬렉션의 각 요소에서 프로퍼티를 가져 온다는,
  // `map`의 일반적인 용도에있어서의 단축 버전.
  _.pluck = function(obj, key) {
    return _.map(obj, function(value){ return value[key]; });
  };

  // 컬렉션의 각 요소에서`key : value`쌍을 가진 객체 만을 선택하는,
  // `filter`의 일반적인 용도에있어서의 단축 버전.
  _.where = function(obj, attrs) {
    if (_.isEmpty(attrs)) return [];
    return _.filter(obj, function(value) {
      for (var key in attrs) {
        if (attrs[key] !== value[key]) return false;
      }
      return true;
    });
  };

  // 요소 또는 요소를 기반으로 한 계산 결과의 최대 값을 돌려 준다.
  // 요소 수가 65,535보다 긴 배열을 끝까지 검사 할 수 없다.
  // 참조: https://bugs.webkit.org/show_bug.cgi?id=80797
  _.max = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
      return Math.max.apply(Math, obj);
    }
    if (!iterator && _.isEmpty(obj)) return -Infinity;
    var result = {computed : -Infinity, value: -Infinity};
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      computed >= result.computed && (result = {value : value, computed : computed});
    });
    return result.value;
  };

  // 요소 또는 요소를 기반으로 한 계산 결과의 최소값을 반환.
  _.min = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
      return Math.min.apply(Math, obj);
    }
    if (!iterator && _.isEmpty(obj)) return Infinity;
    var result = {computed : Infinity, value: Infinity};
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      computed < result.computed && (result = {value : value, computed : computed});
    });
    return result.value;
  };

  // 배열을 섞는다..
  _.shuffle = function(obj) {
    var rand;
    var index = 0;
    var shuffled = [];
    each(obj, function(value) {
      rand = _.random(index++);
      shuffled[index - 1] = shuffled[rand];
      shuffled[rand] = value;
    });
    return shuffled;
  };

  // iterator를 검색하고 생성하기 위해 사용하는 내부 함수.
  var lookupIterator = function(value) {
    return _.isFunction(value) ? value : function(obj){ return obj[value]; };
  };

  // iterator가 제공하는 기준에 따라 객체의 값을 정렬한다.
  _.sortBy = function(obj, value, context) {
    var iterator = lookupIterator(value);
    return _.pluck(_.map(obj, function(value, index, list) {
      return {
        value : value,
        index : index,
        criteria : iterator.call(context, value, index, list)
      };
    }).sort(function(left, right) {
      var a = left.criteria;
      var b = right.criteria;
      if (a !== b) {
        if (a > b || a === void 0) return 1;
        if (a < b || b === void 0) return -1;
      }
      return left.index < right.index ? -1 : 1;
    }), 'value');
  };

  // "group by"조작에 의한 집계에 사용되는 내부 함수.
  var group = function(obj, value, context, behavior) {
    var result = {};
    var iterator = lookupIterator(value || _.identity);
    each(obj, function(value, index) {
      var key = iterator.call(context, value, index, obj);
      behavior(result, key, value);
    });
    return result;
  };

  // 기준에 따라 객체의 값을 그룹화한다.
  // 그룹의 기준으로 하고싶은 속성 문자열 또는 기준을 반환하는 함수 중 하나를 건네 준다.
  _.groupBy = function(obj, value, context) {
    return group(obj, value, context, function(result, key, value) {
      (_.has(result, key) ? result[key] : (result[key] = [])).push(value);
    });
  };

  // 일정한 기준으로 그룹화 된 객체의 인스턴스 수를 카운트한다.
  // 카운트 기준으로하고 싶은 속성 문자열 또는 기준을 반환하는 함수 중 하나를 건네 준다.
  _.countBy = function(obj, value, context) {
    return group(obj, value, context, function(result, key) {
      if (!_.has(result, key)) result[key] = 0;
      result[key]++;
    });
  };

  // 순서를 유지하기 위해 객체의 삽입되어야하는 최소의 인덱스를 찾아내는 비교함수를
  // 사용한다. 이진 검색이 사용된다.
  _.sortedIndex = function(array, obj, iterator, context) {
    iterator = iterator == null ? _.identity : lookupIterator(iterator);
    var value = iterator.call(context, obj);
    var low = 0, high = array.length;
    while (low < high) {
      var mid = (low + high) >>> 1;
      iterator.call(context, array[mid]) < value ? low = mid + 1 : high = mid;
    }
    return low;
  };

  // 안전하게 배열로 변환하여 모든 것을 iterable 하게 한다.
  _.toArray = function(obj) {
    if (!obj) return [];
    if (_.isArray(obj)) return slice.call(obj);
    if (obj.length === +obj.length) return _.map(obj, _.identity);
    return _.values(obj);
  };

  // 객체의 요소 수를 돌려 준다.
  _.size = function(obj) {
    if (obj == null) return 0;
    return (obj.length === +obj.length) ? obj.length : _.keys(obj).length;
  };

  // Array Functions
  // ---------------

  // 배열의 첫 번째 요소를 반환한다. ** n **가 전달되면 배열의 처음의 N 의 값을 돌려 준다.
  // 별칭`head`또는`take`. ** guard **를 사용하면 `_.map`함께 사용할 수있다.
  _.first = _.head = _.take = function(array, n, guard) {
    if (array == null) return void 0;
    return (n != null) && !guard ? slice.call(array, 0, n) : array[0];
  };

  // 배열의 마지막 항목을 제외한 모든것을 반환. arguments 객체에서 특히 유용하다.
  // ** n **가 전달되면 끝에서부터 N 개를 제외하고 모든 값을 돌려 준다.
  // ** guard **를 사용하면`_.map`함께 사용할 수있다.
  _.initial = function(array, n, guard) {
    return slice.call(array, 0, array.length - ((n == null) || guard ? 1 : n));
  };

  // 배열의 마지막 요소를 반환한다. ** n **가 전달되면 배열의 끝에서부터 N 값을 돌려 준다.
  // ** guard **를 사용하면`_.map`함께 사용할 수있다.
  _.last = function(array, n, guard) {
    if (array == null) return void 0;
    if ((n != null) && !guard) {
      return slice.call(array, Math.max(array.length - n, 0));
    } else {
      return array[array.length - 1];
    }
  };

  // 배열의 첫 번째 항목을 제외한 모든것을 반환. 별칭`tail`또는`drop`.
  // arguments 객체에서 특히 유용하다. ** n **가 전달되면 배열의 나머지 N 값을
  // 반환한다. ** guard **를 사용하면`_.map`함께 사용할 수있다.
  _.rest = _.tail = _.drop = function(array, n, guard) {
    return slice.call(array, (n == null) || guard ? 1 : n);
  };

  // 배열에서 모든 falsy 값을 제거.
  _.compact = function(array) {
    return _.filter(array, _.identity);
  };

  // 재귀적인`flatten`함수의 내부 구현.
  var flatten = function(input, shallow, output) {
    each(input, function(value) {
      if (_.isArray(value)) {
        shallow ? push.apply(output, value) : flatten(value, shallow, output);
      } else {
        output.push(value);
      }
    });
    return output;
  };

  // 완전히 flatten 한 배열을 돌려 준다.
  _.flatten = function(array, shallow) {
    return flatten(array, shallow, []);
  };

  // 지정된 값을 포함하지 않도록 한 배열을 돌려 준다.
  _.without = function(array) {
    return _.difference(array, slice.call(arguments, 1));
  };

  // 중복이 없도록 한 배열을 제공한다. 배열이 이미 정렬되어있으면,
  // 빠른 알고리즘을 사용할 수있는 옵션이있다. 별칭`unique`.
  _.uniq = _.unique = function(array, isSorted, iterator, context) {
    if (_.isFunction(isSorted)) {
      context = iterator;
      iterator = isSorted;
      isSorted = false;
    }
    var initial = iterator ? _.map(array, iterator, context) : array;
    var results = [];
    var seen = [];
    each(initial, function(value, index) {
      if (isSorted ? (!index || seen[seen.length - 1] !== value) : !_.contains(seen, value)) {
        seen.push(value);
        results.push(array[index]);
      }
    });
    return results;
  };

  // 전달 된 모든 배열의 각 개별 요소의 집합을 포함하는 배열을 제공한다.
  _.union = function() {
    return _.uniq(concat.apply(ArrayProto, arguments));
  };

  // 전달 된 모든 배열 사이에서 공통되는 항목을 포함하는 배열을 제공한다.
  _.intersection = function(array) {
    var rest = slice.call(arguments, 1);
    return _.filter(_.uniq(array), function(item) {
      return _.every(rest, function(other) {
        return _.indexOf(other, item) >= 0;
      });
    });
  };

  // 어떤 배열과 다른 몇 가지 배열의 차이를 취득한다.
  // 딱 첫번째 배열에 존재하는 요소 만 남는다.
  _.difference = function(array) {
    var rest = concat.apply(ArrayProto, slice.call(arguments, 1));
    return _.filter(array, function(value){ return !_.contains(rest, value); });
  };

  // 단일 배열에 여러 목록을 함께 압축한다. 인텍스를 공유하는 요소가 함께 간다.
  _.zip = function() {
    var args = slice.call(arguments);
    var length = _.max(_.pluck(args, 'length'));
    var results = new Array(length);
    for (var i = 0; i < length; i++) {
      results[i] = _.pluck(args, "" + i);
    }
    return results;
  };

  // 목록을 객체로 변환한다. 단일 배열로`[key, value]`쌍이나
  // 하나는 key이고 다른 하나는 해당 value를 나타낸 동일한 길이를 가지는 2 개의 병렬 배열
  // 중 하나를 건네 준다.
  _.object = function(list, values) {
    if (list == null) return {};
    var result = {};
    for (var i = 0, l = list.length; i < l; i++) {
      if (values) {
        result[list[i]] = values[i];
      } else {
        result[list[i][0]] = list[i][1];
      }
    }
    return result;
  };

  // 브라우저가 indexOf를 우리에게 제공하고 있지 않으면 (** MSIE **, 니녀석 말이다)
  // 이 함수가 필요하다. 배열 안에서 item이 최초로 출현하는 위치를 반환하고
  // 배열에 item이 포함되어 있지 않은 경우는 -1을 돌려 준다.
  // 사용 가능한 경우, ECMAScript5 네이티브`indexOf`에 위임한다.
  // 배열이 거대하고 이미 순서가 정렬되어 있으면 ** isSorted **에`true`를 전달하면
  // 이진 검색이 사용된다.
  _.indexOf = function(array, item, isSorted) {
    if (array == null) return -1;
    var i = 0, l = array.length;
    if (isSorted) {
      if (typeof isSorted == 'number') {
        i = (isSorted < 0 ? Math.max(0, l + isSorted) : isSorted);
      } else {
        i = _.sortedIndex(array, item);
        return array[i] === item ? i : -1;
      }
    }
    if (nativeIndexOf && array.indexOf === nativeIndexOf) return array.indexOf(item, isSorted);
    for (; i < l; i++) if (array[i] === item) return i;
    return -1;
  };

  // 사용 가능한 경우, ECMAScript5 네이티브`lastIndexOf`에 위임한다.
  _.lastIndexOf = function(array, item, from) {
    if (array == null) return -1;
    var hasIndex = from != null;
    if (nativeLastIndexOf && array.lastIndexOf === nativeLastIndexOf) {
      return hasIndex ? array.lastIndexOf(item, from) : array.lastIndexOf(item);
    }
    var i = (hasIndex ? from : array.length);
    while (i--) if (array[i] === item) return i;
    return -1;
  };

  // 등차 수열을 포함한 정수형의 배열을 생성한다. Python 네이티브의`range ()`함수의 포트.
  // [the Python documentation](http://docs.python.org/library/functions.html#range)를 참조.
  _.range = function(start, stop, step) {
    if (arguments.length <= 1) {
      stop = start || 0;
      start = 0;
    }
    step = arguments[2] || 1;

    var len = Math.max(Math.ceil((stop - start) / step), 0);
    var idx = 0;
    var range = new Array(len);

    while(idx < len) {
      range[idx++] = start;
      start += step;
    }

    return range;
  };

  // Function (ahem) Functions
  // ------------------

  // 프로토타입을 설정하기위한 재사용 가능한 생성자 함수.
  var ctor = function(){};

  // 전달 된 객체에 연결된 함수 를 생성한다 (`this`할당 및 인수는 옵션).
  // 인수를 수반하는 연결은`curry`로 알려져있다.
  // 사용 가능한 경우, ECMAScript5 네이티브의`Function.bind`에 위임한다.
  // `func`가 미정 일 때, 단계적으로 실패하는 이유로`func.bind`를 먼저 확인한다.
  _.bind = function(func, context) {
    var args, bound;
    if (func.bind === nativeBind && nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    if (!_.isFunction(func)) throw new TypeError;
    args = slice.call(arguments, 2);
    return bound = function() {
      if (!(this instanceof bound)) return func.apply(context, args.concat(slice.call(arguments)));
      ctor.prototype = func.prototype;
      var self = new ctor;
      ctor.prototype = null;
      var result = func.apply(self, args.concat(slice.call(arguments)));
      if (Object(result) === result) return result;
      return self;
    };
  };

  // 객체가 가진 모든 메서드를 객체와 연결시킨다.
  // 객체에 정의된 모든 콜백이 이에 속함을 보장하는데 도움이 된다.
  _.bindAll = function(obj) {
    var funcs = slice.call(arguments, 1);
    if (funcs.length == 0) funcs = _.functions(obj);
    each(funcs, function(f) { obj[f] = _.bind(obj[f], obj); });
    return obj;
  };

  // 결과를 저장하는 것으로, 고비용의 함수를 memoize 화한다.
  _.memoize = function(func, hasher) {
    var memo = {};
    hasher || (hasher = _.identity);
    return function() {
      var key = hasher.apply(this, arguments);
      return _.has(memo, key) ? memo[key] : (memo[key] = func.apply(this, arguments));
    };
  };

  // 지정된 밀리초의 사이에 함수를 지연시켜, 그것을 호출 할 때는 인수를 제공한다.
  _.delay = function(func, wait) {
    var args = slice.call(arguments, 2);
    return setTimeout(function(){ return func.apply(null, args); }, wait);
  };

  // 함수를 지연시켜 현재의 호출 스택이 클리어 된 후에 그것이 실행되도록 스케쥴한다.
  _.defer = function(func) {
    return _.delay.apply(_, [func, 1].concat(slice.call(arguments, 1)));
  };

  // 호출되면 지정된 시간 내에 최대 1 번만 트리거되는 함수를 돌려 준다.
  _.throttle = function(func, wait) {
    var context, args, timeout, result;
    var previous = 0;
    var later = function() {
      previous = new Date;
      timeout = null;
      result = func.apply(context, args);
    };
    return function() {
      var now = new Date;
      var remaining = wait - (now - previous);
      context = this;
      args = arguments;
      if (remaining <= 0) {
        clearTimeout(timeout);
        timeout = null;
        previous = now;
        result = func.apply(context, args);
      } else if (!timeout) {
        timeout = setTimeout(later, remaining);
      }
      return result;
    };
  };

  // 연속 호출되는 한 트리거되지 않는 함수를 돌려 준다.
  // 함수는 N 밀리 초 동안 호출되지 않은 후 실행된다.
  // `immediate`가 전달 된 경우, 연속 된 호출 이후에 트리거하는 대신
  // 호출이 시작된 시점에서 함수를 트리거한다.
  _.debounce = function(func, wait, immediate) {
    var timeout, result;
    return function() {
      var context = this, args = arguments;
      var later = function() {
        timeout = null;
        if (!immediate) result = func.apply(context, args);
      };
      var callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) result = func.apply(context, args);
      return result;
    };
  };

  // 얼마나 빈번하게 호출하는여부를 불문하고 최대 1 번만 실행되는 함수를 돌려 준다.
  // 지연 초기화에 편리하다.
  _.once = function(func) {
    var ran = false, memo;
    return function() {
      if (ran) return memo;
      ran = true;
      memo = func.apply(this, arguments);
      func = null;
      return memo;
    };
  };

  // 첫번째의 함수를 두번째 함수에 인수로 전달해 인수를 조정하거나,
  // 전후에서 코드를 실행하거나 조건부로 원래 함수를 실행 할 수있는 함수를 돌려 준다.
  _.wrap = function(func, wrapper) {
    return function() {
      var args = [func];
      push.apply(args, arguments);
      return wrapper.apply(this, args);
    };
  };

  // 함수 목록에서 각각의 함수가 거기에 계속되는 함수의 반환 값을 인수에 취하는 합성 함수를 돌려 준다.
  _.compose = function() {
    var funcs = arguments;
    return function() {
      var args = arguments;
      for (var i = funcs.length - 1; i >= 0; i--) {
        args = [funcs[i].apply(this, args)];
      }
      return args[0];
    };
  };

  // N 번 호출 한 후에만 실행되는 함수를 돌려 준다.
  _.after = function(times, func) {
    if (times <= 0) return func();
    return function() {
      if (--times < 1) {
        return func.apply(this, arguments);
      }
    };
  };

  // Object Functions
  // ----------------

  // 객체가 가지는 속성의 이름을 취득한다.
  // ECMAScript5의 네이티브`Object.keys`에 위임한다.
  _.keys = nativeKeys || function(obj) {
    if (obj !== Object(obj)) throw new TypeError('Invalid object');
    var keys = [];
    for (var key in obj) if (_.has(obj, key)) keys[keys.length] = key;
    return keys;
  };

  // 객체가 가지는 속성 의 값을 취득한다.
  _.values = function(obj) {
    var values = [];
    for (var key in obj) if (_.has(obj, key)) values.push(obj[key]);
    return values;
  };

  // 객체를`[key, value]`쌍의 목록으로 변환한다.
  _.pairs = function(obj) {
    var pairs = [];
    for (var key in obj) if (_.has(obj, key)) pairs.push([key, obj[key]]);
    return pairs;
  };

  // 객체의 키와 값을 반전한다. 값은 직렬화 가능해야한다.
  _.invert = function(obj) {
    var result = {};
    for (var key in obj) if (_.has(obj, key)) result[obj[key]] = key;
    return result;
  };

  // 객체에서 사용할 수있는 함수의 이름의, 정렬 된 목록을 반환한다.
  // 별칭`methods`.
  _.functions = _.methods = function(obj) {
    var names = [];
    for (var key in obj) {
      if (_.isFunction(obj[key])) names.push(key);
    }
    return names.sort();
  };

  // 전달 된 객체 (들)에 포함 된 모든 속성에서
  // 지정된 객체를 확장한다.
  _.extend = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      if (source) {
        for (var prop in source) {
          obj[prop] = source[prop];
        }
      }
    });
    return obj;
  };

  // whitelisted 속성 만 포함하는 객체의 복사본을 돌려 준다.
  _.pick = function(obj) {
    var copy = {};
    var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
    each(keys, function(key) {
      if (key in obj) copy[key] = obj[key];
    });
    return copy;
  };

   // blacklisted 속성을 제외한 객체의 복사본을 돌려 준다.
  _.omit = function(obj) {
    var copy = {};
    var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
    for (var key in obj) {
      if (!_.contains(keys, key)) copy[key] = obj[key];
    }
    return copy;
  };

  // 디폴트의 속성에서 지정된 객체를 채웁니다.
  _.defaults = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      if (source) {
        for (var prop in source) {
          if (obj[prop] == null) obj[prop] = source[prop];
        }
      }
    });
    return obj;
  };

  // 객체의 clone (피상적 clone)을 작성한다.
  _.clone = function(obj) {
    if (!_.isObject(obj)) return obj;
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  };

  // interceptor에서 obj를 호출 한 뒤, obj를 돌려 준다.
  // 이 방법의 주요 목적은 체인내의 중간 결과에 대해 조작을 실행하기 때문에
  // "tap into"가 메소드 체인이 되는것이다.
  _.tap = function(obj, interceptor) {
    interceptor(obj);
    return obj;
  };

  // `isEqual`을 위한 내부 재귀 비교 함수.
  var eq = function(a, b, aStack, bStack) {
    // 동일한 개체는 동일하게 된다. 그러나`0 === -0`는 같지 않다.
    // Harmony의 `egal`제안을 참조: http://wiki.ecmascript.org/doku.php?id=harmony:egal
    if (a === b) return a !== 0 || 1 / a == 1 / b;
    // `null == undefined`이기 때문에 엄밀한 비교를 필요로한다.
    if (a == null || b == null) return a === b;
    // 래핑 된 객체를 랩핑 해제한다.
    if (a instanceof _) a = a._wrapped;
    if (b instanceof _) b = b._wrapped;
    // `[[Class]]`의 이름을 비교한다.
    var className = toString.call(a);
    if (className != toString.call(b)) return false;
    switch (className) {
      // 문자열, 숫자, 날짜, 불리언 값에 의해 비교.
      case '[object String]':
        // 프리미티브한 것과 해당 객체 랩퍼는 동일하며,
        // 즉 `"5"`는 `new String ("5")`와 동일하다.
        return a == String(b);
      case '[object Number]':
        // `NaN`는 등가이지만 반사적이 지 않다. `egal`비교는 다른 수치를 위해 실행된다.
        return a != +a ? b != +b : (a == 0 ? 1 / a == 1 / b : a == +b);
      case '[object Date]':
      case '[object Boolean]':
        // 날짜와 불리언을 숫자의 프리미티브한 값에 강제한다. 날짜는 밀리 초 표현으로 비교된다.
        // 유효하지 않은 날짜의`NaN`에 의한 밀리 초 표현은 등가하지 않는 것에 주의한다.
        return +a == +b;
      // RegExp는 소스가 되는 패턴과 플래그에 의해 비교된다.
      case '[object RegExp]':
        return a.source == b.source &&
               a.global == b.global &&
               a.multiline == b.multiline &&
               a.ignoreCase == b.ignoreCase;
    }
    if (typeof a != 'object' || typeof b != 'object') return false;
    // 고리구조의 등가성을 전제로한다. 고리구조를 검출하는 알고리즘은
    // ES 5.1의 15.12.3 절에있어서의 추상 조작`JO`에 적합하다.
    var length = aStack.length;
    while (length--) {
      // 선형 탐색. 성능은 유일한 중첩의 구조체의 수에 반비례한다.
      if (aStack[length] == a) return bStack[length] == b;
    }
    // 첫 번째 객체를 탐색 된 객체의 스택에 추가한다.
    aStack.push(a);
    bStack.push(b);
    var size = 0, result = true;
    // 객체와 배열을 재귀 적으로 비교
    if (className == '[object Array]') {
      // 깊은 비교가 필요한지 결정하기 위해, 배열의 길이를 비교한다.
      size = a.length;
      result = size == b.length;
      if (result) {
        // 숫자가 아닌 속성을 무시하고 내용을 깊게 비교한다.
        while (size--) {
          if (!(result = eq(a[size], b[size], aStack, bStack))) break;
        }
      }
    } else {
      // 서로 다른 생성자를 가진 객체들은 동일하지 않지만,
      // 다른 프레임에서 유래 한`Object`는 그렇지만은 않다.
      var aCtor = a.constructor, bCtor = b.constructor;
      if (aCtor !== bCtor && !(_.isFunction(aCtor) && (aCtor instanceof aCtor) &&
                               _.isFunction(bCtor) && (bCtor instanceof bCtor))) {
        return false;
      }
      // 객체의 깊은 비교를한다.
      for (var key in a) {
        if (_.has(a, key)) {
          // 예상되는 속성 수를 계산한다.
          size++;
          // 각 멤버를 깊게 비교한다.
          if (!(result = _.has(b, key) && eq(a[key], b[key], aStack, bStack))) break;
        }
      }
      // 양쪽 모두의 객체가 동일한 수의 속성을 포함하는지 확인한다.
      if (result) {
        for (key in b) {
          if (_.has(b, key) && !(size--)) break;
        }
        result = !size;
      }
    }
    // 검색된 객체의 스택에서 첫 번째 개체를 제거한다.
    aStack.pop();
    bStack.pop();
    return result;
  };

  // 두 객체가 동일한 지 를 확인하기 위해 깊은 비교를 실행한다.
  _.isEqual = function(a, b) {
    return eq(a, b, [], []);
  };

  // 지정된 배열, 문자열, 객체가 비어 있는지?
  // "빈"객체는 자신의 속성을 셀 수없다.
  _.isEmpty = function(obj) {
    if (obj == null) return true;
    if (_.isArray(obj) || _.isString(obj)) return obj.length === 0;
    for (var key in obj) if (_.has(obj, key)) return false;
    return true;
  };

  // 주어진 값이 DOM 요소인지?
  _.isElement = function(obj) {
    return !!(obj && obj.nodeType === 1);
  };

  // 주어진 값이 배열인지?
  // ECMA5 네이티브`Array.isArray`에 위임한다.
  _.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) == '[object Array]';
  };

  // 주어진 값이 객체인지?
  _.isObject = function(obj) {
    return obj === Object(obj);
  };

  // 몇 가지 isType 메소드 추가 : isArguments, isFunction, isString, isNumber, isDate, isRegExp
  each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp'], function(name) {
    _['is' + name] = function(obj) {
      return toString.call(obj) == '[object ' + name + ']';
    };
  });

  // "Arguments"의 형태를 어떻게해도 감지 할 수없는 브라우저 (네, IE 군요)에
  // 폴 백 버전의 메소드를 정의한다.
  if (!_.isArguments(arguments)) {
    _.isArguments = function(obj) {
      return !!(obj && _.has(obj, 'callee'));
    };
  }

  // 그것이 적절하다면,`isFunction`을 최적화한다.
  if (typeof (/./) !== 'function') {
    _.isFunction = function(obj) {
      return typeof obj === 'function';
    };
  }

  // 주어진 값이 유한 수 (finite)인지?
  _.isFinite = function(obj) {
    return isFinite(obj) && !isNaN(parseFloat(obj));
  };

  // 주어진 값이`NaN`인지? (NaN은 자신과 등가하지 않은 유일한 수이다)
  _.isNaN = function(obj) {
    return _.isNumber(obj) && obj != +obj;
  };

  // 주어진 값이 불리언인지?
  _.isBoolean = function(obj) {
    return obj === true || obj === false || toString.call(obj) == '[object Boolean]';
  };

  // 주어진 값이 null과 같은지?
  _.isNull = function(obj) {
    return obj === null;
  };

  // 주어진 값이 undefined인지?
  _.isUndefined = function(obj) {
    return obj === void 0;
  };

  // 주어진 속성을 객체 자신이 직접 가지고 있는지를 확인하는 단축 함수.
  //(다시 말해 프로토타입의 어떤 것은 그렇지 않다)
  _.has = function(obj, key) {
    return hasOwnProperty.call(obj, key);
  };

  // Utility Functions
  // -----------------

  // ** noConflict ** 모드에서 Underscore.js을 실행할 때,`_`변수를 이전의 것에 돌려준다.
  // 그리고 이 Underscore 객체의 참조를 반환한다.
  _.noConflict = function() {
    root._ = previousUnderscore;
    return this;
  };

  // 디폴트의 Iterator 주위의 고유성을 유지하는 함수.
  _.identity = function(value) {
    return value;
  };

  // 함수를 ** n ** 번 실행한다.
  _.times = function(n, iterator, context) {
    var accum = Array(n);
    for (var i = 0; i < n; i++) accum[i] = iterator.call(context, i);
    return accum;
  };

  // min과 max 사이 (min과 max를 후보에 포함)에서 랜덤한 정수 값을 돌려 준다.
  _.random = function(min, max) {
    if (max == null) {
      max = min;
      min = 0;
    }
    return min + (0 | Math.random() * (max - min + 1));
  };

  // 이스케이프를 위한, HTML 엔티티의 리스트
  var entityMap = {
    escape: {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;'
    }
  };
  entityMap.unescape = _.invert(entityMap.escape);

  // 바로 위에 포함되어있는 키와 값을 포함하는 정규식.
  var entityRegexes = {
    escape:   new RegExp('[' + _.keys(entityMap.escape).join('') + ']', 'g'),
    unescape: new RegExp('(' + _.keys(entityMap.unescape).join('|') + ')', 'g')
  };

  // HTML, 또는 HTML에서 문자열을 이스케이프 또는 언이스케이프하여 삽입하기 위한 함수.
  _.each(['escape', 'unescape'], function(method) {
    _[method] = function(string) {
      if (string == null) return '';
      return ('' + string).replace(entityRegexes[method], function(match) {
        return entityMap[method][match];
      });
    };
  });

  // property의 값이 함수이면 그것을 호출, 그렇지 않으면 값 그대로를 돌려 준다.
  _.result = function(object, property) {
    if (object == null) return null;
    var value = object[property];
    return _.isFunction(value) ? value.call(object) : value;
  };

  // Underscore 객체에 자신의 사용자 정의 함수를 추가한다.
  _.mixin = function(obj) {
    each(_.functions(obj), function(name){
      var func = _[name] = obj[name];
      _.prototype[name] = function() {
        var args = [this._wrapped];
        push.apply(args, arguments);
        return result.call(this, func.apply(_, args));
      };
    });
  };

  // 유일한 정수 값의 ID를 생성한다 (클라이언트 세션별로 고유).
  // 임시 DOM에 할당하는 id로서 편리하다.
  var idCounter = 0;
  _.uniqueId = function(prefix) {
    var id = '' + ++idCounter;
    return prefix ? prefix + id : id;
  };

  // 기본적으로 Underscore은 ERB 스타일의 템플릿 구분자를 사용하지만,
  // 다른 템플릿 구분자를 사용하려면 다음의 템플릿 설정을 변경한다.
  _.templateSettings = {
    evaluate    : /<%([\s\S]+?)%>/g,
    interpolate : /<%=([\s\S]+?)%>/g,
    escape      : /<%-([\s\S]+?)%>/g
  };

  // `templateSettings`를 사용자 정의 할 때, 삽입, 평가, 이스케이프 삽입의 정규식을
  // 정의하지 않을 경우는, 일치하지 않는 것을 보증하는 것을 필요로한다.
  var noMatch = /(.)^/;

  // 일부 문자는문자 리터럴에 넣을 수 있도록하기 위해 이스케이프 할 필요가있다.
  var escapes = {
    "'":      "'",
    '\\':     '\\',
    '\r':     'r',
    '\n':     'n',
    '\t':     't',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  var escaper = /\\|'|\r|\n|\t|\u2028|\u2029/g;

  // John Resig의 구현과 비슷한 JavaScript 마이크로 템플레이팅
  // Underscore의 템플레이팅은 임의의 구분자를 제어하여 공백을 유지하고
  // 삽입 된 코드 내 따옴표를 제대로 이스케이프한다.
  _.template = function(text, data, settings) {
    settings = _.defaults({}, settings, _.templateSettings);

    // 구분자를 하나의 정규 표현식에 결합한다.
    var matcher = new RegExp([
      (settings.escape || noMatch).source,
      (settings.interpolate || noMatch).source,
      (settings.evaluate || noMatch).source
    ].join('|') + '|$', 'g');

    // 템플릿 소스를 컴파일하고 문자 리터럴을 적절히 이스케이프한다.
    var index = 0;
    var source = "__p+='";
    text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
      source += text.slice(index, offset)
        .replace(escaper, function(match) { return '\\' + escapes[match]; });

      if (escape) {
        source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
      }
      if (interpolate) {
        source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
      }
      if (evaluate) {
        source += "';\n" + evaluate + "\n__p+='";
      }
      index = offset + match.length;
      return match;
    });
    source += "';\n";

    // 변수가 지정되지 않은 경우 로컬 스코프내의 데이터를 배치한다.
    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

    source = "var __t,__p='',__j=Array.prototype.join," +
      "print=function(){__p+=__j.call(arguments,'');};\n" +
      source + "return __p;\n";

    try {
      var render = new Function(settings.variable || 'obj', '_', source);
    } catch (e) {
      e.source = source;
      throw e;
    }

    if (data) return render(data, _);
    var template = function(data) {
      return render.call(this, data, _);
    };

    // 미리 컴파일의 편의를 위해 컴파일 된 함수의 소스를 제공한다.
    template.source = 'function(' + (settings.variable || 'obj') + '){\n' + source + '}';

    return template;
  };

  // 랩퍼로 위임하는 "chain"함수를 추가한다.
  _.chain = function(obj) {
    return _(obj).chain();
  };

  // OOP
  // ---------------
  // Underscore를 함수로서 부를 경우, 객체 지향 스타일로 사용할 수 있도록 한
  // 래핑 된 개체를 반환한다. 이 랩퍼는 Underscore 모든 함수의
  // 대체 버전을 갖추고있다. 래핑 된 객체는 체인가능하다.

  // 중간 결과를 계속 체이닝 하는 헬퍼함수.
  var result = function(obj) {
    return this._chain ? _(obj).chain() : obj;
  };

  // 랩퍼 객체에 모든 Underscore 함수를 추가한다.
  _.mixin(_);

  // 모든 Array 변경자 함수 (값이나 상태의 변경을 수반하는 함수)를 랩퍼에 추가한다.
  each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      var obj = this._wrapped;
      method.apply(obj, arguments);
      if ((name == 'shift' || name == 'splice') && obj.length === 0) delete obj[0];
      return result.call(this, obj);
    };
  });

  // 모든 Array 접근자 함수를 랩퍼에 추가한다.
  each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      return result.call(this, method.apply(this._wrapped, arguments));
    };
  });

  _.extend(_.prototype, {

    // 래핑 된 Underscore 객체의 체인을 개시한다.
    chain: function() {
      this._chain = true;
      return this;
    },

    // 래핑되고 체인 된 객체에서 결과를 꺼낸다.
    value: function() {
      return this._wrapped;
    }

  });

}).call(this);
